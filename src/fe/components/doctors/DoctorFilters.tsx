"use client";

import { Button, Card, Input, Select, Tooltip } from "antd";
import { FilterX, Search } from "lucide-react";
import {
  DOCTOR_EXPERIENCE_OPTIONS,
  DOCTOR_EXPERIENCE_SORT_OPTIONS,
  DOCTOR_STATUS_OPTIONS,
} from "@/management/features/doctors/doctors.constants";
import type {
  DoctorExperienceLevel,
  DoctorExperienceSort,
  DoctorStatus,
} from "@/management/features/doctors/doctors.types";
import type { DoctorFilters as DoctorFilterValue } from "@/hooks/doctors/useDoctors";

type Props = {
  searchValue: string;
  facilityId?: string;
  facilityOptions: Array<{
    value: string;
    label: string;
  }>;
  showFacilityFilter: boolean;
  specialty: string;
  specialtyOptions: Array<{
    value: string;
    label: string;
  }>;
  specialtyLoading: boolean;
  specialtyError?: string | null;
  status?: DoctorStatus;
  experienceLevel?: DoctorExperienceLevel;
  experienceSort: DoctorExperienceSort;
  onSearchValueChange: (value: string) => void;
  onFacilityChange: (value?: string) => void;
  onSpecialtyChange: (value: string) => void;
  onStatusChange: (value?: DoctorStatus) => void;
  onExperienceLevelChange: (value?: DoctorExperienceLevel) => void;
  onExperienceSortChange: (value: DoctorExperienceSort) => void;
  onApply: (overrides?: Partial<DoctorFilterValue>) => void;
  onReset: () => void;
};

export function DoctorFilters({
  searchValue,
  facilityId,
  facilityOptions,
  showFacilityFilter,
  specialty,
  specialtyOptions,
  specialtyLoading,
  specialtyError,
  status,
  experienceLevel,
  experienceSort,
  onSearchValueChange,
  onFacilityChange,
  onSpecialtyChange,
  onStatusChange,
  onExperienceLevelChange,
  onExperienceSortChange,
  onApply,
  onReset,
}: Props) {
  return (
    <Card className="border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 overflow-hidden">
        <Input
          allowClear
          value={searchValue}
          prefix={<Search className="h-4 w-4 text-slate-400" />}
          placeholder="Tìm theo họ tên, số điện thoại hoặc mã nhân viên"
          style={{ width: 300, flex: "0 0 300px" }}
          onChange={(event) => {
            const value = event.target.value;
            onSearchValueChange(value);
            if (!value.trim()) onApply({ keyword: undefined });
          }}
          onPressEnter={() => onApply()}
        />

        {showFacilityFilter ? (
          <Select<string>
            allowClear
            showSearch
            value={facilityId}
            options={facilityOptions}
            optionFilterProp="label"
            placeholder="Cơ sở"
            style={{ width: 210, flex: "0 0 210px" }}
            onChange={(value) => {
              onFacilityChange(value);
              onApply({
                facilityId: value,
              });
            }}
          />
        ) : null}

        <Select<string>
          allowClear
          showSearch
          value={specialty || undefined}
          options={specialtyOptions}
          loading={specialtyLoading}
          optionFilterProp="label"
          placeholder="Chuyên khoa"
          style={{ width: 180, flex: "0 0 180px" }}
          notFoundContent={
            specialtyLoading
              ? "Đang tải chuyên khoa..."
              : specialtyError
                ? "Không tải được chuyên khoa"
                : "Chưa có chuyên khoa"
          }
          onChange={(value) => {
            const nextValue = value ?? "";
            onSpecialtyChange(nextValue);
            onApply({
              specialty: nextValue || undefined,
            });
          }}
        />

        <Select
          allowClear
          value={status}
          options={DOCTOR_STATUS_OPTIONS}
          placeholder="Trạng thái"
          style={{ width: 150 }}
          onChange={(value) => {
            onStatusChange(value);
            onApply({ status: value });
          }}
        />

        <Select<DoctorExperienceLevel>
          allowClear
          value={experienceLevel}
          options={DOCTOR_EXPERIENCE_OPTIONS}
          placeholder="Mức kinh nghiệm"
          style={{ width: 190 }}
          onChange={(value) => {
            onExperienceLevelChange(value);
            onApply({ experienceLevel: value });
          }}
        />

        <Select<DoctorExperienceSort>
          value={experienceSort}
          options={DOCTOR_EXPERIENCE_SORT_OPTIONS}
          style={{ width: 210 }}
          onChange={(value) => {
            onExperienceSortChange(value);
            onApply({ sortYearsOfExperience: value });
          }}
        />

        <Tooltip title="Xóa bộ lọc">
          <Button
            aria-label="Xóa bộ lọc"
            icon={<FilterX className="h-4 w-4" />}
            onClick={onReset}
          />
        </Tooltip>
      </div>
    </Card>
  );
}