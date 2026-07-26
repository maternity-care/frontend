"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { Building2, Clock3, Mail, MapPin, Phone, Save, UserRound, X } from "lucide-react";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import type {
  FacilityScheduleInput,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import {
  DEFAULT_FACILITY_SCHEDULES,
  FacilityScheduleEditor,
  validateFacilitySchedules,
} from "./FacilityScheduleEditor";

const { Text, Title } = Typography;
const FACILITY_MESSAGES = RESPONSE_MESSAGES.FACILITY_MANAGEMENT;

export type FacilityFormValues = {
  name: string;
  ownerId: string;
  hotline: string;
  email: string;
  status: FacilityStatus;
  address: string;
  city: string;
  ward: string;
  latitude: string;
  longitude: string;
  schedules: FacilityScheduleInput[];
};

type FacilityFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FacilityFormValues) => void | Promise<void>;
};

const initialValues: FacilityFormValues = {
  name: "",
  ownerId: "",
  hotline: "",
  email: "",
  status: "active",
  address: "",
  city: "",
  ward: "",
  latitude: "",
  longitude: "",
  schedules: DEFAULT_FACILITY_SCHEDULES,
};

function getSubmitErrorMessage(err: unknown) {
  if (err instanceof Error) {
    if (err.message.includes("Facility code already exists")) {
      return FACILITY_MESSAGES.FACILITY_CODE_EXISTS;
    }

    if (err.message.includes("Validation failed")) {
      return FACILITY_MESSAGES.VALIDATION_FAILED;
    }

    return err.message;
  }

  return FACILITY_MESSAGES.CREATE_ERROR_DEFAULT;
}

function PreviewLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value || FACILITY_MESSAGES.NOT_ENTERED}
        </p>
      </div>
    </div>
  );
}

function getScheduleSummary(schedules?: FacilityScheduleInput[]) {
  if (!schedules?.length) return "Chưa thiết lập";

  return schedules
    .map((schedule) => {
      const days = schedule.days.join(", ") || "Chưa chọn ngày";
      const time = schedule.isClosed
        ? "Đóng cửa"
        : `${schedule.openTime || "--:--"} - ${schedule.closeTime || "--:--"}`;

      return `${days}: ${time}`;
    })
    .join("; ");
}

export function FacilityFormModal({
  open,
  onClose,
  onSubmit,
}: FacilityFormModalProps) {
  const [form] = Form.useForm<FacilityFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const name = Form.useWatch("name", form);
  const ownerId = Form.useWatch("ownerId", form);
  const hotline = Form.useWatch("hotline", form);
  const email = Form.useWatch("email", form);
  const status = Form.useWatch("status", form);
  const address = Form.useWatch("address", form);
  const city = Form.useWatch("city", form);
  const ward = Form.useWatch("ward", form);
  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);
  const schedules = Form.useWatch("schedules", form);

  const fullAddress = useMemo(
    () => [address, ward, city].filter(Boolean).join(", "),
    [address, ward, city],
  );

  function handleCancel() {
    if (submitting) return;
    form.resetFields();
    onClose();
  }

  async function handleFinish(values: FacilityFormValues) {
    setSubmitting(true);

    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        ownerId: values.ownerId.trim(),
        hotline: values.hotline.trim(),
        email: values.email?.trim() ?? "",
        address: values.address.trim(),
        city: values.city.trim(),
        ward: values.ward.trim(),
        latitude: values.latitude?.trim() ?? "",
        longitude: values.longitude?.trim() ?? "",
      });

      form.resetFields();
      onClose();

      Modal.success({
        title: FACILITY_MESSAGES.CREATE_SUCCESS_TITLE,
        content: FACILITY_MESSAGES.CREATE_SUCCESS_CONTENT,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } catch (err) {
      Modal.error({
        title: FACILITY_MESSAGES.CREATE_ERROR_TITLE,
        content: getSubmitErrorMessage(err),
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      width={1180}
      centered
      onCancel={handleCancel}
      footer={null}
      title={null}
      mask={{ closable: !submitting }}
      destroyOnHidden
    >
      <div className="border-b border-slate-200 pb-4">
        <Title level={3} className="!mb-1 !text-slate-950">
          {FACILITY_MESSAGES.ADD_FACILITY_TITLE}
        </Title>
        <Text className="text-slate-500">
          Mã cơ sở sẽ được hệ thống tự động tạo sau khi lưu.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
        className="mt-5"
      >
        <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card
              className="border-slate-200"
              title={
                <Space>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Thông tin cơ sở
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Nhập thông tin chung và chủ sở hữu của cơ sở.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label={FACILITY_MESSAGES.FACILITY_NAME}
                    rules={[{ required: true, message: "Vui lòng nhập tên cơ sở." }]}
                  >
                    <Input size="large" placeholder="Nhập tên cơ sở" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="ownerId"
                    label="Mã chủ cơ sở"
                    rules={[{ required: true, message: "Vui lòng nhập mã chủ cơ sở." }]}
                  >
                    <Input
                      size="large"
                      prefix={<UserRound className="h-4 w-4 text-slate-400" />}
                      placeholder="Ví dụ: 900011"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="hotline"
                    label={FACILITY_MESSAGES.PHONE}
                    rules={[{ required: true, message: "Vui lòng nhập số điện thoại." }]}
                  >
                    <Input size="large" placeholder="Nhập số điện thoại" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label={FACILITY_MESSAGES.EMAIL}
                    rules={[{ type: "email", message: "Email không đúng định dạng." }]}
                  >
                    <Input size="large" placeholder="Nhập email" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="status"
                    label={FACILITY_MESSAGES.STATUS}
                    rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
                  >
                    <Select
                      size="large"
                      options={[
                        { value: "active", label: FACILITY_MESSAGES.ACTIVE },
                        { value: "suspended", label: FACILITY_MESSAGES.SUSPENDED },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              className="border-slate-200"
              title={
                <Space>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Địa chỉ
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Backend mới sử dụng tỉnh/thành và phường/xã, không còn quận/huyện.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="address"
                    label={FACILITY_MESSAGES.ADDRESS}
                    rules={[{ required: true, message: "Vui lòng nhập địa chỉ." }]}
                  >
                    <Input size="large" placeholder="Nhập số nhà, tên đường" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="city"
                    label={FACILITY_MESSAGES.CITY}
                    rules={[{ required: true, message: "Vui lòng nhập tỉnh/thành phố." }]}
                  >
                    <Input size="large" placeholder="Nhập tỉnh/thành phố" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="ward"
                    label={FACILITY_MESSAGES.WARD}
                    rules={[{ required: true, message: "Vui lòng nhập phường/xã." }]}
                  >
                    <Input size="large" placeholder="Nhập phường/xã" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="latitude" label={FACILITY_MESSAGES.LATITUDE}>
                    <Input size="large" placeholder="Ví dụ: 21.0285" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="longitude" label={FACILITY_MESSAGES.LONGITUDE}>
                    <Input size="large" placeholder="Ví dụ: 105.8542" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              className="border-slate-200"
              title={
                <Space>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Lịch hoạt động
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Có thể thiết lập các khung giờ khác nhau theo từng nhóm ngày.
                    </p>
                  </span>
                </Space>
              }
            >
              <Form.Item
                name="schedules"
                rules={[{ validator: (_rule, value) => validateFacilitySchedules(value) }]}
              >
                <FacilityScheduleEditor disabled={submitting} />
              </Form.Item>
            </Card>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5 xl:sticky xl:top-0 xl:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">
                  {name || FACILITY_MESSAGES.NEW_FACILITY}
                </p>
                <p className="text-sm text-slate-500">Mã được tạo tự động</p>
              </div>
            </div>

            <div className="mt-5">
              <Tag color={status === "suspended" ? "default" : "green"}>
                {status === "suspended"
                  ? FACILITY_MESSAGES.SUSPENDED
                  : FACILITY_MESSAGES.ACTIVE}
              </Tag>
            </div>

            <div className="mt-5 space-y-3">
              <PreviewLine
                icon={<UserRound className="h-4 w-4" />}
                label="Mã chủ cơ sở"
                value={ownerId}
              />
              <PreviewLine
                icon={<Phone className="h-4 w-4" />}
                label={FACILITY_MESSAGES.PHONE}
                value={hotline}
              />
              <PreviewLine
                icon={<Mail className="h-4 w-4" />}
                label={FACILITY_MESSAGES.EMAIL}
                value={email}
              />
              <PreviewLine
                icon={<MapPin className="h-4 w-4" />}
                label={FACILITY_MESSAGES.ADDRESS}
                value={fullAddress}
              />
              <PreviewLine
                icon={<MapPin className="h-4 w-4" />}
                label={FACILITY_MESSAGES.COORDINATES}
                value={
                  latitude || longitude
                    ? `${latitude || "?"}, ${longitude || "?"}`
                    : undefined
                }
              />
              <PreviewLine
                icon={<Clock3 className="h-4 w-4" />}
                label="Lịch hoạt động"
                value={getScheduleSummary(schedules)}
              />
            </div>
          </aside>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={handleCancel} disabled={submitting}>
            <X className="mr-1 h-4 w-4" />
            {RESPONSE_MESSAGES.COMMON.CANCEL}
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            <Save className="mr-1 h-4 w-4" />
            {FACILITY_MESSAGES.SAVE_FACILITY}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
