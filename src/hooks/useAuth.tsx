"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { KeyedMutator } from "swr";
import useSWR from "swr";
import { getCurrentUser, logout as logoutApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import type { UserProfile } from "@/features/profile/profile.types";
import useLocalStorage from "./useLocalStorage";

const USER_CACHE_KEY = "fe:user";

interface AuthContextValue {
  accessToken: string | null;
  currentUser: UserProfile | undefined;
  loading: boolean;
  firstLoading: boolean;
  isValidating: boolean;
  isAuthenticated: boolean;
  roles: string[];
  permissions: string[];
  logout: () => Promise<void>;
  mutate: KeyedMutator<UserProfile>;
  hasRole: (...roles: string[]) => boolean;
  hasPermission: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, refreshToken, roles, permissions, clearSession, setUser } = useAuthStore();
  const [localUser, saveLocalUser, removeLocalUser] = useLocalStorage<UserProfile>(USER_CACHE_KEY);

  const {
    data: currentUser,
    isLoading: firstLoading,
    isValidating,
    mutate,
  } = useSWR<UserProfile>(accessToken ? "/auth/me" : null, {
    shouldRetryOnError: false,
    focusThrottleInterval: 60000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: !localUser,
    dedupingInterval: 1000 * 60,
    fallbackData: localUser,
    fetcher: getCurrentUser,
    onSuccess: (data) => {
      saveLocalUser(data);
      setUser(data);
    },
    onError: () => {
      clearSession();
      removeLocalUser();
    },
  });

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } finally {
      clearSession();
      removeLocalUser();
      await mutate(undefined, { revalidate: false });
    }
  }, [clearSession, mutate, refreshToken, removeLocalUser]);

  const hasRole = useCallback(
    (...requiredRoles: string[]) =>
      roles.some((role) => requiredRoles.includes(role)) ||
      (currentUser?.roles?.some((role) => requiredRoles.includes(role.name)) ?? false),
    [currentUser, roles],
  );

  const hasPermission = useCallback(
    (...requiredPermissions: string[]) =>
      permissions.some((permission) => requiredPermissions.includes(permission)) ||
      (currentUser?.roles?.some((role) =>
        role.permissions?.some((permission) => requiredPermissions.includes(permission.name)),
      ) ?? false),
    [currentUser, permissions],
  );

  const loading = Boolean(accessToken) && (firstLoading || isValidating);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      currentUser,
      loading,
      firstLoading,
      isValidating,
      isAuthenticated: Boolean(accessToken && currentUser),
      roles,
      permissions,
      logout,
      mutate,
      hasRole,
      hasPermission,
    }),
    [
      accessToken,
      currentUser,
      firstLoading,
      hasPermission,
      hasRole,
      isValidating,
      loading,
      logout,
      mutate,
      permissions,
      roles,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export default useAuth;
