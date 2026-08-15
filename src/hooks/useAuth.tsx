"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { KeyedMutator } from "swr";
import useSWR from "swr";
import { getCurrentUser, logout as logoutApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import type { User, UserProfile } from "@/features/profile/profile.types";
import useLocalStorage from "./useLocalStorage";
import { apiClient, ApiResponse, unwrapApiData } from "@/lib/axios";

const USER_CACHE_KEY = "fe:user";
const MANAGEMENT_USER_CACHE_KEY = "fe:management-user";

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
    user: storeUser,
    roles,
    permissions,
    activeFacilityId,
    clearSession,
    setUser,
  } = useAuthStore();
  const userCacheKey =
    accountType === "staff" ? MANAGEMENT_USER_CACHE_KEY : USER_CACHE_KEY;
  const [localUser, saveLocalUser, removeLocalUser] = useLocalStorage<UserProfile>(userCacheKey);
  const authMeKey = accessToken
    ? [accountType, "auth-me", accessToken]
    : null;

  const {
    data: fetchedUser,
    isLoading: firstLoading,
    isValidating,
    mutate,
  } = useSWR<UserProfile>(authMeKey, {
    shouldRetryOnError: false,
    focusThrottleInterval: 60000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    dedupingInterval: 1000 * 60,
    fallbackData: storeUser ?? localUser,
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
  const currentUser = fetchedUser ?? storeUser ?? localUser;

  console.log('fetch', currentUser)

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
      const globalRoles = currentUser?.roles?.map((role) => role.name);
      if (globalRoles?.includes("super_admin")) {
        return [...new Set(globalRoles)];
      }
      const facility = currentUser?.facilities?.find(
        (facility) => String(facility.id) === String(activeFacilityId),
      );
      const facilityRoles = facility?.roles?.length
        ? facility.roles
        : facility?.role
          ? [facility.role]
          : [];
      return facilityRoles.length > 0
        ? [...new Set(facilityRoles.map((role) => role.name))]
        : [...new Set(globalRoles)];
    },
    [activeFacilityId, currentUser, roles],
  );
  const effectivePermissions = useMemo(
    () => {
      if (!currentUser?.roles) return permissions;
      const globalRoles = currentUser.roles;
      const selectedFacility = currentUser.facilities?.find(
        (facility) => String(facility.id) === String(activeFacilityId),
      );
      const facilityRoles = selectedFacility?.roles?.length
        ? selectedFacility.roles
        : selectedFacility?.role
          ? [selectedFacility.role]
          : [];
      const effectiveRoleObjects = globalRoles.some((role) => role.name === "super_admin")
        ? globalRoles
        : facilityRoles.length > 0
          ? facilityRoles
          : globalRoles;

      return [
        ...new Set(
          effectiveRoleObjects.flatMap(
            (role) => role.permissions?.map((permission) => permission.name) ?? [],
          ),
        ),
      ];
    },
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

export async function getUserData(): Promise<User> {
  const response = await unwrapApiData(apiClient.get<ApiResponse<User>>("/users/me"));
  return response;
}

export default useAuth;
