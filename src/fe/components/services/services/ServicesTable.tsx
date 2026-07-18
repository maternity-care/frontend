"use client";

import {
  Button,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import type {
  ColumnsType,
} from "antd/es/table";

import {
  Clock3,
  Eye,
  Pencil,
  Stethoscope,
  Trash2,
} from "lucide-react";

import type {
  Service,
} from "@/management/features/services/services.types";
import { formatCurrency, getServiceTypeLabel } from "../services.ui";

const { Text } = Typography;

interface Props {
  data: Service[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
  onView: (record: Service) => void;
  onEdit: (record: Service) => void;
  onDelete: (record: Service) => void;
}

export function ServicesTable({
  data,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const columns: ColumnsType<Service> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (
        _value,
        _record,
        index,
      ) =>
        (page - 1) * pageSize +
        index +
        1,
    },
    {
      title: "Dịch vụ",
      key: "service",
      width: 300,
      render: (_, record) => (
        <Space size={10}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
            <Stethoscope className="h-4 w-4" />
          </span>

          <div>
            <Text strong>
              {record.name}
            </Text>

            <div>
              <Text
                type="secondary"
                className="text-xs"
              >
                {record.code}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "serviceType",
      width: 150,
      align: "center",
      render: (
        value: Service["serviceType"],
      ) => (
        <Tag color="blue">
          {getServiceTypeLabel(value)}
        </Tag>
      ),
    },
    {
      title: "Giá cơ bản",
      dataIndex: "basePrice",
      width: 160,
      align: "right",
      render: (
        value: Service["basePrice"],
      ) => (
        <Text strong>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Thời lượng",
      dataIndex:
        "defaultDurationMinutes",
      width: 140,
      align: "center",
      render: (value: number) => (
        <Space size={6}>
          <Clock3 className="h-4 w-4 text-slate-400" />
          {value} phút
        </Space>
      ),
    },
    {
      title: "Yêu cầu bác sĩ",
      dataIndex:
        "requiresDoctorWarning",
      width: 150,
      align: "center",
      render: (value: boolean) => (
        <Tag
          color={
            value ? "orange" : "default"
          }
        >
          {value ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      align: "center",
      render: (
        status: Service["status"],
      ) => (
        <Tag
          color={
            status === "active"
              ? "green"
              : "default"
          }
        >
          {status === "active"
            ? "Hoạt động"
            : "Ngừng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 170,
      align: "center",
      render: (_, record) => (
        <Space size={8}>
          <Button
            title="Xem chi tiết"
            icon={
              <Eye className="h-4 w-4" />
            }
            onClick={() =>
              onView(record)
            }
          />

          <Button
            title="Chỉnh sửa"
            icon={
              <Pencil className="h-4 w-4" />
            }
            onClick={() =>
              onEdit(record)
            }
          />

          <Button
            danger
            title="Xóa"
            icon={
              <Trash2 className="h-4 w-4" />
            }
            onClick={() =>
              onDelete(record)
            }
          />
        </Space>
      ),
    },
  ];

  return (
    <Table<Service>
      rowKey="id"
      className="management-table"
      loading={loading}
      columns={columns}
      dataSource={data}
      tableLayout="fixed"
      scroll={{ x: 1250 }}
      locale={{
        emptyText:
          "Chưa có dịch vụ",
      }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [
          10,
          20,
          50,
          100,
        ],
        showQuickJumper: true,
        showTotal: (
          recordTotal,
          range,
        ) =>
          `Hiển thị ${range[0]} - ${range[1]} trong tổng ${recordTotal} bản ghi`,
        onChange: onPageChange,
      }}
    />
  );
}