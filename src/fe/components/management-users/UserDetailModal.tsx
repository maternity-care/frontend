"use client";

import { Avatar, Button, Modal, Space, Tag, Typography } from "antd";
import {
  CalendarDays,
  ContactRound,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { DetailSection } from "./DetailSection";
import { InfoCard } from "./InfoCard";
import {
  User,
  UserStatus,
} from "@/management/features/management-users/management-user.types";

const { Text, Title } = Typography;

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(-2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function renderStatus(status: UserStatus) {
  if (status === "active") return <Tag color="green">Đang hoạt động</Tag>;
  if (status === "locked") return <Tag color="red">Đã khóa</Tag>;
  return <Tag>Ngừng hoạt động</Tag>;
}

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onEdit: (user: User) => void;
}

export function UserDetailModal({ open, user, onClose, onEdit }: Props) {
  return (
    <Modal
      open={open}
      centered
      width={900}
      title={null}
      footer={null}
      onCancel={onClose}
      mask={{ closable: true }}
      styles={{
        body: {
          maxHeight: "calc(100vh - 160px)",
          overflowY: "auto",
          paddingRight: 8,
        },
      }}
    >
      {user ? (
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <Avatar
                size={62}
                className="!bg-pink-500 !text-base !font-semibold"
              >
                {getInitials(user.name)}
              </Avatar>
              <div className="min-w-0">
                <Title level={3} className="!mb-1 !text-slate-950">
                  {user.name}
                </Title>
                <Text type="secondary" className="mb-2 block">
                  {user.email}
                </Text>
                <Space size={8} wrap>
                  {renderStatus(user.status)}
                </Space>
              </div>
            </div>
            <Button
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => onEdit(user)}
            >
              Cập nhật
            </Button>
          </div>

          <DetailSection
            title="Thông tin cá nhân"
            icon={<IdCard className="h-5 w-5" />}
          >
            <InfoCard
              icon={<IdCard className="h-4 w-4" />}
              label="Căn cước công dân"
              value={user.cccd}
            />
            <InfoCard
              icon={<Phone className="h-4 w-4" />}
              label="Số điện thoại"
              value={user.phone}
            />
            <InfoCard
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={user.email}
            />
            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Ngày sinh"
              value={formatDate(user.dateOfBirth)}
            />
          </DetailSection>

          <DetailSection title="Địa chỉ" icon={<MapPin className="h-5 w-5" />}>
            <InfoCard
              icon={<MapPin className="h-4 w-4" />}
              label="Địa chỉ"
              value={user.address}
            />
            <InfoCard
              icon={<MapPin className="h-4 w-4" />}
              label="Tỉnh / Thành phố"
              value={user.province}
            />
            <InfoCard
              icon={<MapPin className="h-4 w-4" />}
              label="Phường / Xã"
              value={user.ward}
            />
          </DetailSection>

          <DetailSection
            title="Liên hệ khẩn cấp"
            icon={<ContactRound className="h-5 w-5" />}
          >
            <InfoCard
              icon={<ContactRound className="h-4 w-4" />}
              label="Người liên hệ"
              value={user.emergencyContactName}
            />
            <InfoCard
              icon={<Phone className="h-4 w-4" />}
              label="SĐT liên hệ"
              value={user.emergencyContactPhone}
            />
          </DetailSection>

          <DetailSection
            title="Thông tin hệ thống"
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            <InfoCard
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Trạng thái"
              value={renderStatus(user.status)}
            />
            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Ngày tạo"
              value={formatDateTime(user.createdAt)}
            />
            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Cập nhật gần nhất"
              value={formatDateTime(user.updatedAt)}
            />
          </DetailSection>

          <div className="mt-6 flex justify-end">
            <Button
              type="primary"
              icon={<X className="h-4 w-4" />}
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
