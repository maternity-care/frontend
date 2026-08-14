import { isRecord } from "./doctor-shifts.utils";

type DraftEnvelope<T> = {
  version: number;
  savedAt: string;
  values: T;
};

export function readDoctorShiftDraft<T>(
  storageKey: string,
  version: number,
  isValid: (values: unknown) => values is T,
): T | null {
  if (typeof window === "undefined" || !storageKey) return null;

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return null;

    const parsed: unknown = JSON.parse(rawValue);
    if (
      !isRecord(parsed) ||
      parsed.version !== version ||
      !isValid(parsed.values)
    ) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return parsed.values;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function saveDoctorShiftDraft<T>(
  storageKey: string,
  version: number,
  values: T,
) {
  if (typeof window === "undefined" || !storageKey) return;

  const draft: DraftEnvelope<T> = {
    version,
    savedAt: new Date().toISOString(),
    values,
  };

  window.localStorage.setItem(storageKey, JSON.stringify(draft));
}

export function clearDoctorShiftDraft(storageKey: string) {
  if (typeof window === "undefined" || !storageKey) return;
  window.localStorage.removeItem(storageKey);
}
