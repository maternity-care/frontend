"use client";

import { useSyncExternalStore } from "react";

function readFacilityId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("fe:user");
    if (!raw || raw === "undefined" || raw === "null") return null;

    const user = JSON.parse(raw) as { facilityId?: string | number | null };
    const value = user?.facilityId;

    if (value === null || value === undefined || value === "") return null;
    return String(value);
  } catch {
    return null;
  }
}

function subscribe() {
  return () => undefined;
}

/**
 * Đọc facilityId của staff từ localStorage key `fe:user`.
 */
export function useStaffFacilityId() {
  const facilityId = useSyncExternalStore(subscribe, readFacilityId, () => null);

  return {
    facilityId,
    /** Luôn true trên client sau hydrate; SSR = false nếu facilityId null từ server snapshot */
    ready: typeof window !== "undefined",
  };
}