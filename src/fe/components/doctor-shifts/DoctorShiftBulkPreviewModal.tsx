"use client";

import { Alert, Button, Modal, Tag, Typography } from "antd";
import { AlertTriangle, CheckCircle2, Eye, X } from "lucide-react";

const { Text, Title } = Typography;

type Props = {
  open: boolean;
  totalCandidates: number;
  valid: number;
  skipped: number;
  conflicted: number;
  issues: string[];
  canConfirm: boolean;
  confirmLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function DoctorShiftBulkPreviewModal({
  open,
  totalCandidates,
  valid,
  skipped,
  conflicted,
  issues,
  canConfirm,
  confirmLoading,
  onClose,
  onConfirm,
}: Props) {
  const hasInvalidItems = skipped > 0 || conflicted > 0 || issues.length > 0;
  const hasValidItems = valid > 0;

  return (
    <Modal
      open={open}
      centered
      width={920}
      title={null}
      footer={null}
      closable={false}
      destroyOnHidden
      onCancel={onClose}
      mask={{ closable: !confirmLoading }}
      styles={{ body: { maxHeight: "84vh", overflow: "hidden" } }}
    >
      <div className="relative border-b border-slate-200 pb-4 pr-12">
        <button
          type="button"
          aria-label="Đóng"
          disabled={confirmLoading}
          onClick={onClose}
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              hasInvalidItems ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
            }`}
          >
            {hasInvalidItems ? <AlertTriangle className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </span>
          <div>
            <Title level={4} className="!mb-1 !text-slate-950">
              Xem trước lịch trực 1 tuần
            </Title>
            <Text type="secondary">
              Kiểm tra lịch trực dự kiến trong 7 ngày trước khi xác nhận lưu vào hệ thống.
            </Text>
          </div>
        </div>
      </div>

      <div
        className="mt-4 pr-3"
        style={{
          maxHeight: "calc(84vh - 190px)",
          overflowY: "auto",
          scrollbarGutter: "stable",
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Tổng dự kiến", totalCandidates, "border-slate-200 bg-slate-50", "text-slate-950"],
            ["Hợp lệ", valid, "border-emerald-200 bg-emerald-50", "text-emerald-800"],
            ["Bị bỏ qua", skipped, "border-amber-200 bg-amber-50", "text-amber-800"],
            ["Bị trùng", conflicted, "border-red-200 bg-red-50", "text-red-800"],
          ].map(([label, value, boxClass, valueClass]) => (
            <div key={String(label)} className={`rounded-xl border p-4 ${boxClass}`}>
              <Text type="secondary" className="block text-xs font-semibold uppercase">
                {label}
              </Text>
              <div className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</div>
            </div>
          ))}
        </div>

        {hasInvalidItems ? (
          <div className="mt-4">
            <Alert
              type={hasValidItems ? "warning" : "error"}
              showIcon
              title={hasValidItems ? `Có thể tạo ${valid} ca trực hợp lệ` : "Không có ca trực hợp lệ để tạo"}
              description={
                hasValidItems
                  ? "Chỉ các ca hợp lệ được tạo. Ca bị trùng và ca bị bỏ qua sẽ không được lưu. Bạn vẫn có thể quay lại chỉnh sửa trước khi xác nhận."
                  : "Tất cả ca dự kiến đều bị trùng hoặc bị bỏ qua. Hãy quay lại chỉnh sửa phân công."
              }
            />

            <div className="mt-4 flex flex-col gap-3">
              {issues.length > 0 ? (
                issues.map((issue, index) => (
                  <div key={`${index}-${issue}`} className="rounded-xl border border-red-200 bg-red-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <Tag color="red">Lỗi {index + 1}</Tag>
                      <Text className="leading-6 text-slate-800">{issue}</Text>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <Text className="text-slate-800">Các ca không hợp lệ sẽ tự động bị bỏ qua khi tạo lịch.</Text>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Alert
            className="mt-4"
            type="success"
            showIcon
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Toàn bộ lịch dự kiến đều hợp lệ"
            description="Bạn có thể xác nhận để lưu lịch trực của tuần này vào hệ thống."
          />
        )}
      </div>

      <div className="mt-4 flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row">
        <Button disabled={confirmLoading} onClick={onClose}>
          Quay lại chỉnh sửa
        </Button>
        {canConfirm && hasValidItems ? (
          <Button
            type="primary"
            loading={confirmLoading}
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => void onConfirm()}
          >
            {hasInvalidItems ? `Tạo ${valid} ca hợp lệ` : "Xác nhận tạo lịch"}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
