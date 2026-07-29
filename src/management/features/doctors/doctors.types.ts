export type DoctorStatus =
  | "active"
  | "inactive";

export type DoctorPermissionEffect =
  | "allow"
  | "deny";

export type DoctorFacilityRole =
  | "admin"
  | "doctor"
  | "nurse"
  | "staff";

export type DoctorExperienceSort =
  | "asc"
  | "desc";

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
}

export interface BackendDoctor {
  id: string;
  staffId: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio: string;
  status: string;
  createdAt: string;
  updatedAt: string;

  /**
   * Backend có thể trả thông tin nhân sự dạng object staff
   * hoặc làm phẳng trực tiếp vào doctor.
   */
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

/**
 * Dạng repository/service thường trả:
 * { data: Doctor[], count: number }
 */
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

  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
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
  name: string;
  personalEmail: string;
  phone: string;
  roleIds: string[];
  facilityAssignments:
    DoctorFacilityAssignment[];
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio?: string;
  permissionOverrides?:
    DoctorPermissionOverrideInput[];
}

export interface UpdateDoctorInput {
  staffId?: string;
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: number;
  bio?: string;
  status?: DoctorStatus;
}

export interface DoctorApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}