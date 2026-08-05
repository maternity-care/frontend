"use client";

import { useCallback, useEffect, useState } from "react";

import dayjs from "dayjs";

import {
  Alert,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
} from "antd";

import { getUsers } from "@/management/features/users/users.api";
import type { User } from "@/management/features/users/users.types";
import type { CreateManagementPregnancyProfileInput } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";

const { TextArea } = Input;

interface CreatePregnancyProfileFormValues {
  patientId: string;

  lastMenstrualPeriod: dayjs.Dayjs | null;
  expectedDueDate: dayjs.Dayjs | null;

  fetalCount: number;

  gravida: number;
  paraFullTerm: number;
  paraPremature: number;
  paraAbortion: number;
  paraLivingChildren: number;

  riskLevel: "low" | "medium" | "high";
  status: "ACTIVE" | "COMPLETED" | "TERMINATED";

  notes?: string;
}

interface Props {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateManagementPregnancyProfileInput) => Promise<void> | void;
}

function formatUserLabel(user: User): string {
  const contacts = [user.phone, user.email].filter(Boolean).join(" - ");
  return contacts ? `${user.name} (${contacts})` : user.name;
}

export function CreatePregnancyProfileModal({
  open,
  loading = false,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<CreatePregnancyProfileFormValues>();
  const [patients, setPatients] = useState<User[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);

  const loadPatients = useCallback(async () => {
    if (!open) return;

    setLoadingPatients(true);
    try {
      const result = await getUsers({
        search: patientSearch.trim() || undefined,
        status: "active",
        page: 1,
        limit: 20,
      });
      setPatients(result);
    } catch {
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [open, patientSearch]);

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      void loadPatients();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadPatients, open]);

  useEffect(() => {
    if (!open) return;

    form.setFieldsValue({
      fetalCount: 1,
      gravida: 1,
      paraFullTerm: 0,
      paraPremature: 0,
      paraAbortion: 0,
      paraLivingChildren: 0,
      riskLevel: "low",
      status: "ACTIVE",
    });
  }, [form, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();

    await onSubmit({
      patientId: values.patientId,
      lastMenstrualPeriod: values.lastMenstrualPeriod?.format("YYYY-MM-DD") ?? null,
      expectedDueDate: values.expectedDueDate?.format("YYYY-MM-DD") ?? null,
      fetalCount: values.fetalCount,
      gravida: values.gravida,
      paraFullTerm: values.paraFullTerm,
      paraPremature: values.paraPremature,
      paraAbortion: values.paraAbortion,
      paraLivingChildren: values.paraLivingChildren,
      riskLevel: values.riskLevel,
      status: values.status,
      notes: values.notes?.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      title="Thêm hồ sơ thai kỳ"
      width={860}
      okText="Tạo hồ sơ"
      cancelText="Hủy"
      confirmLoading={loading}
      mask={{ closable: !loading }}
      keyboard={!loading}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
      afterClose={() => {
        form.resetFields();
        setPatientSearch("");
      }}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="Chọn thai phụ đã có tài khoản người dùng, sau đó nhập thông tin thai kỳ ban đầu."
      />

      <Form form={form} layout="vertical" disabled={loading}>
        <Form.Item
          name="patientId"
          label="Thai phụ"
          rules={[{ required: true, message: "Vui lòng chọn thai phụ." }]}
        >
          <Select
            showSearch
            filterOption={false}
            loading={loadingPatients}
            placeholder="Tìm theo tên, SĐT, email hoặc CCCD"
            onSearch={setPatientSearch}
            options={patients.map((patient) => ({
              value: patient.id,
              label: formatUserLabel(patient),
            }))}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="lastMenstrualPeriod"
              label="Ngày đầu kỳ kinh cuối"
              rules={[{ required: true, message: "Vui lòng chọn ngày đầu kỳ kinh cuối." }]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Chọn ngày"
                disabledDate={(date) => date.isAfter(dayjs(), "day")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="expectedDueDate"
              label="Ngày dự sinh"
              dependencies={["lastMenstrualPeriod"]}
              rules={[
                { required: true, message: "Vui lòng chọn ngày dự sinh." },
                ({ getFieldValue }) => ({
                  validator(_, value: dayjs.Dayjs | null) {
                    const lmp = getFieldValue("lastMenstrualPeriod") as dayjs.Dayjs | null;
                    if (!value || !lmp || value.isAfter(lmp, "day")) {
                      return Promise.resolve();
                    }

                    return Promise.reject(new Error("Ngày dự sinh phải sau ngày đầu kỳ kinh cuối."));
                  },
                }),
              ]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="fetalCount"
              label="Số thai"
              rules={[{ required: true, message: "Vui lòng nhập số thai." }]}
            >
              <InputNumber min={1} max={10} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="riskLevel"
              label="Mức nguy cơ"
              rules={[{ required: true, message: "Vui lòng chọn mức nguy cơ." }]}
            >
              <Select
                options={[
                  { value: "low", label: "Nguy cơ thấp" },
                  { value: "medium", label: "Nguy cơ trung bình" },
                  { value: "high", label: "Nguy cơ cao" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
            >
              <Select
                options={[
                  { value: "ACTIVE", label: "Đang theo dõi" },
                  { value: "COMPLETED", label: "Đã hoàn thành" },
                  { value: "TERMINATED", label: "Đã kết thúc" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="gravida"
              label="Số lần mang thai"
              rules={[{ required: true, message: "Vui lòng nhập số lần mang thai." }]}
            >
              <InputNumber min={0} max={30} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="paraFullTerm"
              label="Số lần sinh đủ tháng"
              rules={[{ required: true, message: "Vui lòng nhập số lần sinh đủ tháng." }]}
            >
              <InputNumber min={0} max={30} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="paraPremature"
              label="Số lần sinh non"
              rules={[{ required: true, message: "Vui lòng nhập số lần sinh non." }]}
            >
              <InputNumber min={0} max={30} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="paraAbortion"
              label="Số lần sảy/phá thai"
              rules={[{ required: true, message: "Vui lòng nhập số lần sảy/phá thai." }]}
            >
              <InputNumber min={0} max={30} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="paraLivingChildren"
              label="Số con đang sống"
              rules={[{ required: true, message: "Vui lòng nhập số con đang sống." }]}
            >
              <InputNumber min={0} max={30} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="Ghi chú chuyên môn"
          rules={[{ max: 2000, message: "Ghi chú không được vượt quá 2.000 ký tự." }]}
        >
          <TextArea
            rows={4}
            showCount
            maxLength={2000}
            placeholder="Nhập ghi chú về tình trạng thai kỳ..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
