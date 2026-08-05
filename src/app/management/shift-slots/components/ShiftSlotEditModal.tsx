"use client";

import {
  updateShiftSlot,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlot,
  UpdateShiftSlotInput,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  ShiftSlotFormModalBase,
} from "./shift-slot-modal.shared";
import type {
  FacilityOption,
} from "./shift-slot-modal.shared";

type ShiftSlotEditModalProps = {
  open: boolean;
  slot: ShiftSlot | null;
  facilities: FacilityOption[];
  onClose: () => void;
  onUpdated: (slot: ShiftSlot) => void;
};

type ShiftSlotEditModalContentProps = Omit<
  ShiftSlotEditModalProps,
  "slot"
> & {
  slot: ShiftSlot;
};

function ShiftSlotEditModalContent({
  open,
  slot,
  facilities,
  onClose,
  onUpdated,
}: ShiftSlotEditModalContentProps) {
  return (
    <ShiftSlotFormModalBase
      mode="edit"
      open={open}
      editingSlot={slot}
      facilities={facilities}
      onClose={onClose}
      onSubmitValidated={async (input) => {
        const updateInput: UpdateShiftSlotInput = {
          facilityId: input.facilityId,
          name: input.name,
          startTime: input.startTime,
          endTime: input.endTime,
          isOvernight: input.isOvernight,
          status: input.status,
        };

        const response = await updateShiftSlot(
          slot.id,
          updateInput,
        );

        onUpdated(response.data);

        return (
          response.message ||
          "Cập nhật khung ca thành công."
        );
      }}
    />
  );
}

export function ShiftSlotEditModal(
  props: ShiftSlotEditModalProps,
) {
  if (!props.slot) return null;

  return (
    <ShiftSlotEditModalContent
      {...props}
      slot={props.slot}
    />
  );
}