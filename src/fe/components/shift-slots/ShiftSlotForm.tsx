"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  App,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Typography,
} from "antd";
import {
  Building2,
  Clock3,
} from "lucide-react";
import {
  SHIFT_SLOT_DAY_OPTIONS,
} from "@/management/features/shift-slots/shift-slots.constants";
import type {
  CreateShiftSlotInput,
  ShiftSlot,
  ShiftSlotApplicableDay,
  ShiftSlotFacilityOption,
  ShiftSlotStatus,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  getShiftSlotErrorMessage,
  hasShiftSlotChanges,
  isShiftSlotOvernight,
} from "@/management/features/shift-slots/shift-slots.utils";

const {
  Text,
  Title,
} = Typography;

export type ShiftSlotFormValues = {
  facilityId: string;
  name: string;
  startTime: string;
  endTime: string;
  applicableDays?: ShiftSlotApplicableDay[];
  status: ShiftSlotStatus;
};

type Props = {
  mode:
    | "create"
    | "edit";
  open: boolean;
  editingSlot?:
    | ShiftSlot
    | null;
  facilities: ShiftSlotFacilityOption[];
  onClose: () => void;
  onSubmitValidated: (
    input: CreateShiftSlotInput,
  ) => Promise<string>;
};

export function ShiftSlotForm({
  mode,
  open,
  editingSlot = null,
  facilities,
  onClose,
  onSubmitValidated,
}: Props) {
  const {
    message: messageApi,
    modal: modalApi,
  } = App.useApp();

  const [
    form,
  ] =
    Form.useForm<ShiftSlotFormValues>();

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const startTime =
    Form.useWatch(
      "startTime",
      form,
    ) ?? "";

  const endTime =
    Form.useWatch(
      "endTime",
      form,
    ) ?? "";

  const status =
    Form.useWatch(
      "status",
      form,
    ) ?? "active";

  const isOvernight =
    isShiftSlotOvernight(
      startTime,
      endTime,
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setError(
            null,
          );

          if (
            mode ===
              "edit" &&
            editingSlot
          ) {
            form.setFieldsValue({
              facilityId:
                editingSlot.facilityId,
              name:
                editingSlot.name,
              startTime:
                editingSlot.startTime,
              endTime:
                editingSlot.endTime,
              applicableDays:
                editingSlot.applicableDays,
              status:
                editingSlot.status,
            });

            return;
          }

          form.resetFields();

          form.setFieldsValue({
            facilityId:
              facilities.length ===
              1
                ? facilities[0]
                    ?.id
                : undefined,
            status:
              "active",
          });
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    editingSlot,
    facilities,
    form,
    mode,
    open,
  ]);

  async function handleFinish(
    values: ShiftSlotFormValues,
  ) {
    setError(null);

    const facilityAllowed =
      facilities.some(
        (
          facility,
        ) =>
          String(
            facility.id,
          ) ===
          String(
            values.facilityId,
          ),
      );

    if (
      !facilityAllowed
    ) {
      const message =
        "Bạn không có quyền quản lý khung ca của cơ sở này.";

      setError(
        message,
      );

      messageApi.error(
        message,
      );

      return;
    }

    if (
      mode === "edit" &&
      editingSlot &&
      !hasShiftSlotChanges(
        values,
        editingSlot,
      )
    ) {
      modalApi.info({
        centered: true,
        title:
          "Không có gì thay đổi",
        content:
          "Thông tin khung ca hiện tại giống hoàn toàn với dữ liệu ban đầu.",
        okText: "Đóng",
      });

      return;
    }

    if (
      mode === "edit"
    ) {
      const confirmed =
        await new Promise<boolean>(
          (
            resolve,
          ) => {
            let resolved =
              false;

            const finish = (
              result: boolean,
            ) => {
              if (
                resolved
              ) {
                return;
              }

              resolved =
                true;

              resolve(
                result,
              );
            };

            modalApi.confirm({
              centered:
                true,
              closable:
                false,
              mask: {
                closable:
                  false,
              },
              title:
                "Xác nhận cập nhật khung ca",
              content:
                "Bạn có chắc chắn muốn lưu các thay đổi của khung ca này không?",
              okText:
                "Xác nhận cập nhật",
              cancelText:
                "Kiểm tra lại",
              onOk: () =>
                finish(
                  true,
                ),
              onCancel: () =>
                finish(
                  false,
                ),
            });
          },
        );

      if (
        !confirmed
      ) {
        return;
      }
    }

    setSubmitting(
      true,
    );

    try {
      const successMessage =
        await onSubmitValidated(
          {
            facilityId:
              values.facilityId.trim(),
            name:
              values.name.trim(),
            startTime:
              values.startTime,
            endTime:
              values.endTime,
            isOvernight:
              isShiftSlotOvernight(
                values.startTime,
                values.endTime,
              ),
            applicableDays:
              mode === "edit"
                ? values.applicableDays ??
                  []
                : values.applicableDays &&
                    values
                      .applicableDays
                      .length > 0
                  ? values.applicableDays
                  : undefined,
            status:
              values.status ??
              "active",
          },
        );

      messageApi.success(
        successMessage,
      );

      form.resetFields();
      onClose();
    } catch (
      submitError
    ) {
      const message =
        getShiftSlotErrorMessage(
          submitError,
        );

      setError(
        message,
      );

      messageApi.error(
        message,
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  function handleCancel() {
    if (
      submitting
    ) {
      return;
    }

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
        mode ===
        "edit"
          ? "Lưu thay đổi"
          : "Tạo khung ca"
      }
      cancelText="Hủy"
      confirmLoading={
        submitting
      }
      onOk={() =>
        form.submit()
      }
      onCancel={
        handleCancel
      }
      mask={{
        closable:
          !submitting,
      }}
      destroyOnHidden
      styles={{
        body: {
          maxHeight:
            "72vh",
          overflowY:
            "auto",
          marginRight:
            28,
          paddingRight:
            12,
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
              {mode ===
              "edit"
                ? "Cập nhật khung ca"
                : "Thêm khung ca mới"}
            </Title>

            <Text type="secondary">
              Khung ca được
              quản lý riêng
              theo từng cơ sở.
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
          onClose={() =>
            setError(
              null,
            )
          }
        />
      ) : null}

      <Form<ShiftSlotFormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={(
          values,
        ) =>
          void handleFinish(
            values,
          )
        }
      >
        <Row
          gutter={[
            16,
            0,
          ]}
        >
          <Col xs={24}>
            <Form.Item
              name="facilityId"
              label="Cơ sở"
              rules={[
                {
                  required:
                    true,
                  message:
                    "Vui lòng chọn cơ sở.",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                disabled={
                  facilities.length ===
                  1
                }
                placeholder="Chọn cơ sở"
                suffixIcon={
                  <Building2 className="h-4 w-4" />
                }
                options={facilities.map(
                  (
                    facility,
                  ) => ({
                    value:
                      facility.id,
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
                  required:
                    true,
                  whitespace:
                    true,
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

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              name="startTime"
              label="Giờ bắt đầu"
              rules={[
                {
                  required:
                    true,
                  message:
                    "Vui lòng chọn giờ bắt đầu.",
                },
              ]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>

          <Col
            xs={24}
            md={12}
          >
            <Form.Item
              name="endTime"
              label="Giờ kết thúc"
              rules={[
                {
                  required:
                    true,
                  message:
                    "Vui lòng chọn giờ kết thúc.",
                },
              ]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="applicableDays"
              label="Ngày áp dụng"
            >
              <Checkbox.Group
                options={
                  SHIFT_SLOT_DAY_OPTIONS
                }
                className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
              />
            </Form.Item>
          </Col>

          {mode ===
          "edit" ? (
            <Col xs={24}>
              <Form.Item
                name="status"
                label="Trạng thái khung ca"
                rules={[
                  {
                    required:
                      true,
                    message:
                      "Vui lòng chọn trạng thái khung ca.",
                  },
                ]}
              >
                <Segmented
                  block
                  options={[
                    {
                      value:
                        "active",
                      label:
                        "Hoạt động",
                    },
                    {
                      value:
                        "inactive",
                      label:
                        "Tạm ngưng",
                    },
                  ]}
                />
              </Form.Item>

              {status ===
              "inactive" ? (
                <Alert
                  type="warning"
                  showIcon
                  className="mb-6"
                  title="Khung ca sẽ không còn dùng để tạo lịch trực mới"
                  description="Các ca trực đã được tạo từ khung ca này vẫn được giữ nguyên."
                />
              ) : null}
            </Col>
          ) : null}

          <Col xs={24}>
            <div className="mb-6">
              <Text className="mb-2 block text-sm font-medium text-slate-700">
                Loại khung ca
              </Text>

              <Alert
                type={
                  isOvernight
                    ? "warning"
                    : "info"
                }
                showIcon
                title={
                  isOvernight
                    ? "Ca qua đêm"
                    : "Ca trong ngày"
                }
                description={
                  startTime &&
                  endTime
                    ? isOvernight
                      ? `Khung ca bắt đầu lúc ${startTime} và kết thúc lúc ${endTime} của ngày hôm sau.`
                      : `Khung ca bắt đầu lúc ${startTime} và kết thúc lúc ${endTime} trong cùng ngày.`
                    : "Chọn giờ bắt đầu và giờ kết thúc để hệ thống tự xác định."
                }
              />
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
