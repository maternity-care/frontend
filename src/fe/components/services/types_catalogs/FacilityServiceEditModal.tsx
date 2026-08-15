"use client";

import { Form, InputNumber, message, Modal, Select, Typography } from "antd";
import { useEffect, useState } from "react";

import {
  createManagementFacilityService,
  updateManagementFacilityService,
} from "@/management/features/services/facility-services/facility-services.api";
import type { ManagementFacilityService } from "@/management/features/services/facility-services/facility-services.types";
import type { ManagementService } from "@/management/features/services/services/services.types";

const { Text } = Typography;

type FormValues = {
  price: number;
  durationMinutes: number;
  status: "active" | "inactive";
};

type FacilityServiceEditModalProps = {
  open: boolean;
  facilityId: string;
  service: ManagementService | null;
  facilityService?: ManagementFacilityService | null;
  onCancel: () => void;
  onSuccess: () => void | Promise<void>;
};

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function isFormValidationError(error: unknown) {
  return typeof error === "object" && error !== null && "errorFields" in error;
}

export function FacilityServiceEditModal({
  open,
  facilityId,
  service,
  facilityService,
  onCancel,
  onSuccess,
}: FacilityServiceEditModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(facilityService);

  useEffect(() => {
    if (!open || !service) return;

    form.setFieldsValue({
      price: Number(facilityService?.price ?? service.basePrice) || 0,
      durationMinutes:
        facilityService?.durationMinutes ??
        service.defaultDurationMinutes ??
        30,
      status: facilityService?.status ?? "active",
    });
  }, [open, service, facilityService, form]);

  const handleSubmit = async () => {
    if (!service) return;

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        facilityId,
        serviceId: service.id,
        price: Number(values.price).toFixed(2),
        durationMinutes: values.durationMinutes,
        status: values.status,
      };

      if (isEdit && facilityService) {
        await updateManagementFacilityService(facilityService.id, {
          price: payload.price,
          durationMinutes: payload.durationMinutes,
          status: payload.status,
        });
        messageApi.success("Cập nhật cấu hình cơ sở thành công.");
      } else {
        await createManagementFacilityService(payload);
        messageApi.success("Cấu hình dịch vụ tại cơ sở thành công.");
      }

      await onSuccess();
      onCancel();
    } catch (error) {
      if (isFormValidationError(error)) return;
      messageApi.error(
        isEdit
          ? "Không thể cập nhật cấu hình cơ sở."
          : "Không thể tạo cấu hình cơ sở.",
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
        title={
          isEdit ? "Chỉnh sửa cấu hình tại cơ sở" : "Cấu hình dịch vụ tại cơ sở"
        }
        okText={isEdit ? "Cập nhật" : "Lưu cấu hình"}
        cancelText="Hủy"
        confirmLoading={submitting}
        width={520}
        destroyOnHidden
        onCancel={onCancel}
        onOk={() => void handleSubmit()}
      >
        {service ? (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Dịch vụ:</Text>
            <div style={{ marginTop: 4 }}>
              <Text strong>
                {service.code} - {service.name}
              </Text>
            </div>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">
                Giá cơ bản: {formatCurrency(service.basePrice)}
                {service.defaultDurationMinutes
                  ? ` · Thời lượng mặc định: ${service.defaultDurationMinutes} phút`
                  : ""}
              </Text>
            </div>
          </div>
        ) : null}

        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="price"
            label="Giá tại cơ sở (VNĐ)"
            rules={[
              { required: true, message: "Vui lòng nhập giá tại cơ sở." },
              { type: "number", min: 0, message: "Giá không được âm." },
            ]}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => Number((value ?? "").replace(/\./g, "")) as 0}
            />
          </Form.Item>

          <Form.Item
            name="durationMinutes"
            label="Thời lượng tại cơ sở (phút)"
            rules={[
              { required: true, message: "Vui lòng nhập thời lượng." },
              { type: "number", min: 1, message: "Thời lượng phải lớn hơn 0." },
            ]}
          >
            <InputNumber min={1} max={999} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái tại cơ sở"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
          >
            <Select
              options={[
                { value: "active", label: "Hoạt động" },
                { value: "inactive", label: "Ngừng hoạt động" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
