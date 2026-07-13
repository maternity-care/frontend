import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  ChangeManagementPasswordInput,
  UpdateManagementProfileInput,
  UpdateProfileInput,
  UserProfile,
} from "./profile.types";

export function getMyProfile() {
  return unwrapApiData<UserProfile>(apiClient.get("/users/me"));
}

export function updateMyProfile(input: UpdateProfileInput) {
  return unwrapApiResponse<UserProfile>(apiClient.patch("/users/me", input));
}

export function updateManagementProfile(
  input: UpdateManagementProfileInput,
) {
  return unwrapApiResponse<UserProfile>(
    apiClient.patch("/management/auth/profile", input),
  );
}

export function changeManagementPassword(
  input: ChangeManagementPasswordInput,
) {
  return unwrapApiResponse<null>(
    apiClient.post("/management/auth/change-password", input),
  );
}
