"use client";

import { TableFilter } from "@/management/components/ui/TableFilter";
import { FACILITY_STATUS_OPTIONS } from "@/management/features/facilities/facilities.constants";
import type { FacilityStatus } from "@/management/features/facilities/facilities.types";

type Props = {
  query: string;
  city?: string;
  status?: FacilityStatus;
  cityOptions: Array<{ value: string; label: string }>;
  onChange: (values: {
    name?: unknown;
    province?: unknown;
    status?: unknown;
  }) => void;
};

export function FacilityFilters({
  query,
  city,
  status,
  cityOptions,
  onChange,
}: Props) {
  return (
    <TableFilter
      columns={[
        {
          field: "name",
          label: "Tìm kiếm cơ sở",
          type: "text",
          contains: true,
          width: 370,
        },
        {
          field: "province",
          label: "Tỉnh/Thành phố",
          type: "select",
          options: cityOptions,
          width: 300,
        },
        {
          field: "status",
          label: "Trạng thái",
          type: "select",
          options: FACILITY_STATUS_OPTIONS,
          width: 300,
        },
      ]}
      values={{
        name: query,
        province: city,
        status,
      }}
      clearLabel="Xóa bộ lọc"
      onChange={onChange}
    />
  );
}
