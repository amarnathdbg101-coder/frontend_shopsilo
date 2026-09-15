import React from "react";
import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import { User } from "@/features/auth/types";
import { Config } from "@/constants/config";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X } from "lucide-react-native";

interface DrawerProfileHeaderProps {
  user: User | null;
  onClose: () => void;
}

export const DrawerProfileHeader: React.FC<DrawerProfileHeaderProps> = ({
  user,
  onClose,
}) => {
  const { colors } = useThemeColor();
  const isAdmin = user?.role === "admin";
  const isShopOwner = user?.role === "shop";

  const rawAvatar = user?.avatar_url;
  const avatarUri = !rawAvatar
    ? undefined
    : rawAvatar.startsWith("http") || rawAvatar.startsWith("file:") || rawAvatar.startsWith("content:")
    ? rawAvatar
    : `${Config.API_BASE_URL}${rawAvatar}`;

  return (
    <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
      <View style={styles.profileRow}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
              {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
            </Text>
          </View>
        )}
        <View style={styles.nameCol}>
          <Text numberOfLines={1} style={[styles.userName, { color: colors.text }]}>
            {user?.full_name || "Valued Customer"}
          </Text>
          <Text numberOfLines={1} style={[styles.userEmail, { color: colors.textMuted }]}>
            {user?.email}
          </Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: isAdmin ? "#fef3c7" : isShopOwner ? "#e0e7ff" : "#dcfce7",
              },
            ]}
          >
            <Text
              style={[
                styles.roleText,
                { color: isAdmin ? "#92400e" : isShopOwner ? "#3730a3" : "#166534" },
              ]}
            >
              {isAdmin ? "SUPER-ADMIN" : isShopOwner ? "SHOP OWNER" : "CUSTOMER"}
            </Text>
          </View>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
        <X size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 18,
    paddingTop: 54,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileRow: { flexDirection: "row", gap: 12, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#ea580c",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  nameCol: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700" },
  userEmail: { fontSize: 12, marginTop: 1 },
  roleBadge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  roleText: { fontSize: 10, fontWeight: "800" },
  closeBtn: { padding: 4 },
});
