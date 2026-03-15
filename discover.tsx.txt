import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, FlatList, Image, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { db } from "@/context/AppContext";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

const TRENDING = ["#fyp", "#vortex", "#dance", "#egypt", "#comedy", "#food", "#fitness", "#viral", "#music", "#travel"];

export default function DiscoverScreen() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = query(
        collection(db, "users"),
        where("username", ">=", searchText.toLowerCase()),
        where("username", "<=", searchText.toLowerCase() + "\uf8ff"),
        limit(20)
      );
      const snap = await getDocs(q);
      setResults(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>اكتشف 🔍</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن مستخدمين..."
          placeholderTextColor={COLORS.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchText(""); setResults([]); setSearched(false); }}>
            <Feather name="x" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Trending */}
      {!searched && (
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>🔥 الأكثر تداولاً</Text>
          <View style={styles.tagsContainer}>
            {TRENDING.map((tag) => (
              <TouchableOpacity key={tag} style={styles.tag} onPress={() => { setSearchText(tag); handleSearch(); }}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : searched && results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>مش لاقي نتايج 😕</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userItem} onPress={() => router.push(`/profile/${item.uid}`)}>
              <Image source={{ uri: item.photoURL || `https://i.pravatar.cc/100?u=${item.uid}` }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.displayName}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
                <Text style={styles.followers}>{item.followersCount || 0} متابع</Text>
              </View>
              <Feather name="chevron-left" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: COLORS.white, fontSize: 24, fontWeight: "900" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 12, gap: 10, marginBottom: 24 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 16 },
  trendingSection: { paddingHorizontal: 20 },
  sectionTitle: { color: COLORS.white, fontSize: 18, fontWeight: "800", marginBottom: 16 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: { backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  tagText: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
  userItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.border },
  userInfo: { flex: 1 },
  displayName: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  username: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  followers: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
