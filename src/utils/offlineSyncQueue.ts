/**
 * ============================================================================
 * 📌 WHAT: Offline Action Queue & Automatic Background Database Sync Worker.
 * ⚙️ HOW: `enqueueOfflineAction()` saves pending sales, khata, and expenses
 *         to AsyncStorage when offline. `syncOfflineQueueWithBackend()` posts queued
 *         actions to Go backend sequentially (FIFO) on network reconnection.
 * 🎯 WHY: Enables 100% offline-first counter POS billing, sales recording, and khata
 *         entries during internet outages without losing data.
 * 🔄 ALTERNATIVE: Without an offline queue, POS transactions would fail and block
 *               counter sales during Wi-Fi or mobile network blackouts.
 * 📍 WHERE: `src/utils/offlineSyncQueue.ts` • Used in POS, Khata, and `OfflineSyncBanner.tsx`.
 * ============================================================================
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "@/api/client";

export type OfflineActionType =
  | "POS_SALE"
  | "KHATA_CREDIT"
  | "KHATA_PAYMENT"
  | "STOCK_ADJUST"
  | "EXPENSE_ADD";

export interface QueuedOfflineAction {
  id: string;
  type: OfflineActionType;
  endpoint: string;
  payload: any;
  createdAt: string;
}

const OFFLINE_QUEUE_STORAGE_KEY = "shopsilo_offline_action_queue";

/**
 * Adds an action to the local offline queue when internet is disconnected.
 */
export async function enqueueOfflineAction(
  type: OfflineActionType,
  endpoint: string,
  payload: any
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    let queue: QueuedOfflineAction[] = [];
    if (raw) {
      try {
        queue = JSON.parse(raw);
      } catch { /* */ }
    }

    const newAction: QueuedOfflineAction = {
      id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      endpoint,
      payload,
      createdAt: new Date().toISOString(),
    };

    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Enqueued ${type} action (${queue.length} total in queue)`);
  } catch (err) {
    console.warn("[OfflineQueue] Failed to enqueue offline action:", err);
  }
}

/**
 * Gets all pending offline actions in the queue.
 */
export async function getPendingOfflineQueue(): Promise<QueuedOfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const queue = JSON.parse(raw);
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

/**
 * Clears the offline queue after successful synchronization.
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
  } catch (err) {
    console.warn("[OfflineQueue] Failed to clear offline queue:", err);
  }
}

/**
 * Automatic Background Sync Engine:
 * Processes all queued offline actions sequentially when internet reconnects.
 * Posts items to Go backend database and removes synced items.
 */
export async function syncOfflineQueueWithBackend(): Promise<{ syncedCount: number; errors: number }> {
  const queue = await getPendingOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  console.log(`[OfflineSync] Syncing ${queue.length} offline actions with database...`);
  let syncedCount = 0;
  let errors = 0;
  const remainingQueue: QueuedOfflineAction[] = [];

  for (const action of queue) {
    try {
      await apiClient.post(action.endpoint, action.payload);
      syncedCount++;
      console.log(`[OfflineSync] ✅ Synced ${action.type} (${action.id})`);
    } catch (err: any) {
      const status = err?.status || err?.statusCode || err?.response?.status;
      // If 400 validation or permanent error, don't retry forever. Otherwise keep in remaining queue.
      if (status === 400 || status === 422) {
        console.warn(`[OfflineSync] Permanent validation error for ${action.id}, dropping:`, err?.message);
        errors++;
      } else {
        remainingQueue.push(action);
        errors++;
      }
    }
  }

  // Update storage with remaining unsynced items
  if (remainingQueue.length === 0) {
    await clearOfflineQueue();
  } else {
    await AsyncStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
  }

  return { syncedCount, errors };
}
