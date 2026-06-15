export const storageKeys = {
  theme: "cab_admin_theme"
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local demo persistence should never break the UI.
  }
}

export function isStorageEmpty(key: string) {
  return localStorage.getItem(key) === null;
}
