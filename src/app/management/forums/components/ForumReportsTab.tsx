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
  Eye,
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

function getContentStatusLabel(
  status: string,
) {
  const normalized =
    status.trim().toLowerCase();

  const labels: Record<string, string> = {
    pending: "Chờ duyệt",
    published: "Đã xuất bản",
    hidden: "Đã ẩn",
    rejected: "Đã từ chối",
    deleted: "Đã xóa",
    active: "Hoạt động",
    inactive: "Ngừng hoạt động",
  };

  return (
    labels[normalized] ||
    status ||
    "Chưa cập nhật"
  );
}

function getReporterRoleLabel(
  role: ForumReport["reporterRole"],
) {
  const labels: Record<
    ForumReport["reporterRole"],
    string
  > = {
    user: "Người dùng",
    staff: "Nhân viên",
    doctor: "Bác sĩ",
    moderator: "Kiểm duyệt viên",
    admin: "Quản trị viên",
  };

  return labels[role] ?? role;
}

function stripReportHtml(
  value: string,
) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getTargetContentSummary(
  report: ForumReport,
) {
  const target =
    report.targetContent;

  if (!target) {
    return {
      title:
        report.targetType === "post"
          ? "Bài viết không còn tồn tại"
          : report.targetType === "comment"
            ? "Bình luận không còn tồn tại"
            : "Nội dung không còn tồn tại",
      content: "",
    };
  }

  return {
    title:
      target.title ||
      target.postTitle ||
      (
        target.type === "comment"
          ? "Bình luận"
          : "Bài viết"
      ),
    content:
      stripReportHtml(
        target.content,
      ),
  };
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
          const target =
            getTargetContentSummary(
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

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <Text
                  type="secondary"
                  className="block text-xs"
                >
                  Nội dung bị báo cáo
                </Text>

                <Text
                  strong
                  className="mt-1 block"
                >
                  {target.title}
                </Text>

                {target.content ? (
                  <Paragraph
                    ellipsis={{ rows: 3 }}
                    className="!mb-0 !mt-2"
                  >
                    {target.content}
                  </Paragraph>
                ) : null}
              </div>
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

function ReportTargetContentModal({
  report,
  onClose,
  onResolve,
}: {
  report: ForumReport | null;
  onClose: () => void;
  onResolve: (
    report: ForumReport,
    action: ForumReportResolveAction,
  ) => void;
}) {
  if (!report) return null;

  const target =
    getTargetContentSummary(
      report,
    );
  const rawTarget =
    report.targetContent;
  const disabled =
    isResolvedStatus(
      report.status,
    );

  return (
    <Modal
      open
      centered
      width={760}
      title="Nội dung bị báo cáo"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            onClick={onClose}
          >
            Đóng
          </Button>

          <Button
            disabled={disabled}
            icon={
              <EyeOff className="h-4 w-4" />
            }
            onClick={() =>
              onResolve(
                report,
                "hide",
              )
            }
          >
            Ẩn nội dung
          </Button>

          <Button
            danger
            disabled={disabled}
            icon={
              <Trash2 className="h-4 w-4" />
            }
            onClick={() =>
              onResolve(
                report,
                "delete",
              )
            }
          >
            Xóa nội dung
          </Button>

          <Button
            disabled={disabled}
            icon={
              <XCircle className="h-4 w-4" />
            }
            onClick={() =>
              onResolve(
                report,
                "dismiss",
              )
            }
          >
            Bỏ qua báo cáo
          </Button>
        </div>
      }
      onCancel={onClose}
      styles={{
        body: {
          maxHeight: "70vh",
          overflowY: "auto",
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
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

          <Text type="secondary">
            Mã nội dung: #{report.targetId}
          </Text>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Text
            type="secondary"
            className="block text-xs"
          >
            Tiêu đề
          </Text>

          <Text
            strong
            className="mt-1 block break-words"
          >
            {target.title}
          </Text>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <Text
            type="secondary"
            className="block text-xs"
          >
            Nội dung đầy đủ
          </Text>

          <Paragraph className="!mb-0 !mt-2 !whitespace-pre-wrap !break-words !leading-7">
            {target.content ||
              "Nội dung không còn tồn tại hoặc không có dữ liệu."}
          </Paragraph>
        </div>

        {rawTarget ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <Text
                type="secondary"
                className="block text-xs"
              >
                Tác giả
              </Text>
              <Text strong>
                {rawTarget.author ||
                  "Chưa cập nhật"}
              </Text>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <Text
                type="secondary"
                className="block text-xs"
              >
                Trạng thái nội dung
              </Text>
              <Text>
                {getContentStatusLabel(
                  rawTarget.status,
                )}
              </Text>
            </div>
          </div>
        ) : null}
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
  const [
    viewingContentReport,
    setViewingContentReport,
  ] = useState<ForumReport | null>(
    null,
  );

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
      width: "7%",
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
      title: "Nội dung bị báo cáo",
      width: "17%",
      render: (_value, report) => {
        const target =
          getTargetContentSummary(
            report,
          );

        return (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1">
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

              <Text
                type="secondary"
                className="text-xs"
              >
                #{report.targetId}
              </Text>
            </div>

            <Text
              strong
              ellipsis={{
                tooltip: target.title,
              }}
              className="mt-1 block"
            >
              {target.title}
            </Text>

            {target.content ? (
              <Paragraph
                ellipsis={{ rows: 2 }}
                className="!mb-0 !mt-1 !text-xs !text-slate-500"
              >
                {target.content}
              </Paragraph>
            ) : (
              <Text
                type="secondary"
                className="mt-1 block text-xs"
              >
                Không có nội dung xem trước
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Lý do",
      width: "18%",
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
      width: "14%",
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

          <Text
            type="secondary"
            className="mt-1 block text-xs"
          >
            {getReporterRoleLabel(
              report.reporterRole,
            )}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: "11%",
      align: "center",
      render: (
        value: string,
        report,
      ) => (
        <div>
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

          {report.resolutionAction ? (
            <Text
              type="secondary"
              className="mt-1 block text-xs"
            >
              {
                REPORT_ACTION_OPTIONS.find(
                  (item) =>
                    item.value ===
                    report.resolutionAction,
                )?.label
              }
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      width: "9%",
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "Hành động",
      width: "16%",
      align: "center",
      render: (_value, report) => {
        const disabled =
          isResolvedStatus(
            report.status,
          );

        return (
          <Space
            size={6}
            className="!flex !justify-center"
          >
            <Tooltip title="Xem chi tiết">
              <Button
                icon={
                  <Eye className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setViewingContentReport(
                    report,
                  );
                }}
              />
            </Tooltip>

            <Tooltip title="Ẩn nội dung">
              <Button
                disabled={disabled}
                icon={
                  <EyeOff className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setResolveRequest({
                    report,
                    action: "hide",
                  });
                }}
              />
            </Tooltip>

            <Tooltip title="Xóa nội dung">
              <Button
                danger
                disabled={disabled}
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setResolveRequest({
                    report,
                    action: "delete",
                  });
                }}
              />
            </Tooltip>

            <Tooltip title="Bỏ qua báo cáo">
              <Button
                disabled={disabled}
                icon={
                  <XCircle className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setResolveRequest({
                    report,
                    action: "dismiss",
                  });
                }}
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

      <ReportTargetContentModal
        report={viewingContentReport}
        onClose={() =>
          setViewingContentReport(
            null,
          )
        }
        onResolve={(
          report,
          action,
        ) => {
          setViewingContentReport(
            null,
          );
          setResolveRequest({
            report,
            action,
          });
        }}
      />

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