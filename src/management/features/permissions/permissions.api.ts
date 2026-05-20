import { apiClient, unwrapApiData } from "@/lib/axios";
import type { Permission } from "./permissions.types";

export function getPermissions() {
  return unwrapApiData<Permission[]>(apiClient.get("/management/permissions"));
}
