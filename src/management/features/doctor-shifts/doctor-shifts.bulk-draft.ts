import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import type { DoctorShiftStatus, DoctorShiftWorkingDay } from "./doctor-shifts.types";
import {
  clearDoctorShiftDraft,
  readDoctorShiftDraft,
  saveDoctorShiftDraft,
} from "./doctor-shifts.draft-storage";
import { isRecord } from "./doctor-shifts.utils";
import { sanitizeSlotWorkingDays } from "./doctor-shifts.weekly-utils";

const PREFIX = "management-doctor-shifts-weekly-draft:v1";
const VERSION = 1;

export type BulkAssignmentFormValue = {
  staffId: string;
  roomId: string;
  workingDays: DoctorShiftWorkingDay[];
  maxAppointments: number;
  status: Extract<DoctorShiftStatus, "available" | "off">;
};

export type BulkSlotGroupFormValue = {
  slotId: string;
  assignments: BulkAssignmentFormValue[];
};

export type BulkGenerateFormValues = {
  facilityId: string;
  fromDate: string;
  slotGroups: BulkSlotGroupFormValue[];
};

function storageKey(facilityId: string) {
  return `${PREFIX}:${facilityId}`;
}

function isBulkValues(value: unknown): value is BulkGenerateFormValues {
  return (
    isRecord(value) &&
    typeof value.facilityId === "string" &&
    typeof value.fromDate === "string" &&
    Array.isArray(value.slotGroups)
  );
}

export function readWeeklyDraft(
  facilityId: string,
  expectedFromDate: string,
) {
  if (!facilityId) return null;
  const values = readDoctorShiftDraft<BulkGenerateFormValues>(
    storageKey(facilityId),
    VERSION,
    isBulkValues,
  );

  if (
    !values ||
    values.facilityId !== facilityId ||
    values.fromDate !== expectedFromDate
  ) {
    if (values) clearDoctorShiftDraft(storageKey(facilityId));
    return null;
  }

  return values;
}

export function saveWeeklyDraft(values: BulkGenerateFormValues) {
  if (!values.facilityId || !values.fromDate) return;
  saveDoctorShiftDraft(storageKey(values.facilityId), VERSION, values);
}

export function clearWeeklyDraft(facilityId: string) {
  if (facilityId) clearDoctorShiftDraft(storageKey(facilityId));
}

export function mergeDraftSlotGroups(
  slots: ShiftSlotLookupItem[],
  draft: BulkGenerateFormValues | null,
): BulkSlotGroupFormValue[] {
  const draftBySlotId = new Map(
    (draft?.slotGroups ?? [])
      .filter((group) => Boolean(group?.slotId))
      .map((group) => [group.slotId, group]),
  );

  return slots.map((slot) => ({
    slotId: slot.id,
    assignments: (draftBySlotId.get(slot.id)?.assignments ?? []).map(
      (assignment) => ({
        ...assignment,
        workingDays: sanitizeSlotWorkingDays(slot, assignment.workingDays),
      }),
    ),
  }));
}
