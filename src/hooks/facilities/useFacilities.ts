"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_FACILITY_PAGE_SIZE,
  getFacilitiesPage,
} from "@/management/features/facilities/facilities.api";
import type {
  Facility,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import {
  getFacilityErrorMessage,
} from "@/fe/components/facilities/facility-form.shared";

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_FACILITY_PAGE_SIZE);
  const [totalFacilities, setTotalFacilities] = useState(0);

  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<
    FacilityStatus | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadFacilities = useCallback(
    async (page = currentPage, limit = pageSize) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getFacilitiesPage({
          search: query,
          city: cityFilter,
          status: statusFilter,
          page,
          limit,
        });

        setFacilities(result.items);
        setTotalFacilities(result.total);
        setCurrentPage(result.page);
        setPageSize(result.limit);
      } catch (loadError) {
        setError(getFacilityErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    },
    [cityFilter, currentPage, pageSize, query, statusFilter],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reloadFacilities();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [reloadFacilities]);

  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(facilities.map((facility) => facility.city).filter(Boolean)),
      ).map((city) => ({ value: city, label: city })),
    [facilities],
  );

  function applyFilters(values: {
    name?: unknown;
    province?: unknown;
    status?: unknown;
  }) {
    setCurrentPage(1);
    setQuery(String(values.name ?? ""));
    setCityFilter(values.province ? String(values.province) : undefined);
    setStatusFilter(values.status as FacilityStatus | undefined);
  }

  function changePage(page: number, nextPageSize: number) {

    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setCurrentPage(1);
      return;
    }

    setCurrentPage(page);
  }

  function replaceFacility(updated: Facility) {
    setFacilities((current) =>
      current.map((facility) =>
        facility.id === updated.id ? updated : facility,
      ),
    );
  }

  return {
    facilities,
    currentPage,
    setCurrentPage,
    pageSize,
    totalFacilities,
    query,
    cityFilter,
    statusFilter,
    cityOptions,
    loading,
    tableLoading,
    setTableLoading,
    error,
    setError,
    reloadFacilities,
    applyFilters,
    changePage,
    replaceFacility,
  };
}