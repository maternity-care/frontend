"use client";

import { create } from "zustand";
import { ACCESS_TOKEN_KEY, AUTH_COOKIE_MAX_AGE, REFRESH_TOKEN_KEY } from "@/lib/constants";
import type { AuthResponse, AuthState } from "./auth.types";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; samesite=lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

function readStoredToken(key: string) {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key);
  return value && value !== "undefined" && value !== "null" ? value : null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: readStoredToken(ACCESS_TOKEN_KEY),
  refreshToken: readStoredToken(REFRESH_TOKEN_KEY),
  roles: [],
  permissions: [],
  isChecking: true,
  setSession: (session: AuthResponse) => {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    setCookie(ACCESS_TOKEN_KEY, session.accessToken);

    if (session.refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
      setCookie(REFRESH_TOKEN_KEY, session.refreshToken);
    } else {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      clearCookie(REFRESH_TOKEN_KEY);
    }

    set({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      roles: session.roles,
      permissions: session.permissions,
      isChecking: false,
    });
  },
  setUser: (user) => set({ user }),
  setChecking: (isChecking) => set({ isChecking }),
  clearSession: () => {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearCookie(ACCESS_TOKEN_KEY);
    clearCookie(REFRESH_TOKEN_KEY);
    set({ user: null, accessToken: null, refreshToken: null, roles: [], permissions: [], isChecking: false });
  },
}));
