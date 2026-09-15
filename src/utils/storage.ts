import AsyncStorage from "@react-native-async-storage/async-storage";

export interface IStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class AsyncStorageAdapter implements IStorageAdapter {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const json = await AsyncStorage.getItem(key);
      return json != null ? (JSON.parse(json) as T) : null;
    } catch (error) {
      console.error(`[StorageAdapter] Failed to get key ${key}:`, error);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const json = JSON.stringify(value);
      await AsyncStorage.setItem(key, json);
    } catch (error) {
      console.error(`[StorageAdapter] Failed to set key ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[StorageAdapter] Failed to remove key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("[StorageAdapter] Failed to clear storage:", error);
    }
  }
}

export const Storage: IStorageAdapter = new AsyncStorageAdapter();
