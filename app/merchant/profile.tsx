import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileQuickStats } from "@/features/profile/components/ProfileQuickStats";
import { ProfileAccountMenu } from "@/features/profile/components/ProfileAccountMenu";
import { MerchantShopProfileCard } from "@/features/profile/components/MerchantShopProfileCard";
import { EditProfileModal } from "@/features/profile/components/EditProfileModal";
import { AddressesModal } from "@/features/profile/components/AddressesModal";
import { HelpSupportModal } from "@/features/profile/components/HelpSupportModal";
import { PrivacyPolicyModal } from "@/features/profile/components/PrivacyPolicyModal";
import { useAuthStore } from "@/store/useAuthStore";
import { useMyShop } from "@/features/merchant/api/useMerchantStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLogout } from "@/features/auth/api/useLogout";
import { LogOut, Shield } from "lucide-react-native";

function MerchantProfileContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: shop } = useMyShop();
  const { colors } = useThemeColor();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const isMerchant = user?.role === "shop" || user?.role === "admin" || !!shop;

  useEffect(() => {
    if (user && !isMerchant) {
      router.replace("/(tabs)/profile");
    }
  }, [user, isMerchant]);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handlePayments = () => {
    Alert.alert(
      "Dukandar Counter Settlement",
      "Counter POS bills and customer UPI payments are settled directly to your registered shop bank account / UPI VPA."
    );
  };

  const handleNotifications = () => {
    Alert.alert(
      "Dukandar Alerts Active",
      "Instant WhatsApp and SMS alerts are enabled for incoming pickup reservations, low stock alerts, and Khata payment receipts."
    );
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <ProfileHeader
        user={user}
        shopName={shop?.name}
        onEditPress={() => setIsEditProfileOpen(true)}
      />

      <ProfileQuickStats
        isMerchant={true}
        onOrdersPress={() => router.push("/orders")}
        onDealsPress={() => router.push("/merchant/offers")}
        onAddressesPress={() => setIsAddressesOpen(true)}
        onHelpPress={() => setIsHelpOpen(true)}
        onPosPress={() => router.push("/merchant/pos")}
        onPickupsPress={() => router.push("/merchant/pickups")}
        onKhataPress={() => router.push("/merchant/khata")}
        onSettingsPress={() => router.push("/merchant/settings")}
      />

      <MerchantShopProfileCard shop={shop} />

      <ProfileAccountMenu
        isMerchant={true}
        onAddressesPress={() => setIsAddressesOpen(true)}
        onHelpPress={() => setIsHelpOpen(true)}
        onPaymentsPress={handlePayments}
        onNotificationsPress={handleNotifications}
        onPrivacyPress={() => setIsPrivacyOpen(true)}
        onShopSettingsPress={() => router.push("/merchant/settings")}
      />

      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.cardHeaderRow}>
          <Shield size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security & Session</Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Role: {user?.role ? user.role.toUpperCase() : "SHOP OWNER"} • JWT Authenticated
        </Text>
      </View>

      <View style={styles.logoutContainer}>
        <Button
          title="Sign Out"
          variant="destructive"
          size="lg"
          isLoading={isLoggingOut}
          onPress={() => logout()}
          leftIcon={<LogOut size={20} color="#ffffff" />}
        />
      </View>

      <EditProfileModal visible={isEditProfileOpen} user={user} onClose={() => setIsEditProfileOpen(false)} />
      <AddressesModal visible={isAddressesOpen} onClose={() => setIsAddressesOpen(false)} />
      <HelpSupportModal visible={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <PrivacyPolicyModal visible={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18 },
  sectionCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16, gap: 4 },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sectionSubtitle: { fontSize: 12 },
  logoutContainer: { marginTop: 4, marginBottom: 95 },
});

export default function MerchantProfileScreen() {
  return (
    <ErrorBoundary fallbackTitle="Unable to load Merchant Profile">
      <MerchantProfileContent />
    </ErrorBoundary>
  );
}
