"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import { getRooms } from "@/management/features/rooms/rooms.api";
import type { ClinicRoom } from "@/management/features/rooms/rooms.types";
import { getAllDoctors } from "@/management/features/doctors/doctors.api";
import { getDoctorShiftsInRange } from "@/management/features/doctor-shifts/doctor-shifts.api";
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import {
  getDoctorShiftWeekRange,
  mergeDoctorShiftItems,
  removeDoctorShiftsInRange,
} from "@/management/features/doctor-shifts/doctor-shifts.progressive";
import {
  DOCTOR_SHIFT_TODAY,
  getDoctorShiftErrorMessage,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";
import type { DoctorShiftAccess } from "./useDoctorShiftAccess";

type AccessInput = Pick<
  DoctorShiftAccess,
  | "canViewAllFacilities"
  | "facilityId"
  | "isDoctorViewer"
  | "doctorId"
  | "staffId"
  | "managedFacilityId"
  | "isOwnShift"
>;

type LoadRangeOptions = {
  force?: boolean;

  onFirstPageLoaded?: () => void;
};

type LoadedDateRange = {
  dateFrom: string;
  dateTo: string;
};

export function useDoctorShiftResources(access: AccessInput) {
  const {
    canViewAllFacilities,
    facilityId,
    isDoctorViewer,
    doctorId,
    staffId,
    managedFacilityId,
    isOwnShift,
  } = access;

  const [shifts, setShifts] = useState<DoctorShiftItem[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [initialReady, setInitialReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadedRangesRef =
    useRef<LoadedDateRange[]>(
      [],
    );

  const inFlightRangesRef =
    useRef<
      Map<string, Promise<void>>
    >(new Map());

  const foregroundRequestCountRef = useRef(0);

  const scopeKey = [
    canViewAllFacilities ? "all" : facilityId,
    isDoctorViewer ? "doctor" : "management",
    doctorId,
    staffId,
  ].join("|");

  const scopeKeyRef = useRef(scopeKey);

  useEffect(() => {
    scopeKeyRef.current = scopeKey;
  }, [scopeKey]);

  const filterShiftDataForViewer = useCallback(
    (items: DoctorShiftItem[]) => {
      if (!isDoctorViewer) return items;

      return items.filter(
        (shift) =>
          String(shift.facilityId) === facilityId && isOwnShift(shift),
      );
    },
    [facilityId, isDoctorViewer, isOwnShift],
  );

  const appendDoctorViewerLookups = useCallback(
    (items: DoctorShiftItem[]) => {
      if (!isDoctorViewer || items.length === 0) return;

      setFacilities((current) => {
        const map = new Map(current.map((item) => [item.id, item]));

        items.forEach((shift) => {
          if (!shift.facilityId) return;

          map.set(shift.facilityId, {
            id: shift.facilityId,
            name: shift.facilityName || `Cơ sở #${shift.facilityId}`,
            code: shift.facilityCode || "",
            address: "",
          });
        });

        return Array.from(map.values());
      });

      setRooms((current) => {
        const map = new Map(current.map((item) => [item.id, item]));

        items.forEach((shift) => {
          if (!shift.roomId) return;

          map.set(shift.roomId, {
            id: shift.roomId,
            facilityId: shift.facilityId,
            name: shift.roomName || `Phòng #${shift.roomId}`,
            floor: "",
          });
        });

        return Array.from(map.values());
      });

      setDoctors((current) => {
        const map = new Map(current.map((item) => [item.id, item]));

        items.forEach((shift) => {
          if (!shift.doctorId) return;

          map.set(shift.doctorId, {
            id: shift.doctorId,
            staffId: shift.staffId,
            roleId: shift.roleId,
            name:
              shift.doctorName ||
              shift.staffName ||
              `Bác sĩ #${shift.doctorId}`,
            title: shift.doctorTitle || "Bác sĩ",
            specialty: shift.doctorSpecialty || "Chưa cập nhật",
            status: "active",
            facilityIds: [shift.facilityId].filter(Boolean),
          });
        });

        return Array.from(map.values());
      });
    },
    [isDoctorViewer],
  );

  const isRangeCovered =
    useCallback(
      (
        dateFrom: string,
        dateTo: string,
      ) =>
        loadedRangesRef.current.some(
          (range) =>
            range.dateFrom <=
              dateFrom &&
            range.dateTo >=
              dateTo,
        ),
      [],
    );

  const markRangeLoaded =
    useCallback(
      (
        dateFrom: string,
        dateTo: string,
      ) => {
        loadedRangesRef.current = [
          ...loadedRangesRef.current.filter(
            (range) =>
              !(
                range.dateFrom >=
                  dateFrom &&
                range.dateTo <=
                  dateTo
              ),
          ),
          {
            dateFrom,
            dateTo,
          },
        ];
      },
      [],
    );

  const loadRange = useCallback(
    async (
      dateFrom: string,
      dateTo: string,
      options: LoadRangeOptions = {},
    ) => {
      const {
        force = false,
        onFirstPageLoaded,
      } = options;

      const requestKey =
        `${scopeKey}:${dateFrom}:${dateTo}`;

      const existingRequest =
        inFlightRangesRef.current.get(
          requestKey,
        );

      if (
        existingRequest &&
        !force
      ) {
        return existingRequest;
      }

      if (
        !force &&
        isRangeCovered(
          dateFrom,
          dateTo,
        )
      ) {
        return;
      }

      if (force) {

        loadedRangesRef.current =
          loadedRangesRef.current.filter(
            (range) =>
              range.dateTo <
                dateFrom ||
              range.dateFrom >
                dateTo,
          );

        setShifts(
          (current) =>
            removeDoctorShiftsInRange(
              current,
              dateFrom,
              dateTo,
            ),
        );
      }

      const requestScope =
        scopeKey;

      const requestPromise:
        Promise<void> =
        (async () => {
          const result =
            await getDoctorShiftsInRange({
              ...(!canViewAllFacilities
                ? {
                    facilityId,
                  }
                : {}),
              ...(isDoctorViewer &&
              doctorId
                ? {
                    doctorId,
                  }
                : {}),
              dateFrom,
              dateTo,
            });

          if (
            scopeKeyRef.current !==
            requestScope
          ) {
            return;
          }

          const safeItems =
            filterShiftDataForViewer(
              result.items,
            );

          if (
            safeItems.length > 0
          ) {
            setShifts(
              (current) =>
                mergeDoctorShiftItems(
                  current,
                  safeItems,
                ),
            );

            appendDoctorViewerLookups(
              safeItems,
            );
          }

          onFirstPageLoaded?.();

          markRangeLoaded(
            dateFrom,
            dateTo,
          );
        })().finally(() => {
          const currentRequest =
            inFlightRangesRef.current.get(
              requestKey,
            );

          if (
            currentRequest ===
            requestPromise
          ) {
            inFlightRangesRef.current.delete(
              requestKey,
            );
          }
        });

      inFlightRangesRef.current.set(
        requestKey,
        requestPromise,
      );

      return requestPromise;
    },
    [
      appendDoctorViewerLookups,
      canViewAllFacilities,
      doctorId,
      facilityId,
      filterShiftDataForViewer,
      isDoctorViewer,
      isRangeCovered,
      markRangeLoaded,
      scopeKey,
    ],
  );

  const ensureRangeLoaded =
    useCallback(
      async (
        dateFrom: string,
        dateTo: string,
      ) => {
        if (
          isRangeCovered(
            dateFrom,
            dateTo,
          )
        ) {
          return;
        }

        foregroundRequestCountRef.current +=
          1;

        setPeriodLoading(
          true,
        );

        try {
          await loadRange(
            dateFrom,
            dateTo,
          );
        } catch (
          loadError
        ) {
          setError(
            getDoctorShiftErrorMessage(
              loadError,
            ),
          );
        } finally {
          foregroundRequestCountRef.current =
            Math.max(
              0,
              foregroundRequestCountRef.current -
                1,
            );

          if (
            foregroundRequestCountRef.current ===
            0
          ) {
            setPeriodLoading(
              false,
            );
          }
        }
      },
      [
        isRangeCovered,
        loadRange,
      ],
    );

  const reloadRange =
    useCallback(
      async (
        dateFrom: string,
        dateTo: string,
      ) => {
        setPeriodLoading(
          true,
        );

        setError(
          null,
        );

        try {
          await loadRange(
            dateFrom,
            dateTo,
            {
              force: true,
            },
          );
        } catch (
          loadError
        ) {
          setError(
            getDoctorShiftErrorMessage(
              loadError,
            ),
          );

          throw loadError;
        } finally {
          setPeriodLoading(
            false,
          );
        }
      },
      [
        loadRange,
      ],
    );

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      loadedRangesRef.current =
        [];

      inFlightRangesRef.current =
        new Map();

      foregroundRequestCountRef.current =
        0;

      setShifts([]);
      setFacilities([]);
      setRooms([]);
      setDoctors([]);
      setError(null);
      setInitialReady(false);
      setPeriodLoading(false);

      if (!canViewAllFacilities && !facilityId) {
        setLoading(false);
        return;
      }

      if (isDoctorViewer && !doctorId && !staffId) {
        setError("Không xác định được hồ sơ bác sĩ của tài khoản hiện tại.");
        setLoading(false);
        return;
      }

      setLoading(true);

      const currentWeek =
        getDoctorShiftWeekRange(
          DOCTOR_SHIFT_TODAY,
        );

      let firstPageWasRendered =
        false;

      void loadRange(
        currentWeek.dateFrom,
        currentWeek.dateTo,
        {
          force: true,
          onFirstPageLoaded:
            () => {
              if (
                cancelled
              ) {
                return;
              }

              firstPageWasRendered =
                true;

              setLoading(
                false,
              );

              setInitialReady(
                true,
              );
            },
        },
      )
        .then(() => {
          if (
            cancelled
          ) {
            return;
          }

          if (
            !firstPageWasRendered
          ) {
            setLoading(
              false,
            );

            setInitialReady(
              true,
            );
          }
        })
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
              getDoctorShiftErrorMessage(
                loadError,
              ),
            );

            setLoading(
              false,
            );
          },
        );
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    canViewAllFacilities,
    doctorId,
    facilityId,
    isDoctorViewer,
    loadRange,
    scopeKey,
    staffId,
  ]);

  useEffect(() => {
    if (isDoctorViewer) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!canViewAllFacilities && !facilityId) return;

      setLookupLoading(true);

      void Promise.all([
        getFacilities(),
        getRooms({
          status: "active",
          ...(!canViewAllFacilities ? { facilityId } : {}),
        }),
        getAllDoctors({
          status: "active",
          sortYearsOfExperience: "desc",
          ...(!canViewAllFacilities ? { facilityId } : {}),
        }),
      ])
        .then(([facilityData, roomResult, doctorData]) => {
          if (cancelled) return;

          setFacilities(
            facilityData
              .filter(
                (facility) =>
                  facility.status === "active" &&
                  (canViewAllFacilities ||
                    String(facility.id) === facilityId),
              )
              .map((facility) => ({
                id: facility.id,
                name: facility.name,
                code: facility.code,
                address: facility.address,
              })),
          );

          setRooms(
            roomResult.items
              .filter(
                (room: ClinicRoom) =>
                  room.status === "active" &&
                  (canViewAllFacilities ||
                    String(room.facilityId) === facilityId),
              )
              .map((room: ClinicRoom) => ({
                id: room.id,
                facilityId: room.facilityId,
                name: room.roomName,
                floor: room.floor,
              })),
          );

          setDoctors(
            doctorData
              .filter(
                (doctor) =>
                  canViewAllFacilities ||
                  (doctor.facilityIds.length > 0
                    ? doctor.facilityIds.some(
                        (assignedFacilityId) =>
                          String(assignedFacilityId) === facilityId,
                      )
                    : String(doctor.facilityId ?? "") === facilityId),
              )
              .map((doctor) => ({
                id: doctor.id,
                staffId: doctor.staffId,
                roleId: doctor.roleId,
                name: doctor.name || `Bác sĩ #${doctor.id}`,
                title: doctor.title || "Bác sĩ",
                specialty: doctor.specialty || "Chưa cập nhật",
                status:
                  doctor.status === "active" && doctor.staffStatus === "active"
                    ? "active"
                    : "inactive",
                facilityIds:
                  doctor.facilityIds.length > 0
                    ? doctor.facilityIds
                    : doctor.facilityId
                      ? [doctor.facilityId]
                      : [],
              })),
          );
        })
        .catch((loadError) => {
          if (!cancelled) setError(getDoctorShiftErrorMessage(loadError));
        })
        .finally(() => {
          if (!cancelled) setLookupLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canViewAllFacilities, facilityId, isDoctorViewer, scopeKey]);

  const visibleFacilities = useMemo(
    () =>
      canViewAllFacilities
        ? facilities
        : facilities.filter(
            (facility) => String(facility.id) === facilityId,
          ),
    [canViewAllFacilities, facilityId, facilities],
  );

  const visibleRooms = useMemo(
    () =>
      canViewAllFacilities
        ? rooms
        : rooms.filter((room) => String(room.facilityId) === facilityId),
    [canViewAllFacilities, facilityId, rooms],
  );

  const visibleDoctors = useMemo(() => {
    if (isDoctorViewer) {
      return doctors.filter(
        (doctor) =>
          (doctorId && String(doctor.id) === doctorId) ||
          (staffId && String(doctor.staffId) === staffId),
      );
    }

    return canViewAllFacilities
      ? doctors
      : doctors.filter((doctor) =>
          doctor.facilityIds.some(
            (assignedFacilityId) =>
              String(assignedFacilityId) === facilityId,
          ),
        );
  }, [
    canViewAllFacilities,
    doctorId,
    facilityId,
    isDoctorViewer,
    staffId,
    doctors,
  ]);

  const visibleShifts = useMemo(() => {
    if (isDoctorViewer) {
      return shifts.filter(
        (shift) =>
          String(shift.facilityId) === facilityId && isOwnShift(shift),
      );
    }

    return canViewAllFacilities
      ? shifts
      : shifts.filter((shift) => String(shift.facilityId) === facilityId);
  }, [
    canViewAllFacilities,
    facilityId,
    isDoctorViewer,
    isOwnShift,
    shifts,
  ]);

  const managedFacilities = useMemo(
    () =>
      facilities.filter(
        (facility) => String(facility.id) === managedFacilityId,
      ),
    [managedFacilityId, facilities],
  );

  const managedRooms = useMemo(
    () =>
      rooms.filter((room) => String(room.facilityId) === managedFacilityId),
    [managedFacilityId, rooms],
  );

  const managedDoctors = useMemo(
    () =>
      doctors.filter(
        (doctor) =>
          doctor.status === "active" &&
          doctor.facilityIds.some(
            (assignedFacilityId) =>
              String(assignedFacilityId) === managedFacilityId,
          ),
      ),
    [managedFacilityId, doctors],
  );

  const doctorById = useMemo(
    () => new Map(doctors.map((doctor) => [doctor.id, doctor])),
    [doctors],
  );

  const facilityById = useMemo(
    () => new Map(facilities.map((facility) => [facility.id, facility])),
    [facilities],
  );

  const roomById = useMemo(
    () => new Map(rooms.map((room) => [room.id, room])),
    [rooms],
  );

  return {
    shifts,
    setShifts,
    facilities,
    rooms,
    doctors,
    loading,
    periodLoading,
    lookupLoading,
    initialReady,
    error,
    setError,
    visibleFacilities,
    visibleRooms,
    visibleDoctors,
    visibleShifts,
    managedFacilities,
    managedRooms,
    managedDoctors,
    doctorById,
    facilityById,
    roomById,
    ensureRangeLoaded,
    reloadRange,
  };
}
