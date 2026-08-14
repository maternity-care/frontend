import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import type {
  DoctorShiftWorkingDay,
} from "./doctor-shifts.types";
import {
  DOCTOR_SHIFT_DEFAULT_WORKING_DAYS,
  DOCTOR_SHIFT_WORKING_DAY_OPTIONS,
} from "./doctor-shifts.constants";
import {
  addDaysToDoctorShiftDateKey,
  formatDoctorShiftIssueDate,
  getDoctorShiftWorkingDay,
  toDoctorShiftDateKey,
} from "./doctor-shifts.utils";

export function getSlotWorkingDayOptions(
  slot?: ShiftSlotLookupItem | null,
) {
  const applicableDays = slot?.applicableDays?.length
    ? new Set(slot.applicableDays)
    : null;

  return DOCTOR_SHIFT_WORKING_DAY_OPTIONS.filter(
    (option) => !applicableDays || applicableDays.has(option.value),
  );
}

export function isSlotApplicableToDate(
  slot: ShiftSlotLookupItem,
  dateKey: string,
) {
  if (!dateKey || !slot.applicableDays.length) return true;
  return slot.applicableDays.includes(getDoctorShiftWorkingDay(dateKey));
}

export function getDefaultWorkingDays(
  slot?: ShiftSlotLookupItem | null,
): DoctorShiftWorkingDay[] {
  const slotDays = getSlotWorkingDayOptions(slot).map((option) => option.value);
  return slotDays.length > 0
    ? slotDays
    : [...DOCTOR_SHIFT_DEFAULT_WORKING_DAYS];
}

export function getCurrentWeekDateRange() {
  const currentDate = new Date();
  const currentDay = currentDate.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  currentDate.setDate(currentDate.getDate() - daysFromMonday);

  const dateFrom = toDoctorShiftDateKey(currentDate);
  return {
    dateFrom,
    dateTo: addDaysToDoctorShiftDateKey(dateFrom, 6),
  };
}

export function getNextWeekMondayDateKey() {
  const { dateFrom } = getCurrentWeekDateRange();
  return addDaysToDoctorShiftDateKey(dateFrom, 7);
}

export function isNextWeekMondayDateKey(value: string) {
  return Boolean(value) && value === getNextWeekMondayDateKey();
}

export function formatLockedWeekDate(value?: string) {
  return value ? formatDoctorShiftIssueDate(value).replaceAll("/", "-") : "";
}

export {
  addDaysToDoctorShiftDateKey as addDaysToDateKey,
  formatDoctorShiftIssueDate as formatIssueDate,
  getDoctorShiftWorkingDay as getWorkingDay,
  toDoctorShiftDateKey as toDateKey,
};
