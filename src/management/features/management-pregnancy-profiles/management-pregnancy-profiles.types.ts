import { CreatePregnancyProfilePayload, PregnancyProfile, PregnancyProfileStatus, UpdatePregnancyProfilePayload } from "@/features/pregnancy-profiles/pregnancy-profiles.types";

/**
 * Bộ lọc danh sách hồ sơ thai kỳ phía quản lý.
 *
 * GET /management/pregnancy-profiles
 */
export type ManagementPregnancyProfileQuery = {
  name?: string;
  code?: string;
  phone?: string;
  status?: PregnancyProfileStatus;
  page?: number;
  limit?: number;
};

/**
 * Tạo hồ sơ thai kỳ cho một bệnh nhân.
 *
 * POST /management/pregnancy-profiles/patients/{patientId}
 */
export type CreateManagementPregnancyProfilePayload =
  CreatePregnancyProfilePayload;

/**
 * Cập nhật hồ sơ thai kỳ.
 *
 * PATCH /management/pregnancy-profiles/{id}
 */
export type UpdateManagementPregnancyProfilePayload =
  UpdatePregnancyProfilePayload;

/**
 * Swagger đang trả trực tiếp PregnancyProfile[].
 *
 * Nếu backend sau này trả thêm total, page và limit thì thay bằng:
 *
 * {
 *   data: PregnancyProfile[];
 *   total: number;
 *   page: number;
 *   limit: number;
 * }
 */
export type ManagementPregnancyProfileListResponse = PregnancyProfile[];