"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getFacilityServicesPage,
} from "@/management/features/services/services.api";

import type {
  FacilityService,
  GetFacilityServicesParams,
} from "@/management/features/services/services.types";

export function useFacilityServices(
  params: GetFacilityServicesParams,
) {
  const requestIdRef = useRef(0);

  const [items, setItems] =
    useState<FacilityService[]>([]);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<unknown>();

  const reload = useCallback(async () => {
    const requestId =
      ++requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const result =
        await getFacilityServicesPage(
          params,
        );

      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      setItems(
        result.facilityServices,
      );

      setTotal(result.total);
    } catch (requestError) {
      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      setItems([]);
      setTotal(0);
      setError(requestError);
    } finally {
      if (
        requestId ===
        requestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void reload();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [reload]);

  return {
    items,
    total,
    loading,
    error,
    reload,
  };
}