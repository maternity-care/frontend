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
  Facility,
} from "@/management/features/facilities/facilities.types";

import type {
  MaternityPackage,
  PackageService,
} from "@/management/features/services/services.types";

import {
  formatCurrency,
  getPackageStatusColor,
  getPackageStatusLabel,
  getServiceTypeLabel,
} from "../services.ui";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Text } = Typography;

interface Props {
  open: boolean;
  loading?: boolean;
  data?: MaternityPackage;
  packageServices: PackageService[];
  packageServicesLoading?: boolean;
  facilities: Facility[];
  onClose: () => void;
  onAddService: () => void;
  onEditService: (
    record: PackageService,
  ) => void;
  onDeleteService: (
    record: PackageService,
  ) => void;
}

export function MaternityPackageDetailModal({
  open,
  loading = false,
  data,
  packageServices,
  packageServicesLoading = false,
  facilities,
  onClose,
  onAddService,
  onEditService,
  onDeleteService,
}: Props) {
  const facilityNames = new Map(
    facilities.map((facility) => [
      facility.id,
      facility.name,
    ]),
  );

  const columns: ColumnsType<PackageService> =
    [
      {
        title: RESPONSE_MESSAGES.HOME.SERVICES_SECTION.TAG,
        key: "service",
        width: 260,
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
        width: 130,
        align: "center",
        render: (
          value: PackageService["serviceType"],
        ) => (
          <Tag color="blue">
            {getServiceTypeLabel(value)}
          </Tag>
        ),
      },
      {
        title: RESPONSE_MESSAGES.SERVICES.MODAL.includedQuantity,
        dataIndex:
          "includedQuantity",
        width: 90,
        align: "center",
      },
      {
        title: RESPONSE_MESSAGES.COMMON.requirement,
        key: "requirement",
        width: 120,
        align: "center",
        render: (_, record) => (
          <Tag
            color={
              record.isRequired
                ? "red"
                : "cyan"
            }
          >
            {record.isRequired
              ? RESPONSE_MESSAGES.COMMON.status.required
              : RESPONSE_MESSAGES.COMMON.status.optional}
          </Tag>
        ),
      },
      {
        title: RESPONSE_MESSAGES.SERVICES.MODAL.basis_for_application,
        key: "scope",
        width: 260,
        render: (_, record) => {
          if (
            record.allowedFacilityScope ===
            "all"
          ) {
            return (
              <Tag color="green">
                {RESPONSE_MESSAGES.SERVICES.MODAL.all_facility}
              </Tag>
            );
          }

          return (
            <Space wrap size={[4, 4]}>
              {record.facilityIds.map(
                (facilityId) => (
                  <Tag key={facilityId}>
                    {facilityNames.get(
                      facilityId,
                    ) ??
                      `${RESPONSE_MESSAGES.SERVICES.MODAL.facility} ${facilityId}`}
                  </Tag>
                ),
              )}
            </Space>
          );
        },
      },
      {
        title: RESPONSE_MESSAGES.COMMON.ACTIONS,
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
                onEditService(record)
              }
            />

            <Button
              danger
              icon={
                <Trash2 className="h-4 w-4" />
              }
              onClick={() =>
                onDeleteService(record)
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
      width={1100}
      destroyOnHidden
      footer={null}
      title={RESPONSE_MESSAGES.SERVICES.MODAL.service_package_details}
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
              <Descriptions.Item label={RESPONSE_MESSAGES.SERVICES.MODAL.package_id}>
                <Text copyable>
                  {data.code}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label={RESPONSE_MESSAGES.SERVICES.MODAL.package_name}>
                <Text strong>
                  {data.name}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label={RESPONSE_MESSAGES.SERVICES.MODAL.package_price}>
                {formatCurrency(
                  data.price,
                )}
              </Descriptions.Item>

              <Descriptions.Item label={RESPONSE_MESSAGES.SERVICES.MODAL.package_duration}>
                {data.durationDays
                  ? `${data.durationDays} ${RESPONSE_MESSAGES.COMMON.DATE}`
                  : "Chưa quy định"}
              </Descriptions.Item>

              <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.status.prioritize}>
                {data.priorityLevel}
              </Descriptions.Item>

              <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.STATUS}>
                <Tag
                  color={getPackageStatusColor(
                    data.status,
                  )}
                >
                  {getPackageStatusLabel(
                    data.status,
                  )}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item
                label={RESPONSE_MESSAGES.COMMON.description}
                span={2}
              >
                {data.description ||
                  RESPONSE_MESSAGES.COMMON.no_description}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="mb-0 font-semibold">
                    Dịch vụ trong gói
                  </p>

                  <p className="mb-0 text-sm text-slate-500">
                    Tổng cộng{" "}
                    {packageServices.length}{" "}
                    dịch vụ
                  </p>
                </div>

                <Button
                  type="primary"
                  icon={
                    <Plus className="h-4 w-4" />
                  }
                  onClick={
                    onAddService
                  }
                >
                  Thêm dịch vụ
                </Button>
              </div>

              <Table<PackageService>
                rowKey="id"
                size="small"
                loading={
                  packageServicesLoading
                }
                columns={columns}
                dataSource={
                  packageServices
                }
                pagination={false}
                scroll={{ x: 950 }}
                locale={{
                  emptyText:
                    "Gói chưa có dịch vụ nào",
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