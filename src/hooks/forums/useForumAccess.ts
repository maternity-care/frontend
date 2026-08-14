"use client";

import {
  useMemo,
} from "react";
import {
  useAuthStore,
} from "@/features/auth/auth.store";

type RoleValue =
  | string
  | {
      name?: string;
    }
  | null
  | undefined;

function getRoleName(
  role: RoleValue,
) {
  return typeof role === "string"
    ? role
    : role?.name;
}

export function useForumAccess() {
  const roles =
    useAuthStore(
      (state) => state.roles,
    );

  const user =
    useAuthStore(
      (state) => state.user,
    );

  const activeFacilityId =
    useAuthStore(
      (state) =>
        state.activeFacilityId,
    );

  return useMemo(() => {
    const activeFacility =
      user?.facilities?.find(
        (facility) =>
          String(facility.id) ===
          String(
            activeFacilityId ?? "",
          ),
      ) ??
      user?.facilities?.find(
        (facility) =>
          facility.status === "active",
      );

    const facilityRoles =
      activeFacility?.roles?.length
        ? activeFacility.roles
        : activeFacility?.role
          ? [activeFacility.role]
          : [];

    const effectiveRoles = new Set(
      [
        ...(roles ?? []),
        ...(user?.roles?.map(
          getRoleName,
        ) ?? []),
        ...facilityRoles.map(
          getRoleName,
        ),
      ]
        .filter(
          (
            role,
          ): role is string =>
            Boolean(role),
        )
        .map((role) =>
          role.toLowerCase(),
        ),
    );

    const canFullManageForum =
      effectiveRoles.has("staff") ||
      effectiveRoles.has("admin") ||
      effectiveRoles.has("super_admin");

    const isDoctor =
      effectiveRoles.has("doctor");

    return {
      effectiveRoles,
      isDoctor,
      canFullManageForum,
      canAccessForum:
        canFullManageForum || isDoctor,
      canModerateContent:
        canFullManageForum,
      canManagePosts:
        canFullManageForum,
      canHardDelete:
        canFullManageForum,
    };
  }, [
    activeFacilityId,
    roles,
    user,
  ]);
}
