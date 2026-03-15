import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { auth, db } from "@/context/AppContext";
import {
  collection, query, where, orderBy, getDocs,
  addDoc, serverTimestamp, updateDoc, doc, increment,
} from "firebase/firestore";

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const user = auth.currentUser;

  useEffect(() => { fetchComments(); }, [id]);

  const fetchComments = async () => {
    try {
      const q = query(
        collection(db, "comments"),
        where("videoId", "==", id),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!user) { router.push("/auth"); return; }
    if (!text.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "comments"), {
        videoId: id,
        userId: user.uid,
        username: user.displayName || "user",
        photoURL: user.photoURL || "",
        text: text.trim(),
        likes: 0,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "videos", id!), { comments: increment(1) });
      setText("");
      fetchComments();
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التعليقات</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لا يوجد تعليقات بعد</Text>
              <Text style={styles.emptySubtext}>كن أول من يعلق! 💬</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Image source={{ uri: item.photoURL || `https://i.pravatar.cc/50?u=${item.userId}` }} style={styles.avatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentUsername}>{item.username}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
              <TouchableOpacity style={styles.likeBtn}>
                <Feather name="heart" size={16} color={COLORS.textSecondary} />
                <Text style={styles.likesCount}>{item.likes || 0}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <Image source={{ uri: user?.photoURL || `https://i.pravatar.cc/50?u=${user?.uid}` }} style={styles.myAvatar} />
        <TextInput
          style={styles.input}
          placeholder="اكتب تعليق..."
          placeholderTextColor={COLORS.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Feather name="send" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: "700" },
  emptySubtext: { color: COLORS.textMuted, fontSize: 14 },
  commentItem: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  commentContent: { flex: 1 },
  commentUsername: { color: COLORS.white, fontSize: 14, fontWeight: "700", marginBottom: 4 },
  commentText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  likeBtn: { alignItems: "center", gap: 2 },
  likesCount: { color: COLORS.textMuted, fontSize: 11 },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12 },
  myAvatar: { width: 36, height: 36, borderRadius: 18 },
  input: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: COLORS.white, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: COLORS.surface },
});
