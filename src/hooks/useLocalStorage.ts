"use client";

import { useCallback } from "react";
import { useGlobalLocalStorage } from "@/providers/LocalStorageProvider";

export function useLocalStorage<T>(key: string) {
  const { storedData, saveData, removeData } = useGlobalLocalStorage();
  const data = storedData[key] as T | undefined;

  const saveLocalData = useCallback(
    (value: T | undefined) => {
      saveData<T>(key, value);
    },
    [key, saveData],
  );

  const removeLocalData = useCallback(() => {
    removeData(key);
  }, [key, removeData]);

  return [data, saveLocalData, removeLocalData] as const;
}

export default useLocalStorage;
