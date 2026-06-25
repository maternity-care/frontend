import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  BackendFacility,
  CreateFacilityInput,
  Facility,
  UpdateFacilityInput,
} from "./facilities.types";

function normalizeStatus(status: string): Facility["status"] {
  return status === "Hoạt động" || status === "1" || status === "active"
    ? "active"
    : "suspended";
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
    name: input.name,
    code: input.code,
    phone: input.hotline,
    email: input.email,
    address: input.address,
    province: input.city,
    district: input.district,
    ward: input.ward,
    latitude: input.latitude,
    longitude: input.longitude,
    status:
      input.status === undefined
        ? undefined
        : input.status === "active"
          ? "Hoạt động"
          : "Tạm ngưng",
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export async function getFacilities() {
  const data = await unwrapApiData<BackendFacility[]>(
    apiClient.get("/management/facilities"),
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