import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet from "@gorhom/bottom-sheet";
import { doc, getFirestore, onSnapshot } from "@react-native-firebase/firestore";
import AnimatedWaveHeader from '@/components/AnimatedWaveHeader';
import { RoomNodeMapEmergency } from '@/components/homepage-map/RoomNodeMap';
import { TimelineSheet } from '@/components/TimelineSheet';
import { useActiveAlert } from '@/contexts/AlertContext';
import { useHome } from '@/hooks/useHome';
import { dismissEvent } from '@/services/events';
import { subscribeToNodesForHome, type FirestoreNode } from '@/services/nodes';
import { colors } from '@/theme/colors';
import type { SecuriFiEvent } from '@/types/firestore';
import type { TimelineEntry } from '@/types/timeline';
import {
  buildPlayByPlayFromPackages,
  friendlyWarning,
} from '@/utils/eventDescriptions';
import { subscribeToEventChunks } from '@/services/events';
import { subscribeToHomeCache } from '@/services/cache';
import type { Chunk, ChunkPackage } from '@/types/firestore';

function formatTimelineDate(timestamp?: any): string {
  if (!timestamp) return "";
  let date: Date;
  if (typeof timestamp?.toDate === "function") {
    date = timestamp.toDate();
  } else if (typeof timestamp?.seconds === "number") {
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

function getAlertTitle(eventType: SecuriFiEvent['eventType']): string {
  switch (eventType) {
    case 'fire':
      return 'FIRE / SMOKE DETECTED';
    case 'gasLeak':
      return 'GAS LEAK DETECTED';
    case 'intrusion':
    default:
      return 'ONGOING INTRUSION';
  }
}

function getAlertStatus(eventType: SecuriFiEvent['eventType'], nodeName?: string): string {
  switch (eventType) {
    case 'fire':
      return nodeName ? `Smoke detected near ${nodeName}` : 'Flame or smoke detected';
    case 'gasLeak':
      return nodeName ? `Gas concentration near ${nodeName}` : 'Gas concentration threshold exceeded';
    case 'intrusion':
    default:
      return nodeName ? `Movement detected near ${nodeName}` : 'Movement detected';
  }
}

export default function AlertScreen() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const { activeAlert } = useActiveAlert();
  const { hid } = useHome();

  const currentAlertId = alertId || activeAlert?.alertId;
  const eventHomeId = activeAlert?.hid ?? hid;
  const [event, setEvent] = useState<SecuriFiEvent | null>(activeAlert?.event ?? null);
  const [dbNodes, setDbNodes] = useState<FirestoreNode[]>([]);
  const [isDismissing, setIsDismissing] = useState(false);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [cacheTail, setCacheTail] = useState<ChunkPackage[]>([]);

  const timelineSheetRef = useRef<BottomSheet>(null);

  // 1. Subscribe to active event document in real-time
  useEffect(() => {
    if (!currentAlertId || !eventHomeId) return;

    const eventDocRef = doc(
      getFirestore(),
      'home_events',
      eventHomeId,
      'events',
      currentAlertId
    );
    const unsub = onSnapshot(
      eventDocRef,
      (snap) => {
        if (snap.exists()) {
          setEvent({ eid: snap.id, ...(snap.data() as any) });
        }
      },
      (err) => console.error('[AlertScreen] Event listener error:', err)
    );

    return unsub;
  }, [currentAlertId, eventHomeId]);

  // 2. Subscribe to home's nodes for real-time nickname and positions
  useEffect(() => {
    if (!hid) return;
    const unsub = subscribeToNodesForHome(hid, setDbNodes);
    return unsub;
  }, [hid]);

  // 3. Node lookup map
  const nodeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const node of dbNodes) {
      const id = node.nodeId || node.id;
      if (id && node.nickname) {
        map[id] = node.nickname;
      }
    }
    return map;
  }, [dbNodes]);

  const triggeredNodeName = event?.nodeId ? nodeNameMap[event.nodeId] : undefined;
  const alertType: SecuriFiEvent['eventType'] = event?.eventType ?? 'intrusion';

  // 4. Build nodes for the emergency map
  const emergencyNodes = useMemo(() => {
    const defaultPositions = [
      { id: 'kitchen', name: 'Kitchen', x: 0.28, y: 0.45 },
      { id: 'living-room', name: 'Living room', x: 0.72, y: 0.28 },
      { id: 'bedroom', name: 'Bedroom', x: 0.58, y: 0.75 },
    ];

    if (dbNodes.length === 0) {
      return defaultPositions.map((node) => ({
        ...node,
        color: colors.redWave3,
      }));
    }

    return dbNodes.map((node, index) => {
      const isTriggered = event?.nodeId === node.nodeId || event?.nodeId === node.id;
      const fallbackPos = defaultPositions[index % defaultPositions.length];
      return {
        id: node.nodeId || node.id || `node-${index}`,
        name: node.nickname || `Node ${index + 1}`,
        x: fallbackPos.x,
        y: fallbackPos.y,
        color: isTriggered ? colors.redWave1 : colors.redWave3,
      };
    });
  }, [dbNodes, event?.nodeId]);

  // 5. Build timeline entry for the sheet
  const timelineEntry: TimelineEntry | null = useMemo(() => {
    if (!event && !currentAlertId) return null;
    const date = formatTimelineDate(event?.startedAt);
    const title = getAlertTitle(alertType);
    const location = triggeredNodeName ? ` near ${triggeredNodeName}` : '';
    return {
      id: event?.eid ?? currentAlertId ?? 'active-alert',
      eventType: alertType === 'fire' ? 'fire' : alertType === 'gasLeak' ? 'gas_leak' : 'intrusion',
      date: date || 'Today',
      title,
      description: `Emergency alert triggered${location}. All linked users have been notified.`,
    };
  }, [event, currentAlertId, alertType, triggeredNodeName]);

  // --- HANDLERS ---
  const handleCallEmergency = () => {
    Alert.alert(
      "Emergency Services",
      "Call emergency services (112)?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          style: "destructive",
          // onPress: () => {
          //   Linking.openURL("tel:112").catch((err) =>
          //     Alert.alert("Error", "Could not open dialer: " + err.message)
          //   );
          // },
        },
      ]
    );
  };

  const handleDismiss = () => {
    const eid = currentAlertId;
    if (!eid) return;

    Alert.alert(
      "Dismiss Alert",
      "Has this situation been resolved or was it a false alarm?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "False Alarm",
          onPress: async () => {
            try {
              setIsDismissing(true);
              await dismissEvent(eid, "False alarm");
            } catch (err) {
              console.error("Failed to dismiss event:", err);
              Alert.alert("Error", "Could not dismiss the alert. Please try again.");
            } finally {
              setIsDismissing(false);
            }
          },
        },
        {
          text: "Resolved",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDismissing(true);
              await dismissEvent(eid);
            } catch (err) {
              console.error("Failed to dismiss event:", err);
              Alert.alert("Error", "Could not dismiss the alert. Please try again.");
            } finally {
              setIsDismissing(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!currentAlertId || !eventHomeId) {
      setChunks([]);
      return;
    }
    const unsub = subscribeToEventChunks(eventHomeId, currentAlertId, setChunks);
    return unsub;
  }, [currentAlertId, eventHomeId]);

  useEffect(() => {
    if (!eventHomeId) {
      setCacheTail([]);
      return;
    }
    const unsub = subscribeToHomeCache(eventHomeId, (cache) => {
      setCacheTail(cache?.packages ?? []);
    });
    return unsub;
  }, [eventHomeId]);

  // Flushed history + whatever hasn't flushed yet, in one stream
  const livePackages = useMemo(() => {
    const flushed = chunks.flatMap((chunk) => chunk.packages ?? []);
    return [...flushed, ...cacheTail];
  }, [chunks, cacheTail]);

  const latestPackage = useMemo(() => {
    if (!livePackages.length) return undefined;
    return [...livePackages].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }, [livePackages]);

  // Status pill: latest package's warning type, falling back to the
  // static copy until the first package for this event lands
  const statusText = useMemo(() => {
    const warning = latestPackage
      ? friendlyWarning(latestPackage.warningType ?? latestPackage.warning_type)
      : null;
    return warning ?? getAlertStatus(alertType, triggeredNodeName);
  }, [latestPackage, alertType, triggeredNodeName]);

  const liveDescriptionLines = useMemo(
    () => buildPlayByPlayFromPackages(livePackages, nodeNameMap),
    [livePackages, nodeNameMap]
  );

  // Same shape TimelineEntryCard already renders for finished events —
  // just descriptionLines only, no status/reason lines, since this event
  // hasn't been dismissed yet.
  const liveEntry: TimelineEntry = useMemo(() => ({
    id: currentAlertId ?? 'active-alert',
    eventType: alertType === 'fire' ? 'fire' : alertType === 'gasLeak' ? 'gas_leak' : 'intrusion',
    date: formatTimelineDate(event?.startedAt) || 'Today',
    title: getAlertTitle(alertType),
    descriptionLines: liveDescriptionLines,
    startTime: undefined,
    endTime: undefined,
    rawStartedAt: event?.startedAt,
  }), [currentAlertId, alertType, event?.startedAt, liveDescriptionLines]);

  return (
    <ScrollView style={styles.container}>
      <AnimatedWaveHeader
        color1={colors.redWave1}
        color2={colors.redWave2}
        color3={colors.redWave3}
      />

      <View style={styles.content}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.subtitle}>{getAlertTitle(alertType)}</Text>
        </View>

        <RoomNodeMapEmergency initialNodes={emergencyNodes} hid={eventHomeId} />

        <View style={styles.statusPill}>
          <LinearGradient
            colors={["rgba(33, 2, 2, 0.25)", "transparent"]}
            style={styles.innerShadowGradient}
          />
          <Text style={styles.statusText}>
            {statusText}
          </Text> 
        </View>

        <Pressable style={styles.buttonE} onPress={handleCallEmergency}>
          <LinearGradient
            colors={["rgba(33, 2, 2, 0.25)", "transparent"]}
            style={styles.innerShadowGradient}
          />
          <Text style={styles.buttonText}>CALL EMERGENCY</Text>
        </Pressable>

        <Pressable
          style={styles.buttonT}
          onPress={() => timelineSheetRef.current?.expand()}
        >
          <LinearGradient
            colors={["rgba(2, 33, 23, 0.25)", "transparent"]}
            style={styles.innerShadowGradient}
          />
          <Text style={styles.buttonText}>TIMELINE</Text>
        </Pressable>

        <Pressable
          style={styles.buttonD}
          onPress={handleDismiss}
          disabled={isDismissing}
        >
          {isDismissing ? (
            <ActivityIndicator size="small" color={colors.redWave1} />
          ) : (
            <Text style={styles.buttonDismissText}>False alarm? Dismiss</Text>
          )}
        </Pressable>

        <TimelineSheet ref={timelineSheetRef} entry={liveEntry} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 125,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 27,
    fontFamily: "SF-Pro-Text-Bold",
    color: colors.redWave1,
    marginTop: 35,
    textAlign: "center",
  },
  statusPill: {
    backgroundColor: colors.redWave1,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: -3,
    overflow: 'hidden',
  },
  buttonE: {
    backgroundColor: colors.redWave1,
    width: 320,
    height: 60,
    borderRadius: 1000,
    marginTop: 24,
    justifyContent: "center",
    overflow: 'hidden',
  },
  buttonT: {
    backgroundColor: colors.textMuted,
    width: 320,
    height: 50,
    borderRadius: 1000,
    marginTop: 12,
    justifyContent: "center",
    overflow: 'hidden',
  },
  buttonD: {
    marginTop: 24,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  buttonDismissText: {
    color: colors.text,
    textDecorationLine: 'underline',
    alignSelf: "center",
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 13,
  },
  buttonText: {
    color: colors.base,
    alignSelf: "center",
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 15,
  },
  statusText: {
    color: colors.base,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 15,
  },
  innerShadowGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10,
  },
});
