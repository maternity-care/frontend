"use client";

import {
  Alert,
  Button,
  Modal,
  Tag,
  Typography,
} from "antd";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  X,
} from "lucide-react";

const { Text, Title } = Typography;

type DoctorShiftBulkPreviewModalProps = {
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
}: DoctorShiftBulkPreviewModalProps) {
  const hasIssues =
    skipped > 0 ||
    conflicted > 0 ||
    issues.length > 0 ||
    !canConfirm;

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
      mask={{
        closable: !confirmLoading,
      }}
      styles={{
        body: {
          maxHeight: "84vh",
          overflow: "hidden",
        },
      }}
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
              hasIssues
                ? "bg-red-600 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {hasIssues ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </span>

          <div>
            <Title
              level={4}
              className="!mb-1 !text-slate-950"
            >
              Xem trước lịch trực nhiều ngày
            </Title>

            <Text type="secondary">
              Kiểm tra toàn bộ lịch dự kiến trước khi xác nhận lưu vào hệ thống.
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
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Text
              type="secondary"
              className="block text-xs font-semibold uppercase"
            >
              Tổng dự kiến
            </Text>
            <div className="mt-1 text-2xl font-bold text-slate-950">
              {totalCandidates}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <Text className="block text-xs font-semibold uppercase text-emerald-700">
              Hợp lệ
            </Text>
            <div className="mt-1 text-2xl font-bold text-emerald-800">
              {valid}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Text className="block text-xs font-semibold uppercase text-amber-700">
              Bị bỏ qua
            </Text>
            <div className="mt-1 text-2xl font-bold text-amber-800">
              {skipped}
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <Text className="block text-xs font-semibold uppercase text-red-700">
              Bị trùng
            </Text>
            <div className="mt-1 text-2xl font-bold text-red-800">
              {conflicted}
            </div>
          </div>
        </div>

        {hasIssues ? (
          <div className="mt-4">
            <Alert
              type="error"
              showIcon
              title="Chưa thể tạo lịch trực"
              description="Các lịch bên dưới đang bị bỏ qua hoặc xung đột. Hãy quay lại sửa đúng phân công rồi xem trước lại."
            />

            <div className="mt-4 flex flex-col gap-3">
              {issues.length > 0 ? (
                issues.map((issue, index) => (
                  <div
                    key={`${index}-${issue}`}
                    className="rounded-xl border border-red-200 bg-red-50/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Tag color="red">
                        Lỗi {index + 1}
                      </Tag>

                      <Text className="leading-6 text-slate-800">
                        {issue}
                      </Text>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <Text className="text-slate-800">
                    Backend không cho phép xác nhận lịch. Vui lòng kiểm tra lại các phân công.
                  </Text>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Alert
            className="mt-4"
            type="success"
            showIcon
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            title="Toàn bộ lịch dự kiến đều hợp lệ"
            description="Bạn có thể xác nhận để lưu toàn bộ lịch trực vào hệ thống."
          />
        )}
      </div>

      <div className="mt-4 flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row">
        <Button
          disabled={confirmLoading}
          onClick={onClose}
        >
          {hasIssues
            ? "Quay lại chỉnh sửa"
            : "Đóng"}
        </Button>

        {canConfirm && !hasIssues ? (
          <Button
            type="primary"
            loading={confirmLoading}
            icon={
              <CheckCircle2 className="h-4 w-4" />
            }
            onClick={() =>
              void onConfirm()
            }
          >
            Xác nhận tạo lịch
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}