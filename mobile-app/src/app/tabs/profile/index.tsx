import AnimatedWaveHeader from "@/components/AnimatedWaveHeader";
import { SettingsRow } from "@/components/SettingsRow";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { colors } from "@/theme/colors";
import { useRouter } from "expo-router";
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile } = useUserProfile();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert(
              "Error",
              "Something went wrong logging out. Please try again.",
            );
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AnimatedWaveHeader
        color1={colors.greenWave1}
        color2={colors.greenWave2}
        color3={colors.greenWave3}
      />
      <Image
        source={
          profile?.photoURL
            ? { uri: profile.photoURL }
            : require("@/assets/images/pfp-standard.png")
        }
        style={styles.avatar}
      />

      <Text style={styles.name}>{profile?.displayName ?? "display_name"}</Text>

      

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.cardGroup}>
          <SettingsRow
            icon="pencil.line"
            label="Edit info"
            onPress={() => router.push("/tabs/profile/edit-info")}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="bell.fill"
            label="Notifications"
            onPress={() => router.push("/tabs/profile/notifications")}
          />
        </View>
      </View>

      {/* System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SYSTEM</Text>
        <View style={styles.cardGroup}>
          <SettingsRow
            icon="point.topleft.down.to.point.bottomright.curvepath"
            label="Configure nodes"
            onPress={() => router.push("/tabs/profile/nodes")}
          />
        </View>
      </View>

      {/* Support & Session Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HAVING ISSUES?</Text>
        <View style={styles.cardGroup}>
          <SettingsRow
            icon="questionmark.circle"
            label="Help & Support"
            onPress={() =>
              Linking.openURL(
                "mailto:support@securi-fi.app?subject=Securi-Fi Support",
              )
            }
          />
        </View>
      </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 999,
    alignSelf: "center",
    borderColor: colors.base,
    borderWidth: 10,
    marginTop: 60,
  },
  name: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 23,
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: colors.bgSecondary1,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: colors.bgSecondary2,
    marginLeft: 60, // Aligns divider past the icon
  },
logoutButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
    backgroundColor: colors.base,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 15,
    color: colors.redWave1 ?? "#E57373",
  },
});