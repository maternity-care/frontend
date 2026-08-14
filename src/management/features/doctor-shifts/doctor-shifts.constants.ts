import type {
  DoctorShiftStatus,
  DoctorShiftWorkingDay,
} from "./doctor-shifts.types";

export type DoctorShiftViewMode = "day" | "week" | "month";

export const DOCTOR_SHIFT_STATUS_OPTIONS: Array<{
  value: DoctorShiftStatus;
  label: string;
}> = [
  { value: "available", label: "Còn trống" },
  { value: "full", label: "Đã đầy" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "off", label: "Nghỉ" },
];

export const DOCTOR_SHIFT_WORKING_DAY_OPTIONS: Array<{
  value: DoctorShiftWorkingDay;
  label: string;
}> = [
  { value: "MON", label: "Thứ 2" },
  { value: "TUE", label: "Thứ 3" },
  { value: "WED", label: "Thứ 4" },
  { value: "THU", label: "Thứ 5" },
  { value: "FRI", label: "Thứ 6" },
  { value: "SAT", label: "Thứ 7" },
  { value: "SUN", label: "Chủ nhật" },
];

export const DOCTOR_SHIFT_WEEKDAY_LABELS =
  DOCTOR_SHIFT_WORKING_DAY_OPTIONS.map((item) => item.label);

export const DOCTOR_SHIFT_WORKING_DAY_OFFSET: Record<
  DoctorShiftWorkingDay,
  number
> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
};

export const DOCTOR_SHIFT_DEFAULT_WORKING_DAYS: DoctorShiftWorkingDay[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
];
