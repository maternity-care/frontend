import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  BackendFacility,
  BackendFacilityListResponse,
  BackendFacilityLookupItem,
  BackendFacilityAdminOption,
  BackendFacilityAdminOptionsResponse,
  BackendOperatingHour,
  BackendOperatingHourGroup,
  ApplyFacilityOperatingHoursInput,
  CreateFacilityInput,
  Facility,
  FacilityAdminOption,
  FacilityAdminOptionsResult,
  FacilityOperatingHoursApplyResult,
  FacilityListResult,
  FacilityLookupItem,
  FacilityOperatingHoursPreview,
  FacilityOperatingHoursResult,
  FacilityRoomType,
  FacilityScheduleInput,
  FacilityStatus,
  GetFacilitiesParams,
  GetFacilityAdminOptionsParams,
  GetFacilityRoomTypesParams,
  GetFacilityLookupParams,
  FacilityReactivateResult,
  FacilitySuspendResult,
  SuspendResourceInput,
  UpdateFacilityInput,
  UpdateFacilityOperatingHoursInput,
} from "./facilities.types";

export const DEFAULT_FACILITY_PAGE_SIZE = 20;

export const FACILITY_PAGE_LIMIT = 100;
const MAX_FACILITY_PAGES = 1000;

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

function normalizeAdminOptionStatus(
  status?: string,
): FacilityAdminOption["status"] {
  const normalizedStatus = String(
    status ?? "",
  )
    .trim()
    .toLowerCase();

  if (
    normalizedStatus === "inactive" ||
    normalizedStatus === "locked"
  ) {
    return normalizedStatus;
  }

  return "active";
}

function normalizeAdminOption(
  item: BackendFacilityAdminOption,
): FacilityAdminOption {
  const ownedFacilityCount = Number(
    item.ownedFacilityCount,
  );

  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? "").trim(),
    email: String(item.email ?? "").trim(),
    personalEmail: String(
      item.personalEmail ?? "",
    ).trim(),
    phone: String(item.phone ?? "").trim(),
    employeeCode: String(
      item.employeeCode ?? "",
    ).trim(),
    status: normalizeAdminOptionStatus(
      item.status,
    ),
    homeFacilityId: String(
      item.homeFacilityId ?? "",
    ).trim(),
    homeFacilityName: String(
      item.homeFacilityName ?? "",
    ).trim(),
    homeFacilityCode: String(
      item.homeFacilityCode ?? "",
    ).trim(),
    roleId: String(item.roleId ?? "").trim(),
    roleName: String(
      item.roleName ?? "",
    ).trim(),
    ownedFacilityCount:
      Number.isFinite(ownedFacilityCount) &&
      ownedFacilityCount >= 0
        ? Math.trunc(ownedFacilityCount)
        : 0,
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
  });
}

function clampLimit(
  limit?: number,
  fallback = FACILITY_PAGE_LIMIT,
) {
  const normalizedLimit = Math.trunc(limit ?? fallback);

  if (!Number.isFinite(normalizedLimit) || normalizedLimit < 1) {
    return fallback;
  }

  return Math.min(normalizedLimit, FACILITY_PAGE_LIMIT);
}

function normalizePage(page?: number) {
  const normalizedPage = Math.trunc(page ?? 1);

  return Number.isFinite(normalizedPage) && normalizedPage > 0
    ? normalizedPage
    : 1;
}

function toQueryParams(params?: GetFacilitiesParams) {
  const search =
    params?.rawSearch?.trim() || params?.search?.trim() || undefined;

  return removeUndefined({
    search,
    city: params?.city?.trim() || undefined,
    ownerId: params?.ownerId?.trim() || undefined,
    status: params?.status ? toBackendStatus(params.status) : undefined,
    page: normalizePage(params?.page),
    limit: clampLimit(params?.limit, DEFAULT_FACILITY_PAGE_SIZE),
  });
}

const FACILITY_ITEM_KEYS = [
  "items",
  "facilities",
  "results",
  "rows",
  "data",
] as const;

const FACILITY_CONTAINER_KEYS = ["data", "result", "payload"] as const;

function toNonNegativeInteger(value: unknown, fallback: number) {
  const normalizedValue =
    typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
    return fallback;
  }

  return Math.trunc(normalizedValue);
}


function extractFacilityPage(
  value: unknown,
  fallbackPage: number,
  fallbackLimit: number,
  depth = 0,
): BackendFacilityListResponse {
  if (Array.isArray(value)) {
    const total = value.length;

    return {
      items: value as BackendFacility[],
      total,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages: total === 0 ? 0 : Math.ceil(total / fallbackLimit),
    };
  }

  if (!value || typeof value !== "object" || depth > 4) {
    throw new Error("Dữ liệu danh sách cơ sở từ máy chủ không đúng định dạng.");
  }

  const record = value as Record<string, unknown>;

  for (const key of FACILITY_ITEM_KEYS) {
    const candidate = record[key];

    if (!Array.isArray(candidate)) continue;

    const items = candidate as BackendFacility[];
    const total = toNonNegativeInteger(record.total, items.length);
    const page = Math.max(1, toNonNegativeInteger(record.page, fallbackPage));
    const limit = Math.max(
      1,
      toNonNegativeInteger(record.limit, fallbackLimit),
    );
    const calculatedTotalPages =
      total === 0 ? 0 : Math.ceil(total / limit);
    const totalPages = toNonNegativeInteger(
      record.totalPages,
      calculatedTotalPages,
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  for (const key of FACILITY_CONTAINER_KEYS) {
    const candidate = record[key];

    if (candidate && typeof candidate === "object") {
      try {
        return extractFacilityPage(
          candidate,
          fallbackPage,
          fallbackLimit,
          depth + 1,
        );
      } catch {
      }
    }
  }

  throw new Error("Dữ liệu danh sách cơ sở từ máy chủ không đúng định dạng.");
}

type BackendOperatingHoursResponse =
  | BackendFacility
  | BackendOperatingHour[]
  | BackendOperatingHourGroup[]
  | {
      operatingHours?: BackendOperatingHour[];
      operatingHourGroups?: BackendOperatingHourGroup[];
    };

type BackendOperatingHoursApplyResponse = BackendOperatingHoursResponse & {
  slotStrategy?: FacilityOperatingHoursApplyResult["slotStrategy"];
  summary?: FacilityOperatingHoursApplyResult["summary"];
  impactedShifts?: FacilityOperatingHoursApplyResult["impactedShifts"];
  impactedShiftSlots?: FacilityOperatingHoursApplyResult["impactedShiftSlots"];
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

export async function getFacilitiesPage(
  params?: GetFacilitiesParams,
): Promise<FacilityListResult> {
  const requestedPage = normalizePage(params?.page);
  const requestedLimit = clampLimit(
    params?.limit,
    DEFAULT_FACILITY_PAGE_SIZE,
  );

  const rawData = await unwrapApiData<unknown>(
    apiClient.get("/management/facilities", {
      params: toQueryParams({
        ...params,
        page: requestedPage,
        limit: requestedLimit,
      }),
    }),
  );

  const pageData = extractFacilityPage(
    rawData,
    requestedPage,
    requestedLimit,
  );

  return {
    items: pageData.items.map(normalizeFacility),
    total: pageData.total,
    page: pageData.page,
    limit: pageData.limit,
    totalPages: pageData.totalPages,
  };
}

export async function getFacilities(params?: GetFacilitiesParams) {
  const facilities: Facility[] = [];
  const loadedFacilityIds = new Set<string>();

  const firstPage = await getFacilitiesPage({
    ...params,
    page: 1,
    limit: FACILITY_PAGE_LIMIT,
  });

  const appendItems = (items: Facility[]) => {
    for (const facility of items) {
      if (loadedFacilityIds.has(facility.id)) continue;

      loadedFacilityIds.add(facility.id);
      facilities.push(facility);
    }
  };

  appendItems(firstPage.items);

  if (firstPage.totalPages > MAX_FACILITY_PAGES) {
    throw new Error(
      "Không thể tải hết danh sách cơ sở vì vượt quá giới hạn an toàn.",
    );
  }

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const pageData = await getFacilitiesPage({
      ...params,
      page,
      limit: FACILITY_PAGE_LIMIT,
    });

    appendItems(pageData.items);
  }

  return facilities;
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
        limit: clampLimit(params?.limit ?? 20),
      }),
    }),
  );

  return data.map(normalizeLookupItem);
}

export async function getFacilityAdminOptions(
  params?: GetFacilityAdminOptionsParams,
): Promise<FacilityAdminOptionsResult> {
  const requestedPage = normalizePage(
    params?.page,
  );
  const requestedLimit = clampLimit(
    params?.limit,
    DEFAULT_FACILITY_PAGE_SIZE,
  );

  const data =
    await unwrapApiData<BackendFacilityAdminOptionsResponse>(
      apiClient.get(
        "/management/facilities/admin-options",
        {
          params: removeUndefined({
            search:
              params?.search?.trim() ||
              undefined,
            status:
              params?.status ?? "active",
            availableOnly:
              params?.availableOnly ?? false,
            page: requestedPage,
            limit: requestedLimit,
          }),
        },
      ),
    );

  const items = Array.isArray(data?.items)
    ? data.items
    : [];

  const total = toNonNegativeInteger(
    data?.total,
    items.length,
  );
  const page = Math.max(
    1,
    toNonNegativeInteger(
      data?.page,
      requestedPage,
    ),
  );
  const limit = Math.max(
    1,
    toNonNegativeInteger(
      data?.limit,
      requestedLimit,
    ),
  );
  const calculatedTotalPages =
    total === 0
      ? 0
      : Math.ceil(total / limit);
  const totalPages = toNonNegativeInteger(
    data?.totalPages,
    calculatedTotalPages,
  );

  return {
    items: items.map(normalizeAdminOption),
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getPublicFacilities(params?: GetFacilitiesParams) {
  const requestedPage = normalizePage(params?.page);
  const requestedLimit = clampLimit(params?.limit);
  const data = await unwrapApiData<unknown>(
    apiClient.get("/public/facilities", {
      params: removeUndefined({
        search:
          params?.rawSearch?.trim() || params?.search?.trim() || undefined,
        city: params?.city?.trim() || undefined,
        status: params?.status ? toBackendStatus(params.status) : undefined,
        page: requestedPage,
        limit: requestedLimit,
      }),
    }),
  );

  return extractFacilityPage(data, requestedPage, requestedLimit).items.map(normalizeFacility);
}

export async function createFacility(input: CreateFacilityInput) {
  const response = await unwrapApiResponse<BackendFacility>(
    apiClient.post("/management/facilities", toCreatePayload(input)),
  );

  return Object.assign({}, response, {
    data: normalizeFacility(response.data),
  });
}

export async function updateFacility(id: string, input: UpdateFacilityInput) {
  const response = await unwrapApiResponse<BackendFacility>(
    apiClient.patch(
      `/management/facilities/${id}`,
      toUpdatePayload(input),
    ),
  );

  return Object.assign({}, response, {
    data: normalizeFacility(response.data),
  });
}

export async function suspendFacility(
  id: string,
  input: SuspendResourceInput,
) {
  const response = await unwrapApiResponse<FacilitySuspendResult>(
    apiClient.patch(`/management/facilities/${id}/suspend`, {
      inactiveUntil: input.inactiveUntil || null,
      reason: input.reason?.trim() || undefined,
    }),
  );

  return Object.assign({}, response, {
    data: {
      ...response.data,
      facility: normalizeFacility(response.data.facility),
    },
  });
}

export async function reactivateFacility(id: string) {
  const response = await unwrapApiResponse<FacilityReactivateResult>(
    apiClient.patch(`/management/facilities/${id}/reactivate`, {}),
  );

  return Object.assign({}, response, {
    data: {
      ...response.data,
      facility: normalizeFacility(response.data.facility),
    },
  });
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

export async function applyFacilityOperatingHours(
  id: string,
  input: ApplyFacilityOperatingHoursInput,
): Promise<FacilityOperatingHoursApplyResult> {
  const data = await unwrapApiData<BackendOperatingHoursApplyResponse>(
    apiClient.patch(`/management/facilities/${id}/operating-hours/apply`, {
      schedules: normalizeSchedules(input.schedules),
      slotStrategy: input.slotStrategy,
    }),
  );
  const operatingHoursPayload = normalizeOperatingHoursPayload(data);

  return {
    ...operatingHoursPayload,
    slotStrategy: data.slotStrategy ?? input.slotStrategy ?? "strict",
    summary: data.summary ?? {
      impactedShiftCount: 0,
      impactedShiftSlotCount: 0,
      deactivatedShiftSlotCount: 0,
    },
    impactedShifts: data.impactedShifts ?? [],
    impactedShiftSlots: data.impactedShiftSlots ?? [],
  };
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
        limit: clampLimit(params?.limit ?? 20),
      }),
    }),
  );
}
