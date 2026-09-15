import React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Product } from "@/features/catalog/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/store/useAuthStore";
import { Bookmark, Handshake, BellRing, Pencil } from "lucide-react-native";

interface ProductActionFooterProps {
  product: Product;
  onReserve: () => void;
  onBargain: () => void;
  onNotifyMe: () => void;
  onEditProduct?: () => void;
  reservedSuccess: boolean;
}

export const ProductActionFooter: React.FC<ProductActionFooterProps> = ({
  product,
  onReserve,
  onBargain,
  onNotifyMe,
  onEditProduct,
  reservedSuccess,
}) => {
  const { colors } = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const isMerchant = user?.role === "shop" || user?.role === "admin";
  const isOutOfStock = product.stock_quantity <= 0;

  // Shop Owner Footer Action: Hide Reserve & Bargain, Show 1-Tap Edit Button
  if (isMerchant) {
    return (
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
        <Button
          title="Edit Product Details & Photos ✏️"
          size="lg"
          variant="primary"
          onPress={onEditProduct}
          leftIcon={<Pencil size={18} color="#ffffff" />}
          style={{ backgroundColor: "#7c3aed", width: "100%" }}
        />
      </View>
    );
  }

  // Customer Footer Action: Reserve & Bargain
  return (
    <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
      {isOutOfStock ? (
        <Button
          title="Notify Me When In Stock"
          size="lg"
          variant="outline"
          onPress={onNotifyMe}
          leftIcon={<BellRing size={18} color={colors.primary} />}
          style={styles.fullBtn}
        />
      ) : (
        <View style={styles.btnRow}>
          <Button
            title={reservedSuccess ? "Reserved!" : "Reserve"}
            size="lg"
            disabled={reservedSuccess}
            onPress={onReserve}
            leftIcon={<Bookmark size={18} color="#ffffff" />}
            style={styles.flexBtn}
          />
          {product.allow_bargain !== false && (
            <Button
              title="Bargain"
              size="lg"
              variant="secondary"
              onPress={onBargain}
              leftIcon={<Handshake size={18} color={colors.text} />}
              style={styles.flexBtn}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  fullBtn: {
    width: "100%",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  flexBtn: {
    flex: 1,
  },
});
