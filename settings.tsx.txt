import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert, Image, ScrollView, StyleSheet, Switch,
  Text, TouchableOpacity, View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { auth, db } from "@/context/AppContext";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function SettingsScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setUserData(snap.data());
    setLoading(false);
  };

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "متأكد إنك عايز تخرج؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: async () => {
        await signOut(auth);
        router.replace("/auth");
      }},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert("حذف الحساب", "ده هيحذف حسابك نهائياً. متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: async () => {
        await updateDoc(doc(db, "users", user!.uid), { status: "deleted" });
        await signOut(auth);
        router.replace("/auth");
      }},
    ]);
  };

  const handleRequestAds = () => {
    Alert.alert(
      "طلب الإعلانات 💰",
      "عشان تكسب من الإعلانات محتاج:\n\n✅ 1000 متابع على الأقل\n✅ 30 فيديو منشور\n✅ حساب موثق\n\nهتبعت طلبك للمراجعة",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "أرسل الطلب", onPress: async () => {
          await updateDoc(doc(db, "users", user!.uid), { adsRequest: true, adsRequestDate: new Date() });
          Alert.alert("تم! ✅", "طلبك اتبعت وهيتراجع خلال 48 ساعة");
        }},
      ]
    );
  };

  const handleRequestLive = () => {
    if (!userData) return;
    if (userData.age < 18) {
      Alert.alert("معذرة 🚫", "اللايف متاح من عمر 18 سنة فأكبر فقط");
      return;
    }
    if (userData.followersCount < 50) {
      Alert.alert(
        "محتاج متابعين أكتر 👥",
        `عندك ${userData.followersCount} متابع\nمحتاج ${50 - userData.followersCount} متابع تاني عشان تفعّل اللايف`
      );
      return;
    }
    Alert.alert("تفعيل اللايف 🔴", "هتقدر تبث لايف لمتابعيك!", [
      { text: "إلغاء", style: "cancel" },
      { text: "فعّل", onPress: async () => {
        await updateDoc(doc(db, "users", user!.uid), { liveEnabled: true });
        fetchUserData();
        Alert.alert("تم! 🎉", "اللايف اتفعّل، روح للفيد وابدأ بث!");
      }},
    ]);
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <Text style={{ color: COLORS.primary, fontSize: 30 }}>🌀</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={["#1a0010", "#000"]} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الإعدادات</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: userData?.photoURL || `https://i.pravatar.cc/100?u=${user?.uid}` }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{userData?.displayName}</Text>
            <Text style={styles.username}>@{userData?.username}</Text>
            <Text style={styles.age}>العمر: {userData?.age} سنة</Text>
          </View>
          <TouchableOpacity onPress={() => router.push(`/profile/${user?.uid}`)}>
            <Feather name="edit-2" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{userData?.videosCount || 0}</Text>
            <Text style={styles.statLabel}>فيديو</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{userData?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>متابع</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{userData?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>متابَع</Text>
          </View>
        </View>

        {/* قسم اللايف */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔴 البث المباشر</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleRequestLive}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(255,0,0,0.15)" }]}>
                <Feather name="radio" size={20} color="red" />
              </View>
              <View>
                <Text style={styles.settingText}>تفعيل اللايف</Text>
                <Text style={styles.settingSubtext}>
                  {userData?.liveEnabled ? "✅ مفعّل" : userData?.age < 18 ? "🔞 متاح من 18 سنة" : `يحتاج 50 متابع (عندك ${userData?.followersCount || 0})`}
                </Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: userData?.liveEnabled ? "#00D084" : COLORS.primary }]}>
              <Text style={styles.badgeText}>{userData?.liveEnabled ? "شغّال" : "فعّل"}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* قسم الإعلانات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 الربح من الإعلانات</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleRequestAds}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(255,215,0,0.15)" }]}>
                <Feather name="dollar-sign" size={20} color="gold" />
              </View>
              <View>
                <Text style={styles.settingText}>طلب تفعيل الإعلانات</Text>
                <Text style={styles.settingSubtext}>
                  {userData?.adsEnabled ? "✅ مفعّل - بتكسب دلوقتي!" : userData?.adsRequest ? "⏳ تحت المراجعة" : "محتاج 1000 متابع"}
                </Text>
              </View>
            </View>
            <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* معلومات الربح */}
          {userData?.adsEnabled && (
            <View style={styles.earningsCard}>
              <LinearGradient colors={["rgba(255,0,102,0.2)", "rgba(124,58,237,0.2)"]} style={styles.earningsGrad}>
                <Text style={styles.earningsTitle}>أرباحك هذا الشهر</Text>
                <Text style={styles.earningsAmount}>$0.00</Text>
                <Text style={styles.earningsSubtext}>الأرباح بتتحسب كل 30 يوم</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* إعدادات الحساب */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ إعدادات الحساب</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push(`/profile/${user?.uid}`)}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(255,0,102,0.15)" }]}>
                <Feather name="user" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.settingText}>تعديل الملف الشخصي</Text>
            </View>
            <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(124,58,237,0.15)" }]}>
                <Feather name="lock" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.settingText}>تغيير كلمة المرور</Text>
            </View>
            <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(0,208,132,0.15)" }]}>
                <Feather name="bell" size={20} color="#00D084" />
              </View>
              <Text style={styles.settingText}>الإشعارات</Text>
            </View>
            <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(255,165,0,0.15)" }]}>
                <Feather name="shield" size={20} color="orange" />
              </View>
              <Text style={styles.settingText}>الخصوصية والأمان</Text>
            </View>
            <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* الدعم */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆘 الدعم</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(255,0,102,0.15)" }]}>
                <Feather name="help-circle" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.settingText}>مركز المساعدة</Text>
            </View>
            <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(124,58,237,0.15)" }]}>
                <Feather name="flag" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.settingText}>الإبلاغ عن مشكلة</Text>
            </View>
            <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* تسجيل الخروج */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={20} color={COLORS.primary} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* حذف الحساب */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>حذف الحساب نهائياً</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backBtn: { padding: 4 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  profileCard: { flexDirection: "row", alignItems: "center", margin: 20, backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.primary },
  profileInfo: { flex: 1 },
  displayName: { color: COLORS.white, fontSize: 17, fontWeight: "800" },
  username: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  age: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: "row", backgroundColor: COLORS.surface, marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 8 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: "800", marginBottom: 12 },
  settingItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  settingText: { color: COLORS.white, fontSize: 15, fontWeight: "600" },
  settingSubtext: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  earningsCard: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  earningsGrad: { padding: 20, alignItems: "center" },
  earningsTitle: { color: COLORS.textSecondary, fontSize: 14 },
  earningsAmount: { color: COLORS.white, fontSize: 36, fontWeight: "900", marginVertical: 4 },
  earningsSubtext: { color: COLORS.textMuted, fontSize: 12 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 20, marginTop: 32, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.primary },
  logoutText: { color: COLORS.primary, fontSize: 16, fontWeight: "700" },
  deleteBtn: { alignItems: "center", marginTop: 16, padding: 12 },
  deleteText: { color: COLORS.textMuted, fontSize: 14, textDecorationLine: "underline" },
});
