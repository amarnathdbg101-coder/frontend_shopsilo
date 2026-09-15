import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileQuickStats } from "@/features/profile/components/ProfileQuickStats";
import { ProfileAccountMenu } from "@/features/profile/components/ProfileAccountMenu";
import { ProfileRoleCards } from "@/features/profile/components/ProfileRoleCards";
import { LoyaltyCard } from "@/features/loyalty/components/LoyaltyCard";
import { EditProfileModal } from "@/features/profile/components/EditProfileModal";
import { AddressesModal } from "@/features/profile/components/AddressesModal";
import { HelpSupportModal } from "@/features/profile/components/HelpSupportModal";
import { PrivacyPolicyModal } from "@/features/profile/components/PrivacyPolicyModal";
import { DealsModal } from "@/features/catalog/components/DealsModal";
import { MerchantShopProfileCard } from "@/features/profile/components/MerchantShopProfileCard";
import { useAuthStore } from "@/store/useAuthStore";
import { useMyShop } from "@/features/merchant/api/useMerchantStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLogout } from "@/features/auth/api/useLogout";
import { LogOut, Shield } from "lucide-react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: shop } = useMyShop();
  const { colors } = useThemeColor();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const isMerchant = user?.role === "shop" || !!shop;

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDealsOpen, setIsDealsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handlePayments = () => {
    if (isMerchant) {
      Alert.alert(
        "Dukandar Counter Settlement",
        "Counter POS bills and customer UPI payments are settled directly to your registered shop bank account / UPI VPA."
      );
    } else {
      Alert.alert(
        "Payment Preferences",
        "Default local store payment is set to Cash on Counter & UPI QR at pickup."
      );
    }
  };

  const handleNotifications = () => {
    if (isMerchant) {
      Alert.alert(
        "Dukandar Alerts Active",
        "Instant WhatsApp and SMS alerts are enabled for incoming pickup reservations, low stock alerts, and Khata payment receipts."
      );
    } else {
      Alert.alert(
        "Notifications Active",
        "Instant SMS and WhatsApp updates are enabled for all your reservations and bargaining deals."
      );
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Unable to load Profile">
      <ScreenWrapper scrollable contentContainerStyle={styles.container}>
        <ProfileHeader
          user={user}
          shopName={shop?.name}
          onEditPress={() => setIsEditProfileOpen(true)}
        />

        <ProfileQuickStats
          isMerchant={isMerchant}
          onOrdersPress={() => router.push("/orders")}
          onDealsPress={() => setIsDealsOpen(true)}
          onAddressesPress={() => setIsAddressesOpen(true)}
          onHelpPress={() => setIsHelpOpen(true)}
          onPosPress={() => router.push("/merchant/pos")}
          onPickupsPress={() => router.push("/merchant/pickups")}
          onKhataPress={() => router.push(isMerchant ? "/merchant/khata" : "/customer/khata")}
          onSettingsPress={() => router.push("/merchant/settings")}
        />

        {isMerchant ? (
          <MerchantShopProfileCard shop={shop} />
        ) : (
          <LoyaltyCard />
        )}

        <ProfileAccountMenu
          isMerchant={isMerchant}
          onAddressesPress={() => setIsAddressesOpen(true)}
          onHelpPress={() => setIsHelpOpen(true)}
          onPaymentsPress={handlePayments}
          onNotificationsPress={handleNotifications}
          onPrivacyPress={() => setIsPrivacyOpen(true)}
          onShopSettingsPress={() => router.push("/merchant/settings")}
        />

        {user?.role === "admin" && <ProfileRoleCards role={user?.role} />}

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Shield size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Security & Session</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Role: {user?.role ? user.role.toUpperCase() : "CUSTOMER"} • JWT Active
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
        <DealsModal visible={isDealsOpen} onClose={() => setIsDealsOpen(false)} />
        <PrivacyPolicyModal visible={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      </ScreenWrapper>
    </ErrorBoundary>
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
