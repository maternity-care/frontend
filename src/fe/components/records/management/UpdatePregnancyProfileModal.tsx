"use client";

import { useEffect } from "react";

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

import type {
  ManagementPregnancyProfile,
  PregnancyProfileStatus,
  UpdateManagementPregnancyProfileInput,
} from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";

const { TextArea } = Input;

interface UpdatePregnancyProfileFormValues {
  lastMenstrualPeriod: dayjs.Dayjs | null;
  expectedDueDate: dayjs.Dayjs | null;

  fetalCount: number;

  gravida: number;
  paraFullTerm: number;
  paraPremature: number;
  paraAbortion: number;
  paraLivingChildren: number;

  riskLevel: ManagementPregnancyProfile["riskLevel"];

  status: Exclude<PregnancyProfileStatus, "deleted">;

  notes?: string;
}

interface Props {
  open: boolean;
  profile: ManagementPregnancyProfile | null;
  loading?: boolean;

  onCancel: () => void;

  onSubmit: (
    id: string,
    input: UpdateManagementPregnancyProfileInput,
  ) => Promise<void> | void;
}

function toDayjs(value?: string | null): dayjs.Dayjs | null {
  if (!value) {
    return null;
  }

  const result = dayjs(value);

  return result.isValid() ? result : null;
}

export function UpdatePregnancyProfileModal({
  open,
  profile,
  loading = false,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<UpdatePregnancyProfileFormValues>();

  useEffect(() => {
    if (!open || !profile) {
      return;
    }

    form.setFieldsValue({
      lastMenstrualPeriod: toDayjs(profile.lastMenstrualPeriod),

      expectedDueDate: toDayjs(profile.expectedDueDate),

      fetalCount: profile.fetalCount ?? 1,

      gravida: profile.gravida,
      paraFullTerm: profile.paraFullTerm,
      paraPremature: profile.paraPremature,
      paraAbortion: profile.paraAbortion,
      paraLivingChildren: profile.paraLivingChildren,

      riskLevel: profile.riskLevel,

      status: profile.status === "deleted" ? "active" : profile.status,

      notes: profile.notes ?? "",
    });
  }, [form, open, profile]);

  const handleSubmit = async () => {
    if (!profile) {
      return;
    }

    const values = await form.validateFields();

    const input: UpdateManagementPregnancyProfileInput = {
      lastMenstrualPeriod:
        values.lastMenstrualPeriod?.format("YYYY-MM-DD") ?? null,

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
    };

    await onSubmit(profile.id, input);
  };

  return (
    <Modal
      open={open}
      title="Cập nhật hồ sơ thai kỳ"
      width={820}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={loading}
      mask={{
        closable: !loading,
      }}
      keyboard={!loading}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
      afterClose={() => form.resetFields()}
    >
      {profile && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
          title={profile.user?.name || "Chưa cập nhật tên thai phụ"}
          description={`Mã hồ sơ: ${
            profile.code || profile.id
          } • Mã bệnh nhân: ${profile.patientId || "Chưa có"}`}
        />
      )}

      <Form form={form} layout="vertical" disabled={loading}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="lastMenstrualPeriod"
              label="Ngày đầu kỳ kinh cuối"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ngày đầu kỳ kinh cuối.",
                },
              ]}
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
                {
                  required: true,
                  message: "Vui lòng chọn ngày dự sinh.",
                },
                ({ getFieldValue }) => ({
                  validator(_, value: dayjs.Dayjs | null) {
                    const lastMenstrualPeriod = getFieldValue(
                      "lastMenstrualPeriod",
                    ) as dayjs.Dayjs | null;

                    if (
                      !value ||
                      !lastMenstrualPeriod ||
                      value.isAfter(lastMenstrualPeriod, "day")
                    ) {
                      return Promise.resolve();
                    }

                    return Promise.reject(
                      new Error("Ngày dự sinh phải sau ngày đầu kỳ kinh cuối."),
                    );
                  },
                }),
              ]}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="fetalCount"
              label="Số thai"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số thai.",
                },
              ]}
            >
              <InputNumber
                min={1}
                max={10}
                precision={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="riskLevel"
              label="Mức nguy cơ"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn mức nguy cơ.",
                },
              ]}
            >
              <Select
                options={[
                  {
                    value: "low",
                    label: "Nguy cơ thấp",
                  },
                  {
                    value: "medium",
                    label: "Nguy cơ trung bình",
                  },
                  {
                    value: "high",
                    label: "Nguy cơ cao",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn trạng thái.",
                },
              ]}
            >
              <Select
                options={[
                  {
                    value: "active",
                    label: "Đang theo dõi",
                  },
                  {
                    value: "completed",
                    label: "Đã hoàn thành",
                  },
                  {
                    value: "terminated",
                    label: "Đã kết thúc",
                  },
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
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số lần mang thai.",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={30}
                precision={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="paraFullTerm"
              label="Số lần sinh đủ tháng"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số lần sinh đủ tháng.",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={30}
                precision={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="paraPremature"
              label="Số lần sinh non"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số lần sinh non.",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={30}
                precision={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="paraAbortion"
              label="Số lần sảy/phá thai"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số lần sảy/phá thai.",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={30}
                precision={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Form.Item
              name="paraLivingChildren"
              label="Số con đang sống"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số con đang sống.",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={30}
                precision={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="Ghi chú chuyên môn"
          rules={[
            {
              max: 2000,
              message: "Ghi chú không được vượt quá 2.000 ký tự.",
            },
          ]}
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
