export type DoctorShiftStatus = "available" | "full" | "cancelled" | "off";

export interface BackendDoctorShift {
  id: string | number;
  doctorId: string | number;
  facilityId: string | number;
  roomId: string | null;
  shiftDate: string;
  startTime: string;
  endTime: string;
  maxAppointments: number | string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorShiftItem {
  id: string;
  doctorId: string;
  facilityId: string;
  roomId?: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  maxAppointments: number;
  status: DoctorShiftStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetDoctorShiftsParams {
  doctorId?: string;
  facilityId?: string;
  roomId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: DoctorShiftStatus;
  page?: number;
  limit?: number;
}

export interface DoctorShiftListResult {
  items: DoctorShiftItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDoctorShiftInput {
  doctorId: string;
  facilityId: string;
  roomId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  maxAppointments: number;
  status: DoctorShiftStatus;
}

export type UpdateDoctorShiftInput = Partial<CreateDoctorShiftInput>;

export interface CheckDoctorShiftConflictsInput {
  doctorId: string;
  facilityId: string;
  roomId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  excludeShiftId?: string;
}

export interface DoctorShiftConflictResult {
  hasConflict: boolean;
  doctorConflict: boolean;
  roomConflict: boolean;
  message?: string;
  conflicts: unknown[];
  raw: unknown;
}

export type DoctorShiftWorkingDay =
  "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface BulkCreateDoctorShiftsInput {
  doctorId: string;
  facilityId: string;
  roomId: string;
  fromDate: string;
  toDate: string;
  workingDays: DoctorShiftWorkingDay[];
  startTime: string;
  endTime: string;
  maxAppointments: number;
  status: DoctorShiftStatus;
}

export interface CopyDoctorShiftWeekInput {
  facilityId: string;
  doctorId: string;
  sourceWeekStart: string;
  targetWeekStart: string;
}

export interface GetDoctorAvailabilityParams {
  facilityId?: string;
  date: string;
  slotMinutes?: number;
}

export interface DoctorAvailabilitySlot {
  startTime: string;
  endTime: string;
  available?: boolean;
  remainingAppointments?: number;
  [key: string]: unknown;
}

export interface GetWeeklyDoctorShiftsParams {
  facilityId?: string;
  doctorId?: string;
  weekStart?: string;
}