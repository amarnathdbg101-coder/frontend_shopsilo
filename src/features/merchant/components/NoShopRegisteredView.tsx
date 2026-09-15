import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Store, RefreshCw } from "lucide-react-native";

interface NoShopRegisteredViewProps {
  onRetry: () => void;
}

export const NoShopRegisteredView: React.FC<NoShopRegisteredViewProps> = ({ onRetry }) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  return (
    <View style={styles.noShopContainer}>
      <View style={[styles.noShopIconCircle, { backgroundColor: "rgba(37, 99, 235, 0.1)" }]}>
        <Store size={48} color={colors.primary} />
      </View>
      <Text style={[styles.noShopTitle, { color: colors.text }]}>
        No Shop Registered Yet
      </Text>
      <Text style={[styles.noShopSubtitle, { color: colors.textMuted }]}>
        You haven't set up your store on ShopSilo yet. Register your shop now to start POS billing, digital Khata, and counter pickups.
      </Text>

      <Button
        title="Open Your Shop (Dukandar)"
        size="lg"
        variant="primary"
        onPress={() => router.push("/merchant/register-shop")}
        style={styles.noShopBtn}
      />
      <Button
        title="Retry Loading"
        size="md"
        variant="outline"
        leftIcon={<RefreshCw size={16} color={colors.text} />}
        onPress={onRetry}
        style={styles.noShopBtn}
      />
      <Button
        title="Back to Customer App"
        size="md"
        variant="ghost"
        onPress={() => router.replace("/(tabs)")}
        style={styles.noShopBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  noShopContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  noShopIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  noShopTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  noShopSubtitle: { fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  noShopBtn: { width: "100%", marginBottom: 10 },
});
