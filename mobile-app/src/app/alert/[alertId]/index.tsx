import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View, TextInput, Modal } from 'react-native';
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
import { type SecuriFiEvent, normaliseEventType } from '@/types/firestore';
import type { CacheEntry } from '@/types/firestore';
import type { TimelineEntry } from '@/types/timeline';
import { buildPlayByPlayFromPackages, friendlyWarning } from '@/utils/eventDescriptions';
import { subscribeToEventChunks } from '@/services/events';
import type { Chunk } from '@/types/firestore';
import { SymbolView } from 'expo-symbols';
import { requestCacheForHome, subscribeToOnDemandCache } from '@/services/cache';

type ChunkPackage = NonNullable<Chunk['packages']>[number];

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

function formatTimelineTime(timestamp?: any): string {

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

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getAlertTitle(eventType: SecuriFiEvent['eventType']): string {
  switch (normaliseEventType(eventType)) {
    case 'fire':
      return 'FIRE / SMOKE DETECTED';
    case 'gas_leak':
      return 'GAS LEAK DETECTED';
    case 'intrusion':
    default:
      return 'ONGOING INTRUSION';
  }
}

function getAlertStatus(eventType: SecuriFiEvent['eventType'], nodeName?: string): string {
  switch (normaliseEventType(eventType)) {
    case 'fire':
      return nodeName ? `Smoke detected near ${nodeName}` : 'Flame or smoke detected';
    case 'gas_leak':
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
  const [showFalseAlarmModal, setShowFalseAlarmModal] = useState(false);
  const [falseAlarmDescription, setFalseAlarmDescription] = useState("");

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

  // nodeId was written on old event documents but is not part of the current EventDoc model.
  // Access via 'as any' to retain backward-compat with existing Firestore data.
  const eventNodeId: string | undefined = (event as any)?.nodeId;
  const triggeredNodeName = eventNodeId ? nodeNameMap[eventNodeId] : undefined;
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
        color: colors.alertRed,
      }));
    }

    return dbNodes.map((node, index) => {
      const isTriggered = eventNodeId === node.nodeId || eventNodeId === node.id;
      const fallbackPos = defaultPositions[index % defaultPositions.length];
      return {
        id: node.nodeId || node.id || `node-${index}`,
        name: node.nickname || `Node ${index + 1}`,
        x: fallbackPos.x,
        y: fallbackPos.y,
        color: isTriggered ? colors.alertRed : "#a9a7a7",
      };
    });
  }, [dbNodes, eventNodeId]);

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
      "Is this event a false alarm?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "False Alarm",
          style: 'destructive',
          onPress: () => {
            setFalseAlarmDescription(""); 
            setShowFalseAlarmModal(true);
          },
        },
      ]
    );
  };

  const handleFalseAlarmSubmit = async () => {
    const eid = currentAlertId;

    if(!eid) return;

    const description = falseAlarmDescription.trim();

    if(!description) {
      Alert.alert(
        "Description required",
        "Please explain why this was a false alarm."
      );
      return;
    }

    try {
      setIsDismissing(true);
      setShowFalseAlarmModal(false);

      await dismissEvent(eid, description);
    } catch (err) {
        console.error("Failed to dismiss event:", err);

        Alert.alert(
          "Error",
          "Could not dismiss the alert. Please try again."
        );
    } finally {
      setIsDismissing(false);
    }
  }

  useEffect(() => {
    if (!currentAlertId || !eventHomeId) {
      setChunks([]);
      return;
    }
    const unsub = subscribeToEventChunks(eventHomeId, currentAlertId, setChunks);
    return unsub;
  }, [currentAlertId, eventHomeId]);

  // 5. Request a full cache dump from the server and subscribe to the result.
  //    The server writes its in-memory ring buffer to cache/{hid} when
  //    homes/{hid}.requestedCache is set to true. We trigger that on mount
  //    so we capture every second even before event chunks are flushed.
  useEffect(() => {
    if (!eventHomeId) {
      setCacheTail([]);
      return;
    }

    // Trigger the dump asynchronously — fire and forget; listener will catch result.
    requestCacheForHome(eventHomeId).catch((err) =>
      console.warn('[AlertScreen] requestCacheForHome failed:', err)
    );

    const unsub = subscribeToOnDemandCache(eventHomeId, (packages) => {
      setCacheTail(packages ?? []);
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

  // Status pill: most severe warningType from the latest package's nodes record,
  // falling back to the static copy until the first package for this event lands.
  const statusText = useMemo(() => {
    if (latestPackage) {
      const topWarning = Object.values(latestPackage.nodes ?? {})
        .map((r) => r.warningType)
        .find((w) => w != null) ?? null;
      const warning = friendlyWarning(topWarning);
      if (warning) return warning;
    }
    return getAlertStatus(alertType, triggeredNodeName);
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
    eventType: normaliseEventType(alertType),
    date: formatTimelineDate(event?.startedAt) || 'Today',
    title: getAlertTitle(alertType),
    descriptionLines: liveDescriptionLines,
    startTime: undefined,
    endTime: undefined,
    rawStartedAt: event?.startedAt,
  }), [currentAlertId, alertType, event?.startedAt, liveDescriptionLines]);

  return (
    <View style={styles.container}>
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

        <Pressable
          style={styles.activityCard}
          onPress={() => timelineSheetRef.current?.expand()}
          accessibilityRole="button"
          accessibilityLabel="View live alert activity"
        >
          <View style={styles.activityIndicatorColumn}>
            <View style={styles.liveDot} />
          </View>

          <View style={styles.activityTextContainer}>
            <View style={styles.activityTitleRow}>
              <Text style={styles.activityTitle}>Alert Activity</Text>
              <Text style={styles.activityLiveText}>LIVE</Text>
            </View>

            <Text style={styles.activityDescription} numberOfLines={1}>
              {latestPackage
                ? `${statusText} • ${formatTimelineTime(latestPackage.timestamp)}`
                : "Waiting for real-time events..."}
            </Text>
          </View>

          <SymbolView
            name="chevron.right"
            size={16}
            tintColor={colors.text}
          />
        </Pressable>

        <Pressable style={styles.buttonEmergency} onPress={handleCallEmergency}>

          <View style={styles.emergencyButtonContent}>
            <SymbolView
              name="phone.fill"
              size={20}
              tintColor= {colors.base}
            />
            <Text style={styles.emergencyText}>Emergency Call</Text>
          </View>

        </Pressable>

        <Pressable
          style={styles.buttonD}
          onPress={handleDismiss}
          disabled={isDismissing}
        >
          {isDismissing ? (
            <ActivityIndicator size="small" color={colors.alertRed} />
          ) : (
            <Text style={styles.buttonDismissText}>False alarm? Dismiss</Text>
          )}
        </Pressable>

        <Modal 
          visible={showFalseAlarmModal} 
          transparent animationType="fade" 
          onRequestClose={() => setShowFalseAlarmModal(false)}
        > 
          <View style={styles.modalOverlay}> 
            <View style={styles.modalContainer}> 
              <Text style={styles.modalTitle}>False Alarm Description</Text>
              
              <Text style={styles.modalDescription}>Why was this a false alarm?</Text> 
              
              <TextInput 
                value={falseAlarmDescription} 
                onChangeText={setFalseAlarmDescription} 
                placeholder="Enter a reason..." 
                placeholderTextColor="#888" 
                multiline textAlignVertical="top" 
                style={styles.descriptionInput} 
                maxLength={500} 
              /> 
              
              <View style={styles.modalButtons}>
                <Pressable 
                  onPress={() => setShowFalseAlarmModal(false)}
                  style={styles.modalCancelButton}
                > 
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable> 
                
                <Pressable 
                  onPress={handleFalseAlarmSubmit}
                  disabled={isDismissing} 
                  style={styles.modalSubmitButton} 
                > 
                  {isDismissing ? (
                    <ActivityIndicator size="small" color={colors.base} /> 
                  ) : ( 
                    <Text style={styles.modalSubmitText}>Submit</Text>
                  )}
                  </Pressable> 
                </View> 
              </View> 
            </View> 
          </Modal>

      </View>
    </View>
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
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 30,
    fontFamily: "SF-Pro-Text-Bold",
    color: colors.redWave3,
    marginTop: 24,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonEmergency: {
    backgroundColor: colors.alertRed,
    width: "65%",
    height: 50,
    borderRadius: 100,
    marginTop: 24,
    justifyContent: "center",
    overflow: 'hidden',
  },
  buttonLive: {
    backgroundColor: colors.base,
    borderColor: colors.accent,
    borderWidth: 1,
    width: 130,
    height: 50,
    borderRadius: 15,
    marginTop: 36,
    justifyContent: "center",
    overflow: 'hidden',
  },
  buttonD: {
    marginTop: 20,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  buttonDismissText: {
    color: colors.text,
    textDecorationLine: 'underline',
    alignSelf: "center",
    fontFamily: "SF-Pro-Text-Medium",
    fontSize: 13,
  },
  emergencyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  liveFeedButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyText: {
    color: colors.base,
    alignSelf: "center",
    fontFamily: "SF-Pro-Text-Bold",
    paddingLeft: 7,
    paddingRight: 7,
    fontSize: 20,
  },
  liveFeedText: {
    color: colors.accent,
    alignSelf: "center",
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 15,
    paddingLeft: 5,
    paddingRight: 2
  },
  statusText: {
    color: colors.redWave3,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 15,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
  }, 
  modalContainer: { 
    width: '100%', 
    backgroundColor: colors.base, 
    borderRadius: 20, 
    padding: 24, 
  }, 
  modalTitle: { 
    fontFamily: "SF-Pro-Text-Bold", 
    fontSize: 22, 
    color: colors.text, 
    marginBottom: 8, 
  }, 
  modalDescription: { 
    fontFamily: "SF-Pro-Text-Regular", 
    fontSize: 15, 
    color: colors.text, 
    opacity: 0.7, 
    marginBottom: 16, 
  }, 
  descriptionInput: { 
    minHeight: 110, 
    borderWidth: 1, 
    borderColor: colors.intermediate, 
    borderRadius: 12, 
    padding: 14, 
    fontFamily: "SF-Pro-Text-Regular", 
    fontSize: 15, 
    color: colors.text, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
  }, 
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    marginTop: 20, 
    gap: 12, 
  }, 
  modalCancelButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
  }, 
  modalCancelText: { 
    fontFamily: "SF-Pro-Text-Semibold", 
    fontSize: 15, 
    color: colors.text, 
  }, 
  modalSubmitButton: { 
    backgroundColor: colors.textMuted, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 12, 
    minWidth: 80, 
    alignItems: 'center', 
  }, 
  modalSubmitText: { 
    fontFamily: "SF-Pro-Text-Bold", 
    fontSize: 15, 
    color: colors.base, 
  },
  activityCard: {
    width: "90%",
    minHeight: 68,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(50, 50, 50, 0.28)",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    flexDirection: "row",
    alignItems: "center",
  },
  activityIndicatorColumn: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.alertRed,
  },
  activityTextContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityTitle: {
    color: colors.text,
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 16,
  },
  activityLiveText: {
    color: colors.alertRed,
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 11,
    letterSpacing: 0.8,
  },
  activityDescription: {
    color: colors.text,
    opacity: 0.68,
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 12,
    marginTop: 3,
  },
});
