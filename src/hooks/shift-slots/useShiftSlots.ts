"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  getShiftSlots,
} from "@/management/features/shift-slots/shift-slots.api";
import {
  SHIFT_SLOT_DEFAULT_PAGE_SIZE,
} from "@/management/features/shift-slots/shift-slots.constants";
import type {
  ShiftSlot,
  ShiftSlotStatus,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  getShiftSlotErrorMessage,
} from "@/management/features/shift-slots/shift-slots.utils";

type Props = {
  canViewAllFacilities: boolean;
  scopedFacilityId: string;
};

export function useShiftSlots({
  canViewAllFacilities,
  scopedFacilityId,
}: Props) {
  const [
    slots,
    setSlots,
  ] = useState<
    ShiftSlot[]
  >([]);

  const [
    totalSlots,
    setTotalSlots,
  ] = useState(0);

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [
    facilityFilter,
    setFacilityFilter,
  ] = useState<
    string | undefined
  >();

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    ShiftSlotStatus | undefined
  >();

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(
    SHIFT_SLOT_DEFAULT_PAGE_SIZE,
  );

  const [
    reloadKey,
    setReloadKey,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            searchInput.trim(),
          );

          setCurrentPage(
            1,
          );
        },
        350,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const timer =
      window.setTimeout(
        () => {
          if (
            !canViewAllFacilities &&
            !scopedFacilityId
          ) {
            setSlots([]);
            setTotalSlots(
              0,
            );
            setLoading(
              false,
            );
            return;
          }

          setLoading(true);

          void getShiftSlots({
            search:
              debouncedSearch ||
              undefined,
            facilityId:
              canViewAllFacilities
                ? facilityFilter
                : scopedFacilityId,
            status:
              statusFilter,
            page:
              currentPage,
            limit:
              pageSize,
          })
            .then(
              (result) => {
                if (
                  cancelled
                ) {
                  return;
                }

                setSlots(
                  result.items,
                );

                setTotalSlots(
                  result.total,
                );

                setError(
                  null,
                );
              },
            )
            .catch(
              (
                loadError,
              ) => {
                if (
                  cancelled
                ) {
                  return;
                }

                setError(
                  getShiftSlotErrorMessage(
                    loadError,
                    "Không tải được danh sách khung ca.",
                  ),
                );
              },
            )
            .finally(() => {
              if (
                !cancelled
              ) {
                setLoading(
                  false,
                );
              }
            });
        },
        0,
      );

    return () => {
      cancelled = true;
      window.clearTimeout(
        timer,
      );
    };
  }, [
    canViewAllFacilities,
    currentPage,
    debouncedSearch,
    facilityFilter,
    pageSize,
    reloadKey,
    scopedFacilityId,
    statusFilter,
  ]);

  function refreshSlots() {
    setReloadKey(
      (current) =>
        current + 1,
    );
  }

  function resetFilters() {
    setSearchInput("");
    setDebouncedSearch(
      "",
    );

    if (
      canViewAllFacilities
    ) {
      setFacilityFilter(
        undefined,
      );
    }

    setStatusFilter(
      undefined,
    );

    setCurrentPage(
      1,
    );
  }

  function replaceSlot(
    updated: ShiftSlot,
  ) {
    setSlots(
      (current) =>
        current.map(
          (slot) =>
            slot.id ===
            updated.id
              ? updated
              : slot,
        ),
    );
  }

  function handleDeleted() {
    if (
      slots.length === 1 &&
      currentPage > 1
    ) {
      setCurrentPage(
        (current) =>
          Math.max(
            1,
            current - 1,
          ),
      );
      return;
    }

    refreshSlots();
  }

  function changePage(
    page: number,
    nextPageSize: number,
  ) {
    setCurrentPage(
      nextPageSize !==
        pageSize
        ? 1
        : page,
    );

    setPageSize(
      nextPageSize,
    );
  }

  return {
    slots,
    totalSlots,
    searchInput,
    setSearchInput,
    facilityFilter,
    setFacilityFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    loading,
    error,
    setError,
    refreshSlots,
    resetFilters,
    replaceSlot,
    handleDeleted,
    changePage,
  };
}
