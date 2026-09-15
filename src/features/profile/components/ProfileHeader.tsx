import React from "react";
import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import { User } from "@/features/auth/types";
import { Config } from "@/constants/config";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Camera, CheckCircle2, Phone, Mail, Edit3, Store } from "lucide-react-native";

interface ProfileHeaderProps {
  user?: User | null;
  shopName?: string;
  onEditPress: () => void;
}

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80";

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, shopName, onEditPress }) => {
  const { colors } = useThemeColor();
  const isMerchant = user?.role === "shop";
  const rawAvatar = user?.avatar_url;
  const avatarUrl = !rawAvatar
    ? DEFAULT_AVATAR
    : rawAvatar.startsWith("http") || rawAvatar.startsWith("file:") || rawAvatar.startsWith("content:")
    ? rawAvatar
    : `${Config.API_BASE_URL}${rawAvatar}`;

  return (
    <View style={styles.header}>
      {/* Avatar with Camera badge */}
      <View style={styles.avatarWrapper}>
        <Pressable onPress={onEditPress} style={styles.avatarPressable}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
            <Camera size={14} color="#ffffff" />
          </View>
        </Pressable>
      </View>

      {/* User Name & Verification Badge */}
      <View style={styles.nameRow}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.full_name || (isMerchant ? "Dukandar Partner" : "Valued Customer")}
        </Text>
        {isMerchant ? (
          <View style={[styles.verifiedBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
            <Store size={12} color="#f59e0b" />
            <Text style={[styles.verifiedText, { color: "#b45309" }]}>Shop Owner</Text>
          </View>
        ) : (
          <View style={styles.verifiedBadge}>
            <CheckCircle2 size={14} color="#16a34a" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      {/* Shop Name for Merchant */}
      {isMerchant && shopName ? (
        <View style={styles.infoRow}>
          <Store size={13} color="#f59e0b" />
          <Text style={[styles.infoText, { color: colors.text, fontWeight: "700" }]}>
            {shopName}
          </Text>
        </View>
      ) : null}

      {/* Contact Details */}
      <View style={styles.infoRow}>
        <Mail size={13} color={colors.textMuted} />
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          {user?.email || "user@example.com"}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Phone size={13} color={colors.textMuted} />
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          {user?.phone ? `+91 ${user.phone}` : "No phone linked (Tap edit)"}
        </Text>
      </View>

      {/* Quick Edit Profile Button */}
      <Pressable
        onPress={onEditPress}
        style={[styles.editBtn, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}
      >
        <Edit3 size={13} color={colors.primary} />
        <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit Profile</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: "center", marginVertical: 14, gap: 4 },
  avatarWrapper: { position: "relative", marginBottom: 6 },
  avatarPressable: { position: "relative" },
  avatar: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: "#ea580c" },
  cameraBadge: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#ffffff" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  userName: { fontSize: 20, fontWeight: "800" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f0fdf4", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  verifiedText: { fontSize: 10, fontWeight: "800", color: "#16a34a" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 6 },
  editBtnText: { fontSize: 12, fontWeight: "700" },
});
