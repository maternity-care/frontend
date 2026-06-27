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
  status: number;
  roles: Role[];
  permissionOverrides?: PermissionOverride[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  password?: string;
}

export type ProfileFormValues = {
  name: string;
  password?: string;
  confirmPassword?: string;
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