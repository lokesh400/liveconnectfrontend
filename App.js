import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "./src/screen/Dashboard";
import CameraScreen from "./src/screen/CameraScreen";

const Stack = createNativeStackNavigator();

function LaunchScreen() {
  const logoScale = useRef(new Animated.Value(0.78)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(16)).current;
  const glowOpacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(220),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslate, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.65,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.25,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, [glowOpacity, logoOpacity, logoScale, titleOpacity, titleTranslate]);

  return (
    <View style={styles.launchContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#071116" />
      <Animated.View style={[styles.launchGlow, { opacity: glowOpacity }]} />
      <Animated.Image
        source={require("./assets/icon.png")}
        style={[
          styles.launchLogo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
        resizeMode="contain"
      />
      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslate }],
          alignItems: "center",
        }}
      >
        <Text style={styles.launchTitle}>LiveConnect</Text>
        <Text style={styles.launchSubtitle}>Secure live camera access</Text>
      </Animated.View>
    </View>
  );
}

export default function App() {
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLaunchScreen(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (showLaunchScreen) {
    return <LaunchScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Camera" component={CameraScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  launchContainer: {
    flex: 1,
    backgroundColor: "#071116",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  launchGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(24, 227, 198, 0.18)",
  },
  launchLogo: {
    width: 132,
    height: 132,
    marginBottom: 20,
  },
  launchTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  launchSubtitle: {
    marginTop: 8,
    color: "#8fb5b2",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
