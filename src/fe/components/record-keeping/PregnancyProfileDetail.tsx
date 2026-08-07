"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Spin,
  Alert,
  Typography,
  Divider,
  Space,
  Image,
  Empty,
  Row,
  Col,
} from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ApiClientError } from "@/lib/axios";
import { MedicalRecord, MedicalRecordFile, PregnancyProfile } from "@/management/features/pregnancy-profile/pregnancy-profiles.types";
import { getMyPregnancyProfileDetail } from "@/management/features/pregnancy-profile/pregnancy-profile.api";

const { Title, Text } = Typography;

interface PregnancyProfileDetailProps {
  id: string;
}

export default function PregnancyProfileDetail({
  id,
}: PregnancyProfileDetailProps) {
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getMyPregnancyProfileDetail(id);
        if (mounted) setProfile(result);
      } catch (err) {
        if (mounted) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Không tìm thấy hồ sơ thai.";
          setError(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" description="Đang tải hồ sơ..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Alert
        type="error"
        title="Lỗi"
        description={error ?? "Không tìm thấy hồ sơ thai."}
        showIcon
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Header */}
      <Card className="shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {profile.code ?? "Hồ sơ thai kỳ"}
            </Title>
            <Text type="secondary">
              Cập nhật lần cuối:{" "}
              {profile.updatedAt
                ? dayjs(profile.updatedAt).format("DD/MM/YYYY HH:mm")
                : "—"}
            </Text>
          </div>

          <Space size="middle">
            {profile.status && (
              <Tag
                color={
                  profile.status === "active" || profile.status === "ACTIVE"
                    ? "success"
                    : "default"
                }
                className="px-3 py-1 text-sm"
              >
                {profile.status.toUpperCase()}
              </Tag>
            )}
            {profile.riskLevel && (
              <Tag
                color={
                  profile.riskLevel === "high"
                    ? "error"
                    : profile.riskLevel === "medium"
                      ? "warning"
                      : "success"
                }
                className="px-3 py-1 text-sm"
              >
                Risk: {profile.riskLevel}
              </Tag>
            )}
          </Space>
        </div>

        <Divider />

        <Descriptions
          column={{ xs: 1, sm: 2, md: 3 }}
          size="middle"
          labelStyle={{ fontWeight: 500, color: "#666" }}
        >
          <Descriptions.Item label="Ngày kinh cuối (LMP)">
            {profile.lastMenstrualPeriod
              ? dayjs(profile.lastMenstrualPeriod).format("DD/MM/YYYY")
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày dự sinh">
            {profile.expectedDueDate
              ? dayjs(profile.expectedDueDate).format("DD/MM/YYYY")
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Số lượng thai">
            {profile.fetalCount ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Gravida">{profile.gravida ?? 0}</Descriptions.Item>
          <Descriptions.Item label="Para Full-term">
            {profile.paraFullTerm ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Para Premature">
            {profile.paraPremature ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Para Abortion">
            {profile.paraAbortion ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Con còn sống">
            {profile.paraLivingChildren ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Ghi chú" span={3}>
            {profile.notes || "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Thông tin thai phụ */}
      {profile.user && (
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>Thông tin thai phụ</span>
            </Space>
          }
          className="shadow-sm"
        >
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Họ tên">
              {profile.user.name ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="CCCD">
              {profile.user.cccd ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {profile.user.phone ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {profile.user.email ?? "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Medical Records */}
      <Card
        title={
          <Space>
            <MedicineBoxOutlined />
            <span>Hồ sơ khám & Siêu âm</span>
          </Space>
        }
        className="shadow-sm"
      >
        {!profile.medicalRecords || profile.medicalRecords.length === 0 ? (
          <Empty description="Chưa có hồ sơ khám nào" />
        ) : (
          <div className="space-y-5">
            {profile.medicalRecords.map((record) => (
              <MedicalRecordItem key={record.id} record={record} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ========== Medical Record Item ========== */
function MedicalRecordItem({ record }: { record: MedicalRecord }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 transition hover:border-gray-200">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Text strong className="text-base">
            {record.diagnosis || "Hồ sơ khám"}
          </Text>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <CalendarOutlined />
            {record.createdAt
              ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm")
              : "—"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 space-y-2 text-sm">
        {record.conclusion && (
          <div>
            <Text type="secondary">Kết luận: </Text>
            <Text>{record.conclusion}</Text>
          </div>
        )}
        {record.recommendation && (
          <div>
            <Text type="secondary">Khuyến nghị: </Text>
            <Text>{record.recommendation}</Text>
          </div>
        )}
        {record.nextAppointmentSuggestedAt && (
          <div>
            <Text type="secondary">Hẹn tái khám: </Text>
            <Text>
              {dayjs(record.nextAppointmentSuggestedAt).format(
                "DD/MM/YYYY HH:mm",
              )}
            </Text>
          </div>
        )}
      </div>

      {/* Files */}
      {record.files && record.files.length > 0 && (
        <>
          <Divider plain className="!my-3">
            <Space size={4}>
              <FileTextOutlined />
              <span>File đính kèm ({record.files.length})</span>
            </Space>
          </Divider>

          <Row gutter={[12, 12]}>
            {record.files.map((file) => (
              <Col key={file.id} xs={12} sm={8} md={6} lg={4}>
                <FileItem file={file} />
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
}

/* ========== File Item ========== */
function FileItem({ file }: { file: MedicalRecordFile }) {
  const isImage =
    file.mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.fileName || "");

  if (isImage) {
    return (
      <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={file.fileUrl}
            alt={file.fileName}
            className="h-full w-full object-cover"
            preview={{ mask: "Xem ảnh" }}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120' viewBox='0 0 160 120'%3E%3Crect fill='%23f0f0f0' width='160' height='120'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E"
          />
        </div>
        <div className="p-2">
          <Text
            ellipsis
            className="block text-xs font-medium"
            title={file.fileName}
          >
            {file.fileName}
          </Text>
          <Text type="secondary" className="text-[11px]">
            {file.fileType}
          </Text>
        </div>
      </div>
    );
  }

  // PDF / other files
  return (
    <a
      href={file.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-500">
        <FileTextOutlined style={{ fontSize: 20 }} />
      </div>
      <div>
        <Text
          ellipsis
          className="block text-xs font-medium"
          title={file.fileName}
        >
          {file.fileName}
        </Text>
        <Text type="secondary" className="text-[11px]">
          {file.fileType}
          {file.mimeType ? ` · ${file.mimeType.split("/").pop()}` : ""}
        </Text>
      </div>
    </a>
  );
}