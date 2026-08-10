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
  getForumReportGroups,
  resolveForumReportGroup,
} from "@/management/features/forums/forums.api";
import type {
  ForumReport,
  ForumReportGroup,
  ForumReportResolveAction,
  ForumReportTargetContent,
} from "@/management/features/forums/forums.types";

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

type ForumReportsTabProps = {
  realtimeVersion?: number;
};

type ReportResolveRequest = {
  group: ForumReportGroup;
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
  return ["resolved", "rejected", "dismissed", "closed"].includes(
    status.toLowerCase(),
  );
}

function getReportStatusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  const labels: Record<string, string> = {
    pending: "Chờ xử lý",
    resolved: "Đã xử lý",
    rejected: "Đã bỏ qua",
    dismissed: "Đã bỏ qua",
  };

  return labels[normalized] || status || "Chờ xử lý";
}

function getContentStatusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  const labels: Record<string, string> = {
    pending: "Chờ duyệt",
    published: "Đã xuất bản",
    hidden: "Đã ẩn",
    rejected: "Đã từ chối",
    deleted: "Đã xóa",
  };

  return labels[normalized] || status || "Chưa cập nhật";
}

function getReporterRoleLabel(role: ForumReport["reporterRole"]) {
  const labels: Record<ForumReport["reporterRole"], string> = {
    user: "Người dùng",
    staff: "Nhân viên",
    doctor: "Bác sĩ",
    moderator: "Kiểm duyệt viên",
    admin: "Quản trị viên",
  };

  return labels[role] ?? role;
}

function stripReportHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getTargetLabel(targetType: ForumReportGroup["targetType"]) {
  if (targetType === "post") return "Bài viết";
  if (targetType === "comment") return "Bình luận";
  return "Không xác định";
}

function getTargetColor(targetType: ForumReportGroup["targetType"]) {
  if (targetType === "post") return "blue";
  if (targetType === "comment") return "purple";
  return "default";
}

function summarizeTargetContent(
  target: ForumReportTargetContent | null,
  group: ForumReportGroup,
) {
  if (!target) {
    return {
      title: `${getTargetLabel(group.targetType)} không còn tồn tại`,
      content: "",
    };
  }

  return {
    title:
      target.title ||
      target.postTitle ||
      getTargetLabel(group.targetType),
    content: stripReportHtml(target.content),
  };
}

function getReportDisplayContent(report: ForumReport) {
  const reason = report.reason.trim();
  const description = report.description.trim();

  if (description || !reason.includes(":")) {
    return {
      reason: reason || "Không rõ lý do",
      description: description || "Không có mô tả.",
    };
  }

  const separatorIndex = reason.indexOf(":");
  const reasonTitle = reason.slice(0, separatorIndex).trim();
  const reasonDescription = reason.slice(separatorIndex + 1).trim();

  return {
    reason: reasonTitle || "Không rõ lý do",
    description: reasonDescription || "Không có mô tả.",
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
  onConfirm: (action: ForumReportResolveAction, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (request) setNote("");
  }, [request]);

  if (!request) return null;

  const target = summarizeTargetContent(
    request.group.targetContent,
    request.group,
  );

  return (
    <Modal
      open
      centered
      width={620}
      title="Xử lý nhóm báo cáo"
      okText="Xác nhận xử lý"
      cancelText="Hủy"
      confirmLoading={submitting}
      okButtonProps={{ disabled: !note.trim() }}
      maskClosable={!submitting}
      onCancel={onClose}
      onOk={() => void onConfirm(request.action, note.trim())}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text type="secondary" className="block text-xs">
          Nội dung bị báo cáo
        </Text>
        <Text strong className="mt-1 block">
          {target.title}
        </Text>
        {target.content ? (
          <Paragraph ellipsis={{ rows: 3 }} className="!mb-0 !mt-2">
            {target.content}
          </Paragraph>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag color="red">{request.group.pendingCount} báo cáo chờ xử lý</Tag>
          <Tag>{request.group.reportCount} báo cáo tổng</Tag>
        </div>
      </div>

      <div className="mt-4">
        <Tag
          color={request.action === "dismiss" ? "default" : "red"}
          className="!mr-0"
        >
          {REPORT_ACTION_OPTIONS.find((item) => item.value === request.action)
            ?.label ?? request.action}
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
  group,
  onClose,
  onResolve,
}: {
  group: ForumReportGroup | null;
  onClose: () => void;
  onResolve: (
    group: ForumReportGroup,
    action: ForumReportResolveAction,
  ) => void;
}) {
  if (!group) return null;

  const target = summarizeTargetContent(group.targetContent, group);
  const disabled = group.pendingCount === 0 || isResolvedStatus(group.status);

  return (
    <Modal
      open
      centered
      width={820}
      title="Chi tiết nội dung bị báo cáo"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button onClick={onClose}>Đóng</Button>
          <Button
            disabled={disabled}
            icon={<EyeOff className="h-4 w-4" />}
            onClick={() => onResolve(group, "hide")}
          >
            Ẩn nội dung
          </Button>
          <Button
            danger
            disabled={disabled}
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => onResolve(group, "delete")}
          >
            Xóa nội dung
          </Button>
          <Button
            disabled={disabled}
            icon={<XCircle className="h-4 w-4" />}
            onClick={() => onResolve(group, "dismiss")}
          >
            Bỏ qua báo cáo
          </Button>
        </div>
      }
      onCancel={onClose}
      styles={{
        body: {
          maxHeight: "72vh",
          overflowY: "auto",
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag color={getTargetColor(group.targetType)}>
            {getTargetLabel(group.targetType)}
          </Tag>
          <Text type="secondary">Mã nội dung: #{group.targetId}</Text>
          <Tag color="red">{group.reportCount} báo cáo</Tag>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Text type="secondary" className="block text-xs">
            Tiêu đề
          </Text>
          <Text strong className="mt-1 block break-words">
            {target.title}
          </Text>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <Text type="secondary" className="block text-xs">
            Nội dung đầy đủ
          </Text>
          <Paragraph className="!mb-0 !mt-2 !whitespace-pre-wrap !break-words !leading-7">
            {target.content ||
              "Nội dung không còn tồn tại hoặc không có dữ liệu."}
          </Paragraph>
        </div>

        {group.targetContent ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3">
              <Text type="secondary" className="block text-xs">
                Tác giả
              </Text>
              <Text strong>{group.targetContent.author || "Chưa cập nhật"}</Text>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <Text type="secondary" className="block text-xs">
                Trạng thái nội dung
              </Text>
              <Text>{getContentStatusLabel(group.targetContent.status)}</Text>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <Text strong>Danh sách người báo cáo</Text>
          </div>
          <div className="divide-y divide-slate-100">
            {group.reports.map((report) => {
              const display = getReportDisplayContent(report);

              return (
                <div key={report.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Text strong>{report.reporterName}</Text>
                      <Text type="secondary" className="ml-2 text-xs">
                        {getReporterRoleLabel(report.reporterRole)}
                      </Text>
                      {report.reporterEmail ? (
                        <Text type="secondary" className="block text-xs">
                          {report.reporterEmail}
                        </Text>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <Tag
                        color={
                          isResolvedStatus(report.status) ? "green" : "red"
                        }
                      >
                        {getReportStatusLabel(report.status)}
                      </Tag>
                      <Text type="secondary" className="block text-xs">
                        {formatDateTime(report.createdAt)}
                      </Text>
                    </div>
                  </div>
                  <Tag color="red" className="!mt-3">
                    {display.reason}
                  </Tag>
                  <Paragraph className="!mb-0 !mt-2">
                    {display.description}
                  </Paragraph>
                  {report.resolutionNote ? (
                    <Paragraph className="!mb-0 !mt-2 !text-slate-500">
                      Ghi chú xử lý: {report.resolutionNote}
                    </Paragraph>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function ForumReportsTab({
  realtimeVersion = 0,
}: ForumReportsTabProps) {
  const { message } = App.useApp();

  const [groups, setGroups] = useState<ForumReportGroup[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolveRequest, setResolveRequest] =
    useState<ReportResolveRequest | null>(null);
  const [viewingGroup, setViewingGroup] = useState<ForumReportGroup | null>(
    null,
  );

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getForumReportGroups({ page, limit: pageSize });
      setGroups(result.items);
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
      await resolveForumReportGroup(
        request.group.targetType,
        request.group.targetId,
        { action, note },
      );
      message.success("Xử lý nhóm báo cáo thành công.");
      setResolveRequest(null);
      await loadReports();
    } catch (resolveError) {
      message.error(getErrorMessage(resolveError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnsType<ForumReportGroup> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Nội dung bị báo cáo",
      width: 280,
      render: (_value, group) => {
        const target = summarizeTargetContent(group.targetContent, group);

        return (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <Tag color={getTargetColor(group.targetType)}>
                {getTargetLabel(group.targetType)}
              </Tag>
              <Text type="secondary" className="text-xs">
                #{group.targetId}
              </Text>
            </div>
            <Text
              strong
              ellipsis={{ tooltip: target.title }}
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
              <Text type="secondary" className="mt-1 block text-xs">
                Không có nội dung xem trước
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Báo cáo",
      width: 220,
      render: (_value, group) => (
        <div>
          <div className="flex flex-wrap gap-1">
            <Tag color={group.pendingCount > 0 ? "red" : "green"}>
              {group.pendingCount} chờ xử lý
            </Tag>
            <Tag>{group.reportCount} tổng</Tag>
          </div>
          <Paragraph ellipsis={{ rows: 2 }} className="!mb-0 !mt-2">
            {group.reports
              .slice(0, 2)
              .map((report) => getReportDisplayContent(report).reason)
              .join(", ") || "Không rõ lý do"}
          </Paragraph>
        </div>
      ),
    },
    {
      title: "Người báo cáo",
      width: 220,
      render: (_value, group) => (
        <div>
          {group.reports.slice(0, 2).map((report) => (
            <div key={report.id} className="mb-1 last:mb-0">
              <Text strong ellipsis className="block">
                {report.reporterName}
              </Text>
              <Text type="secondary" ellipsis className="block text-xs">
                {report.reporterEmail ||
                  getReporterRoleLabel(report.reporterRole)}
              </Text>
            </div>
          ))}
          {group.reportCount > 2 ? (
            <Text type="secondary" className="text-xs">
              +{group.reportCount - 2} người khác
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      width: 150,
      align: "center",
      render: (_value, group) => (
        <div>
          <Tag color={isResolvedStatus(group.status) ? "green" : "red"}>
            {getReportStatusLabel(group.status)}
          </Tag>
          <Text type="secondary" className="mt-1 block text-xs">
            {group.resolvedCount} xử lý, {group.rejectedCount} bỏ qua
          </Text>
        </div>
      ),
    },
    {
      title: "Ngày gửi gần nhất",
      dataIndex: "updatedAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "Hành động",
      width: 170,
      align: "center",
      render: (_value, group) => {
        const disabled = group.pendingCount === 0 || isResolvedStatus(group.status);

        return (
          <Space size={6} className="!flex !justify-center">
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<Eye className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();
                  setViewingGroup(group);
                }}
              />
            </Tooltip>
            <Tooltip title="Ẩn nội dung">
              <Button
                disabled={disabled}
                icon={<EyeOff className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();
                  setResolveRequest({ group, action: "hide" });
                }}
              />
            </Tooltip>
            <Tooltip title="Xóa nội dung">
              <Button
                danger
                disabled={disabled}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();
                  setResolveRequest({ group, action: "delete" });
                }}
              />
            </Tooltip>
            <Tooltip title="Bỏ qua báo cáo">
              <Button
                disabled={disabled}
                icon={<XCircle className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();
                  setResolveRequest({ group, action: "dismiss" });
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
            rowKey="groupId"
            size="middle"
            tableLayout="fixed"
            loading={loading}
            columns={columns}
            dataSource={groups}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (nextTotal, range) =>
                `${range[0]}-${range[1]} / ${nextTotal} nội dung bị báo cáo`,
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
        group={viewingGroup}
        onClose={() => setViewingGroup(null)}
        onResolve={(group, action) => {
          setViewingGroup(null);
          setResolveRequest({ group, action });
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
