import {
  apiClient,
  unwrapApiData,
  unwrapApiResponse,
} from "@/lib/axios";
import type {
  BackendShiftSlot,
  BackendShiftSlotLookupItem,
  CreateShiftSlotInput,
  GetShiftSlotLookupParams,
  GetShiftSlotsParams,
  ShiftSlot,
  ShiftSlotApiResponse,
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

function normalizeStatus(status: string): ShiftSlotStatus {
  return String(status ?? "")
    .trim()
    .toLowerCase() === "inactive"
    ? "inactive"
    : "active";
}

function normalizeShiftSlot(
  slot: BackendShiftSlot,
): ShiftSlot {
  return {
    id: String(slot.id),
    facilityId: String(slot.facilityId),
    facilityName: slot.facilityName ?? "",
    facilityCode: slot.facilityCode ?? "",
    code: slot.code ?? "",
    name: slot.name ?? "",
    startTime: normalizeTime(slot.startTime),
    endTime: normalizeTime(slot.endTime),
    isOvernight: Boolean(slot.isOvernight),
    status: normalizeStatus(slot.status),
    createdAt: slot.createdAt,
    updatedAt: slot.updatedAt,
  };
}

function normalizeLookupItem(
  slot: BackendShiftSlotLookupItem,
): ShiftSlotLookupItem {
  return {
    id: String(slot.id),
    facilityId: String(slot.facilityId),
    code: slot.code ?? "",
    name: slot.name ?? "",
    startTime: normalizeTime(slot.startTime),
    endTime: normalizeTime(slot.endTime),
    status: normalizeStatus(slot.status),
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
    limit: params?.limit ?? 100,
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
): Promise<ShiftSlot[]> {
  const data = await unwrapApiData<BackendShiftSlot[]>(
    apiClient.get(ENDPOINT, {
      params: toListParams(params),
    }),
  );

  return Array.isArray(data)
    ? data.map(normalizeShiftSlot)
    : [];
}

export async function getShiftSlotLookup(
  params?: GetShiftSlotLookupParams,
): Promise<ShiftSlotLookupItem[]> {
  const data = await unwrapApiData<
    BackendShiftSlotLookupItem[]
  >(
    apiClient.get(`${ENDPOINT}/lookup`, {
      params: toLookupParams(params),
    }),
  );

  return Array.isArray(data)
    ? data.map(normalizeLookupItem)
    : [];
}

export async function getShiftSlot(
  id: string,
): Promise<ShiftSlot> {
  const data = await unwrapApiData<BackendShiftSlot>(
    apiClient.get(`${ENDPOINT}/${id}`),
  );

  return normalizeShiftSlot(data);
}

export async function createShiftSlot(
  input: CreateShiftSlotInput,
): Promise<ShiftSlotApiResponse<ShiftSlot>> {
  const response =
    await unwrapApiResponse<BackendShiftSlot>(
      apiClient.post(
        ENDPOINT,
        toCreatePayload(input),
      ),
    );

  return {
    success: response.success ?? true,
    message:
      response.message ??
      "Tạo khung ca thành công",
    data: normalizeShiftSlot(response.data),
  };
}

export async function updateShiftSlot(
  id: string,
  input: UpdateShiftSlotInput,
): Promise<ShiftSlotApiResponse<ShiftSlot>> {
  const response =
    await unwrapApiResponse<BackendShiftSlot>(
      apiClient.patch(
        `${ENDPOINT}/${id}`,
        toUpdatePayload(input),
      ),
    );

  return {
    success: response.success ?? true,
    message:
      response.message ??
      "Cập nhật khung ca thành công",
    data: normalizeShiftSlot(response.data),
  };
}

export async function deleteShiftSlot(
  id: string,
): Promise<ShiftSlotApiResponse<null>> {
  const response = await unwrapApiResponse<null>(
    apiClient.delete(`${ENDPOINT}/${id}`),
  );

  return {
    success: response.success ?? true,
    message:
      response.message ??
      "Xóa khung ca thành công",
    data: response.data ?? null,
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