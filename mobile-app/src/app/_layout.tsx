import { SplashOverlay } from "@/components/splash-overlay";
import { AlertProvider, useActiveAlert } from "@/contexts/AlertContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Redirect, Slot, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from 'react-native-gesture-handler'


function RootNavigation() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeAlert, isLoading: alertLoading } = useActiveAlert();
  const segments = useSegments();
  const [fontsLoaded] = useFonts({
    "SF-Pro-Text-Regular": require("@/assets/fonts/SF-Pro-Text-Regular.otf"),
    "SF-Pro-Text-Bold": require("@/assets/fonts/SF-Pro-Text-Bold.otf"),
    "SF-Pro-Text-Semibold": require("@/assets/fonts/SF-Pro-Text-Semibold.otf"),
    "SF-Pro-Text-Medium": require("@/assets/fonts/SF-Pro-Text-Medium.otf"),
    "SF-Pro": require("@/assets/fonts/SF-Pro.ttf")
  })

  if (authLoading || alertLoading || !fontsLoaded) {
    return <SplashOverlay />;
  }

  if (!isAuthenticated) {
    if (segments[0] !== 'auth') {
      return <Redirect href="/auth/getStarted" />;
    }
    return null;
  }

  if (activeAlert) {
    return (
      <Redirect
        href={{
          pathname: "/alert/[alertId]",
          params: { alertId: activeAlert.alertId },
        }}
      />
    );
  }

  const isAllowedGroup = ['tabs', 'onboarding', 'alert'].includes(segments[0]);
  if (!isAllowedGroup) {
    return <Redirect href="/tabs/home" />;
  }

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AlertProvider>
          <Slot />
          <RootNavigation />
        </AlertProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// const styles = StyleSheet.create({
//   symbol: {
//     tintColor: colors.darkGreen,
//     size: 20
//   },
// });