import type { UserProfile } from "../profile/profile.types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
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
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  permissions: string[];
  isChecking: boolean;
  setSession: (session: AuthResponse) => void;
  setUser: (user: UserProfile | null) => void;
  setChecking: (isChecking: boolean) => void;
  clearSession: () => void;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}