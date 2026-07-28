"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Col, Modal, Row, Space, Tag, Typography } from "antd";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  DoorOpen,
  ExternalLink,
  Hash,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import type { Facility } from "@/management/features/facilities/facilities.types";

const { Text, Title } = Typography;
const FACILITY_MESSAGES = RESPONSE_MESSAGES.FACILITY_MANAGEMENT;

type FacilityDetailModalProps = {
  open: boolean;
  facility: Facility | null;
  onClose: () => void;
};

function formatDateTime(value?: string) {
  if (!value) return FACILITY_MESSAGES.NOT_UPDATED;

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

function formatDate(value?: string) {
  if (!value) return FACILITY_MESSAGES.NOT_UPDATED;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN");
}

function getGoogleMapLocation(
  facility: Facility,
) {
  const latitude = Number(facility.latitude);
  const longitude = Number(facility.longitude);

  const hasValidCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!hasValidCoordinates) {
    return null;
  }

  const coordinates = `${latitude},${longitude}`;
  const encodedCoordinates =
    encodeURIComponent(coordinates);

  return {
    latitude,
    longitude,
    coordinates,
    embedUrl:
      `https://www.google.com/maps?q=${encodedCoordinates}` +
      "&hl=vi&z=16&output=embed",
    externalUrl:
      "https://www.google.com/maps/search/" +
      `?api=1&query=${encodedCoordinates}`,
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
            {value || FACILITY_MESSAGES.NOT_UPDATED}
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
  const router = useRouter();
  const fullAddress = facility
    ? [facility.address, facility.ward, facility.city].filter(Boolean).join(", ")
    : "";

  const googleMapLocation = facility
    ? getGoogleMapLocation(facility)
    : null;

  return (
    <Modal
      open={open}
      width={980}
      centered
      title={null}
      closable={false}
      onCancel={onClose}
      mask={{ closable: true }}
      style={{
        maxWidth: "calc(100vw - 32px)",
      }}
      styles={{
        body: {
          height:
            "min(620px, calc(100vh - 190px))",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: 8,
        },
      }}
      footer={
        <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
          <Button
            icon={<DoorOpen className="h-4 w-4" />}
            onClick={() => {
              if (!facility) return;

              const params = new URLSearchParams({
                facilityId: facility.id,
                facilityName: facility.name,
              });

              onClose();
              router.push(`/management/rooms?${params.toString()}`);
            }}
          >
            {FACILITY_MESSAGES.VIEW_ROOMS}
          </Button>

          <Button
            type="primary"
            icon={<X className="h-4 w-4" />}
            onClick={onClose}
          >
            {RESPONSE_MESSAGES.COMMON.CLOSE}
          </Button>
        </div>
      }
    >
      {facility ? (
        <div className="w-full min-w-0 space-y-4 overflow-x-hidden">
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
                  <Tag color="blue">
                    {facility.code || FACILITY_MESSAGES.NO_CODE}
                  </Tag>
                  <Tag color={facility.status === "active" ? "green" : "default"}>
                    {facility.status === "active"
                      ? FACILITY_MESSAGES.ACTIVE_DISPLAY
                      : FACILITY_MESSAGES.SUSPENDED}
                  </Tag>
                  <Tag color={facility.isOpenNow ? "green" : "orange"}>
                    {facility.operatingStatusLabel}
                  </Tag>
                </Space>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card
              size="small"
              className="border-slate-200"
              title="Thông tin cơ sở"
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Hash className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.FACILITY_CODE}
                    value={facility.code}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Phone className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.HOTLINE}
                    value={facility.hotline}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Mail className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.EMAIL}
                    value={facility.email}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.CITY}
                    value={facility.city}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.WARD}
                    value={facility.ward}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.COORDINATES}
                    value={
                      facility.latitude || facility.longitude
                        ? `${facility.latitude || "?"}, ${facility.longitude || "?"}`
                        : FACILITY_MESSAGES.NOT_UPDATED
                    }
                  />
                </Col>
                <Col xs={24}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.FULL_ADDRESS}
                    value={fullAddress}
                  />
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              className="border-slate-200"
              title="Chủ cơ sở"
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<UserRound className="h-4 w-4" />}
                    label="Mã chủ cơ sở"
                    value={facility.ownerId}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<UserRound className="h-4 w-4" />}
                    label="Tên chủ cơ sở"
                    value={facility.ownerName}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Mail className="h-4 w-4" />}
                    label="Email chủ cơ sở"
                    value={facility.ownerEmail}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Phone className="h-4 w-4" />}
                    label="Số điện thoại chủ cơ sở"
                    value={facility.ownerPhone}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<CalendarClock className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.CREATED_AT}
                    value={formatDateTime(facility.createdAt)}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<CalendarClock className="h-4 w-4" />}
                    label={FACILITY_MESSAGES.UPDATED_AT}
                    value={formatDateTime(facility.updatedAt)}
                  />
                </Col>
              </Row>
            </Card>
          </div>

          <Card
            size="small"
            className="border-slate-200"
            title={
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-blue-600" />
                  <span>Vị trí</span>
                </div>

                {googleMapLocation ? (
                  <Button
                    type="link"
                    size="small"
                    href={googleMapLocation.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={
                      <ExternalLink className="h-4 w-4" />
                    }
                  >
                    Mở trên Google Maps
                  </Button>
                ) : null}
              </div>
            }
          >
            {googleMapLocation ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <iframe
                  title={`Vị trí ${facility.name}`}
                  src={googleMapLocation.embedUrl}
                  className="h-[320px] w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <a
                  href={googleMapLocation.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-4 border-t border-slate-200 px-5 py-4 transition hover:bg-blue-50"
                >
                  <div className="min-w-0">
                    <p className="mb-1 truncate text-base font-semibold text-slate-950">
                      {facility.name}
                    </p>

                    <p className="mb-1 break-words text-sm text-slate-600">
                      {fullAddress ||
                        FACILITY_MESSAGES.NOT_UPDATED}
                    </p>

                    <p className="mb-0 text-xs text-slate-400">
                      Tọa độ:{" "}
                      {googleMapLocation.coordinates}
                    </p>
                  </div>

                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </a>
              </div>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                <MapPin className="h-8 w-8 text-slate-300" />

                <Text
                  strong
                  className="mt-3 block text-slate-700"
                >
                  Chưa có vị trí trên bản đồ
                </Text>

                <Text
                  type="secondary"
                  className="mt-1 block"
                >
                  Cơ sở chưa được cập nhật đầy đủ vĩ độ và
                  kinh độ hợp lệ.
                </Text>
              </div>
            )}
          </Card>

          <Card
            size="small"
            className="border-slate-200"
            title="Lịch hoạt động"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {facility.operatingHourGroups.length > 0 ? (
                facility.operatingHourGroups.map((group) => (
                  <div
                    key={group.days.join("-")}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="mb-1 text-sm font-semibold text-slate-900">
                          {group.dayLabel}
                        </p>
                        <p className="mb-0 text-sm text-slate-600">
                          {group.displayTime}
                        </p>
                      </div>
                      <Tag color={group.isClosed ? "default" : "green"}>
                        {group.isClosed ? "Đóng cửa" : "Mở cửa"}
                      </Tag>
                    </div>
                  </div>
                ))
              ) : (
                <Text type="secondary">Chưa cập nhật lịch hoạt động.</Text>
              )}
            </div>
          </Card>

          <Card
            size="small"
            className="border-slate-200"
            title="Ngày đóng cửa đặc biệt"
          >
            {facility.closureDays.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {facility.closureDays.map((closure) => (
                  <div
                    key={closure.id}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-4 w-4 text-amber-700" />
                      <div>
                        <p className="mb-1 font-semibold text-amber-950">
                          {formatDate(closure.closureDate)}
                        </p>
                        <p className="mb-0 text-sm text-amber-800">
                          {closure.reason || "Không có lý do"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">Không có ngày đóng cửa đặc biệt.</Text>
            )}
          </Card>
        </div>
      ) : null}
    </Modal>
  );
}
