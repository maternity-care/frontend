import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import type {
  DoctorOption,
} from "./doctor-shifts.ui-types";
import type {
  DoctorShiftItem,
  DoctorShiftStatus,
  DoctorShiftWorkingDay,
  WeeklyUpdateDoctorShiftsInput,
} from "./doctor-shifts.types";
import { DOCTOR_SHIFT_WORKING_DAY_OFFSET } from "./doctor-shifts.constants";
import {
  addDaysToDateKey,
  getWorkingDay,
} from "./doctor-shifts.weekly-utils";
import {
  clearDoctorShiftDraft,
  readDoctorShiftDraft,
  saveDoctorShiftDraft,
} from "./doctor-shifts.draft-storage";
import { isRecord } from "./doctor-shifts.utils";

const PREFIX = "management-doctor-shifts-current-week-update-draft:v3";
const VERSION = 3;

export type WeeklyUpdateStatus = Extract<
  DoctorShiftStatus,
  "available" | "off"
>;

export type WeeklyUpdateAssignment = {
  staffId: string;
  roleId?: string | null;
  roomId: string;
  workingDays: DoctorShiftWorkingDay[];
  shiftIdsByDay?: Partial<Record<DoctorShiftWorkingDay, string>>;
  maxAppointments: number;
  status: WeeklyUpdateStatus;
};

export type WeeklyUpdateSlotGroup = {
  slotId: string;
  assignments: WeeklyUpdateAssignment[];
};

export type WeeklyUpdateFormValues = {
  facilityId: string;
  fromDate: string;
  slotGroups: WeeklyUpdateSlotGroup[];
};

function storageKey(facilityId: string, fromDate: string) {
  return `${PREFIX}:${facilityId}:${fromDate}`;
}

function isWeeklyUpdateValues(value: unknown): value is WeeklyUpdateFormValues {
  return (
    isRecord(value) &&
    typeof value.facilityId === "string" &&
    typeof value.fromDate === "string" &&
    Array.isArray(value.slotGroups)
  );
}

export function readWeeklyUpdateDraft(
  facilityId: string,
  fromDate: string,
) {
  if (!facilityId || !fromDate) return null;
  const key = storageKey(facilityId, fromDate);
  const values = readDoctorShiftDraft<WeeklyUpdateFormValues>(
    key,
    VERSION,
    isWeeklyUpdateValues,
  );

  if (
    !values ||
    values.facilityId !== facilityId ||
    values.fromDate !== fromDate
  ) {
    if (values) clearDoctorShiftDraft(key);
    return null;
  }
  return values;
}

export function saveWeeklyUpdateDraft(values: WeeklyUpdateFormValues) {
  if (!values.facilityId || !values.fromDate) return;
  saveDoctorShiftDraft(
    storageKey(values.facilityId, values.fromDate),
    VERSION,
    values,
  );
}

export function clearWeeklyUpdateDraft(facilityId: string, fromDate: string) {
  if (!facilityId || !fromDate) return;
  clearDoctorShiftDraft(storageKey(facilityId, fromDate));
}

export function buildWeeklyUpdateInput(
  values: WeeklyUpdateFormValues,
  targetShifts: DoctorShiftItem[],
  doctors: DoctorOption[],
): WeeklyUpdateDoctorShiftsInput {
  const activeTargetShifts = targetShifts.filter(
    (shift) => shift.status !== "cancelled",
  );
  const matchedShiftIds = new Set<string>();
  const shifts: WeeklyUpdateDoctorShiftsInput["shifts"] = [];

  for (const group of values.slotGroups ?? []) {
    for (const assignment of group.assignments ?? []) {
      const doctor = doctors.find(
        (item) => item.staffId === assignment.staffId,
      );

      for (const workingDay of assignment.workingDays ?? []) {
        const shiftDate = addDaysToDateKey(
          values.fromDate,
          DOCTOR_SHIFT_WORKING_DAY_OFFSET[workingDay],
        );
        const availableTargets = activeTargetShifts.filter(
          (shift) => !matchedShiftIds.has(shift.id),
        );
        const existing = assignment.shiftIdsByDay?.[workingDay]
          ? availableTargets.find(
              (shift) => shift.id === assignment.shiftIdsByDay?.[workingDay],
            )
          : availableTargets.find(
              (shift) =>
                shift.staffId === assignment.staffId &&
                shift.slotId === group.slotId &&
                shift.shiftDate === shiftDate,
            ) ??
            availableTargets.find(
              (shift) =>
                shift.slotId === group.slotId &&
                shift.shiftDate === shiftDate &&
                shift.roomId === assignment.roomId,
            );

        if (existing) matchedShiftIds.add(existing.id);

        shifts.push({
          shiftId: existing?.id,
          staffId: assignment.staffId,
          roleId: doctor?.roleId ?? assignment.roleId ?? undefined,
          roomId: assignment.status === "off" ? null : assignment.roomId,
          slotId: group.slotId,
          shiftDate,
          maxAppointments: assignment.maxAppointments,
          status: assignment.status,
          note: existing?.note || undefined,
        });
      }
    }
  }

  return {
    facilityId: values.facilityId,
    weekStart: values.fromDate,
    shifts,
    removedShiftIds: activeTargetShifts
      .filter((shift) => !matchedShiftIds.has(shift.id))
      .map((shift) => shift.id),
  };
}

/** Dựng form tuần từ các ca đã tồn tại để người dùng chỉnh tiếp. */
export function buildGroupsFromShifts(
  slots: ShiftSlotLookupItem[],
  shifts: DoctorShiftItem[],
  doctors: DoctorOption[],
  facilityId: string,
  dateFrom: string,
  dateTo: string,
): WeeklyUpdateSlotGroup[] {
  const assignmentMaps = new Map<
    string,
    Map<string, WeeklyUpdateAssignment>
  >();

  const currentWeekShifts = shifts.filter(
    (shift) =>
      String(shift.facilityId) === String(facilityId) &&
      shift.shiftDate >= dateFrom &&
      shift.shiftDate <= dateTo &&
      shift.status !== "cancelled",
  );

  for (const shift of currentWeekShifts) {
    const slotId = String(shift.slotId ?? "");
    if (!slotId) continue;

    const doctor = doctors.find(
      (item) => item.id === shift.doctorId || item.staffId === shift.staffId,
    );
    const staffId = String(shift.staffId ?? doctor?.staffId ?? "");
    const roomId = String(shift.roomId ?? "");
    const status: WeeklyUpdateStatus =
      shift.status === "off" ? "off" : "available";

    if (!staffId || (!roomId && status !== "off")) continue;

    const maxAppointments = Math.max(1, Number(shift.maxAppointments) || 8);
    const assignmentKey = [staffId, roomId, status, maxAppointments].join(":");
    const assignments =
      assignmentMaps.get(slotId) ?? new Map<string, WeeklyUpdateAssignment>();
    const existing = assignments.get(assignmentKey);
    const workingDay = getWorkingDay(shift.shiftDate);

    assignments.set(assignmentKey, {
      staffId,
      roleId: doctor?.roleId ?? shift.roleId ?? null,
      roomId,
      status,
      maxAppointments,
      shiftIdsByDay: {
        ...(existing?.shiftIdsByDay ?? {}),
        [workingDay]: shift.id,
      },
      workingDays: Array.from(
        new Set([...(existing?.workingDays ?? []), workingDay]),
      ),
    });
    assignmentMaps.set(slotId, assignments);
  }

  return slots.map((slot) => ({
    slotId: slot.id,
    assignments: Array.from(assignmentMaps.get(slot.id)?.values() ?? []),
  }));
}

export function mergeWeeklyUpdateDraftGroups(
  slots: ShiftSlotLookupItem[],
  fallbackGroups: WeeklyUpdateSlotGroup[],
  draft: WeeklyUpdateFormValues | null,
) {
  const draftBySlotId = new Map(
    (draft?.slotGroups ?? [])
      .filter((group) => Boolean(group?.slotId))
      .map((group) => [group.slotId, group]),
  );
  const fallbackBySlotId = new Map(
    fallbackGroups.map((group) => [group.slotId, group]),
  );

  return slots.map((slot) => ({
    slotId: slot.id,
    assignments:
      draftBySlotId.get(slot.id)?.assignments ??
      fallbackBySlotId.get(slot.id)?.assignments ??
      [],
  }));
}
