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
  pregnancyProfileId: string;
  doctorId: string;
  diagnosis: string;
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

export interface MedicalRecord {
  id: string;
  appointmentId: string | null;
  pregnancyProfileId: string | null;
  doctorId: string | null;
  diagnosis: string | null;
  conclusion: string | null;
  recommendation: string | null;
  nextAppointmentSuggestedAt: string | null;
  files: MedicalRecordFile[];
  createdAt: string | null;
  updatedAt: string | null;
}

/* ===== Backend raw types (để normalize) ===== */

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
  pregnancyProfileId?: string | number | null;
  doctorId?: string | number | null;
  diagnosis?: string | null;
  conclusion?: string | null;
  recommendation?: string | null;
  nextAppointmentSuggestedAt?: string | null;
  files?: BackendMedicalRecordFile[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/* ===== Appointment types ===== */

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
  doctorId?: string | number | null;
  appointmentAt?: string | null;
  status?: string | null;
  note?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}