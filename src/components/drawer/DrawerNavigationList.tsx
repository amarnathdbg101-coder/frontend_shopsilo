import React from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/store/useAuthStore";
import { useMyShop } from "@/features/merchant/api/useMerchantStore";
import {
  Home,
  Receipt,
  Boxes,
  BookOpen,
  Tag,
  TrendingUp,
  IndianRupee,
  PackageCheck,
  PackagePlus,
  Settings,
  ShoppingBag,
  ChevronRight,
  ClipboardList,
} from "lucide-react-native";

interface DrawerNavigationListProps {
  onNavigate: (path: string) => void;
}

export const DrawerNavigationList: React.FC<DrawerNavigationListProps> = ({
  onNavigate,
}) => {
  const { colors } = useThemeColor();
  const { user } = useAuthStore();
  const { data: shop } = useMyShop();

  const isMerchant = user?.role === "shop" || user?.role === "admin" || !!shop;

  const merchantBillingItems = [
    { label: "Dashboard Overview", path: "/merchant/dashboard", icon: Home, color: "#4f46e5" },
    { label: "Fast POS Billing", path: "/merchant/pos", icon: Receipt, color: "#16a34a" },
    { label: "Store Product List & Catalog ðŸ“¦", path: "/merchant/inventory", icon: Boxes, color: "#ea580c" },
    { label: "Customer Khata Book", path: "/merchant/khata", icon: BookOpen, color: "#dc2626" },
  ];

  const merchantCatalogItems = [
    { label: "Add New Product", path: "/merchant/add-product", icon: PackagePlus, color: "#059669" },
    { label: "Mandi Khareed List ðŸ“", path: "/merchant/procurement-list", icon: ClipboardList, color: "#7c3aed" },
    { label: "Offers & Live Promotions", path: "/merchant/offers", icon: Tag, color: "#ec4899" },
  ];

  const merchantFinanceItems = [
    { label: "Daily Expenses (Kharcha)", path: "/merchant/expenses", icon: IndianRupee, color: "#d97706" },
    { label: "Asli Munafa & Analytics", path: "/merchant/analytics", icon: TrendingUp, color: "#7c3aed" },
    { label: "Shop Profile & Settings", path: "/merchant/settings", icon: Settings, color: "#64748b" },
    { label: "Counter Pickups Desk", path: "/merchant/pickups", icon: PackageCheck, color: "#0284c7" },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {/* Shop Status Card if Merchant (Tap to open Shop Settings) */}
      {isMerchant && shop && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate("/merchant/settings")}
          style={[styles.shopCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        >
          <View style={styles.shopCardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.shopLabel, { color: colors.textMuted }]}>AAPKI DUKAN (TAP FOR SETTINGS)</Text>
              <Text numberOfLines={1} style={[styles.shopName, { color: colors.text }]}>
                {shop.name}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: shop.is_open
                    ? "rgba(16, 185, 129, 0.12)"
                    : "rgba(239, 68, 68, 0.12)",
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: shop.is_open ? "#10b981" : "#ef4444" },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: shop.is_open ? "#047857" : "#b91c1c" },
                ]}
              >
                {shop.is_open ? "Khuli Hai" : "Band"}
              </Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* Merchant Sections */}
      {isMerchant ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            MAIN BILLING & COUNTER
          </Text>
          {merchantBillingItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Pressable
                key={item.path}
                accessibilityRole="button"
                style={[styles.item, { backgroundColor: colors.surface }]}
                onPress={() => onNavigate(item.path)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
                  <IconComp size={18} color={item.color} />
                </View>
                <Text style={[styles.text, { color: colors.text }]}>{item.label}</Text>
                <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
              </Pressable>
            );
          })}

          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 14 }]}>
            CATALOG & PROMOTIONS
          </Text>
          {merchantCatalogItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Pressable
                key={item.path}
                accessibilityRole="button"
                style={[styles.item, { backgroundColor: colors.surface }]}
                onPress={() => onNavigate(item.path)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
                  <IconComp size={18} color={item.color} />
                </View>
                <Text style={[styles.text, { color: colors.text }]}>{item.label}</Text>
                <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
              </Pressable>
            );
          })}

          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 14 }]}>
            FINANCE & STORE TOOLS
          </Text>
          {merchantFinanceItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Pressable
                key={item.path}
                accessibilityRole="button"
                style={[styles.item, { backgroundColor: colors.surface }]}
                onPress={() => onNavigate(item.path)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
                  <IconComp size={18} color={item.color} />
                </View>
                <Text style={[styles.text, { color: colors.text }]}>{item.label}</Text>
                <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
              </Pressable>
            );
          })}

          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 14 }]}>
            CUSTOMER STOREFRONT
          </Text>
          <Pressable
            accessibilityRole="button"
            style={[styles.item, { backgroundColor: colors.surface }]}
            onPress={() => onNavigate("/(tabs)")}
          >
            <View style={[styles.iconWrap, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
              <ShoppingBag size={18} color="#2563eb" />
            </View>
            <Text style={[styles.text, { color: colors.text }]}>Switch to Customer Mode</Text>
            <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
          </Pressable>
        </>
      ) : (
        /* Regular Customer Navigation */
        <>
          <Pressable
            accessibilityRole="button"
            style={[styles.item, { backgroundColor: colors.surface }]}
            onPress={() => onNavigate("/(tabs)")}
          >
            <View style={[styles.iconWrap, { backgroundColor: "rgba(79,70,229,0.1)" }]}>
              <Home size={18} color={colors.primary} />
            </View>
            <Text style={[styles.text, { color: colors.text }]}>Storefront Home</Text>
            <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[styles.item, { backgroundColor: colors.surface }]}
            onPress={() => onNavigate("/(tabs)/orders")}
          >
            <View style={[styles.iconWrap, { backgroundColor: "rgba(16,185,129,0.1)" }]}>
              <ShoppingBag size={18} color="#10b981" />
            </View>
            <Text style={[styles.text, { color: colors.text }]}>My In-Store Reservations</Text>
            <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
          </Pressable>\n\n          <Pressable
            accessibilityRole="button"
            style={[styles.item, { backgroundColor: colors.surface }]}
            onPress={() => onNavigate("/customer/khata")}
          >
            <View style={[styles.iconWrap, { backgroundColor: "rgba(220,38,38,0.1)" }]}>
              <BookOpen size={18} color="#dc2626" />
            </View>
            <Text style={[styles.text, { color: colors.text }]}>Mera Khata (Passbook)</Text>
            <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
          </Pressable>

        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  list: { padding: 14, gap: 6, paddingBottom: 24 },
  shopCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  shopCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shopLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  shopName: { fontSize: 15, fontWeight: "800", marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 13, fontWeight: "700", flex: 1 },
  chevron: { marginLeft: "auto" },
});

