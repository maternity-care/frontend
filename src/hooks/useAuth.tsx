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
  const {
    accessToken,
    accountType,
    refreshToken,
    roles,
    permissions,
    activeFacilityId,
    clearSession,
    setUser,
  } = useAuthStore();
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
    revalidateOnMount: true,
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
        await logoutApi(refreshToken, accountType);
      }
    } finally {
      clearSession();
      removeLocalUser();
      await mutate(undefined, { revalidate: false });
    }
  }, [accountType, clearSession, mutate, refreshToken, removeLocalUser]);

  const effectiveRoles = useMemo(
    () => {
      if (!currentUser) return roles;
      const facility = currentUser.facilities?.find(
        (facility) => String(facility.id) === String(activeFacilityId),
      );
      const facilityRoles = facility?.roles?.length
        ? facility.roles
        : facility?.role
          ? [facility.role]
          : [];
      return [
        ...new Set([
          ...currentUser.roles.map((role) => role.name),
          ...facilityRoles.map((role) => role.name),
        ]),
      ];
    },
    [activeFacilityId, currentUser, roles],
  );
  const effectivePermissions = useMemo(
    () =>
      currentUser?.roles
        ? [
            ...new Set(
              [
                ...currentUser.roles,
                ...(currentUser.facilities?.find(
                  (facility) =>
                    String(facility.id) === String(activeFacilityId),
                )?.roles ??
                  (currentUser.facilities?.find(
                    (facility) =>
                      String(facility.id) === String(activeFacilityId),
                  )?.role
                    ? [
                        currentUser.facilities.find(
                          (facility) =>
                            String(facility.id) === String(activeFacilityId),
                        )!.role,
                      ]
                    : [])),
              ].flatMap(
                (role) =>
                  role.permissions?.map((permission) => permission.name) ?? [],
              ),
            ),
          ]
        : permissions,
    [activeFacilityId, currentUser, permissions],
  );

  const hasRole = useCallback(
    (...requiredRoles: string[]) =>
      effectiveRoles.some((role) => requiredRoles.includes(role)),
    [effectiveRoles],
  );

  const hasPermission = useCallback(
    (...requiredPermissions: string[]) =>
      effectivePermissions.some((permission) =>
        requiredPermissions.includes(permission),
      ),
    [effectivePermissions],
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
      roles: effectiveRoles,
      permissions: effectivePermissions,
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
      effectivePermissions,
      effectiveRoles,
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
