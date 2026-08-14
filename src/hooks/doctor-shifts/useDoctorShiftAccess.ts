"use client";

import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import { isDoctorShiftInPast } from "@/management/features/doctor-shifts/doctor-shifts.utils";

type AuthRoleValue =
  | string
  | { name?: string | null }
  | null
  | undefined;

type AuthFacilityAssignment = {
  facilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
};

type ShiftAccessAuthUser = {
  facilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
  staffProfile?: {
    id?: string | number | null;
    staffId?: string | number | null;
    facilityId?: string | number | null;
    facilityAssignments?: AuthFacilityAssignment[] | null;
    doctor?: { id?: string | number | null } | null;
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

export function useDoctorShiftAccess() {
  const roles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const authUser = user as unknown as ShiftAccessAuthUser | null;

  const access = useMemo(() => {
    const assignments = authUser?.staffProfile?.facilityAssignments ?? [];
    const globalRoles = normalizeRoles([
      ...roles,
      ...(authUser?.roles ?? []),
    ]);

    if (globalRoles.has("super_admin")) {
      return {
        canViewAllFacilities: true,
        canManage: false,
        isDoctorViewer: false,
        facilityId: "",
        doctorId: "",
        staffId: "",
      };
    }

    const assignedFacilityIds = new Set(
      assignments
        .map((assignment) => String(assignment.facilityId ?? "").trim())
        .filter(Boolean),
    );
    const directFacilityId = String(
      authUser?.facilityId ?? authUser?.staffProfile?.facilityId ?? "",
    ).trim();
    const requestedFacilityId = String(activeFacilityId ?? "").trim();
    const requestedAllowed =
      Boolean(requestedFacilityId) &&
      (requestedFacilityId === directFacilityId ||
        assignedFacilityIds.has(requestedFacilityId));
    const facilityId = requestedAllowed
      ? requestedFacilityId
      : directFacilityId || Array.from(assignedFacilityIds)[0] || "";
    const assignment = assignments.find(
      (item) => String(item.facilityId ?? "").trim() === facilityId,
    );
    const facilityRoles = normalizeRoles(assignment?.roles ?? []);
    const belongsToFacility =
      Boolean(facilityId) &&
      (facilityId === directFacilityId || Boolean(assignment));
    const isAdmin =
      facilityRoles.has("admin") ||
      (globalRoles.has("admin") && belongsToFacility);
    const isDoctor =
      facilityRoles.has("doctor") || globalRoles.has("doctor");
    const doctorId = String(authUser?.staffProfile?.doctor?.id ?? "").trim();
    const staffId = String(
      authUser?.staffProfile?.staffId ?? authUser?.staffProfile?.id ?? "",
    ).trim();
    const canManage = belongsToFacility && isAdmin;
    const isDoctorViewer = belongsToFacility && isDoctor && !canManage;

    return {
      canViewAllFacilities: false,
      canManage,
      isDoctorViewer,
      facilityId: belongsToFacility ? facilityId : "",
      doctorId: isDoctorViewer ? doctorId : "",
      staffId: isDoctorViewer ? staffId : "",
    };
  }, [activeFacilityId, authUser, roles]);

  const {
    canManage,
    isDoctorViewer,
    facilityId,
    doctorId,
    staffId,
  } = access;

  const managedFacilityId = canManage ? facilityId : "";

  const isOwnShift = useCallback(
    (shift: DoctorShiftItem) => {
      if (!isDoctorViewer) return true;

      return Boolean(
        (doctorId && String(shift.doctorId) === doctorId) ||
          (staffId && String(shift.staffId) === staffId),
      );
    },
    [doctorId, isDoctorViewer, staffId],
  );

  const canManageShift = useCallback(
    (shift: DoctorShiftItem) =>
      Boolean(
        canManage &&
          managedFacilityId &&
          String(shift.facilityId) === managedFacilityId &&
          !isDoctorShiftInPast(shift),
      ),
    [canManage, managedFacilityId],
  );

  return {
    ...access,
    managedFacilityId,
    isOwnShift,
    canManageShift,
  };
}

export type DoctorShiftAccess = ReturnType<typeof useDoctorShiftAccess>;