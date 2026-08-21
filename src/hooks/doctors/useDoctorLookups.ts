"use client";

import { useEffect, useMemo, useState } from "react";
import { getFacility, getFacilities } from "@/management/features/facilities/facilities.api";
import { getRoomTypeLookup } from "@/management/features/rooms/rooms.api";
import type { RoomType } from "@/management/features/rooms/rooms.types";
import { getStaffsPage } from "@/management/features/staffs/staffs.api";
import type { Staff } from "@/management/features/staffs/staffs.types";
import { getDoctorSpecialties } from "@/management/features/doctors/doctors.api";
import { readStaffFacilityIds } from "@/management/features/doctors/doctors.utils";

const DEFAULT_DOCTOR_SPECIALTIES = [
  "Sản phụ khoa",
  "Siêu âm sản khoa",
  "Xét nghiệm sản khoa",
  "Sàng lọc trước sinh",
  "Theo dõi thai kỳ",
  "Chăm sóc sau sinh",
  "Thủ thuật sản khoa",
];

export function useDoctorSpecialties() {
  const [specialties, setSpecialties] =
    useState<string[]>([]);
  const [
    specialtiesLoading,
    setSpecialtiesLoading,
  ] = useState(true);
  const [
    specialtiesError,
    setSpecialtiesError,
  ] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getDoctorSpecialties()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setSpecialties(data);
        setSpecialtiesError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setSpecialties([]);

        setSpecialtiesError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách chuyên khoa.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setSpecialtiesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const specialtyOptions = useMemo(
    () =>
      Array.from(new Set([...specialties, ...DEFAULT_DOCTOR_SPECIALTIES])).map(
        (specialty) => ({
          value: specialty,
          label: specialty,
        }),
      ),
    [specialties],
  );

  return {
    specialties,
    specialtyOptions,
    specialtiesLoading,
    specialtiesError,
  };
}

export function useDoctorDisplayLookups({
  canViewAllFacilities,
  scopedFacilityId,
}: {
  canViewAllFacilities: boolean;
  scopedFacilityId: string;
}) {
  const [facilityNameById, setFacilityNameById] = useState<Record<string, string>>({});
  const [roomTypeNameById, setRoomTypeNameById] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    if (!canViewAllFacilities && !scopedFacilityId) return;

    async function load() {
      const facilityRequest = canViewAllFacilities
        ? getFacilities({ page: 1, limit: 100 })
        : getFacility(scopedFacilityId).then((facility) => [facility]);

      const [facilityResult, roomTypeResult] = await Promise.allSettled([
        facilityRequest,
        getRoomTypeLookup({ status: "active", limit: 50 }),
      ]);

      if (cancelled) return;

      if (facilityResult.status === "fulfilled") {
        setFacilityNameById(
          Object.fromEntries(
            facilityResult.value.map((facility) => [facility.id, facility.name]),
          ),
        );
      }

      if (roomTypeResult.status === "fulfilled") {
        setRoomTypeNameById(
          Object.fromEntries(
            roomTypeResult.value.map((roomType) => [roomType.id, roomType.name]),
          ),
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [canViewAllFacilities, scopedFacilityId]);

  const facilityOptions = useMemo(
    () =>
      Object.entries(facilityNameById).map(
        ([value, label]) => ({
          value,
          label,
        }),
      ),
    [facilityNameById],
  );

  return {
    facilityNameById,
    facilityOptions,
    roomTypeNameById,
  };
}

export function useDoctorFormLookups({
  open,
  isEditing,
  allowedFacilityId,
  onError,
}: {
  open: boolean;
  isEditing: boolean;
  allowedFacilityId: string;
  onError: (message: string) => void;
}) {
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(true);

  useEffect(() => {
    if (!open || isEditing) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setStaffLoading(true);

      void getStaffsPage({
        status: "active",
        limit: 50,
      })
        .then((data) => {
          if (cancelled) {
            return;
          }

          setStaffOptions(
            data.users.filter(
              (user) =>
                !user.staffProfile?.doctor &&
                readStaffFacilityIds(user).includes(allowedFacilityId),
            ),
          );
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          setStaffOptions([]);
          onError(
            error instanceof Error
              ? error.message
              : "Không tải được danh sách tài khoản staff.",
          );
        })
        .finally(() => {
          if (!cancelled) {
            setStaffLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [allowedFacilityId, isEditing, onError, open]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setRoomTypesLoading(true);

      void getRoomTypeLookup({
        status: "active",
        limit: 50,
      })
        .then((data) => {
          if (!cancelled) {
            setRoomTypes(data);
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          setRoomTypes([]);
          onError(
            error instanceof Error
              ? error.message
              : "Không tải được danh sách loại phòng.",
          );
        })
        .finally(() => {
          if (!cancelled) {
            setRoomTypesLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [onError]);

  const staffSelectOptions = useMemo(
    () =>
      staffOptions.map((user) => {
        const profile = user.staffProfile;
        const value = String(profile?.staffId ?? user.id);
        const employeeCode = profile?.employeeCode;
        const personalEmail = profile?.personalEmail ?? user.email;

        return {
          value,
          label: `${employeeCode ? `${employeeCode} - ` : ""}${user.name} (${personalEmail})`,
        };
      }),
    [staffOptions],
  );

  return {
    staffOptions,
    staffLoading,
    staffSelectOptions,
    roomTypes,
    roomTypesLoading,
  };
}
