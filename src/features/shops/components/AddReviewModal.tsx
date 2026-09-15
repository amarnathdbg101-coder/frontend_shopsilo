import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, Pressable } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAddShopReview } from "@/features/shops/api/useShopReviews";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, Star, AlertCircle } from "lucide-react-native";

interface AddReviewModalProps {
  shopSlug: string;
  shopName: string;
  visible: boolean;
  onClose: () => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  shopSlug,
  shopName,
  visible,
  onClose,
}) => {
  const { colors } = useThemeColor();
  const { mutate: addReview, isPending } = useAddShopReview(shopSlug);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = () => {
    setErrorMsg("");
    addReview(
      { rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setComment("");
          onClose();
        },
        onError: () => {
          setErrorMsg("Could not submit review. Please try again.");
        },
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Rate {shopName}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            How was your local shopping experience?
          </Text>

          {/* Star selector */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Star
                  size={32}
                  color="#eab308"
                  fill={star <= rating ? "#eab308" : "transparent"}
                />
              </Pressable>
            ))}
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <AlertCircle size={14} color="#ef4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <Input
            label="Comments (Optional)"
            placeholder="Help other neighbors by describing service, quality, or deals..."
            multiline
            numberOfLines={3}
            value={comment}
            onChangeText={setComment}
          />

          <Button
            title="Post Review"
            isLoading={isPending}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 20, elevation: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  starRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 18 },
  starBtn: { padding: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 8, borderRadius: 8, marginBottom: 10 },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600", flex: 1 },
  submitBtn: { marginTop: 12 },
});
