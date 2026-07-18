"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getFacilityServicesPage,
  getServicesPage,
} from "@/management/features/services/services.api";

import type {
  GetServicesParams,
  Service,
} from "@/management/features/services/services.types";

const RELATION_LIMIT = 100;

interface RelationFilters {
  facilityId?: string;
}

function paginate<T>(
  items: T[],
  page = 1,
  limit = 20,
) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.max(limit, 1);
  const start =
    (safePage - 1) * safeLimit;

  return {
    items: items.slice(
      start,
      start + safeLimit,
    ),
    total: items.length,
  };
}

export function useFilteredServices(
  params: GetServicesParams,
  relationFilters: RelationFilters,
) {
  const requestIdRef = useRef(0);

  const [items, setItems] =
    useState<Service[]>([]);

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
      if (!relationFilters.facilityId) {
        const result =
          await getServicesPage(params);

        if (
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        setItems(result.services);
        setTotal(result.total);
        return;
      }

      const [
        serviceResult,
        facilityServiceResult,
      ] = await Promise.all([
        getServicesPage({
          ...params,
          page: 1,
          limit: RELATION_LIMIT,
        }),
        getFacilityServicesPage({
          facilityId:
            relationFilters.facilityId,
          page: 1,
          limit: RELATION_LIMIT,
        }),
      ]);

      const serviceIds = new Set(
        facilityServiceResult.facilityServices.map(
          (item) => item.serviceId,
        ),
      );

      const filtered =
        serviceResult.services.filter(
          (service) =>
            serviceIds.has(service.id),
        );

      const result = paginate(
        filtered,
        params.page,
        params.limit,
      );

      if (
        requestId !==
        requestIdRef.current
      ) {
        return;
      }

      setItems(result.items);
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
  }, [
    params,
    relationFilters.facilityId,
  ]);

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