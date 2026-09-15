import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/Button";
import { AdminStatGrid } from "@/features/admin/components/AdminStatGrid";
import { AdminInviteCard } from "@/features/admin/components/AdminInviteCard";
import { AdminErrorLogModal } from "@/features/admin/components/AdminErrorLogModal";
import { AdminPerformanceCard } from "@/features/admin/components/AdminPerformanceCard";
import { AdminBackupModal } from "@/features/admin/components/AdminBackupModal";
import { useAdminStats } from "@/features/admin/api/useAdmin";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Store, Users, ShieldAlert, ArrowRight, ShoppingBag, Bug, Cloud } from "lucide-react-native";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { data: stats, isLoading } = useAdminStats();
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);

  if (isLoading && !stats) {
    return <LoadingState fullScreen message="Loading platform analytics..." />;
  }

  return (
    <ErrorBoundary fallbackTitle="Unable to load Admin Panel">
      <ScreenWrapper style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.banner}>
            <Text style={[styles.welcomeText, { color: colors.textMuted }]}>
              Platform Governance
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Super-Admin Control
            </Text>
          </View>

          {/* Live Performance & Go Server Health Metrics */}
          <AdminPerformanceCard />

          {/* Metric Cards Grid */}
          <AdminStatGrid stats={stats} />

          {/* Safety & Compliance Card */}
          <View
            style={[
              styles.alertCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.alertHeader}>
              <ShieldAlert size={20} color="#dc2626" />
              <Text style={[styles.alertTitle, { color: colors.text }]}>
                Safety & Compliance
              </Text>
            </View>
            <Text style={[styles.alertDesc, { color: colors.textMuted }]}>
              Pending Reports: {stats?.pending_reports ?? 0} | Banned Entities: {stats?.banned_entities ?? 0}
            </Text>
          </View>

          {/* Merchant Shop Creation Invite Gate & Codes */}
          <AdminInviteCard />

          {/* Action Navigation */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Platform Management & Telemetry
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => setBackupModalOpen(true)}
            style={[
              styles.navItem,
              { backgroundColor: "rgba(2, 132, 199, 0.08)", borderColor: "#0284c7" },
            ]}
          >
            <View style={styles.navLeft}>
              <Cloud size={20} color="#0284c7" />
              <View>
                <Text style={[styles.navText, { color: colors.text }]}>
                  Automated Cloud DB Backups ☁️
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  Nightly Gzip dumps to Cloudflare R2 • 1-Tap On-Demand Backup
                </Text>
              </View>
            </View>
            <ArrowRight size={18} color="#0284c7" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setErrorModalOpen(true)}
            style={[
              styles.navItem,
              { backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "#ef4444" },
            ]}
          >
            <View style={styles.navLeft}>
              <Bug size={20} color="#ef4444" />
              <View>
                <Text style={[styles.navText, { color: colors.text }]}>
                  24-Hour Developer Telemetry Vault 🛠️
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  View raw developer stack traces • Auto-purges in 24 hours
                </Text>
              </View>
            </View>
            <ArrowRight size={18} color="#ef4444" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/admin/shops")}
            style={[
              styles.navItem,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.navLeft}>
              <Store size={20} color={colors.primary} />
              <Text style={[styles.navText, { color: colors.text }]}>
                Moderate & Approve Shops
              </Text>
            </View>
            <ArrowRight size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/admin/users")}
            style={[
              styles.navItem,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.navLeft}>
              <Users size={20} color={colors.primary} />
              <Text style={[styles.navText, { color: colors.text }]}>
                Manage Users & Roles
              </Text>
            </View>
            <ArrowRight size={18} color={colors.textMuted} />
          </Pressable>

          <Button
            title="Open Customer Storefront"
            variant="outline"
            size="lg"
            onPress={() => router.replace("/(tabs)")}
            leftIcon={<ShoppingBag size={18} color={colors.primary} />}
            style={styles.switchButton}
          />
        </ScrollView>

        {/* 🛠️ Admin 24-Hour Developer Error Vault Modal */}
        <AdminErrorLogModal
          visible={errorModalOpen}
          onClose={() => setErrorModalOpen(false)}
        />

        {/* ☁️ Admin Automated Cloud Database Backup Modal */}
        <AdminBackupModal
          visible={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
        />
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingVertical: 16, paddingBottom: 32 },
  banner: { marginBottom: 14 },
  welcomeText: { fontSize: 13, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "800", marginTop: 2 },
  alertCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  alertTitle: { fontSize: 15, fontWeight: "700" },
  alertDesc: { fontSize: 13 },
  sectionHeading: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  navLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  navText: { fontSize: 14, fontWeight: "600" },
  switchButton: { marginTop: 14 },
});
