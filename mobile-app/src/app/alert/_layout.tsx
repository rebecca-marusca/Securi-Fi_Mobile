import { Stack } from "expo-router";

export default function AlertLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hides top header bar
        animation: "fade",   // Smooth transition for emergency alerts
      }}
    />
  );
}