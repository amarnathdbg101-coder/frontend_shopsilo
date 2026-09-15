import React from "react";
import { Modal, StyleSheet, Text, View, Pressable, ScrollView, Share } from "react-native";
import { Image } from "expo-image";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { X, Share2, Receipt, FileText, CheckCircle2 } from "lucide-react-native";

interface ParchiViewerModalProps {
  visible: boolean;
  onClose: () => void;
  parchiUrl?: string;
  itemsSummary?: string;
  billNumber?: string;
  amount?: number;
  date?: string;
  customerName?: string;
}

export const ParchiViewerModal: React.FC<ParchiViewerModalProps> = ({
  visible,
  onClose,
  parchiUrl,
  itemsSummary,
  billNumber,
  amount,
  date,
  customerName,
}) => {
  const { colors, isDark } = useThemeColor();

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Parchi Details",
        message: `Udhar Parchi Details:\nCustomer: ${customerName || "Customer"}\nAmount: ${amount ? formatCurrency(amount) : ""}\nDate: ${date || ""}\nItems: ${itemsSummary || "N/A"}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.titleRow}>
              <Receipt size={20} color={colors.primary} />
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Parchi / Bill Vivaran</Text>
                {billNumber ? (
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Bill #{billNumber}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceBorder }]}
            >
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} bounces={false}>
            {/* Amount Banner */}
            {amount != null && (
              <View style={[styles.amountBanner, { backgroundColor: isDark ? "#1e293b" : "#eff6ff" }]}>
                <Text style={[styles.amountLabel, { color: colors.textMuted }]}>
                  Transaction Amount
                </Text>
                <Text style={[styles.amountVal, { color: colors.primary }]}>
                  {formatCurrency(amount)}
                </Text>
                {date ? (
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {new Date(date).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Parchi Slip Photo */}
            {parchiUrl ? (
              <View style={styles.imageSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Original Parchi Photo</Text>
                <View style={[styles.imageWrapper, { borderColor: colors.surfaceBorder }]}>
                  <Image source={{ uri: parchiUrl }} style={styles.parchiImage} contentFit="contain" />
                </View>
              </View>
            ) : null}

            {/* Items Summary Breakdown */}
            {itemsSummary ? (
              <View style={styles.itemsSection}>
                <View style={styles.sectionHeaderRow}>
                  <FileText size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Samaan List (Itemized)</Text>
                </View>
                <View style={[styles.itemsCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.itemsText, { color: colors.text }]}>
                    {itemsSummary}
                  </Text>
                </View>
              </View>
            ) : null}

            {!parchiUrl && !itemsSummary && (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Is transaction ke sath koi alag photo ya items list attach nahi ki gayi hai.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <Pressable
              accessibilityRole="button"
              onPress={handleShare}
              style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            >
              <Share2 size={16} color="#fff" />
              <Text style={styles.shareBtnText}>Parchi Share Karein</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "85%",
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 20,
    gap: 16,
  },
  amountBanner: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 4,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  amountVal: {
    fontSize: 24,
    fontWeight: "900",
  },
  dateText: {
    fontSize: 12,
  },
  imageSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  imageWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#000",
    height: 240,
  },
  parchiImage: {
    width: "100%",
    height: "100%",
  },
  itemsSection: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemsCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemsText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  shareBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
