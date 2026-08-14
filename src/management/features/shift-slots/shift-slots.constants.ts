import type {
  ShiftSlotApplicableDay,
  ShiftSlotStatus,
} from "./shift-slots.types";

export const SHIFT_SLOT_DEFAULT_PAGE_SIZE = 5;

export const SHIFT_SLOT_API_DEFAULT_LIMIT = 20;

export const SHIFT_SLOT_APPLICABLE_DAYS: ShiftSlotApplicableDay[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

export const SHIFT_SLOT_DAY_LABELS: Record<
  ShiftSlotApplicableDay,
  string
> = {
  MON: "T2",
  TUE: "T3",
  WED: "T4",
  THU: "T5",
  FRI: "T6",
  SAT: "T7",
  SUN: "CN",
};

export const SHIFT_SLOT_DAY_OPTIONS: Array<{
  label: string;
  value: ShiftSlotApplicableDay;
}> = [
  {
    label: "Thứ 2",
    value: "MON",
  },
  {
    label: "Thứ 3",
    value: "TUE",
  },
  {
    label: "Thứ 4",
    value: "WED",
  },
  {
    label: "Thứ 5",
    value: "THU",
  },
  {
    label: "Thứ 6",
    value: "FRI",
  },
  {
    label: "Thứ 7",
    value: "SAT",
  },
  {
    label: "Chủ nhật",
    value: "SUN",
  },
];

export const SHIFT_SLOT_STATUS_OPTIONS: Array<{
  value: ShiftSlotStatus;
  label: string;
}> = [
  {
    value: "active",
    label: "Hoạt động",
  },
  {
    value: "inactive",
    label: "Ngừng hoạt động",
  },
];
