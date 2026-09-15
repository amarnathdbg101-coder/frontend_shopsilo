import React from "react";
import { StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { Shop } from "@/features/shops/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { MessageSquare, Phone, Navigation } from "lucide-react-native";

interface ShopActionButtonsProps {
  shop: Shop;
}

export const ShopActionButtons: React.FC<ShopActionButtonsProps> = ({ shop }) => {
  const { colors } = useThemeColor();

  const handleWhatsApp = () => {
    const url =
      shop.whatsapp_url ||
      (shop.whatsapp_number || shop.phone
        ? `https://wa.me/91${shop.whatsapp_number || shop.phone}?text=Hello%20${encodeURIComponent(shop.name)},%20I%20found%20your%20store%20on%20ShopSilo!`
        : undefined);
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleCall = () => {
    if (shop.phone) Linking.openURL(`tel:${shop.phone}`).catch(() => {});
  };

  const handleMaps = () => {
    const mapsUrl =
      shop.google_maps_url ||
      (shop.latitude && shop.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + " " + (shop.address || "") + " " + (shop.city || ""))}`);
    Linking.openURL(mapsUrl).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {(shop.whatsapp_url || shop.whatsapp_number || shop.phone) && (
        <Pressable onPress={handleWhatsApp} style={[styles.btn, styles.waBtn]}>
          <MessageSquare size={15} color="#ffffff" />
          <Text style={[styles.btnText, { color: "#ffffff" }]}>WhatsApp</Text>
        </Pressable>
      )}

      {shop.phone && (
        <Pressable onPress={handleCall} style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
          <Phone size={14} color={colors.primary} />
          <Text style={[styles.btnText, { color: colors.text }]}>Call</Text>
        </Pressable>
      )}

      <Pressable onPress={handleMaps} style={[styles.btn, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
        <Navigation size={14} color="#2563eb" />
        <Text style={[styles.btnText, { color: colors.text }]}>Directions</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  waBtn: { backgroundColor: "#25D366", borderColor: "#25D366" },
  btnText: { fontSize: 12, fontWeight: "800" },
});
