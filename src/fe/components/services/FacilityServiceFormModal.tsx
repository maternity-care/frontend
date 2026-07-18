"use client";

import { useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from "antd";
import { FacilityService, FacilityServiceFormValues } from "@/management/features/services/services.types";

interface FacilityServiceFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: FacilityService;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: FacilityServiceFormValues,
  ) => Promise<void> | void;
}

const statusOptions = [
  {
    value: "available",
    label: "Đang cung cấp",
  },
  {
    value: "unavailable",
    label: "Ngừng cung cấp",
  },
];

export function FacilityServiceFormModal({
  open,
  mode,
  initialData,
  submitting = false,
  onCancel,
  onSubmit,
}: FacilityServiceFormModalProps) {
  const [form] = Form.useForm<FacilityServiceFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && initialData) {
      form.setFieldsValue({
        facilityId: initialData.facilityId,
        serviceId: initialData.serviceId,
        price: initialData.price,
        durationMinutes: initialData.durationMinutes,
        status: initialData.status,
      });

      return;
    }

    form.resetFields();
    form.setFieldsValue({
      durationMinutes: 30,
      status: "available",
    });
  }, [form, initialData, mode, open]);

  function handleCancel() {
    form.resetFields();
    onCancel();
  }

  return (
    <Modal
      open={open}
      centered
      width={650}
      title={
        mode === "create"
          ? "Gán dịch vụ cho cơ sở"
          : "Cập nhật dịch vụ cơ sở"
      }
      okText={mode === "create" ? "Thêm dịch vụ" : "Lưu thay đổi"}
      cancelText="Hủy"
      confirmLoading={submitting}
      onOk={() => form.submit()}
      onCancel={handleCancel}
    >
      <Form<FacilityServiceFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item
            name="facilityId"
            label="ID cơ sở"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập ID cơ sở",
              },
              {
                whitespace: true,
                message: "ID cơ sở không được để trống",
              },
            ]}
          >
            <Input placeholder="Ví dụ: 1" />
          </Form.Item>

          <Form.Item
            name="serviceId"
            label="ID dịch vụ gốc"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập ID dịch vụ",
              },
              {
                whitespace: true,
                message: "ID dịch vụ không được để trống",
              },
            ]}
          >
            <Input placeholder="Ví dụ: 3" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item
            name="price"
            label="Giá dịch vụ"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập giá dịch vụ",
              },
              {
                validator: async (_, value) => {
                  if (value === undefined || value === null) {
                    return;
                  }

                  if (Number(value) < 0) {
                    throw new Error("Giá dịch vụ không được nhỏ hơn 0");
                  }
                },
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              precision={2}
              placeholder="Ví dụ: 280000"
              addonAfter="VNĐ"
            />
          </Form.Item>

          <Form.Item
            name="durationMinutes"
            label="Thời lượng"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập thời lượng",
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={1}
              precision={0}
              placeholder="Ví dụ: 30"
              addonAfter="phút"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn trạng thái",
            },
          ]}
        >
          <Select options={statusOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
}