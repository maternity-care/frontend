import { apiClient } from "@/lib/axios";

import type {
  BackendManagementPregnancyProfile,
  BackendManagementPregnancyProfileUser,
  BackendPregnancyConsultationRecord,
  BackendPregnancyProfilePdfRecord,
  DeleteManagementPregnancyProfileInput,
  GetManagementPregnancyProfilesParams,
  ManagementMedicalRecord,
  ManagementPregnancyProfile,
  ManagementPregnancyProfilesResult,
  ManagementPregnancyProfileUser,
  PregnancyConsultationRecord,
  PregnancyProfilePdfRecord,
  PregnancyProfileStatus,
  PregnancyRiskLevel,
  UpdateManagementPregnancyProfileInput,
} from "./management-pregnancy-profiles.types";

const MANAGEMENT_PREGNANCY_PROFILES_URL =
  "/management/pregnancy-profiles";

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

interface BackendPaginatedResult<T> {
  items?: T[];
  data?: T[];

  page?: number;
  currentPage?: number;

  limit?: number;
  pageSize?: number;

  total?: number;
  totalItems?: number;
  totalCount?: number;

  totalPages?: number;
}

function unwrapData<T>(value: T | ApiEnvelope<T>): T {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    (value as ApiEnvelope<T>).data !== undefined
  ) {
    return (value as ApiEnvelope<T>).data as T;
  }

  return value as T;
}

function toStringValue(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function toNullableString(
  value: string | number | null | undefined,
): string | null {
  const result = toStringValue(value).trim();
  return result || null;
}

function toNumber(
  value: string | number | null | undefined,
  fallback = 0,
): number {
  const result = Number(value);

  return Number.isFinite(result) ? result : fallback;
}

function normalizeRiskLevel(
  value?: string | null,
): PregnancyRiskLevel {
  const normalized = value?.toLowerCase();

  if (normalized === "high") {
    return "high";
  }

  if (normalized === "medium") {
    return "medium";
  }

  return "low";
}

function normalizeStatus(
  value?: string | null,
): PregnancyProfileStatus {
  const normalized = value?.toLowerCase();

  if (normalized === "completed") {
    return "completed";
  }

  if (normalized === "terminated") {
    return "terminated";
  }

  if (normalized === "deleted") {
    return "deleted";
  }

  return "active";
}

function normalizeUser(
  user?: BackendManagementPregnancyProfileUser | null,
): ManagementPregnancyProfileUser | null {
  if (!user) {
    return null;
  }

  return {
    id: toStringValue(user.id),

    name: user.name ?? user.fullName ?? null,
    email: user.email ?? null,
    phone: user.phone ?? user.phoneNumber ?? null,

    cccd:
      user.cccd ??
      user.citizenId ??
      user.identificationNumber ??
      null,

    dateOfBirth: user.dateOfBirth ?? user.dob ?? null,

    address: user.address ?? null,
    ward: user.ward ?? null,
    district: user.district ?? null,
    province: user.province ?? null,

    emergencyContactName: user.emergencyContactName ?? null,
    emergencyContactPhone: user.emergencyContactPhone ?? null,

    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isConsultationRecord(
  value: unknown,
): value is BackendPregnancyConsultationRecord {
  if (!isObject(value)) {
    return false;
  }

  return (
    "diagnosis" in value ||
    "conclusion" in value ||
    "recommendation" in value ||
    "appointmentId" in value ||
    "nextAppointmentSuggestedAt" in value
  );
}

function isPdfRecord(
  value: unknown,
): value is BackendPregnancyProfilePdfRecord {
  if (!isObject(value)) {
    return false;
  }

  return (
    "url" in value ||
    "publicUrl" in value ||
    "fileUrl" in value ||
    "fileName" in value ||
    "mimeType" in value
  );
}

function normalizeConsultation(
  consultation: BackendPregnancyConsultationRecord,
): PregnancyConsultationRecord {
  return {
    id: toStringValue(consultation.id),

    appointmentId: toNullableString(
      consultation.appointmentId,
    ),

    pregnancyProfileId: toNullableString(
      consultation.pregnancyProfileId,
    ),

    doctorId: toNullableString(consultation.doctorId),

    diagnosis: consultation.diagnosis ?? null,
    conclusion: consultation.conclusion ?? null,
    recommendation: consultation.recommendation ?? null,

    nextAppointmentSuggestedAt:
      consultation.nextAppointmentSuggestedAt ?? null,

    createdAt: consultation.createdAt ?? null,
    updatedAt: consultation.updatedAt ?? null,
  };
}

function normalizePdfRecord(
  record: BackendPregnancyProfilePdfRecord,
): PregnancyProfilePdfRecord {
  const url =
    record.url ??
    record.publicUrl ??
    record.fileUrl ??
    "";

  const name =
    record.name ??
    record.fileName ??
    record.originalName ??
    getFileNameFromUrl(url) ??
    "Tài liệu PDF";

  return {
    id: toStringValue(record.id) || url || name,
    name,
    url,

    key: record.key ?? null,
    mimeType: record.mimeType ?? null,
    size:
      record.size === null || record.size === undefined
        ? null
        : toNumber(record.size),

    uploadedBy: toNullableString(record.uploadedBy),
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
  };
}

function getFileNameFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const lastSegment = url.pathname
      .split("/")
      .filter(Boolean)
      .at(-1);

    return lastSegment
      ? decodeURIComponent(lastSegment)
      : null;
  } catch {
    return null;
  }
}

function normalizeMedicalRecord(
  value: unknown,
): ManagementMedicalRecord | null {
  if (typeof value === "string") {
    return value;
  }

  if (isConsultationRecord(value)) {
    return normalizeConsultation(value);
  }

  if (isPdfRecord(value)) {
    return normalizePdfRecord(value);
  }

  return null;
}

export function normalizeManagementPregnancyProfile(
  profile: BackendManagementPregnancyProfile,
): ManagementPregnancyProfile {
  const rawMedicalRecords =
    profile.medicalRecords ?? profile.records ?? [];

  const medicalRecords = rawMedicalRecords
    .map(normalizeMedicalRecord)
    .filter(
      (record): record is ManagementMedicalRecord =>
        record !== null,
    );

  const consultationsFromDedicatedField = (
    profile.consultations ?? []
  ).map(normalizeConsultation);

  const consultationsFromMedicalRecords =
    medicalRecords.filter(
      (
        record,
      ): record is PregnancyConsultationRecord =>
        typeof record === "object" &&
        "diagnosis" in record &&
        "appointmentId" in record,
    );

  return {
    id: toStringValue(profile.id),

    code: profile.code ?? profile.profileCode ?? null,

    patientId: toNullableString(
      profile.patientId ?? profile.patientCode,
    ),

    userId: toNullableString(profile.userId),

    user: normalizeUser(profile.user ?? profile.patient),

    lastMenstrualPeriod:
      profile.lastMenstrualPeriod ?? null,

    expectedDueDate: profile.expectedDueDate ?? null,

    fetalCount:
      profile.fetalCount === null ||
      profile.fetalCount === undefined
        ? null
        : toNumber(profile.fetalCount, 1),

    gravida: toNumber(profile.gravida),
    paraFullTerm: toNumber(profile.paraFullTerm),
    paraPremature: toNumber(profile.paraPremature),
    paraAbortion: toNumber(profile.paraAbortion),
    paraLivingChildren: toNumber(
      profile.paraLivingChildren,
    ),

    riskLevel: normalizeRiskLevel(profile.riskLevel),
    status: normalizeStatus(profile.status),

    notes: profile.notes ?? null,

    medicalRecords,
    consultations: [
      ...consultationsFromDedicatedField,
      ...consultationsFromMedicalRecords,
    ],

    deletedAt: profile.deletedAt ?? null,
    deletedReason: profile.deletedReason ?? null,

    createdAt: profile.createdAt ?? "",
    updatedAt: profile.updatedAt ?? "",
  };
}

export async function getManagementPregnancyProfiles(
  params: GetManagementPregnancyProfilesParams = {},
): Promise<ManagementPregnancyProfilesResult> {
  const response = await apiClient.get<
    | BackendPaginatedResult<BackendManagementPregnancyProfile>
    | ApiEnvelope<
        BackendPaginatedResult<BackendManagementPregnancyProfile>
      >
  >(MANAGEMENT_PREGNANCY_PROFILES_URL, {
    params,
  });

  const result = unwrapData(response.data);

  const rawItems = result.items ?? result.data ?? [];
  const page = result.page ?? result.currentPage ?? params.page ?? 1;
  const limit =
    result.limit ?? result.pageSize ?? params.limit ?? 10;

  const total =
    result.total ??
    result.totalItems ??
    result.totalCount ??
    rawItems.length;

  const totalPages =
    result.totalPages ??
    Math.max(1, Math.ceil(total / Math.max(1, limit)));

  return {
    items: rawItems.map(
      normalizeManagementPregnancyProfile,
    ),
    page,
    limit,
    total,
    totalPages,
  };
}

export async function getManagementPregnancyProfileById(
  id: string,
): Promise<ManagementPregnancyProfile> {
  const response = await apiClient.get<
    | BackendManagementPregnancyProfile
    | ApiEnvelope<BackendManagementPregnancyProfile>
  >(`${MANAGEMENT_PREGNANCY_PROFILES_URL}/${id}`);

  return normalizeManagementPregnancyProfile(
    unwrapData(response.data),
  );
}

export async function updateManagementPregnancyProfile(
  id: string,
  input: UpdateManagementPregnancyProfileInput,
): Promise<ManagementPregnancyProfile> {
  const response = await apiClient.patch<
    | BackendManagementPregnancyProfile
    | ApiEnvelope<BackendManagementPregnancyProfile>
  >(`${MANAGEMENT_PREGNANCY_PROFILES_URL}/${id}`, input);

  return normalizeManagementPregnancyProfile(
    unwrapData(response.data),
  );
}

export async function deleteManagementPregnancyProfile(
  id: string,
  input?: DeleteManagementPregnancyProfileInput,
): Promise<void> {
  await apiClient.delete(
    `${MANAGEMENT_PREGNANCY_PROFILES_URL}/${id}`,
    {
      data: input,
    },
  );
}