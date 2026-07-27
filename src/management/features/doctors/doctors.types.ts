export type DoctorStatus = "active" | "inactive";
export type DoctorPermissionEffect = "allow" | "deny";
export type DoctorFacilityRole =
  | "admin"
  | "doctor"
  | "nurse"
  | "staff";

export interface BackendDoctorStaff {
  id: string;
  name: string;
  personalEmail: string;
  employeeCode: string;
  facilityId: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  staff?: BackendDoctorStaff | null;
}

export interface Doctor {
  id: string;
  staffId: string;
  name: string;
  facilityId: string;
  facilityIds: string[];
  employeeCode: string;
  email: string;
  phone: string;
  address: string;
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
  facilityAssignments: DoctorFacilityAssignment[];
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio?: string;
  permissionOverrides?: DoctorPermissionOverrideInput[];
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