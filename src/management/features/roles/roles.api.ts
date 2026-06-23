import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type { Role, UpdateRoleInput } from "./roles.types";

export function getRoles() {
  return unwrapApiData<Role[]>(apiClient.get("/management/roles"));
}

export function updateRole(id: string, input: UpdateRoleInput) {
  return unwrapApiResponse<Role>(apiClient.patch(`/management/roles/${id}`, input));
}
