export type PregnancyStatus =
  | "active"
  | "completed"
  | "terminated"
  | "deleted"
  | "ACTIVE";

export type RiskLevel = "low" | "medium" | "high";

export interface UserInfo {
  id: string;
  cccd?: string | null;
  name?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  priorityLevel?: number;
  province?: string;
  ward?: string;
  status?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface MedicalRecordFile {
  id: string;
  medicalRecordId: string;
  fileType: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  uploadedBy?: string;
  createdAt?: string;
}

export interface MedicalRecord {
  id: string;
  appointmentId?: string;
  pregnancyProfileId: string;
  doctorId?: string;
  diagnosis?: string;
  conclusion?: string;
  recommendation?: string;
  nextAppointmentSuggestedAt?: string;
  files?: MedicalRecordFile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PregnancyProfile {
  id: string;
  patientId: string;
  code?: string;
  lastMenstrualPeriod?: string;
  expectedDueDate?: string;
  fetalCount?: number;
  gravida?: number;
  paraFullTerm?: number;
  paraPremature?: number;
  paraAbortion?: number;
  paraLivingChildren?: number;
  riskLevel?: RiskLevel | string;
  status?: PregnancyStatus | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;
  user?: UserInfo;
  medicalRecords?: MedicalRecord[];
}