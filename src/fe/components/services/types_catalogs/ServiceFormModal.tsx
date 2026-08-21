"use client";

import { ManagementServiceTypeLookupItem } from "@/management/features/services/service-types/service-types.types";
import {
  createManagementService,
  updateManagementService,
} from "@/management/features/services/services/services.api";
import {
  CreateManagementServiceInput,
  ManagementService,
  ServiceSaleMode,
  ServiceStatus,
} from "@/management/features/services/services/services.types";
import { useDoctorSpecialties } from "@/hooks/doctors/useDoctorLookups";
import {
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
} from "antd";

import { useEffect, useState } from "react";
const { TextArea } = Input;

interface ServiceFormValues {
  name: string;
  description?: string;
  serviceTypeId: string;
  saleMode: ServiceSaleMode;
  defaultDurationMinutes: number;
  basePrice: number;
  requiresDoctorWarning: boolean;
  allowDoctorSelection: boolean;
  doctorSpecialty?: string | null;
  status: ServiceStatus;
}

interface ServiceFormModalProps {
  open: boolean;
  service: ManagementService | null;
  serviceTypes: ManagementServiceTypeLookupItem[];
  onCancel: () => void;
  onSuccess: () => void | Promise<void>;
}

function isFormValidationError(error: unknown) {
  return typeof error === "object" && error !== null && "errorFields" in error;
}

export function ServiceFormModal({
  open,
  service,
  serviceTypes,
  onCancel,
  onSuccess,
}: ServiceFormModalProps) {
  const [form] = Form.useForm<ServiceFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const allowDoctorSelection = Form.useWatch("allowDoctorSelection", form);
  const { specialtyOptions, specialtiesLoading } = useDoctorSpecialties();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (service) {
      form.setFieldsValue({
        name: service.name,
        description: service.description ?? undefined,
        serviceTypeId: service.serviceTypeId,
        saleMode: service.saleMode,
        defaultDurationMinutes: service.defaultDurationMinutes,
        basePrice: Number(service.basePrice),
        requiresDoctorWarning:
          service.allowDoctorSelection ?? service.requiresDoctorWarning,
        allowDoctorSelection:
          service.allowDoctorSelection ?? service.requiresDoctorWarning,
        doctorSpecialty: service.doctorSpecialty ?? undefined,
        status: service.status,
      });

      return;
    }

    form.resetFields();
    form.setFieldsValue({
      saleMode: "standalone",
      defaultDurationMinutes: 30,
      requiresDoctorWarning: false,
      allowDoctorSelection: false,
      doctorSpecialty: undefined,
      status: "active",
    });
  }, [form, open, service]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const input: CreateManagementServiceInput = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        serviceTypeId: values.serviceTypeId,
        saleMode: values.saleMode,
        defaultDurationMinutes: values.defaultDurationMinutes,
        basePrice: Number(values.basePrice).toFixed(2),
        requiresDoctorWarning: values.allowDoctorSelection,
        allowDoctorSelection: values.allowDoctorSelection,
        doctorSpecialty: values.allowDoctorSelection
          ? values.doctorSpecialty?.trim()
          : null,
        status: values.status,
      };

      setSubmitting(true);

      if (service) {
        await updateManagementService(service.id, input);
        messageApi.success("Cập nhật dịch vụ thành công.");
      } else {
        await createManagementService(input);
        messageApi.success("Tạo dịch vụ thành công.");
      }

      await onSuccess();
    } catch (error) {
      if (isFormValidationError(error)) {
        return;
      }

      messageApi.error(
        service ? "Không thể cập nhật dịch vụ." : "Không thể tạo dịch vụ.",
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
        title={service ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}
        okText={service ? "Cập nhật" : "Tạo dịch vụ"}
        cancelText="Hủy"
        confirmLoading={submitting}
        width={720}
        destroyOnHidden
        onCancel={onCancel}
        onOk={() => void handleSubmit()}
      >
        <Form<ServiceFormValues>
          form={form}
          layout="vertical"
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên dịch vụ.",
              },
              {
                max: 255,
                message: "Tên dịch vụ không được vượt quá 255 ký tự.",
              },
            ]}
          >
            <Input placeholder="Ví dụ: Siêu âm thai 3D" />
          </Form.Item>

          <Form.Item
            name="serviceTypeId"
            label="Loại dịch vụ"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn loại dịch vụ.",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn loại dịch vụ"
              options={serviceTypes.map((item) => ({
                value: item.id,
                label: `${item.code} - ${item.name}`,
              }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea
              rows={3}
              maxLength={1000}
              showCount
              placeholder="Nhập mô tả dịch vụ"
            />
          </Form.Item>

          <Form.Item
            name="saleMode"
            label="Hình thức bán"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn hình thức bán.",
              },
            ]}
          >
            <Select
              options={[
                {
                  value: "standalone",
                  label: "Bán lẻ",
                },
                {
                  value: "package_only",
                  label: "Chỉ sử dụng trong gói",
                },
                {
                  value: "both",
                  label: "Bán lẻ và sử dụng trong gói",
                },
              ]}
            />
          </Form.Item>

          <Form.Item label="Thời lượng mặc định" required>
            <Space.Compact block>
              <Form.Item
                name="defaultDurationMinutes"
                noStyle
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập thời lượng.",
                  },
                  {
                    type: "number",
                    min: 1,
                    message: "Thời lượng phải lớn hơn 0.",
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={1440}
                  precision={0}
                  placeholder="Nhập thời lượng"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  minWidth: 64,
                  padding: "0 12px",
                  color: "rgba(0, 0, 0, 0.88)",
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  border: "1px solid #d9d9d9",
                  borderLeft: 0,
                  borderRadius: "0 6px 6px 0",
                  userSelect: "none",
                }}
              >
                phút
              </div>
            </Space.Compact>
          </Form.Item>

          <Form.Item label="Giá cơ bản" required>
            <Space.Compact block>
              <Form.Item
                name="basePrice"
                noStyle
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập giá cơ bản.",
                  },
                  {
                    type: "number",
                    min: 0,
                    message: "Giá dịch vụ không được âm.",
                  },
                ]}
              >
                <InputNumber<number>
                  min={0}
                  precision={0}
                  placeholder="Nhập giá dịch vụ"
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                  }
                  parser={(value) => Number((value ?? "").replace(/\./g, ""))}
                />
              </Form.Item>

              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  minWidth: 70,
                  padding: "0 12px",
                  color: "rgba(0, 0, 0, 0.88)",
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  border: "1px solid #d9d9d9",
                  borderLeft: 0,
                  borderRadius: "0 6px 6px 0",
                  userSelect: "none",
                }}
              >
                VNĐ
              </div>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="allowDoctorSelection"
            label="Cho phép chọn bác sĩ"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Có"
              unCheckedChildren="Không"
              onChange={(checked) => {
                form.setFieldValue("requiresDoctorWarning", checked);
                if (!checked) {
                  form.setFieldValue("doctorSpecialty", undefined);
                }
              }}
            />
          </Form.Item>

          <Form.Item name="requiresDoctorWarning" hidden valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name="doctorSpecialty"
            label="Chuyên khoa bác sĩ"
            rules={[
              {
                required: Boolean(allowDoctorSelection),
                message: "Vui lòng chọn chuyên khoa bác sĩ.",
              },
            ]}
          >
            <Select
              showSearch
              allowClear={!allowDoctorSelection}
              disabled={!allowDoctorSelection}
              loading={specialtiesLoading}
              optionFilterProp="label"
              placeholder={
                allowDoctorSelection
                  ? "Chọn chuyên khoa của dịch vụ"
                  : "Bật chọn bác sĩ để cấu hình chuyên khoa"
              }
              options={specialtyOptions}
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
