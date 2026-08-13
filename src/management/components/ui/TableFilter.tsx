"use client";

import type { ReactNode } from "react";
import { Button, Card, DatePicker, Input, Select } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { RotateCcw, Search } from "lucide-react";
import { buildSearch } from "@/lib/search-filter";

const { RangePicker } = DatePicker;

export type TableFilterValue =
  | string
  | number
  | boolean
  | Dayjs
  | [Dayjs | null, Dayjs | null]
  | null
  | undefined;

export type TableFilterValues = Record<string, TableFilterValue>;

export type TableFilterOption = {
  value: string | number;
  label: ReactNode;
};

export type TableFilterColumn = {
  field: string;
  label: string;
  /** text | select | date | dateRange */
  type: "text" | "select" | "date" | "dateRange";
  options?: TableFilterOption[];
  width?: number;
  /** Dùng cho buildSearch (chỉ field text) */
  contains?: boolean;
  /** Ẩn cột filter */
  hidden?: boolean;
  /** Disable input */
  disabled?: boolean;
  /** Placeholder riêng (mặc định = label) */
  placeholder?: string;
  /** Format hiển thị DatePicker */
  dateFormat?: string;
};

type TableFilterProps = {
  columns: TableFilterColumn[];
  values: TableFilterValues;
  clearLabel?: string;
  onChange: (values: TableFilterValues, search?: string) => void;
};

function hasValue(value: TableFilterValue) {
  if (value === undefined || value === null) return false;

  if (typeof value === "string") return value.trim().length > 0;

  if (Array.isArray(value)) {
    return value.some((item) => item != null);
  }

  // Dayjs
  if (dayjs.isDayjs(value)) return value.isValid();

  return true;
}

function toDayjs(value: TableFilterValue): Dayjs | null {
  if (value == null) return null;
  if (dayjs.isDayjs(value)) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }
  return null;
}

function toRangeValue(
  value: TableFilterValue,
): [Dayjs | null, Dayjs | null] | null {
  if (!Array.isArray(value)) return null;
  return [toDayjs(value[0]), toDayjs(value[1])];
}

export function TableFilter({
  columns,
  values,
  clearLabel = "Xóa bộ lọc",
  onChange,
}: TableFilterProps) {
  const visibleColumns = columns.filter((column) => !column.hidden);

  const hasActiveFilters = visibleColumns.some((column) =>
    hasValue(values[column.field]),
  );

  function toSearchFilters(
    values: TableFilterValues,
  ): Record<string, string | number | boolean | undefined> {
    const result: Record<string, string | number | boolean | undefined> = {};

    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        result[key] = undefined;
        return;
      }

      // bỏ qua date / dateRange (không đưa vào search string)
      if (dayjs.isDayjs(value) || Array.isArray(value)) {
        return;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        result[key] = value;
      }
    });

    return result;
  }

  function emitChange(nextValues: TableFilterValues) {
    const searchFilters: Record<string, string | number | boolean | undefined> =
      {};

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        searchFilters[key] = undefined;
        return;
      }

      // Date / DateRange không đưa vào buildSearch
      if (dayjs.isDayjs(value) || Array.isArray(value)) {
        return;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        searchFilters[key] = value;
      }
    });

    const search = buildSearch(searchFilters, {
      contains: columns
        .filter((column) => column.contains)
        .map((column) => column.field),
    });

    onChange(nextValues, search);
  }

  function handleChange(field: string, value: TableFilterValue) {
    let normalizedValue: TableFilterValue = value;

    if (typeof value === "string" && value.trim().length === 0) {
      normalizedValue = undefined;
    }

    if (Array.isArray(value) && value.every((item) => item == null)) {
      normalizedValue = undefined;
    }

    emitChange({
      ...values,
      [field]: normalizedValue,
    });
  }

  function handleClear() {
    const nextValues: TableFilterValues = { ...values };

    columns.forEach((column) => {
      nextValues[column.field] = undefined;
    });

    emitChange(nextValues);
  }

  return (
    <Card
      size="small"
      className="border-slate-200 bg-white"
      styles={{
        body: {
          padding: 16,
        },
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        {visibleColumns.map((column) => {
          const currentValue = values[column.field];
          const width = column.width ?? 180;
          const placeholder = column.placeholder ?? column.label;
          const dateFormat = column.dateFormat ?? "DD/MM/YYYY";

          return (
            <div key={column.field} className="min-w-0" style={{ width }}>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {column.label}
              </label>

              {column.type === "select" ? (
                <Select
                  allowClear
                  className="w-full"
                  placeholder={placeholder}
                  options={column.options ?? []}
                  disabled={column.disabled}
                  value={
                    typeof currentValue === "string" ||
                    typeof currentValue === "number"
                      ? currentValue
                      : undefined
                  }
                  onChange={(value) => handleChange(column.field, value)}
                />
              ) : column.type === "date" ? (
                <DatePicker
                  className="w-full"
                  format={dateFormat}
                  placeholder={placeholder}
                  disabled={column.disabled}
                  value={toDayjs(currentValue)}
                  onChange={(value) => handleChange(column.field, value)}
                />
              ) : column.type === "dateRange" ? (
                <RangePicker
                  className="w-full"
                  format={dateFormat}
                  placeholder={["Từ ngày", "Đến ngày"]}
                  disabled={column.disabled}
                  value={toRangeValue(currentValue)}
                  onChange={(value) =>
                    handleChange(
                      column.field,
                      value as [Dayjs | null, Dayjs | null] | null,
                    )
                  }
                />
              ) : (
                <Input
                  allowClear
                  disabled={column.disabled}
                  prefix={<Search className="h-4 w-4 text-slate-400" />}
                  placeholder={placeholder}
                  value={
                    currentValue === undefined || currentValue === null
                      ? ""
                      : String(currentValue)
                  }
                  onChange={(event) =>
                    handleChange(column.field, event.target.value)
                  }
                />
              )}
            </div>
          );
        })}

        <Button
          icon={<RotateCcw className="h-4 w-4" />}
          disabled={!hasActiveFilters}
          onClick={handleClear}
        >
          {clearLabel}
        </Button>
      </div>
    </Card>
  );
}
