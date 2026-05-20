import { apiClient, unwrapApiData } from "@/lib/axios";
import type { UserProfile } from "../profile/profile.types";
import type { AuthResponse, BackendAuthResponse, LoginInput } from "./auth.types";

function normalizeAuthResponse(response: BackendAuthResponse): AuthResponse {
  const accessToken = response.accessToken ?? response.access_token;

  if (!accessToken) {
    throw new Error("API login không trả access token.");
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
  };
}

export async function login(input: LoginInput) {
  const response = await unwrapApiData<BackendAuthResponse>(apiClient.post("/auth/login", input));
  return normalizeAuthResponse(response);
}

export function getCurrentUser() {
  return unwrapApiData<UserProfile>(apiClient.get("/auth/me"));
}

export function logout(refreshToken: string) {
  return unwrapApiData<null>(apiClient.post("/auth/logout", { refresh_token: refreshToken }));
}
