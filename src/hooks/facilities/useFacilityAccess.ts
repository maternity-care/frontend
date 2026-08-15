"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/features/auth/auth.store";

type RoleValue =
  | string
  | {
      name?: string;
    }
  | null
  | undefined;

type FacilityAssignment = {
  facilityId?: unknown;
  roles?: RoleValue[] | null;
};

type UserFacility = {
  id?: unknown;
  status?: string | null;
  role?: RoleValue;
  roles?: RoleValue[] | null;
};

type FacilityAccessUser = {
  facilityId?: unknown;
  roles?: RoleValue[] | null;
  facilities?: UserFacility[] | null;
  staffProfile?: {
    facilityId?: unknown;
    homeFacilityId?: unknown;
    facilityAssignments?: FacilityAssignment[] | null;
  } | null;
};

function normalizeId(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeRoles(values: RoleValue[]) {
  return new Set(
    values
      .map((role) =>
        typeof role === "string"
          ? role
          : role?.name,
      )
      .filter(
        (
          role,
        ): role is string =>
          Boolean(role),
      )
      .map((role) =>
        role.trim().toLowerCase(),
      ),
  );
}

function getFacilityRoles(
  facility:
    | UserFacility
    | undefined,
) {
  if (!facility) {
    return [];
  }

  if (
    Array.isArray(
      facility.roles,
    ) &&
    facility.roles.length > 0
  ) {
    return facility.roles;
  }

  return facility.role
    ? [facility.role]
    : [];
}

export function useFacilityAccess() {
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
    const authUser =
      user as unknown as
        | FacilityAccessUser
        | null;

    const userFacilities =
      Array.isArray(
        authUser?.facilities,
      )
        ? authUser.facilities
        : [];

    const assignments =
      Array.isArray(
        authUser?.staffProfile
          ?.facilityAssignments,
      )
        ? authUser.staffProfile
            ?.facilityAssignments ??
          []
        : [];

    const globalRoles =
      normalizeRoles([
        ...(roles ?? []),
        ...(authUser?.roles ??
          []),
      ]);

    const isSuperAdmin =
      globalRoles.has(
        "super_admin",
      );

    if (isSuperAdmin) {
      return {
        isSuperAdmin: true,
        isAdmin: false,
        canViewAllFacilities:
          true,
        canManageOwnFacility:
          false,
        scopedFacilityId: "",
      };
    }

    const directFacilityIds =
      [
        authUser?.facilityId,
        authUser?.staffProfile
          ?.facilityId,
        authUser?.staffProfile
          ?.homeFacilityId,
      ]
        .map(normalizeId)
        .filter(Boolean);

    const assignedFacilityIds =
      assignments
        .map((assignment) =>
          normalizeId(
            assignment.facilityId,
          ),
        )
        .filter(Boolean);

    const profileFacilityIds =
      userFacilities
        .map((facility) =>
          normalizeId(
            facility.id,
          ),
        )
        .filter(Boolean);

    const allowedFacilityIds =
      new Set([
        ...directFacilityIds,
        ...assignedFacilityIds,
        ...profileFacilityIds,
      ]);

    const requestedFacilityId =
      normalizeId(
        activeFacilityId,
      );

    const requestedAllowed =
      Boolean(
        requestedFacilityId,
      ) &&
      allowedFacilityIds.has(
        requestedFacilityId,
      );

    const firstAdminAssignment =
      assignments.find(
        (assignment) =>
          normalizeRoles(
            assignment.roles ??
              [],
          ).has("admin"),
      );

    const firstAdminProfileFacility =
      userFacilities.find(
        (facility) =>
          normalizeRoles(
            getFacilityRoles(
              facility,
            ),
          ).has("admin"),
      );

    const activeProfileFacility =
      userFacilities.find(
        (facility) =>
          facility.status ===
          "active",
      );

    const resolvedFacilityId =
      requestedAllowed
        ? requestedFacilityId
        : directFacilityIds[0] ||
          normalizeId(
            firstAdminAssignment
              ?.facilityId,
          ) ||
          normalizeId(
            firstAdminProfileFacility
              ?.id,
          ) ||
          normalizeId(
            activeProfileFacility
              ?.id,
          ) ||
          assignedFacilityIds[0] ||
          profileFacilityIds[0] ||
          "";

    const matchedAssignment =
      assignments.find(
        (assignment) =>
          normalizeId(
            assignment.facilityId,
          ) ===
          resolvedFacilityId,
      );

    const matchedProfileFacility =
      userFacilities.find(
        (facility) =>
          normalizeId(
            facility.id,
          ) ===
          resolvedFacilityId,
      );

    const facilityRoles =
      normalizeRoles([
        ...(matchedAssignment
          ?.roles ?? []),
        ...getFacilityRoles(
          matchedProfileFacility,
        ),
      ]);

    const belongsToFacility =
      Boolean(
        resolvedFacilityId,
      ) &&
      allowedFacilityIds.has(
        resolvedFacilityId,
      );

    const hasAdminRole =
      facilityRoles.has(
        "admin",
      ) ||
      globalRoles.has(
        "admin",
      );

    const canManageOwnFacility =
      belongsToFacility &&
      hasAdminRole;

    return {
      isSuperAdmin: false,
      isAdmin:
        hasAdminRole,
      canViewAllFacilities:
        false,
      canManageOwnFacility,
      scopedFacilityId:
        canManageOwnFacility
          ? resolvedFacilityId
          : "",
    };
  }, [
    activeFacilityId,
    roles,
    user,
  ]);
}