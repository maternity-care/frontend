"use client";

import { useMemo } from "react";
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
import {
  Building2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Save,
  X,
} from "lucide-react";

const { Text, Title } = Typography;
const { TextArea } = Input;

export type FacilityFormValues = {
  name: string;
  hotline: string;
  email: string;
  status: "active" | "suspended";
  address: string;
  city: string;
  district: string;
  workingDays: string;
  openTime: string;
  closeTime: string;
  description: string;
  internalNote: string;
};

type FacilityFormFields = Omit<FacilityFormValues, "openTime" | "closeTime"> & {
  openTime?: Dayjs;
  closeTime?: Dayjs;
};

type FacilityFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FacilityFormValues) => void;
};

const initialValues: FacilityFormFields = {
  name: "",
  hotline: "",
  email: "",
  status: "active",
  address: "",
  city: "",
  district: "",
  workingDays: "",
  description: "",
  internalNote: "",
};

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
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value || "Chưa nhập"}
        </p>
      </div>
    </div>
  );
}

export function FacilityFormModal({
  open,
  onClose,
  onSubmit,
}: FacilityFormModalProps) {
  const [form] = Form.useForm<FacilityFormFields>();

  const name = Form.useWatch("name", form);
  const hotline = Form.useWatch("hotline", form);
  const email = Form.useWatch("email", form);
  const status = Form.useWatch("status", form);
  const address = Form.useWatch("address", form);
  const city = Form.useWatch("city", form);
  const district = Form.useWatch("district", form);
  const workingDays = Form.useWatch("workingDays", form);
  const openTime = Form.useWatch("openTime", form);
  const closeTime = Form.useWatch("closeTime", form);
  const description = Form.useWatch("description", form);

  const fullAddress = useMemo(
    () => [address, district, city].filter(Boolean).join(", "),
    [address, district, city],
  );

  const workingTime = useMemo(() => {
    const openText = openTime?.format("HH:mm");
    const closeText = closeTime?.format("HH:mm");

    if (openText && closeText) return `${openText} - ${closeText}`;
    return "";
  }, [openTime, closeTime]);

  function handleCancel() {
    form.resetFields();
    onClose();
  }

  function handleFinish(values: FacilityFormFields) {
    onSubmit({
      name: values.name,
      hotline: values.hotline,
      email: values.email ?? "",
      status: values.status,
      address: values.address,
      city: values.city ?? "",
      district: values.district ?? "",
      workingDays: values.workingDays ?? "",
      openTime: values.openTime?.format("HH:mm") ?? "",
      closeTime: values.closeTime?.format("HH:mm") ?? "",
      description: values.description ?? "",
      internalNote: values.internalNote ?? "",
    });

    form.resetFields();
    onClose();
  }

  return (
    <Modal
      open={open}
      width={1180}
      centered
      onCancel={handleCancel}
      footer={null}
      title={null}
      className="facility-form-modal"
    >
      <div className="border-b border-slate-200 px-1 pb-4">
        <Title level={3} className="!mb-1 !text-slate-950">
          Thêm cơ sở khám
        </Title>
        <Text className="text-slate-500">
          Tạo cơ sở mới để quản lý lịch khám, dịch vụ và thông tin liên hệ.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
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
                      Nhập tên, liên hệ và trạng thái hoạt động.
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
                    rules={[{ required: true, message: "Vui lòng nhập tên cơ sở" }]}
                  >
                    <Input size="large" placeholder="Ví dụ: Cơ sở Quận 1" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                  >
                    <Select
                      size="large"
                      options={[
                        { value: "active", label: "Đang hoạt động" },
                        { value: "suspended", label: "Tạm ngưng" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="hotline"
                    label="Hotline"
                    rules={[{ required: true, message: "Vui lòng nhập hotline" }]}
                  >
                    <Input size="large" placeholder="028 1234 5678" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="email" label="Email">
                    <Input size="large" placeholder="facility@mcs.vn" />
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
                      Cập nhật nơi hoạt động và khung giờ tiếp nhận lịch.
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
                    rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                  >
                    <Input size="large" placeholder="Số nhà, tên đường" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="city" label="Tỉnh/Thành phố">
                    <Input size="large" placeholder="TP. Hồ Chí Minh" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="district" label="Quận/Huyện">
                    <Input size="large" placeholder="Quận 1" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="workingDays" label="Ngày hoạt động">
                    <Input size="large" placeholder="Thứ 2 - Chủ nhật" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="openTime" label="Giờ mở cửa">
                    <TimePicker size="large" format="HH:mm" className="w-full" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="closeTime" label="Giờ đóng cửa">
                    <TimePicker size="large" format="HH:mm" className="w-full" />
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
                    <TextArea rows={4} placeholder="Ghi chú cho nhân sự nội bộ" />
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
                  {name || "Cơ sở mới"}
                </p>
                <p className="text-sm text-slate-500">Bản xem trước</p>
              </div>
            </div>

            <div className="mt-5">
              <Tag color={status === "suspended" ? "default" : "green"}>
                {status === "suspended" ? "Tạm ngưng" : "Đang hoạt động"}
              </Tag>
            </div>

            <div className="mt-5 space-y-3">
              <PreviewLine
                icon={<Phone className="h-4 w-4" />}
                label="Hotline"
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
          <Button onClick={handleCancel}>
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>

          <Button type="primary" htmlType="submit">
            <Save className="mr-1 h-4 w-4" />
            Lưu cơ sở
          </Button>
        </div>
      </Form>
    </Modal>
  );
}