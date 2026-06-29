// src/management/features/users/users.types.ts

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

export interface UserPermissionOverride {
  permission: Permission;
  effect: UserPermissionEffect;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: AccountStatus;
  roles: Role[];
  permissionOverrides?: UserPermissionOverride[];
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

export interface GetUsersParams {
  search?: string;
  name?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  status?: AccountStatus;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface UsersListData {
  users: User[];
  total: number;
}

export interface UserPermissionOverrideInput {
  permissionId: string;
  effect: UserPermissionEffect;
}

export interface CreateUserInput {
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

export interface UpdateUserInput {
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
