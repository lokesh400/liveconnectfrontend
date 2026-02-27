import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TABS = [
  { route: "Dashboard", label: "Home", icon: "home", iconOutline: "home-outline" },
  // { route: "LiveGrid", label: "Live", icon: "grid", iconOutline: "grid-outline" },
  { route: "Settings", label: "Settings", icon: "settings", iconOutline: "settings-outline" },
];

export default function BottomNav({ navigation, active }) {
  const go = (route) => {
    if (!navigation?.navigate) return;
    navigation.navigate(route);
  };

  return (
    <View style={styles.navbar}>
      {TABS.map((tab) => {
        const isActive = active === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => go(tab.route)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActive ? tab.icon : tab.iconOutline}
              size={20}
              color={isActive ? "#18e3c6" : "#7f93a8"}
              style={{ marginBottom: 3 }}
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 22,
    backgroundColor: "rgba(10, 14, 20, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
      },
      android: { elevation: 12 },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: "rgba(24, 227, 198, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(24, 227, 198, 0.25)",
  },
  navText: {
    color: "#7f93a8",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  navTextActive: {
    color: "#dffcf6",
    fontWeight: "700",
  },
});
