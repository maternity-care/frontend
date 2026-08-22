"use client";

import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Upload,
  message,
  Typography,
  Spin,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import { Upload as UploadIcon } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import { createManagementPresignedUpload } from "@/management/features/uploads/uploads.api";
import { API_BASE_URL } from "@/lib/constants";
import type { ManagementPregnancyProfile } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  CreateMedicalRecordFileInput,
  CreateMedicalRecordInput,
  Appointment,
  PendingMedicalRecordFile,
} from "@/management/features/management-pregnancy-profiles/medical-records/management-medical-records.types";
import {
  createManagementMedicalRecord,
  getAppointmentsByPregnancyProfileId,
  getPendingMedicalRecordFiles,
} from "@/management/features/management-pregnancy-profiles/medical-records/management-medical-records.api";

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  open: boolean;
  profile: ManagementPregnancyProfile | null;
  initialAppointmentId?: string | null;
  initialAppointmentServiceItemId?: string | null;
  initialAppointmentLabel?: string | null;
  initialDoctorLabel?: string | null;
  loading?: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormValues {
  appointmentId: string;
  doctorId: string;
  diagnosis: string;
  conclusion?: string;
  recommendation?: string;
  nextAppointmentSuggestedAt?: dayjs.Dayjs | null;
}

export function CreateMedicalRecordModal({
  open,
  profile,
  initialAppointmentId,
  initialAppointmentServiceItemId,
  initialAppointmentLabel,
  initialDoctorLabel,
  onCancel,
  onSuccess,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const { doctorId, isDoctor, user } = useCurrentUser();
  const selectedAppointmentId = Form.useWatch("appointmentId", form);
  const selectedAppointment = appointments.find(
    (appointment) => String(appointment.id) === String(selectedAppointmentId || ""),
  );
  const appointmentDoctorId = selectedAppointment?.doctorId ?? null;
  const effectiveDoctorId = isDoctor ? doctorId : appointmentDoctorId;

  const appointmentOptions = appointments.map((item) => {
    const id = String(item.id);
    const timeLabel = item.appointmentAt
      ? dayjs(item.appointmentAt).format("DD/MM/YYYY HH:mm")
      : "Chưa có giờ";

    return {
      value: id,
      label: `#${id} • ${timeLabel}${item.status ? ` • ${item.status}` : ""}`,
    };
  });

  if (
    initialAppointmentId &&
    !appointmentOptions.some((option) => option.value === String(initialAppointmentId))
  ) {
    appointmentOptions.unshift({
      value: String(initialAppointmentId),
      label: initialAppointmentLabel || `Lịch #${initialAppointmentId}`,
    });
  }

  const doctorDisplayLabel =
    initialDoctorLabel ||
    (isDoctor && user?.name ? user.name : "") ||
    (effectiveDoctorId ? `Bác sĩ #${effectiveDoctorId}` : "");

  const appendPendingFiles = useCallback((pendingFiles: PendingMedicalRecordFile[]) => {
    if (!pendingFiles.length) return;

    setFileList((currentFiles) => {
      const existingUrls = new Set(
        currentFiles
          .map((file) => file.response?.publicUrl || file.url)
          .filter(Boolean),
      );

      const helperFiles = pendingFiles
        .filter((file) => file.fileUrl && !existingUrls.has(file.fileUrl))
        .map<UploadFile>((file) => ({
          uid: `helper-${file.id}`,
          name: file.fileName,
          status: "done",
          url: file.fileUrl,
          type: file.mimeType,
          response: {
            publicUrl: file.fileUrl,
            helperPendingId: file.id,
          },
        }));

      return helperFiles.length ? [...currentFiles, ...helperFiles] : currentFiles;
    });
  }, []);

  // Tự điền doctorId
  useEffect(() => {
    if (!open) return;
    if (effectiveDoctorId) {
      form.setFieldsValue({ doctorId: effectiveDoctorId });
    }
  }, [open, effectiveDoctorId, form]);

  useEffect(() => {
    if (!open || !initialAppointmentId) return;
    form.setFieldsValue({ appointmentId: String(initialAppointmentId) });
  }, [form, initialAppointmentId, open]);

  useEffect(() => {
    const appointmentId = String(selectedAppointmentId || "").trim();
    if (!open || !appointmentId) return;

    let cancelled = false;
    void getPendingMedicalRecordFiles(appointmentId)
      .then((files) => {
        if (!cancelled) appendPendingFiles(files);
      })
      .catch(() => {
        if (!cancelled) {
          message.warning("Không tải được file helper đang chờ của lịch hẹn.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [appendPendingFiles, open, selectedAppointmentId]);

  useEffect(() => {
    const appointmentId = String(selectedAppointmentId || "").trim();
    if (!open || !appointmentId) return;

    const socket: Socket = io(`${API_BASE_URL}/realtime`, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("appointment:join", { appointmentId });
    });

    socket.on("medical-record:file.pending", (file: PendingMedicalRecordFile) => {
      if (String(file.appointmentId) !== appointmentId) return;
      appendPendingFiles([file]);
      message.success(`Helper đã thêm file: ${file.fileName}`);
    });

    return () => {
      socket.emit("appointment:leave", { appointmentId });
      socket.disconnect();
    };
  }, [appendPendingFiles, open, selectedAppointmentId]);

  // Load appointments theo pregnancyProfileId
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!open || !profile?.id) {
        setAppointments([]);
        return;
      }

      const loadAppointments = async () => {
        setLoadingAppointments(true);
        try {
          const data = await getAppointmentsByPregnancyProfileId(profile.id);
          if (!cancelled) {
            setAppointments(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          if (!cancelled) {
            console.error(err);
            message.error(
              err instanceof Error
                ? err.message
                : "Không tải được danh sách lịch hẹn",
            );
            setAppointments([]);
          }
        } finally {
          if (!cancelled) {
            setLoadingAppointments(false);
          }
        }
      };

      void loadAppointments();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, profile?.id]);

  const handleUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess: onUploadSuccess, onError } = options;
    const rawFile = file as File;

    setUploading(true);
    try {
      const presign = await createManagementPresignedUpload({
        fileName: rawFile.name,
        mimeType: rawFile.type || "application/octet-stream",
        size: rawFile.size,
        path: `medical-records/${profile?.id || "unknown"}`,
        baseName: "medical-record",
      });

      const putRes = await fetch(presign.url, {
        method: presign.method || "PUT",
        headers: {
          "Content-Type": rawFile.type || "application/octet-stream",
          ...presign.headers,
        },
        body: rawFile,
      });

      if (!putRes.ok) {
        throw new Error("Upload file thất bại");
      }

      setFileList((prev) =>
        prev.map((f) =>
          f.uid === (file as UploadFile).uid
            ? {
                ...f,
                status: "done",
                url: presign.publicUrl,
                response: {
                  publicUrl: presign.publicUrl,
                  key: presign.key,
                },
              }
            : f,
        ),
      );

      onUploadSuccess?.(presign);
      message.success(`Đã upload: ${rawFile.name}`);
    } catch (err) {
      onError?.(err as Error);
      message.error(
        err instanceof Error ? err.message : "Upload file thất bại",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (file: UploadFile) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  const handleSubmit = async () => {
    if (!profile) return;

    try {
      const values = await form.validateFields();
      const recordDoctorId = isDoctor ? doctorId : selectedAppointment?.doctorId;
      if (!recordDoctorId) {
        message.error("Không xác định được bác sĩ phụ trách lịch hẹn.");
        return;
      }
      setSubmitting(true);

      const files: CreateMedicalRecordFileInput[] = fileList
        .filter((f) => f.status === "done" && f.response?.publicUrl)
        .map((f) => ({
          fileType: f.type?.startsWith("image/")
            ? "clinical_image"
            : "clinical_report",
          fileName: f.name,
          fileUrl: f.response.publicUrl as string,
          mimeType: f.type || "application/octet-stream",
        }));

      const input: CreateMedicalRecordInput = {
        appointmentId: String(values.appointmentId).trim(),
        appointmentServiceItemId: initialAppointmentServiceItemId
          ? String(initialAppointmentServiceItemId)
          : null,
        pregnancyProfileId: profile.id,
        doctorId: recordDoctorId,
        diagnosis: values.diagnosis.trim(),
        conclusion: values.conclusion?.trim() || null,
        recommendation: values.recommendation?.trim() || null,
        nextAppointmentSuggestedAt: values.nextAppointmentSuggestedAt
          ? values.nextAppointmentSuggestedAt.toISOString()
          : null,
        files: files.length > 0 ? files : undefined,
      };

      await createManagementMedicalRecord(input);

      message.success("Tạo kết quả khám thành công");
      form.resetFields();
      setFileList([]);
      onSuccess();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) {
        return;
      }
      message.error(
        err instanceof Error ? err.message : "Không tạo được kết quả khám",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting || uploading) return;
    form.resetFields();
    setFileList([]);
    onCancel();
  };

  return (
    <Modal
      open={open}
      title="Thêm kết quả khám"
      width={720}
      okText="Lưu kết quả khám"
      cancelText="Hủy"
      confirmLoading={submitting}
      mask={{ closable: !submitting && !uploading }}
      keyboard={!submitting && !uploading}
      onCancel={handleCancel}
      onOk={() => void handleSubmit()}
      afterClose={() => {
        form.resetFields();
        setFileList([]);
        setAppointments([]);
      }}
      destroyOnHidden
    >
      {profile && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Hồ sơ: <strong>{profile.code || profile.id}</strong> • Thai phụ:{" "}
            <strong>{profile.user?.name || "Chưa có tên"}</strong>
          </Text>
        </div>
      )}

      <Form form={form} layout="vertical" disabled={submitting}>
        <Form.Item
          name="appointmentId"
          label="Lịch hẹn"
          rules={[{ required: true, message: "Vui lòng chọn lịch hẹn" }]}
        >
          <Select
            placeholder={
              loadingAppointments
                ? "Đang tải danh sách lịch hẹn..."
                : appointments.length === 0
                  ? "Không có lịch hẹn nào"
                  : "Chọn lịch hẹn"
            }
            loading={loadingAppointments}
            // Chỉ disable khi đang load, KHÔNG disable khi rỗng
            disabled={loadingAppointments}
            allowClear
            showSearch
            optionFilterProp="label"
            // Quan trọng: fix dropdown bị ẩn trong Modal
            getPopupContainer={(trigger) =>
              trigger.parentElement || document.body
            }
            notFoundContent={
              loadingAppointments ? (
                <div style={{ textAlign: "center", padding: 12 }}>
                  <Spin size="small" />
                </div>
              ) : (
                "Không có lịch hẹn nào"
              )
            }
            options={appointmentOptions}
          />
        </Form.Item>

        <Form.Item label="Bác sĩ phụ trách">
          <Input
            disabled
            value={doctorDisplayLabel}
            placeholder="Không xác định được bác sĩ"
          />
        </Form.Item>

        <Form.Item
          name="diagnosis"
          label="Chẩn đoán"
          rules={[{ required: true, message: "Vui lòng nhập chẩn đoán" }]}
        >
          <TextArea rows={2} placeholder="Nhập chẩn đoán..." />
        </Form.Item>

        <Form.Item name="conclusion" label="Kết luận">
          <TextArea rows={2} placeholder="Nhập kết luận..." />
        </Form.Item>

        <Form.Item name="recommendation" label="Khuyến nghị">
          <TextArea rows={2} placeholder="Nhập khuyến nghị..." />
        </Form.Item>

        <Form.Item
          name="nextAppointmentSuggestedAt"
          label="Ngày tái khám đề xuất"
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: "100%" }}
            placeholder="Chọn ngày giờ"
          />
        </Form.Item>

        <Form.Item label="Tài liệu đính kèm">
          <Upload
            multiple
            fileList={fileList}
            customRequest={handleUpload}
            onRemove={handleRemove}
            onChange={({ fileList: newList }) => setFileList(newList)}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            disabled={uploading || submitting}
          >
            <Button icon={<UploadIcon size={16} />} loading={uploading}>
              Chọn file & Upload
            </Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
