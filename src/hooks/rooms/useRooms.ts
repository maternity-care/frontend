"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getRooms,
} from "@/management/features/rooms/rooms.api";
import {
  ROOM_DEFAULT_PAGE_SIZE,
} from "@/management/features/rooms/rooms.constants";
import type {
  ClinicRoom,
  RoomStatus,
} from "@/management/features/rooms/rooms.types";
import {
  getRoomErrorMessage,
  isEmptyRoomResult,
} from "@/management/features/rooms/rooms.utils";

type Props = {
  canViewAllFacilities: boolean;
  scopedFacilityId: string;
  initialFacilityFilter?: string;
};

export function useRooms({
  canViewAllFacilities,
  scopedFacilityId,
  initialFacilityFilter,
}: Props) {
  const [rooms, setRooms] =
    useState<ClinicRoom[]>([]);
  const [
    totalRooms,
    setTotalRooms,
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
  >(
    canViewAllFacilities
      ? initialFacilityFilter
      : undefined,
  );
  const [
    floorFilter,
    setFloorFilter,
  ] = useState<
    string | undefined
  >();
  const [
    roomTypeIdFilter,
    setRoomTypeIdFilter,
  ] = useState<
    string | undefined
  >();
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    RoomStatus | undefined
  >();

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);
  const [
    pageSize,
    setPageSize,
  ] = useState(
    ROOM_DEFAULT_PAGE_SIZE,
  );
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(
      null,
    );
  const [
    reloadKey,
    setReloadKey,
  ] = useState(0);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            searchInput.trim(),
          );
          setCurrentPage(1);
        },
        350,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [searchInput]);

  useEffect(() => {
    if (
      !canViewAllFacilities
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setFacilityFilter(
            initialFacilityFilter,
          );
          setCurrentPage(1);
        },
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    canViewAllFacilities,
    initialFacilityFilter,
  ]);

  useEffect(() => {
    let cancelled = false;

    const timer =
      window.setTimeout(
        () => {
          if (
            !canViewAllFacilities &&
            !scopedFacilityId
          ) {
            setRooms([]);
            setTotalRooms(0);
            setLoading(false);
            return;
          }

          setLoading(true);

          void getRooms({
            search:
              debouncedSearch ||
              undefined,
            floor:
              floorFilter,
            roomTypeId:
              roomTypeIdFilter,
            status:
              statusFilter,
            page:
              currentPage,
            limit:
              pageSize,
            facilityId:
              canViewAllFacilities
                ? facilityFilter
                : scopedFacilityId,
          })
            .then((result) => {
              if (
                cancelled
              ) {
                return;
              }

              setRooms(
                result.items,
              );
              setTotalRooms(
                result.total,
              );
              setError(null);
            })
            .catch(
              (loadError) => {
                if (
                  cancelled
                ) {
                  return;
                }

                setRooms([]);
                setTotalRooms(0);

                if (
                  isEmptyRoomResult(
                    loadError,
                  )
                ) {
                  setError(null);
                  return;
                }

                setError(
                  getRoomErrorMessage(
                    loadError,
                    "Không tải được danh sách phòng.",
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
    floorFilter,
    pageSize,
    reloadKey,
    roomTypeIdFilter,
    scopedFacilityId,
    statusFilter,
  ]);

  const tableRooms =
    useMemo(() => {
      if (
        rooms.length <=
        pageSize
      ) {
        return rooms;
      }

      const backendReturnedFullList =
        totalRooms > 0 &&
        rooms.length >=
          totalRooms;

      if (
        backendReturnedFullList
      ) {
        const offset =
          (currentPage - 1) *
          pageSize;

        return rooms.slice(
          offset,
          offset +
            pageSize,
        );
      }

      return rooms.slice(
        0,
        pageSize,
      );
    }, [
      currentPage,
      pageSize,
      rooms,
      totalRooms,
    ]);

  const roomById =
    useMemo(
      () =>
        new Map(
          tableRooms.map(
            (room) => [
              room.id,
              room,
            ],
          ),
        ),
      [tableRooms],
    );

  function refreshRooms() {
    setReloadKey(
      (current) =>
        current + 1,
    );
  }

  function resetFilters() {
    setSearchInput("");
    setDebouncedSearch("");

    if (
      canViewAllFacilities
    ) {
      setFacilityFilter(
        undefined,
      );
    }

    setFloorFilter(
      undefined,
    );
    setRoomTypeIdFilter(
      undefined,
    );
    setStatusFilter(
      undefined,
    );
    setCurrentPage(1);
  }

  function replaceRoom(
    updated: ClinicRoom,
  ) {
    setRooms(
      (current) =>
        current.map((room) =>
          room.id ===
          updated.id
            ? updated
            : room,
        ),
    );
  }

  function handleDeleted(
    deletedId: string,
  ) {
    if (
      tableRooms.length <=
        1 &&
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

    refreshRooms();
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
    rooms,
    tableRooms,
    roomById,
    totalRooms,
    searchInput,
    setSearchInput,
    facilityFilter,
    setFacilityFilter,
    floorFilter,
    setFloorFilter,
    roomTypeIdFilter,
    setRoomTypeIdFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    loading,
    error,
    setError,
    refreshRooms,
    resetFilters,
    replaceRoom,
    handleDeleted,
    changePage,
  };
}
