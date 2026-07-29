import { apiClient } from "@/lib/axios";
import type {
  BulkAssignFacilityServicesInput,
  CreateFacilityServiceInput,
  ManagementFacilityService,
  ManagementFacilityServiceListResult,
  ManagementFacilityServiceQuery,
  UpdateFacilityServiceInput,
} from "./facility-services.types";

const ENDPOINT = "/management/facility-services";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ListPayload {
  items: ManagementFacilityService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getManagementFacilityServices(
  query: ManagementFacilityServiceQuery = {},
): Promise<ManagementFacilityServiceListResult> {
  const response = await apiClient.get<ApiResponse<ListPayload>>(ENDPOINT, {
    params: query,
  });

  const payload = response.data?.data;

  if (!payload || !Array.isArray(payload.items)) {
    console.error("FACILITY SERVICES RESPONSE KHÔNG ĐÚNG:", response.data);
    throw new Error(
      "API trả về danh sách facility services không đúng cấu trúc.",
    );
  }

  return {
    items: payload.items,
    total: Number(payload.total ?? payload.items.length),
    page: Number(payload.page ?? query.page ?? 1),
    limit: Number(payload.limit ?? query.limit ?? 20),
    totalPages: Number(payload.totalPages ?? 1),
  };
}

export async function getManagementFacilityServiceById(
  id: string,
): Promise<ManagementFacilityService> {
  const response = await apiClient.get<ApiResponse<ManagementFacilityService>>(
    `${ENDPOINT}/${id}`,
  );
  return response.data.data;
}

export async function createManagementFacilityService(
  input: CreateFacilityServiceInput,
): Promise<ManagementFacilityService> {
  const response = await apiClient.post<ApiResponse<ManagementFacilityService>>(
    ENDPOINT,
    input,
  );
  return response.data.data;
}

export async function updateManagementFacilityService(
  id: string,
  input: UpdateFacilityServiceInput,
): Promise<ManagementFacilityService> {
  const response = await apiClient.patch<
    ApiResponse<ManagementFacilityService>
  >(`${ENDPOINT}/${id}`, input);
  return response.data.data;
}

export async function deleteManagementFacilityService(
  id: string,
): Promise<ManagementFacilityService | null> {
  const response = await apiClient.delete(`${ENDPOINT}/${id}`);

  if (
    response.status === 204 ||
    response.data === null ||
    response.data === undefined ||
    response.data === ""
  ) {
    return null;
  }

  return (response.data as ApiResponse<ManagementFacilityService>).data ?? null;
}

export async function bulkAssignFacilityServices(
  input: BulkAssignFacilityServicesInput,
): Promise<unknown> {
  const response = await apiClient.post(`${ENDPOINT}/bulk`, input);
  return (response.data as ApiResponse<unknown>)?.data ?? response.data;
}