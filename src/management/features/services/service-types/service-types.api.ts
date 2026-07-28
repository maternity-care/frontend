import { apiClient, unwrapApiData } from "@/lib/axios";

import type {
  CreateManagementServiceTypeInput,
  DeleteManagementServiceTypeResult,
  ManagementServiceType,
  ManagementServiceTypeListResult,
  ManagementServiceTypeLookupItem,
  ManagementServiceTypeQuery,
  UpdateManagementServiceTypeInput,
} from "./service-types.types";

const MANAGEMENT_SERVICE_TYPES_ENDPOINT =
  "/management/service-types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ServiceTypeListPayload {
  items: ManagementServiceType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getManagementServiceTypes(
  query: ManagementServiceTypeQuery = {},
): Promise<ManagementServiceTypeListResult> {
  const response = await apiClient.get<
    ApiResponse<ServiceTypeListPayload>
  >(MANAGEMENT_SERVICE_TYPES_ENDPOINT, {
    params: query,
  });

  const payload = response.data?.data;

  if (!payload || !Array.isArray(payload.items)) {
    console.error(
      "SERVICE TYPES RESPONSE KHÔNG ĐÚNG:",
      response.data,
    );

    throw new Error(
      "API trả về danh sách loại dịch vụ không đúng cấu trúc.",
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

export async function getManagementServiceTypesLookup(
  query: ManagementServiceTypeQuery = {
    status: "active",
    page: 1,
    limit: 100,
  },
): Promise<ManagementServiceTypeLookupItem[]> {
  const result = await getManagementServiceTypes(query);

  return result.items.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    status: item.status,
  }));
}

export async function getManagementServiceTypeById(
  id: string,
): Promise<ManagementServiceType> {
  const response = await apiClient.get(
    `${MANAGEMENT_SERVICE_TYPES_ENDPOINT}/${id}`,
  );

  return await unwrapApiData<ManagementServiceType>(
    response.data,
  );
}

export async function createManagementServiceType(
  input: CreateManagementServiceTypeInput,
): Promise<ManagementServiceType> {
  const response = await apiClient.post(
    MANAGEMENT_SERVICE_TYPES_ENDPOINT,
    input,
  );

  return await unwrapApiData<ManagementServiceType>(
    response.data,
  );
}

export async function updateManagementServiceType(
  id: string,
  input: UpdateManagementServiceTypeInput,
): Promise<ManagementServiceType> {
  const response = await apiClient.patch(
    `${MANAGEMENT_SERVICE_TYPES_ENDPOINT}/${id}`,
    input,
  );

  return await unwrapApiData<ManagementServiceType>(
    response.data,
  );
}

export async function deleteManagementServiceType(
  id: string,
): Promise<DeleteManagementServiceTypeResult> {
  const response = await apiClient.delete(
    `${MANAGEMENT_SERVICE_TYPES_ENDPOINT}/${id}`,
  );

  if (
    response.status === 204 ||
    response.data === null ||
    response.data === undefined ||
    response.data === ""
  ) {
    return null;
  }

  return await unwrapApiData<ManagementServiceType>(
    response.data,
  );
}