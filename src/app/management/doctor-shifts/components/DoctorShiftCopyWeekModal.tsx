"use client";

import { useState } from "react";
import type { Dayjs } from "dayjs";
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
} from "antd";
import { Copy, X } from "lucide-react";
import type { CopyDoctorShiftWeekInput } from "@/management/features/doctor-shifts/doctor-shifts.types";

const { Text, Title } = Typography;

type CopyWeekFields = {
  facilityId: string;
  doctorId: string;
  sourceWeekStart: Dayjs;
  targetWeekStart: Dayjs;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CopyDoctorShiftWeekInput) => Promise<void>;
};

export function DoctorShiftCopyWeekModal({ open, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<CopyWeekFields>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (submitting) return;
    form.resetFields();
    setError(null);
    onClose();
  }

  async function finish(values: CopyWeekFields) {
    if (values.sourceWeekStart.isSame(values.targetWeekStart, "day")) {
      form.setFields([
        {
          name: "targetWeekStart",
          errors: ["Tuần đích phải khác tuần nguồn."],
        },
      ]);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        facilityId: values.facilityId.trim(),
        doctorId: values.doctorId.trim(),
        sourceWeekStart: values.sourceWeekStart.format("YYYY-MM-DD"),
        targetWeekStart: values.targetWeekStart.format("YYYY-MM-DD"),
      });
      form.resetFields();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể sao chép lịch tuần.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      width={620}
      centered
      title={null}
      footer={null}
      onCancel={close}
      mask={{ closable: !submitting }}
      destroyOnHidden
    >
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Copy className="h-5 w-5" />
        </div>
        <div>
          <Title level={3} className="!mb-1 !text-slate-950">
            Sao chép lịch theo tuần
          </Title>
          <Text className="text-slate-500">
            Sao chép toàn bộ ca trực của một bác sĩ từ tuần nguồn sang tuần
            đích.
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

      <Form form={form} layout="vertical" className="mt-5" onFinish={finish}>
        <Row gutter={16}>
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
              name="doctorId"
              label="Doctor ID"
              rules={[{ required: true, message: "Vui lòng nhập Doctor ID." }]}
            >
              <Input size="large" placeholder="Ví dụ: 1" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="sourceWeekStart"
              label="Ngày đầu tuần nguồn"
              rules={[{ required: true, message: "Vui lòng chọn tuần nguồn." }]}
              extra="Chọn ngày thứ Hai của tuần nguồn."
            >
              <DatePicker size="large" format="DD/MM/YYYY" className="w-full" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="targetWeekStart"
              label="Ngày đầu tuần đích"
              rules={[{ required: true, message: "Vui lòng chọn tuần đích." }]}
              extra="Chọn ngày thứ Hai của tuần đích."
            >
              <DatePicker size="large" format="DD/MM/YYYY" className="w-full" />
            </Form.Item>
          </Col>
        </Row>

        <div className="mt-2 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={close} disabled={submitting}>
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            <Copy className="mr-1 h-4 w-4" />
            Sao chép lịch
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
