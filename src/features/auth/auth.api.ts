import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type { UserProfile } from "../profile/profile.types";
import type { AuthResponse, BackendAuthResponse, LoginInput, RegisterInput } from "./auth.types";

function normalizeAuthResponse(response: BackendAuthResponse, message?: string): AuthResponse {
  const accessToken = response.accessToken ?? response.access_token;

  if (!accessToken) {
    throw new Error("API login không trả access token.");
  }

   if (!response.user) {
    throw new Error("API không trả thông tin user.");
  }

  return {
    accessToken,
    refreshToken: response.refreshToken ?? response.refresh_token ?? null,
    tokenType: response.tokenType ?? "Bearer",
    expiresIn: response.expiresIn ?? "",
    user: response.user,
    roles: response.roles ?? response.user.roles?.map((role) => role.name) ?? [],
    permissions:
      response.permissions ??
      response.user.roles?.flatMap((role) => role.permissions?.map((permission) => permission.name) ?? []) ??
      [],
    message,
  };
}

export async function login(input: LoginInput) {
  const response = await unwrapApiResponse<BackendAuthResponse>(
    apiClient.post("/auth/login", input)
  );

  return normalizeAuthResponse(response.data, response.message);
}

export function getCurrentUser() {
  return unwrapApiData<UserProfile>(apiClient.get("/auth/me"));
}

export function logout(refreshToken: string) {
  return unwrapApiData<null>(apiClient.post("/auth/logout", { refresh_token: refreshToken }));
}

export async function register(input: RegisterInput) {
  const response = await unwrapApiResponse<BackendAuthResponse>(
    apiClient.post("/auth/register", input)
  );

  return normalizeAuthResponse(response.data, response.message);
}