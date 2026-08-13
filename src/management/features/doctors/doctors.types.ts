export type DoctorStatus = "active" | "inactive";

export type DoctorPermissionEffect = "allow" | "deny";

export type DoctorFacilityRole = "admin" | "doctor" | "nurse" | "staff";

export type DoctorExperienceSort = "asc" | "desc";

export type DoctorExperienceLevel = 1 | 2 | 3 | 4;

export interface BackendDoctorStaff {
  id?: string | null;
  name?: string | null;
  personalEmail?: string | null;
  employeeCode?: string | null;
  facilityId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  roles?: BackendDoctorRole[] | null;
}

export interface BackendDoctorRole {
  id?: string | number | null;
  name?: string | null;
}

export interface BackendDoctor {
  id: string;
  staffId: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  workingRoomTypeId?: string | null;
  bio: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  staff?: BackendDoctorStaff | null;
  name?: string | null;
  personalEmail?: string | null;
  employeeCode?: string | null;
  facilityId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface BackendDoctorPaginatedResponse {
  items: BackendDoctor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BackendDoctorDataCountResponse {
  data: BackendDoctor[];
  count: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type BackendDoctorListPayload =
  | BackendDoctor[]
  | BackendDoctorPaginatedResponse
  | BackendDoctorDataCountResponse;
export interface Doctor {
  id: string;
  staffId: string;
  name: string;
  employeeCode: string;
  personalEmail: string;
  email: string;
  phone: string;
  address: string;
  facilityId: string;
  facilityIds: string[];
  roleId: string;
  roleName: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: DoctorExperienceLevel;
  workingRoomTypeId: string;
  bio: string;
  status: DoctorStatus;
  staffStatus: DoctorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GetDoctorsParams {
  name?: string;
  email?: string;
  employeeCode?: string;
  personalEmail?: string;
  phone?: string;
  licenseNo?: string;
  specialty?: string;
  facilityId?: string;
  status?: DoctorStatus;
  filterYearsOfExperienceLevel?: DoctorExperienceLevel;
  sortYearsOfExperience?: DoctorExperienceSort;
  page?: number;
  limit?: number;
}

export interface DoctorListResult {
  items: Doctor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPaginationMetadata: boolean;
}

export interface DoctorFacilityAssignment {
  facilityId: string;
  roles: DoctorFacilityRole[];
}

export interface DoctorPermissionOverrideInput {
  permissionId: string;
  effect: DoctorPermissionEffect;
}

export interface CreateDoctorInput {
  staffId: string;
  name?: string;
  personalEmail?: string;
  phone?: string;
  address?: string;
  roleIds?: string[];
  facilityAssignments?: DoctorFacilityAssignment[];
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: DoctorExperienceLevel;
  workingRoomTypeId: string;
  bio?: string;
  permissionOverrides?: DoctorPermissionOverrideInput[];
  status?: DoctorStatus;
}

export interface UpdateDoctorInput {
  staffId?: string;
  name?: string;
  personalEmail?: string;
  phone?: string;
  address?: string;
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: DoctorExperienceLevel;
  workingRoomTypeId?: string;
  bio?: string;
  status?: DoctorStatus;
}

export interface DoctorApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}