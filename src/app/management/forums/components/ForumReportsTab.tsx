"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOff,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  getForumReports,
  resolveForumReport,
} from "@/management/features/forums/forums.api";
import type {
  ForumReport,
  ForumReportResolveAction,
} from "@/management/features/forums/forums.types";

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

type ForumReportsTabProps = {
  realtimeVersion?: number;
};

type ReportResolveRequest = {
  report: ForumReport;
  action: ForumReportResolveAction;
};

const REPORT_ACTION_OPTIONS: Array<{
  value: ForumReportResolveAction;
  label: string;
}> = [
  { value: "hide", label: "Ẩn nội dung" },
  { value: "delete", label: "Xóa nội dung" },
  { value: "dismiss", label: "Bỏ qua báo cáo" },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi xử lý báo cáo.";
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

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

function isResolvedStatus(status: string) {
  return ["resolved", "dismissed"].includes(status.toLowerCase());
}

function getReportStatusLabel(
  status: string,
) {
  const normalized =
    status.trim().toLowerCase();

  const labels: Record<string, string> = {
    open: "Chưa xử lý",
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    in_progress: "Đang xử lý",
    resolved: "Đã xử lý",
    dismissed: "Đã bỏ qua",
    closed: "Đã đóng",
  };

  return (
    labels[normalized] ||
    status ||
    "Chưa xử lý"
  );
}

function getReportDisplayContent(
  report: ForumReport,
) {
  const reason =
    report.reason.trim();
  const description =
    report.description.trim();

  if (
    description ||
    !reason.includes(":")
  ) {
    return {
      reason:
        reason ||
        "Không rõ lý do",
      description:
        description ||
        "Không có mô tả.",
    };
  }

  const separatorIndex =
    reason.indexOf(":");
  const reasonTitle =
    reason
      .slice(
        0,
        separatorIndex,
      )
      .trim();
  const reasonDescription =
    reason
      .slice(
        separatorIndex + 1,
      )
      .trim();

  return {
    reason:
      reasonTitle ||
      "Không rõ lý do",
    description:
      reasonDescription ||
      "Không có mô tả.",
  };
}

function ReportResolveModal({
  request,
  submitting,
  onClose,
  onConfirm,
}: {
  request: ReportResolveRequest | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (
    action: ForumReportResolveAction,
    note: string,
  ) => Promise<void>;
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!request) return;

    const timer = window.setTimeout(() => {
      setNote("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [request]);

  if (!request) return null;

  return (
    <Modal
      open
      centered
      width={580}
      title="Xử lý báo cáo"
      okText="Xác nhận xử lý"
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{ disabled: !note.trim() }}
      onCancel={onClose}
      onOk={() =>
        void onConfirm(
          request.action,
          note.trim(),
        )
      }
      mask={{ closable: !submitting }}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text type="secondary" className="block text-xs">
          Mã báo cáo
        </Text>
        <Text strong>{request.report.id}</Text>
        {(() => {
          const display =
            getReportDisplayContent(
              request.report,
            );

          return (
            <>
              <Tag
                color="red"
                className="!mt-3"
              >
                {display.reason}
              </Tag>

              <Paragraph className="!mb-0 !mt-3">
                {display.description}
              </Paragraph>
            </>
          );
        })()}
      </div>

      <div className="mt-4">
        <Tag
          color={
            request.action === "dismiss"
              ? "default"
              : "red"
          }
          className="!mr-0"
        >
          {REPORT_ACTION_OPTIONS.find(
            (item) =>
              item.value ===
              request.action,
          )?.label ?? request.action}
        </Tag>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold">
          Ghi chú xử lý <span className="text-red-500">*</span>
        </label>
        <TextArea
          rows={4}
          maxLength={500}
          showCount
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
    </Modal>
  );
}

export function ForumReportsTab({
  realtimeVersion = 0,
}: ForumReportsTabProps) {
  const { message } = App.useApp();

  const [reports, setReports] = useState<ForumReport[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolveRequest, setResolveRequest] =
    useState<ReportResolveRequest | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getForumReports({ page, limit: pageSize });

      setReports(result.items);
      setTotal(result.total);
      setPage(result.page);
      setPageSize(result.limit);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReports(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReports, realtimeVersion]);

  async function handleResolveReport(
    action: ForumReportResolveAction,
    note: string,
  ) {
    const request = resolveRequest;
    if (!request) return;

    setSubmitting(true);

    try {
      await resolveForumReport(request.report.id, { action, note });
      message.success("Xử lý báo cáo thành công.");
      setResolveRequest(null);
      await loadReports();
    } catch (resolveError) {
      message.error(getErrorMessage(resolveError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnsType<ForumReport> = [
    {
      title: "STT",
      width: "5%",
      align: "center",
      render: (
        _value,
        _record,
        index,
      ) =>
        (page - 1) *
          pageSize +
        index +
        1,
    },
    {
      title: "Mã báo cáo",
      dataIndex: "id",
      width: "9%",
      render: (value: string) => (
        <Text
          strong
          ellipsis
          className="block font-mono"
        >
          {value}
        </Text>
      ),
    },
    {
      title: "Đối tượng",
      width: "12%",
      render: (_value, report) => (
        <div>
          <Tag
            color={
              report.targetType === "post"
                ? "blue"
                : report.targetType === "comment"
                  ? "purple"
                  : "default"
            }
          >
            {report.targetType === "post"
              ? "Bài viết"
              : report.targetType === "comment"
                ? "Bình luận"
                : "Không xác định"}
          </Tag>
          <Text type="secondary" className="mt-1 block text-xs">
            {report.targetId || "Chưa có mã nội dung"}
          </Text>
        </div>
      ),
    },
    {
      title: "Lý do",
      width: "24%",
      render: (_value, report) => {
        const display =
          getReportDisplayContent(
            report,
          );

        return (
          <div>
            <Tag color="red">
              {display.reason}
            </Tag>

            <Paragraph
              ellipsis={{ rows: 2 }}
              className="!mb-0 !mt-2"
            >
              {display.description}
            </Paragraph>
          </div>
        );
      },
    },
    {
      title: "Người báo cáo",
      width: "17%",
      render: (_value, report) => (
        <div>
          <Text
            strong
            ellipsis
            className="block"
          >
            {report.reporterName}
          </Text>
          <Text
            type="secondary"
            ellipsis
            className="block text-xs"
          >
            {report.reporterEmail}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: "10%",
      align: "center",
      render: (value: string) => (
        <Tag
          color={
            isResolvedStatus(
              value,
            )
              ? "green"
              : "red"
          }
        >
          {getReportStatusLabel(
            value,
          )}
        </Tag>
      ),
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      width: "11%",
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "Hành động",
      width: "12%",
      align: "center",
      render: (_value, report) => {
        const disabled = isResolvedStatus(
          report.status,
        );

        return (
          <Space size={6}>
            <Tooltip title="Ẩn nội dung">
              <Button
                disabled={disabled}
                icon={
                  <EyeOff className="h-4 w-4" />
                }
                onClick={() =>
                  setResolveRequest({
                    report,
                    action: "hide",
                  })
                }
              />
            </Tooltip>

            <Tooltip title="Xóa nội dung">
              <Button
                danger
                disabled={disabled}
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={() =>
                  setResolveRequest({
                    report,
                    action: "delete",
                  })
                }
              />
            </Tooltip>

            <Tooltip title="Bỏ qua báo cáo">
              <Button
                disabled={disabled}
                icon={
                  <XCircle className="h-4 w-4" />
                }
                onClick={() =>
                  setResolveRequest({
                    report,
                    action: "dismiss",
                  })
                }
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() => setError(null)}
          />
        ) : null}

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{ body: { padding: 0 } }}
          title="Danh sách báo cáo"
        >
          <Table
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading}
            columns={columns}
            dataSource={reports}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (nextTotal, range) =>
                `${range[0]}-${range[1]} / ${nextTotal} báo cáo`,
              onChange: (nextPage, nextSize) => {
                if (nextSize !== pageSize) {
                  setPageSize(nextSize);
                  setPage(1);
                  return;
                }

                setPage(nextPage);
              },
            }}
            className="management-table [&_.ant-table-cell]:px-3"
          />
        </Card>
      </div>

      <ReportResolveModal
        request={resolveRequest}
        submitting={submitting}
        onClose={() => {
          if (!submitting) setResolveRequest(null);
        }}
        onConfirm={handleResolveReport}
      />
    </>
  );
}