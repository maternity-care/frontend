import type { UserProfile } from "../profile/profile.types";

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ForgotPasswordResponse {
  reset_token: string | null;
  reset_url: string | null;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  accountType: "user" | "staff";
  accessToken: string;
  refreshToken: string | null;
  tokenType: "Bearer";
  expiresIn: string;
  user: UserProfile;
  roles: string[];
  permissions: string[];
  message?: string;
}

export interface BackendAuthResponse {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: "Bearer";
  expiresIn?: string;
  user: UserProfile;
  roles?: string[];
  permissions?: string[];
}

export interface AuthState {
  accountType: "user" | "staff";
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  permissions: string[];
  activeFacilityId: string | null;
  isChecking: boolean;
  setSession: (session: AuthResponse, rememberMe?: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  setActiveFacility: (facilityId: string) => void;
  setChecking: (isChecking: boolean) => void;
  clearSession: () => void;
}

export interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface VerifyOtpInput {
  email: string;
  otp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface RegisterResponse {
  email?: string;
}

export interface ResendOtpInput {
  email: string;
}

export interface VerifyOtpInput {
  email: string;
  otp: string;
}
