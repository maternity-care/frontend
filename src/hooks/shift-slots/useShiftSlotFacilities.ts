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
import type {
  ShiftSlotFacilityOption,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  getShiftSlotErrorMessage,
} from "@/management/features/shift-slots/shift-slots.utils";

type Props = {
  canViewAllFacilities: boolean;
  canManageSlots: boolean;
  scopedFacilityId: string;
};

export function useShiftSlotFacilities({
  canViewAllFacilities,
  canManageSlots,
  scopedFacilityId,
}: Props) {
  const [
    facilities,
    setFacilities,
  ] = useState<
    ShiftSlotFacilityOption[]
  >([]);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    const timer =
      window.setTimeout(
        () => {
          if (
            !canViewAllFacilities &&
            !scopedFacilityId
          ) {
            setFacilities(
              [],
            );
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
            .then(
              (data) => {
                if (
                  cancelled
                ) {
                  return;
                }

                setFacilities(
                  data.map(
                    (
                      facility,
                    ) => ({
                      id:
                        facility.id,
                      name:
                        facility.name,
                      code:
                        facility.code,
                      address:
                        facility.address,
                    }),
                  ),
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
                    "Không tải được danh sách cơ sở.",
                  ),
                );
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

  const managedFacilities =
    useMemo(
      () =>
        canManageSlots
          ? facilities.filter(
              (
                facility,
              ) =>
                String(
                  facility.id,
                ) ===
                scopedFacilityId,
            )
          : [],
      [
        canManageSlots,
        facilities,
        scopedFacilityId,
      ],
    );

  const facilityById =
    useMemo(
      () =>
        new Map(
          facilities.map(
            (
              facility,
            ) => [
              facility.id,
              facility,
            ],
          ),
        ),
      [facilities],
    );

  return {
    facilities,
    managedFacilities,
    facilityById,
    error,
    setError,
  };
}
