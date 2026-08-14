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
  SHIFT_SLOT_STATUS_OPTIONS,
} from "@/management/features/shift-slots/shift-slots.constants";
import type {
  ShiftSlotFacilityOption,
  ShiftSlotStatus,
} from "@/management/features/shift-slots/shift-slots.types";

type Props = {
  canViewAllFacilities: boolean;
  facilities: ShiftSlotFacilityOption[];
  searchInput: string;
  facilityFilter?: string;
  statusFilter?: ShiftSlotStatus;
  onSearchChange: (
    value: string,
  ) => void;
  onFacilityChange: (
    value?: string,
  ) => void;
  onStatusChange: (
    value?: ShiftSlotStatus,
  ) => void;
  onReset: () => void;
};

export function ShiftSlotFilters({
  canViewAllFacilities,
  facilities,
  searchInput,
  facilityFilter,
  statusFilter,
  onSearchChange,
  onFacilityChange,
  onStatusChange,
  onReset,
}: Props) {
  return (
    <Card className="border-slate-200 bg-white">
      <div
        className={`grid items-end gap-3 sm:grid-cols-2 ${
          canViewAllFacilities
            ? "lg:grid-cols-4"
            : "lg:grid-cols-3"
        }`}
      >
        <Input
          allowClear
          value={searchInput}
          prefix={
            <Search className="h-4 w-4 text-slate-400" />
          }
          placeholder="Tìm theo mã hoặc tên khung ca"
          onChange={(
            event,
          ) =>
            onSearchChange(
              event.target
                .value,
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
              (
                facility,
              ) => ({
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

        <Select
          allowClear
          value={statusFilter}
          placeholder="Tất cả trạng thái"
          options={
            SHIFT_SLOT_STATUS_OPTIONS
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
