export type ShiftSlotStatus =
  | "active"
  | "inactive";

export type ShiftSlotApplicableDay =
  | "MON"
  | "TUE"
  | "WED"
  | "THU"
  | "FRI"
  | "SAT"
  | "SUN";

export interface BackendShiftSlot {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  applicableDays?:
    | ShiftSlotApplicableDay[]
    | string[]
    | null;
  status: ShiftSlotStatus | string;
  createdAt: string;
  updatedAt: string;
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
  applicableDays: ShiftSlotApplicableDay[];
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
  applicableDays?:
    | ShiftSlotApplicableDay[]
    | string[]
    | null;
  status: ShiftSlotStatus | string;
}

export interface ShiftSlotLookupItem {
  id: string;
  facilityId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  applicableDays: ShiftSlotApplicableDay[];
  status: ShiftSlotStatus;
}

export interface ShiftSlotFacilityOption {
  id: string;
  name: string;
  code: string;
  address: string;
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
  applicableDays?: ShiftSlotApplicableDay[];
  status: ShiftSlotStatus;
}

export interface UpdateShiftSlotInput {
  facilityId?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  isOvernight?: boolean;
  applicableDays?: ShiftSlotApplicableDay[];
  status?: ShiftSlotStatus;
}

export interface ShiftSlotApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
