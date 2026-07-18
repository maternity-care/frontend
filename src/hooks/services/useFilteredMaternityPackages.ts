"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getMaternityPackagesPage,
  getPackageServicesPage,
} from "@/management/features/services/services.api";

import type {
  AllowedFacilityScope,
  GetMaternityPackagesParams,
  MaternityPackage,
  ServiceType,
} from "@/management/features/services/services.types";

const RELATION_LIMIT = 100;

interface RelationFilters {
  serviceSearch?: string;
  serviceId?: string;
  serviceType?: ServiceType;
  facilityId?: string;
  allowedFacilityScope?: AllowedFacilityScope;
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

export function useFilteredMaternityPackages(
  params: GetMaternityPackagesParams,
  relationFilters: RelationFilters,
) {
  const requestIdRef = useRef(0);

  const [items, setItems] =
    useState<MaternityPackage[]>([]);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<unknown>();

  const reload = useCallback(async () => {
    const requestId =
      ++requestIdRef.current;

    const hasRelationFilter = Boolean(
      relationFilters.serviceSearch
        ?.trim() ||
      relationFilters.serviceId ||
      relationFilters.serviceType ||
      relationFilters.facilityId ||
      relationFilters.allowedFacilityScope,
    );

    setLoading(true);
    setError(undefined);

    try {
      if (!hasRelationFilter) {
        const result =
          await getMaternityPackagesPage(
            params,
          );

        if (
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        setItems(
          result.maternityPackages,
        );

        setTotal(result.total);
        return;
      }

      const [
        packageResult,
        relationResult,
      ] = await Promise.all([
        getMaternityPackagesPage({
          ...params,
          page: 1,
          limit: RELATION_LIMIT,
        }),
        getPackageServicesPage({
          search:
            relationFilters.serviceSearch
              ?.trim() || undefined,
          serviceId:
            relationFilters.serviceId,
          serviceType:
            relationFilters.serviceType,
          allowedFacilityScope:
            relationFilters.allowedFacilityScope,
          page: 1,
          limit: RELATION_LIMIT,
        }),
      ]);

      const matchingRelations =
        relationResult.packageServices.filter(
          (relation) => {
            const facilityId =
              relationFilters.facilityId;

            if (!facilityId) {
              return true;
            }

            if (
              relation.allowedFacilityScope ===
              "all"
            ) {
              return true;
            }

            return relation.facilityIds.includes(
              facilityId,
            );
          },
        );

      const packageIds = new Set(
        matchingRelations.map(
          (relation) =>
            relation.packageId,
        ),
      );

      const filtered =
        packageResult.maternityPackages.filter(
          (item) =>
            packageIds.has(item.id),
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
    relationFilters.allowedFacilityScope,
    relationFilters.facilityId,
    relationFilters.serviceId,
    relationFilters.serviceSearch,
    relationFilters.serviceType,
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