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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  status: number;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
}

export type ProfileFormValues = {
  name: string;
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