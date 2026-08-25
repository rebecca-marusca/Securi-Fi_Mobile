import { colors } from "@/theme/colors";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import AnimatedWaveHeader from "@/components/AnimatedWaveHeader";
import { TimelineEntryCard } from "@/components/TimelineEntryCard";
import type { TimelineEntry } from "@/types/timeline";

// Placeholder data — swap for a Firestore listener once the events/log
// schema is finalized. Shape matches TimelineEntry so the swap should
// only touch this array and its data source, not the render logic below.
const MOCK_ENTRIES: TimelineEntry[] = [
  {
    id: '1',
    type: 'break_in',
    date: '08.09.2026',
    title: 'BREAK-IN DETECTED',
    description:
      'First detection at 10:00 AM. Movement amplifies at 10:02 AM next to Kitchen node, and the system automatically notified all registered users.',
  },
  { id: '2', type: 'nodes_on', date: '06.10.2026', title: 'NODES TURNED ON' },
  { id: '3', type: 'nodes_off', date: '02.10.2026', title: 'NODES TURNED OFF' },
  {
    id: '4',
    type: 'small_movement',
    date: '02.10.2026',
    title: 'SLIGHT MOVEMENT',
    description: 'Slight movement detected near Kitchen node.',
  },
  {
    id: '5',
    type: 'false_alarm',
    date: '29.09.2026',
    title: 'FALSE ALARM',
    description:
      '"It was just me, I forgot to turn the system off when i came back home."',
  },
];

export default function TimelineScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AnimatedWaveHeader 
          color1={colors.greenWave1}
          color2={colors.greenWave2}
          color3={colors.greenWave3}
        />
        {MOCK_ENTRIES.map((entry, index) => (
          <TimelineEntryCard
            key={entry.id}
            entry={entry}
            isLast={index === MOCK_ENTRIES.length - 1}
          />
        ))}
        <View>
          <Text style={styles.endText}> You've reached the end </Text>
        </View>
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
});