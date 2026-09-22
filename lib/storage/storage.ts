export function storageGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[storage] Failed to parse key "${key}". Resetting.`);
    localStorage.removeItem(key);
    return null;
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[storage] Failed to save key "${key}":`, e);
  }
}

export function storageRemove(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}
