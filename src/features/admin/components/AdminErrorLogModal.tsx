import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { apiClient } from "@/api/client";
import { Button } from "@/components/Button";
import { Bug, X, Trash2, Clock, Terminal, AlertTriangle, ShieldCheck } from "lucide-react-native";

interface AdminErrorLogModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface DeveloperErrorLogRecord {
  id: string;
  error_code: string;
  user_friendly_msg: string;
  developer_stack_trace: string;
  request_path: string;
  user_id?: string;
  user_role?: string;
  created_at: string;
  expires_at: string;
}

export const AdminErrorLogModal: React.FC<AdminErrorLogModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useThemeColor();
  const [logs, setLogs] = useState<DeveloperErrorLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ data: DeveloperErrorLogRecord[] }>("/admin/errors");
      setLogs(res.data?.data || []);
    } catch (err) {
      console.warn("[AdminErrors] Failed to fetch 24h error logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchLogs();
    }
  }, [visible]);

  const handleClearAll = async () => {
    Alert.alert(
      "Confirm Clear Error Logs",
      "Are you sure you want to clear the 24-hour developer error buffer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Buffer",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete("/admin/errors/clear");
              setLogs([]);
              Alert.alert("Cleared", "Developer error log buffer cleared.");
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Could not clear error logs.");
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
                <Bug size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>24-Hour Developer Telemetry Vault 🛠️</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Auto-stores raw developer error stack traces • Purges in 24 hours
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Text style={[styles.logCountText, { color: colors.text }]}>
              Active Error Logs: <Text style={{ color: "#ef4444", fontWeight: "900" }}>{logs.length}</Text>
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={handleClearAll}
              disabled={logs.length === 0}
              style={[styles.clearBtn, { opacity: logs.length > 0 ? 1 : 0.5 }]}
            >
              <Trash2 size={13} color="#dc2626" />
              <Text style={styles.clearBtnText}>Clear Buffer</Text>
            </Pressable>
          </View>

          {/* Logs List */}
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Fetching 24-hour error telemetry...
                </Text>
              </View>
            ) : logs.length === 0 ? (
              <View style={styles.emptyWrap}>
                <ShieldCheck size={36} color="#16a34a" />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>0 System Errors Detected! 🎉</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Platform is running smoothly with 0 active developer error traces.
                </Text>
              </View>
            ) : (
              logs.map((log) => {
                const dateStr = log.created_at ? new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
                return (
                  <View key={log.id} style={[styles.logCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                    <View style={styles.logCardTop}>
                      <View style={styles.codeBadge}>
                        <AlertTriangle size={12} color="#dc2626" />
                        <Text style={styles.codeBadgeText}>{log.error_code}</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Clock size={11} color={colors.textMuted} />
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>{dateStr}</Text>
                      </View>
                    </View>

                    <Text style={[styles.userMsg, { color: colors.text }]}>
                      User Message: "{log.user_friendly_msg}"
                    </Text>

                    {log.request_path ? (
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        Path: {log.request_path} {log.user_role ? `• Role: ${log.user_role}` : ""}
                      </Text>
                    ) : null}

                    {/* Developer Stack Trace Box */}
                    <View style={styles.traceBox}>
                      <View style={styles.traceHeader}>
                        <Terminal size={12} color="#94a3b8" />
                        <Text style={styles.traceTitle}>Raw Developer Stack Trace:</Text>
                      </View>
                      <Text numberOfLines={6} style={styles.traceText}>
                        {log.developer_stack_trace}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <Button title="Close Error Vault" variant="outline" size="md" onPress={onClose} style={{ marginTop: 8 }} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: "85%", padding: 18, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 1 },
  closeBtn: { padding: 4 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  logCountText: { fontSize: 13, fontWeight: "700" },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fee2e2", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  clearBtnText: { color: "#dc2626", fontSize: 11, fontWeight: "700" },
  scroll: { gap: 10, paddingBottom: 16 },
  loadingWrap: { paddingVertical: 30, alignItems: "center", gap: 8 },
  loadingText: { fontSize: 12 },
  emptyWrap: { paddingVertical: 40, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptySub: { fontSize: 12, textAlign: "center" },
  logCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  logCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  codeBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fee2e2", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  codeBadgeText: { color: "#dc2626", fontSize: 10, fontWeight: "800" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 11, fontWeight: "600" },
  userMsg: { fontSize: 13, fontWeight: "700" },
  metaText: { fontSize: 11 },
  traceBox: { backgroundColor: "#0f172a", borderRadius: 8, padding: 8, gap: 4, marginTop: 2 },
  traceHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  traceTitle: { color: "#94a3b8", fontSize: 10, fontWeight: "700" },
  traceText: { color: "#f87171", fontSize: 10, fontFamily: "monospace" },
});
