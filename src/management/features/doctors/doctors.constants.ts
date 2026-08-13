import type {
  DoctorExperienceLevel,
  DoctorExperienceSort,
  DoctorStatus,
} from "./doctors.types";

export const DOCTOR_DEFAULT_PAGE_SIZE = 5;

export const DOCTOR_STATUS_OPTIONS: Array<{
  value: DoctorStatus;
  label: string;
}> = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Ngừng hoạt động" },
];

export const DOCTOR_EXPERIENCE_OPTIONS: Array<{
  value: DoctorExperienceLevel;
  label: string;
}> = [
  { value: 1, label: "Kinh nghiệm 1 - 5 năm" },
  { value: 2, label: "Kinh nghiệm 6 - 10 năm" },
  { value: 3, label: "Kinh nghiệm 11 - 20 năm" },
  { value: 4, label: "Kinh nghiệm trên 20 năm" },
];

export const DOCTOR_EXPERIENCE_SORT_OPTIONS: Array<{
  value: DoctorExperienceSort;
  label: string;
}> = [
  { value: "desc", label: "Kinh nghiệm: cao đến thấp" },
  { value: "asc", label: "Kinh nghiệm: thấp đến cao" },
];