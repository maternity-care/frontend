import { apiClient } from "@/lib/axios";
import type {
  CreateQuantityPackageInput,
  CreateSchedulePackageInput,
  DeleteMaternityPackageResult,
  MaternityPackage,
  MaternityPackageListResult,
  MaternityPackageQuery,
  UpdateMaternityPackageInput,
} from "./maternity-packages.types";

const ENDPOINT = "/management/maternity-packages";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ListPayload {
  items: MaternityPackage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getManagementMaternityPackages(
  query: MaternityPackageQuery = {},
): Promise<MaternityPackageListResult> {
  const response = await apiClient.get<ApiResponse<ListPayload>>(ENDPOINT, {
    params: query,
  });

  const payload = response.data?.data;

  if (!payload || !Array.isArray(payload.items)) {
    console.error("MATERNITY PACKAGES RESPONSE KHÔNG ĐÚNG:", response.data);
    throw new Error("API trả về danh sách gói thai sản không đúng cấu trúc.");
  }

  return {
    items: payload.items,
    total: Number(payload.total ?? payload.items.length),
    page: Number(payload.page ?? query.page ?? 1),
    limit: Number(payload.limit ?? query.limit ?? 20),
    totalPages: Number(payload.totalPages ?? 1),
  };
}

export async function getManagementMaternityPackageById(
  id: string,
): Promise<MaternityPackage> {
  const response = await apiClient.get<ApiResponse<MaternityPackage>>(
    `${ENDPOINT}/${id}`,
  );
  return response.data.data;
}

export async function createQuantityMaternityPackage(
  input: CreateQuantityPackageInput,
): Promise<MaternityPackage> {
  const response = await apiClient.post<ApiResponse<MaternityPackage>>(
    `${ENDPOINT}/quantity`,
    input,
  );
  return response.data.data;
}

export async function createScheduleMaternityPackage(
  input: CreateSchedulePackageInput,
): Promise<MaternityPackage> {
  const response = await apiClient.post<ApiResponse<MaternityPackage>>(
    `${ENDPOINT}/schedule`,
    input,
  );
  return response.data.data;
}

export async function updateManagementMaternityPackage(
  id: string,
  input: UpdateMaternityPackageInput,
): Promise<MaternityPackage> {
  const response = await apiClient.patch<ApiResponse<MaternityPackage>>(
    `${ENDPOINT}/${id}`,
    input,
  );
  return response.data.data;
}

export async function deleteManagementMaternityPackage(
  id: string,
): Promise<DeleteMaternityPackageResult> {
  const response = await apiClient.delete(`${ENDPOINT}/${id}`);

  if (
    response.status === 204 ||
    response.data === null ||
    response.data === undefined ||
    response.data === ""
  ) {
    return null;
  }

  return (response.data as ApiResponse<MaternityPackage>).data ?? null;
}