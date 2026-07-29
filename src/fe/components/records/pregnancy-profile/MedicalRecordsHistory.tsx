"use client";

import { Card, Empty, Table, Tag, Typography, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

export interface HistoryRecordRow {
  key: string;
  name: string;
  date: string;
  type: string;
  url?: string | null;
  raw: unknown;
}

interface Props {
  medicalRecords: unknown[];
  loading?: boolean;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN").format(d);
}

function normalizeRecords(records: unknown[]): HistoryRecordRow[] {
  return (records ?? []).map((item, index) => {
    if (typeof item === "string") {
      const isUrl = item.startsWith("http");
      return {
        key: `str-${index}`,
        name: isUrl
          ? decodeURIComponent(item.split("/").pop() || `Tài liệu ${index + 1}`)
          : item || `Tài liệu ${index + 1}`,
        date: "—",
        type: "PDF / Tài liệu",
        url: isUrl ? item : null,
        raw: item,
      };
    }

    if (item && typeof item === "object") {
      const r = item as Record<string, unknown>;

      // Consultation / medical record object
      if ("diagnosis" in r || "appointmentId" in r || "conclusion" in r) {
        const files = Array.isArray(r.files) ? r.files : [];
        const firstFile = files[0] as Record<string, unknown> | undefined;
        return {
          key: String(r.id ?? `consult-${index}`),
          name: String(r.diagnosis || r.conclusion || `Kết quả khám ${index + 1}`),
          date: formatDate(
            (r.createdAt as string) ||
              (r.nextAppointmentSuggestedAt as string) ||
              null,
          ),
          type: "Kết quả khám",
          url: firstFile?.fileUrl ? String(firstFile.fileUrl) : null,
          raw: item,
        };
      }

      // File object
      const url =
        (r.fileUrl as string) ||
        (r.url as string) ||
        (r.publicUrl as string) ||
        null;
      const name =
        (r.fileName as string) ||
        (r.name as string) ||
        `Tài liệu ${index + 1}`;

      return {
        key: String(r.id ?? `file-${index}`),
        name,
        date: formatDate((r.createdAt as string) || null),
        type: String(r.fileType || r.mimeType || "Tài liệu"),
        url,
        raw: item,
      };
    }

    return {
      key: `unknown-${index}`,
      name: `Bản ghi ${index + 1}`,
      date: "—",
      type: "Khác",
      url: null,
      raw: item,
    };
  });
}

export function MedicalRecordsHistory({ medicalRecords, loading }: Props) {
  const data = normalizeRecords(medicalRecords);

  const columns: ColumnsType<HistoryRecordRow> = [
    {
      title: "Tên / Nội dung",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 140,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 160,
      render: (type: string) => (
        <Tag color={type.includes("khám") ? "blue" : "default"}>{type}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, row) =>
        row.url ? (
          <Button
            type="link"
            icon={<EyeOutlined />}
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Xem
          </Button>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  return (
    <Card title="Lịch sử hồ sơ & kết quả khám">
      <Table
        rowKey="key"
        loading={loading}
        columns={columns}
        dataSource={data}
        locale={{
          emptyText: <Empty description="Chưa có hồ sơ / kết quả khám" />,
        }}
        pagination={{ pageSize: 8, showTotal: (t) => `Tổng ${t} bản ghi` }}
      />
    </Card>
  );
}