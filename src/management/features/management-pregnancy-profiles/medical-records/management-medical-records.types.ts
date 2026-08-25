export type MedicalRecordFileType =
  | "pdf"
  | "clinical_report"
  | "clinical_image"
  | "laboratory_report"
  | "ultrasound"
  | "other"
  | string;

export interface CreateMedicalRecordFileInput {
  fileType: MedicalRecordFileType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
}

export interface CreateMedicalRecordInput {
  appointmentId: string;
  appointmentServiceItemId?: string | null;
  pregnancyProfileId: string;
  doctorId: string;
  diagnosis: string;
  conclusion?: string | null;
  recommendation?: string | null;
  nextAppointmentSuggestedAt?: string | null;
  files?: CreateMedicalRecordFileInput[];
}

export interface UpdateMedicalRecordInput {
  appointmentId?: string;
  appointmentServiceItemId?: string | null;
  pregnancyProfileId?: string;
  doctorId?: string;
  diagnosis?: string;
  conclusion?: string | null;
  recommendation?: string | null;
  nextAppointmentSuggestedAt?: string | null;
  files?: CreateMedicalRecordFileInput[];
}

export interface MedicalRecordFile {
  id: string;
  medicalRecordId: string;
  fileType: MedicalRecordFileType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PendingMedicalRecordFile {
  id: string;
  appointmentId: string;
  pregnancyProfileId?: string | null;
  doctorId?: string | null;
  fileType: MedicalRecordFileType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sourcePath?: string | null;
  createdAt?: string | null;
}

export interface MedicalRecordDoctor {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  employeeCode?: string | null;
}

export interface MedicalRecord {
  id: string;
  appointmentId: string | null;
  appointmentServiceItemId: string | null;
  pregnancyProfileId: string | null;
  doctorId: string | null;
  diagnosis: string | null;
  conclusion: string | null;
  recommendation: string | null;
  nextAppointmentSuggestedAt: string | null;
  isPublic: boolean;
  publishedAt: string | null;
  publishedBy: string | null;
  files: MedicalRecordFile[];
  createdAt: string | null;
  updatedAt: string | null;
  doctor?: MedicalRecordDoctor | null;
}

/* ===== Backend raw types ===== */

export interface BackendMedicalRecordFile {
  id?: string | number;
  medicalRecordId?: string | number | null;
  fileType?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  uploadedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BackendMedicalRecord {
  id?: string | number;
  appointmentId?: string | number | null;
  appointmentServiceItemId?: string | number | null;
  pregnancyProfileId?: string | number | null;
  doctorId?: string | number | null;
  diagnosis?: string | null;
  conclusion?: string | null;
  recommendation?: string | null;
  nextAppointmentSuggestedAt?: string | null;
  isPublic?: boolean | number | null;
  is_public?: boolean | number | null;
  publishedAt?: string | null;
  published_at?: string | null;
  publishedBy?: string | number | null;
  published_by?: string | number | null;
  files?: BackendMedicalRecordFile[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | string;

export interface Appointment {
  id: string;
  pregnancyProfileId: string | null;
  doctorId: string | null;
  appointmentAt: string | null;
  status: AppointmentStatus | null;
  note?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BackendAppointment {
  id?: string | number;
  pregnancyProfileId?: string | number | null;
  pregnancy_profile_id?: string | number | null;
  doctorId?: string | number | null;
  doctor_id?: string | number | null;
  doctorStaffId?: string | number | null;
  doctor?: { id?: string | number | null } | null;
  appointmentAt?: string | null;
  appointment_at?: string | null;
  scheduledStart?: string | null;
  scheduled_start?: string | null;
  status?: string | null;
  note?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
}
