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
  name: string;
  email: string;
  phone?: string | null;
  personalEmail?: string;
  employeeCode?: string;
  status: "active" | "inactive" | "locked";
  roles: Role[];
  facilities?: Facility[];
  permissionOverrides?: PermissionOverride[];
  createdAt: string;
  updatedAt: string;
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
  address?: string | null;
  gestationalWeek?: string | number | null;
  expectedDueDate?: string | null;
  bloodType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  lastCheckupAt?: string | null;
};

export type FeedbackState = {
  message: string | null;
  error: string | null;
};

export type ProfileUpdateHandler = (
  profile: UserProfile,
  message?: string
) => Promise<void>;
