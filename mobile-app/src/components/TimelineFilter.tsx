import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import type { TimelineEntryType } from "@/types/timeline";

export type TimelineFilterId = "all" | "hazards" | "nodes" | "false_alarms";

const HAZARD_TYPES: TimelineEntryType[] = ["break_in", "fire", "gas_leak"];
const NODE_TYPES: TimelineEntryType[] = ["nodes_on", "nodes_off"];

const OPTIONS: { id: TimelineFilterId; label: string }[] = [
  { id: "all", label: "All events" },
  { id: "hazards", label: "Hazards" },
  { id: "nodes", label: "Nodes" },
  { id: "false_alarms", label: "Dismissed" },
];

export function entryMatchesFilter(
  type: TimelineEntryType,
  filter: TimelineFilterId
): boolean {
  switch (filter) {
    case "hazards":
      return HAZARD_TYPES.includes(type);
    case "nodes":
      return NODE_TYPES.includes(type);
    case "false_alarms":
      return type === "false_alarm";
    default:
      return true;
  }
}

export function emptyFilterMessage(filter: TimelineFilterId, hasHome: boolean): string {
  if (!hasHome) return "No home connected";
  switch (filter) {
    case "hazards":
      return "No hazard events";
    case "nodes":
      return "No node status events";
    case "false_alarms":
      return "No false alarms or dismissals";
    default:
      return "No events recorded yet";
  }
}

type Props = {
  value: TimelineFilterId;
  onChange: (filter: TimelineFilterId) => void;
};

export function TimelineFilter({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[styles.segment, selected && styles.segmentSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.label, selected && styles.labelSelected]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  track: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 999,
  },
  segmentSelected: {
    backgroundColor: colors.bgSecondary1,
  },
  label: {
    fontFamily: "SF-Pro-Text-Medium",
    fontSize: 15,
    color: colors.textMuted,
  },
  labelSelected: {
    fontFamily: "SF-Pro-Text-Bold",
    color: colors.accent,
  },
});
