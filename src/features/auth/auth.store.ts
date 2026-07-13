"use client";

import { create } from "zustand";
import {
  ACCESS_TOKEN_KEY,
  ACTIVE_FACILITY_KEY,
  AUTH_COOKIE_MAX_AGE,
  MANAGEMENT_ACCESS_TOKEN_KEY,
  MANAGEMENT_REFRESH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "@/lib/constants";
import type { AuthResponse, AuthState } from "./auth.types";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; samesite=lax`;
}

function setSessionCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function readStoredToken(key: string) {
  if (typeof window === "undefined") return null;
  const value =
    window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  return value && value !== "undefined" && value !== "null" ? value : null;
}

function storeToken(key: string, value: string, rememberMe: boolean) {
  const targetStorage = rememberMe
    ? window.localStorage
    : window.sessionStorage;
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;
  targetStorage.setItem(key, value);
  otherStorage.removeItem(key);
}

function removeStoredToken(key: string) {
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
}

function isManagementContext() {
  return typeof window !== "undefined" &&
    window.location.pathname.startsWith("/management");
}

function getTokenKeys(accountType: "user" | "staff") {
  return accountType === "staff"
    ? {
        accessTokenKey: MANAGEMENT_ACCESS_TOKEN_KEY,
        refreshTokenKey: MANAGEMENT_REFRESH_TOKEN_KEY,
      }
    : {
        accessTokenKey: ACCESS_TOKEN_KEY,
        refreshTokenKey: REFRESH_TOKEN_KEY,
      };
}

const initialAccountType = isManagementContext() ? "staff" : "user";
const initialTokenKeys = getTokenKeys(initialAccountType);

function getEffectiveAccess(
  user: AuthState["user"],
  activeFacilityId: string | null,
) {
  const facility = user?.facilities?.find(
    (facility) => String(facility.id) === String(activeFacilityId),
  );
  const facilityRoles = facility?.roles?.length
    ? facility.roles
    : facility?.role
      ? [facility.role]
      : [];
  const effectiveRoles = [
    ...(user?.roles ?? []),
    ...facilityRoles,
  ];

  return {
    roles: [...new Set(effectiveRoles.map((role) => role.name))],
    permissions: [
      ...new Set(
        effectiveRoles.flatMap(
          (role) =>
            role.permissions?.map((permission) => permission.name) ?? [],
        ),
      ),
    ],
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  accountType: initialAccountType,
  user: null,
  accessToken: readStoredToken(initialTokenKeys.accessTokenKey),
  refreshToken: readStoredToken(initialTokenKeys.refreshTokenKey),
  roles: [],
  permissions: [],
  activeFacilityId: readStoredToken(ACTIVE_FACILITY_KEY),
  isChecking: true,
  setSession: (session: AuthResponse, rememberMe = true) => {
    const tokenKeys = getTokenKeys(session.accountType);
    storeToken(tokenKeys.accessTokenKey, session.accessToken, rememberMe);
    const writeCookie = rememberMe ? setCookie : setSessionCookie;
    writeCookie(tokenKeys.accessTokenKey, session.accessToken);

    if (session.refreshToken) {
      storeToken(tokenKeys.refreshTokenKey, session.refreshToken, rememberMe);
      writeCookie(tokenKeys.refreshTokenKey, session.refreshToken);
    } else {
      removeStoredToken(tokenKeys.refreshTokenKey);
      clearCookie(tokenKeys.refreshTokenKey);
    }

    const facilityIds =
      session.user.facilities
        ?.filter((facility) => facility.status === "active")
        .map((facility) => String(facility.id)) ?? [];
    const storedFacilityId = readStoredToken(ACTIVE_FACILITY_KEY);
    const activeFacilityId =
      storedFacilityId && facilityIds.includes(storedFacilityId)
        ? storedFacilityId
        : facilityIds[0] ?? null;

    if (activeFacilityId) {
      window.localStorage.setItem(ACTIVE_FACILITY_KEY, activeFacilityId);
    } else {
      window.localStorage.removeItem(ACTIVE_FACILITY_KEY);
    }
    const access = getEffectiveAccess(session.user, activeFacilityId);

    set({
      accountType: session.accountType,
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      roles: access.roles,
      permissions: access.permissions,
      activeFacilityId,
      isChecking: false,
    });
  },
  setUser: (user) => {
    const facilityIds =
      user?.facilities
        ?.filter((facility) => facility.status === "active")
        .map((facility) => String(facility.id)) ?? [];
    const storedFacilityId = readStoredToken(ACTIVE_FACILITY_KEY);
    const activeFacilityId =
      storedFacilityId && facilityIds.includes(storedFacilityId)
        ? storedFacilityId
        : facilityIds[0] ?? null;

    if (activeFacilityId) {
      window.localStorage.setItem(ACTIVE_FACILITY_KEY, activeFacilityId);
    } else {
      window.localStorage.removeItem(ACTIVE_FACILITY_KEY);
    }
    const access = getEffectiveAccess(user, activeFacilityId);
    set({ user, ...access, activeFacilityId });
  },
  setActiveFacility: (facilityId) => {
    set((state) => ({
      ...(state.user?.facilities?.some(
        (facility) =>
          String(facility.id) === String(facilityId) &&
          facility.status === "active",
      )
        ? (() => {
            window.localStorage.setItem(ACTIVE_FACILITY_KEY, facilityId);
            return {
              activeFacilityId: facilityId,
              ...getEffectiveAccess(state.user, facilityId),
            };
          })()
        : {}),
    }));
  },
  setChecking: (isChecking) => set({ isChecking }),
  clearSession: () => {
    const accountType = isManagementContext() ? "staff" : "user";
    const tokenKeys = getTokenKeys(accountType);
    removeStoredToken(tokenKeys.accessTokenKey);
    removeStoredToken(tokenKeys.refreshTokenKey);
    removeStoredToken(ACTIVE_FACILITY_KEY);
    clearCookie(tokenKeys.accessTokenKey);
    clearCookie(tokenKeys.refreshTokenKey);
    set({
      accountType,
      user: null,
      accessToken: null,
      refreshToken: null,
      roles: [],
      permissions: [],
      activeFacilityId: null,
      isChecking: false,
    });
  },
}));
