"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Col,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  Building2,
  CalendarClock,
  DoorOpen,
  Hash,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import type { Facility } from "@/management/features/facilities/facilities.types";
import {
  formatFacilityDateTime,
  getFacilityStatusText,
  getGoogleMapLocation,
} from "./facility-form.shared";
import { FacilityMapPreview } from "./FacilityMapPreview";

const { Text, Title } = Typography;

type Props = {
  open: boolean;
  facility: Facility | null;
  onClose: () => void;
};

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

export function FacilityDetailModal({ open, facility, onClose }: Props) {
  const router = useRouter();
  const fullAddress = facility
    ? [facility.address, facility.ward, facility.city]
        .filter(Boolean)
        .join(", ")
    : "";
  const mapLocation = facility
    ? getGoogleMapLocation(facility.latitude, facility.longitude)
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
      style={{ maxWidth: "calc(100vw - 32px)" }}
      styles={{
        body: {
          height: "min(620px, calc(100vh - 190px))",
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
            Xem phòng khám
          </Button>
          <Button
            type="primary"
            icon={<X className="h-4 w-4" />}
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      }
    >
      {facility ? (
        <div className="w-full min-w-0 space-y-4 overflow-x-hidden">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <Title level={3} className="!mb-1 !text-slate-950">
                  {facility.name}
                </Title>
                <Space size={8} wrap>
                  <Tag color="blue">{facility.code}</Tag>
                  <Tag color={facility.status === "active" ? "green" : "default"}>
                    {getFacilityStatusText(facility.status)}
                  </Tag>
                  <Tag color={facility.isOpenNow ? "green" : "orange"}>
                    {facility.operatingStatusLabel}
                  </Tag>
                </Space>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card size="small" className="border-slate-200" title="Thông tin cơ sở">
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <InfoItem icon={<Hash className="h-4 w-4" />} label="Mã cơ sở" value={facility.code} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<Phone className="h-4 w-4" />} label="Hotline" value={facility.hotline} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={facility.email} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<MapPin className="h-4 w-4" />} label="Tỉnh/Thành phố" value={facility.city} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<MapPin className="h-4 w-4" />} label="Phường/Xã" value={facility.ward} />
                </Col>
                <Col xs={24}>
                  <InfoItem icon={<MapPin className="h-4 w-4" />} label="Địa chỉ đầy đủ" value={fullAddress} />
                </Col>
              </Row>
            </Card>

            <Card size="small" className="border-slate-200" title="Chủ cơ sở">
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <InfoItem icon={<UserRound className="h-4 w-4" />} label="Mã chủ cơ sở" value={facility.ownerId} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<UserRound className="h-4 w-4" />} label="Tên chủ cơ sở" value={facility.ownerName} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<Mail className="h-4 w-4" />} label="Email chủ cơ sở" value={facility.ownerEmail} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<Phone className="h-4 w-4" />} label="Số điện thoại chủ cơ sở" value={facility.ownerPhone} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<CalendarClock className="h-4 w-4" />} label="Ngày tạo" value={formatFacilityDateTime(facility.createdAt)} />
                </Col>
                <Col xs={24} md={12}>
                  <InfoItem icon={<CalendarClock className="h-4 w-4" />} label="Cập nhật" value={formatFacilityDateTime(facility.updatedAt)} />
                </Col>
              </Row>
            </Card>
          </div>

          <Card size="small" className="border-slate-200">
            <FacilityMapPreview
              name={facility.name}
              address={fullAddress}
              location={mapLocation}
              height={320}
            />
          </Card>

          <Card size="small" className="border-slate-200" title="Lịch hoạt động">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {facility.operatingHourGroups.length ? (
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
        </div>
      ) : null}
    </Modal>
  );
}
