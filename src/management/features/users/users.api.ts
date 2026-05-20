import { apiClient, unwrapApiData } from "@/lib/axios";
import type { UpdateProfileInput, User } from "./users.types";

export function getUsers() {
  return unwrapApiData<User[]>(apiClient.get("/management/users"));
}

export function getMyProfile() {
  return unwrapApiData<User>(apiClient.get("/users/me"));
}

export function updateMyProfile(input: UpdateProfileInput) {
  return unwrapApiData<User>(apiClient.patch("/users/me", input));
}
