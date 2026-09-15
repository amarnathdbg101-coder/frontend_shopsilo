import React from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Store, Sparkles } from "lucide-react-native";

export const BrandedSplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Brand Icon Circle */}
      <View style={styles.iconCircle}>
        <Store size={48} color="#ffffff" />
      </View>

      {/* Brand Title */}
      <Text style={styles.brandTitle}>ShopSilo</Text>

      <View style={styles.badgeRow}>
        <Sparkles size={12} color="#a78bfa" />
        <Text style={styles.brandBadge}>ShopSilo OS • POWERED BY ShopSilo</Text>
      </View>

      <Text style={styles.tagline}>Your Digital Shop • Fast Counter Commerce</Text>

      {/* Loading Indicator */}
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#a78bfa" />
        <Text style={styles.loadingText}>Opening Store Dashboard...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // Dark professional navy theme
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#f8fafc",
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderColor: "rgba(124, 58, 237, 0.4)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  brandBadge: {
    fontSize: 10,
    fontWeight: "900",
    color: "#c4b5fd",
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
    marginTop: 10,
    textAlign: "center",
  },
  loadingWrap: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
});
