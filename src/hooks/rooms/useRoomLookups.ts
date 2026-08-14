"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getFacility,
  getFacilities,
} from "@/management/features/facilities/facilities.api";
import {
  getRoomTypeLookup,
} from "@/management/features/rooms/rooms.api";
import type {
  RoomFacilityOption,
  RoomType,
} from "@/management/features/rooms/rooms.types";
import {
  getRoomErrorMessage,
} from "@/management/features/rooms/rooms.utils";

type Props = {
  canViewAllFacilities: boolean;
  canManageRooms: boolean;
  scopedFacilityId: string;
};

export function useRoomLookups({
  canViewAllFacilities,
  canManageRooms,
  scopedFacilityId,
}: Props) {
  const [
    facilities,
    setFacilities,
  ] = useState<
    RoomFacilityOption[]
  >([]);
  const [
    roomTypes,
    setRoomTypes,
  ] = useState<RoomType[]>([]);
  const [error, setError] =
    useState<string | null>(
      null,
    );
  const [
    roomTypeReloadKey,
    setRoomTypeReloadKey,
  ] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const timer =
      window.setTimeout(
        () => {
          if (
            !canViewAllFacilities &&
            !scopedFacilityId
          ) {
            setFacilities([]);
            return;
          }

          const request =
            canViewAllFacilities
              ? getFacilities()
              : getFacility(
                  scopedFacilityId,
                ).then(
                  (facility) => [
                    facility,
                  ],
                );

          void request
            .then((data) => {
              if (
                cancelled
              ) {
                return;
              }

              setFacilities(
                data.map(
                  (facility) => ({
                    id: String(
                      facility.id,
                    ),
                    name: String(
                      facility.name,
                    ),
                    code: String(
                      facility.code ??
                        "",
                    ),
                    address: String(
                      facility.address ??
                        "",
                    ),
                    status: String(
                      facility.status ??
                        "",
                    ),
                    floorCount: Math.max(
                      1,
                      Math.trunc(Number(facility.floorCount ?? 1)),
                    ),
                  }),
                ),
              );
            })
            .catch(
              (loadError) => {
                if (
                  !cancelled
                ) {
                  setError(
                    getRoomErrorMessage(
                      loadError,
                      "Không tải được danh sách cơ sở.",
                    ),
                  );
                }
              },
            );
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
    scopedFacilityId,
  ]);

  useEffect(() => {
    let cancelled = false;

    const timer =
      window.setTimeout(
        () => {
          void getRoomTypeLookup({
            limit: 100,
          })
            .then((data) => {
              if (
                !cancelled
              ) {
                setRoomTypes(
                  data,
                );
              }
            })
            .catch(
              (loadError) => {
                if (
                  !cancelled
                ) {
                  setError(
                    getRoomErrorMessage(
                      loadError,
                      "Không tải được danh sách loại phòng.",
                    ),
                  );
                }
              },
            );
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
    roomTypeReloadKey,
  ]);

  const managedFacilities =
    useMemo(
      () =>
        canManageRooms
          ? canViewAllFacilities
            ? facilities
            : facilities.filter(
                (facility) =>
                  String(
                    facility.id,
                  ) ===
                  scopedFacilityId,
              )
          : [],
      [
        canManageRooms,
        canViewAllFacilities,
        facilities,
        scopedFacilityId,
      ],
    );

  function refreshRoomTypes() {
    setRoomTypeReloadKey(
      (current) =>
        current + 1,
    );
  }

  return {
    facilities,
    roomTypes,
    managedFacilities,
    error,
    setError,
    refreshRoomTypes,
  };
}
