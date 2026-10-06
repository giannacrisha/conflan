// Native key-value storage. The web version (storage.web.ts) uses localStorage,
// because expo-sqlite on web needs headers GitHub Pages can't send.
import Storage from 'expo-sqlite/kv-store';

export const storage = {
  getItem: (key: string): string | null => Storage.getItemSync(key),
  setItem: (key: string, value: string) => Storage.setItemSync(key, value),
  removeItem: (key: string) => Storage.removeItemSync(key),
};
