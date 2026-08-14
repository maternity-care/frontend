"use client";

import { useEffect, useMemo, useState } from "react";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import { getRooms } from "@/management/features/rooms/rooms.api";
import type { ClinicRoom } from "@/management/features/rooms/rooms.types";
import { getDoctors } from "@/management/features/doctors/doctors.api";
import { getAllDoctorShifts } from "@/management/features/doctor-shifts/doctor-shifts.api";
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import { getDoctorShiftErrorMessage } from "@/management/features/doctor-shifts/doctor-shifts.utils";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!canViewAllFacilities && !facilityId) {
      const timer = window.setTimeout(() => {
        setShifts([]);
        setFacilities([]);
        setRooms([]);
        setDoctors([]);
        setLoading(false);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    if (isDoctorViewer && !doctorId && !staffId) {
      const timer = window.setTimeout(() => {
        setShifts([]);
        setFacilities([]);
        setRooms([]);
        setDoctors([]);
        setError("Không xác định được hồ sơ bác sĩ của tài khoản hiện tại.");
        setLoading(false);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    void Promise.resolve()
      .then(async () => {
        if (!cancelled) setLoading(true);

        const shiftData = await getAllDoctorShifts({
          ...(canViewAllFacilities
            ? {}
            : { facilityId: facilityId }),
          ...(isDoctorViewer && doctorId
            ? { doctorId: doctorId }
            : {}),
        });

        const safeShiftData = isDoctorViewer
          ? shiftData.filter(
              (shift) =>
                String(shift.facilityId) === facilityId &&
                ((doctorId &&
                  String(shift.doctorId) === doctorId) ||
                  (staffId &&
                    String(shift.staffId) === staffId)),
            )
          : shiftData;

        if (isDoctorViewer) {
          return {
            shiftData: safeShiftData,
            facilityData: [],
            roomItems: [] as ClinicRoom[],
            doctorItems: [],
          };
        }

        const [facilityData, roomResult, doctorData] = await Promise.all([
          getFacilities(),
          getRooms({
            status: "active",
            page: 1,
            limit: 40,
            ...(!canViewAllFacilities
              ? { facilityId: facilityId }
              : {}),
          }),
          getDoctors({
            page: 1,
            limit: 40,
            status: "active",
            sortYearsOfExperience: "desc",
            ...(!canViewAllFacilities
              ? { facilityId: facilityId }
              : {}),
          }),
        ]);

        return {
          shiftData: safeShiftData,
          facilityData,
          roomItems: roomResult.items,
          doctorItems: doctorData.items,
        };
      })
      .then((result) => {
        if (cancelled || !result) return;

        const { shiftData, facilityData, roomItems, doctorItems } = result;
        setShifts(shiftData);

        if (isDoctorViewer) {
          const facilityMap = new Map<string, FacilityOption>();
          const roomMap = new Map<string, RoomOption>();
          const doctorMap = new Map<string, DoctorOption>();

          shiftData.forEach((shift) => {
            if (shift.facilityId && !facilityMap.has(shift.facilityId)) {
              facilityMap.set(shift.facilityId, {
                id: shift.facilityId,
                name: shift.facilityName || `Cơ sở #${shift.facilityId}`,
                code: shift.facilityCode || "",
                address: "",
              });
            }

            if (shift.roomId && !roomMap.has(shift.roomId)) {
              roomMap.set(shift.roomId, {
                id: shift.roomId,
                facilityId: shift.facilityId,
                name: shift.roomName || `Phòng #${shift.roomId}`,
                floor: "",
              });
            }

            if (shift.doctorId && !doctorMap.has(shift.doctorId)) {
              doctorMap.set(shift.doctorId, {
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
            }
          });

          setFacilities(Array.from(facilityMap.values()));
          setRooms(Array.from(roomMap.values()));
          setDoctors(Array.from(doctorMap.values()));
          setError(null);
          return;
        }

        const doctorInfoById = new Map<
          string,
          { name: string; title: string; specialty: string }
        >();
        shiftData.forEach((shift) => {
          if (!doctorInfoById.has(shift.doctorId)) {
            doctorInfoById.set(shift.doctorId, {
              name: shift.doctorName || `Bác sĩ #${shift.doctorId}`,
              title: shift.doctorTitle || "Bác sĩ",
              specialty: shift.doctorSpecialty || "Chưa cập nhật",
            });
          }
        });

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
          roomItems
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
          doctorItems
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
            .map((doctor) => {
              const fallback = doctorInfoById.get(doctor.id);
              return {
                id: doctor.id,
                staffId: doctor.staffId,
                roleId: doctor.roleId,
                name: doctor.name || fallback?.name || `Bác sĩ #${doctor.id}`,
                title: doctor.title || fallback?.title || "Bác sĩ",
                specialty:
                  doctor.specialty || fallback?.specialty || "Chưa cập nhật",
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
              };
            }),
        );

        setError(null);
      })
      .catch((loadError) => {
        if (!cancelled) setError(getDoctorShiftErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    canViewAllFacilities,
    doctorId,
    facilityId,
    isDoctorViewer,
    staffId,
  ]);

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
        : rooms.filter(
            (room) => String(room.facilityId) === facilityId,
          ),
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
          String(shift.facilityId) === facilityId &&
          isOwnShift(shift),
      );
    }

    return canViewAllFacilities
      ? shifts
      : shifts.filter(
          (shift) => String(shift.facilityId) === facilityId,
        );
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
      rooms.filter(
        (room) => String(room.facilityId) === managedFacilityId,
      ),
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

  async function reloadManagedShifts() {
    if (!managedFacilityId) return;
    setLoading(true);
    setError(null);
    try {
      setShifts(
        await getAllDoctorShifts({ facilityId: managedFacilityId }),
      );
    } catch (loadError) {
      setError(getDoctorShiftErrorMessage(loadError));
      throw loadError;
    } finally {
      setLoading(false);
    }
  }

  return {
    shifts,
    setShifts,
    facilities,
    rooms,
    doctors,
    loading,
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
    reloadManagedShifts,
  };
}
