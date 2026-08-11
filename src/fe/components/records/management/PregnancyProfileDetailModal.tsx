"use client";

import {
  Alert,
  Button,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ExternalLink,
  FileText,
  Pencil,
  Stethoscope,
  UserRound,
} from "lucide-react";

import type {
  ManagementMedicalRecord,
  ManagementPregnancyProfile,
  PregnancyConsultationRecord,
  PregnancyProfileMedicalRecordFile,
  PregnancyProfilePdfRecord,
} from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";

const { Text, Title, Paragraph } = Typography;

interface Props {
  open: boolean;
  profile: ManagementPregnancyProfile | null;
  onClose: () => void;
  onEdit: (profile: ManagementPregnancyProfile) => void;
  onEditMedicalRecord?: (recordId: string) => void;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(value?: number | null): string {
  if (!value || value <= 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(status: ManagementPregnancyProfile["status"]) {
  switch (status) {
    case "completed":
      return <Tag color="blue">Đã hoàn thành</Tag>;
    case "terminated":
      return <Tag color="orange">Đã kết thúc</Tag>;
    case "deleted":
      return <Tag>Đã xóa</Tag>;
    default:
      return <Tag color="green">Đang theo dõi</Tag>;
  }
}

function getRiskLabel(riskLevel: ManagementPregnancyProfile["riskLevel"]) {
  switch (riskLevel) {
    case "high":
      return <Tag color="red">Nguy cơ cao</Tag>;
    case "medium":
      return <Tag color="orange">Nguy cơ trung bình</Tag>;
    default:
      return <Tag color="green">Nguy cơ thấp</Tag>;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFileNameFromString(record: string, index: number): string {
  if (!isHttpUrl(record)) return record || `Tài liệu ${index + 1}`;
  try {
    const url = new URL(record);
    const lastSegment = url.pathname.split("/").filter(Boolean).at(-1);
    return lastSegment
      ? decodeURIComponent(lastSegment)
      : `Tài liệu ${index + 1}`;
  } catch {
    return `Tài liệu ${index + 1}`;
  }
}

function isConsultationRecord(
  value: ManagementMedicalRecord,
): value is PregnancyConsultationRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "diagnosis" in value &&
    "appointmentId" in value
  );
}

function isPdfRecord(
  value: ManagementMedicalRecord,
): value is PregnancyProfilePdfRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    "name" in value
  );
}

/* ===== Document Card ===== */
interface DocumentCardProps {
  record: string | PregnancyProfilePdfRecord;
  index: number;
}

function DocumentCard({ record, index }: DocumentCardProps) {
  const isStringRecord = typeof record === "string";
  const url = isStringRecord ? record : record.url;
  const name = isStringRecord
    ? getFileNameFromString(record, index)
    : record.name || `Tài liệu ${index + 1}`;
  const canOpen = isHttpUrl(url);

  const details = isStringRecord
    ? canOpen
      ? "Tài liệu PDF"
      : `Mã tham chiếu: ${record}`
    : [
        record.mimeType || "Tài liệu PDF",
        formatFileSize(record.size),
        record.createdAt ? `Tải lên: ${formatDateTime(record.createdAt)}` : "",
      ]
        .filter(Boolean)
        .join(" • ");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px",
        border: "1px solid #f0f0f0",
        borderRadius: 6,
        background: "#fafafa",
      }}
    >
      <Space align="start" size={10}>
        <FileText size={18} />
        <div style={{ minWidth: 0 }}>
          <Text strong style={{ fontSize: 13 }} ellipsis>
            {name}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {details}
          </Text>
        </div>
      </Space>
      {canOpen && (
        <Button
          type="link"
          size="small"
          icon={<ExternalLink size={14} />}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Mở
        </Button>
      )}
    </div>
  );
}

/* ===== File thuộc lần khám ===== */
interface MedicalRecordFileCardProps {
  file: PregnancyProfileMedicalRecordFile;
}

function MedicalRecordFileCard({ file }: MedicalRecordFileCardProps) {
  const canOpen = isHttpUrl(file.fileUrl);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 10px",
        border: "1px solid #f0f0f0",
        borderRadius: 6,
        background: "#fafafa",
      }}
    >
      <Space align="start" size={8}>
        <FileText size={16} />
        <div style={{ minWidth: 0 }}>
          <Text strong style={{ fontSize: 13 }} ellipsis>
            {file.fileName}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {[
              file.fileType,
              file.mimeType,
              file.createdAt ? `Tải lên: ${formatDateTime(file.createdAt)}` : "",
            ]
              .filter(Boolean)
              .join(" • ")}
          </Text>
        </div>
      </Space>
      {canOpen && (
        <Button
          type="link"
          size="small"
          icon={<ExternalLink size={13} />}
          href={file.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Mở
        </Button>
      )}
    </div>
  );
}

/* ===== Main Modal ===== */
export function PregnancyProfileDetailModal({
  open,
  profile,
  onClose,
  onEdit,
  onEditMedicalRecord,
}: Props) {
  if (!profile) return null;

  const user = profile.user;

  const fileRecords = profile.medicalRecords.filter(
    (record): record is string | PregnancyProfilePdfRecord =>
      typeof record === "string" || isPdfRecord(record),
  );

  const embeddedConsultations =
    profile.medicalRecords.filter(isConsultationRecord);

  const consultationMap = new Map<string, PregnancyConsultationRecord>();
  [...profile.consultations, ...embeddedConsultations].forEach((c) => {
    const key = c.id || `${c.appointmentId}-${c.createdAt}`;
    consultationMap.set(key, c);
  });
  const consultations = Array.from(consultationMap.values());

  // Sắp xếp mới nhất lên đầu (nếu muốn)
  // consultations.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const allFilesFromConsultations: PregnancyProfileMedicalRecordFile[] = [];
  const seenFileIds = new Set<string>();
  consultations.forEach((c) => {
    (c.files ?? []).forEach((file) => {
      if (file.id && !seenFileIds.has(file.id)) {
        seenFileIds.add(file.id);
        allFilesFromConsultations.push(file);
      } else if (!file.id) {
        allFilesFromConsultations.push(file);
      }
    });
  });

  const totalMedicalDocuments =
    fileRecords.length + allFilesFromConsultations.length;

  return (
    <Modal
      open={open}
      title="Chi tiết hồ sơ thai kỳ"
      width={1000}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<Pencil size={16} />}
          disabled={profile.status === "deleted"}
          onClick={() => onEdit(profile)}
        >
          Cập nhật hồ sơ
        </Button>,
      ]}
    >
      <Space orientation="vertical" size={20} style={{ width: "100%" }}>
        {profile.status === "deleted" && (
          <Alert
            type="warning"
            showIcon
            title="Hồ sơ này đã bị xóa"
            description={
              profile.deletedReason
                ? `Lý do: ${profile.deletedReason}`
                : "Không thể tiếp tục cập nhật hồ sơ."
            }
          />
        )}

        <div>
          <Space align="start">
            <UserRound size={24} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {user?.name || "Chưa cập nhật tên thai phụ"}
              </Title>
              <Text type="secondary">
                Mã hồ sơ: {profile.code || profile.id}
              </Text>
            </div>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Descriptions
              title="Thông tin thai phụ"
              bordered
              size="small"
              column={1}
            >
              <Descriptions.Item label="Mã bệnh nhân">
                {profile.patientId || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="CCCD">
                {user?.cccd || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {formatDate(user?.dateOfBirth)}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {user?.phone || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {user?.email || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {[user?.address, user?.ward, user?.district, user?.province]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Liên hệ khẩn cấp">
                {user?.emergencyContactName || "—"}
                {user?.emergencyContactPhone
                  ? ` – ${user.emergencyContactPhone}`
                  : ""}
              </Descriptions.Item>
            </Descriptions>
          </Col>

          <Col xs={24} lg={12}>
            <Descriptions
              title="Thông tin thai kỳ"
              bordered
              size="small"
              column={1}
            >
              <Descriptions.Item label="Ngày đầu kỳ kinh cuối">
                {formatDate(profile.lastMenstrualPeriod)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày dự sinh">
                {formatDate(profile.expectedDueDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Số thai">
                {profile.fetalCount ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Mức nguy cơ">
                {getRiskLabel(profile.riskLevel)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusLabel(profile.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {formatDateTime(profile.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {formatDateTime(profile.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Descriptions
          title="Tiền sử sản khoa"
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 5 }}
        >
          <Descriptions.Item label="Số lần mang thai">
            {profile.gravida}
          </Descriptions.Item>
          <Descriptions.Item label="Sinh đủ tháng">
            {profile.paraFullTerm}
          </Descriptions.Item>
          <Descriptions.Item label="Sinh non">
            {profile.paraPremature}
          </Descriptions.Item>
          <Descriptions.Item label="Sảy/phá thai">
            {profile.paraAbortion}
          </Descriptions.Item>
          <Descriptions.Item label="Con đang sống">
            {profile.paraLivingChildren}
          </Descriptions.Item>
        </Descriptions>

        <div>
          <Title level={5}>Ghi chú chuyên môn</Title>
          <Paragraph
            style={{
              margin: 0,
              padding: 12,
              whiteSpace: "pre-wrap",
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
            }}
          >
            {profile.notes || "Chưa có ghi chú."}
          </Paragraph>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* ===== TÀI LIỆU Y TẾ ===== */}
        <div>
          <Title level={5}>Tài liệu y tế ({totalMedicalDocuments})</Title>

          {totalMedicalDocuments === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có tài liệu"
            />
          ) : (
            <div
              style={{
                maxHeight: 280,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingRight: 4,
              }}
            >
              {fileRecords.map((record, index) => (
                <DocumentCard
                  key={
                    typeof record === "string"
                      ? `${record}-${index}`
                      : record.id
                  }
                  record={record}
                  index={index}
                />
              ))}
              {allFilesFromConsultations.map((file) => (
                <MedicalRecordFileCard
                  key={file.id || file.fileUrl}
                  file={file}
                />
              ))}
            </div>
          )}
        </div>

        <Divider style={{ margin: 0 }} />

        {/* ===== KẾT QUẢ KHÁM – dùng Collapse ===== */}
        <div>
          <Title level={5}>Kết quả khám ({consultations.length})</Title>

          {consultations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có kết quả khám"
            />
          ) : (
            <Collapse
              accordion={false}
              defaultActiveKey={[]} // mặc định đóng hết → không bị cao
              // defaultActiveKey={consultations[0]?.id ? [consultations[0].id] : []} // nếu muốn mở cái mới nhất
              items={consultations.map((consultation, index) => {
                const key = consultation.id || `consultation-${index}`;

                return {
                  key,
                  label: (
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{ width: "100%", paddingRight: 8 }}
                    >
                      <Space size={8}>
                        <Stethoscope size={18} />
                        <Text strong>
                          Kết quả khám{" "}
                          {consultation.createdAt
                            ? `– ${formatDateTime(consultation.createdAt)}`
                            : `#${index + 1}`}
                        </Text>
                        {consultation.conclusion && (
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            • {consultation.conclusion}
                          </Text>
                        )}
                      </Space>

                      {/* {onEditMedicalRecord && consultation.id && (
                        <Button
                          type="link"
                          size="small"
                          icon={<Pencil size={14} />}
                          onClick={(e) => {
                            e.stopPropagation(); // quan trọng
                            onEditMedicalRecord(consultation.id);
                          }}
                        >
                          Sửa
                        </Button>
                      )} */}
                    </Flex>
                  ),
                  children: (
                    <div>
                      <Descriptions
                        size="small"
                        column={{ xs: 1, md: 2 }}
                        style={{
                          marginBottom:
                            consultation.files && consultation.files.length > 0
                              ? 16
                              : 0,
                        }}
                      >
                        <Descriptions.Item label="Chẩn đoán">
                          {consultation.diagnosis || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kết luận">
                          {consultation.conclusion || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Khuyến nghị">
                          {consultation.recommendation || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tái khám đề xuất">
                          {formatDateTime(
                            consultation.nextAppointmentSuggestedAt,
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã lịch hẹn">
                          {consultation.appointmentId || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã bác sĩ">
                          {consultation.doctorId || "—"}
                        </Descriptions.Item>
                      </Descriptions>

                      {consultation.files &&
                        consultation.files.length > 0 && (
                          <div>
                            <Text
                              strong
                              style={{ display: "block", marginBottom: 8 }}
                            >
                              Tài liệu đính kèm ({consultation.files.length})
                            </Text>
                            <div
                              style={{
                                maxHeight: 200,
                                overflowY: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {consultation.files.map((file) => (
                                <MedicalRecordFileCard
                                  key={file.id || file.fileUrl}
                                  file={file}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ),
                };
              })}
            />
          )}
        </div>
      </Space>
    </Modal>
  );
}