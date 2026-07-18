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
  Box,
  Clock3,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  MaternityPackage,
} from "@/management/features/services/services.types";

import {
  formatCurrency,
  getPackageStatusColor,
  getPackageStatusLabel,
} from "../services.ui";

const { Text } = Typography;

interface Props {
  data: MaternityPackage[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
  onView: (
    record: MaternityPackage,
  ) => void;
  onEdit: (
    record: MaternityPackage,
  ) => void;
  onDelete: (
    record: MaternityPackage,
  ) => void;
}

export function MaternityPackagesTable({
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
  const columns: ColumnsType<MaternityPackage> =
    [
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
        title: "Gói dịch vụ",
        key: "package",
        width: 310,
        render: (_, record) => (
          <Space size={10}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-600 text-white">
              <Box className="h-4 w-4" />
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
        title: "Giá gói",
        dataIndex: "price",
        width: 160,
        align: "right",
        render: (
          value: MaternityPackage["price"],
        ) => (
          <Text strong>
            {formatCurrency(value)}
          </Text>
        ),
      },
      {
        title: "Thời hạn",
        dataIndex: "durationDays",
        width: 140,
        align: "center",
        render: (
          value: number | null,
        ) =>
          value ? (
            <Space size={6}>
              <Clock3 className="h-4 w-4 text-slate-400" />
              {value} ngày
            </Space>
          ) : (
            "—"
          ),
      },
      {
        title: "Ưu tiên",
        dataIndex: "priorityLevel",
        width: 100,
        align: "center",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 140,
        align: "center",
        render: (
          status: MaternityPackage["status"],
        ) => (
          <Tag
            color={getPackageStatusColor(
              status,
            )}
          >
            {getPackageStatusLabel(
              status,
            )}
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
              icon={
                <Eye className="h-4 w-4" />
              }
              onClick={() =>
                onView(record)
              }
            />

            <Button
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={() =>
                onEdit(record)
              }
            />

            <Button
              danger
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
    <Table<MaternityPackage>
      rowKey="id"
      className="management-table"
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 1050 }}
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
        onChange: onPageChange,
      }}
    />
  );
}