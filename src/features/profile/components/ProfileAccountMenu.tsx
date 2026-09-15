import React from "react";
import { StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  MapPin,
  CreditCard,
  BellRing,
  HelpCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Store,
} from "lucide-react-native";

interface ProfileAccountMenuProps {
  isMerchant?: boolean;
  onAddressesPress: () => void;
  onHelpPress: () => void;
  onPaymentsPress: () => void;
  onNotificationsPress: () => void;
  onPrivacyPress: () => void;
  onShopSettingsPress?: () => void;
}

export const ProfileAccountMenu: React.FC<ProfileAccountMenuProps> = ({
  isMerchant,
  onAddressesPress,
  onHelpPress,
  onPaymentsPress,
  onNotificationsPress,
  onPrivacyPress,
  onShopSettingsPress,
}) => {
  const { colors } = useThemeColor();

  const customerSections = [
    {
      title: "Account & Preferences",
      items: [
        { title: "Saved Addresses", subtitle: "Manage home, work & pickup locations", icon: MapPin, onPress: onAddressesPress },
        { title: "Payment Preferences", subtitle: "Cash on Counter, UPI & Net Banking", icon: CreditCard, onPress: onPaymentsPress },
        { title: "Notifications & Alerts", subtitle: "WhatsApp & SMS order status updates", icon: BellRing, onPress: onNotificationsPress },
      ],
    },
    {
      title: "Support & Information",
      items: [
        { title: "24x7 Help Center", subtitle: "Frequently asked questions & live chat", icon: HelpCircle, onPress: onHelpPress },
        {
          title: "Privacy & Terms",
          subtitle: "User agreement & customer protection rules",
          icon: FileText,
          onPress: onPrivacyPress,
        },
      ],
    },
  ];

  const merchantSections = [
    {
      title: "Store Operations & Setup",
      items: [
        {
          title: "Shop Signboard & Details",
          subtitle: "Category, timing, address & GPS location",
          icon: Store,
          onPress: onShopSettingsPress || onAddressesPress,
        },
        {
          title: "Counter POS & Settlement",
          subtitle: "Instant UPI QR & Cash on Counter billing",
          icon: CreditCard,
          onPress: onPaymentsPress,
        },
        {
          title: "Dukandar WhatsApp Alerts",
          subtitle: "Instant bill receipts & order status updates",
          icon: BellRing,
          onPress: onNotificationsPress,
        },
      ],
    },
    {
      title: "Partner Support & Rules",
      items: [
        {
          title: "Dukandar Partner Support",
          subtitle: "Merchant priority helpdesk & live assistance",
          icon: HelpCircle,
          onPress: onHelpPress,
        },
        {
          title: "Merchant Protection Agreement",
          subtitle: "Store terms, dispute resolution & policies",
          icon: FileText,
          onPress: onPrivacyPress,
        },
      ],
    },
  ];

  const menuSections = isMerchant ? merchantSections : customerSections;

  return (
    <View style={styles.container}>
      {menuSections.map((sec) => (
        <View key={sec.title} style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>{sec.title}</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            {sec.items.map((item, idx) => {
              const IconComp = item.icon;
              const isLast = idx === sec.items.length - 1;
              return (
                <Pressable
                  key={item.title}
                  onPress={item.onPress}
                  style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }]}
                >
                  <View style={styles.leftCol}>
                    <View style={[styles.iconBox, { backgroundColor: `${colors.primary}12` }]}>
                      <IconComp size={18} color={colors.primary} />
                    </View>
                    <View style={styles.textWrap}>
                      <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.itemSub, { color: colors.textMuted }]}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {/* App Version & Trust Badge */}
      <View style={styles.trustBadge}>
        <ShieldCheck size={14} color="#16a34a" />
        <Text style={styles.trustText}>ShopSilo 100% Verified Local Commerce • v1.0.4</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16, gap: 14 },
  section: { gap: 6 },
  sectionHeading: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  leftCol: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "700" },
  itemSub: { fontSize: 11, marginTop: 1 },
  trustBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginVertical: 8 },
  trustText: { fontSize: 11, color: "#94a3b8", fontWeight: "600" },
});
