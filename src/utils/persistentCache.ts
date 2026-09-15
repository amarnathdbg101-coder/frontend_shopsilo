import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CacheWrapper<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes default expiry

/**
 * Smart Local Storage Cache Saver:
 * Saves query payload to AsyncStorage with 15-minute auto-expiry TTL.
 */
export async function saveLocalCache<T>(
  key: string,
  data: T,
  ttlMinutes: number = 15
): Promise<void> {
  try {
    if (!key || !data) return;
    const wrapper: CacheWrapper<T> = {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMinutes * 60 * 1000,
    };
    await AsyncStorage.setItem(`shopsilo_cache_${key}`, JSON.stringify(wrapper));
  } catch (err) {
    console.warn("[PersistentCache] Failed to save cache for key:", key, err);
  }
}

/**
 * Smart Local Storage Cache Loader:
 * Loads payload from AsyncStorage if within 15 minutes (0ms instant load).
 * Automatically purges and deletes expired cache after 15 minutes!
 */
export async function loadLocalCache<T>(key: string): Promise<T | null> {
  try {
    if (!key) return null;
    const raw = await AsyncStorage.getItem(`shopsilo_cache_${key}`);
    if (!raw) return null;

    const wrapper: CacheWrapper<T> = JSON.parse(raw);
    const age = Date.now() - wrapper.timestamp;

    // Check if cache has expired
    if (age > wrapper.ttlMs) {
      // Auto-purge expired cache
      await AsyncStorage.removeItem(`shopsilo_cache_${key}`);
      return null;
    }

    return wrapper.data;
  } catch (err) {
    console.warn("[PersistentCache] Failed to load cache for key:", key, err);
    return null;
  }
}

/**
 * Clears all persistent query caches
 */
export async function clearAllLocalCaches(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith("shopsilo_cache_"));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (err) {
    console.warn("[PersistentCache] Failed to clear local caches:", err);
  }
}
