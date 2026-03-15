import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, Modal, FlatList, Alert, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS } from "@/constants/colors";
import { auth, db } from "@/context/AppContext";
import {
  doc, getDoc, updateDoc, increment, addDoc,
  collection, serverTimestamp, onSnapshot, query,
  orderBy, limit,
} from "firebase/firestore";

const { width: W, height: H } = Dimensions.get("window");

// ===== الهدايا =====
const GIFTS = [
  { id: "rose",     emoji: "🌹", name: "وردة",     coins: 5,    color: "#FF6B9D" },
  { id: "pizza",    emoji: "🍕", name: "بيتزا",    coins: 10,   color: "#FF8C00" },
  { id: "crown",    emoji: "👑", name: "تاج",      coins: 30,   color: "#FFD700" },
  { id: "rocket",   emoji: "🚀", name: "صاروخ",   coins: 50,   color: "#7C3AED" },
  { id: "diamond",  emoji: "💎", name: "ألماسة",  coins: 100,  color: "#00D9FF" },
  { id: "lion",     emoji: "🦁", name: "أسد",     coins: 500,  color: "#FF6600" },
  { id: "yacht",    emoji: "🚢", name: "يخت",     coins: 1000, color: "#0099FF" },
  { id: "universe", emoji: "🌌", name: "كون",     coins: 5000, color: "#FF0066" },
];

// ===== باقات الكوينز =====
const COIN_PACKAGES = [
  { id: "p1", coins: 100,  price: "$0.99",  priceNum: 0.99,  bonus: 0,   label: "مبتدئ" },
  { id: "p2", coins: 500,  price: "$4.49",  priceNum: 4.49,  bonus: 10,  label: "شعبي 🔥" },
  { id: "p3", coins: 1200, price: "$9.99",  priceNum: 9.99,  bonus: 17,  label: "مميز" },
  { id: "p4", coins: 3500, price: "$24.99", priceNum: 24.99, bonus: 30,  label: "كبير 💎" },
  { id: "p5", coins: 8000, price: "$49.99", priceNum: 49.99, bonus: 38,  label: "VIP 👑" },
];

// ===== كومبوننت الهدية الطايرة =====
function FloatingGift({ gift, senderName, onDone }: any) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[styles.floatingGift, { opacity, transform: [{ translateY }, { scale }] }]}>
      <LinearGradient colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.6)"]} style={styles.floatingGiftInner}>
        <Text style={styles.floatingEmoji}>{gift.emoji}</Text>
        <View>
          <Text style={styles.floatingSender}>{senderName}</Text>
          <Text style={styles.floatingName}>{gift.name} × 1</Text>
        </View>
        <Text style={[styles.floatingCoins, { color: gift.color }]}>+{gift.coins} 🪙</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ===== شاشة اللايف الرئيسية =====
export default function LiveScreen({ hostId, hostName, hostAvatar, onClose }: any) {
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [myCoins, setMyCoins] = useState(0);
  const [hostDiamonds, setHostDiamonds] = useState(0);
  const [showGifts, setShowGifts] = useState(false);
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const messagesRef = useRef<ScrollView>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    setIsHost(user.uid === hostId);
    fetchMyCoins();
    subscribeToMessages();
    subscribeToViewers();
    joinLive();
    return () => leaveLive();
  }, []);

  const fetchMyCoins = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setMyCoins(snap.data().coins || 0);
  };

  const joinLive = async () => {
    if (!user) return;
    await updateDoc(doc(db, "lives", hostId), {
      viewerCount: increment(1),
    }).catch(() => {});
  };

  const leaveLive = async () => {
    if (!user) return;
    await updateDoc(doc(db, "lives", hostId), {
      viewerCount: increment(-1),
    }).catch(() => {});
  };

  const subscribeToMessages = () => {
    const q = query(
      collection(db, "lives", hostId, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
      setMessages(msgs);
      setTimeout(() => messagesRef.current?.scrollToEnd(), 100);
    });
  };

  const subscribeToViewers = () => {
    return onSnapshot(doc(db, "lives", hostId), (snap) => {
      if (snap.exists()) {
        setViewerCount(snap.data().viewerCount || 0);
        setHostDiamonds(snap.data().totalDiamonds || 0);
      }
    });
  };

  const sendGift = async (gift: typeof GIFTS[0]) => {
    if (!user) return;
    if (myCoins < gift.coins) {
      setShowBuyCoins(true);
      setShowGifts(false);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // خصم كوينز من المشاهد
    await updateDoc(doc(db, "users", user.uid), {
      coins: increment(-gift.coins),
    });

    // إضافة ديموندز للمذيع (70% للمذيع، 30% للمنصة)
    const diamonds = Math.floor(gift.coins * 0.7);
    await updateDoc(doc(db, "lives", hostId), {
      totalDiamonds: increment(diamonds),
    });
    await updateDoc(doc(db, "users", hostId), {
      diamonds: increment(diamonds),
      totalEarnings: increment(diamonds),
    });

    // إضافة رسالة الهدية
    await addDoc(collection(db, "lives", hostId, "messages"), {
      type: "gift",
      userId: user.uid,
      username: user.displayName || "مجهول",
      giftId: gift.id,
      giftEmoji: gift.emoji,
      giftName: gift.name,
      coins: gift.coins,
      createdAt: serverTimestamp(),
    });

    // تأثير الهدية الطايرة
    const newGift = { id: Date.now(), gift, senderName: user.displayName || "مجهول" };
    setFloatingGifts((prev) => [...prev, newGift]);
    setMyCoins((prev) => prev - gift.coins);
  };

  const buyCoins = async (pkg: typeof COIN_PACKAGES[0]) => {
    // هنا بتوصل لبوابة الدفع
    Alert.alert(
      "شراء كوينز 🪙",
      `هتشتري ${pkg.coins} كوين بـ ${pkg.price}\n\nهيتحول لبوابة الدفع...`,
      [
        { text: "إلغاء", style: "cancel" },
        { text: "ادفع", onPress: async () => {
          // TODO: ربط بـ Stripe أو PayPal
          // مؤقتاً: إضافة كوينز للتجربة
          await updateDoc(doc(db, "users", user!.uid), {
            coins: increment(pkg.coins),
          });
          setMyCoins((prev) => prev + pkg.coins);
          setShowBuyCoins(false);
          Alert.alert("✅ تم!", `اتضافت ${pkg.coins} كوين لحسابك`);
        }},
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* خلفية اللايف */}
      <LinearGradient colors={["#1a0010", "#000", "#0a0020"]} style={styles.liveBg} />

      {/* شريط أعلى */}
      <View style={styles.topBar}>
        <View style={styles.hostInfo}>
          <Image source={{ uri: hostAvatar || `https://i.pravatar.cc/50?u=${hostId}` }} style={styles.hostAvatar} />
          <View>
            <Text style={styles.hostName}>{hostName}</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>مباشر</Text>
            </View>
          </View>
        </View>

        <View style={styles.topRight}>
          <View style={styles.viewersBadge}>
            <Feather name="eye" size={14} color={COLORS.white} />
            <Text style={styles.viewersCount}>{viewerCount.toLocaleString()}</Text>
          </View>
          {isHost && (
            <View style={styles.diamondsBadge}>
              <Text style={styles.diamondsText}>💎 {hostDiamonds.toLocaleString()}</Text>
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* الهدايا الطايرة */}
      {floatingGifts.map((fg) => (
        <FloatingGift
          key={fg.id}
          gift={fg.gift}
          senderName={fg.senderName}
          onDone={() => setFloatingGifts((prev) => prev.filter((g) => g.id !== fg.id))}
        />
      ))}

      {/* الرسائل */}
      <ScrollView
        ref={messagesRef}
        style={styles.messages}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageItem}>
            {msg.type === "gift" ? (
              <LinearGradient
                colors={["rgba(255,0,102,0.2)", "rgba(124,58,237,0.2)"]}
                style={styles.giftMessage}
              >
                <Text style={styles.giftMessageText}>
                  {msg.giftEmoji} <Text style={styles.giftSender}>{msg.username}</Text> أرسل {msg.giftName}
                </Text>
              </LinearGradient>
            ) : (
              <Text style={styles.chatMessage}>
                <Text style={styles.chatUsername}>{msg.username}: </Text>
                {msg.text}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* شريط الكوينز */}
      {!isHost && (
        <TouchableOpacity style={styles.coinsBar} onPress={() => setShowBuyCoins(true)}>
          <Text style={styles.coinsText}>🪙 {myCoins.toLocaleString()}</Text>
          <Text style={styles.coinsAdd}>+ شحن</Text>
        </TouchableOpacity>
      )}

      {/* أزرار أسفل */}
      <View style={styles.bottomBar}>
        {!isHost && (
          <TouchableOpacity style={styles.giftBtn} onPress={() => setShowGifts(true)}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.giftBtnGrad}>
              <Text style={styles.giftBtnText}>🎁 هدية</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {isHost && (
          <View style={styles.hostEarnings}>
            <Text style={styles.hostEarningsText}>💎 أرباحك: {Math.floor(hostDiamonds * 0.05).toLocaleString()} جنيه</Text>
          </View>
        )}
      </View>

      {/* Modal الهدايا */}
      <Modal visible={showGifts} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowGifts(false)} activeOpacity={1}>
          <View style={styles.giftsSheet}>
            <View style={styles.giftsHeader}>
              <Text style={styles.giftsTitle}>🎁 اختار هدية</Text>
              <Text style={styles.myCoinsText}>🪙 {myCoins.toLocaleString()} كوين</Text>
            </View>
            <View style={styles.giftsGrid}>
              {GIFTS.map((gift) => (
                <TouchableOpacity
                  key={gift.id}
                  style={[styles.giftItem, myCoins < gift.coins && styles.giftItemDisabled]}
                  onPress={() => { sendGift(gift); setShowGifts(false); }}
                >
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <View style={[styles.giftPrice, { backgroundColor: gift.color + "22" }]}>
                    <Text style={[styles.giftPriceText, { color: gift.color }]}>🪙 {gift.coins}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.buyMoreBtn} onPress={() => { setShowGifts(false); setShowBuyCoins(true); }}>
              <Text style={styles.buyMoreText}>+ شحن كوينز</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal شراء كوينز */}
      <Modal visible={showBuyCoins} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowBuyCoins(false)} activeOpacity={1}>
          <View style={styles.coinsSheet}>
            <Text style={styles.coinsSheetTitle}>🪙 شحن كوينز</Text>
            <Text style={styles.coinsSheetSub}>أرخص من TikTok بـ 40% 🎉</Text>
            {COIN_PACKAGES.map((pkg) => (
              <TouchableOpacity key={pkg.id} style={styles.packageItem} onPress={() => buyCoins(pkg)}>
                <LinearGradient
                  colors={pkg.bonus > 0 ? [COLORS.primary + "22", COLORS.secondary + "22"] : ["transparent", "transparent"]}
                  style={styles.packageGrad}
                >
                  <View style={styles.packageLeft}>
                    <Text style={styles.packageCoins}>🪙 {pkg.coins.toLocaleString()}</Text>
                    <Text style={styles.packageLabel}>{pkg.label}</Text>
                  </View>
                  <View style={styles.packageRight}>
                    {pkg.bonus > 0 && (
                      <View style={styles.bonusBadge}>
                        <Text style={styles.bonusText}>وفر {pkg.bonus}%</Text>
                      </View>
                    )}
                    <Text style={styles.packagePrice}>{pkg.price}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  liveBg: { position: "absolute", inset: 0 },
  topBar: { position: "absolute", top: 50, left: 16, right: 16, zIndex: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hostInfo: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 24, padding: 8, paddingRight: 14 },
  hostAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: COLORS.primary },
  hostName: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF0000" },
  liveText: { color: "#FF0000", fontSize: 11, fontWeight: "700" },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewersBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  viewersCount: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  diamondsBadge: { backgroundColor: "rgba(0,217,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  diamondsText: { color: "#00D9FF", fontSize: 13, fontWeight: "700" },
  closeBtn: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 },
  floatingGift: { position: "absolute", bottom: 200, left: 16, zIndex: 20, maxWidth: 220 },
  floatingGiftInner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  floatingEmoji: { fontSize: 28 },
  floatingSender: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  floatingName: { color: COLORS.textSecondary, fontSize: 11 },
  floatingCoins: { fontSize: 13, fontWeight: "800" },
  messages: { position: "absolute", bottom: 140, left: 0, right: 80, maxHeight: H * 0.35, paddingHorizontal: 16 },
  messageItem: { marginBottom: 6 },
  giftMessage: { borderRadius: 12, padding: 8, paddingHorizontal: 12 },
  giftMessageText: { color: COLORS.white, fontSize: 13 },
  giftSender: { fontWeight: "800", color: COLORS.primary },
  chatMessage: { color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 20 },
  chatUsername: { fontWeight: "800", color: COLORS.white },
  coinsBar: { position: "absolute", bottom: 90, right: 16, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(255,215,0,0.3)" },
  coinsText: { color: "#FFD700", fontSize: 14, fontWeight: "800" },
  coinsAdd: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  bottomBar: { position: "absolute", bottom: 30, left: 16, right: 16, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  giftBtn: { borderRadius: 25, overflow: "hidden" },
  giftBtnGrad: { paddingHorizontal: 24, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  giftBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  hostEarnings: { backgroundColor: "rgba(0,217,255,0.15)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(0,217,255,0.3)" },
  hostEarningsText: { color: "#00D9FF", fontSize: 14, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  giftsSheet: { backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  giftsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  giftsTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  myCoinsText: { color: "#FFD700", fontSize: 14, fontWeight: "800" },
  giftsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  giftItem: { width: (W - 80) / 4, alignItems: "center", backgroundColor: "#1a1a1a", borderRadius: 16, padding: 12, gap: 4 },
  giftItemDisabled: { opacity: 0.4 },
  giftEmoji: { fontSize: 32 },
  giftName: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  giftPrice: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  giftPriceText: { fontSize: 11, fontWeight: "800" },
  buyMoreBtn: { marginTop: 16, alignItems: "center", padding: 12, backgroundColor: "rgba(255,0,102,0.1)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,0,102,0.3)" },
  buyMoreText: { color: COLORS.primary, fontSize: 15, fontWeight: "800" },
  coinsSheet: { backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  coinsSheetTitle: { color: COLORS.white, fontSize: 22, fontWeight: "900", marginBottom: 4 },
  coinsSheetSub: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 20 },
  packageItem: { borderRadius: 16, overflow: "hidden", marginBottom: 10, borderWidth: 1, borderColor: "#222" },
  packageGrad: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  packageLeft: { gap: 2 },
  packageCoins: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  packageLabel: { color: COLORS.textSecondary, fontSize: 12 },
  packageRight: { alignItems: "flex-end", gap: 4 },
  bonusBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  bonusText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  packagePrice: { color: "#FFD700", fontSize: 18, fontWeight: "900" },
});
