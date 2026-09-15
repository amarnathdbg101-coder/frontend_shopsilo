import React from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/utils/format";
import { ShoppingBag, ArrowRight } from "lucide-react-native";

export const FloatingCartBar: React.FC = () => {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = getTotalPrice();

  if (totalCount === 0) return null;

  return (
    <View style={styles.floatingContainer}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/cart" as never)}
        style={styles.cartBar}
      >
        <View style={styles.cartLeft}>
          <View style={styles.iconCircle}>
            <ShoppingBag size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.itemCountText}>
              {totalCount} {totalCount === 1 ? "Item" : "Items"} Added
            </Text>
            <Text style={styles.totalPriceText}>
              {formatCurrency(totalPrice)}
            </Text>
          </View>
        </View>

        <View style={styles.cartRight}>
          <Text style={styles.checkoutText}>View Cart</Text>
          <ArrowRight size={16} color="#ffffff" />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 90 : 70,
    left: 14,
    right: 14,
    zIndex: 99,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#16a34a", // Blinkit green theme
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cartLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemCountText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "700",
  },
  totalPriceText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  cartRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkoutText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
