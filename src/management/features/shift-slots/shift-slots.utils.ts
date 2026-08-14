import type {
  ShiftSlot,
  ShiftSlotApplicableDay,
  ShiftSlotStatus,
} from "./shift-slots.types";
import {
  SHIFT_SLOT_DAY_LABELS,
} from "./shift-slots.constants";

export function getShiftSlotErrorMessage(
  error: unknown,
  fallback =
    "Đã có lỗi xảy ra. Vui lòng thử lại.",
) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
            errors?: {
              fields?: string[];
            };
          };
        };
      }
    ).response;

    const fields =
      response?.data?.errors?.fields;

    if (
      Array.isArray(fields) &&
      fields.length > 0
    ) {
      return fields.join(", ");
    }

    const message =
      response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function shiftSlotTimeToMinutes(
  value: string,
) {
  const [
    hours = 0,
    minutes = 0,
  ] = value
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

/**
 * Nếu giờ kết thúc <= giờ bắt đầu thì xem là ca qua đêm.
 * Ví dụ 22:00 -> 06:00.
 */
export function isShiftSlotOvernight(
  startTime: string,
  endTime: string,
) {
  return (
    Boolean(startTime) &&
    Boolean(endTime) &&
    shiftSlotTimeToMinutes(
      endTime,
    ) <=
      shiftSlotTimeToMinutes(
        startTime,
      )
  );
}

export function getShiftSlotStatusLabel(
  status: ShiftSlotStatus,
) {
  return status === "active"
    ? "Hoạt động"
    : "Ngừng hoạt động";
}

export function getShiftSlotDayLabels(
  days: ShiftSlotApplicableDay[],
) {
  return days.map(
    (day) =>
      SHIFT_SLOT_DAY_LABELS[day],
  );
}

export function formatShiftSlotDateTime(
  value: string,
) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

export function hasShiftSlotChanges(
  values: {
    facilityId: string;
    name: string;
    startTime: string;
    endTime: string;
    applicableDays?: ShiftSlotApplicableDay[];
    status: ShiftSlotStatus;
  },
  editingSlot: ShiftSlot,
) {
  const nextIsOvernight =
    isShiftSlotOvernight(
      values.startTime,
      values.endTime,
    );

  return (
    values.facilityId !==
      editingSlot.facilityId ||
    values.name.trim() !==
      editingSlot.name ||
    values.startTime !==
      editingSlot.startTime ||
    values.endTime !==
      editingSlot.endTime ||
    nextIsOvernight !==
      editingSlot.isOvernight ||
    (
      values.applicableDays ??
      []
    ).join(",") !==
      (
        editingSlot.applicableDays ??
        []
      ).join(",") ||
    values.status !==
      editingSlot.status
  );
}
