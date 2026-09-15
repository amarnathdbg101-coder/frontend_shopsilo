import React from "react";
import { Modal, StyleSheet, Text, View, Pressable, Share } from "react-native";
import { Image } from "expo-image";
import { Shop } from "@/features/shops/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/Button";
import { X, Share2, Store } from "lucide-react-native";

interface ShopQRModalProps {
  visible: boolean;
  onClose: () => void;
  shop?: Shop;
}

export const ShopQRModal: React.FC<ShopQRModalProps> = ({
  visible,
  onClose,
  shop,
}) => {
  const { colors } = useThemeColor();
  const shopUrl = `https://shopsilo.app/shop/${shop?.slug || shop?.id || "local"}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shopUrl)}`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: shop?.name || "Visit My Shop",
        message: `Order & Pickup directly from *${shop?.name}*!\nVisit: ${shopUrl}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Store size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Counter Pickup QR</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Customers can scan this QR at your counter to order or check store catalog.
          </Text>

          <View style={styles.qrContainer}>
            <Image
              source={{ uri: qrUrl }}
              style={styles.qrImage}
              contentFit="contain"
            />
          </View>

          <Text style={[styles.storeName, { color: colors.text }]}>
            {shop?.name || "Local Store"}
          </Text>
          <Text style={[styles.linkText, { color: colors.primary }]}>{shopUrl}</Text>

          <Button
            title="Share Shop Link"
            variant="primary"
            leftIcon={<Share2 size={18} color="#fff" />}
            onPress={handleShare}
            style={styles.shareBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  container: { borderRadius: 20, padding: 20, alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", width: "100%", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 13, textAlign: "center", marginTop: 8, marginBottom: 16, paddingHorizontal: 10 },
  qrContainer: { padding: 12, backgroundColor: "#fff", borderRadius: 16, elevation: 3, marginBottom: 12 },
  qrImage: { width: 180, height: 180 },
  storeName: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: "600", marginTop: 4, marginBottom: 16 },
  shareBtn: { width: "100%" },
});
