import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, auth } from "@/context/AppContext";
import { onAuthStateChanged } from "firebase/auth";

export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AppProvider>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="upload" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile/[uid]" />
        <Stack.Screen name="comments/[id]" options={{ presentation: "modal" }} />
      </Stack>
    </AppProvider>
  );
}
