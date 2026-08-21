export type PublicDoctorShiftStatus =
  | "available"
  | "full"
  | "cancelled"
  | "off";

export interface PublicBackendDoctorShift {
  id: string;
  doctorId: unknown;
  staffId: string;
  roleId: unknown;
  slotId: unknown;
  facilityId: string;
  roomId: unknown;
  shiftDate: string;
  startTime: string;
  endTime: string;
  maxAppointments: unknown;
  bookedAppointments?: unknown;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  staffName?: string | null;
  roleName?: string | null;
  doctorName: string;
  doctorTitle: string;
  doctorSpecialty: string;
  facilityCode: string;
  facilityName: string;
  roomName: unknown;
  roomType: unknown;
  roomTypeId: unknown;
  roomTypeName: unknown;
  slotCode: unknown;
  slotName: unknown;
}

export interface PublicDoctorShiftItem {
  id: string;
  doctorId: string;
  staffId: string;
  roleId: string;
  slotId: string;
  facilityId: string;
  roomId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  maxAppointments: number;
  bookedAppointments: number;
  status: PublicDoctorShiftStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
  staffName: string;
  roleName: string;
  doctorName: string;
  doctorTitle: string;
  doctorSpecialty: string;
  facilityCode: string;
  facilityName: string;
  roomName: string;
  roomType: string;
  roomTypeId: string;
  roomTypeName: string;
  slotCode: string;
  slotName: string;
}

export interface PublicWeeklyDoctorShiftsParams {
  facilityId?: string;
  doctorId?: string;
  specialty?: string;
  weekStart?: string;
}

export interface PublicDoctorAvailabilityParams {
  facilityId?: string;
  date: string;
  slotMinutes?: number;
}

export interface PublicDoctorAvailabilityResponse {
  doctorId: string;
  facilityId: string;
  date: string;
  slotMinutes: number;
  shifts: Array<{
    shiftId: string;
    roomId?: string;
    startTime: string;
    endTime: string;
    status: PublicDoctorShiftStatus;
    maxAppointments: number;
    bookedAppointments: number;
    availableSlots: Array<{ startTime: string; endTime: string } | string>;
  }>;
}
