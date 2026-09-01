import { useState, useEffect, useMemo } from "react";
import { colors } from "@/theme/colors";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import AnimatedWaveHeader from "@/components/AnimatedWaveHeader";
import { TimelineEntryCard } from "@/components/TimelineEntryCard";
import {
  TimelineFilter,
  emptyFilterMessage,
  entryMatchesFilter,
  type TimelineFilterId,
} from "@/components/TimelineFilter";
import type { TimelineEntry } from "@/types/timeline";
import type { SecuriFiEvent } from "@/types/firestore";
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

function getEventCategory(entry: TimelineEntry): TimelineFilterId[] {
  if (["fire", "gas_leak", "break_in"].includes(entry.type)) {
    return ["all", "hazards"];
  }
  if (["nodes_on", "nodes_off"].includes(entry.type)) {
    return ["all", "nodes"];
  }
  if (["false_alarm"].includes(entry.type)) {
    return ["all", "false_alarms"];
  }
  return ["all"];
}

function mapEventToTimelineEntry(
  event: SecuriFiEvent,
  nodeNameMap: Record<string, string>
): TimelineEntry {
  const date = formatTimelineDate(event.startedAt);
  const startTime = formatTimelineTime(event.startedAt);
  const endTime = event.type !== "nodeStatus" && (event as any).endedAt ? formatTimelineTime((event as any).endedAt) : undefined;

  if (event.type === "nodeStatus") {
    const isTurnedOn = event.nodeAction === "on";
    const nodeName = getNodeDisplayName(event.nodeId, nodeNameMap);
    return {
      id: event.eid,
      type: isTurnedOn ? "nodes_on" : "nodes_off",
      date,
      title: isTurnedOn ? "Nodes turned on" : "Nodes turned off",
      description: nodeName ? `${nodeName} turned ${event.nodeAction}.` : undefined,
      startTime,
      rawStartedAt: event.startedAt,
    };
  }

  // False alarm check (for intrusion, fire, or gas leak)
  if (event.falseAlarm) {
    return {
      id: event.eid,
      type: "false_alarm",
      date,
      title: "False alarm",
      description:
        typeof event.falseAlarm === "string"
          ? `"${event.falseAlarm}"`
          : "Event was dismissed as a false alarm.",
      startTime,
      endTime,
      rawStartedAt: event.startedAt,
    };
  }

  if (event.type === "fire") {
    const nodeName = getNodeDisplayName(event.nodeId, nodeNameMap);
    return {
      id: event.eid,
      type: "fire",
      date,
      title: "Fire detection",
      description: nodeName
        ? `Flame or smoke detected near ${nodeName}.${event.rawReading ? ` (Reading: ${event.rawReading})` : ""}`
        : "Flame or smoke detected by hazard sensors.",
      startTime,
      endTime,
      rawStartedAt: event.startedAt,
    };
  }

  if (event.type === "gasLeak") {
    const nodeName = getNodeDisplayName(event.nodeId, nodeNameMap);
    return {
      id: event.eid,
      type: "gas_leak",
      date,
      title: "Gas leak detection",
      description: nodeName
        ? `Gas concentration detected near ${nodeName}`
        : "Gas concentration threshold exceeded.",
      startTime,
      endTime,
      rawStartedAt: event.startedAt,
    };
  }

  if (event.type === "intrusion") {
    const nodeName = event.nodeId ? getNodeDisplayName(event.nodeId, nodeNameMap) : null;

    return {
      id: event.eid,
      type: "break_in",
      date,
      title: "Break-in",
      description: `There was a break-in detected in your home, detection starting at ${startTime} and ending at ${endTime}.`,
      startTime,
      endTime,
      rawStartedAt: event.startedAt,
    };
  }

  // Fallback for unhandled cases
  return {
    id: (event as any).eid ?? "unknown",
    type: "break_in",
    date,
    title: "Unknown Event",
    startTime,
    endTime,
    rawStartedAt: event.startedAt,
  };
}

const NO_DATE_LABELS = new Set(["Today", "Yesterday"]);

export default function TimelineScreen() {
  const { hid, isLoading: isHomeLoading } = useHome();
  const [rawEvents, setRawEvents] = useState<SecuriFiEvent[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [filter, setFilter] = useState<TimelineFilterId>("all");

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

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => entryMatchesFilter(entry.type, filter));
  }, [entries, filter]);

  // Group filtered entries by relative date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, TimelineEntry[]> = {};
    for (const entry of filteredEntries) {
      const label = getRelativeDateLabel(entry.rawStartedAt);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(entry);
    }
    return groups;
  }, [filteredEntries]);

  // Order groups by date (Today first, then Yesterday, etc.)
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "This Year", "Earlier"];
  const sortedGroupLabels = Object.keys(groupedEntries).sort(
    (a, b) => groupOrder.indexOf(a) - groupOrder.indexOf(b)
  );

  const isLoading = isHomeLoading || isLoadingEvents;

  return (
    <View style={styles.container}>
      <AnimatedWaveHeader
        color1={colors.greenWave1}
        color2={colors.greenWave2}
        color3={colors.greenWave3}
      />
      <View style={styles.filterSlot}>
        <TimelineFilter value={filter} onChange={setFilter} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : filteredEntries.length > 0 ? (
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
            <Text style={styles.endText}>{emptyFilterMessage(filter, !!hid)}</Text>
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
  filterSlot: {
    paddingTop: 130,
  },
  scrollContent: {
    paddingBottom: 121,
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