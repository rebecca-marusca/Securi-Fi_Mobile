import { colors } from "@/theme/colors";
import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SettingsRowProps = {
  icon: ComponentProps<typeof SymbolView>["name"];
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  isDestructive?: boolean;
};

export function SettingsRow({
  icon,
  label,
  onPress,
  showChevron = true,
  isDestructive = false,
}: SettingsRowProps) {
  const iconColor = isDestructive ? colors.redWave1 ?? "#E57373" : colors.accent;
  const textColor = isDestructive ? colors.redWave1 ?? "#E57373" : colors.text;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconSquare]}>
        <SymbolView name={icon} size={25} tintColor={iconColor} />
      </View>
      <Text style={[styles.label]}>{label}</Text>
      {showChevron && (
        <SymbolView
          name="chevron.right"
          size={14}
          tintColor={colors.accent}
          weight="bold"
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  label: {
    flex: 1,
    fontFamily: "SF-Pro-Text-Medium",
    color: colors.text,
    fontSize: 17,
  },
});