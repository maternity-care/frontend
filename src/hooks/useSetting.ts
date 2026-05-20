"use client";

import { getSettings, type Settings } from "@/features/settings/settings.api";
import useCacheSWR from "./useCacheSWR";

function parseSetting<T>(value: Settings[string] | undefined, parseJson?: boolean): T | null {
  if (value === undefined || value === null) return null;

  if (!parseJson || typeof value !== "string") {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function useSetting() {
  const { data, error, isLoading, mutate } = useCacheSWR<Settings>("/settings", {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 1000 * 60 * 30,
    shouldRetryOnError: false,
    fetcher: getSettings,
  });

  const getSetting = <T = Settings[string],>(key: string, parseJson?: boolean) => {
    return parseSetting<T>(data?.[key], parseJson);
  };

  const getOrDefault = <T,>(key: string, defaultValue: T, parseJson?: boolean) => {
    return parseSetting<T>(data?.[key], parseJson) ?? defaultValue;
  };

  return { settings: data, error, isLoading, mutate, getSetting, getOrDefault };
}

export default useSetting;
