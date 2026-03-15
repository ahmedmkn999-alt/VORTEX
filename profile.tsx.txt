import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Dimensions, FlatList,
  Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { auth, db } from "@/context/AppContext";
import {
  doc, getDoc, updateDoc, increment,
  setDoc, deleteDoc, collection, query, where, getDocs,
} from "firebase/firestore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_SIZE = (SCREEN_WIDTH - 3) / 3;

export default function ProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const currentUser = auth.currentUser;
  const isMyProfile = uid === currentUser?.uid;

  const [userData, setUserData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [uid]);

  const fetchProfile = async () => {
    if (!uid) return;
    const [userSnap, videosSnap] = await Promise.all([
      getDoc(doc(db, "users", uid)),
      getDocs(query(collection(db, "videos"), where("userId", "==", uid))),
    ]);
    if (userSnap.exists()) setUserData(userSnap.data());
    setVideos(videosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    if (currentUser && !isMyProfile) {
      const followSnap = await getDoc(doc(db, "follows", `${currentUser.uid}_${uid}`));
      setFollowing(followSnap.exists());
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!currentUser) { router.push("/auth"); return; }
    const followRef = doc(db, "follows", `${currentUser.uid}_${uid}`);
    if (following) {
      await deleteDoc(followRef);
      await updateDoc(doc(db, "users", uid!), { followersCount: increment(-1) });
      await updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(-1) });
      setFollowing(false);
    } else {
      await setDoc(followRef, { followerId: currentUser.uid, followingId: uid });
      await updateDoc(doc(db, "users", uid!), { followersCount: increment(1) });
      await updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(1) });
      setFollowing(true);
    }
    fetchProfile();
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerUsername}>@{userData?.username}</Text>
          {isMyProfile ? (
            <TouchableOpacity onPress={() => router.push("/settings")}>
              <Feather name="settings" size={24} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <Feather name="more-vertical" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: userData?.photoURL || `https://i.pravatar.cc/150?u=${uid}` }}
            style={styles.avatar}
          />
          <Text style={styles.displayName}>{userData?.displayName}</Text>
          {userData?.isVerified && <Text style={styles.verified}>✅ موثق</Text>}
          <Text style={styles.bio}>{userData?.bio || "لا يوجد وصف بعد..."}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{userData?.videosCount || 0}</Text>
              <Text style={styles.statLabel}>فيديو</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{userData?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>متابع</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{userData?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>متابَع</Text>
            </View>
          </View>

          {/* Buttons */}
          {isMyProfile ? (
            <View style={styles.btnsRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => router.push("/settings")}>
                <Text style={styles.editBtnText}>تعديل الملف</Text>
              </TouchableOpacity>
              {userData?.liveEnabled && (
                <TouchableOpacity style={styles.liveBtn}>
                  <LinearGradient colors={["#ff0000", "#cc0000"]} style={styles.liveBtnGrad}>
                    <Feather name="radio" size={16} color="#fff" />
                    <Text style={styles.liveBtnText}>بث مباشر</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.followBtn} onPress={handleFollow}>
              <LinearGradient
                colors={following ? [COLORS.surface, COLORS.surface] : [COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.followBtnGrad}
              >
                <Text style={[styles.followBtnText, following && { color: COLORS.white }]}>
                  {following ? "✓ متابَع" : "متابعة +"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Videos Grid */}
        <View style={styles.videosGrid}>
          {videos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="video-off" size={50} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>لا يوجد فيديوهات بعد</Text>
            </View>
          ) : (
            <FlatList
              data={videos}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.videoThumb}>
                  <Image
                    source={{ uri: item.thumbnailURL || `https://picsum.photos/200/300?random=${item.id}` }}
                    style={styles.videoThumbImg}
                  />
                  <View style={styles.videoLikes}>
                    <Feather name="heart" size={12} color={COLORS.white} />
                    <Text style={styles.videoLikesText}>
                      {item.likes > 999 ? (item.likes / 1000).toFixed(1) + "K" : item.likes}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerUsername: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  profileSection: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.primary, marginBottom: 12 },
  displayName: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  verified: { fontSize: 13, marginTop: 4 },
  bio: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: 32, marginTop: 20, marginBottom: 20 },
  statItem: { alignItems: "center" },
  statNum: { color: COLORS.white, fontSize: 22, fontWeight: "900" },
  statLabel: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  btnsRow: { flexDirection: "row", gap: 12 },
  editBtn: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  editBtnText: { color: COLORS.white, fontWeight: "700" },
  liveBtn: { borderRadius: 12, overflow: "hidden" },
  liveBtnGrad: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 12 },
  liveBtnText: { color: COLORS.white, fontWeight: "700" },
  followBtn: { width: "100%", borderRadius: 12, overflow: "hidden" },
  followBtnGrad: { padding: 14, alignItems: "center" },
  followBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  videosGrid: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 2 },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 16 },
  videoThumb: { width: VIDEO_SIZE, height: VIDEO_SIZE, margin: 0.5 },
  videoThumbImg: { width: "100%", height: "100%", backgroundColor: COLORS.surface },
  videoLikes: { position: "absolute", bottom: 4, left: 4, flexDirection: "row", alignItems: "center", gap: 3 },
  videoLikesText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
});
