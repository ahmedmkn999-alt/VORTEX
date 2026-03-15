import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";
import { auth, db } from "@/context/AppContext";
import {
  doc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface VideoCardProps {
  video: any;
  isActive: boolean;
}

export default function VideoCard({ video, isActive }: VideoCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes || 0);
  const [following, setFollowing] = useState(false);
  const heartAnim = useRef(new Animated.Value(1)).current;
  const doubleTapRef = useRef<any>(null);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const handleLike = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/auth");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // انيميشن القلب
    Animated.sequence([
      Animated.spring(heartAnim, { toValue: 1.4, useNativeDriver: true }),
      Animated.spring(heartAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    const likeRef = doc(db, "likes", `${user.uid}_${video.id}`);

    if (liked) {
      setLiked(false);
      setLikesCount((prev: number) => prev - 1);
      await deleteDoc(likeRef);
      await updateDoc(doc(db, "videos", video.id), { likes: increment(-1) });
    } else {
      setLiked(true);
      setLikesCount((prev: number) => prev + 1);
      await setDoc(likeRef, { userId: user.uid, videoId: video.id });
      await updateDoc(doc(db, "videos", video.id), { likes: increment(1) });
    }
  };

  const handleDoubleTap = () => {
    if (doubleTapRef.current) {
      clearTimeout(doubleTapRef.current);
      doubleTapRef.current = null;
      if (!liked) handleLike();
    } else {
      doubleTapRef.current = setTimeout(() => {
        doubleTapRef.current = null;
      }, 300);
    }
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowing(!following);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.container}
      onPress={handleDoubleTap}
    >
      {/* الصورة/الفيديو */}
      <Image
        source={{
          uri: video.thumbnailURL || `https://picsum.photos/400/700?random=${video.id}`,
        }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      {/* Gradient أسفل */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
        style={styles.gradient}
      />

      {/* معلومات الفيديو - يسار */}
      <View style={styles.infoContainer}>
        {/* اسم المستخدم */}
        <TouchableOpacity onPress={() => router.push(`/profile/${video.userId}`)}>
          <Text style={styles.username}>@{video.username}</Text>
        </TouchableOpacity>

        {/* الوصف */}
        <Text style={styles.description} numberOfLines={2}>
          {video.description}
        </Text>

        {/* الصوت */}
        <View style={styles.soundContainer}>
          <Feather name="music" size={14} color={COLORS.white} />
          <Text style={styles.soundText} numberOfLines={1}>
            {video.sound || "Original Sound"}
          </Text>
        </View>
      </View>

      {/* أزرار التفاعل - يمين */}
      <View style={styles.actionsContainer}>
        
        {/* صورة البروفايل + متابعة */}
        <View style={styles.profileAction}>
          <Image
            source={{ uri: video.photoURL || `https://i.pravatar.cc/100?img=${video.id}` }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.followBtn} onPress={handleFollow}>
            <Text style={styles.followBtnText}>{following ? "✓" : "+"}</Text>
          </TouchableOpacity>
        </View>

        {/* لايك */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
            <Feather
              name="heart"
              size={32}
              color={liked ? COLORS.primary : COLORS.white}
              style={liked && { textShadowColor: COLORS.primary, textShadowRadius: 10 }}
            />
          </Animated.View>
          <Text style={styles.actionCount}>{formatNumber(likesCount)}</Text>
        </TouchableOpacity>

        {/* كومنت */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/comments/${video.id}`)}
        >
          <Feather name="message-circle" size={32} color={COLORS.white} />
          <Text style={styles.actionCount}>{formatNumber(video.comments || 0)}</Text>
        </TouchableOpacity>

        {/* شير */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Feather name="share-2" size={32} color={COLORS.white} />
          <Text style={styles.actionCount}>{formatNumber(video.shares || 0)}</Text>
        </TouchableOpacity>

        {/* دوران الصوت */}
        <View style={styles.soundDisc}>
          <Text style={{ fontSize: 20 }}>🎵</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.background,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  infoContainer: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 80,
  },
  username: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },
  description: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },
  soundContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  soundText: {
    color: COLORS.white,
    fontSize: 13,
    flex: 1,
  },
  actionsContainer: {
    position: "absolute",
    right: 12,
    bottom: 100,
    alignItems: "center",
    gap: 20,
  },
  profileAction: {
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  followBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -11,
  },
  followBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },
  soundDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.surfaceSecondary,
    marginTop: 8,
  },
});
