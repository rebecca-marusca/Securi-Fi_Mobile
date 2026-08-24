import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import AnimatedWaveHeader from '../../components/AnimatedWaveHeader';
import { colors } from "@/theme/colors";
import RoomNodeGraph from '@/components/RoomNodeGraph';
import { LinearGradient } from "expo-linear-gradient";
import { useUserProfile } from "@/hooks/useUserProfile";
import { FinalToggleRow } from "@/components/ToggleRow";
import { useHome } from "@/hooks/useHome";
import { armHome, disarmHome } from "@/services/homes";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour <= 5) return "Hello";
  if (hour > 5 && hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getStatusText(home: ReturnType<typeof useHome>['home']): string {
  if (!home) return "No device connected";
  if (home.activeEventId) return "Alert active";
  if (home.requestedArmed !== home.armed) return home.requestedArmed ? "Arming…" : "Disarming…";
  return home.armed ? "No movement detected" : "System disarmed";
}

const HomeScreen: React.FC = () => {
  const { profile } = useUserProfile();
  const { home, hid, isLoading } = useHome();
  const [greeting, setGreeting] = useState(getGreeting());

  // Optimistic local toggle state, same pattern as the Notifications screen —
  // reflects the user's tap instantly, then reconciles with `home.requestedArmed`
  // once the Firestore listener catches up. Rolls back on a failed request.
  const [optimisticArmed, setOptimisticArmed] = useState(false);

  useEffect(() => {
    if (home) setOptimisticArmed(home.requestedArmed);
  }, [home?.requestedArmed]);

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
      // No further local update needed — subscribeToHome's listener
      // will push the real requestedArmed value once Firestore updates.
    } catch (err) {
      console.error('Failed to toggle armed state:', err);
      setOptimisticArmed(!value); // roll back
      Alert.alert('Error', 'Could not update the system state. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedWaveHeader />
      <View style={styles.content}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.subtitle}>{greeting}, {profile?.displayName}! </Text>
        </View>

        <RoomNodeGraph
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
            {isLoading ? "Loading…" : getStatusText(home)}
          </Text>
        </View>

        <FinalToggleRow
          label={optimisticArmed ? "All Armed" : "All Disarmed"}
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