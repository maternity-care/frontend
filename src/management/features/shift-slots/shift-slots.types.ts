export type ShiftSlotStatus = "active" | "inactive";

export interface BackendShiftSlotFacility {
  id: string;
  name: string;
  code: string;
  ownerId?: string;
  phone?: string;
  email?: string;
  address?: string;
  province?: string;
  ward?: string;
  latitude?: string;
  longitude?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deleteReason?: string | null;
}

export interface BackendShiftSlot {
  id: string;
  facilityId: string;
  facilityName?: string;
  facilityCode?: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean | number | string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  facility?: BackendShiftSlotFacility | null;
}

export interface BackendShiftSlotPagination {
  items: BackendShiftSlot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ShiftSlot {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  status: ShiftSlotStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftSlotListResult {
  items: ShiftSlot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BackendShiftSlotLookupItem {
  id: string;
  facilityId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ShiftSlotLookupItem {
  id: string;
  facilityId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  status: ShiftSlotStatus;
}

export interface GetShiftSlotsParams {
  search?: string;
  facilityId?: string;
  status?: ShiftSlotStatus;
  page?: number;
  limit?: number;
}

export interface GetShiftSlotLookupParams {
  search?: string;
  facilityId?: string;
  status?: ShiftSlotStatus;
  limit?: number;
}

export interface CreateShiftSlotInput {
  facilityId: string;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  status: ShiftSlotStatus;
}

export interface UpdateShiftSlotInput {
  facilityId?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  isOvernight?: boolean;
  status?: ShiftSlotStatus;
}

export interface ShiftSlotApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}