import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AdminStatsResponse } from "@/features/admin/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Users, Store, Package, Layers } from "lucide-react-native";

interface AdminStatGridProps {
  stats?: AdminStatsResponse;
}

export const AdminStatGrid: React.FC<AdminStatGridProps> = ({ stats }) => {
  const { colors } = useThemeColor();

  return (
    <View style={styles.statsGrid}>
      <View
        style={[
          styles.statCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <Users size={20} color={colors.primary} />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {stats?.total_users ?? 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Total Users
        </Text>
      </View>

      <View
        style={[
          styles.statCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <Store size={20} color="#16a34a" />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {stats?.total_shops ?? 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Active Shops
        </Text>
      </View>

      <View
        style={[
          styles.statCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <Package size={20} color="#f59e0b" />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {stats?.total_products ?? 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Live Products
        </Text>
      </View>

      <View
        style={[
          styles.statCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <Layers size={20} color="#8b5cf6" />
        <Text style={[styles.statNumber, { color: colors.text }]}>
          {stats?.total_categories ?? 0}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>
          Categories
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});
