import { colors } from "@/theme/colors";
import { StyleSheet, Switch, Text, View } from "react-native";

type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function ToggleRow({ label, value, onValueChange, disabled = false, }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#C4C4C7", true: colors.accent }}
        ios_backgroundColor="#C4C4C7"
        thumbColor={colors.white}
      />
    </View>
  );
}

export function FinalToggleRow({
  label,
  value,
  onValueChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <View style={styles.finalrow}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#C4C4C7", true: colors.accent }}
        ios_backgroundColor="#C4C4C7"
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.text,
  },
  finalrow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  label: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: 10
  },
});

