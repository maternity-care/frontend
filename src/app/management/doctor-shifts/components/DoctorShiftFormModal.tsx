"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  TimePicker,
  Typography,
} from "antd";
import {
  Building2,
  CalendarDays,
  Clock3,
  DoorOpen,
  Save,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import type {
  CreateDoctorShiftInput,
  DoctorShiftItem,
  DoctorShiftStatus,
} from "@/management/features/doctor-shifts/doctor-shifts.types";

const { Text, Title } = Typography;

const STATUS_OPTIONS = [
  { value: "available", label: "Còn trống" },
  { value: "full", label: "Đã đầy" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "off", label: "Nghỉ" },
];

type DoctorShiftFormFields = {
  doctorId: string;
  facilityId: string;
  roomId: number;
  shiftDate: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  maxAppointments: number;
  status: DoctorShiftStatus;
};

type DoctorShiftFormModalProps = {
  open: boolean;
  shift?: DoctorShiftItem | null;
  onClose: () => void;
  onSubmit: (values: CreateDoctorShiftInput) => Promise<void>;
};

function statusLabel(status?: DoctorShiftStatus) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status)?.label ?? "Còn trống"
  );
}

function statusColor(status?: DoctorShiftStatus) {
  if (status === "available") return "green";
  if (status === "full") return "orange";
  if (status === "cancelled") return "red";
  return "default";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Không thể lưu ca trực. Vui lòng thử lại.";
}

function PreviewItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="mb-0 text-xs font-semibold uppercase text-slate-400">
          {label}
        </p>
        <div className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value || "Chưa nhập"}
        </div>
      </div>
    </div>
  );
}

export function DoctorShiftFormModal({
  open,
  shift,
  onClose,
  onSubmit,
}: DoctorShiftFormModalProps) {
  const [form] = Form.useForm<DoctorShiftFormFields>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctorId = Form.useWatch("doctorId", form);
  const facilityId = Form.useWatch("facilityId", form);
  const roomId = Form.useWatch("roomId", form);
  const shiftDate = Form.useWatch("shiftDate", form);
  const startTime = Form.useWatch("startTime", form);
  const endTime = Form.useWatch("endTime", form);
  const maxAppointments = Form.useWatch("maxAppointments", form);
  const status = Form.useWatch("status", form);

  useEffect(() => {
    if (!open) return;

    if (shift) {
      form.setFieldsValue({
        doctorId: shift.doctorId,
        facilityId: shift.facilityId,
        roomId: shift.roomId ? Number(shift.roomId) : undefined,
        shiftDate: dayjs(shift.shiftDate),
        startTime: dayjs(`2000-01-01T${shift.startTime}:00`),
        endTime: dayjs(`2000-01-01T${shift.endTime}:00`),
        maxAppointments: shift.maxAppointments,
        status: shift.status,
      });
      return;
    }

    form.setFieldsValue({
      doctorId: "",
      facilityId: "",
      roomId: undefined,
      shiftDate: dayjs(),
      startTime: dayjs("2000-01-01T08:00:00"),
      endTime: dayjs("2000-01-01T12:00:00"),
      maxAppointments: 4,
      status: "available",
    });
  }, [open, shift, form]);

  const durationText = useMemo(() => {
    if (!startTime || !endTime) return "";

    const minutes = endTime.diff(startTime, "minute");
    if (minutes <= 0) return "Thời gian chưa hợp lệ";

    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;

    if (hours && restMinutes) return `${hours} giờ ${restMinutes} phút`;
    if (hours) return `${hours} giờ`;
    return `${restMinutes} phút`;
  }, [startTime, endTime]);

  function handleClose() {
    if (submitting) return;

    form.resetFields();
    setError(null);
    onClose();
  }

  async function handleFinish(values: DoctorShiftFormFields) {
    const durationMinutes = values.endTime.diff(values.startTime, "minute");

    if (durationMinutes < 30 || durationMinutes > 12 * 60) {
      form.setFields([
        {
          name: "endTime",
          errors: ["Ca trực phải kéo dài từ 30 phút đến tối đa 12 giờ."],
        },
      ]);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        doctorId: values.doctorId.trim(),
        facilityId: values.facilityId.trim(),
        roomId: values.roomId,
        shiftDate: values.shiftDate.format("YYYY-MM-DD"),
        startTime: values.startTime.format("HH:mm"),
        endTime: values.endTime.format("HH:mm"),
        maxAppointments: values.maxAppointments,
        status: values.status,
      });

      form.resetFields();
      onClose();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      width={1060}
      centered
      title={null}
      footer={null}
      onCancel={handleClose}
      mask={{ closable: !submitting }}
      destroyOnHidden
    >
      <div className="border-b border-slate-200 pb-4">
        <Title level={3} className="!mb-1 !text-slate-950">
          {shift ? "Cập nhật ca trực" : "Thêm ca trực"}
        </Title>
        <Text className="text-slate-500">
          Thiết lập bác sĩ, cơ sở, phòng và thời gian làm việc. Hệ thống sẽ kiểm
          tra trùng lịch trước khi lưu.
        </Text>
      </div>

      {error ? (
        <Alert
          className="mt-4"
          type="error"
          title={error}
          showIcon
          closable
          onClose={() => setError(null)}
        />
      ) : null}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-5"
      >
        <div className="grid max-h-[68vh] gap-5 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <Card
              className="border-slate-200"
              title={
                <Space>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <Stethoscope className="h-4 w-4" />
                  </span>
                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Phân công ca trực
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Xác định bác sĩ, cơ sở và phòng làm việc.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="doctorId"
                    label="Doctor ID"
                    rules={[
                      { required: true, message: "Vui lòng nhập Doctor ID." },
                      { whitespace: true, message: "Doctor ID không hợp lệ." },
                    ]}
                  >
                    <Input size="large" placeholder="Ví dụ: 1" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="facilityId"
                    label="Facility ID"
                    rules={[
                      { required: true, message: "Vui lòng nhập Facility ID." },
                      {
                        whitespace: true,
                        message: "Facility ID không hợp lệ.",
                      },
                    ]}
                  >
                    <Input size="large" placeholder="Ví dụ: 1" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="roomId"
                    label="Room ID"
                    rules={[
                      { required: true, message: "Vui lòng nhập Room ID." },
                    ]}
                  >
                    <InputNumber
                      size="large"
                      min={1}
                      precision={0}
                      className="w-full"
                      placeholder="Ví dụ: 2"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[
                      { required: true, message: "Vui lòng chọn trạng thái." },
                    ]}
                  >
                    <Select size="large" options={STATUS_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              className="border-slate-200"
              title={
                <Space>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Ngày và thời gian
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Ca trực hợp lệ kéo dài từ 30 phút đến 12 giờ.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="shiftDate"
                    label="Ngày trực"
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày trực." },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      format="DD/MM/YYYY"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="startTime"
                    label="Bắt đầu"
                    rules={[
                      { required: true, message: "Vui lòng chọn giờ bắt đầu." },
                    ]}
                  >
                    <TimePicker
                      size="large"
                      format="HH:mm"
                      minuteStep={5}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="endTime"
                    label="Kết thúc"
                    dependencies={["startTime"]}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn giờ kết thúc.",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value?: Dayjs) {
                          const start = getFieldValue("startTime") as
                            Dayjs | undefined;
                          if (!start || !value || value.isAfter(start)) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Giờ kết thúc phải sau giờ bắt đầu."),
                          );
                        },
                      }),
                    ]}
                  >
                    <TimePicker
                      size="large"
                      format="HH:mm"
                      minuteStep={5}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="maxAppointments"
                    label="Số lịch hẹn tối đa"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số lịch tối đa.",
                      },
                    ]}
                  >
                    <InputNumber
                      size="large"
                      min={1}
                      max={100}
                      precision={0}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5 xl:sticky xl:top-0 xl:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Clock3 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="mb-0 truncate text-base font-semibold text-slate-950">
                  Ca trực bác sĩ #{doctorId || "—"}
                </p>
                <p className="mb-0 text-sm text-slate-500">
                  {shiftDate
                    ? shiftDate.format("DD/MM/YYYY")
                    : "Chưa chọn ngày"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Tag color={statusColor(status)}>{statusLabel(status)}</Tag>
            </div>

            <div className="mt-5 space-y-3">
              <PreviewItem
                icon={<Building2 className="h-4 w-4" />}
                label="Cơ sở"
                value={facilityId ? `Cơ sở #${facilityId}` : undefined}
              />
              <PreviewItem
                icon={<DoorOpen className="h-4 w-4" />}
                label="Phòng"
                value={roomId ? `Phòng #${roomId}` : undefined}
              />
              <PreviewItem
                icon={<Clock3 className="h-4 w-4" />}
                label="Khung giờ"
                value={
                  startTime && endTime
                    ? `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`
                    : undefined
                }
              />
              <PreviewItem
                icon={<CalendarDays className="h-4 w-4" />}
                label="Thời lượng"
                value={durationText}
              />
              <PreviewItem
                icon={<Users className="h-4 w-4" />}
                label="Sức chứa"
                value={
                  maxAppointments
                    ? `${maxAppointments} lịch hẹn tối đa`
                    : undefined
                }
              />
            </div>
          </aside>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={handleClose} disabled={submitting}>
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            <Save className="mr-1 h-4 w-4" />
            {shift ? "Cập nhật ca trực" : "Tạo ca trực"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}