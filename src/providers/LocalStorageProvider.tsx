"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type StoredData = Record<string, unknown>;

interface LocalStorageContextValue {
  storedData: StoredData;
  saveData: <T>(key: string, value: T | undefined) => void;
  removeData: (key: string) => void;
}

const LocalStorageContext = createContext<LocalStorageContextValue | undefined>(undefined);

function readStoredData() {
  const data: StoredData = {};

  if (typeof window === "undefined") return data;

  for (const key of Object.keys(window.localStorage)) {
    const value = window.localStorage.getItem(key);
    if (value === null) continue;

    try {
      data[key] = JSON.parse(value) as unknown;
    } catch {
      data[key] = value;
    }
  }

  return data;
}

export function LocalStorageProvider({ children }: { children: React.ReactNode }) {
  // SSR and the first browser render must use the same snapshot.
  const [storedData, setStoredData] = useState<StoredData>({});

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setStoredData(readStoredData());
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const saveData = useCallback(<T,>(key: string, value: T | undefined) => {
    if (typeof window === "undefined") return;

    if (value === undefined) {
      window.localStorage.removeItem(key);
      setStoredData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
    setStoredData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const removeData = useCallback((key: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }

    setStoredData((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const value = useMemo(() => ({ storedData, saveData, removeData }), [storedData, saveData, removeData]);

  return <LocalStorageContext.Provider value={value}>{children}</LocalStorageContext.Provider>;
}

export function useGlobalLocalStorage() {
  const context = useContext(LocalStorageContext);
  if (!context) {
    throw new Error("useLocalStorage must be used within LocalStorageProvider");
  }

  return context;
}
