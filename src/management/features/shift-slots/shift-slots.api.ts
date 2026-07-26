import { apiClient } from "@/lib/axios";
import type {
  BackendShiftSlot,
  BackendShiftSlotLookupItem,
  BackendShiftSlotPagination,
  CreateShiftSlotInput,
  GetShiftSlotLookupParams,
  GetShiftSlotsParams,
  ShiftSlot,
  ShiftSlotApiResponse,
  ShiftSlotListResult,
  ShiftSlotLookupItem,
  ShiftSlotStatus,
  UpdateShiftSlotInput,
} from "./shift-slots.types";

const ENDPOINT = "/management/shift-slots";

function compactObject(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) =>
        item !== undefined &&
        item !== null &&
        item !== "",
    ),
  );
}

function normalizeTime(value: string): string {
  const [hour = "00", minute = "00"] = String(
    value ?? "",
  )
    .trim()
    .split(":");

  return `${hour.padStart(2, "0")}:${minute.padStart(
    2,
    "0",
  )}`;
}

function normalizeStatus(
  status: string,
): ShiftSlotStatus {
  return String(status ?? "")
    .trim()
    .toLowerCase() === "inactive"
    ? "inactive"
    : "active";
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes"
  );
}

function normalizeShiftSlot(
  slot: BackendShiftSlot,
): ShiftSlot {
  return {
    id: String(slot.id ?? ""),
    facilityId: String(slot.facilityId ?? ""),
    facilityName: String(
      slot.facilityName ??
        slot.facility?.name ??
        "",
    ),
    facilityCode: String(
      slot.facilityCode ??
        slot.facility?.code ??
        "",
    ),
    code: String(slot.code ?? ""),
    name: String(slot.name ?? ""),
    startTime: normalizeTime(slot.startTime),
    endTime: normalizeTime(slot.endTime),
    isOvernight: normalizeBoolean(
      slot.isOvernight,
    ),
    status: normalizeStatus(slot.status),
    createdAt: String(slot.createdAt ?? ""),
    updatedAt: String(slot.updatedAt ?? ""),
  };
}

function normalizeLookupItem(
  slot: BackendShiftSlotLookupItem,
): ShiftSlotLookupItem {
  return {
    id: String(slot.id ?? ""),
    facilityId: String(slot.facilityId ?? ""),
    code: String(slot.code ?? ""),
    name: String(slot.name ?? ""),
    startTime: normalizeTime(slot.startTime),
    endTime: normalizeTime(slot.endTime),
    status: normalizeStatus(slot.status),
  };
}

function readResponseData<T>(
  raw: unknown,
): {
  success: boolean;
  message: string;
  data: T;
} {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "data" in raw
  ) {
    const envelope = raw as {
      success?: boolean;
      message?: string;
      data: T;
    };

    return {
      success: envelope.success ?? true,
      message: envelope.message ?? "",
      data: envelope.data,
    };
  }

  return {
    success: true,
    message: "",
    data: raw as T,
  };
}

function toListParams(
  params?: GetShiftSlotsParams,
): Record<string, unknown> {
  return compactObject({
    search: params?.search?.trim(),
    facilityId: params?.facilityId?.trim(),
    status: params?.status,
    page: params?.page,
    limit: params?.limit ?? 20,
  });
}

function toLookupParams(
  params?: GetShiftSlotLookupParams,
): Record<string, unknown> {
  return compactObject({
    search: params?.search?.trim(),
    facilityId: params?.facilityId?.trim(),
    status: params?.status ?? "active",
    limit: params?.limit ?? 20,
  });
}

function toCreatePayload(
  input: CreateShiftSlotInput,
): Record<string, unknown> {
  return {
    facilityId: input.facilityId.trim(),
    name: input.name.trim(),
    startTime: normalizeTime(input.startTime),
    endTime: normalizeTime(input.endTime),
    isOvernight: input.isOvernight,
    status: input.status,
  };
}

function toUpdatePayload(
  input: UpdateShiftSlotInput,
): Record<string, unknown> {
  return compactObject({
    facilityId: input.facilityId?.trim(),
    name: input.name?.trim(),
    startTime: input.startTime
      ? normalizeTime(input.startTime)
      : undefined,
    endTime: input.endTime
      ? normalizeTime(input.endTime)
      : undefined,
    isOvernight: input.isOvernight,
    status: input.status,
  });
}

export async function getShiftSlots(
  params?: GetShiftSlotsParams,
): Promise<ShiftSlotListResult> {
  const response = await apiClient.get(ENDPOINT, {
    params: toListParams(params),
  });

  const result =
    readResponseData<
      BackendShiftSlotPagination | BackendShiftSlot[]
    >(response.data);

  if (Array.isArray(result.data)) {
    const items = result.data.map(
      normalizeShiftSlot,
    );

    return {
      items,
      total: items.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      totalPages: 1,
    };
  }

  const pagination = result.data;

  return {
    items: Array.isArray(pagination?.items)
      ? pagination.items.map(
          normalizeShiftSlot,
        )
      : [],
    total: Number(pagination?.total ?? 0),
    page: Number(
      pagination?.page ?? params?.page ?? 1,
    ),
    limit: Number(
      pagination?.limit ??
        params?.limit ??
        20,
    ),
    totalPages: Number(
      pagination?.totalPages ?? 0,
    ),
  };
}

export async function getShiftSlotLookup(
  params?: GetShiftSlotLookupParams,
): Promise<ShiftSlotLookupItem[]> {
  const response = await apiClient.get(
    `${ENDPOINT}/lookup`,
    {
      params: toLookupParams(params),
    },
  );
  const result =
    readResponseData<BackendShiftSlotLookupItem[]>(
      response.data,
    );

  return Array.isArray(result.data)
    ? result.data.map(normalizeLookupItem)
    : [];
}

export async function getShiftSlot(
  id: string,
): Promise<ShiftSlot> {
  const response = await apiClient.get(
    `${ENDPOINT}/${id}`,
  );
  const result = readResponseData<BackendShiftSlot>(
    response.data,
  );

  return normalizeShiftSlot(result.data);
}

export async function createShiftSlot(
  input: CreateShiftSlotInput,
): Promise<ShiftSlotApiResponse<ShiftSlot>> {
  const response = await apiClient.post(
    ENDPOINT,
    toCreatePayload(input),
  );
  const result = readResponseData<BackendShiftSlot>(
    response.data,
  );

  return {
    success: result.success,
    message:
      result.message || "Tạo khung ca thành công",
    data: normalizeShiftSlot(result.data),
  };
}

export async function updateShiftSlot(
  id: string,
  input: UpdateShiftSlotInput,
): Promise<ShiftSlotApiResponse<ShiftSlot>> {
  const response = await apiClient.patch(
    `${ENDPOINT}/${id}`,
    toUpdatePayload(input),
  );
  const result = readResponseData<BackendShiftSlot>(
    response.data,
  );

  return {
    success: result.success,
    message:
      result.message ||
      "Cập nhật khung ca thành công",
    data: normalizeShiftSlot(result.data),
  };
}

export async function deleteShiftSlot(
  id: string,
): Promise<ShiftSlotApiResponse<null>> {
  const response = await apiClient.delete(
    `${ENDPOINT}/${id}`,
  );
  const result = readResponseData<null>(
    response.data ?? null,
  );

  return {
    success: result.success,
    message:
      result.message || "Xóa khung ca thành công",
    data: null,
  };
}

export const shiftSlotsApi = {
  getShiftSlots,
  getShiftSlotLookup,
  getShiftSlot,
  createShiftSlot,
  updateShiftSlot,
  deleteShiftSlot,
};