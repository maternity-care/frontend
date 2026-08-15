"use client";

import { useAuthStore } from "@/features/auth/auth.store";

/**
 * Lay co so dang duoc staff chon tu phien dang nhap hien tai.
 * Hook nay phai dung chung nguon du lieu voi bo chon co so tren management header.
 */
export function useStaffFacilityId() {
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const user = useAuthStore((state) => state.user);
  const facilities = user?.facilities;

  const fallbackFacility = facilities?.find(
    (facility) => facility.status === "active",
  );
  const facilityId =
    activeFacilityId ??
    user?.facility?.id ??
    fallbackFacility?.id ??
    user?.facilityId ??
    null;

  return {
    facilityId: facilityId ? String(facilityId) : null,
    ready: user !== null,
  };
}
