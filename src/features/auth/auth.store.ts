"use client";

import { create } from "zustand";
import {
  ACCESS_TOKEN_KEY,
  AUTH_COOKIE_MAX_AGE,
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: readStoredToken(ACCESS_TOKEN_KEY),
  refreshToken: readStoredToken(REFRESH_TOKEN_KEY),
  roles: [],
  permissions: [],
  isChecking: true,
  setSession: (session: AuthResponse, rememberMe = true) => {
    storeToken(ACCESS_TOKEN_KEY, session.accessToken, rememberMe);
    const writeCookie = rememberMe ? setCookie : setSessionCookie;
    writeCookie(ACCESS_TOKEN_KEY, session.accessToken);

    if (session.refreshToken) {
      storeToken(REFRESH_TOKEN_KEY, session.refreshToken, rememberMe);
      writeCookie(REFRESH_TOKEN_KEY, session.refreshToken);
    } else {
      removeStoredToken(REFRESH_TOKEN_KEY);
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
    removeStoredToken(ACCESS_TOKEN_KEY);
    removeStoredToken(REFRESH_TOKEN_KEY);
    clearCookie(ACCESS_TOKEN_KEY);
    clearCookie(REFRESH_TOKEN_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      roles: [],
      permissions: [],
      isChecking: false,
    });
  },
}));
