import { apiClient, unwrapApiData } from "@/lib/axios";

import type {
  CreateManagementServiceInput,
  DeleteManagementServiceResult,
  ManagementService,
  ManagementServiceListResult,
  ManagementServiceQuery,
  UpdateManagementServiceInput,
} from "./services.types";

const MANAGEMENT_SERVICES_ENDPOINT = "/management/services";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ServiceListPayload {
  items: ManagementService[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getManagementServices(
  query: ManagementServiceQuery = {},
): Promise<ManagementServiceListResult> {
  const response = await apiClient.get<
    ApiResponse<ServiceListPayload | ManagementService[]>
  >(MANAGEMENT_SERVICES_ENDPOINT, {
    params: query,
  });

  const payload = response.data?.data;

  // Backend trả data: Service[]  HOẶC  data: { items, total, ... }
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
      totalPages: 1,
    };
  }

  if (!payload || !Array.isArray(payload.items)) {
    console.error("SERVICES RESPONSE KHÔNG ĐÚNG:", response.data);
    throw new Error("API trả về danh sách dịch vụ không đúng cấu trúc.");
  }

  return {
    items: payload.items,
    total: Number(payload.total ?? payload.items.length),
    page: Number(payload.page ?? query.page ?? 1),
    limit: Number(payload.limit ?? query.limit ?? 20),
    totalPages: Number(payload.totalPages ?? 1),
  };
}

export async function getManagementServiceById(
  id: string,
): Promise<ManagementService> {
  const response = await apiClient.get(
    `${MANAGEMENT_SERVICES_ENDPOINT}/${id}`,
  );

  return await unwrapApiData<ManagementService>(
    response.data,
  );
}

export async function createManagementService(
  input: CreateManagementServiceInput,
): Promise<ManagementService> {
  const response = await apiClient.post(
    MANAGEMENT_SERVICES_ENDPOINT,
    input,
  );

  return await unwrapApiData<ManagementService>(
    response.data,
  );
}

export async function updateManagementService(
  id: string,
  input: UpdateManagementServiceInput,
): Promise<ManagementService> {
  const response = await apiClient.patch(
    `${MANAGEMENT_SERVICES_ENDPOINT}/${id}`,
    input,
  );

  return await unwrapApiData<ManagementService>(
    response.data,
  );
}

export async function deleteManagementService(
  id: string,
): Promise<DeleteManagementServiceResult> {
  const response = await apiClient.delete(
    `${MANAGEMENT_SERVICES_ENDPOINT}/${id}`,
  );

  if (
    response.status === 204 ||
    response.data === null ||
    response.data === undefined ||
    response.data === ""
  ) {
    return null;
  }

  return await unwrapApiData<ManagementService>(
    response.data,
  );
}