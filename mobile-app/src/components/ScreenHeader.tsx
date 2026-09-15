import { colors } from "@/theme/colors";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function ScreenHeader({
  title,
  titleColor = colors.text,
  iconColor = colors.accent,
}: {
  title: string;
  titleColor?: string;
  iconColor?: string;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.iconContainer}>
        <SymbolView
          name="chevron.left"
          size={22}
          tintColor={iconColor}
        />
      </TouchableOpacity>

      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>

      {/* Invisible spacer equal to left icon width */}
      <View style={styles.iconContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 40,
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 25,
    color: colors.text,
  },
});