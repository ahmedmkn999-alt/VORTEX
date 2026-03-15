import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
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
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("خطأ", "ادخل الإيميل والباسورد");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("خطأ", "الإيميل أو الباسورد غلط");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (!fullName.trim()) { Alert.alert("خطأ", "ادخل اسمك الكامل"); return; }
    if (!username.trim() || username.length < 3) { Alert.alert("خطأ", "اسم الأكونت لازم 3 حروف على الأقل"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { Alert.alert("خطأ", "اسم الأكونت: حروف وأرقام و _ بس"); return; }
    if (!age || isNaN(Number(age)) || Number(age) < 6 || Number(age) > 100) { Alert.alert("خطأ", "ادخل عمر صحيح"); return; }

    setLoading(true);
    const usernameDoc = await getDoc(doc(db, "usernames", username.toLowerCase()));
    if (usernameDoc.exists()) {
      Alert.alert("خطأ", "اسم الأكونت ده موجود، اختار اسم تاني");
      setLoading(false);
      return;
    }
    setLoading(false);
    setStep(2);
  };

  const handleRegister = async () => {
    if (!email || !password) { Alert.alert("خطأ", "ادخل الإيميل والباسورد"); return; }
    if (password.length < 6) { Alert.alert("خطأ", "الباسورد لازم 6 حروف على الأقل"); return; }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: fullName });
      const ageNum = Number(age);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username.toLowerCase(),
        displayName: fullName,
        email,
        age: ageNum,
        photoURL: "",
        bio: "",
        followersCount: 0,
        followingCount: 0,
        videosCount: 0,
        isAdmin: false,
        isVerified: false,
        status: "active",
        canGoLive: ageNum >= 18,
        liveEnabled: false,
        adsEnabled: false,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "usernames", username.toLowerCase()), { uid: user.uid });
      router.replace("/(tabs)");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("خطأ", "الإيميل ده مسجل بالفعل");
      } else {
        Alert.alert("خطأ", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <LinearGradient colors={["#000000", "#0D0D0D", "#000000"]} style={styles.gradient}>
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
              onPress={() => { setMode("login"); setStep(1); }}
            >
              <Text style={[styles.tabText, mode === "login" && styles.activeTabText]}>تسجيل الدخول</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.activeTab]}
              onPress={() => { setMode("register"); setStep(1); }}
            >
              <Text style={[styles.tabText, mode === "register" && styles.activeTabText]}>حساب جديد</Text>
            </TouchableOpacity>
          </View>

          {/* LOGIN FORM */}
          {mode === "login" && (
            <View style={styles.form}>
              <View style={styles.inputRow}>
                <Feather name="mail" size={20} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput style={styles.input} placeholder="البريد الإلكتروني" placeholderTextColor={COLORS.textMuted}
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.inputRow}>
                <Feather name="lock" size={20} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput style={styles.input} placeholder="كلمة المرور" placeholderTextColor={COLORS.textMuted}
                  value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>دخول 🚀</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* REGISTER STEP 1 */}
          {mode === "register" && step === 1 && (
            <View style={styles.form}>
              <Text style={styles.stepText}>الخطوة 1 من 2 - بياناتك الشخصية</Text>
              <View style={styles.inputRow}>
                <Feather name="user" size={20} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput style={styles.input} placeholder="الاسم الكامل" placeholderTextColor={COLORS.textMuted}
                  value={fullName} onChangeText={setFullName} />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.atSign}>@</Text>
                <TextInput style={styles.input} placeholder="اسم الأكونت (username)" placeholderTextColor={COLORS.textMuted}
                  value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" />
              </View>
              <View style={styles.inputRow}>
                <Feather name="calendar" size={20} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput style={styles.input} placeholder="عمرك" placeholderTextColor={COLORS.textMuted}
                  value={age} onChangeText={setAge} keyboardType="numeric" maxLength={3} />
              </View>
              {Number(age) > 0 && Number(age) < 18 && (
                <View style={styles.warningBox}>
                  <Feather name="alert-triangle" size={16} color="#FFA500" />
                  <Text style={styles.warningText}>ملاحظة: اللايف متاح من عمر 18 سنة فأكبر</Text>
                </View>
              )}
              <TouchableOpacity style={styles.btn} onPress={handleNextStep} disabled={loading}>
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>التالي ←</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* REGISTER STEP 2 */}
          {mode === "register" && step === 2 && (
            <View style={styles.form}>
              <Text style={styles.stepText}>الخطوة 2 من 2 - بيانات الدخول</Text>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                <Feather name="arrow-left" size={16} color={COLORS.primary} />
                <Text style={styles.backText}>رجوع</Text>
              </TouchableOpacity>
              <View style={styles.inputRow}>
                <Feather name="mail" size={20} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput style={styles.input} placeholder="البريد الإلكتروني" placeholderTextColor={COLORS.textMuted}
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.inputRow}>
                <Feather name="lock" size={20} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput style={styles.input} placeholder="كلمة المرور (6 حروف على الأقل)" placeholderTextColor={COLORS.textMuted}
                  value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>إنشاء الحساب 🌀</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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
  stepText: { color: COLORS.textSecondary, fontSize: 13, textAlign: "center", marginBottom: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 },
  icon: { marginRight: 10 },
  atSign: { color: COLORS.primary, fontSize: 18, fontWeight: "800", marginRight: 8 },
  input: { flex: 1, color: COLORS.white, fontSize: 16, paddingVertical: 16 },
  btn: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  btnGrad: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  btnText: { color: COLORS.white, fontSize: 18, fontWeight: "800" },
  warningBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,165,0,0.1)", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,165,0,0.3)" },
  warningText: { color: "#FFA500", fontSize: 13, flex: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
});
