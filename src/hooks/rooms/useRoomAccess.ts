"use client";

import {
  useCallback,
  useMemo,
} from "react";
import {
  useAuthStore,
} from "@/features/auth/auth.store";
import type {
  ClinicRoom,
} from "@/management/features/rooms/rooms.types";

type AuthRoleValue =
  | string
  | {
      name?: string | null;
    }
  | null
  | undefined;

type AuthFacilityAssignment = {
  facilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
};

type RoomAccessUser = {
  facilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
  staffProfile?: {
    facilityAssignments?: AuthFacilityAssignment[] | null;
  } | null;
};

function readRoleName(
  role: AuthRoleValue,
) {
  return typeof role === "string"
    ? role
    : role?.name;
}

function normalizeRoles(
  values: AuthRoleValue[],
) {
  return new Set(
    values
      .map(readRoleName)
      .filter(
        (role): role is string =>
          Boolean(role),
      )
      .map((role) =>
        role.trim().toLowerCase(),
      ),
  );
}

export function useRoomAccess() {
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

  const access = useMemo(() => {
    const authUser =
      user as unknown as RoomAccessUser | null;

    const globalRoles =
      normalizeRoles([
        ...(roles ?? []),
        ...(authUser?.roles ?? []),
      ]);

    if (
      globalRoles.has(
        "super_admin",
      )
    ) {
      return {
        canViewAllFacilities:
          true,
        canManageRooms: false,
        scopedFacilityId: "",
      };
    }

    const assignments =
      authUser?.staffProfile
        ?.facilityAssignments ??
      [];

    const assignedFacilityIds =
      new Set(
        assignments
          .map((assignment) =>
            String(
              assignment.facilityId ??
                "",
            ).trim(),
          )
          .filter(Boolean),
      );

    const directFacilityId =
      String(
        authUser?.facilityId ??
          "",
      ).trim();

    const requestedFacilityId =
      String(
        activeFacilityId ??
          "",
      ).trim();

    const requestedAllowed =
      Boolean(
        requestedFacilityId,
      ) &&
      (requestedFacilityId ===
        directFacilityId ||
        assignedFacilityIds.has(
          requestedFacilityId,
        ));

    const firstAdminAssignment =
      assignments.find(
        (assignment) =>
          normalizeRoles(
            assignment.roles ??
              [],
          ).has("admin"),
      );

    const resolvedFacilityId =
      requestedAllowed
        ? requestedFacilityId
        : directFacilityId ||
          String(
            firstAdminAssignment
              ?.facilityId ??
              "",
          ).trim();

    const matchedAssignment =
      assignments.find(
        (assignment) =>
          String(
            assignment.facilityId ??
              "",
          ).trim() ===
          resolvedFacilityId,
      );

    const facilityRoles =
      normalizeRoles(
        matchedAssignment?.roles ??
          [],
      );

    const belongsToFacility =
      Boolean(
        resolvedFacilityId,
      ) &&
      (resolvedFacilityId ===
        directFacilityId ||
        Boolean(
          matchedAssignment,
        ));

    const hasAdminRole =
      facilityRoles.has(
        "admin",
      ) ||
      (globalRoles.has(
        "admin",
      ) &&
        resolvedFacilityId ===
          directFacilityId);

    return {
      canViewAllFacilities:
        false,
      canManageRooms:
        belongsToFacility &&
        hasAdminRole,
      scopedFacilityId:
        belongsToFacility
          ? resolvedFacilityId
          : "",
    };
  }, [
    activeFacilityId,
    roles,
    user,
  ]);

  const canManageRoom =
    useCallback(
      (room: ClinicRoom) =>
        Boolean(
          access.canManageRooms &&
            access.scopedFacilityId &&
            String(
              room.facilityId,
            ) ===
              access.scopedFacilityId,
        ),
      [
        access.canManageRooms,
        access.scopedFacilityId,
      ],
    );

  return {
    ...access,
    canManageRoom,
  };
}
