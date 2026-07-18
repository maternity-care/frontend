"use client";

import {
  Button,
  Descriptions,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";

import type {
  ColumnsType,
} from "antd/es/table";

import {
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import type {
  FacilityService,
  Service,
} from "@/management/features/services/services.types";

import {
  formatCurrency,
  getServiceTypeLabel,
} from "../services.ui";

const { Text } = Typography;

interface Props {
  open: boolean;
  loading?: boolean;
  data?: Service;
  assignments: FacilityService[];
  assignmentsLoading?: boolean;
  onClose: () => void;
  onAddFacility: () => void;
  onEditFacility: (
    record: FacilityService,
  ) => void;
  onDeleteFacility: (
    record: FacilityService,
  ) => void;
}

export function ServiceDetailModal({
  open,
  loading = false,
  data,
  assignments,
  assignmentsLoading = false,
  onClose,
  onAddFacility,
  onEditFacility,
  onDeleteFacility,
}: Props) {
  const columns: ColumnsType<FacilityService> =
    [
      {
        title: "Cơ sở",
        key: "facility",
        width: 260,
        render: (_, record) => (
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
        ),
      },
      {
        title: "Giá",
        dataIndex: "price",
        width: 150,
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
        title: "Thời lượng",
        dataIndex: "durationMinutes",
        width: 120,
        align: "center",
        render: (value: number) =>
          `${value} phút`,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 140,
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
              ? "Đang cung cấp"
              : "Ngừng cung cấp"}
          </Tag>
        ),
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        width: 110,
        align: "center",
        render: (_, record) => (
          <Space size={6}>
            <Button
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={() =>
                onEditFacility(record)
              }
            />

            <Button
              danger
              icon={
                <Trash2 className="h-4 w-4" />
              }
              onClick={() =>
                onDeleteFacility(record)
              }
            />
          </Space>
        ),
      },
    ];

  return (
    <Modal
      open={open}
      centered
      width={1050}
      destroyOnHidden
      title="Chi tiết dịch vụ"
      footer={null}
      onCancel={onClose}
    >
      <Spin spinning={loading}>
        {data ? (
          <div className="flex flex-col gap-6">
            <Descriptions
              bordered
              size="small"
              column={2}
            >
              <Descriptions.Item label="Mã">
                <Text copyable>
                  {data.code}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Tên">
                <Text strong>
                  {data.name}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Loại">
                <Tag color="blue">
                  {getServiceTypeLabel(
                    data.serviceType,
                  )}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Giá cơ bản">
                {formatCurrency(
                  data.basePrice,
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Thời lượng mặc định">
                {
                  data.defaultDurationMinutes
                }{" "}
                phút
              </Descriptions.Item>

              <Descriptions.Item label="Yêu cầu bác sĩ">
                {data.requiresDoctorWarning
                  ? "Có"
                  : "Không"}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                <Tag
                  color={
                    data.status ===
                    "active"
                      ? "green"
                      : "default"
                  }
                >
                  {data.status ===
                  "active"
                    ? "Hoạt động"
                    : "Ngừng hoạt động"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item
                label="Mô tả"
                span={2}
              >
                {data.description ||
                  "Chưa có mô tả"}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="mb-0 font-semibold">
                    Các cơ sở đang cung cấp
                  </p>

                  <p className="mb-0 text-sm text-slate-500">
                    Tổng cộng{" "}
                    {assignments.length} cơ sở
                  </p>
                </div>

                <Button
                  type="primary"
                  icon={
                    <Plus className="h-4 w-4" />
                  }
                  onClick={
                    onAddFacility
                  }
                >
                  Gán vào cơ sở
                </Button>
              </div>

              <Table<FacilityService>
                rowKey="id"
                size="small"
                loading={
                  assignmentsLoading
                }
                columns={columns}
                dataSource={assignments}
                pagination={false}
                scroll={{ x: 800 }}
                locale={{
                  emptyText:
                    "Dịch vụ chưa được gán vào cơ sở nào",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500">
            Không có dữ liệu
          </div>
        )}
      </Spin>
    </Modal>
  );
}