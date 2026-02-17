import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet
} from "react-native";
import io from "socket.io-client";
import BottomNav from "../components/BottomNav";
import { API_BASE_URL } from "../config/api";

export default function Dashboard({ navigation }) {
  const [cameras, setCameras] = useState([]);
  const [snapshotUrls, setSnapshotUrls] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    socket.on("camera-list", (data) => {
      setCameras(data);
      setRefreshing(false);

      // Generate snapshot URLs only once
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Camera", { cameraId: item })}
      activeOpacity={0.9}
    >
      <View style={styles.thumbnailWrap}>
        <Image
          source={{ uri: snapshotUrls[item] }}
          style={styles.thumbnail}
        />
        <View style={styles.thumbnailOverlay} />
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.cameraMetaRow}>
           <Text style={styles.cameraId}>{item}</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>HD</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>LiveConnect</Text>
            <Text style={styles.subtitle}>Your cameras, everywhere.</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshCameras}
            activeOpacity={0.8}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{cameras.length} Active</Text>
        </View>
      </View>

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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No cameras online</Text>
            <Text style={styles.emptySubtitle}>
              Start streaming from your device to see it here.
            </Text>
          </View>
        }
      />

      <BottomNav navigation={navigation} active="Dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 84,
    backgroundColor: "#0b1016"
  },
  bgOrbTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(24, 227, 198, 0.25)"
  },
  bgOrbBottom: {
    position: "absolute",
    bottom: -140,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(249, 178, 51, 0.22)"
  },
  header: {
    marginBottom: 18
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: 0.5
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#9fb3c8"
  },
  countPill: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "rgba(24, 227, 198, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(24, 227, 198, 0.4)"
  },
  refreshButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)"
  },
  refreshText: {
    color: "#f8fafc",
    fontSize: 12,
    letterSpacing: 0.6
  },
  countText: {
    color: "#dffcf6",
    fontSize: 12,
    letterSpacing: 0.4
  },
  listContent: {
    paddingBottom: 120
  },
  gridRow: {
    justifyContent: "space-between"
  },
  card: {
    marginBottom: 18,
    width: "49%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6
  },
  thumbnailWrap: {
    position: "relative"
  },
  thumbnail: {
    width: "100%",
    height: 140,
    backgroundColor: "#1a222d"
  },
  thumbnailOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.15)"
  },
  liveBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 14, 20, 0.7)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)"
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f97316",
    marginRight: 6
  },
  liveText: {
    color: "#f8fafc",
    fontSize: 11,
    letterSpacing: 1
  },
  infoContainer: {
    padding: 12
  },
  cameraMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cameraLabel: {
    fontSize: 12,
    color: "#9fb3c8",
    letterSpacing: 1
  },
  chip: {
    backgroundColor: "rgba(249, 178, 51, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(249, 178, 51, 0.4)"
  },
  chipText: {
    color: "#ffe0a3",
    fontSize: 10,
    letterSpacing: 0.8
  },
  cameraId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 6
  },
  cameraHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#7f93a8"
  },
  emptyState: {
    marginTop: 40,
    padding: 24,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)"
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700"
  },
  emptySubtitle: {
    marginTop: 6,
    color: "#9fb3c8",
    fontSize: 13,
    lineHeight: 18
  }
});
