import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  BackendFacility,
  BackendFacilityLookupItem,
  BackendOperatingHour,
  BackendOperatingHourGroup,
  CreateFacilityInput,
  Facility,
  FacilityLookupItem,
  FacilityOperatingHoursPreview,
  FacilityOperatingHoursResult,
  FacilityRoomType,
  FacilityScheduleInput,
  FacilityStatus,
  GetFacilitiesParams,
  GetFacilityRoomTypesParams,
  GetFacilityLookupParams,
  UpdateFacilityInput,
  UpdateFacilityOperatingHoursInput,
} from "./facilities.types";

/**
 * Tạm thời lấy toàn bộ dữ liệu cho tới khi BE bổ sung metadata phân trang.
 * Điều chỉnh giá trị này nếu môi trường thực tế có nhiều hơn 1000 cơ sở.
 */
export const FACILITY_FETCH_ALL_LIMIT = 1000;

function normalizeStatus(status?: string): FacilityStatus {
  const normalizedStatus = status?.trim().toLowerCase();

  return normalizedStatus === "active" ||
    normalizedStatus === "hoạt động" ||
    normalizedStatus === "hoat dong" ||
    normalizedStatus === "1"
    ? "active"
    : "suspended";
}

function toBackendStatus(status: FacilityStatus) {
  return status === "active" ? "active" : "inactive";
}

function trimTime(value?: string | null) {
  return value ? value.slice(0, 5) : null;
}

function normalizeOperatingHour(
  item: BackendOperatingHour,
): BackendOperatingHour {
  return {
    dayOfWeek: item.dayOfWeek,
    openTime: trimTime(item.openTime),
    closeTime: trimTime(item.closeTime),
    isClosed: Boolean(item.isClosed),
  };
}

function normalizeOperatingHourGroup(
  item: BackendOperatingHourGroup,
): BackendOperatingHourGroup {
  const openTime = trimTime(item.openTime);
  const closeTime = trimTime(item.closeTime);

  return {
    days: item.days ?? [],
    dayLabel: item.dayLabel ?? "",
    openTime,
    closeTime,
    isClosed: Boolean(item.isClosed),
    displayTime:
      item.displayTime ||
      (item.isClosed
        ? "Đóng cửa"
        : `${openTime ?? "--:--"} - ${closeTime ?? "--:--"}`),
  };
}

function buildWorkingHours(groups: BackendOperatingHourGroup[]) {
  if (groups.length === 0) return "Chưa cập nhật";

  return groups
    .map((group) => `${group.dayLabel}: ${group.displayTime}`)
    .join("; ");
}

function normalizeFacility(facility: BackendFacility): Facility {
  const operatingHours = (facility.operatingHours ?? []).map(
    normalizeOperatingHour,
  );
  const operatingHourGroups = (facility.operatingHourGroups ?? []).map(
    normalizeOperatingHourGroup,
  );

  return {
    id: facility.id,
    name: facility.name,
    code: facility.code,
    ownerId: facility.ownerId,
    ownerName: facility.ownerName ?? "Chưa cập nhật",
    ownerEmail: facility.ownerEmail || undefined,
    ownerPhone: facility.ownerPhone || undefined,
    hotline: facility.phone,
    email: facility.email || undefined,
    address: facility.address,
    city: facility.province,
    ward: facility.ward,
    latitude: facility.latitude || undefined,
    longitude: facility.longitude || undefined,
    status: normalizeStatus(facility.status),
    operatingStatus: facility.operatingStatus ?? "closed_today",
    operatingStatusLabel:
      facility.operatingStatusLabel ?? "Chưa cập nhật trạng thái",
    isOpenNow: Boolean(facility.isOpenNow),
    todayOperatingHour: facility.todayOperatingHour
      ? normalizeOperatingHour(facility.todayOperatingHour)
      : null,
    operatingHours,
    operatingHourGroups,
    closureDays: facility.closureDays ?? [],
    workingHours: buildWorkingHours(operatingHourGroups),
    createdAt: facility.createdAt,
    updatedAt: facility.updatedAt,
  };
}

function normalizeLookupItem(
  item: BackendFacilityLookupItem,
): FacilityLookupItem {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    address: item.address,
    city: item.province,
    ward: item.ward,
    status: normalizeStatus(item.status),
    ownerName: item.ownerName,
  };
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}

function normalizeSchedules(schedules: FacilityScheduleInput[]) {
  return schedules.map((schedule) => {
    if (schedule.isClosed) {
      return {
        days: schedule.days,
        isClosed: true,
      };
    }

    return {
      days: schedule.days,
      isClosed: false,
      openTime: schedule.openTime?.slice(0, 5),
      closeTime: schedule.closeTime?.slice(0, 5),
    };
  });
}

function toCreatePayload(input: CreateFacilityInput) {
  return removeUndefined({
    name: input.name.trim(),
    ownerId: input.ownerId.trim(),
    phone: input.hotline.trim(),
    email: input.email?.trim() || "",
    schedules: normalizeSchedules(input.schedules),
    address: input.address.trim(),
    province: input.city.trim(),
    ward: input.ward.trim(),
    latitude: input.latitude?.trim() || "0",
    longitude: input.longitude?.trim() || "0",
    status: toBackendStatus(input.status),
  });
}

function toUpdatePayload(input: UpdateFacilityInput) {
  return removeUndefined({
    name: input.name?.trim(),
    ownerId: input.ownerId?.trim(),
    phone: input.hotline?.trim(),
    email: input.email === undefined ? undefined : input.email.trim(),
    address: input.address?.trim(),
    province: input.city?.trim(),
    ward: input.ward?.trim(),
    latitude: input.latitude?.trim(),
    longitude: input.longitude?.trim(),
    status:
      input.status === undefined ? undefined : toBackendStatus(input.status),
  });
}

function toQueryParams(params?: GetFacilitiesParams) {
  const search =
    params?.rawSearch?.trim() || params?.search?.trim() || undefined;

  return removeUndefined({
    search,
    city: params?.city?.trim() || undefined,
    ownerId: params?.ownerId?.trim() || undefined,
    status: params?.status ? toBackendStatus(params.status) : undefined,
    page: params?.page,
    limit: params?.limit ?? FACILITY_FETCH_ALL_LIMIT,
  });
}

type BackendOperatingHoursResponse =
  | BackendFacility
  | BackendOperatingHour[]
  | BackendOperatingHourGroup[]
  | {
      operatingHours?: BackendOperatingHour[];
      operatingHourGroups?: BackendOperatingHourGroup[];
    };

function normalizeOperatingHoursPayload(
  data: BackendOperatingHoursResponse,
): FacilityOperatingHoursResult {
  if (Array.isArray(data)) {
    const firstItem = data[0];

    if (firstItem && "days" in firstItem) {
      return {
        operatingHours: [],
        operatingHourGroups: (data as BackendOperatingHourGroup[]).map(
          normalizeOperatingHourGroup,
        ),
      };
    }

    return {
      operatingHours: (data as BackendOperatingHour[]).map(
        normalizeOperatingHour,
      ),
      operatingHourGroups: [],
    };
  }

  return {
    operatingHours: (data.operatingHours ?? []).map(normalizeOperatingHour),
    operatingHourGroups: (data.operatingHourGroups ?? []).map(
      normalizeOperatingHourGroup,
    ),
  };
}

export async function getFacilities(params?: GetFacilitiesParams) {
  const data = await unwrapApiData<BackendFacility[]>(
    apiClient.get("/management/facilities", {
      params: toQueryParams(params),
    }),
  );

  return data.map(normalizeFacility);
}

export async function getFacility(id: string) {
  const data = await unwrapApiData<BackendFacility>(
    apiClient.get(`/management/facilities/${id}`),
  );

  return normalizeFacility(data);
}

export async function lookupFacilities(params?: GetFacilityLookupParams) {
  const data = await unwrapApiData<BackendFacilityLookupItem[]>(
    apiClient.get("/management/facilities/lookup", {
      params: removeUndefined({
        search: params?.search?.trim() || undefined,
        status: params?.status,
        limit: params?.limit ?? 20,
      }),
    }),
  );

  return data.map(normalizeLookupItem);
}

export async function getPublicFacilities(params?: GetFacilitiesParams) {
  const data = await unwrapApiData<BackendFacility[]>(
    apiClient.get("/public/facilities", {
      params: removeUndefined({
        search:
          params?.rawSearch?.trim() || params?.search?.trim() || undefined,
        city: params?.city?.trim() || undefined,
        status: params?.status ? toBackendStatus(params.status) : undefined,
        page: params?.page,
        limit: params?.limit,
      }),
    }),
  );

  return data.map(normalizeFacility);
}

export async function createFacility(input: CreateFacilityInput) {
  const response = await unwrapApiResponse<BackendFacility>(
    apiClient.post("/management/facilities", toCreatePayload(input)),
  );

  return {
    ...response,
    data: normalizeFacility(response.data),
  };
}

export async function updateFacility(id: string, input: UpdateFacilityInput) {
  const response = await unwrapApiResponse<BackendFacility>(
    apiClient.patch(
      `/management/facilities/${id}`,
      toUpdatePayload(input),
    ),
  );

  return {
    ...response,
    data: normalizeFacility(response.data),
  };
}

export async function getFacilityOperatingHours(id: string) {
  const data = await unwrapApiData<BackendOperatingHoursResponse>(
    apiClient.get(`/management/facilities/${id}/operating-hours`),
  );

  return normalizeOperatingHoursPayload(data);
}

export async function updateFacilityOperatingHours(
  id: string,
  input: UpdateFacilityOperatingHoursInput,
) {
  const data = await unwrapApiData<BackendOperatingHoursResponse>(
    apiClient.patch(`/management/facilities/${id}/operating-hours`, {
      schedules: normalizeSchedules(input.schedules),
    }),
  );

  return normalizeOperatingHoursPayload(data);
}

export function previewFacilityOperatingHours(
  id: string,
  input: UpdateFacilityOperatingHoursInput,
) {
  return unwrapApiData<FacilityOperatingHoursPreview>(
    apiClient.post(`/management/facilities/${id}/operating-hours/preview`, {
      schedules: normalizeSchedules(input.schedules),
    }),
  );
}

export async function deactivateFacility(id: string) {
  const response = await unwrapApiResponse<BackendFacility>(
    apiClient.patch(`/management/facilities/${id}/deactivate`, {}),
  );

  return {
    ...response,
    data: normalizeFacility(response.data),
  };
}

export function deleteFacility(id: string, reason: string) {
  const normalizedReason = reason.trim();

  if (!normalizedReason) {
    return Promise.reject(new Error("Vui lòng nhập lý do xóa cơ sở."));
  }

  return unwrapApiResponse<null>(
    apiClient.delete(`/management/facilities/${id}`, {
      params: { reason: normalizedReason },
    }),
  );
}

export async function deleteFacilities(ids: string[], reason: string) {
  await Promise.all(ids.map((id) => deleteFacility(id, reason)));
}

export async function getFacilityRoomTypes(
  facilityId: string,
  params?: GetFacilityRoomTypesParams,
) {
  return unwrapApiData<FacilityRoomType[]>(
    apiClient.get(`/management/facilities/${facilityId}/room-types`, {
      params: removeUndefined({
        search: params?.search?.trim() || undefined,
        status: params?.status,
        limit: params?.limit ?? 20,
      }),
    }),
  );
}
