import { ScreenHeader } from "@/components/ScreenHeader";
import { FinalToggleRow, ToggleRow } from "@/components/ToggleRow";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  defaultNotificationPrefs,
  updateUserProfile,
  type NotificationPrefs,
} from "@/services/userProfile";
import { colors } from "@/theme/colors";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { profile, isLoading } = useUserProfile();
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    defaultNotificationPrefs,
  );

  useEffect(() => {
    if (profile?.notificationPrefs) {
      setPrefs(profile.notificationPrefs);
    }
  }, [profile]);

  const handleToggle = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user) return;

    // Update local UI immediately (optimistic update), then persist.
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);

    try {
      await updateUserProfile(user.uid, { notificationPrefs: updated });
    } catch (error) {
      // Revert on failure, since the save didn't actually go through.
      setPrefs(prefs);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.greenWave1} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Notifications" />

      {/* Critical Alerts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CRITICAL ALERTS</Text>
        <View style={styles.cardGroup}>
          <ToggleRow
            label="Intrusions"
            value={prefs.breakIns}
            onValueChange={(v) => handleToggle("breakIns", v)}
          />
          <ToggleRow
            label="Fires"
            value={prefs.fires}
            onValueChange={(v) => handleToggle("fires", v)}
          />
          <FinalToggleRow
            label="Gas leaks"
            value={prefs.gasLeaks}
            onValueChange={(v) => handleToggle("gasLeaks", v)}
          />
        </View>
      </View>

      {/* Device & System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DEVICE AND SYSTEM</Text>
        <View style={styles.cardGroup}>
          <ToggleRow
            label="Node offline/online"
            value={prefs.nodeStatus}
            onValueChange={(v) => handleToggle("nodeStatus", v)}
          />
          <ToggleRow
            label="Low battery warnings"
            value={prefs.lowBattery}
            onValueChange={(v) => handleToggle("lowBattery", v)}
          />
          <FinalToggleRow
            label="Firmware/system updates"
            value={prefs.firmwareUpdates}
            onValueChange={(v) => handleToggle("firmwareUpdates", v)}
          />
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.cardGroup}>
          <ToggleRow
            label="Security"
            value={prefs.security}
            onValueChange={(v) => handleToggle("security", v)}
          />
          <FinalToggleRow
            label="Product updates and promotions"
            value={prefs.productUpdates}
            onValueChange={(v) => handleToggle("productUpdates", v)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
    paddingHorizontal: 16,
    overflow: "hidden",
  },
});
