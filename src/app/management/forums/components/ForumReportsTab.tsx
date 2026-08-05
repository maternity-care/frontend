"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

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
  onSummaryChange: (summary: {
    total: number;
    needAction: number;
  }) => void;
};

type ReportResolveRequest = {
  report: ForumReport;
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
  const [action, setAction] = useState<ForumReportResolveAction>("hide");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!request) return;

    const timer = window.setTimeout(() => {
      setAction("hide");
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
      onOk={() => void onConfirm(action, note.trim())}
      mask={{ closable: !submitting }}
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text type="secondary" className="block text-xs">
          Mã báo cáo
        </Text>
        <Text strong>{request.report.id}</Text>
        <Paragraph className="!mb-0 !mt-3">
          {request.report.description ||
            request.report.reason ||
            "Không có mô tả."}
        </Paragraph>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold">Hành động</label>
        <Select
          className="w-full"
          value={action}
          options={REPORT_ACTION_OPTIONS}
          onChange={setAction}
        />
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
  onSummaryChange,
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
      onSummaryChange({
        total: result.total,
        needAction: result.items.filter(
          (report) => !isResolvedStatus(report.status),
        ).length,
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [onSummaryChange, page, pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReports(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReports]);

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
      width: 64,
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
      width: 150,
      render: (value: string) => (
        <Text strong className="font-mono">
          {value}
        </Text>
      ),
    },
    {
      title: "Đối tượng",
      width: 180,
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
      width: 330,
      render: (_value, report) => (
        <div>
          <Tag color="red">{report.reason || "Không rõ lý do"}</Tag>
          <Paragraph ellipsis={{ rows: 2 }} className="!mb-0 !mt-2">
            {report.description || "Không có mô tả."}
          </Paragraph>
        </div>
      ),
    },
    {
      title: "Người báo cáo",
      width: 210,
      render: (_value, report) => (
        <div>
          <Text strong>{report.reporterName}</Text>
          <Text type="secondary" className="block text-xs">
            {report.reporterEmail}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      align: "center",
      render: (value: string) => (
        <Tag color={isResolvedStatus(value) ? "green" : "red"}>
          {value || "Chưa xử lý"}
        </Tag>
      ),
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "Thao tác",
      width: 120,
      fixed: "right",
      align: "center",
      render: (_value, report) => (
        <Button
          type="primary"
          disabled={isResolvedStatus(report.status)}
          onClick={() => setResolveRequest({ report })}
        >
          Xử lý
        </Button>
      ),
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
            scroll={{ x: 1300 }}
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