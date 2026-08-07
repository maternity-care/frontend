"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Typography,
  message,
} from "antd";
import { Trash2 } from "lucide-react";

import type {
  CreateMedicalRecordFileInput,
  MedicalRecord,
  UpdateMedicalRecordInput,
} from "@/management/features/management-pregnancy-profiles/medical-records/management-medical-records.types";
import {
  deleteManagementMedicalRecord,
  getManagementMedicalRecordById,
  updateManagementMedicalRecord,
} from "@/management/features/management-pregnancy-profiles/medical-records/management-medical-records.api";

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  open: boolean;
  medicalRecordId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            error?: string;
          };
        };
      }
    ).response;

    const serverMessage = response?.data?.message;

    if (Array.isArray(serverMessage)) {
      return serverMessage.join(", ");
    }

    if (typeof serverMessage === "string") {
      return serverMessage;
    }

    if (response?.data?.error) {
      return response.data.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi không xác định.";
}

export function UpdateMedicalRecordModal({
  open,
  medicalRecordId,
  onCancel,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [files, setFiles] = useState<CreateMedicalRecordFileInput[]>([]);

  useEffect(() => {
    if (!open || !medicalRecordId) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getManagementMedicalRecordById(medicalRecordId);
        setRecord(data);
        setFiles(
          data.files.map((f) => ({
            fileType: f.fileType,
            fileName: f.fileName,
            fileUrl: f.fileUrl,
            mimeType: f.mimeType,
          })),
        );
        form.setFieldsValue({
          diagnosis: data.diagnosis,
          conclusion: data.conclusion,
          recommendation: data.recommendation,
          nextAppointmentSuggestedAt: data.nextAppointmentSuggestedAt
            ? dayjs(data.nextAppointmentSuggestedAt)
            : null,
        });
      } catch {
        message.error("Không tải được kết quả khám");
        onCancel();
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [open, medicalRecordId, form, onCancel]);

  const handleSubmit = async () => {
    if (!medicalRecordId) return;

    try {
      const values = await form.validateFields();

      setLoading(true);

      const input: UpdateMedicalRecordInput = {
        diagnosis: values.diagnosis,
        conclusion: values.conclusion || null,
        recommendation: values.recommendation || null,
        nextAppointmentSuggestedAt: values.nextAppointmentSuggestedAt
          ? values.nextAppointmentSuggestedAt.toISOString()
          : null,
        files,
      };

      await updateManagementMedicalRecord(medicalRecordId, input);
      message.success("Cập nhật kết quả khám thành công");
      onSuccess();
    } catch (error) {
      message.error(getErrorMessage(error) || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!medicalRecordId) return;

    Modal.confirm({
      title: "Xóa kết quả khám?",
      content:
        "Bạn có chắc chắn muốn xóa kết quả khám này? Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        setDeleting(true);
        try {
          await deleteManagementMedicalRecord(medicalRecordId);
          message.success("Đã xóa kết quả khám");
          onSuccess();
        } catch (error) {
          message.error(getErrorMessage(error) || "Xóa thất bại");
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  return (
    <Modal
      open={open}
      title="Cập nhật kết quả khám"
      width={720}
      confirmLoading={loading}
      onCancel={onCancel}
      footer={[
        <Button
          key="delete"
          danger
          icon={<Trash2 size={16} />}
          loading={deleting}
          onClick={handleDelete}
        >
          Xóa
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="ok"
          type="primary"
          loading={loading}
          onClick={() => void handleSubmit()}
        >
          Lưu thay đổi
        </Button>,
      ]}
      destroyOnHidden
    >
      {record && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title={`Bác sĩ phụ trách: ${record.doctor?.name || "—"}`}
        />
      )}

      <Form form={form} layout="vertical" disabled={loading}>
        <Form.Item
          name="diagnosis"
          label="Chẩn đoán"
          rules={[{ required: true, message: "Vui lòng nhập chẩn đoán" }]}
        >
          <TextArea rows={2} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="conclusion" label="Kết luận">
              <TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="recommendation" label="Khuyến nghị">
              <TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="nextAppointmentSuggestedAt"
          label="Ngày tái khám đề xuất"
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <div style={{ marginTop: 8 }}>
          <Text strong>Tài liệu đính kèm ({files.length})</Text>
          <div
            style={{
              maxHeight: 180,
              overflowY: "auto",
              marginTop: 8,
              border: "1px solid #f0f0f0",
              borderRadius: 6,
              padding: 8,
            }}
          >
            {files.length === 0 ? (
              <Text type="secondary">Chưa có file</Text>
            ) : (
              files.map((f, idx) => (
                <div
                  key={`${f.fileUrl}-${idx}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                    borderBottom: "1px solid #f5f5f5",
                  }}
                >
                  <Text ellipsis style={{ maxWidth: 420 }}>
                    {f.fileName}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Gỡ
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
}