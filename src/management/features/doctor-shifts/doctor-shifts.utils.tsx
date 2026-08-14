import { Tag } from "antd";
import type {
  DoctorShiftItem,
  DoctorShiftStatus,
  DoctorShiftWorkingDay,
} from "./doctor-shifts.types";
import type {
  DoctorShiftViewMode,
} from "./doctor-shifts.constants";

export function getDoctorShiftErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            errors?: { fields?: string[] };
          };
        };
      }
    ).response;

    const fields = response?.data?.errors?.fields;
    if (Array.isArray(fields) && fields.length > 0) {
      return fields.join(", ");
    }

    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
  }

  if (error instanceof Error) return error.message;
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export function parseDoctorShiftDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function toDoctorShiftDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDoctorShiftDays(value: string | Date, amount: number) {
  const date =
    typeof value === "string"
      ? parseDoctorShiftDateKey(value)
      : new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function addDaysToDoctorShiftDateKey(dateKey: string, amount: number) {
  return toDoctorShiftDateKey(addDoctorShiftDays(dateKey, amount));
}

export function startOfDoctorShiftWeek(value: string | Date) {
  const date =
    typeof value === "string"
      ? parseDoctorShiftDateKey(value)
      : new Date(value);
  const day = date.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - distanceFromMonday);
  return date;
}

export function getDoctorShiftMonthGrid(value: string) {
  const selected = parseDoctorShiftDateKey(value);
  const firstDay = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const gridStart = startOfDoctorShiftWeek(firstDay);
  return Array.from({ length: 42 }, (_, index) =>
    addDoctorShiftDays(gridStart, index),
  );
}

export const DOCTOR_SHIFT_TODAY = toDoctorShiftDateKey(new Date());

export function formatDoctorShiftShortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDoctorShiftDateKey(value));
}

export function formatDoctorShiftLongDate(value: string) {
  const formatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDoctorShiftDateKey(value));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getDoctorShiftPeriodTitle(
  viewMode: DoctorShiftViewMode,
  selectedDate: string,
) {
  if (viewMode === "day") return formatDoctorShiftLongDate(selectedDate);

  if (viewMode === "week") {
    const weekStart = startOfDoctorShiftWeek(selectedDate);
    const weekEnd = addDoctorShiftDays(weekStart, 6);
    const formatter = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `Tuần ${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(parseDoctorShiftDateKey(selectedDate));
}

export function getDoctorShiftShortLabel(startTime: string) {
  const hour = Number(startTime.split(":")[0]);
  if (hour < 12) return "Ca sáng";
  if (hour < 18) return "Ca chiều";
  return "Ca tối";
}

export function getDoctorShiftLabel(startTime: string, endTime: string) {
  return `${getDoctorShiftShortLabel(startTime)} (${startTime} - ${endTime})`;
}

export function getDoctorShiftAccent(startTime: string) {
  const hour = Number(startTime.split(":")[0]);
  if (hour < 12) return "border-blue-200 bg-blue-50 text-blue-900";
  if (hour < 18) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-violet-200 bg-violet-50 text-violet-900";
}

export function getDayShiftGroupKey(shift: DoctorShiftItem) {
  const slotIdentity =
    shift.slotId ||
    shift.slotCode ||
    shift.slotName ||
    `${shift.startTime}-${shift.endTime}`;
  return `${shift.facilityId}:${slotIdentity}`;
}

export function getDayShiftMergedCellClass(startTime: string) {
  const hour = Number(startTime.split(":")[0]);
  if (hour < 12) return "!bg-blue-50/70 !border-l-4 !border-l-blue-400 align-top";
  if (hour < 18) return "!bg-amber-50/70 !border-l-4 !border-l-amber-400 align-top";
  return "!bg-violet-50/70 !border-l-4 !border-l-violet-400 align-top";
}

function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function doctorShiftsOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  return (
    timeToMinutes(firstStart) < timeToMinutes(secondEnd) &&
    timeToMinutes(secondStart) < timeToMinutes(firstEnd)
  );
}

export function isDoctorShiftInPast(
  shift: Pick<DoctorShiftItem, "shiftDate" | "startTime" | "endTime">,
) {
  const startMinutes = timeToMinutes(shift.startTime);
  const endMinutes = timeToMinutes(shift.endTime);
  const endDate = new Date(`${shift.shiftDate}T${shift.endTime}`);
  if (endMinutes <= startMinutes) endDate.setDate(endDate.getDate() + 1);
  return endDate.getTime() <= Date.now();
}

export function shiftBlocksDoctorConflict(shift: DoctorShiftItem) {
  return ["available", "full", "off"].includes(shift.status);
}

export function shiftBlocksRoomConflict(shift: DoctorShiftItem) {
  return shift.status === "available" || shift.status === "full";
}

export function renderDoctorShiftStatus(status: DoctorShiftStatus) {
  if (status === "available") return <Tag color="green">Còn trống</Tag>;
  if (status === "full") return <Tag color="blue">Đã đầy</Tag>;
  if (status === "cancelled") return <Tag color="red">Đã hủy</Tag>;
  return <Tag>Nghỉ</Tag>;
}

export function readDoctorShiftConflictResponse(raw: unknown) {
  if (typeof raw === "boolean") {
    return {
      hasConflict: raw,
      message: undefined as string | undefined,
      target: "doctor" as "doctor" | "room",
    };
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      hasConflict: false,
      message: undefined as string | undefined,
      target: "doctor" as "doctor" | "room",
    };
  }

  const result = raw as Record<string, unknown>;
  const conflicts = Array.isArray(result.conflicts) ? result.conflicts : [];
  const doctorConflict = Boolean(result.doctorConflict ?? result.hasDoctorConflict);
  const roomConflict = Boolean(result.roomConflict ?? result.hasRoomConflict);
  const explicitConflict = result.hasConflict ?? result.conflict;
  const explicitAvailable = result.available ?? result.isAvailable;

  let hasConflict = false;
  if (typeof explicitConflict === "boolean") hasConflict = explicitConflict;
  else if (typeof explicitAvailable === "boolean") hasConflict = !explicitAvailable;
  else hasConflict = doctorConflict || roomConflict || conflicts.length > 0;

  return {
    hasConflict,
    message: typeof result.message === "string" ? result.message : undefined,
    target: roomConflict ? ("room" as const) : ("doctor" as const),
  };
}

export function getDoctorShiftWorkingDay(dateKey: string): DoctorShiftWorkingDay {
  const day = parseDoctorShiftDateKey(dateKey).getDay();
  const dayMap: Record<number, DoctorShiftWorkingDay> = {
    0: "SUN",
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
    6: "SAT",
  };
  return dayMap[day] ?? "MON";
}

export function formatDoctorShiftIssueDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value || "Không rõ ngày";
  return `${day}/${month}/${year}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
