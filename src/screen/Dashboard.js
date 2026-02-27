import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import io from "socket.io-client";
import BottomNav from "../components/BottomNav";
import { API_BASE_URL } from "../config/api";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - 40 - CARD_GAP) / 2;
const THUMB_H = CARD_W * 1.05;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function PulseDot() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return (
    <View style={styles.liveDotWrap}>
      <Animated.View style={[styles.liveDotGlow, { opacity: anim }]} />
      <View style={styles.liveDot} />
    </View>
  );
}

export default function Dashboard({ navigation }) {
  const [cameras, setCameras] = useState([]);
  const [snapshotUrls, setSnapshotUrls] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);
  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    socket.on("camera-list", (data) => {
      setCameras(data);
      setRefreshing(false);

      const urls = {};
      data.forEach((cam) => {
        urls[cam] = `${API_BASE_URL}/snapshot/${cam}`;
      });
      setSnapshotUrls(urls);
    });

    socket.emit("get-cameras");
    return () => socket.disconnect();
  }, []);

  const refreshCameras = () => {
    if (!socketRef.current) return;
    setRefreshing(true);
    socketRef.current.emit("get-cameras");
    setTimeout(() => setRefreshing(false), 1200);
  };

  /* ─── Stats Row ─── */
  const StatsRow = () => (
    <View style={styles.statsRow}>
      {[
        { icon: "videocam", label: "Cameras", value: cameras.length, color: "#18e3c6" },
        { icon: "wifi", label: "Online", value: cameras.length, color: "#34d399" },
        { icon: "shield-checkmark", label: "Secure", value: cameras.length, color: "#60a5fa" },
      ].map((s, i) => (
        <View key={i} style={styles.statCard}>
          <LinearGradient
            colors={[`${s.color}18`, `${s.color}08`]}
            style={styles.statGradient}
          >
            <Ionicons name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </LinearGradient>
        </View>
      ))}
    </View>
  );

  /* ─── Camera Card ─── */
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Camera", { cameraId: item })}
      activeOpacity={0.85}
    >
      <View style={styles.thumbnailWrap}>
        <Image source={{ uri: snapshotUrls[item] }} style={styles.thumbnail} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.65)"]}
          style={styles.thumbnailGradient}
        />
        <View style={styles.liveBadge}>
          <PulseDot />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.cardFooter}>
          <Text style={styles.cameraId} numberOfLines={1}>{item}</Text>
          <Ionicons name="chevron-forward" size={14} color="#9fb3c8" />
        </View>
      </View>
    </TouchableOpacity>
  );

  /* ─── Section Header ─── */
  const SectionHeader = () => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Live Feeds</Text>
      <View style={styles.countPill}>
        <View style={styles.countDot} />
        <Text style={styles.countText}>{cameras.length} Active</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b10" />

      {/* Background Orbs */}
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      {/* ─── Header ─── */}
      <LinearGradient
        colors={["#0e151d", "#0b1016", "transparent"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.title}>LiveConnect</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshCameras}
            activeOpacity={0.75}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#18e3c6"
              style={refreshing ? { opacity: 0.5 } : {}}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ─── Content ─── */}
      <FlatList
        data={cameras}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        refreshing={refreshing}
        onRefresh={refreshCameras}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <StatsRow />
            <SectionHeader />
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <LinearGradient
              colors={["rgba(24,227,198,0.08)", "rgba(24,227,198,0.02)"]}
              style={styles.emptyGradient}
            >
              <View style={styles.emptyIconWrap}>
                <Ionicons name="videocam-off-outline" size={48} color="#18e3c6" />
              </View>
              <Text style={styles.emptyTitle}>No cameras online</Text>
              <Text style={styles.emptySubtitle}>
                Start streaming from your device{"\n"}to see the live feed here.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={refreshCameras} activeOpacity={0.8}>
                <Ionicons name="refresh" size={16} color="#0b1016" />
                <Text style={styles.emptyButtonText}>Refresh</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
      />

      <BottomNav navigation={navigation} active="Dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  /* ─── Layout ─── */
  container: {
    flex: 1,
    backgroundColor: "#070b10",
  },
  bgOrbTop: {
    position: "absolute",
    top: -100,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(24, 227, 198, 0.15)",
  },
  bgOrbBottom: {
    position: "absolute",
    bottom: -120,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
  },
  /* ─── Header ─── */
  headerGradient: {
    paddingTop: Platform.OS === "android" ? 48 : 56,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 14,
    color: "#9fb3c8",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: 0.3,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(24, 227, 198, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(24, 227, 198, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ─── Stats Row ─── */
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
  },
  statGradient: {
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: "#7f93a8",
    marginTop: 2,
    letterSpacing: 0.4,
  },

  /* ─── Section Header ─── */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: 0.2,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 227, 198, 0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(24, 227, 198, 0.3)",
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#18e3c6",
    marginRight: 6,
  },
  countText: {
    color: "#dffcf6",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  /* ─── Grid & Cards ─── */
  listContent: {
    paddingBottom: 120,
  },
  gridRow: {
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },
  card: {
    flex: 1,
    marginBottom: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  thumbnailWrap: {
    position: "relative",
    backgroundColor: "#111820",
  },
  thumbnail: {
    width: "100%",
    height: THUMB_H,
    backgroundColor: "#111820",
  },
  thumbnailGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  liveBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 14, 20, 0.75)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  liveDotWrap: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  liveDotGlow: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(239, 68, 68, 0.5)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  liveText: {
    color: "#f8fafc",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  infoContainer: {
    padding: 12,
  },
  cameraId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chip: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  chipText: {
    color: "#a5b4fc",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  /* ─── Empty State ─── */
  emptyState: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(24, 227, 198, 0.12)",
  },
  emptyGradient: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(24, 227, 198, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#9fb3c8",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#18e3c6",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: "#0b1016",
    fontSize: 14,
    fontWeight: "700",
  },
});
