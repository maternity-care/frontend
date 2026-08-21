"use client";

import { Button, Descriptions, Flex, Modal, Tag, Typography } from "antd";

import type { ManagementFacilityService } from "@/management/features/services/facility-services/facility-services.types";
import type {
  ManagementService,
  ServiceSaleMode,
  ServiceStatus,
} from "@/management/features/services/services/services.types";

const { Text } = Typography;

const SALE_MODE_LABELS: Record<ServiceSaleMode, string> = {
  standalone: "Bán lẻ",
  package_only: "Chỉ trong gói",
  both: "Bán lẻ và trong gói",
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  active: "Hoạt động",
  inactive: "Ngừng hoạt động",
};

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

type ServiceDetailModalProps = {
  open: boolean;
  service: ManagementService | null;
  serviceTypeName?: string;
  facilityService?: ManagementFacilityService | null;
  showFacilityConfig?: boolean;
  onCancel: () => void;
};

export function ServiceDetailModal({
  open,
  service,
  serviceTypeName,
  facilityService,
  showFacilityConfig = false,
  onCancel,
}: ServiceDetailModalProps) {
  return (
    <Modal
      open={open}
      title="Chi tiết dịch vụ"
      footer={<Button onClick={onCancel}>Đóng</Button>}
      width={720}
      destroyOnHidden
      onCancel={onCancel}
    >
      {service ? (
        <Flex vertical gap={16}>
          <Descriptions
            bordered
            size="small"
            column={2}
            title="Thông tin hệ thống"
          >
            <Descriptions.Item label="Mã dịch vụ">
              <Text code>{service.code || "-"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái hệ thống">
              <Tag color={service.status === "active" ? "green" : "default"}>
                {STATUS_LABELS[service.status]}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Tên dịch vụ" span={2}>
              {service.name}
            </Descriptions.Item>

            <Descriptions.Item label="Loại dịch vụ" span={2}>
              {service.serviceType?.name ?? serviceTypeName ?? "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Hình thức bán">
              <Tag
                color={
                  service.saleMode === "standalone"
                    ? "blue"
                    : service.saleMode === "package_only"
                      ? "purple"
                      : "cyan"
                }
              >
                {SALE_MODE_LABELS[service.saleMode]}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Cho phép chọn bác sĩ">
              {service.allowDoctorSelection ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color="orange">Có</Tag>
                  {service.doctorSpecialty ? (
                    <Tag color="blue">{service.doctorSpecialty}</Tag>
                  ) : null}
                </div>
              ) : (
                <Tag>Không</Tag>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Giá cơ bản">
              {formatCurrency(service.basePrice)}
            </Descriptions.Item>

            <Descriptions.Item label="Thời lượng cơ bản">
              {service.defaultDurationMinutes
                ? `${service.defaultDurationMinutes} phút`
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Mô tả" span={2}>
              {service.description || (
                <Text type="secondary">Không có mô tả</Text>
              )}
            </Descriptions.Item>
          </Descriptions>

          {showFacilityConfig ? (
            <Descriptions
              bordered
              size="small"
              column={2}
              title="Cấu hình tại cơ sở"
            >
              <Descriptions.Item label="Giá tại cơ sở">
                {formatCurrency(facilityService?.price ?? service.basePrice)}
              </Descriptions.Item>

              <Descriptions.Item label="Nguồn giá">
                <Tag color={facilityService ? "green" : "default"}>
                  {facilityService ? "Đã cấu hình" : "Theo giá cơ bản"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Thời lượng tại cơ sở">
                {(
                  facilityService?.durationMinutes ??
                  service.defaultDurationMinutes
                )
                  ? `${
                      facilityService?.durationMinutes ??
                      service.defaultDurationMinutes
                    } phút`
                  : "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Nguồn thời lượng">
                <Tag color={facilityService ? "green" : "default"}>
                  {facilityService ? "Đã cấu hình" : "Theo mặc định"}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái cơ sở" span={2}>
                {facilityService ? (
                  <Tag
                    color={
                      facilityService.status === "active" ? "green" : "default"
                    }
                  >
                    {STATUS_LABELS[facilityService.status]}
                  </Tag>
                ) : (
                  <Flex gap={8} align="center">
                    <Tag
                      color={service.status === "active" ? "green" : "default"}
                    >
                      {STATUS_LABELS[service.status]}
                    </Tag>
                    <Tag>Theo hệ thống</Tag>
                  </Flex>
                )}
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Flex>
      ) : null}
    </Modal>
  );
}
