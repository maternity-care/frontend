"use client";

import {
  getDoctorShift,
  updateDoctorShift,
} from "@/management/features/doctor-shifts/doctor-shifts.api";
import type {
  DoctorShiftItem,
  UpdateDoctorShiftInput,
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

type DoctorShiftEditModalProps = {
  open: boolean;
  shift: DoctorShiftItem | null;
  shifts: DoctorShiftItem[];
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  onClose: () => void;
  onUpdated: (
    updatedShift: DoctorShiftItem,
  ) => void;
};

export function DoctorShiftEditModal({
  open,
  shift,
  shifts,
  facilities,
  rooms,
  doctors,
  onClose,
  onUpdated,
}: DoctorShiftEditModalProps) {
  const editingShift = shift;

  if (!editingShift) return null;

  async function handleUpdate({
    payloads,
    slotById,
  }: ValidatedShiftForm) {
    const firstPayload = payloads[0];

    const updatePayload: UpdateDoctorShiftInput = {
      doctorId: firstPayload.doctorId,
      facilityId: firstPayload.facilityId,
      roomId: firstPayload.roomId,
      slotId: firstPayload.slotId,
      shiftDate: firstPayload.shiftDate,
      maxAppointments:
        firstPayload.maxAppointments,
    };

    const response = await updateDoctorShift(
      editingShift.id,
      updatePayload,
    );

    let updatedShift: DoctorShiftItem;

    try {
      const detail = await getDoctorShift(
        response.data.id || editingShift.id,
      );

      updatedShift = mergeShiftDisplayData({
        original: editingShift,
        response: response.data,
        detail,
        payload: firstPayload,
        doctors,
        facilities,
        rooms,
        slotById,
      });
    } catch {
      updatedShift = mergeShiftDisplayData({
        original: editingShift,
        response: response.data,
        payload: firstPayload,
        doctors,
        facilities,
        rooms,
        slotById,
      });
    }

    onUpdated(updatedShift);

    return "Cập nhật ca trực thành công.";
  }

  return (
    <DoctorShiftFormModalBase
      mode="edit"
      open={open}
      editingShift={editingShift}
      shifts={shifts}
      facilities={facilities}
      rooms={rooms}
      doctors={doctors}
      onClose={onClose}
      onSubmitValidated={handleUpdate}
    />
  );
}