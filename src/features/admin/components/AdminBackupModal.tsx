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
  Linking,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { apiClient } from "@/api/client";
import { Button } from "@/components/Button";
import { Cloud, Download, Database, ShieldCheck, X, Zap, Clock, HardDrive } from "lucide-react-native";

interface AdminBackupModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface CloudBackupRecord {
  backup_id: string;
  filename: string;
  size_bytes: number;
  public_url: string;
  tables_included: string[];
  created_at: string;
  backup_status: string;
}

export const AdminBackupModal: React.FC<AdminBackupModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useThemeColor();
  const [backups, setBackups] = useState<CloudBackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ data: CloudBackupRecord[] }>("/admin/backups");
      setBackups(res.data?.data || []);
    } catch (err) {
      console.warn("[AdminBackup] Failed to fetch cloud backups:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchBackups();
    }
  }, [visible]);

  const handleTriggerBackup = async () => {
    setIsTriggering(true);
    try {
      const res = await apiClient.post<{ data: CloudBackupRecord }>("/admin/backups/now");
      Alert.alert(
        "Backup Completed! ☁️",
        `Database backup "${res.data?.data?.filename || "db_backup.json.gz"}" generated and uploaded to Cloudflare R2 storage.`
      );
      await fetchBackups();
    } catch (err: any) {
      Alert.alert("Backup Failed", err?.message || "Could not generate cloud database backup.");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDownloadBackup = (b: CloudBackupRecord) => {
    if (!b.public_url) return;
    Linking.openURL(b.public_url).catch(() => {
      Alert.alert("Notice", "Unable to open backup file URL.");
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
                <Cloud size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Automated Nightly Cloud DB Backups ☁️</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Gzip Encrypted PostgreSQL Dumps • Cloudflare R2 Storage
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Trigger Instant Backup Button */}
          <Button
            title={isTriggering ? "Dumping & Uploading to R2..." : "Trigger Instant Cloud DB Backup Now ⚡"}
            variant="primary"
            size="md"
            isLoading={isTriggering}
            disabled={isTriggering}
            onPress={handleTriggerBackup}
            leftIcon={<Zap size={16} color="#fff" />}
            style={{ backgroundColor: "#0284c7" }}
          />

          {/* Backups List */}
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Querying Cloudflare R2 backup vault...
                </Text>
              </View>
            ) : backups.length === 0 ? (
              <View style={styles.emptyWrap}>
                <ShieldCheck size={36} color="#16a34a" />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Nightly Cron Active ☁️</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Automated backups run every night at 2:00 AM. Tap button above to trigger an instant on-demand backup!
                </Text>
              </View>
            ) : (
              backups.map((b) => {
                const dateStr = b.created_at ? new Date(b.created_at).toLocaleString("en-IN") : "Recent";
                const sizeKB = Math.round(b.size_bytes / 1024);
                return (
                  <View key={b.backup_id} style={[styles.backupCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                    <View style={styles.backupMain}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.backupName, { color: colors.text }]}>{b.filename}</Text>
                        <View style={styles.backupMetaRow}>
                          <Clock size={11} color={colors.textMuted} />
                          <Text style={[styles.backupMeta, { color: colors.textMuted }]}>
                            {dateStr} • {sizeKB} KB • Gzip Encrypted
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleDownloadBackup(b)}
                        style={styles.downloadIconBtn}
                      >
                        <Download size={16} color="#0284c7" />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <Button title="Close Backup Vault" variant="outline" size="md" onPress={onClose} style={{ marginTop: 6 }} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: "85%", padding: 18, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 1 },
  closeBtn: { padding: 4 },
  scroll: { gap: 10, paddingBottom: 16 },
  loadingWrap: { paddingVertical: 30, alignItems: "center", gap: 8 },
  loadingText: { fontSize: 12 },
  emptyWrap: { paddingVertical: 30, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptySub: { fontSize: 12, textAlign: "center", lineHeight: 17 },
  backupCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  backupMain: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  backupName: { fontSize: 13, fontWeight: "800" },
  backupMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  backupMeta: { fontSize: 11 },
  downloadIconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(2, 132, 199, 0.12)", alignItems: "center", justifyContent: "center" },
});
