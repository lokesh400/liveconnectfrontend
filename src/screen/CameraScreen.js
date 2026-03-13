import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { API_BASE_URL } from "../config/api";

/* ─── Pulsing Live Dot ─── */
function PulseDot({ size = 8 }) {
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
    <View style={{ width: size + 4, height: size + 4, alignItems: "center", justifyContent: "center", marginRight: 6 }}>
      <Animated.View style={{ position: "absolute", width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, backgroundColor: "rgba(239,68,68,0.45)", opacity: anim }} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#ef4444" }} />
    </View>
  );
}

export default function CameraScreen({ route, navigation }) {
  const { cameraId } = route.params;
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const portraitBottomInset = Math.max(insets.bottom, 14);
  const portraitVideoHeight = Math.max(250, Math.min(height * 0.44, width * 1.24));

  const [micOn, setMicOn] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [captureToast, setCaptureToast] = useState({ visible: false, type: "success", message: "" });
  const [isCapturing, setIsCapturing] = useState(false);
  const [frameTime, setFrameTime] = useState(null);
  const [activeDir, setActiveDir] = useState(null);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  }, []);

  // Poll backend for frame timestamp
  useEffect(() => {
    const fetchTimestamp = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/timestamp/${cameraId}`);
        if (res.ok) {
          const data = await res.json();
          setFrameTime(data.timestamp);
        }
      } catch (_) {}
    };
    fetchTimestamp();
    const interval = setInterval(fetchTimestamp, 1000);
    return () => clearInterval(interval);
  }, [cameraId]);

  const formatTimestamp = (iso) => {
    if (!iso) return "--:--:--";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) + "  " + d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const toggleOrientation = async () => {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    setIsLandscape(!isLandscape);
  };

  const takeScreenshot = async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        setCaptureToast({ visible: true, type: "error", message: "Gallery permission denied" });
        return;
      }

      const captureDir = `${FileSystem.documentDirectory}captures/`;
      await FileSystem.makeDirectoryAsync(captureDir, { intermediates: true });

      const fileUri = `${captureDir}${cameraId}-${Date.now()}.jpg`;
      const download = await FileSystem.downloadAsync(`${API_BASE_URL}/snapshot/${cameraId}`, fileUri);

      if (download.status !== 200) {
        throw new Error(`Snapshot request failed with status ${download.status}`);
      }

      const asset = await MediaLibrary.createAssetAsync(download.uri);

      try {
        const album = await MediaLibrary.getAlbumAsync("LiveConnect");
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync("LiveConnect", asset, false);
        }
      } catch (_) {
        // Fall back to the default gallery if album operations are unavailable.
      }

      setCaptureToast({ visible: true, type: "success", message: "Screenshot saved to gallery" });
    } catch (_) {
      setCaptureToast({ visible: true, type: "error", message: "Unable to save screenshot" });
    } finally {
      setIsCapturing(false);
      setTimeout(() => {
        setCaptureToast((current) => ({ ...current, visible: false }));
      }, 2200);
    }
  };

  const pressDir = async (dir) => {
    setActiveDir(dir);
    try {
      await fetch(`${API_BASE_URL}/move/${cameraId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: dir }),
      });
    } catch (_) {
      // network error – silently ignore so the UI never freezes
    } finally {
      setActiveDir(null);
    }
  };

  const streamUri = `${API_BASE_URL}/stream/${cameraId}?fps=10`;
  const streamHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
          }

          body {
            position: fixed;
            inset: 0;
          }

          .stream-shell {
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            background: #000;
          }

          .stream-frame {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: contain;
            background: #000;
            user-select: none;
            -webkit-user-drag: none;
          }
        </style>
      </head>
      <body>
        <div class="stream-shell">
          <img class="stream-frame" src="${streamUri}" alt="${cameraId} live stream" />
        </div>
      </body>
    </html>
  `;

  /* ─── Action Button Helper ─── */
  const ActionButton = ({ icon, label, onPress, active, accent }) => (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIconWrap, active && { backgroundColor: `${accent || "#18e3c6"}20`, borderColor: `${accent || "#18e3c6"}40` }]}>
        <Ionicons name={icon} size={22} color={active ? (accent || "#18e3c6") : "#9fb3c8"} />
      </View>
      <Text style={[styles.actionLabel, active && { color: accent || "#18e3c6" }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" hidden={isLandscape} />

      {/* ─── Stream (fills the screen) ─── */}
      <View
        style={[
          styles.videoWrapper,
          isLandscape
            ? styles.videoWrapperLandscape
            : [styles.videoWrapperPortrait, { height: portraitVideoHeight, marginTop: insets.top + 10 }],
        ]}
      >
        <WebView
          key={isLandscape ? "landscape-stream" : "portrait-stream"}
          originWhitelist={["*"]}
          source={{ html: streamHtml, baseUrl: API_BASE_URL }}
          style={styles.webview}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          nestedScrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          mixedContentMode="always"
          onMessage={() => {}}
        />

        {/* Overlay top bar — hidden in landscape */}
        {!isLandscape && (
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "transparent"]}
            style={styles.overlayTop}
            pointerEvents="box-none"
          >
            <View style={[styles.overlayTopInner, styles.overlayTopInnerPortrait]}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.topBarTitle} numberOfLines={1}>{cameraId}</Text>
              <View style={styles.liveBadge}>
                <PulseDot size={7} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Timestamp overlay — bottom-left */}
        <View
          style={[
            styles.timestampBadge,
            isLandscape
              ? styles.timestampBadgeLandscape
              : styles.timestampBadgePortrait,
          ]}
        >
          <Ionicons name="time-outline" size={12} color="#9fb3c8" />
          <Text style={styles.timestampText}>{formatTimestamp(frameTime)}</Text>
        </View>

        {/* Landscape: only a rotate-back button in bottom-right */}
        {isLandscape && (
          <TouchableOpacity
            style={styles.landscapeRotateBtn}
            onPress={toggleOrientation}
            activeOpacity={0.75}
          >
            <Ionicons name="phone-portrait-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Toast */}
        {captureToast.visible && (
          <View
            style={[
              styles.toast,
              captureToast.type === "error" ? styles.toastError : styles.toastSuccess,
              !isLandscape && styles.toastPortrait,
            ]}
          >
            <Ionicons
              name={captureToast.type === "error" ? "alert-circle" : "checkmark-circle"}
              size={16}
              color={captureToast.type === "error" ? "#fca5a5" : "#34d399"}
            />
            <Text style={[styles.toastText, captureToast.type === "error" && styles.toastTextError]}>
              {captureToast.message}
            </Text>
          </View>
        )}
      </View>

      {/* ─── Bottom Controls — hidden in landscape ─── */}
      {!isLandscape && (
        <View
          style={[
            styles.controlsBar,
            styles.controlsBarPortrait,
            { paddingBottom: portraitBottomInset },
          ]}
        >
          {/* D-Pad compact */}
          <View style={styles.dpadCompact}>
            <TouchableOpacity
              style={[styles.arrowBtn, activeDir === "left" && styles.arrowBtnActive]}
              onPress={() => pressDir("left")}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={activeDir === "left" ? "#fff" : "#18e3c6"} />
            </TouchableOpacity>
            <View style={styles.dpadVertical}>
              <TouchableOpacity
                style={[styles.arrowBtn, activeDir === "up" && styles.arrowBtnActive]}
                onPress={() => pressDir("up")}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-up" size={20} color={activeDir === "up" ? "#fff" : "#18e3c6"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.arrowBtn, activeDir === "down" && styles.arrowBtnActive]}
                onPress={() => pressDir("down")}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-down" size={20} color={activeDir === "down" ? "#fff" : "#18e3c6"} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.arrowBtn, activeDir === "right" && styles.arrowBtnActive]}
              onPress={() => pressDir("right")}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color={activeDir === "right" ? "#fff" : "#18e3c6"} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <ActionButton icon={micOn ? "mic" : "mic-off"} label={micOn ? "Mute" : "Mic"} onPress={() => setMicOn(!micOn)} active={micOn} accent="#60a5fa" />
            <ActionButton icon={isCapturing ? "hourglass-outline" : "camera-outline"} label={isCapturing ? "Saving" : "Capture"} onPress={takeScreenshot} active={isCapturing} accent="#34d399" />
            <ActionButton icon="phone-landscape-outline" label="Rotate" onPress={toggleOrientation} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  /* ─── Video (fills screen) ─── */
  videoWrapper: {
    backgroundColor: "#000",
  },
  videoWrapperLandscape: {
    ...StyleSheet.absoluteFillObject,
  },
  videoWrapperPortrait: {
    marginHorizontal: 6,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  webview: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },

  /* ─── Overlay Top Bar ─── */
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  overlayTopInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  overlayTopInnerPortrait: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginHorizontal: 14,
    letterSpacing: 0.2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  liveText: {
    color: "#fca5a5",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  /* Toast */
  toast: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10,14,20,0.9)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
    zIndex: 20,
  },
  toastText: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "600",
  },
  toastSuccess: {
    borderColor: "rgba(52,211,153,0.3)",
  },
  toastError: {
    borderColor: "rgba(248,113,113,0.32)",
  },
  toastTextError: {
    color: "#fca5a5",
  },

  /* Timestamp badge */
  timestampBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 15,
  },
  timestampBadgeLandscape: {
    bottom: 16,
    left: 16,
  },
  timestampBadgePortrait: {
    bottom: 20,
    left: 14,
  },
  timestampText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.3,
  },

  /* Landscape rotate button */
  landscapeRotateBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  /* ─── Bottom Controls Bar ─── */
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10,14,20,0.84)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
      },
      android: { elevation: 12 },
    }),
  },
  controlsBarPortrait: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    paddingTop: 16,
  },
  toastPortrait: {
    bottom: 18,
  },

  /* D-Pad compact */
  dpadCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dpadVertical: {
    gap: 4,
  },
  arrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(24,227,198,0.08)",
    borderWidth: 1,
    borderColor: "rgba(24,227,198,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBtnActive: {
    backgroundColor: "rgba(24,227,198,0.35)",
    borderColor: "rgba(24,227,198,0.75)",
  },

  /* Divider */
  divider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 14,
  },

  /* Actions */
  actionsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionBtn: {
    alignItems: "center",
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 10,
    color: "#7f93a8",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
