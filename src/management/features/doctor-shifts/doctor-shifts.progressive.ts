import type { DoctorShiftItem } from "./doctor-shifts.types";
import type { DoctorShiftViewMode } from "./doctor-shifts.constants";
import {
  addDoctorShiftDays,
  parseDoctorShiftDateKey,
  startOfDoctorShiftWeek,
  toDoctorShiftDateKey,
} from "./doctor-shifts.utils";

/**
 * Mỗi request lấy tối đa 50 ca.
 * Trang đầu tiên của tuần hiện tại sẽ được render ngay,
 * các page còn lại tiếp tục được append sau đó.
 */
export const DOCTOR_SHIFT_PROGRESSIVE_PAGE_LIMIT = 50;

export type DoctorShiftDateRange = {
  dateFrom: string;
  dateTo: string;
};

export function getDoctorShiftWeekRange(
  value: string | Date,
): DoctorShiftDateRange {
  const weekStart = startOfDoctorShiftWeek(value);

  return {
    dateFrom: toDoctorShiftDateKey(weekStart),
    dateTo: toDoctorShiftDateKey(addDoctorShiftDays(weekStart, 6)),
  };
}

export function getDoctorShiftMonthRange(
  selectedDate: string,
): DoctorShiftDateRange {
  const selected = parseDoctorShiftDateKey(selectedDate);
  const firstDay = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    1,
  );
  const lastDay = new Date(
    selected.getFullYear(),
    selected.getMonth() + 1,
    0,
  );

  return {
    dateFrom: toDoctorShiftDateKey(firstDay),
    dateTo: toDoctorShiftDateKey(lastDay),
  };
}

/**
 * Trả về đúng phạm vi người dùng đang mở:
 * - Day: đúng 1 ngày.
 * - Week: đúng Thứ 2 -> Chủ nhật.
 * - Month: đúng ngày đầu -> ngày cuối tháng.
 */
export function getDoctorShiftViewRange(
  viewMode: DoctorShiftViewMode,
  selectedDate: string,
): DoctorShiftDateRange {
  if (viewMode === "day") {
    return {
      dateFrom: selectedDate,
      dateTo: selectedDate,
    };
  }

  if (viewMode === "month") {
    return getDoctorShiftMonthRange(
      selectedDate,
    );
  }

  return getDoctorShiftWeekRange(
    selectedDate,
  );
}

/**
 * Append dữ liệu nhưng không tạo record trùng id.
 * Record mới luôn ghi đè record cũ để giữ dữ liệu mới nhất.
 */
export function mergeDoctorShiftItems(
  current: DoctorShiftItem[],
  incoming: DoctorShiftItem[],
) {
  const itemById = new Map<string, DoctorShiftItem>();

  current.forEach((shift) => itemById.set(shift.id, shift));
  incoming.forEach((shift) => itemById.set(shift.id, shift));

  return Array.from(itemById.values());
}

/**
 * Dùng sau create/update lịch tuần: xóa cache cũ trong khoảng đó
 * rồi thay bằng dữ liệu vừa tải lại từ server.
 */
export function removeDoctorShiftsInRange(
  current: DoctorShiftItem[],
  dateFrom: string,
  dateTo: string,
) {
  return current.filter(
    (shift) => shift.shiftDate < dateFrom || shift.shiftDate > dateTo,
  );
}
