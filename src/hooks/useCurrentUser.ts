"use client";

import { useCallback, useEffect, useState } from "react";

export interface CurrentUserRole {
  id: string;
  name: string;
  guardName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  employeeCode?: string | null;
  facilityId?: string | null;
  status?: string | null;
  roles?: CurrentUserRole[];
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

const USER_STORAGE_KEY = "fe:user";
const MANAGEMENT_USER_STORAGE_KEY = "fe:management-user";

function parseUser(raw: string | null): CurrentUser | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CurrentUser;

    if (!parsed || typeof parsed !== "object" || !parsed.id) {
      return null;
    }

    return {
      ...parsed,
      id: String(parsed.id),
    };
  } catch {
    return null;
  }
}

function readUserFromStorage(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const isManagement = window.location.pathname.startsWith("/management");
  const primaryKey = isManagement ? MANAGEMENT_USER_STORAGE_KEY : USER_STORAGE_KEY;
  const fallbackKey = isManagement ? USER_STORAGE_KEY : MANAGEMENT_USER_STORAGE_KEY;

  return (
    parseUser(localStorage.getItem(primaryKey)) ??
    parseUser(sessionStorage.getItem(primaryKey)) ??
    parseUser(localStorage.getItem(fallbackKey)) ??
    parseUser(sessionStorage.getItem(fallbackKey))
  );
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(readUserFromStorage);

  const refresh = useCallback(() => {
    setUser(readUserFromStorage());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === USER_STORAGE_KEY ||
        event.key === MANAGEMENT_USER_STORAGE_KEY ||
        event.key === null
      ) {
        setUser(readUserFromStorage());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const doctorId = user?.id ? String(user.id) : null;

  const isDoctor =
    user?.roles?.some((role) => role.name?.toLowerCase() === "doctor") ?? false;

  return {
    user,
    doctorId,
    isDoctor,
    refresh,
  };
}
