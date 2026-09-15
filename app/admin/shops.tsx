import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/Button";
import { useAdminShops, useUpdateShopStatus } from "@/features/admin/api/useAdmin";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ShopModerationStatus } from "@/features/admin/types";
import { Store, CheckCircle, Ban } from "lucide-react-native";

export default function AdminShopsScreen() {
  const { colors } = useThemeColor();
  const { data: shops = [], isLoading } = useAdminShops();
  const { mutate: updateStatus, isPending } = useUpdateShopStatus();

  const handleSetStatus = (shopId: string, status: ShopModerationStatus) => {
    updateStatus({ shopId, body: { status } });
  };

  if (isLoading) {
    return <LoadingState fullScreen message="Loading merchant shops..." />;
  }

  return (
    <ErrorBoundary fallbackTitle="Unable to load Shops">
      <ScreenWrapper style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.heading, { color: colors.text }]}>
            All Registered Shops ({shops.length})
          </Text>

          {shops.map((shop) => (
            <View
              key={shop.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.topRow}>
                <View style={styles.titleBox}>
                  <Store size={18} color={colors.primary} />
                  <Text style={[styles.shopName, { color: colors.text }]}>
                    {shop.name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        shop.status === "active" ? "#dcfce7" : "#fee2e2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          shop.status === "active" ? "#166534" : "#b91c1c",
                      },
                    ]}
                  >
                    {shop.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Category: {shop.category || "General"} | City: {shop.city || "N/A"}
              </Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Phone: {shop.phone || "N/A"} | WhatsApp: {shop.whatsapp_number || "N/A"}
              </Text>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {shop.status !== "active" && (
                  <Button
                    title="Approve"
                    size="sm"
                    isLoading={isPending}
                    onPress={() => handleSetStatus(shop.id, "active")}
                    leftIcon={<CheckCircle size={14} color="#ffffff" />}
                    style={styles.actionBtn}
                  />
                )}
                {shop.status === "active" && (
                  <Button
                    title="Suspend Shop"
                    variant="destructive"
                    size="sm"
                    isLoading={isPending}
                    onPress={() => handleSetStatus(shop.id, "suspended")}
                    leftIcon={<Ban size={14} color="#ffffff" />}
                    style={styles.actionBtn}
                  />
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingVertical: 16 },
  heading: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titleBox: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  shopName: { fontSize: 16, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },
  metaText: { fontSize: 12, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1 },
});
