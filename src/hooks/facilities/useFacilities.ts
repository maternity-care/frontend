"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_FACILITY_PAGE_SIZE,
  getFacility,
  getFacilitiesPage,
} from "@/management/features/facilities/facilities.api";
import type {
  Facility,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import {
  getFacilityErrorMessage,
} from "@/fe/components/facilities/facility-form.shared";

type UseFacilitiesOptions = {
  canViewAllFacilities: boolean;
  scopedFacilityId?: string;
};

export function useFacilities({
  canViewAllFacilities,
  scopedFacilityId = "",
}: UseFacilitiesOptions) {
  const [
    facilities,
    setFacilities,
  ] = useState<Facility[]>([]);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(
    DEFAULT_FACILITY_PAGE_SIZE,
  );

  const [
    totalFacilities,
    setTotalFacilities,
  ] = useState(0);

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    cityFilter,
    setCityFilter,
  ] = useState<
    string | undefined
  >();

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    FacilityStatus | undefined
  >();

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    tableLoading,
    setTableLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const reloadFacilities =
    useCallback(
      async (
        page = currentPage,
        limit = pageSize,
      ) => {
        setLoading(true);
        setError(null);

        try {
          if (
            !canViewAllFacilities
          ) {
            const facilityId =
              scopedFacilityId.trim();

            if (!facilityId) {
              setFacilities([]);
              setTotalFacilities(0);
              setCurrentPage(1);

              setError(
                "Không xác định được cơ sở được phân công cho tài khoản Admin.",
              );

              return;
            }

            const facility =
              await getFacility(
                facilityId,
              );

            setFacilities([
              facility,
            ]);
            setTotalFacilities(1);
            setCurrentPage(1);

            return;
          }

          const result =
            await getFacilitiesPage({
              search: query,
              city: cityFilter,
              status:
                statusFilter,
              page,
              limit,
            });

          setFacilities(
            result.items,
          );
          setTotalFacilities(
            result.total,
          );
          setCurrentPage(
            result.page,
          );
          setPageSize(
            result.limit,
          );
        } catch (loadError) {
          setFacilities([]);

          if (
            !canViewAllFacilities
          ) {
            setTotalFacilities(
              0,
            );
          }

          setError(
            getFacilityErrorMessage(
              loadError,
              "Không thể tải thông tin cơ sở.",
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [
        canViewAllFacilities,
        cityFilter,
        currentPage,
        pageSize,
        query,
        scopedFacilityId,
        statusFilter,
      ],
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void reloadFacilities();
        },
        300,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [reloadFacilities]);

  const cityOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            facilities
              .map(
                (facility) =>
                  facility.city,
              )
              .filter(Boolean),
          ),
        ).map((city) => ({
          value: city,
          label: city,
        })),
      [facilities],
    );

  function applyFilters(
    values: {
      name?: unknown;
      province?: unknown;
      status?: unknown;
    },
  ) {
    if (
      !canViewAllFacilities
    ) {
      return;
    }

    setCurrentPage(1);

    setQuery(
      String(
        values.name ?? "",
      ),
    );

    setCityFilter(
      values.province
        ? String(
            values.province,
          )
        : undefined,
    );

    setStatusFilter(
      values.status as
        | FacilityStatus
        | undefined,
    );
  }

  function changePage(
    page: number,
    nextPageSize: number,
  ) {
    if (
      !canViewAllFacilities
    ) {
      return;
    }

    if (
      nextPageSize !==
      pageSize
    ) {
      setPageSize(
        nextPageSize,
      );
      setCurrentPage(1);

      return;
    }

    setCurrentPage(page);
  }

  function replaceFacility(
    updated: Facility,
  ) {
    setFacilities(
      (current) =>
        current.map(
          (facility) =>
            facility.id ===
            updated.id
              ? updated
              : facility,
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