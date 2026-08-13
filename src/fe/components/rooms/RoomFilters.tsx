"use client";

import {
  Button,
  Card,
  Input,
  Select,
} from "antd";
import {
  Search,
  X,
} from "lucide-react";
import {
  ROOM_STATUS_OPTIONS,
} from "@/management/features/rooms/rooms.constants";
import type {
  RoomFacilityOption,
  RoomStatus,
  RoomType,
} from "@/management/features/rooms/rooms.types";

type Props = {
  canViewAllFacilities: boolean;
  facilities: RoomFacilityOption[];
  roomTypes: RoomType[];
  searchInput: string;
  facilityFilter?: string;
  floorFilter?: string;
  roomTypeIdFilter?: string;
  statusFilter?: RoomStatus;
  onSearchChange: (
    value: string,
  ) => void;
  onFacilityChange: (
    value?: string,
  ) => void;
  onFloorChange: (
    value?: string,
  ) => void;
  onRoomTypeChange: (
    value?: string,
  ) => void;
  onStatusChange: (
    value?: RoomStatus,
  ) => void;
  onReset: () => void;
};

export function RoomFilters({
  canViewAllFacilities,
  facilities,
  roomTypes,
  searchInput,
  facilityFilter,
  floorFilter,
  roomTypeIdFilter,
  statusFilter,
  onSearchChange,
  onFacilityChange,
  onFloorChange,
  onRoomTypeChange,
  onStatusChange,
  onReset,
}: Props) {
  return (
    <Card className="border-slate-200 bg-white">
      <div
        className={`grid items-end gap-3 sm:grid-cols-2 ${
          canViewAllFacilities
            ? "lg:grid-cols-6"
            : "lg:grid-cols-5"
        }`}
      >
        <Input
          allowClear
          value={searchInput}
          prefix={
            <Search className="h-4 w-4 text-slate-400" />
          }
          placeholder="Tên phòng hoặc cơ sở"
          onChange={(event) =>
            onSearchChange(
              event.target.value,
            )
          }
        />

        {canViewAllFacilities ? (
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            value={
              facilityFilter
            }
            placeholder="Tất cả cơ sở"
            options={facilities.map(
              (facility) => ({
                value:
                  facility.id,
                label:
                  facility.name,
              }),
            )}
            onChange={
              onFacilityChange
            }
          />
        ) : null}

        <Input
          allowClear
          value={floorFilter}
          placeholder="Tầng"
          onChange={(event) =>
            onFloorChange(
              event.target.value ||
                undefined,
            )
          }
        />

        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          value={
            roomTypeIdFilter
          }
          placeholder="Tất cả loại phòng"
          options={roomTypes.map(
            (roomType) => ({
              value:
                roomType.id,
              label:
                roomType.name,
            }),
          )}
          onChange={
            onRoomTypeChange
          }
        />

        <Select
          allowClear
          value={statusFilter}
          placeholder="Tất cả trạng thái"
          options={
            ROOM_STATUS_OPTIONS
          }
          onChange={
            onStatusChange
          }
        />

        <Button
          icon={
            <X className="h-4 w-4" />
          }
          onClick={onReset}
        >
          Xóa bộ lọc
        </Button>
      </div>
    </Card>
  );
}
