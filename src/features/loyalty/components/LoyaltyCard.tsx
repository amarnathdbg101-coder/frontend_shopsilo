import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useUserLoyalty } from "@/features/loyalty/api/useLoyalty";
import { Trophy, Award, Sparkles } from "lucide-react-native";

export const LoyaltyCard: React.FC = () => {
  const { data: loyalty } = useUserLoyalty();

  const points = loyalty?.points ?? 0;
  const tier = loyalty?.tier || "Bronze";
  const nextPoints = loyalty?.next_tier_points_needed ?? 100;

  const isGold = tier.toLowerCase().includes("gold");
  const isSilver = tier.toLowerCase().includes("silver");

  const badgeColor = isGold ? "#f59e0b" : isSilver ? "#64748b" : "#b45309";
  const badgeBg = isGold ? "#fef3c7" : isSilver ? "#f1f5f9" : "#ffedd5";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Trophy size={18} color="#eab308" />
          <Text style={styles.cardTitle}>Local Loyalty Rewards</Text>
        </View>

        <View style={[styles.tierBadge, { backgroundColor: badgeBg }]}>
          <Award size={12} color={badgeColor} />
          <Text style={[styles.tierText, { color: badgeColor }]}>
            {tier.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.pointsRow}>
        <Text style={styles.pointsNumber}>{points}</Text>
        <Text style={styles.pointsLabel}>Reward Points</Text>
      </View>

      {nextPoints > 0 ? (
        <View style={styles.progressRow}>
          <Sparkles size={13} color="#94a3b8" />
          <Text style={styles.progressText}>
            {nextPoints} more points to unlock the next VIP tier & secret offers!
          </Text>
        </View>
      ) : (
        <View style={styles.progressRow}>
          <Sparkles size={13} color="#22c55e" />
          <Text style={[styles.progressText, { color: "#22c55e" }]}>
            Maximum VIP Tier unlocked! Enjoy exclusive counter discounts.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "800",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 8,
  },
  pointsNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#f8fafc",
  },
  pointsLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 8,
  },
  progressText: {
    fontSize: 11,
    color: "#94a3b8",
    flex: 1,
  },
});
