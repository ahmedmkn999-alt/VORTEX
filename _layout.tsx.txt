import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { auth } from "@/context/AppContext";

function UploadButton() {
  return (
    <TouchableOpacity
      onPress={() => router.push("/upload")}
      style={styles.uploadBtn}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.uploadGrad}
      >
        <Feather name="plus" size={24} color={COLORS.white} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const user = auth.currentUser;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Feather name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ color }) => <Feather name="search" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="upload-placeholder"
        options={{
          tabBarButton: () => <UploadButton />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarIcon: ({ color }) => <Feather name="message-circle" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          tabBarIcon: ({ color }) => <Feather name="user" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 8,
  },
  uploadBtn: {
    top: -10,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadGrad: {
    width: 48,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
