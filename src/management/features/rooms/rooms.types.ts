export type RoomStatus =
  | "active"
  | "inactive";

export interface BackendRoom {
  id: string;
  facilityId: string;
  code: string;
  name: string;
  roomTypeId: string;
  floor: string;
  status: string;
  createdAt: string;
  updatedAt: string;

  facilityName?: string;
  facilityCode?: string;
  facilityAddress?: string;
  facilityProvince?: string;
  facilityWard?: string;
  facilityStatus?: string;

  roomTypeName?: string;
  roomTypeCode?: string;
  roomTypeDescription?: string;
  roomTypeStatus?: string;
}

export interface BackendPaginatedRooms {
  items: BackendRoom[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClinicRoom {
  id: string;
  facilityId: string;
  code: string;
  roomName: string;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeCode: string;
  roomTypeDescription: string;
  roomTypeStatus: RoomStatus;
  floor: string;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;

  facilityName: string;
  facilityCode: string;
  facilityAddress: string;
  facilityProvince: string;
  facilityWard: string;
  facilityStatus: RoomStatus;
}

export interface RoomListResult {
  items: ClinicRoom[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RoomFormValues {
  roomName: string;
  roomTypeId: string;
  floor: string;
  status: RoomStatus;
}

export interface GetRoomsParams {
 
  search?: string;
  floor?: string;
  status?: RoomStatus;
  facilityId?: string;
  roomTypeId?: string;
  page?: number;
  limit?: number;
}

export interface CreateRoomInput {
  facilityId: string;
  name: string;
  roomTypeId: string;
  floor: string;
  status: RoomStatus;
}

export interface UpdateRoomInput {
  name?: string;
  roomTypeId?: string;
  floor?: string;
}

export interface SuspendResourceInput {
  inactiveUntil?: string | null;
  reason?: string;
}

export interface RoomSuspendImpact {
  affectedShifts: number;
  affectedAppointments: number;
  cancelledShifts?: number;
}

export interface RoomSuspendResult {
  room: ClinicRoom;
  impact: RoomSuspendImpact;
}

export interface RoomReactivateResult {
  room: ClinicRoom;
}

export interface BackendRoomType {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendPaginatedRoomTypes {
  items: BackendRoomType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RoomType {
  id: string;
  code: string;
  name: string;
  description: string;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RoomTypeListResult {
  items: RoomType[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetRoomTypesParams {
  search?: string;
  status?: RoomStatus;
  page?: number;
  limit?: number;
}

export type GetRoomTypeLookupParams =
  Omit<GetRoomTypesParams, "page">;

export interface CreateRoomTypeInput {
  name: string;
  description: string;
  status: RoomStatus;
}

export type UpdateRoomTypeInput =
  Partial<CreateRoomTypeInput>;

export interface BulkCreateRoomsInput {
  rooms: CreateRoomInput[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
