import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, TextInput } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMerchantReservations } from "@/features/merchant/api/useMerchantReservations";
import { PickupCard } from "@/features/merchant/components/PickupCard";
import { VerifyPickupModal } from "@/features/merchant/components/VerifyPickupModal";
import { PackageCheck, KeyRound } from "lucide-react-native";

export default function PickupsScreen() {
  const { colors } = useThemeColor();
  const [quickOtp, setQuickOtp] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const { data: reservations, isLoading } = useMerchantReservations();

  const handleOpenVerify = (code?: string) => {
    setActiveCode(code || quickOtp);
    setModalVisible(true);
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={[styles.quickVerifyBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <KeyRound size={18} color={colors.primary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Enter Customer OTP (e.g. 4812)"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          value={quickOtp}
          onChangeText={setQuickOtp}
        />
        <Button
          title="Verify"
          size="sm"
          variant="primary"
          disabled={quickOtp.length < 4}
          onPress={() => handleOpenVerify(quickOtp)}
        />
      </View>

      {isLoading ? (
        <LoadingState message="Loading counter reservations..." />
      ) : (
        <FlatList
          data={reservations ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PickupCard item={item} onVerify={(code) => handleOpenVerify(code)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <PackageCheck size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Pending Pickup</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Customer pickup reservations will show up here in real time.
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <VerifyPickupModal
        visible={modalVisible}
        prefilledCode={activeCode}
        onClose={() => {
          setModalVisible(false);
          setQuickOtp("");
          setActiveCode("");
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  quickVerifyBar: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 8, marginVertical: 12 },
  input: { flex: 1, fontSize: 14, height: "100%", fontWeight: "700" },
  list: { paddingBottom: 90 },
  empty: { paddingVertical: 40, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 8 },
  emptySub: { fontSize: 13, textAlign: "center" },
});
