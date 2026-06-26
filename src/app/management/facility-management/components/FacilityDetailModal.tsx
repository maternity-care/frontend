//src/app/management/facility-management/components/FacilityDetailModal.tsx
"use client";

import { Button, Card, Col, Modal, Row, Space, Tag, Typography } from "antd";
import {
  Building2,
  CalendarClock,
  Clock3,
  Hash,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import type { Facility } from "@/management/features/facilities/facilities.types";

const { Text, Title } = Typography;

type FacilityDetailModalProps = {
  open: boolean;
  facility: Facility | null;
  onClose: () => void;
};

function formatDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function splitWorkingHours(value?: string) {
  if (!value || value === "Chưa cập nhật") {
    return {
      openTime: "Chưa cập nhật",
      closeTime: "Chưa cập nhật",
    };
  }

  const [openTime, closeTime] = value.split("-").map((item) => item.trim());

  return {
    openTime: openTime || "Chưa cập nhật",
    closeTime: closeTime || "Chưa cập nhật",
  };
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
            {label}
          </p>
          <div className="break-words text-sm font-medium text-slate-900">
            {value || "Chưa cập nhật"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FacilityDetailModal({
  open,
  facility,
  onClose,
}: FacilityDetailModalProps) {
  const fullAddress = facility
    ? [facility.address, facility.ward, facility.district, facility.city]
        .filter(Boolean)
        .join(", ")
    : "";

  const { openTime, closeTime } = splitWorkingHours(facility?.workingHours);

  return (
    <Modal
      open={open}
      width="min(1280px, calc(100vw - 48px))"
      centered
      title={null}
      footer={
        <div className="flex justify-end border-t border-slate-200 pt-3">
          <Button
            type="primary"
            icon={<X className="h-4 w-4" />}
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      }
      closable={false}
      onCancel={onClose}
      mask={{ closable: true }}
      styles={{
        body: {
          paddingBottom: 12,
        },
      }}
    >
      {facility ? (
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Building2 className="h-6 w-6" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <Title level={3} className="!mb-1 !text-slate-950">
                  {facility.name}
                </Title>

                <Space size={8} wrap>
                  <Tag color="blue">{facility.code || "Chưa có mã"}</Tag>

                  {facility.status === "active" ? (
                    <Tag color="green">Đang hoạt động</Tag>
                  ) : (
                    <Tag color="default">Tạm ngưng</Tag>
                  )}
                </Space>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card
              size="small"
              className="border-slate-200"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Thông tin cơ sở
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    Liên hệ, mã cơ sở và địa chỉ hành chính.
                  </p>
                </div>
              }
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Hash className="h-4 w-4" aria-hidden="true" />}
                    label="Mã cơ sở"
                    value={facility.code}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Phone className="h-4 w-4" aria-hidden="true" />}
                    label="Hotline"
                    value={facility.hotline}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                    label="Email"
                    value={facility.email}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label="Tỉnh/Thành phố"
                    value={facility.city}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label="Quận/Huyện"
                    value={facility.district}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label="Phường/Xã"
                    value={facility.ward}
                  />
                </Col>

                <Col xs={24}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label="Địa chỉ đầy đủ"
                    value={fullAddress}
                  />
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              className="border-slate-200"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Thời gian & hệ thống
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    Giờ mở cửa, giờ đóng cửa, tọa độ và lịch sử cập nhật.
                  </p>
                </div>
              }
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <InfoItem
                    icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                    label="Giờ hoạt động"
                    value={facility.workingHours}
                  />
                </Col>

                <Col xs={24} md={8}>
                  <InfoItem
                    icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                    label="Giờ mở cửa"
                    value={openTime}
                  />
                </Col>

                <Col xs={24} md={8}>
                  <InfoItem
                    icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                    label="Giờ đóng cửa"
                    value={closeTime}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label="Tọa độ"
                    value={
                      facility.latitude || facility.longitude
                        ? `${facility.latitude || "?"}, ${
                            facility.longitude || "?"
                          }`
                        : "Chưa cập nhật"
                    }
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    }
                    label="Ngày tạo"
                    value={formatDateTime(facility.createdAt)}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    }
                    label="Cập nhật lần cuối"
                    value={formatDateTime(facility.updatedAt)}
                  />
                </Col>

                <Col xs={24}>
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                    <Text className="text-xs font-semibold uppercase text-slate-400">
                      Dịch vụ nổi bật
                    </Text>
                    <p className="mb-0 mt-1 text-sm text-slate-700">
                      {facility.featuredServices || "Chưa cập nhật"}
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}