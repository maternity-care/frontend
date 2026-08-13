"use client";

import type {
  ReactNode,
} from "react";
import {
  Tag,
} from "antd";
import {
  Building2,
  DoorOpen,
  Layers,
  Shapes,
} from "lucide-react";
import type {
  ClinicRoom,
  RoomFacilityOption,
  RoomStatus,
  RoomType,
} from "@/management/features/rooms/rooms.types";
import {
  getRoomStatusLabel,
} from "@/management/features/rooms/rooms.utils";

function PreviewLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="flex gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="mt-0.5 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="mb-0 text-[11px] font-semibold uppercase text-slate-400">
          {label}
        </p>

        <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value ||
            "Chưa nhập"}
        </div>
      </div>
    </div>
  );
}

type Props = {
  room: ClinicRoom;
  roomName?: string;
  floor?: string;
  status?: RoomStatus;
  selectedRoomType?: RoomType;
  selectedFacility?: RoomFacilityOption;
};

export function RoomPreview({
  room,
  roomName,
  floor,
  status = room.status,
  selectedRoomType,
  selectedFacility,
}: Props) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:self-start">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
          <DoorOpen className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="mb-0 truncate text-base font-semibold text-slate-950">
            {roomName ||
              room.roomName}
          </p>

          <p className="mb-0 truncate text-sm text-slate-500">
            {selectedRoomType?.name ||
              room.roomTypeName}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Tag
          color={
            status ===
            "active"
              ? "green"
              : "default"
          }
        >
          {getRoomStatusLabel(
            status,
          )}
        </Tag>
      </div>

      <div className="mt-4 space-y-2.5">
        <PreviewLine
          icon={
            <DoorOpen className="h-4 w-4" />
          }
          label="Tên phòng"
          value={
            roomName ||
            room.roomName
          }
        />

        <PreviewLine
          icon={
            <Shapes className="h-4 w-4" />
          }
          label="Loại phòng"
          value={
            selectedRoomType?.name ||
            room.roomTypeName
          }
        />

        <PreviewLine
          icon={
            <Layers className="h-4 w-4" />
          }
          label="Tầng"
          value={
            floor ||
            room.floor
          }
        />

        <PreviewLine
          icon={
            <Building2 className="h-4 w-4" />
          }
          label="Cơ sở"
          value={
            selectedFacility?.name ||
            room.facilityName
          }
        />
      </div>
    </aside>
  );
}
