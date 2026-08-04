"use client";

import { Button, Card, Input, Select } from "antd";
import { RotateCcw, Search } from "lucide-react";
import type { UserStatus } from "@/management/features/management-users/management-user.types";

interface Props {
  search: string;
  status?: UserStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value?: UserStatus) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Ngừng hoạt động" },
  { value: "locked", label: "Đã khóa" },
];

export function UserFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
}: Props) {
  return (
    <Card className="border-slate-200 bg-white">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <Input
          allowClear
          value={search}
          prefix={<Search className="h-4 w-4 text-slate-400" />}
          placeholder="Tìm theo tên, email, CCCD, số điện thoại..."
          className="min-w-0 xl:flex-1"
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <Select
          allowClear
          value={status}
          placeholder="Trạng thái"
          className="w-full xl:w-[200px] xl:shrink-0"
          options={STATUS_OPTIONS}
          onChange={onStatusChange}
        />

        <Button
          icon={<RotateCcw className="h-4 w-4" />}
          className="w-full xl:w-auto xl:shrink-0"
          onClick={onReset}
        >
          Xóa bộ lọc
        </Button>
      </div>
    </Card>
  );
}