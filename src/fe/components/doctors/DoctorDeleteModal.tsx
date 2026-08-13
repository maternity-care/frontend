"use client";

import { Button, Modal } from "antd";
import { Trash2, X } from "lucide-react";
import type { Doctor } from "@/management/features/doctors/doctors.types";

type Props = {
  doctor: Doctor | null;
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DoctorDeleteModal({
  doctor,
  open,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      open={open && Boolean(doctor)}
      centered
      width={456}
      title={null}
      footer={null}
      closable={false}
      onCancel={() => {
        if (!loading) onCancel();
      }}
      mask={{ closable: !loading }}
      className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
      styles={{ body: { padding: 0 } }}
    >
      <div className="relative px-6 pb-6 pt-7 text-center">
        <button
          type="button"
          aria-label="Đóng"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-7 w-7 text-red-600" />
        </div>

        <h3 className="mt-5 text-lg font-bold text-slate-950">Xóa bác sĩ?</h3>
        <p className="mt-2 text-sm text-slate-500">
          Hồ sơ bác sĩ sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.
        </p>

        {doctor ? (
          <div className="mx-auto mt-4 max-w-[350px] rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <p className="mb-0 font-semibold">{doctor.name}</p>
            <p className="mb-0 mt-1">
              {doctor.title || "Bác sĩ"} · {doctor.specialty || "Chưa cập nhật chuyên khoa"}
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button size="large" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button danger type="primary" size="large" loading={loading} onClick={onConfirm}>
            Xóa bác sĩ
          </Button>
        </div>
      </div>
    </Modal>
  );
}