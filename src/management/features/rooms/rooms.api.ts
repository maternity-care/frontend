import { apiClient } from "@/lib/axios";
import type {
  ApiResponse,
  BackendPaginatedRooms,
  BackendPaginatedRoomTypes,
  BackendRoom,
  BackendRoomType,
  BulkCreateRoomsInput,
  ClinicRoom,
  CreateRoomInput,
  CreateRoomTypeInput,
  GetRoomsParams,
  GetRoomTypeLookupParams,
  GetRoomTypesParams,
  RoomListResult,
  RoomStatus,
  RoomType,
  RoomTypeListResult,
  UpdateRoomInput,
  UpdateRoomTypeInput,
} from "./rooms.types";

type ApiEnvelope<T> =
  | T
  | {
      success?: boolean;
      message?: string;
      data: T;
    };

type RoomsResponseData =
  | BackendRoom[]
  | BackendPaginatedRooms;

type RoomTypesResponseData =
  | BackendRoomType[]
  | BackendPaginatedRoomTypes;

const ROOM_ENDPOINT = "/management/rooms";

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

function unwrapData<T>(
  responseData: ApiEnvelope<T>,
): T {
  if (
    responseData &&
    typeof responseData === "object" &&
    !Array.isArray(responseData) &&
    "data" in responseData
  ) {
    return responseData.data;
  }

  return responseData as T;
}

function unwrapResponse<T>(
  responseData: ApiEnvelope<T>,
  fallbackMessage = "Thao tác thành công",
): ApiResponse<T> {
  if (
    responseData &&
    typeof responseData === "object" &&
    !Array.isArray(responseData) &&
    "data" in responseData
  ) {
    return {
      success: Boolean(
        responseData.success ?? true,
      ),
      message:
        responseData.message ??
        fallbackMessage,
      data: responseData.data,
    };
  }

  return {
    success: true,
    message: fallbackMessage,
    data: responseData as T,
  };
}

function normalizeStatus(
  status?: string,
): RoomStatus {
  const value = String(status ?? "")
    .trim()
    .toLowerCase();

  return value === "active" ||
    value === "1" ||
    value === "hoạt động" ||
    value === "hoat dong"
    ? "active"
    : "inactive";
}

function normalizeRoom(
  room: BackendRoom,
): ClinicRoom {
  return {
    id: String(room.id ?? ""),
    facilityId: String(
      room.facilityId ?? "",
    ),
    code: String(room.code ?? ""),
    roomName: String(room.name ?? ""),
    roomTypeId: String(
      room.roomTypeId ?? "",
    ),
    roomTypeName: String(
      room.roomTypeName ?? "Chưa cập nhật",
    ),
    roomTypeCode: String(
      room.roomTypeCode ?? "",
    ),
    roomTypeDescription: String(
      room.roomTypeDescription ?? "",
    ),
    roomTypeStatus: normalizeStatus(
      room.roomTypeStatus,
    ),
    floor: String(room.floor ?? ""),
    status: normalizeStatus(room.status),
    createdAt: String(
      room.createdAt ?? "",
    ),
    updatedAt: String(
      room.updatedAt ?? "",
    ),
    facilityName: String(
      room.facilityName ?? "",
    ),
    facilityCode: String(
      room.facilityCode ?? "",
    ),
    facilityAddress: String(
      room.facilityAddress ?? "",
    ),
    facilityProvince: String(
      room.facilityProvince ?? "",
    ),
    facilityWard: String(
      room.facilityWard ?? "",
    ),
    facilityStatus: normalizeStatus(
      room.facilityStatus,
    ),
  };
}

function normalizeRoomType(
  roomType: BackendRoomType,
): RoomType {
  return {
    id: String(roomType.id ?? ""),
    code: String(roomType.code ?? ""),
    name: String(roomType.name ?? ""),
    description: String(
      roomType.description ?? "",
    ),
    status: normalizeStatus(
      roomType.status,
    ),
    createdAt: String(
      roomType.createdAt ?? "",
    ),
    updatedAt: String(
      roomType.updatedAt ?? "",
    ),
  };
}

function normalizeRoomList(
  data: RoomsResponseData,
  fallbackPage: number,
  fallbackLimit: number,
): RoomListResult {
  if (Array.isArray(data)) {
    const items = data.map(normalizeRoom);

    return {
      items,
      total: items.length,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages:
        items.length > 0 ? 1 : 0,
    };
  }

  const items = Array.isArray(data?.items)
    ? data.items.map(normalizeRoom)
    : [];

  return {
    items,
    total: Number(data?.total ?? items.length),
    page: Number(
      data?.page ?? fallbackPage,
    ),
    limit: Number(
      data?.limit ?? fallbackLimit,
    ),
    totalPages: Number(
      data?.totalPages ??
        (items.length > 0 ? 1 : 0),
    ),
  };
}

function normalizeRoomTypeList(
  data: RoomTypesResponseData,
  fallbackPage: number,
  fallbackLimit: number,
): RoomTypeListResult {
  if (Array.isArray(data)) {
    const items = data.map(
      normalizeRoomType,
    );

    return {
      items,
      total: items.length,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages:
        items.length > 0 ? 1 : 0,
    };
  }

  const items = Array.isArray(data?.items)
    ? data.items.map(normalizeRoomType)
    : [];

  return {
    items,
    total: Number(data?.total ?? items.length),
    page: Number(
      data?.page ?? fallbackPage,
    ),
    limit: Number(
      data?.limit ?? fallbackLimit,
    ),
    totalPages: Number(
      data?.totalPages ??
        (items.length > 0 ? 1 : 0),
    ),
  };
}

function toRoomQueryParams(
  params?: GetRoomsParams,
) {
  return compactObject({
    search: params?.search?.trim(),
    floor: params?.floor?.trim(),
    status: params?.status,
    facilityId:
      params?.facilityId?.trim(),
    roomTypeId:
      params?.roomTypeId?.trim(),
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  });
}

function toRoomTypeQueryParams(
  params?:
    | GetRoomTypesParams
    | GetRoomTypeLookupParams,
) {
  const page =
    "page" in (params ?? {})
      ? (
          params as GetRoomTypesParams
        ).page
      : undefined;

  return compactObject({
    search: params?.search?.trim(),
    status: params?.status,
    page,
    limit: params?.limit ?? 20,
  });
}

function toCreateRoomPayload(
  input: CreateRoomInput,
) {
  return {
    facilityId: input.facilityId.trim(),
    name: input.name.trim(),
    roomTypeId: input.roomTypeId.trim(),
    floor: input.floor.trim(),
    status: input.status,
  };
}

function toUpdateRoomPayload(
  input: UpdateRoomInput,
) {
  return compactObject({
    name: input.name?.trim(),
    roomTypeId:
      input.roomTypeId?.trim(),
    floor: input.floor?.trim(),
    status: input.status,
  });
}

function toRoomTypePayload(
  input:
    | CreateRoomTypeInput
    | UpdateRoomTypeInput,
) {
  return compactObject({
    name: input.name?.trim(),
    description:
      input.description?.trim(),
    status: input.status,
  });
}

export async function getRooms(
  params?: GetRoomsParams,
): Promise<RoomListResult> {
  const response = await apiClient.get<
    ApiEnvelope<RoomsResponseData>
  >(ROOM_ENDPOINT, {
    params: toRoomQueryParams(params),
  });

  const data = unwrapData<RoomsResponseData>(
    response.data,
  );

  return normalizeRoomList(
    data,
    params?.page ?? 1,
    params?.limit ?? 20,
  );
}

export async function getRoomById(
  id: string,
): Promise<ClinicRoom> {
  const response = await apiClient.get<
    ApiEnvelope<BackendRoom>
  >(`${ROOM_ENDPOINT}/${id}`);

  return normalizeRoom(
    unwrapData<BackendRoom>(response.data),
  );
}

export async function createRoom(
  input: CreateRoomInput,
): Promise<ApiResponse<ClinicRoom>> {
  const response = await apiClient.post<
    ApiEnvelope<BackendRoom>
  >(
    ROOM_ENDPOINT,
    toCreateRoomPayload(input),
  );

  const result =
    unwrapResponse<BackendRoom>(
      response.data,
      "Tạo phòng thành công",
    );

  return {
    ...result,
    data: normalizeRoom(result.data),
  };
}

export async function updateRoom(
  id: string,
  input: UpdateRoomInput,
): Promise<ApiResponse<ClinicRoom>> {
  const response = await apiClient.patch<
    ApiEnvelope<BackendRoom>
  >(
    `${ROOM_ENDPOINT}/${id}`,
    toUpdateRoomPayload(input),
  );

  const result =
    unwrapResponse<BackendRoom>(
      response.data,
      "Cập nhật phòng thành công",
    );

  return {
    ...result,
    data: normalizeRoom(result.data),
  };
}

export async function deleteRoom(
  id: string,
  reason: string,
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete<
    ApiEnvelope<null>
  >(`${ROOM_ENDPOINT}/${id}`, {
    params: {
      reason: reason.trim(),
    },
  });

  return unwrapResponse<null>(
    response.data ?? null,
    "Xóa phòng thành công",
  );
}

export async function deleteRooms(
  ids: string[],
  reason: string,
): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      deleteRoom(id, reason),
    ),
  );
}

export async function getRoomTypeLookup(
  params?: GetRoomTypeLookupParams,
): Promise<RoomType[]> {
  const response = await apiClient.get<
    ApiEnvelope<RoomTypesResponseData>
  >(`${ROOM_ENDPOINT}/room-types/lookup`, {
    params: toRoomTypeQueryParams(params),
  });

  const data =
    unwrapData<RoomTypesResponseData>(
      response.data,
    );

  if (Array.isArray(data)) {
    return data.map(normalizeRoomType);
  }

  return Array.isArray(data?.items)
    ? data.items.map(normalizeRoomType)
    : [];
}

export async function getRoomTypes(
  params?: GetRoomTypesParams,
): Promise<RoomTypeListResult> {
  const response = await apiClient.get<
    ApiEnvelope<RoomTypesResponseData>
  >(`${ROOM_ENDPOINT}/room-types`, {
    params: toRoomTypeQueryParams(params),
  });

  const data =
    unwrapData<RoomTypesResponseData>(
      response.data,
    );

  return normalizeRoomTypeList(
    data,
    params?.page ?? 1,
    params?.limit ?? 20,
  );
}

export async function getRoomTypeById(
  id: string,
): Promise<RoomType> {
  const response = await apiClient.get<
    ApiEnvelope<BackendRoomType>
  >(`${ROOM_ENDPOINT}/room-types/${id}`);

  return normalizeRoomType(
    unwrapData<BackendRoomType>(
      response.data,
    ),
  );
}

export async function createRoomType(
  input: CreateRoomTypeInput,
): Promise<ApiResponse<RoomType>> {
  const response = await apiClient.post<
    ApiEnvelope<BackendRoomType>
  >(
    `${ROOM_ENDPOINT}/room-types`,
    toRoomTypePayload(input),
  );

  const result =
    unwrapResponse<BackendRoomType>(
      response.data,
      "Tạo loại phòng thành công",
    );

  return {
    ...result,
    data: normalizeRoomType(result.data),
  };
}

export async function updateRoomType(
  id: string,
  input: UpdateRoomTypeInput,
): Promise<ApiResponse<RoomType>> {
  const response = await apiClient.patch<
    ApiEnvelope<BackendRoomType>
  >(
    `${ROOM_ENDPOINT}/room-types/${id}`,
    toRoomTypePayload(input),
  );

  const result =
    unwrapResponse<BackendRoomType>(
      response.data,
      "Cập nhật loại phòng thành công",
    );

  return {
    ...result,
    data: normalizeRoomType(result.data),
  };
}

export async function deleteRoomType(
  id: string,
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete<
    ApiEnvelope<null>
  >(
    `${ROOM_ENDPOINT}/room-types/${id}`,
  );

  return unwrapResponse<null>(
    response.data ?? null,
    "Xóa loại phòng thành công",
  );
}

export async function bulkCreateRooms(
  input: BulkCreateRoomsInput,
): Promise<ApiResponse<ClinicRoom[]>> {
  const response = await apiClient.post<
    ApiEnvelope<BackendRoom[]>
  >(`${ROOM_ENDPOINT}/bulk`, {
    rooms: input.rooms.map(
      toCreateRoomPayload,
    ),
  });

  const result =
    unwrapResponse<BackendRoom[]>(
      response.data,
      "Tạo danh sách phòng thành công",
    );

  return {
    ...result,
    data: Array.isArray(result.data)
      ? result.data.map(normalizeRoom)
      : [],
  };
}


export const roomsApi = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  deleteRooms,
  getRoomTypeLookup,
  getRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  bulkCreateRooms,
};