import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Store, ShieldAlert } from "lucide-react-native";

interface ProfileRoleCardsProps {
  role?: string;
}

export const ProfileRoleCards: React.FC<ProfileRoleCardsProps> = ({ role }) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const isAdmin = role === "admin";
  const isShopOwner = role === "shop";

  if (!isAdmin && !isShopOwner) return null;

  return (
    <View>
      {/* Super-Admin Access Card */}
      {isAdmin && (
        <View style={[styles.sectionCard, { backgroundColor: "#fef3c7", borderColor: "#fde68a" }]}>
          <View style={styles.cardHeaderRow}>
            <ShieldAlert size={20} color="#b45309" />
            <Text style={[styles.sectionTitle, { color: "#92400e" }]}>Super-Admin Access</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: "#b45309" }]}>
            Platform governance, moderation, and system statistics
          </Text>
          <Button
            title="Open Admin Command Center"
            size="md"
            onPress={() => router.push("/admin" as never)}
            style={{ backgroundColor: "#b45309" }}
          />
        </View>
      )}

      {/* Shop Owner Hub Card */}
      {isShopOwner && (
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Store size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Merchant Hub</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Manage counter POS billing, customer Khata, and daily sales
          </Text>
          <Button
            title="Open Merchant OS"
            size="md"
            onPress={() => router.push("/merchant/dashboard")}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16, gap: 4 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionSubtitle: { fontSize: 13, marginBottom: 8 },
});
