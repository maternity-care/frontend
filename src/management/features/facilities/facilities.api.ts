import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  BackendFacility,
  CreateFacilityInput,
  Facility,
  GetFacilitiesParams,
  UpdateFacilityInput,
} from "./facilities.types";

function normalizeStatus(status: string): Facility["status"] {
  const normalizedStatus = status.trim().toLowerCase();

  return normalizedStatus === "hoạt động" ||
    normalizedStatus === "hoat dong" ||
    normalizedStatus === "1" ||
    normalizedStatus === "active"
    ? "active"
    : "suspended";
}

function toBackendStatus(status: Facility["status"]) {
  return status === "active" ? "Hoạt động" : "Không hoạt động";
}

function normalizeFacility(facility: BackendFacility): Facility {
  return {
    id: facility.id,
    name: facility.name,
    code: facility.code,
    address: facility.address,
    city: facility.province,
    district: facility.district,
    ward: facility.ward,
    hotline: facility.phone,
    email: facility.email,
    latitude: facility.latitude,
    longitude: facility.longitude,
    workingHours: "Chưa cập nhật",
    featuredServices: "Chưa cập nhật",
    status: normalizeStatus(facility.status),
    createdAt: facility.createdAt,
    updatedAt: facility.updatedAt,
  };
}

function toBackendPayload(input: CreateFacilityInput | UpdateFacilityInput) {
  const payload = {
    name: input.name?.trim(),
    code: input.code?.trim(),
    phone: input.hotline?.trim(),
    email: input.email?.trim() || "",
    address: input.address?.trim(),
    province: input.city?.trim(),
    district: input.district?.trim(),
    ward: input.ward?.trim(),
    latitude: input.latitude?.trim() || "0",
    longitude: input.longitude?.trim() || "0",
    status: input.status === undefined ? undefined : toBackendStatus(input.status),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

function toQueryParams(params?: GetFacilitiesParams) {
  const queryParams = {
    search: params?.search?.trim() || undefined,
    city: params?.city?.trim() || undefined,
    status: params?.status ? toBackendStatus(params.status) : undefined,
  };

  return Object.fromEntries(
    Object.entries(queryParams).filter(([, value]) => value !== undefined),
  );
}

export async function getFacilities(params?: GetFacilitiesParams) {
  const data = await unwrapApiData<BackendFacility[]>(
    apiClient.get("/management/facilities", {
      params: toQueryParams(params),
    }),
  );

  return data.map(normalizeFacility);
}

export async function createFacility(input: CreateFacilityInput) {
  const response = await unwrapApiResponse<BackendFacility>(
    apiClient.post("/management/facilities", toBackendPayload(input)),
  );

  return {
    ...response,
    data: normalizeFacility(response.data),
  };
}

export async function updateFacility(id: string, input: UpdateFacilityInput) {
  const response = await unwrapApiResponse<BackendFacility>(
    apiClient.patch(`/management/facilities/${id}`, toBackendPayload(input)),
  );

  return {
    ...response,
    data: normalizeFacility(response.data),
  };
}

export function deleteFacility(id: string) {
  return unwrapApiResponse<null>(
    apiClient.delete(`/management/facilities/${id}`),
  );
}

export async function deleteFacilities(ids: string[]) {
  await Promise.all(ids.map((id) => deleteFacility(id)));
}