"use client";

import { useState } from "react";
import type { Dayjs } from "dayjs";
import {
  Alert,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  TimePicker,
  Typography,
} from "antd";
import { CalendarPlus, Layers3, X } from "lucide-react";
import type {
  BulkCreateDoctorShiftsInput,
  DoctorShiftStatus,
  DoctorShiftWorkingDay,
} from "@/management/features/doctor-shifts/doctor-shifts.types";

const { Text, Title } = Typography;

const WORKING_DAY_OPTIONS = [
  { label: "Thứ 2", value: "MON" },
  { label: "Thứ 3", value: "TUE" },
  { label: "Thứ 4", value: "WED" },
  { label: "Thứ 5", value: "THU" },
  { label: "Thứ 6", value: "FRI" },
  { label: "Thứ 7", value: "SAT" },
  { label: "Chủ nhật", value: "SUN" },
];

const STATUS_OPTIONS = [
  { value: "available", label: "Còn trống" },
  { value: "full", label: "Đã đầy" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "off", label: "Nghỉ" },
];

type BulkCreateFields = {
  doctorId: string;
  facilityId: string;
  roomId: number;
  dateRange: [Dayjs, Dayjs];
  workingDays: DoctorShiftWorkingDay[];
  startTime: Dayjs;
  endTime: Dayjs;
  maxAppointments: number;
  status: DoctorShiftStatus;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: BulkCreateDoctorShiftsInput) => Promise<void>;
};

export function DoctorShiftBulkCreateModal({ open, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<BulkCreateFields>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (submitting) return;
    form.resetFields();
    setError(null);
    onClose();
  }

  async function finish(values: BulkCreateFields) {
    const duration = values.endTime.diff(values.startTime, "minute");
    if (duration < 30 || duration > 12 * 60) {
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
        fromDate: values.dateRange[0].format("YYYY-MM-DD"),
        toDate: values.dateRange[1].format("YYYY-MM-DD"),
        workingDays: values.workingDays,
        startTime: values.startTime.format("HH:mm"),
        endTime: values.endTime.format("HH:mm"),
        maxAppointments: values.maxAppointments,
        status: values.status,
      });
      form.resetFields();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể tạo lịch hàng loạt.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      width={760}
      centered
      title={null}
      footer={null}
      onCancel={close}
      mask={{ closable: !submitting }}
      destroyOnHidden
    >
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Layers3 className="h-5 w-5" />
        </div>
        <div>
          <Title level={3} className="!mb-1 !text-slate-950">
            Tạo ca trực hàng loạt
          </Title>
          <Text className="text-slate-500">
            Tạo nhiều ca theo khoảng ngày và các thứ làm việc đã chọn.
          </Text>
        </div>
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
        className="mt-5"
        initialValues={{
          workingDays: ["MON", "WED", "FRI"],
          maxAppointments: 4,
          status: "available",
        }}
        onFinish={finish}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="doctorId"
              label="Doctor ID"
              rules={[{ required: true, message: "Vui lòng nhập Doctor ID." }]}
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
              ]}
            >
              <Input size="large" placeholder="Ví dụ: 1" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="roomId"
              label="Room ID"
              rules={[{ required: true, message: "Vui lòng nhập Room ID." }]}
            >
              <InputNumber
                min={1}
                precision={0}
                size="large"
                className="w-full"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="dateRange"
              label="Khoảng ngày"
              rules={[
                { required: true, message: "Vui lòng chọn khoảng ngày." },
              ]}
            >
              <DatePicker.RangePicker
                size="large"
                format="DD/MM/YYYY"
                className="w-full"
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              name="workingDays"
              label="Ngày làm việc"
              rules={[
                {
                  required: true,
                  type: "array",
                  min: 1,
                  message: "Vui lòng chọn ít nhất một ngày làm việc.",
                },
              ]}
            >
              <Checkbox.Group options={WORKING_DAY_OPTIONS} />
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
                { required: true, message: "Vui lòng chọn giờ kết thúc." },
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
          <Col xs={24} md={8}>
            <Form.Item
              name="maxAppointments"
              label="Số lịch tối đa"
              rules={[
                { required: true, message: "Vui lòng nhập số lịch tối đa." },
              ]}
            >
              <InputNumber
                min={1}
                max={100}
                precision={0}
                size="large"
                className="w-full"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
            >
              <Select size="large" options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <div className="mt-2 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={close} disabled={submitting}>
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            <CalendarPlus className="mr-1 h-4 w-4" />
            Tạo lịch
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
