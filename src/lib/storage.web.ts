// Web key-value storage. localStorage can be missing (static rendering) or
// throw (private mode, full quota), so every call is guarded.
const ls = () => (typeof localStorage === 'undefined' ? undefined : localStorage);

export const storage = {
  getItem(key: string): string | null {
    try {
      return ls()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      ls()?.setItem(key, value);
    } catch {
      // Quota or privacy mode: the app still works, it just won't remember
    }
  },
  removeItem(key: string) {
    try {
      ls()?.removeItem(key);
    } catch {}
  },
};
