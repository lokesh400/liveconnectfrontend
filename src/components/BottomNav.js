import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function BottomNav({ navigation, active }) {
  const go = (route) => {
    if (!navigation?.navigate) return;
    navigation.navigate(route);
  };

  return (
    <View style={styles.navbar}>
      <TouchableOpacity
        style={[styles.navItem, active === "Dashboard" && styles.navItemActive]}
        onPress={() => go("Dashboard")}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.navText, active === "Dashboard" && styles.navTextActive]}
        >
          Dashboard
        </Text>
      </TouchableOpacity>
      {/* <TouchableOpacity
        style={[styles.navItem, active === "LiveGrid" && styles.navItemActive]}
        onPress={() => go("LiveGrid")}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.navText, active === "LiveGrid" && styles.navTextActive]}
        >
          Live
        </Text>
      </TouchableOpacity> */}
      <TouchableOpacity
        style={[styles.navItem, active === "Settings" && styles.navItemActive]}
        onPress={() => go("Settings")}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.navText, active === "Settings" && styles.navTextActive]}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "rgba(12, 17, 24, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 14
  },
  navItemActive: {
    backgroundColor: "rgba(24, 227, 198, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(24, 227, 198, 0.4)"
  },
  navText: {
    color: "#9fb3c8",
    fontSize: 12,
    letterSpacing: 0.5
  },
  navTextActive: {
    color: "#dffcf6",
    fontWeight: "600"
  }
});
