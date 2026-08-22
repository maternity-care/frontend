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
  servicePrice?: string | number | null;
  doctorId: string | null;
  doctorStaffId: string | null;
  doctorName?: string;
  doctorTitle?: string;
  doctorSpecialty?: string | null;
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
  search?: string;
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

export type AppointmentServiceItemStatus =
  | "ordered"
  | "checked_in"
  | "waiting"
  | "called"
  | "in_progress"
  | "waiting_result"
  | "result_uploaded"
  | "completed"
  | "cancelled";

export interface AppointmentServiceItem {
  id: string;
  appointmentId: string;
  serviceId: string;
  serviceName?: string;
  facilityServiceId?: string | null;
  facilityId?: string | null;
  facilityName?: string | null;
  patientId?: string | null;
  pregnancyProfileId?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
  patientEmail?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  appointmentStatus?: ManagementAppointmentStatus | null;
  bookedServiceId?: string | null;
  bookedServiceName?: string | null;
  orderingDoctorId?: string | null;
  orderingDoctorName?: string | null;
  orderingDoctorTitle?: string | null;
  orderingDoctorSpecialty?: string | null;
  doctorId?: string | null;
  doctorStaffId?: string | null;
  doctorName?: string | null;
  doctorTitle?: string | null;
  doctorSpecialty?: string | null;
  roomId: string;
  roomName?: string | null;
  sequence: number;
  status: AppointmentServiceItemStatus;
  checkedInAt?: string | null;
  calledAt?: string | null;
  startedAt?: string | null;
  resultExpectedAt?: string | null;
  resultUploadedAt?: string | null;
  completedAt?: string | null;
  note?: string | null;
  durationMinutes?: number | string | null;
  medicalRecordId?: string | null;
  diagnosis?: string | null;
  conclusion?: string | null;
  recommendation?: string | null;
}

export interface CreateAppointmentServiceItemInput {
  serviceId: string;
  roomId: string;
  doctorId: string;
  note?: string;
}

export interface AddAppointmentServiceItemsInput {
  items: CreateAppointmentServiceItemInput[];
}

export interface CheckInAppointmentServiceItemInput {
  doctorId?: string;
  roomId?: string;
}

export interface SetServiceResultExpectedAtInput {
  resultExpectedAt: string;
}
