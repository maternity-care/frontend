import { apiClient, unwrapApiData } from "@/lib/axios";
import { PregnancyProfile } from "./pregnancy-profiles.types";

const ENDPOINT = "/pregnancy-profiles";

/** Lấy danh sách hồ sơ thai của chính mình */
export async function getMyPregnancyProfiles(): Promise<PregnancyProfile[]> {
  return unwrapApiData<PregnancyProfile[]>(
    apiClient.get(`${ENDPOINT}/me`),
  );
}

/** Lấy chi tiết 1 hồ sơ thai */
export async function getMyPregnancyProfileDetail(
  id: string,
): Promise<PregnancyProfile> {
  return unwrapApiData<PregnancyProfile>(
    apiClient.get(`${ENDPOINT}/${encodeURIComponent(id)}`),
  );
}