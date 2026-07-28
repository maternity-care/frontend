"use client";

import { createManagementServiceType, updateManagementServiceType } from "@/management/features/services/service-types/service-types.api";
import { CreateManagementServiceTypeInput, ManagementServiceType, ServiceTypeStatus } from "@/management/features/services/service-types/service-types.types";
import { Form, Input, message, Modal, Select } from "antd";

import { useEffect, useState } from "react";

const { TextArea } = Input;

interface ServiceTypeFormValues {
  name: string;
  description?: string;
  status: ServiceTypeStatus;
}

interface ServiceTypeFormModalProps {
  open: boolean;
  serviceType: ManagementServiceType | null;
  onCancel: () => void;
  onSuccess: () => void | Promise<void>;
}

function isFormValidationError(error: unknown) {
  return typeof error === "object" && error !== null && "errorFields" in error;
}

export function ServiceTypeFormModal({
  open,
  serviceType,
  onCancel,
  onSuccess,
}: ServiceTypeFormModalProps) {
  const [form] = Form.useForm<ServiceTypeFormValues>();

  const [messageApi, contextHolder] = message.useMessage();

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (serviceType) {
      form.setFieldsValue({
        name: serviceType.name,
        description: serviceType.description ?? undefined,
        status: serviceType.status,
      });

      return;
    }

    form.resetFields();
    form.setFieldsValue({
      status: "active",
    });
  }, [form, open, serviceType]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const input: CreateManagementServiceTypeInput = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        status: values.status,
      };

      setSubmitting(true);

      if (serviceType) {
        await updateManagementServiceType(serviceType.id, input);

        messageApi.success("Cập nhật loại dịch vụ thành công.");
      } else {
        await createManagementServiceType(input);

        messageApi.success("Tạo loại dịch vụ thành công.");
      }

      await onSuccess();
    } catch (error) {
      if (isFormValidationError(error)) {
        return;
      }

      messageApi.error(
        serviceType
          ? "Không thể cập nhật loại dịch vụ."
          : "Không thể tạo loại dịch vụ.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title={serviceType ? "Cập nhật loại dịch vụ" : "Thêm loại dịch vụ"}
        okText={serviceType ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        confirmLoading={submitting}
        destroyOnHidden
        onCancel={onCancel}
        onOk={() => void handleSubmit()}
      >
        <Form<ServiceTypeFormValues>
          form={form}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label="Tên loại dịch vụ"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên loại dịch vụ.",
              },
              {
                max: 255,
                message: "Tên loại dịch vụ không được vượt quá 255 ký tự.",
              },
            ]}
          >
            <Input placeholder="Ví dụ: Siêu âm" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea
              rows={4}
              showCount
              maxLength={1000}
              placeholder="Ví dụ: Nhóm các dịch vụ siêu âm thai"
            />
          </Form.Item>

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
                  label: "Hoạt động",
                },
                {
                  value: "inactive",
                  label: "Ngừng hoạt động",
                },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
