import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { ShopReview } from "@/features/shops/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Star, MessageSquarePlus, User } from "lucide-react-native";

interface ShopReviewsSectionProps {
  reviews: ShopReview[];
  averageRating: number;
  totalReviews: number;
  onAddReviewPress: () => void;
}

export const ShopReviewsSection: React.FC<ShopReviewsSectionProps> = ({
  reviews,
  averageRating,
  totalReviews,
  onAddReviewPress,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Customer Reviews</Text>
          <View style={styles.ratingBadge}>
            <Star size={14} color="#eab308" fill="#eab308" />
            <Text style={styles.ratingText}>
              {averageRating > 0 ? averageRating.toFixed(1) : "New"} ({totalReviews})
            </Text>
          </View>
        </View>

        <Pressable onPress={onAddReviewPress} style={styles.writeBtn}>
          <MessageSquarePlus size={15} color={colors.primary} />
          <Text style={[styles.writeBtnText, { color: colors.primary }]}>Write Review</Text>
        </Pressable>
      </View>

      {reviews.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No reviews yet. Be the first neighbor to share your experience!
          </Text>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {reviews.slice(0, 5).map((rev) => (
            <View
              key={rev.id}
              style={[
                styles.reviewCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.reviewerRow}>
                <View style={styles.userRow}>
                  <View style={styles.avatar}>
                    <User size={13} color="#64748b" />
                  </View>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {rev.user_name || "Verified Customer"}
                  </Text>
                </View>

                <View style={styles.starsMini}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={11}
                      color="#eab308"
                      fill={s <= rev.rating ? "#eab308" : "transparent"}
                    />
                  ))}
                </View>
              </View>

              {rev.comment ? (
                <Text style={[styles.comment, { color: colors.textMuted }]}>{rev.comment}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 16, marginBottom: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "800" },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fef9c3", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  ratingText: { fontSize: 11, fontWeight: "800", color: "#854d0e" },
  writeBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 6 },
  writeBtnText: { fontSize: 12, fontWeight: "700" },
  emptyBox: { padding: 14, borderWidth: 1, borderRadius: 12, borderStyle: "dashed", alignItems: "center" },
  emptyText: { fontSize: 12, textAlign: "center" },
  reviewsList: { gap: 8 },
  reviewCard: { padding: 12, borderRadius: 12, borderWidth: 1 },
  reviewerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
  userName: { fontSize: 12, fontWeight: "700" },
  starsMini: { flexDirection: "row", gap: 2 },
  comment: { fontSize: 12, lineHeight: 17, marginTop: 2 },
});
