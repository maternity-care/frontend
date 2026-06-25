export type RoomStatus = "active" | "suspended";

export interface BackendRoom {
  id: string;
  name: string;
  roomType: string;
  floor: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendRoomFacility {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  latitude: string;
  longitude: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendRoomsByFacility {
  facility: BackendRoomFacility;
  rooms: BackendRoom[];
}

export interface ClinicRoom {
  id: string;
  roomName: string;
  roomType: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomFormValues {
  roomName: string;
  roomType: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
}

export interface GetRoomsByFacilityParams {
  search?: string;
  floor?: string;
  status?: RoomStatus;
}

export interface CreateRoomInput {
  facilityId: string;
  name: string;
  roomType: string;
  floor: string;
  status: RoomStatus;
  capacity?: number;
}

export type UpdateRoomInput = Partial<CreateRoomInput>;

export interface RoomsByFacility {
  facility: BackendRoomFacility;
  rooms: ClinicRoom[];
}