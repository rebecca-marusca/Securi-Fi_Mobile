import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import AnimatedWaveHeader from '@/components/AnimatedWaveHeader';
import { SafeAreaView } from "react-native-safe-area-context";
import SecuriFiTextLightGreen from "../../../assets/images/securi-fi-text-lightGreen.png";
import { colors } from "@/theme/colors";
import RoomNodeGraph from '../../components/RoomNodeGraph';
import { LinearGradient } from "expo-linear-gradient";
import { useUserProfile } from "@/hooks/useUserProfile";
import { FinalToggleRow } from "@/components/ToggleRow";
import { ArmedNode, armedNodes } from '@/services/userProfile';
import { useAuth } from '@/contexts/AuthContext';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour <= 5) return "Hello";
  if (hour > 5 && hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [greeting, setGreeting] = useState(getGreeting());
  const [prefs, setPrefs] = useState<ArmedNode>(
    armedNodes
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (key: keyof ArmedNode, value: boolean) => {
    if (!user) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
  }

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
          <Text style={styles.statusText}>No movement detected</Text>
        </View>
        <FinalToggleRow
          label={prefs.armed ? "All Armed" : "All Disarmed"}
          value={prefs.armed}
          onValueChange={(v) => handleToggle("armed", v)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 10,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "SF-Pro-Text-Semibold",
    color: colors.accent,
    marginTop: 70,
  },
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
  cardPlaceholderText: {
    color: colors.accent,
    fontFamily: "SF-Pro-Text-Semibold",
  },
  statusPill: {
    backgroundColor: 'rgb(64, 144, 79)',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: -3,
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
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
});

export default HomeScreen;