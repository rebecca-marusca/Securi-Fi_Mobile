import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import AnimatedWaveHeader from '../../components/AnimatedWaveHeader';
import { colors } from "@/theme/colors";
import RoomNodeGraph from '@/components/RoomNodeGraph';
import { LinearGradient } from "expo-linear-gradient";
import { useUserProfile } from "@/hooks/useUserProfile";
import { FinalToggleRow } from "@/components/ToggleRow";
import { useHome } from "@/hooks/useHome";
import { armHome, disarmHome } from "@/services/homes";
import { subscribeToNodesForHome, type FirestoreNode } from "@/services/nodes";
import { RoomNode } from '@/services/userProfile';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour <= 5) return "Hello";
  if (hour > 5 && hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Derives a human-readable status line from the live node list.
 * - If no nodes: "No device connected"
 * - If there is an active event: "Alert active"
 * - If all nodes' requestedArmed === armed (stable): "Armed" / "Disarmed"
 * - Otherwise (pending confirmation): "Arming…" / "Disarming…"
 */
function getStatusText(
  home: ReturnType<typeof useHome>['home'],
  nodes: FirestoreNode[]
): string {
  if (!home) return "No device connected";
  if (home.activeEventId) return "Alert active";

  if (nodes.length === 0) return "No device connected";

  const allArmed = nodes.every((n) => n.armed);
  const allRequestedArmed = nodes.every((n) => n.requestedArmed);
  const noneRequestedArmed = nodes.every((n) => !n.requestedArmed);

  // Stable armed state
  if (allArmed && allRequestedArmed) return "No movement detected";
  if (!allArmed && noneRequestedArmed) return "System disarmed";

  // Transitional state (waiting for hardware confirmation)
  if (allRequestedArmed) return "Arming…";
  if (noneRequestedArmed) return "Disarming…";

  return "Partially armed";
}

const HomeScreen: React.FC = () => {
  const { profile } = useUserProfile();
  const { home, hid, isLoading } = useHome();
  const [greeting, setGreeting] = useState(getGreeting());
  const [dbNodes, setDbNodes] = useState<FirestoreNode[]>([]);

  // Subscribe to home's nodes from database for real-time nickname + armed updates
  useEffect(() => {
    if (!hid) return;
    const unsub = subscribeToNodesForHome(hid, setDbNodes);
    return unsub;
  }, [hid]);

  const formattedNodes: RoomNode[] = useMemo(() => {
    if (dbNodes.length === 0) return [];
    const defaultPositions = [
      { x: 0.28, y: 0.45 },
      { x: 0.72, y: 0.28 },
      { x: 0.58, y: 0.75 },
    ];
    return dbNodes.map((node, index) => ({
      id: node.nodeId || node.id || `node-${index}`,
      name: node.nickname || `Node ${index + 1}`,
      x: defaultPositions[index % defaultPositions.length].x,
      y: defaultPositions[index % defaultPositions.length].y,
    }));
  }, [dbNodes]);

  // Derive the optimistic armed state from nodes: all nodes requestedArmed → true.
  // Falls back to false when there are no nodes yet.
  const derivedRequestedArmed = dbNodes.length > 0 && dbNodes.every((n) => n.requestedArmed);

  // Optimistic local toggle state — reflects tap immediately, reconciles with
  // Firestore listener once nodes update. Rolls back on request failure.
  const [optimisticArmed, setOptimisticArmed] = useState(false);

  useEffect(() => {
    setOptimisticArmed(derivedRequestedArmed);
  }, [derivedRequestedArmed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (value: boolean) => {
    if (!hid) return;
    setOptimisticArmed(value); // reflect immediately
    try {
      if (value) {
        await armHome(hid);
      } else {
        await disarmHome(hid);
      }
      // No further local update needed — subscribeToNodesForHome listener
      // will push the real requestedArmed value once Firestore updates.
    } catch (err) {
      console.error('Failed to toggle armed state:', err);
      setOptimisticArmed(!value); // roll back
      Alert.alert('Error', 'Could not update the system state. Please try again.');
    }
  };


  return (
    <View style={styles.container}>
      <AnimatedWaveHeader 
        color1={colors.greenWave1}
        color2={colors.greenWave2}
        color3={colors.greenWave3}
      />
      <View style={styles.content}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.subtitle}>{greeting}, {profile?.displayName}! </Text>
        </View>

        <RoomNodeGraph
          nodes={formattedNodes.length > 0 ? formattedNodes : undefined}
          initialNodes={[
            { id: 'kitchen', name: 'kitchen', x: 0.28, y: 0.45 },
            { id: 'living-room', name: 'living room', x: 0.72, y: 0.28 },
            { id: 'bedroom', name: 'bedroom', x: 0.58, y: 0.75 },
          ]}
        />

        <View style={styles.statusPill}>
          <LinearGradient
            colors={["rgba(5, 33, 2, 0.25)", "transparent"]}
            style={styles.innerShadowGradient}
          />
          <Text style={styles.statusText}>
            {isLoading ? "Loading…" : getStatusText(home, dbNodes)}
          </Text>
        </View>

        <FinalToggleRow
          label={optimisticArmed ? "Armed" : "Disarmed"}
          value={optimisticArmed}
          onValueChange={handleToggle}
          disabled={!hid || isLoading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base },
  content: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 100 },
  headerTextContainer: { alignItems: 'center', marginBottom: 30, zIndex: 10 },
  subtitle: { fontSize: 20, fontFamily: "SF-Pro-Text-Semibold", color: colors.accent, marginTop: 70 },
  dashboardCard: {
    width: '100%',
    height: 320,
    backgroundColor: colors.bgSecondary2,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPlaceholderText: { color: colors.accent, fontFamily: "SF-Pro-Text-Semibold" },
  statusPill: {
    backgroundColor: 'rgb(64, 144, 79)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: -3,
  },
  statusText: { color: colors.base, fontFamily: "SF-Pro-Text-Semibold", fontSize: 15 },
  innerShadowGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
});

export default HomeScreen;