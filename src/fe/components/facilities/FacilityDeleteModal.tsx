"use client";

import { Button, Input, Modal } from "antd";
import { Trash2, X } from "lucide-react";

const { TextArea } = Input;

export type FacilityDeleteTarget =
  | { mode: "single"; id: string; name: string }
  | { mode: "selected"; ids: string[]; count: number }
  | null;

type Props = {
  target: FacilityDeleteTarget;
  reason: string;
  reasonError: boolean;
  loading: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function FacilityDeleteModal({
  target,
  reason,
  reasonError,
  loading,
  onReasonChange,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      open={Boolean(target)}
      centered
      width={480}
      title={null}
      footer={null}
      closable={false}
      onCancel={onClose}
      mask={{ closable: !loading }}
    >
      <div className="relative px-2 pb-2 pt-3 text-center">
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          disabled={loading}
          className="absolute right-0 top-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-7 w-7 text-red-600" />
        </div>

        <h3 className="mt-5 text-lg font-bold text-slate-950">
          {target?.mode === "selected" ? "Xóa các cơ sở đã chọn" : "Xóa cơ sở"}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          {target?.mode === "selected"
            ? `Bạn có chắc muốn xóa ${target.count} cơ sở đã chọn?`
            : "Bạn có chắc muốn xóa cơ sở này?"}
        </p>

        {target?.mode === "single" ? (
          <p className="mx-auto mt-2 max-w-[340px] truncate text-sm font-semibold text-slate-800">
            {target.name}
          </p>
        ) : null}

        <div className="mt-5 text-left">
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Lý do xóa <span className="text-red-500">*</span>
          </label>
          <TextArea
            rows={3}
            value={reason}
            status={reasonError ? "error" : undefined}
            disabled={loading}
            placeholder="Nhập lý do xóa cơ sở"
            onChange={(event) => onReasonChange(event.target.value)}
          />
          {reasonError ? (
            <p className="mt-1 text-xs text-red-500">
              Vui lòng nhập lý do xóa cơ sở.
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button size="large" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            danger
            type="primary"
            size="large"
            loading={loading}
            onClick={onConfirm}
          >
            Xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
