import { apiClient } from "@/lib/axios";

import type {
  BackendFacilityService,
  CreateFacilityServiceInput,
  DeleteFacilityServiceResult,
  FacilityService,
  FacilityServicesListResult,
  FacilityServiceStatus,
  GetFacilityServicesParams,
  UpdateFacilityServiceInput,
} from "./services.types";

const FACILITY_SERVICES_URL = "/management/facility-services";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

/**
 * Hỗ trợ cả hai trường hợp:
 * 1. apiClient trả AxiosResponse
 * 2. interceptor đã trả thẳng response body
 */
function getResponseBody(response: unknown): unknown {
  if (
    isRecord(response) &&
    "data" in response &&
    ("status" in response || "headers" in response || "config" in response)
  ) {
    return response.data;
  }

  return response;
}

function extractData<T>(response: unknown): T {
  const body = getResponseBody(response);

  if (isRecord(body) && "data" in body) {
    return body.data as T;
  }

  return body as T;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeStatus(value: unknown): FacilityServiceStatus {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    status === "available" ||
    status === "active" ||
    status === "1" ||
    status === "true"
  ) {
    return "available";
  }

  return "unavailable";
}

function normalizeFacilityService(
  item: BackendFacilityService,
): FacilityService {
  const facilityId =
    item.facilityId ??
    item.facility?.id ??
    "";

  const serviceId =
    item.serviceId ??
    item.service?.id ??
    "";

  return {
    id: String(item.id),

    facilityId: String(facilityId),
    facilityName:
      item.facilityName ??
      item.facility?.name ??
      `Cơ sở #${facilityId}`,
    facilityCode:
      item.facilityCode ??
      item.facility?.code ??
      undefined,

    serviceId: String(serviceId),
    serviceName:
      item.serviceName ??
      item.service?.name ??
      `Dịch vụ #${serviceId}`,
    serviceCode:
      item.serviceCode ??
      item.service?.code ??
      undefined,
    serviceDescription:
      item.serviceDescription ??
      item.service?.description ??
      undefined,
    serviceType:
      item.serviceType ??
      item.service?.serviceType ??
      item.service?.type ??
      undefined,

    price: toNumber(item.price),
    durationMinutes: toNumber(item.durationMinutes),
    status: normalizeStatus(item.status),

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function findItems(body: unknown): BackendFacilityService[] {
  if (Array.isArray(body)) {
    return body as BackendFacilityService[];
  }

  if (!isRecord(body)) {
    return [];
  }

  const possibleArrays = [
    body.items,
    body.results,
    body.rows,
    body.records,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) {
      return value as BackendFacilityService[];
    }
  }

  if (Array.isArray(body.data)) {
    return body.data as BackendFacilityService[];
  }

  if (isRecord(body.data)) {
    return findItems(body.data);
  }

  return [];
}

function findNumber(
  body: unknown,
  keys: string[],
): number | undefined {
  if (!isRecord(body)) {
    return undefined;
  }

  for (const key of keys) {
    const value = body[key];

    if (value !== undefined && value !== null) {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  if (isRecord(body.meta)) {
    const value = findNumber(body.meta, keys);

    if (value !== undefined) {
      return value;
    }
  }

  if (isRecord(body.pagination)) {
    const value = findNumber(body.pagination, keys);

    if (value !== undefined) {
      return value;
    }
  }

  if (isRecord(body.data)) {
    return findNumber(body.data, keys);
  }

  return undefined;
}

function normalizeListResponse(
  response: unknown,
  params: GetFacilityServicesParams,
): FacilityServicesListResult {
  const body = getResponseBody(response);
  const backendItems = findItems(body);
  const items = backendItems.map(normalizeFacilityService);

  return {
    items,
    total:
      findNumber(body, [
        "total",
        "totalItems",
        "totalRecords",
        "count",
      ]) ?? items.length,
    page:
      findNumber(body, [
        "page",
        "currentPage",
        "pageNumber",
      ]) ??
      params.page ??
      1,
    limit:
      findNumber(body, [
        "limit",
        "pageSize",
        "perPage",
      ]) ??
      params.limit ??
      20,
  };
}

function removeEmptyParams(
  params: GetFacilityServicesParams,
): GetFacilityServicesParams {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    }),
  ) as GetFacilityServicesParams;
}

export async function getFacilityServices(
  params: GetFacilityServicesParams = {},
): Promise<FacilityServicesListResult> {
  const response = await apiClient.get(FACILITY_SERVICES_URL, {
    params: removeEmptyParams(params),
  });

  return normalizeListResponse(response, params);
}

export async function getFacilityService(
  id: string,
): Promise<FacilityService> {
  const response = await apiClient.get(
    `${FACILITY_SERVICES_URL}/${id}`,
  );

  const data = extractData<BackendFacilityService>(response);

  return normalizeFacilityService(data);
}

export async function createFacilityService(
  input: CreateFacilityServiceInput,
): Promise<FacilityService> {
  const response = await apiClient.post(
    FACILITY_SERVICES_URL,
    input,
  );

  const data = extractData<BackendFacilityService>(response);

  return normalizeFacilityService(data);
}

export async function updateFacilityService(
  id: string,
  input: UpdateFacilityServiceInput,
): Promise<FacilityService> {
  const response = await apiClient.patch(
    `${FACILITY_SERVICES_URL}/${id}`,
    input,
  );

  const data = extractData<BackendFacilityService>(response);

  return normalizeFacilityService(data);
}

export async function deleteFacilityService(
  id: string,
): Promise<DeleteFacilityServiceResult> {
  const response = await apiClient.delete(
    `${FACILITY_SERVICES_URL}/${id}`,
  );

  return extractData<DeleteFacilityServiceResult>(response);
}