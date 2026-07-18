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
  Building2,
  Clock3,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  FacilityService,
} from "@/management/features/services/services.types";

import {
  formatCurrency,
  getServiceTypeLabel,
} from "../services.ui";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Text } = Typography;

interface Props {
  data: FacilityService[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
  onView: (
    record: FacilityService,
  ) => void;
  onEdit: (
    record: FacilityService,
  ) => void;
  onDelete: (
    record: FacilityService,
  ) => void;
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
}: Props) {
  const columns: ColumnsType<FacilityService> =
    [
      {
        title: RESPONSE_MESSAGES.COMMON.STT,
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
        title: RESPONSE_MESSAGES.SERVICES.MODAL.facility,
        key: "facility",
        width: 250,
        render: (_, record) => (
          <Space size={10}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
              <Building2 className="h-4 w-4" />
            </span>

            <div>
              <Text strong>
                {record.facilityName}
              </Text>

              <div>
                <Text
                  type="secondary"
                  className="text-xs"
                >
                  {record.facilityCode}
                </Text>
              </div>
            </div>
          </Space>
        ),
      },
      {
        title: RESPONSE_MESSAGES.HOME.SERVICES_SECTION.TAG,
        key: "service",
        width: 280,
        render: (_, record) => (
          <div>
            <Text strong>
              {record.serviceName}
            </Text>

            <div>
              <Text
                type="secondary"
                className="text-xs"
              >
                {record.serviceCode}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: RESPONSE_MESSAGES.COMMON.type,
        dataIndex: "serviceType",
        width: 150,
        align: "center",
        render: (
          value: FacilityService["serviceType"],
        ) => (
          <Tag color="blue">
            {getServiceTypeLabel(value)}
          </Tag>
        ),
      },
      {
        title: RESPONSE_MESSAGES.COMMON.price,
        dataIndex: "price",
        width: 160,
        align: "right",
        render: (
          value: FacilityService["price"],
        ) => (
          <Text strong>
            {formatCurrency(value)}
          </Text>
        ),
      },
      {
        title: RESPONSE_MESSAGES.SERVICES.MODAL.duration,
        dataIndex: "durationMinutes",
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
        title: RESPONSE_MESSAGES.COMMON.STATUS,
        dataIndex: "status",
        width: 150,
        align: "center",
        render: (
          status: FacilityService["status"],
        ) => (
          <Tag
            color={
              status === "available"
                ? "green"
                : "default"
            }
          >
            {status === "available"
              ? RESPONSE_MESSAGES.COMMON.status.available
              : RESPONSE_MESSAGES.COMMON.status.unavailable}
          </Tag>
        ),
      },
      {
        title: RESPONSE_MESSAGES.FACILITY_MANAGEMENT.ACTIONS,
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
    <Table<FacilityService>
      rowKey="id"
      className="management-table"
      loading={loading}
      columns={columns}
      dataSource={data}
      tableLayout="fixed"
      scroll={{ x: 1250 }}
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