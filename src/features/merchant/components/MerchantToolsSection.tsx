import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { MerchantToolCard } from "./MerchantToolCard";
import { Receipt, PackagePlus, ScanBarcode, Menu, ChevronRight } from "lucide-react-native";

interface MerchantToolsSectionProps {
  onOpenDrawer: () => void;
  onPriceCheckPress: () => void;
}

export const MerchantToolsSection: React.FC<MerchantToolsSectionProps> = ({
  onOpenDrawer,
  onPriceCheckPress,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  return (
    <>
      <View style={styles.sectionHeadingWrap}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }]}>MOVE FASTER</Text>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Counter quick actions</Text>
        </View>
        <Text style={[styles.sectionHint, { color: colors.textMuted }]}>Common tasks</Text>
      </View>

      <View style={styles.toolsList}>
        <MerchantToolCard
          icon={<Receipt size={24} color="#2563eb" />}
          title="Fast POS Billing"
          description="Quick SKU scan, Cash/UPI/Split checkout & WhatsApp receipt"
          badgeText="Fast Billing"
          onPress={() => router.push("/merchant/pos")}
        />
        <MerchantToolCard
          icon={<ScanBarcode size={24} color="#7c3aed" />}
          title="Scan & Price Check"
          description="Instant barcode & SKU scanner to verify retail price, MRP & live stock"
          badgeText="Price & Stock"
          onPress={onPriceCheckPress}
        />
        <MerchantToolCard
          icon={<PackagePlus size={24} color="#059669" />}
          title="Add New Product"
          description="Add items with prices, categories & stock to your catalog"
          badgeText="Catalog"
          onPress={() => router.push("/merchant/add-product")}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onOpenDrawer}
        style={[styles.moreToolsBanner, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: "rgba(79, 70, 229, 0.12)" }]}>
          <Menu size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.moreToolsTitle, { color: colors.text }]}>All Dukan Features in Side Menu</Text>
          <Text style={[styles.moreToolsSub, { color: colors.textMuted }]}>
            Kharcha (Expenses), Asli Munafa, Khata Ledger, Offers & Settings
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeadingWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12, marginTop: 4 },
  sectionEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginBottom: 3 },
  sectionHeading: { fontSize: 18, fontWeight: "900" },
  sectionHint: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  toolsList: { gap: 10, marginBottom: 14 },
  moreToolsBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  moreToolsTitle: { fontSize: 13, fontWeight: "700" },
  moreToolsSub: { fontSize: 11, marginTop: 2 },
});
