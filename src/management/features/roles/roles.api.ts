import { apiClient, unwrapApiData } from "@/lib/axios";
import type { Role } from "./roles.types";

export function getRoles() {
  return unwrapApiData<Role[]>(apiClient.get("/management/roles"));
}
