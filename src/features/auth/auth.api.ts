import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type { UserProfile } from "../profile/profile.types";
import type {
  AuthResponse,
  BackendAuthResponse,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  LoginInput,
  RegisterInput,
  RegisterResponse,
  ResendOtpInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from "./auth.types";

function normalizeAuthResponse(
  response: BackendAuthResponse,
  accountType: "user" | "staff",
  message?: string,
): AuthResponse {
  const accessToken = response.accessToken ?? response.access_token;

  if (!accessToken) {
    throw new Error("API login không trả access token.");
  }

  if (!response.user) {
    throw new Error("API không trả thông tin user.");
  }

  return {
    accountType,
    accessToken,
    refreshToken: response.refreshToken ?? response.refresh_token ?? null,
    tokenType: response.tokenType ?? "Bearer",
    expiresIn: response.expiresIn ?? "",
    user: response.user,
    roles:
      response.roles ?? response.user.roles?.map((role) => role.name) ?? [],
    permissions:
      response.permissions ??
      response.user.roles?.flatMap(
        (role) => role.permissions?.map((permission) => permission.name) ?? [],
      ) ??
      [],
    message,
  };
}

export async function login(input: LoginInput) {
  const response = await unwrapApiResponse<BackendAuthResponse>(
    apiClient.post("/auth/login", input),
  );

  return normalizeAuthResponse(response.data, "user", response.message);
}

export async function managementLogin(input: LoginInput) {
  const response = await unwrapApiResponse<BackendAuthResponse>(
    apiClient.post("/management/auth/login", input),
  );

  return normalizeAuthResponse(response.data, "staff", response.message);
}

export function getCurrentUser() {
  const endpoint =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/management")
      ? "/management/auth/me"
      : "/auth/me";
  return unwrapApiData<UserProfile>(apiClient.get(endpoint));
}

export function logout(refreshToken: string, accountType: "user" | "staff" = "user") {
  return unwrapApiResponse<null>(
    apiClient.post(
      accountType === "staff" ? "/management/auth/logout" : "/auth/logout",
      { refresh_token: refreshToken },
    ),
  );
}

export function managementForgotPassword(input: ForgotPasswordInput) {
  return unwrapApiResponse<ForgotPasswordResponse>(
    apiClient.post("/management/auth/forgot-password", input),
  );
}

export function managementResetPassword(input: ResetPasswordInput) {
  return unwrapApiResponse<null>(
    apiClient.post("/management/auth/reset-password", input),
  );
}

export async function managementRefresh(refreshToken: string) {
  const response = await unwrapApiResponse<BackendAuthResponse>(
    apiClient.post("/management/auth/refresh", {
      refresh_token: refreshToken,
    }),
  );
  return normalizeAuthResponse(response.data, "staff", response.message);
}

export function forgotPassword(input: ForgotPasswordInput) {
  return unwrapApiResponse<ForgotPasswordResponse>(
    apiClient.post("/auth/forgot-password", input),
  );
}

export function resetPassword(input: ResetPasswordInput) {
  return unwrapApiResponse<null>(apiClient.post("/auth/reset-password", input));
}

export function register(input: RegisterInput) {
  return unwrapApiResponse<RegisterResponse>(
    apiClient.post("/auth/register", input),
  );
}

export function resendOtp(input: ResendOtpInput) {
  return unwrapApiResponse<unknown>(
    apiClient.post("/auth/resend-otp", input),
  );
}

export async function verifyOtp(input: VerifyOtpInput) {
  const response = await unwrapApiResponse<BackendAuthResponse>(
    apiClient.post("/auth/verify-otp", input),
  );

  return normalizeAuthResponse(
    response.data,
    "user",
    response.message,
  );
}