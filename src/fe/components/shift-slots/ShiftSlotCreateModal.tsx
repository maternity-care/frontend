"use client";

import {
  createShiftSlot,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlot,
  ShiftSlotFacilityOption,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  ShiftSlotForm,
} from "./ShiftSlotForm";

type Props = {
  open: boolean;
  facilities: ShiftSlotFacilityOption[];
  onClose: () => void;
  onCreated: (
    slot: ShiftSlot,
  ) => void;
};

export function ShiftSlotCreateModal({
  open,
  facilities,
  onClose,
  onCreated,
}: Props) {
  return (
    <ShiftSlotForm
      mode="create"
      open={open}
      facilities={
        facilities
      }
      onClose={
        onClose
      }
      onSubmitValidated={async (
        input,
      ) => {
        const response =
          await createShiftSlot(
            input,
          );

        onCreated(
          response.data,
        );

        return (
          response.message ||
          "Tạo khung ca thành công."
        );
      }}
    />
  );
}
