"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
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
  TimePicker,
  Typography,
} from "antd";
import { Building2, Clock3, Mail, MapPin, Phone, Save, X } from "lucide-react";
import { updateFacility } from "@/management/features/facilities/facilities.api";
import type {
  Facility,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";

const { Text, Title } = Typography;
const { TextArea } = Input;

export type FacilityUpdateValues = {
  name: string;
  code: string;
  hotline: string;
  email: string;
  status: FacilityStatus;
  address: string;
  city: string;
  district: string;
  ward: string;
  latitude: string;
  longitude: string;
  workingDays: string;
  openTime: string;
  closeTime: string;
  description: string;
  internalNote: string;
};

type FacilityUpdateFields = Omit<
  FacilityUpdateValues,
  "openTime" | "closeTime"
> & {
  openTime?: Dayjs;
  closeTime?: Dayjs;
};

type FacilityUpdateModalProps = {
  open: boolean;
  facility: Facility | null;
  onClose: () => void;
  onUpdated: (facility: Facility) => void;
};

function getSubmitErrorMessage(err: unknown) {
  if (err instanceof Error) {
    if (err.message.includes("Facility code already exists")) {
      return "Mã cơ sở đã tồn tại. Vui lòng nhập mã cơ sở khác.";
    }

    if (err.message.includes("Validation failed")) {
      return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.";
    }

    return err.message;
  }

  return "Không thể cập nhật cơ sở. Vui lòng thử lại.";
}

function parseWorkingHours(value?: string) {
  if (!value || value === "Chưa cập nhật") {
    return {
      openTime: undefined,
      closeTime: undefined,
    };
  }

  const [openText, closeText] = value.split("-").map((item) => item.trim());

  return {
    openTime: openText ? dayjs(`2000-01-01T${openText}:00`) : undefined,
    closeTime: closeText ? dayjs(`2000-01-01T${closeText}:00`) : undefined,
  };
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
        <p className="text-xs font-semibold uppercase text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value || "Chưa nhập"}
        </p>
      </div>
    </div>
  );
}

export function FacilityUpdateModal({
  open,
  facility,
  onClose,
  onUpdated,
}: FacilityUpdateModalProps) {
  const [form] = Form.useForm<FacilityUpdateFields>();
  const [submitting, setSubmitting] = useState(false);

  const name = Form.useWatch("name", form);
  const code = Form.useWatch("code", form);
  const hotline = Form.useWatch("hotline", form);
  const email = Form.useWatch("email", form);
  const status = Form.useWatch("status", form);
  const address = Form.useWatch("address", form);
  const city = Form.useWatch("city", form);
  const district = Form.useWatch("district", form);
  const ward = Form.useWatch("ward", form);
  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);
  const workingDays = Form.useWatch("workingDays", form);
  const openTime = Form.useWatch("openTime", form);
  const closeTime = Form.useWatch("closeTime", form);
  const description = Form.useWatch("description", form);

  useEffect(() => {
    if (!open || !facility) return;

    const { openTime: parsedOpenTime, closeTime: parsedCloseTime } =
      parseWorkingHours(facility.workingHours);

    form.setFieldsValue({
      name: facility.name,
      code: facility.code,
      hotline: facility.hotline,
      email: facility.email ?? "",
      status: facility.status,
      address: facility.address,
      city: facility.city,
      district: facility.district,
      ward: facility.ward,
      latitude: facility.latitude ?? "",
      longitude: facility.longitude ?? "",
      workingDays: "",
      openTime: parsedOpenTime,
      closeTime: parsedCloseTime,
      description:
        facility.featuredServices === "Chưa cập nhật"
          ? ""
          : facility.featuredServices,
      internalNote: "",
    });
  }, [open, facility, form]);

  const fullAddress = useMemo(
    () => [address, ward, district, city].filter(Boolean).join(", "),
    [address, ward, district, city],
  );

  const workingTime = useMemo(() => {
    const openText = openTime?.format("HH:mm");
    const closeText = closeTime?.format("HH:mm");

    if (openText && closeText) return `${openText}-${closeText}`;
    return "";
  }, [openTime, closeTime]);

  function handleCancel() {
    form.resetFields();
    onClose();
  }

  async function handleFinish(values: FacilityUpdateFields) {
    if (!facility) return;

    setSubmitting(true);

    try {
      const formattedOpenTime = values.openTime?.format("HH:mm") ?? "";
      const formattedCloseTime = values.closeTime?.format("HH:mm") ?? "";
      const workingHours =
        formattedOpenTime && formattedCloseTime
          ? `${formattedOpenTime}-${formattedCloseTime}`
          : "Chưa cập nhật";

      const response = await updateFacility(facility.id, {
        name: values.name,
        code: values.code.trim().toUpperCase(),
        hotline: values.hotline,
        email: values.email ?? "",
        status: values.status,
        address: values.address,
        city: values.city,
        district: values.district,
        ward: values.ward,
        latitude: values.latitude ?? "",
        longitude: values.longitude ?? "",
        workingDays: values.workingDays ?? "",
        openTime: formattedOpenTime,
        closeTime: formattedCloseTime,
        workingHours,
        featuredServices: values.description || "Chưa cập nhật",
        description: values.description ?? "",
        internalNote: values.internalNote ?? "",
      });

      onUpdated({
        ...response.data,
        workingHours,
        featuredServices: values.description || "Chưa cập nhật",
      });

      form.resetFields();
      onClose();

      Modal.success({
        title: "Cập nhật cơ sở thành công",
        content: "Thông tin cơ sở khám đã được cập nhật.",
        okText: "Đóng",
        centered: true,
      });
    } catch (err) {
      Modal.error({
        title: "Cập nhật cơ sở thất bại",
        content: getSubmitErrorMessage(err),
        okText: "Đóng",
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
      className="facility-update-modal"
      mask={{ closable: !submitting }}
    >
      <div className="border-b border-slate-200 px-1 pb-4">
        <Title level={3} className="!mb-1 !text-slate-950">
          Cập nhật cơ sở khám
        </Title>

        <Text className="text-slate-500">
          Chỉnh sửa thông tin cơ sở khám, địa chỉ, liên hệ và trạng thái hoạt
          động.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-5"
      >
        <div className="grid max-h-[68vh] gap-5 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                      Cập nhật tên, mã cơ sở, liên hệ và trạng thái hoạt động.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="Tên cơ sở"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên cơ sở" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Ví dụ: Phòng khám Sản Phụ khoa An Tâm"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="code"
                    label="Mã cơ sở"
                    rules={[
                      { required: true, message: "Vui lòng nhập mã cơ sở" },
                    ]}
                  >
                    <Input size="large" placeholder="Ví dụ: PK-SA-001" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="hotline"
                    label="Số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại",
                      },
                    ]}
                  >
                    <Input size="large" placeholder="024.3825.5555" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ type: "email", message: "Email không hợp lệ" }]}
                  >
                    <Input size="large" placeholder="hotro@khamasantam.vn" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[
                      { required: true, message: "Vui lòng chọn trạng thái" },
                    ]}
                  >
                    <Select
                      size="large"
                      options={[
                        { value: "active", label: "Hoạt động" },
                        { value: "suspended", label: "Tạm ngưng" },
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
                      Vị trí & thời gian
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Cập nhật địa chỉ, khu vực, tọa độ và thời gian hoạt động.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="address"
                    label="Địa chỉ"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ" },
                    ]}
                  >
                    <Input size="large" placeholder="Số 45 Đường Láng" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="city"
                    label="Tỉnh/Thành phố"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tỉnh/thành phố",
                      },
                    ]}
                  >
                    <Input size="large" placeholder="Hà Nội" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="district"
                    label="Quận/Huyện"
                    rules={[
                      { required: true, message: "Vui lòng nhập quận/huyện" },
                    ]}
                  >
                    <Input size="large" placeholder="Đống Đa" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="ward"
                    label="Phường/Xã"
                    rules={[
                      { required: true, message: "Vui lòng nhập phường/xã" },
                    ]}
                  >
                    <Input size="large" placeholder="Láng Thượng" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="latitude" label="Vĩ độ">
                    <Input size="large" placeholder="21.0285000" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="longitude" label="Kinh độ">
                    <Input size="large" placeholder="105.8372000" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="workingDays" label="Ngày hoạt động">
                    <Input size="large" placeholder="Thứ 2 - Chủ nhật" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="openTime" label="Giờ mở cửa">
                    <TimePicker
                      size="large"
                      format="HH:mm"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="closeTime" label="Giờ đóng cửa">
                    <TimePicker
                      size="large"
                      format="HH:mm"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card className="border-slate-200" title="Dịch vụ & ghi chú">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="description" label="Dịch vụ nổi bật">
                    <TextArea
                      rows={4}
                      placeholder="Ví dụ: Khám thai, Siêu âm, Xét nghiệm"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="internalNote" label="Ghi chú nội bộ">
                    <TextArea
                      rows={4}
                      placeholder="Ghi chú cho nhân sự nội bộ"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5 xl:sticky xl:top-0 xl:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Building2 className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">
                  {name || "Cơ sở khám"}
                </p>

                <p className="text-sm text-slate-500">
                  {code || "Chưa nhập mã cơ sở"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Tag color={status === "suspended" ? "default" : "green"}>
                {status === "suspended" ? "Tạm ngưng" : "Hoạt động"}
              </Tag>
            </div>

            <div className="mt-5 space-y-3">
              <PreviewLine
                icon={<Phone className="h-4 w-4" />}
                label="Số điện thoại"
                value={hotline}
              />

              <PreviewLine
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={email}
              />

              <PreviewLine
                icon={<MapPin className="h-4 w-4" />}
                label="Địa chỉ"
                value={fullAddress}
              />

              <PreviewLine
                icon={<MapPin className="h-4 w-4" />}
                label="Tọa độ"
                value={
                  latitude || longitude
                    ? `${latitude || "?"}, ${longitude || "?"}`
                    : ""
                }
              />

              <PreviewLine
                icon={<Clock3 className="h-4 w-4" />}
                label="Thời gian"
                value={
                  workingDays || workingTime
                    ? `${workingDays || "Ngày chưa nhập"} · ${
                        workingTime || "Giờ chưa nhập"
                      }`
                    : ""
                }
              />
            </div>

            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Dịch vụ nổi bật
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {description || "Chưa nhập dịch vụ nổi bật."}
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={handleCancel} disabled={submitting}>
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>

          <Button type="primary" htmlType="submit" loading={submitting}>
            <Save className="mr-1 h-4 w-4" />
            Cập nhật cơ sở
          </Button>
        </div>
      </Form>
    </Modal>
  );
}