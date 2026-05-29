export const storageKeys = {
  theme: "cab_admin_theme",
  bookings: "cab_admin_bookings",
  trips: "cab_admin_trips",
  drivers: "cab_admin_drivers",
  vehicles: "cab_admin_vehicles",
  invoices: "cab_admin_invoices",
  payments: "cab_admin_payments",
  admins: "cab_admin_admins",
  dashboard: "cab_admin_dashboard"
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
