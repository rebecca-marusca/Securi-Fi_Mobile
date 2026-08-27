import { useEffect } from "react";
import { SplashOverlay } from "@/components/splash-overlay";
import { AlertProvider, useActiveAlert } from "@/contexts/AlertContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useRouter, Slot, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from 'react-native-gesture-handler'


function RootLayoutNav() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeAlert, isLoading: alertLoading } = useActiveAlert();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "SF-Pro-Text-Regular": require("@/assets/fonts/SF-Pro-Text-Regular.otf"),
    "SF-Pro-Text-Bold": require("@/assets/fonts/SF-Pro-Text-Bold.otf"),
    "SF-Pro-Text-Semibold": require("@/assets/fonts/SF-Pro-Text-Semibold.otf"),
    "SF-Pro-Text-Medium": require("@/assets/fonts/SF-Pro-Text-Medium.otf"),
    "SF-Pro": require("@/assets/fonts/SF-Pro.ttf"),
  });

  const isLoading = authLoading || alertLoading || !fontsLoaded;

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inAlertGroup = segments[0] === "alert";

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace("/auth/getStarted");
      }
    } else if (activeAlert) {
      if (!inAlertGroup) {
        router.replace({
          pathname: "/alert/[alertId]",
          params: { alertId: activeAlert.alertId },
        });
      }
    } else if (inAuthGroup || inAlertGroup) {
      router.replace("/tabs/home");
    }
  }, [isAuthenticated, activeAlert, isLoading, segments]);

  if (isLoading) {
    return <SplashOverlay />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AlertProvider>
          <RootLayoutNav />
        </AlertProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}