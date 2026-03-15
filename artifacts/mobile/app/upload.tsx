import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Image, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { auth, db, storage } from "@/context/AppContext";
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

export default function UploadScreen() {
  const [video, setVideo]           = useState<any>(null);
  const [description, setDescription] = useState("");
  const [sound, setSound]           = useState("");
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("خطأ", "محتاج إذن للوصول للفيديوهات"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true, quality: 1, videoMaxDuration: 60,
    });
    if (!result.canceled) setVideo(result.assets[0]);
  };

  const uploadVideo = async () => {
    const user = auth.currentUser;
    if (!user) { router.push("/auth"); return; }
    if (!video) { Alert.alert("خطأ", "اختار فيديو الأول"); return; }
    if (!description.trim()) { Alert.alert("خطأ", "اكتب وصف للفيديو"); return; }
    setUploading(true);
    try {
      const response = await fetch(video.uri);
      const blob = await response.blob();
      const videoRef = ref(storage, `videos/${user.uid}/${Date.now()}.mp4`);
      const task = uploadBytesResumable(videoRef, blob);
      task.on("state_changed",
        snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        err => { Alert.alert("خطأ", err.message); setUploading(false); },
        async () => {
          const videoURL = await getDownloadURL(task.snapshot.ref);
          await addDoc(collection(db, "videos"), {
            userId: user.uid, username: user.displayName || "user",
            displayName: user.displayName || "User", photoURL: user.photoURL || "",
            description: description.trim(),
            sound: sound.trim() || "Original Sound - " + (user.displayName || "user"),
            videoURL, thumbnailURL: "", likes: 0, comments: 0, shares: 0, views: 0,
            isModerated: false, isFlagged: false, createdAt: serverTimestamp(),
          });
          await updateDoc(doc(db, "users", user.uid), { videosCount: increment(1) });
          Alert.alert("تم! 🎉", "الفيديو اتنشر", [{ text: "تمام", onPress: () => router.replace("/(tabs)") }]);
        }
      );
    } catch (e: any) { Alert.alert("خطأ", e.message); setUploading(false); }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="x" size={28} color="#fff" /></TouchableOpacity>
          <Text style={styles.title}>فيديو جديد</Text>
          <View style={{ width: 28 }} />
        </View>
        <TouchableOpacity style={styles.pickArea} onPress={pickVideo}>
          {video ? (
            <View style={styles.videoPreview}>
              <Image source={{ uri: video.uri }} style={styles.previewImg} />
              <View style={styles.overlay}>
                <Feather name="check-circle" size={40} color={COLORS.primary} />
                <Text style={styles.selectedText}>تم الاختيار ✅</Text>
              </View>
            </View>
          ) : (
            <LinearGradient colors={["rgba(255,0,102,0.1)","rgba(124,58,237,0.1)"]} style={styles.pickContent}>
              <Feather name="video" size={60} color={COLORS.primary} />
              <Text style={styles.pickTitle}>اختار فيديو</Text>
              <Text style={styles.pickSub}>حتى 60 ثانية</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
        <View style={styles.inputBox}>
          <Text style={styles.label}>الوصف</Text>
          <TextInput style={styles.textArea} placeholder="اكتب وصف... #هاشتاج" placeholderTextColor="#444"
            value={description} onChangeText={setDescription} multiline maxLength={150} />
          <Text style={styles.charCount}>{description.length}/150</Text>
        </View>
        <View style={styles.inputBox}>
          <Text style={styles.label}>🎵 اسم الصوت</Text>
          <TextInput style={styles.input} placeholder="Original Sound" placeholderTextColor="#444"
            value={sound} onChangeText={setSound} />
        </View>
        {uploading && (
          <View style={styles.progressBox}>
            <Text style={styles.progressText}>جاري الرفع... {progress}%</Text>
            <View style={styles.progressBar}>
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x:0,y:0 }} end={{ x:1,y:0 }}
                style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>
          </View>
        )}
        <TouchableOpacity style={styles.publishBtn} onPress={uploadVideo} disabled={uploading}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.publishGrad}>
            {uploading ? <ActivityIndicator color="#fff" /> : <><Feather name="upload-cloud" size={22} color="#fff" /><Text style={styles.publishText}>نشر الفيديو 🚀</Text></>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:"#000" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:20, paddingTop:60, paddingBottom:20 },
  title: { color:"#fff", fontSize:18, fontWeight:"800" },
  pickArea: { marginHorizontal:20, borderRadius:20, overflow:"hidden", marginBottom:24, height:220 },
  pickContent: { flex:1, alignItems:"center", justifyContent:"center", gap:12, borderWidth:2, borderColor:COLORS.primary, borderStyle:"dashed", borderRadius:20 },
  pickTitle: { color:"#fff", fontSize:20, fontWeight:"800" },
  pickSub: { color:"#888", fontSize:14 },
  videoPreview: { flex:1 },
  previewImg: { width:"100%", height:"100%", borderRadius:20 },
  overlay: { position:"absolute", inset:0, backgroundColor:"rgba(0,0,0,0.5)", alignItems:"center", justifyContent:"center", gap:8, borderRadius:20 },
  selectedText: { color:"#fff", fontSize:16, fontWeight:"700" },
  inputBox: { marginHorizontal:20, marginBottom:20 },
  label: { color:"#fff", fontSize:16, fontWeight:"700", marginBottom:10 },
  textArea: { backgroundColor:"#111", borderRadius:14, padding:16, color:"#fff", fontSize:15, minHeight:100, borderWidth:1, borderColor:"#222", textAlignVertical:"top" },
  input: { backgroundColor:"#111", borderRadius:14, padding:16, color:"#fff", fontSize:15, borderWidth:1, borderColor:"#222" },
  charCount: { color:"#444", fontSize:12, textAlign:"right", marginTop:4 },
  progressBox: { marginHorizontal:20, marginBottom:20 },
  progressText: { color:"#fff", fontSize:14, marginBottom:8, textAlign:"center" },
  progressBar: { height:6, backgroundColor:"#222", borderRadius:3, overflow:"hidden" },
  progressFill: { height:"100%", borderRadius:3 },
  publishBtn: { marginHorizontal:20, borderRadius:16, overflow:"hidden", marginBottom:40 },
  publishGrad: { paddingVertical:18, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10 },
  publishText: { color:"#fff", fontSize:18, fontWeight:"800" },
});
