import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
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

  const [micOn, setMicOn] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  }, []);

  const toggleOrientation = async () => {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    setIsLandscape(!isLandscape);
  };

  const takeScreenshot = async () => {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) return;
    const fileUri = FileSystem.cacheDirectory + "snapshot.jpg";
    await FileSystem.downloadAsync(`${API_BASE_URL}/snapshot/${cameraId}`, fileUri);
    await MediaLibrary.saveToLibraryAsync(fileUri);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const moveServo = (x, y) => {
    fetch(`${API_BASE_URL}/servo/${cameraId}?x=${x}&y=${y}`);
  };

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
      <View style={styles.videoWrapper}>
        <WebView
          source={{ uri: `${API_BASE_URL}/stream/${cameraId}?fps=10` }}
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
          injectedJavaScript={`
            (function(){
              var s = document.createElement('style');
              s.textContent = 'html,body{margin:0;padding:0;overflow:hidden!important;width:100vw;height:100vh;background:#000;touch-action:none;-webkit-overflow-scrolling:auto;} img,video,canvas{width:100vw!important;height:100vh!important;object-fit:contain!important;display:block!important;}';
              document.head.appendChild(s);
              document.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
              window.scrollTo(0,0);
            })();
            true;
          `}
          onMessage={() => {}}
        />

        {/* Overlay top bar — hidden in landscape */}
        {!isLandscape && (
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "transparent"]}
            style={styles.overlayTop}
            pointerEvents="box-none"
          >
            <SafeAreaView edges={["top"]} style={styles.overlayTopInner}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.topBarTitle} numberOfLines={1}>{cameraId}</Text>
              <View style={styles.liveBadge}>
                <PulseDot size={7} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        )}

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
        {savedToast && (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={16} color="#34d399" />
            <Text style={styles.toastText}>Saved to gallery</Text>
          </View>
        )}
      </View>

      {/* ─── Bottom Controls — hidden in landscape ─── */}
      {!isLandscape && (
        <View style={styles.controlsBar}>
          {/* D-Pad compact */}
          <View style={styles.dpadCompact}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => moveServo(20, 90)} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="#18e3c6" />
            </TouchableOpacity>
            <View style={styles.dpadVertical}>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => moveServo(90, 20)} activeOpacity={0.7}>
                <Ionicons name="chevron-up" size={20} color="#18e3c6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => moveServo(90, 160)} activeOpacity={0.7}>
                <Ionicons name="chevron-down" size={20} color="#18e3c6" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => moveServo(160, 90)} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color="#18e3c6" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <ActionButton icon={micOn ? "mic" : "mic-off"} label={micOn ? "Mute" : "Mic"} onPress={() => setMicOn(!micOn)} active={micOn} accent="#60a5fa" />
            <ActionButton icon="camera-outline" label="Capture" onPress={takeScreenshot} />
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
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
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
    backgroundColor: "#0a0e14",
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
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
