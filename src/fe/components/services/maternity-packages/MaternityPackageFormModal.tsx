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
} from "antd";

import type {
  MaternityPackage,
  MaternityPackageStatus,
} from "@/management/features/services/services.types";

import {
  maternityPackageStatusOptions,
} from "../services.ui";

const { TextArea } = Input;

export interface MaternityPackageFormValues {
  code: string;
  name: string;
  description?: string;
  price: number;
  durationDays?: number;
  priorityLevel: number;
  status: MaternityPackageStatus;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initialData?: MaternityPackage;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: MaternityPackageFormValues,
  ) => Promise<void> | void;
}

export function MaternityPackageFormModal({
  open,
  mode,
  initialData,
  submitting = false,
  onCancel,
  onSubmit,
}: Props) {
  const [form] =
    Form.useForm<MaternityPackageFormValues>();

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
        price: Number(
          initialData.price,
        ),
        durationDays:
          initialData.durationDays ??
          undefined,
        priorityLevel:
          initialData.priorityLevel,
        status: initialData.status,
      });

      return;
    }

    form.resetFields();

    form.setFieldsValue({
      priorityLevel: 0,
      status: "draft",
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
          ? "Tạo gói dịch vụ"
          : "Cập nhật gói dịch vụ"
      }
      okText={
        mode === "create"
          ? "Tạo gói"
          : "Lưu thay đổi"
      }
      cancelText="Hủy"
      confirmLoading={submitting}
      onOk={() => form.submit()}
      onCancel={onCancel}
    >
      <Form<MaternityPackageFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="code"
            label="Mã gói"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input placeholder="PKG_BASIC" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên gói"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input placeholder="Gói thai sản cơ bản" />
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
            name="price"
            label="Giá gói"
            rules={[
              {
                required: true,
              },
              {
                type: "number",
                min: 0,
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              precision={0}
              addonAfter="VNĐ"
            />
          </Form.Item>

          <Form.Item
            name="durationDays"
            label="Thời hạn"
          >
            <InputNumber
              className="w-full"
              min={1}
              precision={0}
              addonAfter="ngày"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="priorityLevel"
            label="Mức ưu tiên"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              precision={0}
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
                maternityPackageStatusOptions
              }
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}