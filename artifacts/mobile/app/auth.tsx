import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { auth, db } from "@/context/AppContext";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("خطأ", "من فضلك ادخل الإيميل والباسورد");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("خطأ في الدخول", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !username) {
      Alert.alert("خطأ", "من فضلك ادخل كل البيانات");
      return;
    }
    if (username.length < 3) {
      Alert.alert("خطأ", "الاسم لازم يكون 3 حروف على الأقل");
      return;
    }
    setLoading(true);
    try {
      // تحقق من تكرار اسم المستخدم
      const usernameDoc = await getDoc(doc(db, "usernames", username.toLowerCase()));
      if (usernameDoc.exists()) {
        Alert.alert("خطأ", "اسم المستخدم ده موجود بالفعل، اختار اسم تاني");
        setLoading(false);
        return;
      }

      // إنشاء الحساب
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });

      // حفظ بيانات المستخدم
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username.toLowerCase(),
        displayName: username,
        email: email,
        photoURL: "",
        bio: "",
        followersCount: 0,
        followingCount: 0,
        videosCount: 0,
        isAdmin: false,
        status: "active",
        createdAt: serverTimestamp(),
      });

      // حجز اسم المستخدم
      await setDoc(doc(db, "usernames", username.toLowerCase()), {
        uid: user.uid,
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("خطأ في التسجيل", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#000000", "#0D0D0D", "#000000"]}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🌀</Text>
            <Text style={styles.appName}>VORTEX</Text>
            <Text style={styles.tagline}>انضم للمجتمع الأكبر</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.activeTab]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.tabText, mode === "login" && styles.activeTabText]}>
                تسجيل الدخول
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.activeTab]}
              onPress={() => setMode("register")}
            >
              <Text style={[styles.tabText, mode === "register" && styles.activeTabText]}>
                حساب جديد
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === "register" && (
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="اسم المستخدم"
                  placeholderTextColor={COLORS.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
                <Feather name={showPass ? "eye-off" : "eye"} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* زر الدخول/التسجيل */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={mode === "login" ? handleLogin : handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>
                    {mode === "login" ? "دخول 🚀" : "إنشاء حساب 🌀"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 70 },
  appName: { fontSize: 42, fontWeight: "900", color: COLORS.white, letterSpacing: 8, marginTop: 8 },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  tabs: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: 16, padding: 4, marginBottom: 32 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: "600", fontSize: 15 },
  activeTabText: { color: COLORS.white },
  form: { gap: 16 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.white, fontSize: 16, paddingVertical: 16 },
  eyeIcon: { padding: 4 },
  btnPrimary: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  btnGradient: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
});
