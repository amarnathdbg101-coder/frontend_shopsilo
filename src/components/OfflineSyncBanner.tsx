/**
 * ============================================================================
 * 📌 WHAT: Offline Sync Status Banner & Network Auto-Sync Listener.
 * ⚙️ HOW: Polls `getPendingOfflineQueue()`. On network reconnection, calls
 *         `syncOfflineQueueWithBackend()` posting queued sales/khata/expenses
 *         to Go backend sequentially and displays a green success Toast.
 * 🎯 WHY: Solves internet connectivity drops in Indian retail stores; ensures
 *         0% lost sales or lost khata entries during blackouts.
 * 🔄 ALTERNATIVE: Without this banner, offline transactions would remain trapped on
 *               the phone without the shopkeeper knowing if they synced to DB.
 * 📍 WHERE: `src/components/OfflineSyncBanner.tsx` • Mounted globally in `app/_layout.tsx`.
 * ============================================================================
 */
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import {
  getPendingOfflineQueue,
  syncOfflineQueueWithBackend,
  QueuedOfflineAction,
} from "@/utils/offlineSyncQueue";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react-native";

export const OfflineSyncBanner: React.FC = () => {
  const [pendingQueue, setPendingQueue] = useState<QueuedOfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const checkQueue = async () => {
    const queue = await getPendingOfflineQueue();
    setPendingQueue(queue);
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineQueueWithBackend();
      if (res.syncedCount > 0) {
        setSyncSuccessMsg(`🟢 Auto-Synced ${res.syncedCount} offline entries with database!`);
        setTimeout(() => setSyncSuccessMsg(null), 5000);
      }
      await checkQueue();
    } catch {
      /* */
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    checkQueue();
    // Periodically check queue & attempt auto-sync every 8 seconds
    const interval = setInterval(() => {
      checkQueue();
      handleManualSync();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (syncSuccessMsg) {
    return (
      <View style={[styles.banner, styles.successBanner]}>
        <CheckCircle2 size={15} color="#fff" />
        <Text style={styles.bannerText}>{syncSuccessMsg}</Text>
      </View>
    );
  }

  if (pendingQueue.length === 0) return null;

  return (
    <View style={[styles.banner, styles.offlineBanner]}>
      <WifiOff size={15} color="#92400e" />
      <Text style={styles.offlineText}>
        📶 Offline Mode: {pendingQueue.length} entries saved locally.
      </Text>
      <Pressable onPress={handleManualSync} style={styles.syncBtn}>
        <RefreshCw size={12} color="#fff" />
        <Text style={styles.syncBtnText}>{isSyncing ? "Syncing..." : "Sync Now"}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  offlineBanner: {
    backgroundColor: "#fef3c7",
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  successBanner: {
    backgroundColor: "#16a34a",
  },
  bannerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  offlineText: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#92400e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
