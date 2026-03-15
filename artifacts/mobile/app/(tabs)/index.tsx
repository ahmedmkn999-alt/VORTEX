import React, { useState, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/context/AppContext";
import { COLORS } from "@/constants/colors";
import VideoCard from "@/components/VideoCard";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function FeedScreen() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
  const flatListRef = useRef<FlatList>(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "videos"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // لو مفيش فيديوهات، نحط بيانات تجريبية
      if (data.length === 0) {
        setVideos(DEMO_VIDEOS);
      } else {
        setVideos(data);
      }
    } catch (error) {
      setVideos(DEMO_VIDEOS);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVideos();
    }, [])
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>جاري تحميل الفيديوهات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab("following")}>
          <Text style={[styles.headerTab, activeTab === "following" && styles.headerTabActive]}>
            Following
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerLogo}>VORTEX</Text>

        <TouchableOpacity onPress={() => setActiveTab("forYou")}>
          <Text style={[styles.headerTab, activeTab === "forYou" && styles.headerTabActive]}>
            For You
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        ref={flatListRef}
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <VideoCard
            video={item}
            isActive={index === activeIndex}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const DEMO_VIDEOS = [
  {
    id: "1",
    username: "neon_dancer",
    displayName: "Neon Dancer",
    description: "When the beat drops 🎵 #dance #vortex #viral",
    likes: 124500,
    comments: 3200,
    shares: 8900,
    videoURL: "",
    thumbnailURL: "https://picsum.photos/400/700?random=1",
    sound: "Original Sound - neon_dancer",
    photoURL: "https://i.pravatar.cc/100?img=1",
  },
  {
    id: "2",
    username: "ahmed_vlog",
    displayName: "Ahmed Vlog",
    description: "يوم في حياتي 🌟 #vlog #egypt #fyp",
    likes: 89000,
    comments: 1500,
    shares: 4200,
    videoURL: "",
    thumbnailURL: "https://picsum.photos/400/700?random=2",
    sound: "Trending Sound",
    photoURL: "https://i.pravatar.cc/100?img=2",
  },
  {
    id: "3",
    username: "sara_fitness",
    displayName: "Sara Fitness",
    description: "تمرين الصبح 💪 #fitness #workout #health",
    likes: 210000,
    comments: 5600,
    shares: 12000,
    videoURL: "",
    thumbnailURL: "https://picsum.photos/400/700?random=3",
    sound: "Motivational Beat",
    photoURL: "https://i.pravatar.cc/100?img=3",
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
  loadingText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 16 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerTab: { color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: "600" },
  headerTabActive: { color: COLORS.white, fontWeight: "800", textDecorationLine: "underline" },
  headerLogo: { color: COLORS.white, fontSize: 22, fontWeight: "900", letterSpacing: 4 },
});
