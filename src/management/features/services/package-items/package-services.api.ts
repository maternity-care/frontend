import { apiClient } from "@/lib/axios";
import type {
  DeletePackageServiceResult,
  ManagementPackageService,
  ManagementPackageServiceListResult,
  ManagementPackageServiceQuery,
  UpdatePackageServiceInput,
} from "./package-services.types";

const ENDPOINT = "/management/package-services";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ListPayload {
  items: ManagementPackageService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getManagementPackageServices(
  query: ManagementPackageServiceQuery = {},
): Promise<ManagementPackageServiceListResult> {
  const response = await apiClient.get<ApiResponse<ListPayload>>(ENDPOINT, {
    params: query,
  });

  const payload = response.data?.data;

  // Backend trả {} / null / thiếu items → coi như list rỗng, KHÔNG throw
  if (!payload || !Array.isArray(payload.items)) {
    console.warn("PACKAGE SERVICES RESPONSE KHÔNG ĐÚNG:", response.data);
    return {
      items: [],
      total: 0,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
      totalPages: 0,
    };
  }

  return {
    items: payload.items,
    total: Number(payload.total ?? payload.items.length),
    page: Number(payload.page ?? query.page ?? 1),
    limit: Number(payload.limit ?? query.limit ?? 20),
    totalPages: Number(payload.totalPages ?? 1),
  };
}

export async function getManagementPackageServiceById(
  id: string,
): Promise<ManagementPackageService> {
  const response = await apiClient.get<ApiResponse<ManagementPackageService>>(
    `${ENDPOINT}/${id}`,
  );
  return response.data.data;
}

export async function updateManagementPackageService(
  id: string,
  input: UpdatePackageServiceInput,
): Promise<ManagementPackageService> {
  const response = await apiClient.patch<
    ApiResponse<ManagementPackageService>
  >(`${ENDPOINT}/${id}`, input);
  return response.data.data;
}

export async function deleteManagementPackageService(
  id: string,
): Promise<DeletePackageServiceResult> {
  const response = await apiClient.delete(`${ENDPOINT}/${id}`);

  if (
    response.status === 204 ||
    response.data === null ||
    response.data === undefined ||
    response.data === ""
  ) {
    return null;
  }

  return (
    (response.data as ApiResponse<ManagementPackageService>).data ?? null
  );
}