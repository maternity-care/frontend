export type SettingValue = string | number | boolean | null;

export type Settings = Record<string, SettingValue>;

export function getSettingString(settings: Settings | undefined, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = settings?.[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }

  return fallback;
}
