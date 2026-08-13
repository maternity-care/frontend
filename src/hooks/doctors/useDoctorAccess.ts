"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/features/auth/auth.store";

type AuthRoleValue =
  | string
  | { name?: string | null }
  | null
  | undefined;

type AuthFacilityAssignment = {
  facilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
};

type DoctorAccessUser = {
  facilityId?: string | number | null;
  homeFacilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
  staffProfile?: {
    facilityId?: string | number | null;
    homeFacilityId?: string | number | null;
    facilityAssignments?: AuthFacilityAssignment[] | null;
  } | null;
};

function readRoleName(role: AuthRoleValue) {
  return typeof role === "string" ? role : role?.name;
}

function normalizeRoles(values: AuthRoleValue[]) {
  return new Set(
    values
      .map(readRoleName)
      .filter((role): role is string => Boolean(role))
      .map((role) => role.trim().toLowerCase()),
  );
}

export function useDoctorAccess() {
  const roles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);

  const authUser = user as unknown as DoctorAccessUser | null;

  return useMemo(() => {
    const globalRoles = normalizeRoles([
      ...(roles ?? []),
      ...(authUser?.roles ?? []),
    ]);

    if (globalRoles.has("super_admin")) {
      return {
        canViewAllFacilities: true,
        canManageDoctors: false,
        scopedFacilityId: "",
      };
    }

    const assignments = authUser?.staffProfile?.facilityAssignments ?? [];
    const firstAdminAssignment = assignments.find((assignment) =>
      normalizeRoles(assignment.roles ?? []).has("admin"),
    );

    const resolvedFacilityId = String(
      activeFacilityId ??
        authUser?.staffProfile?.facilityId ??
        authUser?.staffProfile?.homeFacilityId ??
        authUser?.facilityId ??
        authUser?.homeFacilityId ??
        firstAdminAssignment?.facilityId ??
        "",
    ).trim();

    const matchedAssignment = assignments.find(
      (assignment) =>
        String(assignment.facilityId ?? "").trim() === resolvedFacilityId,
    );

    const facilityRoles = normalizeRoles(matchedAssignment?.roles ?? []);
    const hasAdminRole =
      globalRoles.has("admin") || facilityRoles.has("admin");

    return {
      canViewAllFacilities: false,
      canManageDoctors: Boolean(resolvedFacilityId) && hasAdminRole,
      scopedFacilityId: hasAdminRole ? resolvedFacilityId : "",
    };
  }, [activeFacilityId, authUser, roles]);
}