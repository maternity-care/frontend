import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  GetMaternityPackagesParams,
  MaternityPackage,
} from "./maternity-packages.types";

function removeUndefined<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

/**
 * GET /public/maternity-packages
 * Lấy danh sách gói thai sản (public)
 */
export async function getPublicMaternityPackages(
  params?: GetMaternityPackagesParams,
): Promise<MaternityPackage[]> {
  const data = await unwrapApiData<MaternityPackage[]>(
    apiClient.get("/public/maternity-packages", {
      params: removeUndefined({
        search: params?.search?.trim() || undefined,
        status: params?.status || "active",
        facilityId: params?.facilityId || undefined,
        page: params?.page,
        limit: params?.limit ?? 20,
      }),
    }),
  );

  return Array.isArray(data) ? data : [];
}