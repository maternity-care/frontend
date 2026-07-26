import { apiClient } from "@/lib/axios";

import type {
  ConfirmSoftDeletePregnancyProfilePayload,
  CreatePregnancyProfilePayload,
  PregnancyProfile,
  SoftDeletePregnancyProfilePayload,
  UpdatePregnancyProfilePayload,
} from "./pregnancy-profiles.types";

const PREGNANCY_PROFILES_ENDPOINT = "/pregnancy-profiles";

/**
 * Lấy toàn bộ hồ sơ thai kỳ của người dùng hiện tại.
 *
 * GET /pregnancy-profiles
 */
export async function getMyPregnancyProfiles(): Promise<
  PregnancyProfile[]
> {
  const response = await apiClient.get<PregnancyProfile[]>(
    PREGNANCY_PROFILES_ENDPOINT,
  );

  return response.data;
}

/**
 * Tạo hồ sơ thai kỳ mới.
 *
 * POST /pregnancy-profiles
 */
export async function createPregnancyProfile(
  payload: CreatePregnancyProfilePayload,
): Promise<PregnancyProfile> {
  const response = await apiClient.post<PregnancyProfile>(
    PREGNANCY_PROFILES_ENDPOINT,
    payload,
  );

  return response.data;
}

/**
 * Lấy chi tiết một hồ sơ thai kỳ.
 *
 * GET /pregnancy-profiles/{id}
 */
export async function getMyPregnancyProfileById(
  id: string,
): Promise<PregnancyProfile> {
  const response = await apiClient.get<PregnancyProfile>(
    `${PREGNANCY_PROFILES_ENDPOINT}/${encodeURIComponent(id)}`,
  );

  return response.data;
}

/**
 * Cập nhật hồ sơ thai kỳ.
 *
 * PATCH /pregnancy-profiles/{id}
 */
export async function updatePregnancyProfile(
  id: string,
  payload: UpdatePregnancyProfilePayload,
): Promise<PregnancyProfile> {
  const response = await apiClient.patch<PregnancyProfile>(
    `${PREGNANCY_PROFILES_ENDPOINT}/${encodeURIComponent(id)}`,
    payload,
  );

  return response.data;
}

/**
 * Gửi yêu cầu xóa mềm hồ sơ thai kỳ.
 *
 * POST /pregnancy-profiles/soft-delete/{id}
 *
 * Swagger hiện không khai báo request body. Payload được để optional
 * để có thể gửi lý do xóa nếu backend hỗ trợ.
 */
export async function requestSoftDeletePregnancyProfile(
  id: string,
  payload?: SoftDeletePregnancyProfilePayload,
): Promise<PregnancyProfile> {
  const response = await apiClient.post<PregnancyProfile>(
    `${PREGNANCY_PROFILES_ENDPOINT}/soft-delete/${encodeURIComponent(id)}`,
    payload,
  );

  return response.data;
}

/**
 * Xác nhận hoặc từ chối yêu cầu xóa mềm.
 *
 * PATCH /pregnancy-profiles/soft-delete/{id}
 *
 * Swagger hiện chưa khai báo request body. Vì vậy payload để optional.
 */
export async function confirmOrRejectSoftDeletePregnancyProfile(
  id: string,
  payload?: ConfirmSoftDeletePregnancyProfilePayload,
): Promise<PregnancyProfile> {
  const response = await apiClient.patch<PregnancyProfile>(
    `${PREGNANCY_PROFILES_ENDPOINT}/soft-delete/${encodeURIComponent(id)}`,
    payload,
  );

  return response.data;
}