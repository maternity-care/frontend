export type PregnancyProfileStatus =
  | "active"
  | "completed"
  | "terminated"
  | "deleted";

export type PregnancyRiskLevel = "low" | "medium" | "high";

export interface ManagementPregnancyProfileUser {
  id: string;

  name: string | null;
  email: string | null;
  phone: string | null;

  cccd: string | null;
  dateOfBirth: string | null;

  address: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;

  emergencyContactName: string | null;
  emergencyContactPhone: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PregnancyProfileMedicalRecordFile {
  id: string;
  medicalRecordId: string;
  fileType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedBy?: string | null;
  createdAt?: string | null;
}

export interface PregnancyConsultationRecord {
  id: string;

  appointmentId: string | null;
  appointmentScheduledStart: string | null;
  appointmentScheduledEnd: string | null;
  bookedServiceName: string | null;
  appointmentDoctorName: string | null;
  appointmentServiceItemId: string | null;
  appointmentServiceName: string | null;
  appointmentServiceRoomName: string | null;
  appointmentServiceDoctorName: string | null;
  pregnancyProfileId: string | null;
  doctorId: string | null;
  doctorName: string | null;

  diagnosis: string | null;
  conclusion: string | null;
  recommendation: string | null;

  nextAppointmentSuggestedAt: string | null;
  files: PregnancyProfileMedicalRecordFile[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PregnancyProfilePdfRecord {
  id: string;

  name: string;
  url: string;

  key?: string | null;
  mimeType?: string | null;
  size?: number | null;

  uploadedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * API hiện tại có thể trả:
 * - string: URL hoặc key của file.
 * - PregnancyProfilePdfRecord: thông tin file PDF.
 * - PregnancyConsultationRecord: kết quả khám.
 */
export type ManagementMedicalRecord =
  | string
  | PregnancyProfilePdfRecord
  | PregnancyConsultationRecord;

export interface ManagementPregnancyProfile {
  id: string;

  code: string | null;
  patientId: string | null;
  userId: string | null;

  user: ManagementPregnancyProfileUser | null;

  lastMenstrualPeriod: string | null;
  expectedDueDate: string | null;

  fetalCount: number | null;

  gravida: number;
  paraFullTerm: number;
  paraPremature: number;
  paraAbortion: number;
  paraLivingChildren: number;

  riskLevel: PregnancyRiskLevel;
  status: PregnancyProfileStatus;

  notes: string | null;

  medicalRecords: ManagementMedicalRecord[];
  consultations: PregnancyConsultationRecord[];

  deletedAt?: string | null;
  deletedReason?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface GetManagementPregnancyProfilesParams {
  search?: string;

  name?: string;
  code?: string;
  phone?: string;
  email?: string;

  userId?: string;
  patientId?: string;

  riskLevel?: PregnancyRiskLevel;
  status?: PregnancyProfileStatus;

  page?: number;
  limit?: number;
}

export interface ManagementPregnancyProfilesResult {
  items: ManagementPregnancyProfile[];

  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UpdateManagementPregnancyProfileInput {
  lastMenstrualPeriod?: string | null;
  expectedDueDate?: string | null;

  fetalCount?: number;

  gravida?: number;
  paraFullTerm?: number;
  paraPremature?: number;
  paraAbortion?: number;
  paraLivingChildren?: number;

  riskLevel?: PregnancyRiskLevel;
  status?: Exclude<PregnancyProfileStatus, "deleted">;

  notes?: string | null;
}

export interface CreateManagementPregnancyProfileInput {
  patientId: string;

  lastMenstrualPeriod?: string | null;
  expectedDueDate?: string | null;

  fetalCount?: number;

  gravida: number;
  paraFullTerm?: number;
  paraPremature?: number;
  paraAbortion?: number;
  paraLivingChildren?: number;

  riskLevel: PregnancyRiskLevel;
  status: "ACTIVE" | "COMPLETED" | "TERMINATED";

  notes?: string | null;
}

export interface DeleteManagementPregnancyProfileInput {
  reason?: string;
}

/* ===== Backend raw types ===== */

export interface BackendManagementPregnancyProfileUser {
  id?: string | number;

  name?: string | null;
  fullName?: string | null;

  email?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;

  cccd?: string | null;
  citizenId?: string | null;
  identificationNumber?: string | null;

  dateOfBirth?: string | null;
  dob?: string | null;

  address?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;

  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

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

export interface BackendPregnancyConsultationRecord {
  id?: string | number;

  appointmentId?: string | number | null;
  appointment?: {
    id?: string | number | null;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    service?: {
      id?: string | number | null;
      name?: string | null;
    } | null;
    doctor?: {
      id?: string | number | null;
      name?: string | null;
    } | null;
  } | null;
  appointmentServiceItemId?: string | number | null;
  appointmentServiceItem?: {
    id?: string | number | null;
    service?: {
      id?: string | number | null;
      name?: string | null;
    } | null;
    room?: {
      id?: string | number | null;
      name?: string | null;
    } | null;
    doctor?: {
      id?: string | number | null;
      name?: string | null;
    } | null;
  } | null;
  pregnancyProfileId?: string | number | null;
  doctorId?: string | number | null;
  doctor?: {
    id?: string | number | null;
    name?: string | null;
  } | null;

  diagnosis?: string | null;
  conclusion?: string | null;
  recommendation?: string | null;

  nextAppointmentSuggestedAt?: string | null;
  files?: BackendMedicalRecordFile[] | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BackendPregnancyProfilePdfRecord {
  id?: string | number;

  name?: string | null;
  fileName?: string | null;
  originalName?: string | null;

  url?: string | null;
  publicUrl?: string | null;
  fileUrl?: string | null;

  key?: string | null;
  mimeType?: string | null;
  size?: number | null;

  uploadedBy?: string | number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BackendManagementPregnancyProfile {
  id?: string | number;

  code?: string | null;
  profileCode?: string | null;

  patientId?: string | number | null;
  patientCode?: string | null;

  userId?: string | number | null;
  user?: BackendManagementPregnancyProfileUser | null;
  patient?: BackendManagementPregnancyProfileUser | null;

  lastMenstrualPeriod?: string | null;
  expectedDueDate?: string | null;

  fetalCount?: number | string | null;

  gravida?: number | string | null;
  paraFullTerm?: number | string | null;
  paraPremature?: number | string | null;
  paraAbortion?: number | string | null;
  paraLivingChildren?: number | string | null;

  riskLevel?: string | null;
  status?: string | null;

  notes?: string | null;

  medicalRecords?: unknown[] | null;
  records?: unknown[] | null;

  consultations?: BackendPregnancyConsultationRecord[] | null;

  deletedAt?: string | null;
  deletedReason?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}
