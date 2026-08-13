import type {
  DayOfWeek,
  FacilityScheduleInput,
  FacilityStatus,
} from "./facilities.types";

export const FACILITY_STATUS_OPTIONS: Array<{
  value: FacilityStatus;
  label: string;
}> = [
  { value: "active", label: "Hoạt động" },
  { value: "suspended", label: "Tạm ngưng" },
];

export const FACILITY_DAY_OPTIONS: Array<{
  value: DayOfWeek;
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

export const DEFAULT_FACILITY_SCHEDULES: FacilityScheduleInput[] = [
  {
    days: ["MON", "TUE", "WED", "THU", "FRI"],
    isClosed: false,
    openTime: "07:00",
    closeTime: "19:00",
  },
  {
    days: ["SAT"],
    isClosed: false,
    openTime: "08:00",
    closeTime: "17:00",
  },
  {
    days: ["SUN"],
    isClosed: true,
  },
];
