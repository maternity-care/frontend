import type { ApiResponse } from "@/lib/axios";
import { API_BASE_URL, SITE_URL } from "@/lib/constants";
import { getSettingString, type Settings } from "./settings.types";

const SETTINGS_REVALIDATE_SECONDS = 300;

export async function getPublicSettings(): Promise<Settings> {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      next: { revalidate: SETTINGS_REVALIDATE_SECONDS },
    });

    if (!response.ok) return {};

    const payload = (await response.json()) as ApiResponse<Settings>;
    return payload.data ?? {};
  } catch {
    return {};
  }
}

export function getSiteUrl(settings?: Settings) {
  return getSettingString(settings, ["site_url", "siteUrl", "website_url", "websiteUrl"], SITE_URL).replace(/\/+$/, "");
}
