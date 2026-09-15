import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ShopOffer } from "../types";
import { Clock, CheckCircle, Tag, Pencil, Trash2 } from "lucide-react-native";

interface OfferItemCardProps {
  offer: ShopOffer;
  onEdit?: (offer: ShopOffer) => void;
  onDelete?: (offer: ShopOffer) => void;
}

export const OfferItemCard: React.FC<OfferItemCardProps> = ({
  offer,
  onEdit,
  onDelete,
}) => {
  const { colors } = useThemeColor();

  const isLive = offer.is_active !== false;
  const expiryDate = offer.expires_at ? new Date(offer.expires_at).toLocaleDateString("en-IN") : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Tag size={12} color="#fff" />
          <Text style={styles.badgeText}>{offer.discount_text}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: isLive ? "rgba(16, 185, 129, 0.12)" : "rgba(148, 163, 184, 0.12)" }]}>
          <View style={[styles.dot, { backgroundColor: isLive ? "#10b981" : "#94a3b8" }]} />
          <Text style={[styles.statusText, { color: isLive ? "#047857" : "#64748b" }]}>
            {isLive ? "Live in Feed" : "Inactive"}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{offer.title}</Text>

      {offer.description ? (
        <Text style={[styles.description, { color: colors.textMuted }]}>
          {offer.description}
        </Text>
      ) : null}

      <View style={[styles.footerRow, { borderTopColor: colors.surfaceBorder }]}>
        {expiryDate ? (
          <View style={styles.expiryCol}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={[styles.expiryText, { color: colors.textMuted }]}>
              Expires: {expiryDate}
            </Text>
          </View>
        ) : (
          <View style={styles.expiryCol}>
            <CheckCircle size={12} color="#10b981" />
            <Text style={[styles.expiryText, { color: "#10b981" }]}>Ongoing deal</Text>
          </View>
        )}

        {/* Action Buttons for Merchant */}
        <View style={styles.actionGroup}>
          {onEdit && (
            <Pressable
              accessibilityRole="button"
              onPress={() => onEdit(offer)}
              style={[styles.actionIconBtn, { backgroundColor: "rgba(37, 99, 235, 0.12)" }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Pencil size={14} color="#2563eb" />
            </Pressable>
          )}

          {onDelete && (
            <Pressable
              accessibilityRole="button"
              onPress={() => onDelete(offer)}
              style={[styles.actionIconBtn, { backgroundColor: "#fee2e2" }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={14} color="#dc2626" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expiryCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
});
