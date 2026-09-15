import React from "react";
import { Modal, StyleSheet, Text, View, Pressable, Share } from "react-native";
import { Image } from "expo-image";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, Share2, QrCode, ShieldCheck, UserCheck } from "lucide-react-native";

interface CustomerKhataQRModalProps {
  visible: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
}

export const CustomerKhataQRModal: React.FC<CustomerKhataQRModalProps> = ({
  visible,
  onClose,
  customerName,
  customerPhone,
}) => {
  const { colors, isDark } = useThemeColor();

  const cleanPhone = customerPhone.replace(/[^0-9]/g, "").slice(-10);
  const qrData = `shopsilo://khata/customer?phone=${cleanPhone}&name=${encodeURIComponent(customerName || "Customer")}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Mera Khata QR - " + customerName,
        message: `Mera Khata Passbook QR Code: ${customerName} (${cleanPhone})\nShopsilo App`,
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
              <QrCode size={22} color={colors.primary} />
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Mera Khata QR</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Counter par turant panna khulwane ke liye
                </Text>
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

          {/* QR Code Presentation Box */}
          <View style={styles.body}>
            <View style={[styles.qrWrapper, { borderColor: colors.surfaceBorder, backgroundColor: "#fff" }]}>
              <Image source={{ uri: qrUrl }} style={styles.qrImage} contentFit="contain" />
            </View>

            <View style={styles.infoCard}>
              <View style={styles.nameRow}>
                <UserCheck size={18} color={colors.primary} />
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {customerName || "Aapka Khata"}
                </Text>
              </View>
              <Text style={[styles.customerPhone, { color: colors.textMuted }]}>
                📞 +91 {cleanPhone}
              </Text>
            </View>

            <View style={[styles.instructionBox, { backgroundColor: isDark ? "#1e293b" : "#f0fdf4" }]}>
              <ShieldCheck size={18} color="#16a34a" />
              <Text style={[styles.instructionText, { color: isDark ? "#94a3b8" : "#166534" }]}>
                Dukandar ko ye QR dikhayein. Dukandar ke scan karte hi aapka passbook panna 1 second me khul jayega!
              </Text>
            </View>
          </View>

          {/* Bottom Share Button */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <Pressable
              accessibilityRole="button"
              onPress={handleShare}
              style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            >
              <Share2 size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share / Save QR</Text>
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
    padding: 20,
  },
  container: {
    borderRadius: 24,
    overflow: "hidden",
    maxWidth: 420,
    width: "100%",
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
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  infoCard: {
    alignItems: "center",
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "700",
  },
  customerPhone: {
    fontSize: 14,
    fontWeight: "500",
  },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    width: "100%",
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  shareBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
