import { useState, useEffect, useMemo } from "react";
import { colors } from "@/theme/colors";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import AnimatedWaveHeader from "@/components/AnimatedWaveHeader";
import { TimelineEntryCard } from "@/components/TimelineEntryCard";
import type { TimelineDescriptionLine, TimelineEntry } from "@/types/timeline";
import type { Chunk, ChunkPackage, SecuriFiEvent } from "@/types/firestore";
import { useHome } from "@/hooks/useHome";
import { subscribeToTimeline } from "@/services/events";
import { subscribeToNodesForHome } from "@/services/nodes";

function formatTimelineDate(timestamp?: any): string {
  if (!timestamp) return "";
  let date: Date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
  
function formatTimelineDateShort(timestamp?: any): string {
  if (!timestamp) return "";
  let date: Date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

function formatTimelineTime(timestamp?: any): string {
  if (!timestamp) return "";
  let date: Date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return "";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getNodeDisplayName(nodeId?: string, nodeNameMap?: Record<string, string>): string {
  if (!nodeId) return "";
  return nodeNameMap?.[nodeId] || `Node ${nodeId}`;
}

function getRelativeDateLabel(timestamp?: any): string {
  if (!timestamp) return "";
  let date: Date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);

  const timeDiff = today.getTime() - eventDate.getTime();
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

  if (daysDiff === 0) {
    return "Today";
  } else if (daysDiff === 1) {
    return "Yesterday";
  } else if (daysDiff < 7) {
    return "This Week";
  } else if (daysDiff < 30) {
    return "This Month";
  } else if (daysDiff < 365) {
    return "This Year";
  } else {
    return "Earlier";
  }
}

function formatPackageTime(timestamp?: string): string {
  if (!timestamp) return "Time unavailable";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function friendlyWarning(warning?: string | null): string | null {
  if (!warning) return null;
  return warning.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bold(text: string): TimelineDescriptionLine["parts"][number] {
  return { text, bold: true };
}

function text(text: string): TimelineDescriptionLine["parts"][number] {
  return { text };
}

function describeNodeReading(node: ChunkPackage["nodes"][number], nodeNameMap: Record<string, string>): TimelineDescriptionLine["parts"] | null {
  const nodeName = getNodeDisplayName(node.nodeId, nodeNameMap);

  if (node.sensors?.flame) return [bold(nodeName), text(" detected "), bold("flame or smoke"), text(".\n")];
  if (node.sensors?.gas) return [bold(nodeName), text(" detected "), bold("gas"), text(".\n")];
  if (node.isAlarm) return [bold(nodeName), text(" reported an "), bold("alarm"), text(".\n")];
  if (node.movementPct > 0) {
    return [bold(nodeName), text(" registered "), bold(`${node.movementPct}%`), text(` movement`), text(".\n")];
  }
  return null;
}

function describePackage(pkg: ChunkPackage, nodeNameMap: Record<string, string>): TimelineDescriptionLine {
  const observations: TimelineDescriptionLine["parts"][] = [];
  const warning = friendlyWarning(pkg.warningType ?? pkg.warning_type);

  for (const node of pkg.nodes ?? []) {
    const observation = describeNodeReading(node, nodeNameMap);
    if (observation) observations.push(observation);
  }

  return {
    parts: [
      bold(formatPackageTime(pkg.timestamp)),
      text("  "),
      ...(warning ? [bold(warning), bold(":\n")] : []),
      ...(observations.length
        ? observations.flatMap((observation, index) => [
            ...observation,
          ])
        : [text("Sensors continued monitoring.")]),
    ],
  };
}

type TimelineEvent = SecuriFiEvent & { chunks: Chunk[] };

function buildPlayByPlay(
  event: TimelineEvent,
  nodeNameMap: Record<string, string>
): TimelineDescriptionLine[] {
  const packages = event.chunks
    .flatMap((chunk) => chunk.packages ?? [])
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (!packages.length) {
    return [{ parts: [text("No sensor samples were saved for this event.")] }];
  }

  return packages.map((pkg) => describePackage(pkg, nodeNameMap));
}

function eventTypeDetails(eventType: SecuriFiEvent["eventType"]): Pick<TimelineEntry, "eventType" | "title"> {
  switch (eventType) {
    case "fire":
      return { eventType: "fire", title: "Fire detection" };
    case "gasLeak":
      return { eventType: "gas_leak", title: "Gas leak detection" };
    case "intrusion":
      return { eventType: "intrusion", title: "Intrusion" };
  }
}

function mapEventToTimelineEntry(
  event: TimelineEvent,
  nodeNameMap: Record<string, string>
): TimelineEntry {
  const date = formatTimelineDate(event.startedAt);
  const startTime = formatTimelineTime(event.startedAt);
  const endTime = (event as any).endedAt ? formatTimelineTime((event as any).endedAt) : undefined;

  const typeDetails = eventTypeDetails(event.eventType);
  const isFalseAlarm = event.falseAlarm === true || typeof event.falseAlarm === "string";
  const status = [isFalseAlarm && "False alarm"].filter(Boolean).join(", ");
  const descriptionLines: TimelineDescriptionLine[] = [];

  if (status) {
    descriptionLines.push({
      parts: [bold("Status: "), text(status)],
    });
  }

  if (typeof event.falseAlarm === "string" && event.falseAlarm.trim()) {
    descriptionLines.push({
      parts: [bold("Reason: "), text(event.falseAlarm.trim())],
    });
  } else if (isFalseAlarm) {
    descriptionLines.push({
      parts: [bold("Reason: "), text("Marked as a false alarm.")],
    });
  }

  //descriptionLines.push({ parts: [bold("Play-by-play")] });
  descriptionLines.push(...buildPlayByPlay(event, nodeNameMap));

  return {
    id: event.eid,
    eventType: typeDetails.eventType,
    date,
    title: status ? `${typeDetails.title} — ${status}` : typeDetails.title,
    descriptionLines,
    startTime,
    endTime,
    rawStartedAt: event.startedAt,
  };
}

const NO_DATE_LABELS = new Set(["Today", "Yesterday"]);

export default function TimelineScreen() {
  const { hid, isLoading: isHomeLoading } = useHome();
  const [rawEvents, setRawEvents] = useState<TimelineEvent[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Subscribe to home's nodes for real-time nickname resolution
  useEffect(() => {
    if (!hid) {
      setNodes([]);
      return;
    }
    const unsubscribe = subscribeToNodesForHome(hid, setNodes);
    return unsubscribe;
  }, [hid]);

  // Subscribe to home's timeline events
  useEffect(() => {
    if (!hid) {
      setRawEvents([]);
      setIsLoadingEvents(false);
      return;
    }

    setIsLoadingEvents(true);
    const unsubscribe = subscribeToTimeline(hid, (events) => {
      setRawEvents(events);
      setIsLoadingEvents(false);
    });

    return unsubscribe;
  }, [hid]);

  // Build lookup map for nodeId -> nickname
  const nodeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const node of nodes) {
      const id = node.nodeId || node.id;
      const name = node.nickname || node.name;
      if (id && name) {
        map[id] = name;
      }
    }
    return map;
  }, [nodes]);

  // Map events with latest node nicknames
  const entries = useMemo(() => {
    return rawEvents.map((event) => mapEventToTimelineEntry(event, nodeNameMap));
  }, [rawEvents, nodeNameMap]);

  // Group entries by relative date.
  const groupedEntries = useMemo(() => {
    const groups: Record<string, TimelineEntry[]> = {};
    for (const entry of entries) {
      const label = getRelativeDateLabel(entry.rawStartedAt);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(entry);
    }
    return groups;
  }, [entries]);

  // Order groups by date (Today first, then Yesterday, etc.)
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "This Year", "Earlier"];
  const sortedGroupLabels = Object.keys(groupedEntries).sort(
    (a, b) => groupOrder.indexOf(a) - groupOrder.indexOf(b)
  );

  const isLoading = isHomeLoading || isLoadingEvents;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <AnimatedWaveHeader
        color1={colors.greenWave1}
        color2={colors.greenWave2}
        color3={colors.greenWave3}
        />
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : entries.length > 0 ? (
          <>
            {sortedGroupLabels.map((label, labelIndex) => {
              const groupEntries = groupedEntries[label];
              const isLastGroup = labelIndex === sortedGroupLabels.length - 1;
              const showDate = !NO_DATE_LABELS.has(label);

              return (
                <View key={label}>
                  <Text style={styles.sectionHeader}>{label}</Text>
                  {groupEntries.map((entry, index) => {
                    const isLastInGroup = index === groupEntries.length - 1;
                    const isAbsoluteLast = isLastGroup && isLastInGroup;

                    // Show divider ONLY at the end of a group, unless it's the final entry overall
                    const needsDivider = isLastInGroup && !isAbsoluteLast;

                    const displayEntry = showDate
                      ? {
                        ...entry,
                        date:
                          label === "Earlier"
                            ? entry.date
                            : formatTimelineDateShort(entry.rawStartedAt),
                        }
                      : entry;

                    return (
                      <TimelineEntryCard
                        key={entry.id}
                        entry={displayEntry}
                        isLast={isAbsoluteLast}
                        needsDivider={needsDivider}
                        hideDate={!showDate}
                      />
                    );
                  })}
                </View>
              );
            })}
            <View>
              <Text style={styles.endText}>You've reached the end! Phew. </Text>
            </View>
          </>
        ) : (
          <View>
            <Text style={styles.endText}>{hid ? "No events recorded yet" : "Select a home to view its events"}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingTop: 150,
    paddingBottom: 120,
  },
  endText: {
    paddingTop: 20,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 13,
    color: colors.textMuted,
    alignSelf: "center",
  },
  loader: {
    marginTop: 40,
    alignSelf: "center",
  },
  sectionHeader: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 8,
  },
});
