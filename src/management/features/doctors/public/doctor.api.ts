import { apiClient, ApiResponse, unwrapApiData } from "@/lib/axios";
import { Doctor, DoctorListResponse } from "./doctor.types"; // ← chỉ dùng type public

/**
 * GET /doctors/landing-page
 * Lấy profile doctor hiện tại (mặc định khi chưa chọn facility)
 */
export async function getCurrentDoctorLandingPage(): Promise<Doctor[]> {
  const res = await unwrapApiData(
    apiClient.get<ApiResponse<DoctorListResponse>>("/doctors/landing-page"),
  );

  // res = { data: Doctor[], count: number }
  return res?.data ?? [];
}

/**
 * GET /doctors/landing-page/facility/{id}
 * Lấy danh sách doctors theo facility
 * Response: { success, message, data: { data: Doctor[], count } }
 */
export async function getDoctorsByFacility(
  facilityId: string,
): Promise<Doctor[]> {
  const res = await unwrapApiData(
    apiClient.get<ApiResponse<DoctorListResponse>>(
      `/doctors/landing-page/facility/${facilityId}`,
    ),
  );

  // res = { data: Doctor[], count: number }
  return res?.data ?? [];
}