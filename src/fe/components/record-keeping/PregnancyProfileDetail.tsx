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
  Collapse,
  Button,
} from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Link from "next/link";
import { ApiClientError } from "@/lib/axios";
import {
  MedicalRecord,
  MedicalRecordFile,
  PregnancyProfile,
} from "@/management/features/pregnancy-profile/pregnancy-profiles.types";
import { getMyPregnancyProfileDetail } from "@/management/features/pregnancy-profile/pregnancy-profile.api";

const { Title, Text } = Typography;

const statusLabelMap: Record<string, string> = {
  active: "Đang hoạt động",
  ACTIVE: "Đang hoạt động",
  completed: "Hoàn thành",
  terminated: "Đã chấm dứt",
  deleted: "Đã xóa",
};

const riskLabelMap: Record<string, string> = {
  low: "Nguy cơ thấp",
  medium: "Nguy cơ trung bình",
  high: "Nguy cơ cao",
};

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
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Nút quay lại danh sách */}
      <div className="-mb-2">
        <Link href="/pregnancy-profiles">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="px-0 text-gray-600 hover:text-blue-600"
          >
            Quay lại danh sách hồ sơ
          </Button>
        </Link>
      </div>

      {/* ========== Header ========== */}
      <Card className="shadow-sm" styles={{ body: { padding: "24px 28px" } }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {profile.code ?? "Hồ sơ thai kỳ"}
            </Title>
            <Text type="secondary" className="mt-1 block">
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
                {statusLabelMap[profile.status] ?? profile.status}
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
                {riskLabelMap[profile.riskLevel] ?? profile.riskLevel}
              </Tag>
            )}
          </Space>
        </div>

        <Divider className="!my-5" />

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
          <Descriptions.Item label="Gravida">
            {profile.gravida ?? 0}
          </Descriptions.Item>
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

      {/* ========== Thông tin thai phụ ========== */}
      {profile.user && (
        <Card
          title={
            <Space>
              <UserOutlined />
              <span>Thông tin thai phụ</span>
            </Space>
          }
          className="shadow-sm"
          styles={{ body: { padding: "20px 28px" } }}
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

      {/* ========== Hồ sơ khám & Siêu âm ========== */}
      <Card
        title={
          <Space>
            <MedicineBoxOutlined />
            <span>Hồ sơ khám & Siêu âm</span>
            {profile.medicalRecords && profile.medicalRecords.length > 0 && (
              <Tag color="blue">{profile.medicalRecords.length}</Tag>
            )}
          </Space>
        }
        className="shadow-sm"
        styles={{ body: { padding: "20px 24px" } }}
      >
        {!profile.medicalRecords || profile.medicalRecords.length === 0 ? (
          <div className="py-8">
            <Empty description="Chưa có hồ sơ khám nào" />
          </div>
        ) : (
          <Collapse
            accordion
            defaultActiveKey={[String(profile.medicalRecords[0]?.id)]}
            bordered={false}
            className="bg-transparent"
            items={profile.medicalRecords.map((record, index) => ({
              key: String(record.id),
              label: (
                <div className="flex flex-wrap items-center justify-between gap-2 pr-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <Text strong className="text-[15px]">
                        {record.diagnosis || "Hồ sơ khám"}
                      </Text>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                        <CalendarOutlined />
                        {record.createdAt
                          ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm")
                          : "—"}
                      </div>
                    </div>
                  </div>
                  {record.files && record.files.length > 0 && (
                    <Tag
                      icon={<FileTextOutlined />}
                      color="blue"
                      className="m-0"
                    >
                      {record.files.length} file
                    </Tag>
                  )}
                </div>
              ),
              children: <MedicalRecordContent record={record} />,
            }))}
          />
        )}
      </Card>
    </div>
  );
}

/* ========== Nội dung bên trong mỗi hồ sơ ========== */
function MedicalRecordContent({ record }: { record: MedicalRecord }) {
  const files = record.files || [];

  const imageFiles = files.filter(
    (f) =>
      f.mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f.fileName || ""),
  );

  const documentFiles = files.filter(
    (f) =>
      !(
        f.mimeType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f.fileName || "")
      ),
  );

  return (
    <div className="space-y-5 pt-1">
      <div className="space-y-2 text-sm">
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

      {imageFiles.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
            <FileImageOutlined />
            <span>Hình ảnh ({imageFiles.length})</span>
          </div>
          <Row gutter={[12, 12]}>
            {imageFiles.map((file) => (
              <Col key={file.id} xs={12} sm={8} md={6} lg={4}>
                <ImageFileItem file={file} />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {documentFiles.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
            <FilePdfOutlined />
            <span>Tài liệu đính kèm ({documentFiles.length})</span>
          </div>
          <Row gutter={[12, 12]}>
            {documentFiles.map((file) => (
              <Col key={file.id} xs={12} sm={8} md={6} lg={4}>
                <DocumentFileItem file={file} />
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}

/* ========== Ảnh thumbnail ========== */
function ImageFileItem({ file }: { file: MedicalRecordFile }) {
  return (
    <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={file.fileUrl}
          alt={file.fileName}
          className="h-full w-full object-cover"
          preview={{ mask: "Xem ảnh" }}
          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120' viewBox='0 0 160 120'%3E%3Crect fill='%23f0f0f0' width='160' height='120'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E"
        />
      </div>
      <div className="px-2 py-1.5">
        <Text
          ellipsis={{ tooltip: file.fileName }}
          className="block text-xs font-medium"
        >
          {file.fileName}
        </Text>
      </div>
    </div>
  );
}

/* ========== Tài liệu (PDF...) ========== */
function DocumentFileItem({ file }: { file: MedicalRecordFile }) {
  const fileExt = file.mimeType
    ? file.mimeType.split("/").pop()?.toUpperCase()
    : "FILE";

  return (
    <a
      href={file.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-[110px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex h-[60px] items-center justify-center bg-red-50">
        <FilePdfOutlined
          style={{ fontSize: 26 }}
          className="text-red-500 transition group-hover:scale-110"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center px-2 py-1.5">
        <Text
          ellipsis={{ tooltip: file.fileName }}
          className="block text-xs font-medium leading-tight"
        >
          {file.fileName}
        </Text>
        <Text type="secondary" className="text-[10px]">
          {fileExt}
        </Text>
      </div>
    </a>
  );
}