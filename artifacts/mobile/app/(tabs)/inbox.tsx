import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Image } from "react-native";
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";

const NOTIFICATIONS = [
  { id: "1", type: "like", user: "neon_dancer", avatar: "https://i.pravatar.cc/100?img=1", text: "أعجب بفيديوك", time: "منذ دقيقتين" },
  { id: "2", type: "follow", user: "ahmed_vlog", avatar: "https://i.pravatar.cc/100?img=2", text: "بدأ متابعتك", time: "منذ 5 دقائق" },
  { id: "3", type: "comment", user: "sara_fitness", avatar: "https://i.pravatar.cc/100?img=3", text: "علق على فيديوك: 🔥🔥🔥", time: "منذ ساعة" },
  { id: "4", type: "like", user: "comedy_king", avatar: "https://i.pravatar.cc/100?img=4", text: "أعجب بفيديوك", time: "منذ 2 ساعة" },
  { id: "5", type: "follow", user: "food_lover", avatar: "https://i.pravatar.cc/100?img=5", text: "بدأ متابعتك", time: "منذ 3 ساعات" },
];

const getIcon = (type: string) => {
  switch (type) {
    case "like": return { icon: "heart", color: COLORS.primary };
    case "follow": return { icon: "user-plus", color: COLORS.secondary };
    case "comment": return { icon: "message-circle", color: "#00D084" };
    default: return { icon: "bell", color: COLORS.primary };
  }
};

export default function InboxScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإشعارات 🔔</Text>
      </View>

      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const { icon, color } = getIcon(item.type);
          return (
            <TouchableOpacity style={styles.notifItem}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={[styles.iconBadge, { backgroundColor: color }]}>
                  <Feather name={icon as any} size={12} color="#fff" />
                </View>
              </View>
              <View style={styles.notifInfo}>
                <Text style={styles.notifText}>
                  <Text style={styles.notifUser}>{item.user} </Text>
                  {item.text}
                </Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={
          <View style={styles.emptyNotice}>
            <LinearGradient colors={["rgba(255,0,102,0.1)", "rgba(124,58,237,0.1)"]} style={styles.noticeGrad}>
              <Feather name="bell" size={24} color={COLORS.primary} />
              <Text style={styles.noticeText}>الإشعارات الحقيقية ستظهر هنا بعد ربط Firebase</Text>
            </LinearGradient>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: COLORS.white, fontSize: 24, fontWeight: "900" },
  emptyNotice: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: "hidden" },
  noticeGrad: { padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  noticeText: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
  notifItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  avatarContainer: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  iconBadge: { position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.background },
  notifInfo: { flex: 1 },
  notifText: { color: COLORS.white, fontSize: 14, lineHeight: 20 },
  notifUser: { fontWeight: "800" },
  notifTime: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
});
