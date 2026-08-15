import { PregnancyProfile } from "../pregnancy-profiles/pregnancy-profiles.types";

export interface Permission {
  id: string;
  name: string;
  guardName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  guardName: string;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export type PermissionOverrideEffect = "allow" | "deny";

export interface PermissionOverride {
  permission: Permission;
  effect: PermissionOverrideEffect;
}

export interface UserProfile {
  id: string;
  facilityId?: string | null;
  facility?: Facility | null;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  personalEmail?: string;
  employeeCode?: string;
  status: "active" | "inactive" | "locked";
  roles: Role[];
  facilities?: Facility[];
  permissionOverrides?: PermissionOverride[];
  createdAt: string;
  updatedAt: string;
  cccd?: string | null,
  dateOfBirth?: string | null,
  priorityLevel?: number | null,
  province?: string | null,
  ward?: string | null,
  emergencyContactName?: string | null,
  emergencyContactPhone?: string | null,
  gestationalWeek?: string | number | null;
  expectedDueDate?: string | null;
  bloodType?: string | null;
  avatar?: string | null;
  lastCheckupAt?: string | null;
  pregnancyProfiles: [PregnancyProfile]
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive" | "deleted";
  address?: string;
  role: Role;
  roles: Role[];
}

export interface UpdateProfileInput {
  name?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  cccd?: string;
  dateOfBirth?: string;
  address?: string;
  province?: string;
  ward?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface User {
  id: string,
  cccd: string | null,
  name: string,
  phone: string,
  email: string,
  avatar: string | null,
  dateOfBirth: string | null,
  address: string | null,
  priorityLevel: number | null,
  province: string | null,
  ward: string | null,
  status: string,
  emergencyContactName: string | null,
  emergencyContactPhone: string | null,
  createdAt: Date,
  updatedAt: Date
  gestationalWeek?: string | number | null;
  expectedDueDate?: string | null;
  bloodType?: string | null;
}

export interface UpdateManagementProfileInput {
  name?: string;
  phone?: string;
  personalEmail?: string;
}

export interface ChangeManagementPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export type ProfileFormValues = {
  name: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  cccd?: string;
  dateOfBirth?: string;
  address?: string;
  province?: string;
  ward?: string;
  gestationalWeek?: string | number | null;
  expectedDueDate?: string | null;
  bloodType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

export type PregnantProfile = UserProfile & {
  phone?: string | null;
  dateOfBirth?: string | null;
  province?: string | null;
  ward?: string | null;
  avatar?: string | null;
  address?: string | null;
  gestationalWeek?: string | number | null;
  expectedDueDate?: string | null;
  bloodType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  lastCheckupAt?: string | null;
  id: string;
  name: string;
  email: string;
  personalEmail?: string;
  employeeCode?: string;
  status: "active" | "inactive" | "locked";
  roles: Role[];
  facilities?: Facility[];
  permissionOverrides?: PermissionOverride[];
  createdAt: string;
  updatedAt: string;
  cccd?: string | null;
  priorityLevel?: number | null;
  pregnancyProfiles: [PregnancyProfile]
};

export type FeedbackState = {
  message: string | null;
  error: string | null;
};

export type ProfileUpdateHandler = (
  profile: UserProfile,
  message?: string
) => Promise<void>;
