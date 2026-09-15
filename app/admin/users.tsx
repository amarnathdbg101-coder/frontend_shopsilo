import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { useAdminUsers } from "@/features/admin/api/useAdmin";
import { useThemeColor } from "@/hooks/useThemeColor";
import { User as UserIcon, Shield } from "lucide-react-native";

export default function AdminUsersScreen() {
  const { colors } = useThemeColor();
  const { data: users = [], isLoading } = useAdminUsers();

  if (isLoading) {
    return <LoadingState fullScreen message="Loading platform users..." />;
  }

  return (
    <ErrorBoundary fallbackTitle="Unable to load Users">
      <ScreenWrapper style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Platform Users ({users.length})
          </Text>

          {users.map((user) => (
            <View
              key={user.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.topRow}>
                <View style={styles.nameRow}>
                  <UserIcon size={16} color={colors.primary} />
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {user.full_name || "Anonymous User"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        user.role === "admin"
                          ? "#fef3c7"
                          : user.role === "shop"
                          ? "#e0e7ff"
                          : "#f1f5f9",
                    },
                  ]}
                >
                  {user.role === "admin" && (
                    <Shield size={11} color="#b45309" />
                  )}
                  <Text
                    style={[
                      styles.roleText,
                      {
                        color:
                          user.role === "admin"
                            ? "#b45309"
                            : user.role === "shop"
                            ? "#3730a3"
                            : "#475569",
                      },
                    ]}
                  >
                    {user.role.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.meta, { color: colors.textMuted }]}>
                Email: {user.email}
              </Text>
              {user.phone && (
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  Phone: {user.phone}
                </Text>
              )}
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
  card: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 15, fontWeight: "700" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  roleText: { fontSize: 11, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
});
