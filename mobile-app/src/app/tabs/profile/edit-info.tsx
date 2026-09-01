import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { uploadProfilePhoto } from "@/services/cloudinary";
import { updateUserProfile } from "@/services/userProfile";
import { colors } from "@/theme/colors";
import { getAuth, updateProfile } from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditInfoScreen() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setSelectedPhotoUri(profile.photoURL || null);
    }
  }, [profile]);

  const handlePickPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library to update your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    setSelectedPhotoUri(result.assets[0].uri);
  };

  const handleConfirm = async () => {
    if (!user) return;

    setIsConfirming(true);

    try {
      const hasPhotoChanged =
        selectedPhotoUri !== null
          ? selectedPhotoUri !== profile?.photoURL
          : !!profile?.photoURL;

      let nextPhotoURL: string | null = profile?.photoURL ?? null;

      if (selectedPhotoUri) {
        if (selectedPhotoUri !== profile?.photoURL) {
          setIsUploadingPhoto(true);
          nextPhotoURL = await uploadProfilePhoto(selectedPhotoUri);
        }
      } else if (hasPhotoChanged) {
        nextPhotoURL = null;
      }

      const nextDisplayName = displayName.trim();
      await updateUserProfile(user.uid, {
        displayName: nextDisplayName,
        photoURL: nextPhotoURL,
      });

      const auth = getAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: nextDisplayName || undefined,
          photoURL: nextPhotoURL || null,
        });
      }

      router.back();
    } catch (error) {
      console.error("Profile update failed:", error);
      Alert.alert("Error", "Could not save changes. Please try again.");
    } finally {
      setIsConfirming(false);
      setIsUploadingPhoto(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Edit info" />

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
          <Image
            source={
              selectedPhotoUri
                ? { uri: selectedPhotoUri }
                : require("@/assets/images/pfp-standard.png")
            }
            style={styles.avatar}
          />
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>+</Text>
          </View>
        </TouchableOpacity>

        {profile?.photoURL || selectedPhotoUri ? (
          <TouchableOpacity
            style={styles.removePhotoButton}
            onPress={() => setSelectedPhotoUri(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </TouchableOpacity>
        ) : null}
      </View>

        <View style={styles.cardGroup}>
          <Text style={styles.inputLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter display name"
            placeholderTextColor={colors.textMuted}
          />
        </View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirm}
        disabled={isConfirming || isUploadingPhoto}
        activeOpacity={0.8}
      >
        {isUploadingPhoto || isConfirming ? (
          <ActivityIndicator color={colors.base} />
        ) : (
          <Text style={styles.confirmButtonText}>Save changes</Text>
        )}
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 999,
    borderColor: colors.accent,
    borderWidth: 4,
  },
  avatarBadge: {
    position: "absolute",
    right: 4,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgSecondary2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.accent,
  },
  avatarBadgeText: {
    color: colors.accent,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 18,
    lineHeight: 20,
    marginTop: -2,
  },
  removePhotoButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.base,
    borderWidth: 1,
    borderColor: colors.bgSecondary2,
  },
  removePhotoText: {
    color: colors.text,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 13,
  },
  cardGroup: {
    backgroundColor: colors.bgSecondary1,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 16,
    color: colors.text,
    paddingVertical: 6,
  },
  confirmButton: {
    alignSelf: "center",
    width: "100%",
    height: 48,
    backgroundColor: colors.accent,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
  },
  confirmButtonText: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 16,
    color: colors.base,
  },
});