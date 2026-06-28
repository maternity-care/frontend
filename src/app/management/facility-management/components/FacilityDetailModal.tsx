//src/app/management/facility-management/components/FacilityDetailModal.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Col, Modal, Row, Space, Tag, Typography } from "antd";
import {
  Building2,
  CalendarClock,
  Clock3,
  DoorOpen,
  Hash,
  Mail,
  MapPin,
  Phone,
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

  return date.toLocaleString(FACILITY_MESSAGES.DATE_TIME_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function splitWorkingHours(value?: string) {
  if (!value || value === FACILITY_MESSAGES.NOT_UPDATED) {
    return {
      openTime: FACILITY_MESSAGES.NOT_UPDATED,
      closeTime: FACILITY_MESSAGES.NOT_UPDATED,
    };
  }

  const [openTime, closeTime] = value.split("-").map((item) => item.trim());

  return {
    openTime: openTime || FACILITY_MESSAGES.NOT_UPDATED,
    closeTime: closeTime || FACILITY_MESSAGES.NOT_UPDATED,
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
              router.push(
                `/management/clinic-room-management?${params.toString()}`,
              );
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
                  <Tag color="blue">
                    {facility.code || FACILITY_MESSAGES.NO_CODE}
                  </Tag>

                  {facility.status === "active" ? (
                    <Tag color="green">
                      {FACILITY_MESSAGES.ACTIVE_DISPLAY}
                    </Tag>
                  ) : (
                    <Tag color="default">{FACILITY_MESSAGES.SUSPENDED}</Tag>
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
                    {FACILITY_MESSAGES.DETAIL_CONTACT_SECTION}
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    {FACILITY_MESSAGES.FACILITY_INFO_DETAIL_DESCRIPTION}
                  </p>
                </div>
              }
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Hash className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.FACILITY_CODE}
                    value={facility.code}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Phone className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.HOTLINE}
                    value={facility.hotline}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.EMAIL}
                    value={facility.email}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.CITY}
                    value={facility.city}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.DISTRICT}
                    value={facility.district}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.WARD}
                    value={facility.ward}
                  />
                </Col>

                <Col xs={24}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.FULL_ADDRESS}
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
                    {FACILITY_MESSAGES.DETAIL_SYSTEM_SECTION}
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    {FACILITY_MESSAGES.SYSTEM_TIME_DESCRIPTION}
                  </p>
                </div>
              }
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <InfoItem
                    icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.WORKING_HOURS}
                    value={facility.workingHours}
                  />
                </Col>

                <Col xs={24} md={8}>
                  <InfoItem
                    icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.OPEN_TIME}
                    value={openTime}
                  />
                </Col>

                <Col xs={24} md={8}>
                  <InfoItem
                    icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.CLOSE_TIME}
                    value={closeTime}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                    label={FACILITY_MESSAGES.COORDINATES}
                    value={
                      facility.latitude || facility.longitude
                        ? `${facility.latitude || FACILITY_MESSAGES.UNKNOWN_VALUE}, ${
                            facility.longitude || FACILITY_MESSAGES.UNKNOWN_VALUE
                          }`
                        : FACILITY_MESSAGES.NOT_UPDATED
                    }
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    }
                    label={FACILITY_MESSAGES.CREATED_AT}
                    value={formatDateTime(facility.createdAt)}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <InfoItem
                    icon={
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    }
                    label={FACILITY_MESSAGES.UPDATED_AT}
                    value={formatDateTime(facility.updatedAt)}
                  />
                </Col>

                <Col xs={24}>
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                    <Text className="text-xs font-semibold uppercase text-slate-400">
                      {FACILITY_MESSAGES.FEATURED_SERVICES}
                    </Text>
                    <p className="mb-0 mt-1 text-sm text-slate-700">
                      {facility.featuredServices || FACILITY_MESSAGES.NOT_UPDATED}
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
