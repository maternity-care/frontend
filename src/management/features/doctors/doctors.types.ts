export type DoctorStatus = "active" | "inactive";
export type DoctorPermissionEffect = "allow" | "deny";
export type DoctorFacilityRole = "admin" | "doctor" | "nurse" | "staff";

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
}

export interface Doctor {
  id: string;
  staffId: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio: string;
  status: DoctorStatus;
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