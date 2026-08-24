export type FacilityStatus =
  | "active"
  | "suspended";

export type BackendFacilityStatus =
  | "active"
  | "inactive"
  | "deleted";

export type FacilityOperatingStatus =
  | "open"
  | "closed_now"
  | "closed_today"
  | "inactive"
  | string;

export type DayOfWeek =
  | "MON"
  | "TUE"
  | "WED"
  | "THU"
  | "FRI"
  | "SAT"
  | "SUN";

export interface FacilityScheduleInput {
  days: DayOfWeek[];
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface BackendOperatingHour {
  dayOfWeek: DayOfWeek;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface BackendOperatingHourGroup {
  days: DayOfWeek[];
  dayLabel: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  displayTime: string;
}

export interface GetFacilitiesParams {
  rawSearch?: string;
  search?: string;
  city?: string;
  ownerId?: string;
  status?: FacilityStatus;
  page?: number;
  limit?: number;
}

export interface GetFacilityLookupParams {
  search?: string;
  status?: BackendFacilityStatus;
  limit?: number;
}

export interface BackendFacilityLookupItem {
  id: string;
  name: string;
  code: string;
  address: string;
  province: string;
  ward: string;
  status: BackendFacilityStatus;
  ownerName: string;
}

export interface FacilityLookupItem {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  ward: string;
  status: FacilityStatus;
  ownerName: string;
}

export interface BackendFacility {
  id: string;
  name: string;
  code: string;

  ownerId?: string | null;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;

  phone: string;
  email: string;
  address: string;
  province: string;
  ward: string;
  floorCount?: number | null;

  latitude: string;
  longitude: string;
  status: BackendFacilityStatus | string;

  operatingStatus?: FacilityOperatingStatus;
  operatingStatusLabel?: string;
  isOpenNow?: boolean;

  todayOperatingHour?: BackendOperatingHour | null;
  operatingHours?: BackendOperatingHour[];
  operatingHourGroups?: BackendOperatingHourGroup[];

  createdAt: string;
  updatedAt: string;
}

export interface BackendFacilityListResponse {
  items: BackendFacility[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Facility {
  id: string;
  name: string;
  code: string;

  ownerId?: string | null;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;

  hotline: string;
  email?: string;
  address: string;
  city: string;
  ward: string;
  floorCount: number;

  latitude?: string;
  longitude?: string;

  status: FacilityStatus;

  operatingStatus: FacilityOperatingStatus;
  operatingStatusLabel: string;
  isOpenNow: boolean;

  todayOperatingHour: BackendOperatingHour | null;
  operatingHours: BackendOperatingHour[];
  operatingHourGroups: BackendOperatingHourGroup[];

  workingHours: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface FacilityListResult {
  items: Facility[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateFacilityInput {
  name: string;
  ownerId?: string;
  hotline: string;
  email?: string;
  schedules: FacilityScheduleInput[];
  address: string;
  city: string;
  ward: string;
  floorCount?: number | null;
  latitude?: string;
  longitude?: string;
  status: FacilityStatus;
}

export interface UpdateFacilityInput {
  name?: string;
  ownerId?: string;
  hotline?: string;
  email?: string;
  address?: string;
  city?: string;
  ward?: string;
  floorCount?: number | null;
  latitude?: string;
  longitude?: string;
}

export interface SuspendResourceInput {
  inactiveUntil?: string | null;
  reason?: string;
}

export interface FacilitySuspendImpact {
  affectedRooms: number;
  affectedShifts: number;
  affectedAppointments: number;
  suspendedRooms?: number;
  cancelledShifts?: number;
  reactivatedRooms?: number;
}

export interface FacilitySuspendResult {
  facility: BackendFacility;
  impact: FacilitySuspendImpact;
}

export interface FacilityReactivateResult {
  facility: BackendFacility;
  impact?: Pick<
    FacilitySuspendImpact,
    "reactivatedRooms"
  >;
}

export interface UpdateFacilityOperatingHoursInput {
  schedules: FacilityScheduleInput[];
}

export type OperatingHoursSlotStrategy =
  | "strict"
  | "deactivate_invalid_slots";

export interface ApplyFacilityOperatingHoursInput
  extends UpdateFacilityOperatingHoursInput {
  slotStrategy?: OperatingHoursSlotStrategy;
}

export interface FacilityOperatingHoursResult {
  operatingHours: BackendOperatingHour[];
  operatingHourGroups: BackendOperatingHourGroup[];
}

export interface FacilityOperatingHoursImpactedShift {
  id: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  status: string;
  doctorName?: string | null;
  roomName?: string | null;
  slotName?: string | null;
  reason?: string;
}

export interface FacilityOperatingHoursImpactedShiftSlot {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  status: string;
  reason?: string;
}

export interface FacilityOperatingHoursImpactSummary {
  impactedShiftCount: number;
  impactedShiftSlotCount: number;
  deactivatedShiftSlotCount?: number;
}

export interface FacilityOperatingHoursPreview
  extends FacilityOperatingHoursResult {
  canUpdate: boolean;
  summary: FacilityOperatingHoursImpactSummary;
  impactedShifts: FacilityOperatingHoursImpactedShift[];
  impactedShiftSlots: FacilityOperatingHoursImpactedShiftSlot[];
}

export interface FacilityOperatingHoursApplyResult
  extends FacilityOperatingHoursResult {
  slotStrategy: OperatingHoursSlotStrategy;
  summary: FacilityOperatingHoursImpactSummary;
  impactedShifts: FacilityOperatingHoursImpactedShift[];
  impactedShiftSlots: FacilityOperatingHoursImpactedShiftSlot[];
}

export type FacilityRoomTypeStatus =
  | "active"
  | "inactive";

export interface GetFacilityRoomTypesParams {
  search?: string;
  status?: FacilityRoomTypeStatus;
  limit?: number;
}

export interface FacilityRoomType {
  id: string;
  code: string;
  name: string;
  description: string;
  status: FacilityRoomTypeStatus;
  roomCount: number;
}

export type FacilityAdminOptionStatus =
  | "active"
  | "inactive"
  | "locked";

export interface GetFacilityAdminOptionsParams {
  search?: string;
  status?: FacilityAdminOptionStatus;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface BackendFacilityAdminOption {
  id: string;
  name: string;
  email: string;
  personalEmail: string | null;
  phone: string;
  employeeCode: string;
  status: FacilityAdminOptionStatus | string;
  homeFacilityId: string | null;
  homeFacilityName: string | null;
  homeFacilityCode: string | null;
  roleId: string;
  roleName: string;
  ownedFacilityCount: number;
}

export interface BackendFacilityAdminOptionsResponse {
  items: BackendFacilityAdminOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FacilityAdminOption {
  id: string;
  name: string;
  email: string;
  personalEmail: string;
  phone: string;
  employeeCode: string;
  status: FacilityAdminOptionStatus;
  homeFacilityId: string;
  homeFacilityName: string;
  homeFacilityCode: string;
  roleId: string;
  roleName: string;
  ownedFacilityCount: number;
}

export interface FacilityAdminOptionsResult {
  items: FacilityAdminOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
