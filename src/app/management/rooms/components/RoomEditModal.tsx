"use client";

import {
  getRoomById,
  updateRoom,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
  UpdateRoomInput,
} from "@/management/features/rooms/rooms.types";
import {
  RoomFormModalBase,
} from "./room-form.shared";
import type {
  FacilityOption,
  ValidatedRoomForm,
} from "./room-form.shared";

type RoomEditModalProps = {
  open: boolean;
  room: ClinicRoom | null;
  facilities: FacilityOption[];
  onClose: () => void;
  onUpdated: (
    room: ClinicRoom,
  ) => void;
};

type RoomEditModalContentProps = Omit<
  RoomEditModalProps,
  "room"
> & {
  room: ClinicRoom;
};

function RoomEditModalContent({
  open,
  room,
  facilities,
  onClose,
  onUpdated,
}: RoomEditModalContentProps) {
  async function handleUpdate({
    input,
  }: ValidatedRoomForm) {
    const updateInput: UpdateRoomInput = {
      name: input.name,
      roomTypeId: input.roomTypeId,
      floor: input.floor,
    };

    const response = await updateRoom(
      room.id,
      updateInput,
    );

    let updatedRoom: ClinicRoom = {
      ...room,
      ...response.data,
    };

    try {
      updatedRoom = await getRoomById(
        response.data.id || room.id,
      );
    } catch {
    }

    onUpdated(updatedRoom);

    return (
      response.message ||
      "Cập nhật phòng thành công."
    );
  }

  return (
    <RoomFormModalBase
      mode="edit"
      open={open}
      editingRoom={room}
      facilities={facilities}
      onClose={onClose}
      onSubmitValidated={handleUpdate}
    />
  );
}

export function RoomEditModal(
  props: RoomEditModalProps,
) {
  if (!props.room) return null;

  return (
    <RoomEditModalContent
      {...props}
      room={props.room}
    />
  );
}
