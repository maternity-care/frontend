"use client";

import {
  Button,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  Building2,
  CalendarClock,
  Clock3,
  Moon,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type {
  ShiftSlot,
} from "@/management/features/shift-slots/shift-slots.types";

const { Text, Title } = Typography;

type ShiftSlotDetailModalProps = {
  open: boolean;
  slot: ShiftSlot | null;
  loading?: boolean;
  onClose: () => void;
  onEdit: (slot: ShiftSlot) => void;
  onDelete: (slot: ShiftSlot) => void;
};

function renderStatus(
  status: ShiftSlot["status"],
) {
  return status === "active" ? (
    <Tag color="green">Hoạt động</Tag>
  ) : (
    <Tag color="red">Ngừng hoạt động</Tag>
  );
}

function formatDateTime(value: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ShiftSlotDetailModal({
  open,
  slot,
  loading = false,
  onClose,
  onEdit,
  onDelete,
}: ShiftSlotDetailModalProps) {
  return (
    <Modal
      open={open}
      centered
      width={760}
      title={null}
      footer={null}
      onCancel={onClose}
      mask={{
        closable: !loading,
      }}
    >
      {slot ? (
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 pr-10 sm:flex-row sm:items-start sm:pr-12">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <CalendarClock className="h-6 w-6" />
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Title
                    level={3}
                    className="!mb-0 !text-slate-950"
                  >
                    {slot.name}
                  </Title>

                  {renderStatus(slot.status)}
                </div>

                <Text
                  type="secondary"
                  className="mt-1 block"
                >
                  {slot.code ||
                    `Khung ca #${slot.id}`}
                </Text>
              </div>
            </div>

            <Space size={8} wrap>
              <Button
                icon={
                  <Pencil className="h-4 w-4" />
                }
                onClick={() => onEdit(slot)}
              >
                Cập nhật
              </Button>

              <Button
                danger
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={() => onDelete(slot)}
              >
                Xóa
              </Button>
            </Space>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-500" />

                <p className="mb-0 text-xs font-semibold uppercase text-slate-500">
                  Thời gian
                </p>
              </div>

              <p className="mb-0 text-lg font-semibold text-slate-950">
                {slot.startTime} - {slot.endTime}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Moon className="h-4 w-4 text-slate-500" />

                <p className="mb-0 text-xs font-semibold uppercase text-slate-500">
                  Ca qua đêm
                </p>
              </div>

              <p className="mb-0 text-lg font-semibold text-slate-950">
                {slot.isOvernight
                  ? "Có"
                  : "Không"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-500" />

              <p className="mb-0 font-semibold text-slate-950">
                Cơ sở áp dụng
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <Text
                strong
                className="block text-blue-950"
              >
                {slot.facilityName ||
                  "Chưa cập nhật tên cơ sở"}
              </Text>

              <Text className="mt-1 block text-sm text-blue-700">
                {slot.facilityCode ||
                  `Facility ID: ${slot.facilityId}`}
              </Text>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Ngày tạo
              </p>

              <p className="mb-0 text-sm font-medium text-slate-800">
                {formatDateTime(slot.createdAt)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Cập nhật lần cuối
              </p>

              <p className="mb-0 text-sm font-medium text-slate-800">
                {formatDateTime(slot.updatedAt)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
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