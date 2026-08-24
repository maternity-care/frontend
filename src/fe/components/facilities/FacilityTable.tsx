"use client";

import type { ColumnsType } from "antd/es/table";
import {
  Button,
  Card,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  Building2,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { CopyText } from "@/management/components/ui/CopyText";
import type {
  Facility,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import { getFacilityStatusText } from "./facility-form.shared";

const { Text } = Typography;

type Props = {
  facilities: Facility[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  isSuperAdmin: boolean;
  onView: (facility: Facility) => void;
  onEdit: (facility: Facility) => void;
  onDelete: (facility: Facility) => void;
  onCreate: () => void;
  onPageChange: (page: number, pageSize: number) => void;
};

export function FacilityTable({
  facilities,
  loading,
  currentPage,
  pageSize,
  total,
  isSuperAdmin,
  onView,
  onEdit,
  onDelete,
  onCreate,
  onPageChange,
}: Props) {
  const columns: ColumnsType<Facility> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Tên cơ sở",
      dataIndex: "name",
      width: 190,
      render: (name: string, record) => (
        <Space size={10}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <Text strong className="block whitespace-normal break-words">
              {name}
            </Text>
            <Text type="secondary" className="text-xs">
              {record.code}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Chủ cơ sở",
      dataIndex: "ownerName",
      width: 160,
      render: (ownerName: string, record) => (
        <div>
          <div className="font-medium text-slate-900">{ownerName || "Chưa gán"}</div>
          {record.ownerId ? (
            <div className="text-xs text-slate-500">ID: {record.ownerId}</div>
          ) : null}
          {record.ownerPhone ? (
            <div className="text-xs text-slate-500">{record.ownerPhone}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Hotline",
      dataIndex: "hotline",
      width: 125,
      align: "center",
      render: (hotline: string) => (
        <CopyText value={hotline} copiedMessage="Đã sao chép hotline" />
      ),
    },
    {
      title: "Giờ hoạt động",
      dataIndex: "operatingHourGroups",
      width: 190,
      render: (_value, record) => (
        <div className="space-y-1">
          {record.operatingHourGroups.length ? (
            record.operatingHourGroups.map((group) => (
              <div key={group.days.join("-")} className="text-xs">
                <span className="font-medium text-slate-800">
                  {group.dayLabel}:
                </span>{" "}
                <span className="text-slate-600">{group.displayTime}</span>
              </div>
            ))
          ) : (
            <span className="text-slate-400">Chưa cập nhật</span>
          )}
        </div>
      ),
    },
    {
      title: "Hiện tại",
      dataIndex: "operatingStatus",
      width: 120,
      align: "center",
      render: (_value, record) => (
        <Tag color={record.isOpenNow ? "green" : "orange"}>
          {record.operatingStatusLabel}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 110,
      align: "center",
      render: (status: FacilityStatus) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {getFacilityStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: isSuperAdmin ? 145 : 100,
      align: "center",
      render: (_value, record) => (
        <Space size={6}>
          <Button
            title="Xem chi tiết"
            icon={<Eye className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              onView(record);
            }}
          />
          <Button
            title="Cập nhật"
            icon={<Pencil className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(record);
            }}
          />
          {isSuperAdmin ? (
            <Button
              danger
              title="Xóa"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(record);
              }}
            />
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Card
      className="overflow-hidden border-slate-200 bg-white"
      styles={{ body: { padding: 0 } }}
      title={
        <p className="mb-0 text-base font-semibold text-slate-950">
          Danh sách cơ sở
        </p>
      }
      extra={
        isSuperAdmin ? (
          <Button
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={onCreate}
          >
            Thêm cơ sở
          </Button>
        ) : null
      }
    >
      <Table
        className="management-table"
        rowKey="id"
        size="middle"
        tableLayout="fixed"
        loading={loading}
        columns={columns}
        dataSource={facilities}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (totalValue, range) =>
            `${range[0]}-${range[1]} / ${totalValue} cơ sở`,
          onChange: onPageChange,
        }}
        onRow={(record) => ({
          className: "cursor-pointer",
          onClick: (event) => {
            const target = event.target as HTMLElement;
            if (
              target.closest("button") ||
              target.closest("a")
            ) {
              return;
            }
            onView(record);
          },
        })}
      />
    </Card>
  );
}
