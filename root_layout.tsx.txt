import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/context/AppContext";
import { auth } from "@/context/AppContext";
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
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="upload" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile/[uid]" />
        <Stack.Screen name="comments/[id]" />
        <Stack.Screen name="admin/index" />
      </Stack>
    </AppProvider>
  );
}
