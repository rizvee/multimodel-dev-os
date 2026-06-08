import * as SecureStore from 'expo-secure-store';

export class SecureStorage {
  static async setItem(key: string, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (e) {
      console.error(`Failed to set item in SecureStore for key: ${key}`, e);
      return false;
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error(`Failed to retrieve item from SecureStore for key: ${key}`, e);
      return null;
    }
  }

  static async deleteItem(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (e) {
      console.error(`Failed to delete item from SecureStore for key: ${key}`, e);
      return false;
    }
  }
}
