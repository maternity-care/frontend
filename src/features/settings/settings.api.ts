import { apiClient, unwrapApiData } from "@/lib/axios";
import type { Settings } from "./settings.types";

export type { Settings } from "./settings.types";

export function getSettings() {
  return unwrapApiData<Settings>(apiClient.get("/settings"));
}
