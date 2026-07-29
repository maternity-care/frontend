import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  BackendPregnancyProfile,
  BackendPregnancyProfileUser,
  CreatePregnancyProfileInput,
  PregnancyProfile,
  PregnancyProfileUser,
  PregnancyRiskLevel,
  PregnancyProfileStatus,
  UpdatePregnancyProfileInput,
} from "./pregnancy-profiles.types";

const PREGNANCY_PROFILES_URL = "/pregnancy-profiles";

/* ===================== Helpers ===================== */

function toStringValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
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

function normalizeRiskLevel(value?: string | null): PregnancyRiskLevel {
  const normalized = value?.toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  if (normalized === "low") return "low";
  return (value as PregnancyRiskLevel) || "low";
}

function normalizeStatus(value?: string | null): PregnancyProfileStatus {
  const normalized = value?.toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "terminated") return "terminated";
  if (normalized === "deleted") return "deleted";
  if (normalized === "active") return "active";
  return (value as PregnancyProfileStatus) || "active";
}

function normalizeUser(
  user?: BackendPregnancyProfileUser | null,
): PregnancyProfileUser | null {
  if (!user || typeof user !== "object") return null;

  return {
    id: toStringValue(user.id),
    cccd: user.cccd ?? null,
    name: user.name ?? null,
    phone: user.phone ?? null,
    email: user.email ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    address: user.address ?? null,
    priorityLevel: user.priorityLevel ?? null,
    province: user.province ?? null,
    ward: user.ward ?? null,
    status: user.status ?? null,
    emergencyContactName: user.emergencyContactName ?? null,
    emergencyContactPhone: user.emergencyContactPhone ?? null,
    metadata: user.metadata ?? null,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
    deletedAt: user.deletedAt ?? null,
  };
}

export function normalizePregnancyProfile(
  profile: BackendPregnancyProfile | null | undefined,
): PregnancyProfile {
  if (!profile || typeof profile !== "object") {
    throw new Error("Dữ liệu hồ sơ thai kỳ không hợp lệ");
  }

  return {
    id: toStringValue(profile.id),
    patientId: toNullableString(profile.patientId),
    code: profile.code ?? null,
    lastMenstrualPeriod: profile.lastMenstrualPeriod ?? null,
    expectedDueDate: profile.expectedDueDate ?? null,
    fetalCount:
      profile.fetalCount === null || profile.fetalCount === undefined
        ? null
        : toNumber(profile.fetalCount, 1),
    gravida: toNumber(profile.gravida),
    paraFullTerm: toNumber(profile.paraFullTerm),
    paraPremature: toNumber(profile.paraPremature),
    paraAbortion: toNumber(profile.paraAbortion),
    paraLivingChildren: toNumber(profile.paraLivingChildren),
    riskLevel: normalizeRiskLevel(profile.riskLevel),
    status: normalizeStatus(profile.status),
    notes: profile.notes ?? null,
    user: normalizeUser(profile.user),
    medicalRecords: Array.isArray(profile.medicalRecords)
      ? profile.medicalRecords
      : [],
    createdAt: profile.createdAt ?? "",
    updatedAt: profile.updatedAt ?? "",
    createdBy: profile.createdBy ?? null,
    deletedAt: profile.deletedAt ?? null,
    deletedBy: profile.deletedBy ?? null,
    deletedReason: profile.deletedReason ?? null,
  };
}

/* ===================== API ===================== */

/**
 * GET /pregnancy-profiles/:id
 * id = user.id từ /auth/me
 */
export async function getMyPregnancyProfileById(
  id: string,
): Promise<PregnancyProfile> {
  const profileId = String(id || "").trim();
  if (!profileId) {
    throw new Error("Thiếu id hồ sơ thai kỳ");
  }

  const data = await unwrapApiData<BackendPregnancyProfile>(
    apiClient.get(`${PREGNANCY_PROFILES_URL}/${profileId}`, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      params: { _t: Date.now() },
    }),
  );

  if (!data || typeof data !== "object" || data.id == null) {
    throw new Error("Không tìm thấy hồ sơ thai kỳ");
  }

  return normalizePregnancyProfile(data);
}

export async function getMyPregnancyProfiles(): Promise<PregnancyProfile[]> {
  const data = await unwrapApiData<
    BackendPregnancyProfile[] | BackendPregnancyProfile
  >(apiClient.get(`${PREGNANCY_PROFILES_URL}/me`));

  if (Array.isArray(data)) {
    return data.map(normalizePregnancyProfile);
  }

  if (data && typeof data === "object" && "id" in data) {
    return [normalizePregnancyProfile(data)];
  }

  return [];
}

export async function createPregnancyProfile(
  input: CreatePregnancyProfileInput,
): Promise<PregnancyProfile> {
  const data = await unwrapApiData<BackendPregnancyProfile>(
    apiClient.post(PREGNANCY_PROFILES_URL, input),
  );
  return normalizePregnancyProfile(data);
}

export async function updatePregnancyProfile(
  id: string,
  input: UpdatePregnancyProfileInput,
): Promise<PregnancyProfile> {
  const data = await unwrapApiData<BackendPregnancyProfile>(
    apiClient.patch(`${PREGNANCY_PROFILES_URL}/${id}`, input),
  );
  return normalizePregnancyProfile(data);
}

export async function softDeletePregnancyProfile(
  id: string,
): Promise<PregnancyProfile> {
  const data = await unwrapApiData<BackendPregnancyProfile>(
    apiClient.post(`${PREGNANCY_PROFILES_URL}/soft-delete/${id}`),
  );
  return normalizePregnancyProfile(data);
}

export async function confirmSoftDeletePregnancyProfile(
  id: string,
  payload?: { confirm?: boolean; reason?: string },
): Promise<PregnancyProfile> {
  const data = await unwrapApiData<BackendPregnancyProfile>(
    apiClient.patch(`${PREGNANCY_PROFILES_URL}/soft-delete/${id}`, payload),
  );
  return normalizePregnancyProfile(data);
}