import React from "react";
import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LowStockItem } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useDeleteProduct } from "../api/useAddProduct";
import { useDismissStockAlert } from "../api/useInventory";
import { formatCurrency } from "@/utils/format";
import { Image } from "expo-image";
import { resolveImageUrl } from "@/components/AppImage";
import { RefreshCw, AlertTriangle, Trash2, ClipboardList, Pencil, PackageOpen } from "lucide-react-native";

const LOCAL_PROCUREMENT_KEY = "shopsilo_local_procurement_items";

interface InventoryItemCardProps {
  item: LowStockItem;
  onAdjust: (item: LowStockItem) => void;
  onEdit?: (item: LowStockItem) => void;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  onAdjust,
  onEdit,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const deleteMutation = useDeleteProduct();

  const productId = item.product_id || item.id || "";
  const productName = item.product_name || item.name || "Product";
  const stockVal = item.current_stock ?? item.stock_quantity ?? 0;
  const threshold = item.min_threshold || item.low_stock_threshold || 5;
  const isLow = stockVal <= threshold;
  const priceVal = item.price || 0;

  const handleAddToMandiList = async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_PROCUREMENT_KEY);
      let existing: any[] = [];
      if (raw) {
        try { existing = JSON.parse(raw); } catch { /* */ }
      }

      const newItem = {
        id: `proc_stock_${Date.now()}`,
        name: productName,
        qty: "+10 units (Stock Alert)",
        notes: `Low Stock Alert (${stockVal} left in store)`,
        demandCount: 1,
        addedAt: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      };

      const updated = [newItem, ...existing];
      await AsyncStorage.setItem(LOCAL_PROCUREMENT_KEY, JSON.stringify(updated));

      Alert.alert(
        "Added to Mandi List 📝",
        `"${productName}" (+10 units) added to your Mandi Khareed List!`,
        [
          { text: "OK" },
          { text: "Open Mandi List", onPress: () => router.push("/merchant/procurement-list" as never) },
        ]
      );
    } catch {
      Alert.alert("Notice", "Unable to save item to Mandi list.");
    }
  };

  const handleDeleteProduct = () => {
    if (!productId) return;
    Alert.alert(
      "Confirm Delete Product",
      `Are you sure you want to delete "${productName}" from your store catalog?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Product",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(productId, {
              onSuccess: () => Alert.alert("Product Deleted", "Item removed from catalog."),
              onError: (err: any) => Alert.alert("Delete Failed", err?.message || "Could not delete product."),
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      {/* Stock Status Badge */}
      <View style={styles.topBadgeRow}>
        <View style={[styles.badge, { backgroundColor: isLow ? "#fee2e2" : "#dcfce7" }]}>
          {isLow ? <AlertTriangle size={11} color="#dc2626" /> : null}
          <Text style={[styles.stockCount, { color: isLow ? "#dc2626" : "#16a34a" }]}>
            {stockVal} {isLow ? "left" : "in stock"}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleDeleteProduct}
          disabled={deleteMutation.isPending}
          style={styles.trashIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={13} color="#ef4444" />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${productName}`}
        onPress={() => productId && router.push(`/product/${productId}` as never)}
        style={styles.imageWrap}
      >
        {item.image_url ? (
          <Image source={{ uri: resolveImageUrl(item.image_url) }} style={styles.productImage} contentFit="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
            <PackageOpen size={24} color={colors.textMuted} />
          </View>
        )}
      </Pressable>

      {/* Product Title & Price (Tap opens Product Detail Screen) */}
      <Pressable
        accessibilityRole="button"
        onPress={() => productId && router.push(`/product/${productId}` as never)}
        style={styles.titleSection}
      >
        <Text numberOfLines={2} style={[styles.name, { color: colors.text }]}>
          {productName}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatCurrency(priceVal)}
        </Text>
        <Text numberOfLines={1} style={[styles.sku, { color: colors.textMuted }]}>
          SKU: {item.sku || "N/A"}
        </Text>
      </Pressable>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onEdit ? onEdit(item) : (productId && router.push(`/product/${productId}` as never))}
          style={({ pressed }) => [styles.btn, { backgroundColor: "rgba(124, 58, 237, 0.12)" }, pressed && styles.pressed]}
        >
          <Pencil size={12} color="#7c3aed" />
          <Text style={[styles.btnText, { color: "#7c3aed" }]}>Edit ✏️</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => onAdjust(item)}
          style={({ pressed }) => [styles.btn, { backgroundColor: "rgba(37,99,235,0.12)" }, pressed && styles.pressed]}
        >
          <RefreshCw size={12} color="#2563eb" />
          <Text style={[styles.btnText, { color: "#2563eb" }]}>Stock</Text>
        </Pressable>

        {isLow && (
          <Pressable
            accessibilityRole="button"
            onPress={handleAddToMandiList}
            style={({ pressed }) => [styles.btn, { backgroundColor: "rgba(16, 185, 129, 0.12)" }, pressed && styles.pressed]}
          >
            <ClipboardList size={12} color="#10b981" />
            <Text style={[styles.btnText, { color: "#10b981" }]}>Mandi</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    margin: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 6,
    maxWidth: "48%",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  topBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockCount: {
    fontSize: 10,
    fontWeight: "800",
  },
  trashIconBtn: {
    padding: 2,
  },
  imageWrap: { width: "100%", height: 88, borderRadius: 10, overflow: "hidden", marginBottom: 2 },
  productImage: { width: "100%", height: "100%" },
  imagePlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  titleSection: {
    gap: 2,
    marginVertical: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
    height: 32,
  },
  price: {
    fontSize: 14,
    fontWeight: "900",
  },
  sku: {
    fontSize: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 32,
  },
  btnText: {
    fontSize: 10,
    fontWeight: "700",
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
