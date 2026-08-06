// src/management/features/staffs/staffs.types.ts

export type UserPermissionEffect = "allow" | "deny";
export type AccountStatus = "active" | "inactive" | "locked";

export interface Permission {
  id: string;
  name: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Role {
  id: string;
  name: string;
  guardName: string;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface StaffPermissionOverride {
  permission: Permission;
  effect: UserPermissionEffect;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: AccountStatus;
  roles: Role[];
  permissionOverrides?: StaffPermissionOverride[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  staffProfile?: StaffProfile | null;
}

export interface StaffProfile {
  id: string;
  staffId: string;
  personalEmail: string;
  employeeCode: string;
  status: AccountStatus;
  facilityAssignments: FacilityStaffAssignment[];
  doctor?: DoctorProfile | null;
}

export type StaffPosition = "admin" | "doctor" | "nurse" | "staff";
export interface FacilityStaffAssignment {
  facilityId: string;
  roles: StaffPosition[];
}

export interface DoctorProfile {
  id: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio?: string;
  status: string;
}

export interface CreateStaffProfileInput {
  personalEmail: string;
  position: StaffPosition;
  facilityIds: string[];
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: number;
  bio?: string;
}

export interface GetStaffsParams {
  search?: string;
  name?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  facilityId?: string;
  status?: AccountStatus;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface StaffsListData {
  users: Staff[];
  total: number;
}

export interface UserPermissionOverrideInput {
  permissionId: string;
  effect: UserPermissionEffect;
}

export interface CreateStaffInput {
  name: string;
  personalEmail: string;
  phone: string;
  permissionOverrides?: UserPermissionOverrideInput[];
  facilityAssignments: FacilityStaffAssignment[];
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: number;
  bio?: string;
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  password?: string;
  status?: AccountStatus;
  roleIds?: string[];
  permissionOverrides?: UserPermissionOverrideInput[];
  facilityAssignments?: FacilityStaffAssignment[];
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: number;
  bio?: string;
}
