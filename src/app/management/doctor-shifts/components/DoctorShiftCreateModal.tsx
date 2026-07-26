"use client";

import {
  createDoctorShift,
  getDoctorShift,
} from "@/management/features/doctor-shifts/doctor-shifts.api";
import type {
  DoctorShiftItem,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import {
  DoctorShiftFormModalBase,
  mergeShiftDisplayData,
} from "./doctor-shift-modal.shared";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
  ValidatedShiftForm,
} from "./doctor-shift-modal.shared";

type DoctorShiftCreateModalProps = {
  open: boolean;
  shifts: DoctorShiftItem[];
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  onClose: () => void;
  onCreated: (
    createdShifts: DoctorShiftItem[],
  ) => void;
};

export function DoctorShiftCreateModal({
  open,
  shifts,
  facilities,
  rooms,
  doctors,
  onClose,
  onCreated,
}: DoctorShiftCreateModalProps) {
  async function handleCreate({
    payloads,
    slotById,
  }: ValidatedShiftForm) {
    const responses = await Promise.all(
      payloads.map((payload) =>
        createDoctorShift(payload),
      ),
    );

    const createdShifts = await Promise.all(
      responses.map(async (response, index) => {
        const payload = payloads[index];

        try {
          const detail = await getDoctorShift(
            response.data.id,
          );

          return mergeShiftDisplayData({
            response: response.data,
            detail,
            payload,
            doctors,
            facilities,
            rooms,
            slotById,
          });
        } catch {
          return mergeShiftDisplayData({
            response: response.data,
            payload,
            doctors,
            facilities,
            rooms,
            slotById,
          });
        }
      }),
    );

    onCreated(createdShifts);

    return createdShifts.length > 1
      ? `Tạo thành công ${createdShifts.length} ca trực.`
      : "Tạo ca trực thành công.";
  }

  return (
    <DoctorShiftFormModalBase
      mode="create"
      open={open}
      shifts={shifts}
      facilities={facilities}
      rooms={rooms}
      doctors={doctors}
      onClose={onClose}
      onSubmitValidated={handleCreate}
    />
  );
}