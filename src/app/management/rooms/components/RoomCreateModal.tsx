"use client";

import {
  createRoom,
  getRoomById,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
} from "@/management/features/rooms/rooms.types";
import {
  RoomFormModalBase,
} from "./room-form.shared";
import type {
  FacilityOption,
  ValidatedRoomForm,
} from "./room-form.shared";

type RoomCreateModalProps = {
  open: boolean;
  facilities: FacilityOption[];
  defaultFacilityId?: string;
  onClose: () => void;
  onCreated: (
    room: ClinicRoom,
  ) => void;
};

export function RoomCreateModal({
  open,
  facilities,
  defaultFacilityId,
  onClose,
  onCreated,
}: RoomCreateModalProps) {
  async function handleCreate({
    facilityId,
    input,
  }: ValidatedRoomForm) {
    const response = await createRoom({
      facilityId,
      ...input,
    });

    let createdRoom = response.data;

    try {
      createdRoom = await getRoomById(
        response.data.id,
      );
    } catch {
      // Giữ dữ liệu POST khi endpoint chi tiết
      // chưa phản hồi ngay sau khi tạo.
    }

    onCreated(createdRoom);

    return (
      response.message ||
      "Tạo phòng thành công."
    );
  }

  return (
    <RoomFormModalBase
      mode="create"
      open={open}
      facilities={facilities}
      defaultFacilityId={
        defaultFacilityId
      }
      onClose={onClose}
      onSubmitValidated={handleCreate}
    />
  );
}