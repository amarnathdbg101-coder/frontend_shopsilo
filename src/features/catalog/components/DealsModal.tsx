import React from "react";
import { StyleSheet, Text, View, Modal, Pressable, ScrollView } from "react-native";
import { useAllOffers } from "@/features/loyalty/api/useLoyalty";
import { OfferCard } from "@/features/loyalty/components/OfferCard";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LoadingState } from "@/components/LoadingState";
import { Tag, X, Sparkles } from "lucide-react-native";

interface DealsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DealsModal: React.FC<DealsModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemeColor();
  const { data: offers = [], isLoading } = useAllOffers();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.headerLeft}>
              <Tag size={20} color="#ea580c" />
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  Marketplace Deals & Offers
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Exclusive counter discounts from neighborhood stores
                </Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {isLoading ? (
            <LoadingState message="Discovering live offers..." />
          ) : offers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Sparkles size={36} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Active Deals Right Now
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                Local shops post discounts frequently. Check back soon or visit shops directly!
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onPress={onClose} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  headerLeft: { flexDirection: "row", gap: 10, flex: 1 },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  scroll: { maxHeight: 420 },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13, textAlign: "center", paddingHorizontal: 20 },
});
