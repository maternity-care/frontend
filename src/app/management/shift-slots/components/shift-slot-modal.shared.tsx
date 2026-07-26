"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  App,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Switch,
  Typography,
} from "antd";
import {
  Building2,
  Clock3,
} from "lucide-react";
import type {
  CreateShiftSlotInput,
  ShiftSlot,
  ShiftSlotStatus,
} from "@/management/features/shift-slots/shift-slots.types";

const { Text, Title } = Typography;

export type FacilityOption = {
  id: string;
  name: string;
  code: string;
  address: string;
};

export type ShiftSlotFormValues = {
  facilityId: string;
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  status: ShiftSlotStatus;
};

type ShiftSlotFormModalBaseProps = {
  mode: "create" | "edit";
  open: boolean;
  editingSlot?: ShiftSlot | null;
  facilities: FacilityOption[];
  onClose: () => void;
  onSubmitValidated: (
    input: CreateShiftSlotInput,
  ) => Promise<string>;
};

export function getShiftSlotErrorMessage(
  error: unknown,
) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            errors?: {
              fields?: string[];
            };
          };
        };
      }
    ).response;

    const fields = response?.data?.errors?.fields;

    if (Array.isArray(fields) && fields.length > 0) {
      return fields.join(", ");
    }

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function hasSlotChanges(
  values: ShiftSlotFormValues,
  editingSlot: ShiftSlot,
) {
  return (
    values.facilityId !== editingSlot.facilityId ||
    values.name.trim() !== editingSlot.name ||
    values.startTime !== editingSlot.startTime ||
    values.endTime !== editingSlot.endTime ||
    values.isOvernight !==
      editingSlot.isOvernight ||
    values.status !== editingSlot.status
  );
}

export function ShiftSlotFormModalBase({
  mode,
  open,
  editingSlot = null,
  facilities,
  onClose,
  onSubmitValidated,
}: ShiftSlotFormModalBaseProps) {
  const {
    message: messageApi,
    modal: modalApi,
  } = App.useApp();
  const [form] =
    Form.useForm<ShiftSlotFormValues>();
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setError(null);

      if (mode === "edit" && editingSlot) {
        form.setFieldsValue({
          facilityId: editingSlot.facilityId,
          name: editingSlot.name,
          startTime: editingSlot.startTime,
          endTime: editingSlot.endTime,
          isOvernight:
            editingSlot.isOvernight,
          status: editingSlot.status,
        });
        return;
      }

      form.resetFields();
      form.setFieldsValue({
        isOvernight: false,
        status: "active",
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [editingSlot, form, mode, open]);

  async function handleFinish(
    values: ShiftSlotFormValues,
  ) {
    setError(null);

    if (
      !values.isOvernight &&
      timeToMinutes(values.endTime) <=
        timeToMinutes(values.startTime)
    ) {
      form.setFields([
        {
          name: "endTime",
          errors: [
            "Giờ kết thúc phải sau giờ bắt đầu khi không phải ca qua đêm.",
          ],
        },
      ]);
      return;
    }

    if (
      mode === "edit" &&
      editingSlot &&
      !hasSlotChanges(values, editingSlot)
    ) {
      modalApi.info({
        centered: true,
        title: "Không có gì thay đổi",
        content:
          "Thông tin khung ca hiện tại giống hoàn toàn với dữ liệu ban đầu.",
        okText: "Đóng",
      });
      return;
    }

    if (mode === "edit") {
      const confirmed =
        await new Promise<boolean>(
          (resolve) => {
            let resolved = false;

            const finish = (
              result: boolean,
            ) => {
              if (resolved) return;

              resolved = true;
              resolve(result);
            };

            modalApi.confirm({
              centered: true,
              closable: false,
              mask: {
                closable: false,
              },
              title:
                "Xác nhận cập nhật khung ca",
              content:
                "Bạn có chắc chắn muốn lưu các thay đổi của khung ca này không?",
              okText: "Xác nhận cập nhật",
              cancelText: "Kiểm tra lại",
              onOk: () => finish(true),
              onCancel: () => finish(false),
            });
          },
        );

      if (!confirmed) return;
    }

    setSubmitting(true);

    try {
      const successMessage =
        await onSubmitValidated({
          facilityId:
            values.facilityId.trim(),
          name: values.name.trim(),
          startTime: values.startTime,
          endTime: values.endTime,
          isOvernight:
            values.isOvernight,
          status: values.status,
        });

      messageApi.success(successMessage);
      form.resetFields();
      onClose();
    } catch (submitError) {
      const message =
        getShiftSlotErrorMessage(
          submitError,
        );

      setError(message);
      messageApi.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (submitting) return;

    form.resetFields();
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      centered
      width={760}
      title={null}
      okText={
        mode === "edit"
          ? "Lưu thay đổi"
          : "Tạo khung ca"
      }
      cancelText="Hủy"
      confirmLoading={submitting}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      mask={{
        closable: !submitting,
      }}
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "72vh",
          overflowY: "auto",
          marginRight: 28,
          paddingRight: 12,
        },
      }}
    >
      <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Clock3 className="h-5 w-5" />
          </span>

          <div>
            <Title
              level={4}
              className="!mb-1 !text-slate-950"
            >
              {mode === "edit"
                ? "Cập nhật khung ca"
                : "Thêm khung ca mới"}
            </Title>

            <Text type="secondary">
              Khung ca được quản lý riêng theo từng cơ sở.
            </Text>
          </div>
        </div>
      </div>

      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          closable
          className="mb-4"
          onClose={() => setError(null)}
        />
      ) : null}

      <Form<ShiftSlotFormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={(values) =>
          void handleFinish(values)
        }
      >
        <Row gutter={[16, 0]}>
          <Col xs={24}>
            <Form.Item
              name="facilityId"
              label="Cơ sở"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn cơ sở.",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn cơ sở"
                suffixIcon={
                  <Building2 className="h-4 w-4" />
                }
                options={facilities.map(
                  (facility) => ({
                    value: facility.id,
                    label: `${facility.name} (${facility.code})`,
                  }),
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="name"
              label="Tên khung ca"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message:
                    "Vui lòng nhập tên khung ca.",
                },
                {
                  max: 120,
                  message:
                    "Tên khung ca tối đa 120 ký tự.",
                },
              ]}
            >
              <Input placeholder="Ví dụ: Ca sáng" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="startTime"
              label="Giờ bắt đầu"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn giờ bắt đầu.",
                },
              ]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="endTime"
              label="Giờ kết thúc"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn giờ kết thúc.",
                },
              ]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="isOvernight"
              label="Ca qua đêm"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Có"
                unCheckedChildren="Không"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn trạng thái.",
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
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}