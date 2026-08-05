"use client";

import {
  createShiftSlot,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlot,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  ShiftSlotFormModalBase,
} from "./shift-slot-modal.shared";
import type {
  FacilityOption,
} from "./shift-slot-modal.shared";

type ShiftSlotCreateModalProps = {
  open: boolean;
  facilities: FacilityOption[];
  onClose: () => void;
  onCreated: (slot: ShiftSlot) => void;
};

export function ShiftSlotCreateModal({
  open,
  facilities,
  onClose,
  onCreated,
}: ShiftSlotCreateModalProps) {
  return (
    <ShiftSlotFormModalBase
      mode="create"
      open={open}
      facilities={facilities}
      onClose={onClose}
      onSubmitValidated={async (input) => {
        const response =
          await createShiftSlot(input);

        onCreated(response.data);

        return (
          response.message ||
          "Tạo khung ca thành công."
        );
      }}
    />
  );
}