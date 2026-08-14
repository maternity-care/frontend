"use client";

import {
  updateShiftSlot,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlot,
  ShiftSlotFacilityOption,
  UpdateShiftSlotInput,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  ShiftSlotForm,
} from "./ShiftSlotForm";

type Props = {
  open: boolean;
  slot:
    | ShiftSlot
    | null;
  facilities: ShiftSlotFacilityOption[];
  onClose: () => void;
  onUpdated: (
    slot: ShiftSlot,
  ) => void;
};

export function ShiftSlotEditModal({
  open,
  slot,
  facilities,
  onClose,
  onUpdated,
}: Props) {
  if (!slot) {
    return null;
  }

  return (
    <ShiftSlotForm
      mode="edit"
      open={open}
      editingSlot={
        slot
      }
      facilities={
        facilities
      }
      onClose={
        onClose
      }
      onSubmitValidated={async (
        input,
      ) => {
        const updateInput:
          UpdateShiftSlotInput = {
          facilityId:
            input.facilityId,
          name:
            input.name,
          startTime:
            input.startTime,
          endTime:
            input.endTime,
          isOvernight:
            input.isOvernight,
          applicableDays:
            input.applicableDays,
          status:
            input.status,
        };

        const response =
          await updateShiftSlot(
            slot.id,
            updateInput,
          );

        onUpdated(
          response.data,
        );

        return (
          response.message ||
          "Cập nhật khung ca thành công."
        );
      }}
    />
  );
}
