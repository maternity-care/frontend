"use client";

import {
  Button,
  Card,
  Input,
  Select,
  Tooltip,
  Typography,
} from "antd";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { DoctorShiftStatus } from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import type { DoctorShiftViewMode } from "@/management/features/doctor-shifts/doctor-shifts.constants";
import { DOCTOR_SHIFT_STATUS_OPTIONS } from "@/management/features/doctor-shifts/doctor-shifts.constants";
import {
  DOCTOR_SHIFT_TODAY,
  getDoctorShiftPeriodTitle,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";

const { Text, Title } = Typography;

type Props = {
  viewMode: DoctorShiftViewMode;
  selectedDate: string;
  periodStartDate: string;
  keyword: string;
  facilityFilter?: string;
  roomFilter?: string;
  doctorFilter?: string;
  statusFilter?: DoctorShiftStatus;
  canManageShifts: boolean;
  canViewAllFacilities: boolean;
  isDoctorViewer: boolean;
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  canOpenManagementForms: boolean;
  onMovePeriod: (direction: -1 | 1) => void;
  onSelectedDateChange: (value: string) => void;
  onViewModeChange: (value: DoctorShiftViewMode) => void;
  onPeriodStartChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onFacilityFilterChange: (value?: string) => void;
  onRoomFilterChange: (value?: string) => void;
  onDoctorFilterChange: (value?: string) => void;
  onStatusFilterChange: (value?: DoctorShiftStatus) => void;
  onResetFilters: () => void;
  onOpenWeeklyUpdate: () => void;
  onOpenBulkGenerate: () => void;
  onOpenCreate: () => void;
};

export function DoctorShiftToolbar({
  viewMode,
  selectedDate,
  periodStartDate,
  keyword,
  facilityFilter,
  roomFilter,
  doctorFilter,
  statusFilter,
  canManageShifts,
  canViewAllFacilities,
  isDoctorViewer,
  facilities,
  rooms,
  doctors,
  canOpenManagementForms,
  onMovePeriod,
  onSelectedDateChange,
  onViewModeChange,
  onPeriodStartChange,
  onKeywordChange,
  onFacilityFilterChange,
  onRoomFilterChange,
  onDoctorFilterChange,
  onStatusFilterChange,
  onResetFilters,
  onOpenWeeklyUpdate,
  onOpenBulkGenerate,
  onOpenCreate,
}: Props) {
  return (
    <Card className="border-slate-200 bg-white">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              icon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => onMovePeriod(-1)}
            />

            <Button onClick={() => onSelectedDateChange(DOCTOR_SHIFT_TODAY)}>
              Hôm nay
            </Button>

            <Button
              icon={<ChevronRight className="h-4 w-4" />}
              onClick={() => onMovePeriod(1)}
            />

            <Title level={4} className="!mb-0 !ml-1 !text-slate-950">
              {getDoctorShiftPeriodTitle(viewMode, selectedDate)}
            </Title>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["day", "week", "month"] as const).map((mode) => (
              <Button
                key={mode}
                type={viewMode === mode ? "primary" : "default"}
                onClick={() => onViewModeChange(mode)}
              >
                {mode === "day" ? "Ngày" : mode === "week" ? "Tuần" : "Tháng"}
              </Button>
            ))}

            {canManageShifts ? (
              <>
                <Button
                  icon={<Pencil className="h-4 w-4" />}
                  disabled={!canOpenManagementForms}
                  onClick={onOpenWeeklyUpdate}
                >
                  Cập nhật lịch tuần
                </Button>

                <Button
                  icon={<CalendarRange className="h-4 w-4" />}
                  disabled={!canOpenManagementForms}
                  onClick={onOpenBulkGenerate}
                >
                  Tạo lịch tuần
                </Button>

                <Button
                  type="primary"
                  icon={<Plus className="h-4 w-4" />}
                  disabled={!canOpenManagementForms}
                  onClick={onOpenCreate}
                >
                  Thêm ca trực
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div
          className={`grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4 ${
            isDoctorViewer
              ? "xl:grid-cols-5"
              : canViewAllFacilities
                ? "xl:grid-cols-7"
                : "xl:grid-cols-6"
          }`}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <Text className="text-xs font-medium text-slate-500">
              {viewMode === "week"
                ? "Ngày bắt đầu tuần"
                : viewMode === "month"
                  ? "Ngày bắt đầu tháng"
                  : "Ngày xem"}
            </Text>

            <Input
              type="date"
              value={periodStartDate}
              onChange={(event) => onPeriodStartChange(event.target.value)}
            />
          </div>

          <Input
            allowClear
            value={keyword}
            prefix={<Search className="h-4 w-4 text-slate-400" />}
            placeholder={
              isDoctorViewer
                ? "Tìm phòng, slot, ghi chú..."
                : "Tìm bác sĩ, cơ sở, phòng, slot..."
            }
            onChange={(event) => onKeywordChange(event.target.value)}
          />

          {canViewAllFacilities ? (
            <Select
              allowClear
              value={facilityFilter}
              placeholder="Tất cả cơ sở"
              options={facilities.map((facility) => ({
                value: facility.id,
                label: facility.name,
              }))}
              onChange={(value) => onFacilityFilterChange(value)}
            />
          ) : null}

          <Select
            allowClear
            value={roomFilter}
            placeholder="Tất cả phòng"
            options={rooms
              .filter(
                (room) =>
                  !canViewAllFacilities ||
                  !facilityFilter ||
                  room.facilityId === facilityFilter,
              )
              .map((room) => ({ value: room.id, label: room.name }))}
            onChange={onRoomFilterChange}
          />

          {!isDoctorViewer ? (
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={doctorFilter}
              placeholder="Tất cả bác sĩ"
              options={doctors.map((doctor) => ({
                value: doctor.id,
                label: `${doctor.title} ${doctor.name}`,
              }))}
              onChange={onDoctorFilterChange}
            />
          ) : null}

          <Select
            allowClear
            value={statusFilter}
            placeholder="Trạng thái"
            options={DOCTOR_SHIFT_STATUS_OPTIONS}
            onChange={onStatusFilterChange}
          />

          <Tooltip title="Xóa bộ lọc">
            <Button
              block
              icon={<X className="h-4 w-4" />}
              onClick={onResetFilters}
            >
              Xóa bộ lọc
            </Button>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}
