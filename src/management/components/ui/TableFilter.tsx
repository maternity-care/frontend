"use client";

import { Button, Card, Input, Select, Tooltip } from "antd";
import { CircleHelp, RotateCcw, Search } from "lucide-react";
import {
  buildSearch,
  parseSearchValues,
  type SearchFilterValue,
  type SearchFilters,
} from "@/lib/search-filter";

export interface TableFilterOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface TableFilterColumn {
  field: string;
  label: string;
  type: "text" | "select";
  contains?: boolean;
  options?: TableFilterOption[];
  width?: number;
}

interface TableFilterProps {
  columns: TableFilterColumn[];
  values: SearchFilters;
  onChange: (values: SearchFilters, search?: string) => void;
  clearLabel?: string;
  embedded?: boolean;
}

export function TableFilter({
  columns,
  values,
  onChange,
  clearLabel = "Xóa bộ lọc",
  embedded = false,
}: TableFilterProps) {
  const contains = columns
    .filter((column) => column.contains)
    .map((column) => column.field);

  function update(field: string, value: SearchFilterValue) {
    const next = { ...values, [field]: value };
    const search = buildSearch(next, { contains });
    onChange(parseSearchValues(search), search);
  }

  function clear() {
    onChange({}, undefined);
  }

  const content = (
    <div className="flex flex-wrap items-center gap-3">
        {columns.map((column) => {
          const style = {
            flex: column.width ? `0 1 ${column.width}px` : "1 1 240px",
            minWidth: Math.min(column.width ?? 240, 160),
          };
          const value = values[column.field];

          if (column.type === "select") {
            return (
              <Select
                key={column.field}
                size="large"
                allowClear
                style={style}
                value={
                  Array.isArray(value)
                    ? value.map(String)
                    : value === null || value === undefined || value === ""
                      ? undefined
                      : String(value)
                }
                mode={Array.isArray(value) ? "multiple" : undefined}
                placeholder={column.label}
                options={column.options}
                onChange={(nextValue) => update(column.field, nextValue)}
              />
            );
          }

          return (
            <Input
              key={column.field}
              size="large"
              allowClear
              style={style}
              value={typeof value === "string" ? value : ""}
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder={column.label}
              onChange={(event) => update(column.field, event.target.value)}
            />
          );
        })}

        <Button
          size="large"
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={clear}
        >
          {clearLabel}
        </Button>
        <Tooltip
          placement="bottomRight"
          title={
            <div className="space-y-1 text-xs">
              <p><b>*value</b>: chứa giá trị</p>
              <p><b>^a,b</b>: khớp một trong nhiều giá trị</p>
              <p><b>field-&gt;key</b>: lọc thuộc tính JSON</p>
              <p><b>relation,field</b>: lọc theo bảng liên kết</p>
            </div>
          }
        >
          <Button
            type="text"
            size="large"
            icon={<CircleHelp className="h-4 w-4" />}
            aria-label="Xem cú pháp bộ lọc"
          />
        </Tooltip>
    </div>
  );

  if (embedded) {
    return (
      <div className="border-t border-slate-200 bg-slate-50/70 p-4">
        {content}
      </div>
    );
  }

  return <Card className="management-filter">{content}</Card>;
}
