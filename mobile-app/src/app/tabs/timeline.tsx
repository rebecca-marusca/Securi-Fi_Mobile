import { useState, useEffect, useMemo } from "react";
import { colors } from "@/theme/colors";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import AnimatedWaveHeader from "@/components/AnimatedWaveHeader";
import { TimelineEntryCard } from "@/components/TimelineEntryCard";
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

function getNodeDisplayName(nodeId?: string, nodeNameMap?: Record<string, string>): string {
  if (!nodeId) return "";
  return nodeNameMap?.[nodeId] || `Node ${nodeId}`;
}

function mapEventToTimelineEntry(
  event: SecuriFiEvent,
  nodeNameMap: Record<string, string>
): TimelineEntry {
  const date = formatTimelineDate(event.startedAt);

  if (event.type === "nodeStatus") {
    const isTurnedOn = event.nodeAction === "on";
    const nodeName = getNodeDisplayName(event.nodeId, nodeNameMap);
    return {
      id: event.eid,
      type: isTurnedOn ? "nodes_on" : "nodes_off",
      date,
      title: isTurnedOn ? "NODES TURNED ON" : "NODES TURNED OFF",
      description: nodeName ? `${nodeName} turned ${event.nodeAction}.` : undefined,
    };
  }

  // False alarm check (for intrusion, fire, or gas leak)
  if (event.falseAlarm) {
    return {
      id: event.eid,
      type: "false_alarm",
      date,
      title: "FALSE ALARM",
      description:
        typeof event.falseAlarm === "string"
          ? `"${event.falseAlarm}"`
          : "Event was dismissed as a false alarm.",
    };
  }

  if (event.type === "fire") {
    const nodeName = getNodeDisplayName(event.nodeId, nodeNameMap);
    return {
      id: event.eid,
      type: "fire",
      date,
      title: "FIRE / SMOKE DETECTED",
      description: nodeName
        ? `Flame or smoke detected near ${nodeName}.${event.rawReading ? ` (Reading: ${event.rawReading})` : ""}`
        : "Flame or smoke detected by hazard sensors.",
    };
  }

  if (event.type === "gasLeak") {
    const nodeName = getNodeDisplayName(event.nodeId, nodeNameMap);
    return {
      id: event.eid,
      type: "gas_leak",
      date,
      title: "GAS LEAK DETECTED",
      description: nodeName
        ? `Gas concentration detected near ${nodeName}.${event.rawReading ? ` (Reading: ${event.rawReading})` : ""}`
        : "Gas concentration threshold exceeded.",
    };
  }

  if (event.type === "intrusion") {
    const nodeName = event.nodeId ? getNodeDisplayName(event.nodeId, nodeNameMap) : null;
    const locationText = nodeName ? ` near ${nodeName}` : "";
    const prob = event.peakProbability ?? 0;

    if (prob >= 0.7) {
      return {
        id: event.eid,
        type: "break_in",
        date,
        title: "BREAK-IN DETECTED",
        description:
          event.avgProbability !== undefined
            ? `Peak probability: ${(prob * 100).toFixed(0)}%${locationText}. Average probability: ${(event.avgProbability * 100).toFixed(0)}%.`
            : `Break-in detected${locationText} with ${(prob * 100).toFixed(0)}% probability.`,
      };
    }

    return {
      id: event.eid,
      type: "small_movement",
      date,
      title: "SLIGHT MOVEMENT",
      description: `Slight movement detected${locationText} (peak probability: ${(prob * 100).toFixed(0)}%).`,
    };
  }

  return {
    id: (event as any).eid ?? "unknown",
    type: "small_movement",
    date,
    title: "EVENT DETECTED",
  };
}

export default function TimelineScreen() {
  const { hid, isLoading: isHomeLoading } = useHome();
  const [rawEvents, setRawEvents] = useState<SecuriFiEvent[]>([]);
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

  const isLoading = isHomeLoading || isLoadingEvents;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AnimatedWaveHeader />
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : entries.length > 0 ? (
          <>
            {entries.map((entry, index) => (
              <TimelineEntryCard
                key={entry.id}
                entry={entry}
                isLast={index === entries.length - 1}
              />
            ))}
            <View>
              <Text style={styles.endText}>You've reached the end</Text>
            </View>
          </>
        ) : (
          <View>
            <Text style={styles.endText}>
              {!hid ? "No home connected" : "No events recorded yet"}
            </Text>
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
    alignItems: "center"
  },
  scrollContent: {
    paddingTop: 150,
    paddingBottom: 121 /// trust am facut niste matematica foarte smart ca sa ajung la 121 deci pls dont change
  },
  endText: {
    paddingTop: 16,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 13,
    color: colors.textMuted,
    alignSelf: "center",
  },
  loader: {
    marginTop: 40,
  },
});