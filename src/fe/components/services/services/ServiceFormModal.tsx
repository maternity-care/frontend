"use client";

import {
  useEffect,
} from "react";

import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
} from "antd";

import type {
  Service,
  ServiceStatus,
  ServiceType,
} from "@/management/features/services/services.types";

import {
  serviceStatusOptions,
  serviceTypeOptions,
} from "../services.ui";

const { TextArea } = Input;

export interface ServiceFormValues {
  code: string;
  name: string;
  description?: string;
  serviceType: ServiceType;
  defaultDurationMinutes: number;
  basePrice: number;
  requiresDoctorWarning: boolean;
  status: ServiceStatus;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initialData?: Service;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: ServiceFormValues,
  ) => Promise<void> | void;
}

export function ServiceFormModal({
  open,
  mode,
  initialData,
  submitting = false,
  onCancel,
  onSubmit,
}: Props) {
  const [form] =
    Form.useForm<ServiceFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (
      mode === "edit" &&
      initialData
    ) {
      form.setFieldsValue({
        code: initialData.code,
        name: initialData.name,
        description:
          initialData.description ??
          undefined,
        serviceType:
          initialData.serviceType,
        defaultDurationMinutes:
          initialData.defaultDurationMinutes,
        basePrice: Number(
          initialData.basePrice,
        ),
        requiresDoctorWarning:
          initialData.requiresDoctorWarning,
        status: initialData.status,
      });

      return;
    }

    form.resetFields();

    form.setFieldsValue({
      serviceType: "other",
      defaultDurationMinutes: 30,
      basePrice: 0,
      requiresDoctorWarning: false,
      status: "active",
    });
  }, [
    form,
    initialData,
    mode,
    open,
  ]);

  return (
    <Modal
      open={open}
      centered
      width={720}
      destroyOnHidden
      title={
        mode === "create"
          ? "Tạo dịch vụ"
          : "Cập nhật dịch vụ"
      }
      okText={
        mode === "create"
          ? "Tạo dịch vụ"
          : "Lưu thay đổi"
      }
      cancelText="Hủy"
      confirmLoading={submitting}
      onOk={() => form.submit()}
      onCancel={onCancel}
    >
      <Form<ServiceFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="code"
            label="Mã dịch vụ"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập mã dịch vụ",
              },
              {
                whitespace: true,
                message:
                  "Mã không được để trống",
              },
            ]}
          >
            <Input placeholder="Ví dụ: US_2D" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập tên dịch vụ",
              },
              {
                whitespace: true,
                message:
                  "Tên không được để trống",
              },
            ]}
          >
            <Input placeholder="Ví dụ: Siêu âm thai 2D" />
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label="Mô tả"
        >
          <TextArea
            rows={4}
            maxLength={100}
            showCount
          />
        </Form.Item>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="serviceType"
            label="Loại dịch vụ"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              options={
                serviceTypeOptions
              }
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              options={
                serviceStatusOptions
              }
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="basePrice"
            label="Giá cơ bản"
            rules={[
              {
                required: true,
              },
              {
                type: "number",
                min: 0,
                message:
                  "Giá không được nhỏ hơn 0",
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              precision={0}
              step={10000}
              addonAfter="VNĐ"
            />
          </Form.Item>

          <Form.Item
            name="defaultDurationMinutes"
            label="Thời lượng mặc định"
            rules={[
              {
                required: true,
              },
              {
                type: "number",
                min: 1,
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={1}
              precision={0}
              addonAfter="phút"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="requiresDoctorWarning"
          label="Yêu cầu bác sĩ"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="Có"
            unCheckedChildren="Không"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}