import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type { UpdateProfileInput, UserProfile } from "./profile.types";

export function getMyProfile() {
  return unwrapApiData<UserProfile>(apiClient.get("/users/me"));
}

export function updateMyProfile(input: UpdateProfileInput) {
  return unwrapApiResponse<UserProfile>(apiClient.patch("/users/me", input));
}
