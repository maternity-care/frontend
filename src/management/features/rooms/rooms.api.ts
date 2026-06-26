import { apiClient } from "@/lib/axios";
import type {
  BackendRoom,
  BackendRoomsByFacility,
  ClinicRoom,
  CreateRoomInput,
  GetRoomsByFacilityParams,
  RoomStatus,
  RoomsByFacility,
  UpdateRoomInput,
} from "./rooms.types";

type ApiEnvelope<T> =
  | T
  | {
      success?: boolean;
      message?: string;
      data: T;
    };

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function unwrapData<T>(responseData: ApiEnvelope<T>): T {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return responseData.data;
  }

  return responseData as T;
}

function unwrapResponse<T>(responseData: ApiEnvelope<T>): ApiResponse<T> {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return {
      success: Boolean(responseData.success ?? true),
      message: responseData.message ?? "Thao tác thành công",
      data: responseData.data,
    };
  }

  return {
    success: true,
    message: "Thao tác thành công",
    data: responseData as T,
  };
}

function normalizeStatus(status: string): RoomStatus {
  const value = status.trim().toLowerCase();

  return value === "active" ||
    value === "1" ||
    value === "hoạt động" ||
    value === "hoat dong" ||
    value === "đang hoạt động" ||
    value === "dang hoat dong"
    ? "active"
    : "suspended";
}

function toBackendStatus(status?: RoomStatus) {
  if (!status) return undefined;

  return status === "active" ? "Hoạt động" : "Tạm ngưng";
}

function getBackendRoomType(room: BackendRoom) {
  return (
    room.roomType ||
    room.type ||
    room.room_type ||
    room.roomTypeName ||
    room.room_type_name ||
    "Chưa cập nhật"
  );
}

function normalizeRoom(room: BackendRoom, capacity = 1): ClinicRoom {
  return {
    id: room.id,
    roomName: room.name,
    roomType: getBackendRoomType(room),
    floor: Number(room.floor) || 1,
    capacity,
    status: normalizeStatus(room.status),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function toBackendPayload(input: CreateRoomInput | UpdateRoomInput) {
  const payload = {
    facilityId: input.facilityId?.trim(),
    name: input.name?.trim(),
    roomType: input.roomType?.trim(),
    floor: input.floor?.trim(),
    status: toBackendStatus(input.status),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

function toQueryParams(params?: GetRoomsByFacilityParams) {
  const queryParams = {
    search: params?.search?.trim() || undefined,
    floor: params?.floor?.trim() || undefined,
    status: params?.status ? toBackendStatus(params.status) : undefined,
  };

  return Object.fromEntries(
    Object.entries(queryParams).filter(([, value]) => value !== undefined),
  );
}

export async function getRooms() {
  const response = await apiClient.get<ApiEnvelope<BackendRoom[]>>(
    "/management/rooms",
  );

  const data = unwrapData<BackendRoom[]>(response.data);

  return Array.isArray(data) ? data.map((room) => normalizeRoom(room)) : [];
}

export async function getRoomById(id: string) {
  const response = await apiClient.get<ApiEnvelope<BackendRoom>>(
    `/management/rooms/${id}`,
  );

  const data = unwrapData<BackendRoom>(response.data);

  return normalizeRoom(data);
}

export async function createRoom(input: CreateRoomInput) {
  const response = await apiClient.post<ApiEnvelope<BackendRoom>>(
    "/management/rooms",
    toBackendPayload(input),
  );

  const result = unwrapResponse<BackendRoom>(response.data);

  return {
    ...result,
    data: normalizeRoom(result.data, input.capacity ?? 1),
  };
}

export async function updateRoom(id: string, input: UpdateRoomInput) {
  const response = await apiClient.patch<ApiEnvelope<BackendRoom>>(
    `/management/rooms/${id}`,
    toBackendPayload(input),
  );

  const result = unwrapResponse<BackendRoom>(response.data);

  return {
    ...result,
    data: normalizeRoom(result.data, input.capacity ?? 1),
  };
}

export async function deleteRoom(id: string) {
  const response = await apiClient.delete<ApiEnvelope<null>>(
    `/management/rooms/${id}`,
  );

  return unwrapResponse<null>(response.data);
}

export async function deleteRooms(ids: string[]) {
  await Promise.all(ids.map((id) => deleteRoom(id)));
}

export async function getRoomsByFacility(
  facilityId: string,
  params?: GetRoomsByFacilityParams,
) {
  const response = await apiClient.get<
    ApiEnvelope<BackendRoom[] | BackendRoomsByFacility>
  >(`/management/facility/rooms/${facilityId}`, {
    params: toQueryParams(params),
  });

  const data = unwrapData<BackendRoom[] | BackendRoomsByFacility>(
    response.data,
  );

  const rooms = Array.isArray(data) ? data : data.rooms;

  return Array.isArray(rooms) ? rooms.map((room) => normalizeRoom(room)) : [];
}

export async function getRoomsGroupedByFacilities() {
  const response = await apiClient.get<ApiEnvelope<BackendRoomsByFacility[]>>(
    "/management/rooms/all/by-facilities",
  );

  const data = unwrapData<BackendRoomsByFacility[]>(response.data);

  return Array.isArray(data)
    ? data.map<RoomsByFacility>((item) => ({
        facility: item.facility,
        rooms: item.rooms.map((room) => normalizeRoom(room)),
      }))
    : [];
}