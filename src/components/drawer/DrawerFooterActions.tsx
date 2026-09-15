import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { User } from "@/features/auth/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ShieldAlert, Store, Sparkles, LogOut } from "lucide-react-native";

interface DrawerFooterActionsProps {
  user: User | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export const DrawerFooterActions: React.FC<DrawerFooterActionsProps> = ({
  user,
  onNavigate,
  onLogout,
  isLoggingOut,
}) => {
  const { colors } = useThemeColor();
  const isAdmin = user?.role === "admin";
  const isShopOwner = user?.role === "shop";

  return (
    <View style={[styles.bottomSection, { borderTopColor: colors.surfaceBorder }]}>
      {isAdmin && (
        <Pressable
          style={[styles.roleActionBox, { backgroundColor: "#fef3c7" }]}
          onPress={() => onNavigate("/admin")}
        >
          <ShieldAlert size={20} color="#b45309" />
          <View style={styles.roleActionCol}>
            <Text style={[styles.roleActionTitle, { color: "#92400e" }]}>Admin Command Center</Text>
            <Text style={[styles.roleActionSub, { color: "#b45309" }]}>Platform governance</Text>
          </View>
        </Pressable>
      )}

      {isShopOwner ? (
        <Pressable
          style={[styles.roleActionBox, { backgroundColor: "#e0e7ff" }]}
          onPress={() => onNavigate("/merchant/dashboard")}
        >
          <Store size={20} color="#4338ca" />
          <View style={styles.roleActionCol}>
            <Text style={[styles.roleActionTitle, { color: "#312e81" }]}>Merchant OS Hub</Text>
            <Text style={[styles.roleActionSub, { color: "#4338ca" }]}>Counter POS, Khata & Sales</Text>
          </View>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.roleActionBox, { backgroundColor: "#ecfdf5" }]}
          onPress={() => onNavigate("/merchant/register-shop")}
        >
          <Sparkles size={20} color="#059669" />
          <View style={styles.roleActionCol}>
            <Text style={[styles.roleActionTitle, { color: "#065f46" }]}>Become a Shop Owner</Text>
            <Text style={[styles.roleActionSub, { color: "#047857" }]}>Open local digital storefront</Text>
          </View>
        </Pressable>
      )}

      <Pressable style={styles.logoutItem} onPress={onLogout} disabled={isLoggingOut}>
        <LogOut size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSection: { padding: 16, paddingBottom: 36, borderTopWidth: 1, gap: 12 },
  roleActionBox: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12 },
  roleActionCol: { flex: 1 },
  roleActionTitle: { fontSize: 13, fontWeight: "700" },
  roleActionSub: { fontSize: 11, marginTop: 1 },
  logoutItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 4 },
  logoutText: { fontSize: 14, fontWeight: "600", color: "#dc2626" },
});
