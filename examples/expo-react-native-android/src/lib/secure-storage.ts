import * as SecureStore from 'expo-secure-store';

/**
 * Encrypted Key-Value Storage Wrapper
 * Safely accesses expo-secure-store and runs assertions to verify key structures.
 */
export class SecureStorage {
  static async setItem(key: string, value: string): Promise<boolean> {
    if (!key || key.trim() === '') {
      console.error('SecureStorage: Key cannot be empty');
      return false;
    }
    try {
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(key, value);
        return true;
      } else {
        console.warn(`[SecureStorage Mock] setItem: ${key} = ${value}`);
        return true;
      }
    } catch (e) {
      console.error(`Failed to set item in SecureStore for key: ${key}`, e);
      return false;
    }
  }

  static async getItem(key: string): Promise<string | null> {
    if (!key || key.trim() === '') {
      console.error('SecureStorage: Key cannot be empty');
      return null;
    }
    try {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        return await SecureStore.getItemAsync(key);
      } else {
        console.warn(`[SecureStorage Mock] getItem: ${key}`);
        return null;
      }
    } catch (e) {
      console.error(`Failed to retrieve item from SecureStore for key: ${key}`, e);
      return null;
    }
  }

  static async deleteItem(key: string): Promise<boolean> {
    if (!key || key.trim() === '') {
      console.error('SecureStorage: Key cannot be empty');
      return false;
    }
    try {
      if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
        await SecureStore.deleteItemAsync(key);
        return true;
      } else {
        console.warn(`[SecureStorage Mock] deleteItem: ${key}`);
        return true;
      }
    } catch (e) {
      console.error(`Failed to delete item from SecureStore for key: ${key}`, e);
      return false;
    }
  }
}
