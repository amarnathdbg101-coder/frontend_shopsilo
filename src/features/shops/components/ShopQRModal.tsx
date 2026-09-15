import React from "react";
import { Modal, StyleSheet, Text, View, Pressable, Image, Share } from "react-native";
import { Shop } from "@/features/shops/types";
import { Config } from "@/constants/config";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, QrCode, Share2, Store } from "lucide-react-native";

interface ShopQRModalProps {
  shop: Shop;
  visible: boolean;
  onClose: () => void;
}

export const ShopQRModal: React.FC<ShopQRModalProps> = ({ shop, visible, onClose }) => {
  const { colors } = useThemeColor();
  const qrUrl = `${Config.API_BASE_URL}/shops/${shop.slug}/qr`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: shop.name,
        message: `Visit ${shop.name} on ShopSilo! Scan store QR code or view storefront: https://shopsilo.in/shop/${shop.slug}`,
      });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <QrCode size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Storefront QR</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.qrWrap}>
            <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
          </View>

          <View style={styles.storeInfo}>
            <View style={styles.nameRow}>
              <Store size={14} color={colors.primary} />
              <Text numberOfLines={1} style={[styles.shopName, { color: colors.text }]}>{shop.name}</Text>
            </View>
            <Text style={[styles.desc, { color: colors.textMuted }]}>
              Show this QR at the counter to quickly verify reservations and access live catalog.
            </Text>
          </View>

          <Pressable onPress={handleShare} style={[styles.shareBtn, { backgroundColor: colors.primary }]}>
            <Share2 size={15} color={colors.primaryForeground} />
            <Text style={[styles.shareText, { color: colors.primaryForeground }]}>Share Store Link</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  card: { borderRadius: 16, borderWidth: 1, padding: 18, alignItems: "center", gap: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "800" },
  qrWrap: { padding: 12, backgroundColor: "#ffffff", borderRadius: 16, elevation: 4 },
  qrImage: { width: 180, height: 180 },
  storeInfo: { alignItems: "center", gap: 4, width: "100%" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  shopName: { fontSize: 15, fontWeight: "800" },
  desc: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, width: "100%" },
  shareText: { fontSize: 13, fontWeight: "800" },
});
