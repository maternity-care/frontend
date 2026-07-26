import { apiClient } from "@/lib/axios";
import type {
  CreateManagementPregnancyProfilePayload,
  ManagementPregnancyProfileListResponse,
  ManagementPregnancyProfileQuery,
  UpdateManagementPregnancyProfilePayload,
} from "./management-pregnancy-profiles.types";
import { PregnancyProfile } from "@/features/pregnancy-profiles/pregnancy-profiles.types";

const MANAGEMENT_PREGNANCY_PROFILES_ENDPOINT =
  "/management/pregnancy-profiles";

/**
 * Loại bỏ các query parameter không có giá trị trước khi gọi API.
 */
function cleanQueryParams(
  query?: ManagementPregnancyProfileQuery,
): Record<string, string | number> {
  if (!query) {
    return {};
  }

  const params: Record<string, string | number> = {};

  if (query.name?.trim()) {
    params.name = query.name.trim();
  }

  if (query.code?.trim()) {
    params.code = query.code.trim();
  }

  if (query.phone?.trim()) {
    params.phone = query.phone.trim();
  }

  if (query.status) {
    params.status = query.status.toLowerCase();
  }

  if (query.page !== undefined) {
    params.page = query.page;
  }

  if (query.limit !== undefined) {
    params.limit = query.limit;
  }

  return params;
}

/**
 * Lấy danh sách toàn bộ hồ sơ thai kỳ.
 *
 * GET /management/pregnancy-profiles
 */
export async function getManagementPregnancyProfiles(
  query?: ManagementPregnancyProfileQuery,
): Promise<ManagementPregnancyProfileListResponse> {
  const response =
    await apiClient.get<ManagementPregnancyProfileListResponse>(
      MANAGEMENT_PREGNANCY_PROFILES_ENDPOINT,
      {
        params: cleanQueryParams(query),
      },
    );

  return response.data;
}

/**
 * Tạo hồ sơ thai kỳ cho một bệnh nhân.
 *
 * POST /management/pregnancy-profiles/patients/{patientId}
 */
export async function createPregnancyProfileForPatient(
  patientId: string,
  payload: CreateManagementPregnancyProfilePayload,
): Promise<PregnancyProfile> {
  const response = await apiClient.post<PregnancyProfile>(
    `${MANAGEMENT_PREGNANCY_PROFILES_ENDPOINT}/patients/${encodeURIComponent(
      patientId,
    )}`,
    payload,
  );

  return response.data;
}

/**
 * Lấy danh sách hồ sơ thai kỳ của một bệnh nhân.
 *
 * GET /management/pregnancy-profiles/patients/{patientId}
 */
export async function getPregnancyProfilesByPatientId(
  patientId: string,
): Promise<PregnancyProfile[]> {
  const response = await apiClient.get<PregnancyProfile[]>(
    `${MANAGEMENT_PREGNANCY_PROFILES_ENDPOINT}/patients/${encodeURIComponent(
      patientId,
    )}`,
  );

  return response.data;
}

/**
 * Lấy chi tiết hồ sơ thai kỳ.
 *
 * GET /management/pregnancy-profiles/{id}
 */
export async function getManagementPregnancyProfileById(
  id: string,
): Promise<PregnancyProfile> {
  const response = await apiClient.get<PregnancyProfile>(
    `${MANAGEMENT_PREGNANCY_PROFILES_ENDPOINT}/${encodeURIComponent(id)}`,
  );

  return response.data;
}

/**
 * Cập nhật hồ sơ thai kỳ.
 *
 * PATCH /management/pregnancy-profiles/{id}
 */
export async function updateManagementPregnancyProfile(
  id: string,
  payload: UpdateManagementPregnancyProfilePayload,
): Promise<PregnancyProfile> {
  const response = await apiClient.patch<PregnancyProfile>(
    `${MANAGEMENT_PREGNANCY_PROFILES_ENDPOINT}/${encodeURIComponent(id)}`,
    payload,
  );

  return response.data;
}

/**
 * Xóa hồ sơ thai kỳ.
 *
 * DELETE /management/pregnancy-profiles/{id}
 */
export async function deleteManagementPregnancyProfile(
  id: string,
): Promise<PregnancyProfile> {
  const response = await apiClient.delete<PregnancyProfile>(
    `${MANAGEMENT_PREGNANCY_PROFILES_ENDPOINT}/${encodeURIComponent(id)}`,
  );

  return response.data;
}