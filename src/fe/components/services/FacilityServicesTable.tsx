"use client";

import type { ColumnsType } from "antd/es/table";

import {
  Button,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import {
  Building2,
  Clock3,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import { FacilityService } from "@/management/features/services/services.types";

const { Text } = Typography;

interface FacilityServicesTableProps {
  data: FacilityService[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
  onView: (record: FacilityService) => void;
  onEdit: (record: FacilityService) => void;
  onDelete: (record: FacilityService) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FacilityServicesTable({
  data,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: FacilityServicesTableProps) {
  const columns: ColumnsType<FacilityService> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_value, _record, index) =>
        (page - 1) * pageSize + index + 1,
    },
    {
      title: "Cơ sở",
      key: "facility",
      width: 220,
      render: (_, record) => (
        <Space size={10}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <Building2 className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <Text
              strong
              className="block whitespace-normal break-words"
            >
              {record.facilityName}
            </Text>

            <Text type="secondary" className="text-xs">
              {record.facilityCode
                ? `${record.facilityCode} · `
                : ""}
              ID: {record.facilityId}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Dịch vụ",
      key: "service",
      width: 250,
      render: (_, record) => (
        <div>
          <Text
            strong
            className="block whitespace-normal break-words"
          >
            {record.serviceName}
          </Text>

          <Text type="secondary" className="text-xs">
            {record.serviceCode
              ? `${record.serviceCode} · `
              : ""}
            ID: {record.serviceId}
          </Text>
        </div>
      ),
    },
    {
      title: "Loại dịch vụ",
      dataIndex: "serviceType",
      width: 150,
      align: "center",
      render: (serviceType?: string) =>
        serviceType ? (
          <Tag color="blue">{serviceType}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Giá dịch vụ",
      dataIndex: "price",
      width: 150,
      align: "right",
      render: (price: number) => (
        <Text strong>{formatCurrency(price)}</Text>
      ),
    },
    {
      title: "Thời lượng",
      dataIndex: "durationMinutes",
      width: 130,
      align: "center",
      render: (durationMinutes: number) => (
        <Space size={6}>
          <Clock3 className="h-4 w-4 text-slate-400" />
          <span>{durationMinutes} phút</span>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      align: "center",
      render: (status: FacilityService["status"]) => (
        <Tag
          color={
            status === "available"
              ? "green"
              : "default"
          }
        >
          {status === "available"
            ? "Đang cung cấp"
            : "Ngừng cung cấp"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={8}>
          <Button
            title="Xem chi tiết"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => onView(record)}
          />

          <Button
            title="Chỉnh sửa"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => onEdit(record)}
          />

          <Button
            danger
            title="Xóa"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => onDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table<FacilityService>
      className="management-table"
      rowKey="id"
      size="middle"
      tableLayout="fixed"
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 1200 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showQuickJumper: true,
        showTotal: (recordTotal, range) =>
          `Hiển thị ${range[0]} - ${range[1]} trong tổng ${recordTotal} bản ghi`,
        onChange: onPageChange,
      }}
    />
  );
}