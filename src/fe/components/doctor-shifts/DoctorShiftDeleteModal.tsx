"use client";

import { Button, Input, Modal } from "antd";
import { Trash2, X } from "lucide-react";
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import { formatDoctorShiftShortDate } from "@/management/features/doctor-shifts/doctor-shifts.utils";

type Props = {
  shift: DoctorShiftItem | null;
  reason: string;
  loading: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function DoctorShiftDeleteModal({
  shift,
  reason,
  loading,
  onReasonChange,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      open={Boolean(shift)}
      centered
      width={480}
      title={null}
      footer={null}
      closable={false}
      onCancel={onClose}
      mask={{ closable: !loading }}
      className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
      styles={{ body: { padding: 0 } }}
    >
      <div className="relative px-6 pb-6 pt-7 text-center">
        <button
          type="button"
          aria-label="Đóng"
          disabled={loading}
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-7 w-7 text-red-600" />
        </div>

        <h3 className="mt-5 text-lg font-bold text-slate-950">Xóa ca trực?</h3>
        <p className="mt-2 text-sm text-slate-500">
          Nhập lý do xóa. Thao tác này không thể hoàn tác.
        </p>

        {shift ? (
          <div className="mx-auto mt-4 max-w-[350px] rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <p className="mb-0 font-semibold">
              {shift.slotName || shift.slotCode || `Ca trực #${shift.id}`}
            </p>
            <p className="mb-0 mt-1">
              {formatDoctorShiftShortDate(shift.shiftDate)} · {shift.startTime} - {shift.endTime}
            </p>
          </div>
        ) : null}

        <div className="mt-4 text-left">
          <label
            htmlFor="delete-shift-reason"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Lý do xóa
          </label>
          <Input.TextArea
            id="delete-shift-reason"
            rows={3}
            value={reason}
            maxLength={300}
            showCount
            disabled={loading}
            placeholder="Ví dụ: bác sĩ nghỉ đột xuất, phòng bảo trì..."
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button size="large" disabled={loading} onClick={onClose}>
            Hủy
          </Button>
          <Button
            danger
            type="primary"
            size="large"
            loading={loading}
            disabled={!reason.trim()}
            onClick={onConfirm}
          >
            Xóa ca trực
          </Button>
        </div>
      </div>
    </Modal>
  );
}
