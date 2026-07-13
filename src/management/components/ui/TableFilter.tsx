"use client";

import type { ReactNode } from "react";
import { Button, Card, Input, Select } from "antd";
import { RotateCcw, Search } from "lucide-react";

export type TableFilterValue =
  | string
  | number
  | boolean
  | undefined;

export type TableFilterValues = Record<
  string,
  TableFilterValue
>;

export type TableFilterOption = {
  value: string | number;
  label: ReactNode;
};

export type TableFilterColumn = {
  field: string;
  label: string;
  type: "text" | "select";
  options?: TableFilterOption[];
  width?: number;
  contains?: boolean;
};

type TableFilterProps = {
  columns: TableFilterColumn[];
  values: TableFilterValues;
  clearLabel?: string;
  onChange: (
    values: TableFilterValues,
    search?: string,
  ) => void;
};

function hasValue(value: TableFilterValue) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

export function TableFilter({
  columns,
  values,
  clearLabel = "Xóa bộ lọc",
  onChange,
}: TableFilterProps) {
  const hasActiveFilters = columns.some((column) =>
    hasValue(values[column.field]),
  );

  function handleChange(
    field: string,
    value: TableFilterValue,
  ) {
    const normalizedValue =
      typeof value === "string" &&
      value.trim().length === 0
        ? undefined
        : value;

    const nextValues: TableFilterValues = {
      ...values,
      [field]: normalizedValue,
    };

    onChange(nextValues, undefined);
  }

  function handleClear() {
    const nextValues: TableFilterValues = {
      ...values,
    };

    columns.forEach((column) => {
      nextValues[column.field] = undefined;
    });

    onChange(nextValues, undefined);
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
        {columns.map((column) => {
          const currentValue = values[column.field];

          return (
            <div
              key={column.field}
              className="min-w-0"
              style={{
                width: column.width ?? 180,
              }}
            >
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {column.label}
              </label>

              {column.type === "select" ? (
                <Select
                  allowClear
                  className="w-full"
                  placeholder={column.label}
                  options={column.options ?? []}
                  value={
                    typeof currentValue === "string" ||
                    typeof currentValue === "number"
                      ? currentValue
                      : undefined
                  }
                  onChange={(value) =>
                    handleChange(column.field, value)
                  }
                />
              ) : (
                <Input
                  allowClear
                  prefix={
                    <Search className="h-4 w-4 text-slate-400" />
                  }
                  placeholder={column.label}
                  value={
                    currentValue === undefined
                      ? ""
                      : String(currentValue)
                  }
                  onChange={(event) =>
                    handleChange(
                      column.field,
                      event.target.value,
                    )
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