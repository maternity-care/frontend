export type ManagementAppointmentStatus =
  | "pending_payment"
  | "booked"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "no_show";

export interface ManagementAppointment {
  id: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  pregnancyProfileId: string | null;
  pregnancyProfileCode?: string | null;
  facilityId: string;
  facilityName?: string;
  serviceId: string;
  serviceName?: string;
  doctorId: string | null;
  doctorStaffId: string | null;
  doctorName?: string;
  doctorTitle?: string;
  roomId: string;
  roomName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ManagementAppointmentStatus;
  checkedInAt?: string | null;
  cancelReason?: string | null;
}

export interface GetManagementAppointmentsParams {
  facilityId?: string;
  doctorId?: string;
  patientId?: string;
  status?: ManagementAppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  scope?: "all" | "mine";
}

export interface CheckInAppointmentInput {
  pregnancyProfileId: string;
  doctorId?: string;
}

export interface RescheduleAppointmentInput {
  doctorId: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}
