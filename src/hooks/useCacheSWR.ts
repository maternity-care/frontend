"use client";

import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import useLocalStorage from "./useLocalStorage";

export function useCacheSWR<T>(key: string | null, options: SWRConfiguration<T> = {}): SWRResponse<T> {
  const storageKey = key ? `swr:${key}` : "";
  const [cacheData, setCacheData] = useLocalStorage<T>(storageKey);

  return useSWR<T>(key, {
    ...options,
    fallbackData: cacheData,
    onSuccess: (data) => {
      setCacheData(data);
    },
  });
}

export default useCacheSWR;
