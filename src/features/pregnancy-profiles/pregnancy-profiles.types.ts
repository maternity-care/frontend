export type PregnancyRiskLevel = "low" | "medium" | "high";

export type PregnancyProfileStatus =
  | "active"
  | "completed"
  | "terminated"
  | "deleted";

export type PregnancyUserStatus = "active" | "inactive" | "locked";

export interface PregnancyProfileUser {
  id: string;
  cccd: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  province: string | null;
  ward: string | null;
  status: PregnancyUserStatus;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Swagger hiện chỉ trả medicalRecords là string[].
 * Có thể là ID hoặc URL của hồ sơ y tế.
 */
export type PregnancyMedicalRecordReference = string;

export interface PregnancyProfile {
  id: string;
  patientId: string;
  code: string;

  lastMenstrualPeriod: string | null;
  expectedDueDate: string | null;

  /**
   * Swagger nhận fetalCount khi create/update nhưng hiện
   * chưa thể hiện trong response. Để optional tránh lỗi.
   */
  fetalCount?: number | null;

  gravida: number;
  paraFullTerm: number;
  paraPremature: number;
  paraAbortion: number;
  paraLivingChildren: number;

  riskLevel: PregnancyRiskLevel;
  status: PregnancyProfileStatus;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
  createdBy: string | null;

  deletedAt: string | null;
  deletedBy: string | null;
  deletedReason: string | null;

  user: PregnancyProfileUser | null;
  medicalRecords: Array<string | PregnancyConsultation>;
}

/**
 * Dữ liệu thai phụ được phép nhập khi tạo hồ sơ.
 *
 * riskLevel và status không có ở đây vì đây là dữ liệu
 * chuyên môn, backend nên tự đặt mặc định:
 * - riskLevel: low
 * - status: active
 */
export interface CreatePregnancyProfileInput {
  lastMenstrualPeriod: string;
  expectedDueDate?: string | null;
  fetalCount?: number;

  gravida?: number;
  paraFullTerm?: number;
  paraPremature?: number;
  paraAbortion?: number;
  paraLivingChildren?: number;

  notes?: string | null;
}

/**
 * Thai phụ không được tự cập nhật:
 * - riskLevel
 * - status
 * - patientId
 * - code
 * - medicalRecords
 */
export type UpdatePregnancyProfileInput = Partial<
  Pick<
    CreatePregnancyProfileInput,
    | "lastMenstrualPeriod"
    | "expectedDueDate"
    | "fetalCount"
    | "gravida"
    | "paraFullTerm"
    | "paraPremature"
    | "paraAbortion"
    | "paraLivingChildren"
    | "notes"
  >
>;

export interface BackendPregnancyProfileUser {
  id: string | number;
  cccd?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
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
  id: string | number;
  patientId: string | number;
  code?: string | null;

  lastMenstrualPeriod?: string | null;
  expectedDueDate?: string | null;
  fetalCount?: number | null;

  gravida?: number | null;
  paraFullTerm?: number | null;
  paraPremature?: number | null;
  paraAbortion?: number | null;
  paraLivingChildren?: number | null;

  riskLevel?: string | null;
  status?: string | null;

  notes?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;

  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;

  user?: BackendPregnancyProfileUser | null;
  medicalRecords?: string[] | null;
}

export interface PregnancyConsultation {
  id: string;
  appointmentId?: string | null;
  pregnancyProfileId?: string | null;
  doctorId?: string | null;

  diagnosis?: string | null;
  conclusion?: string | null;
  recommendation?: string | null;
  nextAppointmentSuggestedAt?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

function normalizeUserStatus(
  status?: string | null,
): PregnancyUserStatus {
  switch (status?.toLowerCase()) {
    case "active":
      return "active";

    case "locked":
      return "locked";

    default:
      return "inactive";
  }
}

export function normalizePregnancyRiskLevel(
  riskLevel?: string | null,
): PregnancyRiskLevel {
  switch (riskLevel?.toLowerCase()) {
    case "high":
      return "high";

    case "medium":
      return "medium";

    default:
      return "low";
  }
}

export function normalizePregnancyProfileStatus(
  status?: string | null,
): PregnancyProfileStatus {
  switch (status?.toLowerCase()) {
    case "completed":
      return "completed";

    case "terminated":
      return "terminated";

    case "deleted":
      return "deleted";

    default:
      return "active";
  }
}

function normalizePregnancyProfileUser(
  user?: BackendPregnancyProfileUser | null,
): PregnancyProfileUser | null {
  if (!user) {
    return null;
  }

  return {
    id: String(user.id),
    cccd: user.cccd ?? null,
    name: user.name ?? "",
    phone: user.phone ?? null,
    email: user.email ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    address: user.address ?? null,
    province: user.province ?? null,
    ward: user.ward ?? null,
    status: normalizeUserStatus(user.status),
    emergencyContactName: user.emergencyContactName ?? null,
    emergencyContactPhone: user.emergencyContactPhone ?? null,
    metadata: user.metadata ?? {},
    createdAt: user.createdAt ?? "",
    updatedAt: user.updatedAt ?? "",
    deletedAt: user.deletedAt ?? null,
  };
}

export function normalizePregnancyProfile(
  profile: BackendPregnancyProfile,
): PregnancyProfile {
  return {
    id: String(profile.id),
    patientId: String(profile.patientId),
    code: profile.code ?? "",

    lastMenstrualPeriod: profile.lastMenstrualPeriod ?? null,
    expectedDueDate: profile.expectedDueDate ?? null,
    fetalCount: profile.fetalCount ?? null,

    gravida: profile.gravida ?? 0,
    paraFullTerm: profile.paraFullTerm ?? 0,
    paraPremature: profile.paraPremature ?? 0,
    paraAbortion: profile.paraAbortion ?? 0,
    paraLivingChildren: profile.paraLivingChildren ?? 0,

    riskLevel: normalizePregnancyRiskLevel(profile.riskLevel),
    status: normalizePregnancyProfileStatus(profile.status),

    notes: profile.notes ?? null,

    createdAt: profile.createdAt ?? "",
    updatedAt: profile.updatedAt ?? "",
    createdBy: profile.createdBy ?? null,

    deletedAt: profile.deletedAt ?? null,
    deletedBy: profile.deletedBy ?? null,
    deletedReason: profile.deletedReason ?? null,

    user: normalizePregnancyProfileUser(profile.user),
    medicalRecords: profile.medicalRecords ?? [],
  };
}