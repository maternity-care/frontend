export type PregnancyProfileStatus =
  | "active"
  | "completed"
  | "terminated"
  | "deleted"
  | string;

export type PregnancyRiskLevel = "low" | "medium" | "high" | string;

export interface PregnancyProfileUser {
  id: string;
  cccd: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  priorityLevel?: number | null;
  province: string | null;
  ward: string | null;
  status?: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface PregnancyProfile {
  id: string;
  patientId: string | null;
  code: string | null;
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
  user: PregnancyProfileUser | null;
  medicalRecords: unknown[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;
}

export interface CreatePregnancyProfileInput {
  lastMenstrualPeriod: string;
  expectedDueDate: string;
  fetalCount?: number;
  gravida?: number;
  paraFullTerm?: number;
  paraPremature?: number;
  paraAbortion?: number;
  paraLivingChildren?: number;
  riskLevel?: PregnancyRiskLevel;
  status?: PregnancyProfileStatus;
  notes?: string | null;
}

export interface UpdatePregnancyProfileInput {
  lastMenstrualPeriod?: string | null;
  expectedDueDate?: string | null;
  fetalCount?: number;
  gravida?: number;
  paraFullTerm?: number;
  paraPremature?: number;
  paraAbortion?: number;
  paraLivingChildren?: number;
  riskLevel?: PregnancyRiskLevel;
  status?: PregnancyProfileStatus;
  notes?: string | null;
}

/* ===== Backend raw ===== */

export interface BackendPregnancyProfileUser {
  id?: string | number;
  cccd?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  priorityLevel?: number | null;
  province?: string | null;
  ward?: string | null;
  status?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface BackendPregnancyProfile {
  id?: string | number;
  patientId?: string | number | null;
  code?: string | null;
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
  user?: BackendPregnancyProfileUser | null;
  medicalRecords?: unknown[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;
}