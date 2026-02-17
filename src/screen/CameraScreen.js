import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { API_BASE_URL } from "../config/api";

export default function CameraScreen({ route, navigation }) {
  const { cameraId } = route.params;

  const [micOn, setMicOn] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 🔁 Default Portrait
  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT
    );
  }, []);

  // 🟢 Live pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // 🔄 Toggle Orientation
  const toggleOrientation = async () => {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      );
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    }
    setIsLandscape(!isLandscape);
  };

  // 📸 Screenshot
  const takeScreenshot = async () => {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) return;

    const fileUri = FileSystem.cacheDirectory + "snapshot.jpg";
    await FileSystem.downloadAsync(
      `${API_BASE_URL}/snapshot/${cameraId}`,
      fileUri
    );
    await MediaLibrary.saveToLibraryAsync(fileUri);
  };

  // 🎮 Simple Direction Controls
  const moveServo = (x, y) => {
    fetch(`${API_BASE_URL}/servo/${cameraId}?x=${x}&y=${y}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Stream */}
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
        />

        {/* LIVE badge */}
        <View style={styles.liveBadge}>
          <Animated.View
            style={[
              styles.liveDot,
              { transform: [{ scale: pulseAnim }] }
            ]}
          />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Controls Panel */}
      <View style={styles.controlsPanel}>
        <Text style={styles.cameraTitle}>{cameraId}</Text>

        {/* Direction Buttons */}
        <View style={styles.dpad}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => moveServo(90, 20)}
          >
            <Ionicons name="arrow-up" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.middleRow}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => moveServo(20, 90)}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => moveServo(160, 90)}
            >
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => moveServo(90, 160)}
          >
            <Ionicons name="arrow-down" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Extra Buttons */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => setMicOn(!micOn)}
          >
            <Ionicons
              name={micOn ? "mic" : "mic-off"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={takeScreenshot}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={toggleOrientation}
          >
            <Ionicons name="sync" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1016" },

  videoWrapper: {
    flex: 1,
    backgroundColor: "#000"
  },
  webview: {
    flex: 1
  },

  liveBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center"
  },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginRight: 6
  },

  liveText: {
    color: "#fff",
    fontWeight: "bold"
  },

  controlsPanel: {
    flex: 1,
    padding: 20
  },

  cameraTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20
  },

  dpad: {
    alignItems: "center",
    marginBottom: 30
  },

  middleRow: {
    flexDirection: "row",
    marginVertical: 10
  },

  arrowButton: {
    backgroundColor: "#1e293b",
    padding: 18,
    borderRadius: 60,
    marginHorizontal: 12
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-around"
  },

  smallButton: {
    backgroundColor: "#334155",
    padding: 14,
    borderRadius: 40
  }
});
