// This file manages the Get started screen, the first thing the user sees in the app upon first load, if they aren't authenticated.
// It contains our logo and a button that sends the user through the authentication process.
// To-do: Add animations - Polish, so not a priority

import { Image, StyleSheet, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";
import { LinearGradient } from "expo-linear-gradient";

export default function GetStartedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Image
        style={styles.logo}
        source={require("@/assets/images/securi-fi-logo.png")}
        resizeMode="contain"
      />

      <View style = {styles.buttonWrapper}>
        <Pressable style={styles.glassButton} onPress={() => router.push("/auth/email")}>
          <LinearGradient
            colors={["rgba(5, 33, 2, 0.25)", "transparent"]}
            style={styles.innerShadowGradient}
          />
          <Text style={styles.buttonText}>Get started</Text>
      </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 38,
    paddingHorizontal: 14,
  },

  logo: {
    width: "100%",
    height: 400,
    marginTop: 25,
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

  blurContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },

  buttonWrapper: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "rgba(253, 253, 253, 0.16)",
  },

  glassButton: {
    width: "100%",
    height: 50,
    backgroundColor: colors.accent,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: colors.base,
    fontSize: 17,
    fontFamily: 'SF-Pro-Text-Semibold'
  },
});