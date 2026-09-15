import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useFavoriteShopsStore } from "@/store/useFavoriteShopsStore";
import { Shop } from "@/features/shops/types";
import { ArrowLeft, Heart, QrCode } from "lucide-react-native";

interface ShopTopNavProps {
  title: string;
  shop?: Shop;
  onQRPress?: () => void;
}

export const ShopTopNav: React.FC<ShopTopNavProps> = ({ title, shop, onQRPress }) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const isFavorite = useFavoriteShopsStore((s) => (shop ? s.isFavorite(shop.id) : false));
  const toggleFavorite = useFavoriteShopsStore((s) => s.toggleFavorite);

  const handleFavoritePress = () => {
    if (shop) toggleFavorite(shop);
  };

  return (
    <View style={styles.navBar}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.backBtn}
      >
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <Text numberOfLines={1} style={[styles.navTitle, { color: colors.text }]}>
        {title}
      </Text>
      {shop && (
        <View style={styles.rightActions}>
          {onQRPress && (
            <Pressable
              accessibilityRole="button"
              onPress={onQRPress}
              style={styles.actionBtn}
            >
              <QrCode size={20} color={colors.text} />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={handleFavoritePress}
            style={styles.actionBtn}
          >
            <Heart
              size={21}
              color={isFavorite ? "#ef4444" : colors.text}
              fill={isFavorite ? "#ef4444" : "transparent"}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
});

