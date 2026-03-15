import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/colors";
import { auth, db } from "@/context/AppContext";
import { deleteDoc, doc, increment, setDoc, updateDoc } from "firebase/firestore";

const { height: H, width: W } = Dimensions.get("window");

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export default function VideoCard({ video, isActive }: { video: any; isActive: boolean }) {
  const [liked,      setLiked]      = useState(false);
  const [likes,      setLikes]      = useState(video.likes || 0);
  const [following,  setFollowing]  = useState(false);
  const heartAnim = useRef(new Animated.Value(1)).current;
  const tapRef    = useRef<any>(null);

  const handleLike = async () => {
    const user = auth.currentUser;
    if (!user) { router.push("/auth"); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(heartAnim, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartAnim, { toValue: 1,   useNativeDriver: true }),
    ]).start();
    const likeRef = doc(db, "likes", `${user.uid}_${video.id}`);
    if (liked) {
      setLiked(false); setLikes((p: number) => p - 1);
      await deleteDoc(likeRef);
      await updateDoc(doc(db, "videos", video.id), { likes: increment(-1) });
    } else {
      setLiked(true); setLikes((p: number) => p + 1);
      await setDoc(likeRef, { userId: user.uid, videoId: video.id });
      await updateDoc(doc(db, "videos", video.id), { likes: increment(1) });
    }
  };

  const handleDoubleTap = () => {
    if (tapRef.current) { clearTimeout(tapRef.current); tapRef.current = null; if (!liked) handleLike(); }
    else { tapRef.current = setTimeout(() => { tapRef.current = null; }, 300); }
  };

  return (
    <TouchableOpacity activeOpacity={1} style={styles.container} onPress={handleDoubleTap}>
      <Image
        source={{ uri: video.thumbnailURL || `https://picsum.photos/400/700?random=${video.id}` }}
        style={styles.thumb} resizeMode="cover"
      />
      <LinearGradient colors={["transparent","rgba(0,0,0,0.3)","rgba(0,0,0,0.85)"]} style={styles.gradient} />

      {/* Info */}
      <View style={styles.info}>
        <TouchableOpacity onPress={() => router.push(`/profile/${video.userId}`)}>
          <Text style={styles.username}>@{video.username}</Text>
        </TouchableOpacity>
        <Text style={styles.desc} numberOfLines={2}>{video.description}</Text>
        <View style={styles.soundRow}>
          <Feather name="music" size={14} color="#fff" />
          <Text style={styles.soundText} numberOfLines={1}>{video.sound || "Original Sound"}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.profileWrap}>
          <Image source={{ uri: video.photoURL || `https://i.pravatar.cc/100?u=${video.userId}` }} style={styles.avatar} />
          <TouchableOpacity style={styles.followBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFollowing(!following); }}>
            <Text style={styles.followBtnText}>{following ? "✓" : "+"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
            <Feather name="heart" size={32} color={liked ? COLORS.primary : "#fff"} />
          </Animated.View>
          <Text style={styles.actionCount}>{fmt(likes)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/comments/${video.id}`)}>
          <Feather name="message-circle" size={32} color="#fff" />
          <Text style={styles.actionCount}>{fmt(video.comments || 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Feather name="share-2" size={32} color="#fff" />
          <Text style={styles.actionCount}>{fmt(video.shares || 0)}</Text>
        </TouchableOpacity>
        <View style={styles.disc}><Text style={{ fontSize: 20 }}>🎵</Text></View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { width: W, height: H, backgroundColor: "#000" },
  thumb: { width: "100%", height: "100%", position: "absolute" },
  gradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: H * 0.5 },
  info: { position: "absolute", bottom: 100, left: 16, right: 80 },
  username: { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 6, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 },
  desc: { color: "#fff", fontSize: 14, lineHeight: 20, marginBottom: 8, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 },
  soundRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  soundText: { color: "#fff", fontSize: 13, flex: 1 },
  actions: { position: "absolute", right: 12, bottom: 100, alignItems: "center", gap: 20 },
  profileWrap: { alignItems: "center", marginBottom: 8 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: "#fff" },
  followBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginTop: -11 },
  followBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  actionBtn: { alignItems: "center", gap: 4 },
  actionCount: { color: "#fff", fontSize: 13, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 },
  disc: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#333", marginTop: 8 },
});
