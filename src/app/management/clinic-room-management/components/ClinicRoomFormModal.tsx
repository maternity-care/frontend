"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  BedDouble,
  Building2,
  DoorOpen,
  Layers,
  Pencil,
  Save,
  Users,
  X,
} from "lucide-react";

const { Text, Title } = Typography;

export type RoomStatus = "active" | "suspended";

export type ClinicRoom = {
  id: string;
  roomName: string;
  roomType: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
};

export type RoomFormValues = {
  roomName: string;
  roomType: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
};

type ClinicRoomFormModalProps = {
  open: boolean;
  editingRoom: ClinicRoom | null;
  onClose: () => void;
  onSubmit: (values: RoomFormValues) => void | Promise<void>;
};

const roomTypeOptions = [
  { value: "Siêu âm", label: "Siêu âm" },
  { value: "Xét nghiệm", label: "Xét nghiệm" },
  { value: "Tư vấn", label: "Tư vấn" },
  { value: "Khám thai", label: "Khám thai" },
  { value: "Cấp cứu", label: "Cấp cứu" },
];

const statusOptions = [
  { value: "active", label: "Đang hoạt động" },
  { value: "suspended", label: "Tạm ngưng" },
];

const initialValues: RoomFormValues = {
  roomName: "",
  roomType: "",
  floor: 1,
  capacity: 1,
  status: "active",
};

function PreviewLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-slate-400">
          {label}
        </p>

        <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value || "Chưa nhập"}
        </div>
      </div>
    </div>
  );
}

export function ClinicRoomFormModal({
  open,
  editingRoom,
  onClose,
  onSubmit,
}: ClinicRoomFormModalProps) {
  const [form] = Form.useForm<RoomFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const roomName = Form.useWatch("roomName", form);
  const roomType = Form.useWatch("roomType", form);
  const floor = Form.useWatch("floor", form);
  const capacity = Form.useWatch("capacity", form);
  const status = Form.useWatch("status", form);

  useEffect(() => {
    if (!open) return;

    if (editingRoom) {
      form.setFieldsValue({
        roomName: editingRoom.roomName,
        roomType: editingRoom.roomType,
        floor: editingRoom.floor,
        capacity: editingRoom.capacity,
        status: editingRoom.status,
      });

      return;
    }

    form.resetFields();
    form.setFieldsValue(initialValues);
  }, [open, editingRoom, form]);

  const modalTitle = editingRoom ? "Cập nhật phòng khám" : "Thêm phòng khám";

  const modalDescription = editingRoom
    ? "Chỉnh sửa thông tin phòng khám, loại phòng, tầng, sức chứa và trạng thái hoạt động."
    : "Tạo phòng khám mới để quản lý hoạt động khám, tư vấn và dịch vụ tại cơ sở.";

  const previewRoomName = useMemo(() => {
    if (!roomName) return editingRoom ? editingRoom.roomName : "Phòng khám mới";
    return roomName;
  }, [roomName, editingRoom]);

  function handleCancel() {
    if (submitting) return;

    form.resetFields();
    onClose();
  }

  async function handleFinish(values: RoomFormValues) {
    setSubmitting(true);

    try {
      await onSubmit({
        roomName: values.roomName,
        roomType: values.roomType,
        floor: values.floor,
        capacity: values.capacity,
        status: values.status,
      });

      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      width={1180}
      centered
      title={null}
      footer={null}
      onCancel={handleCancel}
      mask={{ closable: !submitting }}
      className="clinic-room-form-modal"
    >
      <div className="border-b border-slate-200 px-1 pb-4">
        <Title level={3} className="!mb-1 !text-slate-950">
          {modalTitle}
        </Title>

        <Text className="text-slate-500">{modalDescription}</Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
        className="mt-5"
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card
              className="border-slate-200"
              title={
                <Space>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <DoorOpen className="h-4 w-4" />
                  </span>

                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Thông tin phòng khám
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Nhập tên phòng, loại phòng và trạng thái hoạt động.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="roomName"
                    label="Tên phòng"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên phòng" },
                    ]}
                  >
                    <Input size="large" placeholder="Ví dụ: P101" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="roomType"
                    label="Loại phòng"
                    rules={[
                      { required: true, message: "Vui lòng chọn loại phòng" },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="Chọn loại phòng"
                      options={roomTypeOptions}
                    />
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
                      placeholder="Chọn trạng thái"
                      options={statusOptions}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              className="border-slate-200"
              styles={{
                header: {
                  padding: "6px 12px",
                  minHeight: 44,
                },
                body: {
                  padding: "8px 12px 2px",
                },
              }}
              title={
                <Space className="ml-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Building2 className="h-4 w-4" />
                  </span>

                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Thiết lập phòng
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Cập nhật tầng và sức chứa của phòng khám.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={16}className="pl-3">
                <Col xs={24} md={12}>
                  <Form.Item
                    name="floor"
                    label="Tầng"
                    rules={[{ required: true, message: "Vui lòng nhập tầng" }]}
                  >
                    <InputNumber
                      size="large"
                      min={1}
                      className="w-full"
                      placeholder="Ví dụ: 1"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="capacity"
                    label="Sức chứa"
                    rules={[
                      { required: true, message: "Vui lòng nhập sức chứa" },
                    ]}
                  >
                    <InputNumber
                      size="large"
                      min={1}
                      className="w-full"
                      placeholder="Ví dụ: 2"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5 xl:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                <BedDouble className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">
                  {previewRoomName}
                </p>

                <p className="text-sm text-slate-500">
                  {roomType || "Chưa chọn loại phòng"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Tag color={status === "suspended" ? "default" : "green"}>
                {status === "suspended" ? "Tạm ngưng" : "Đang hoạt động"}
              </Tag>
            </div>

            <div className="mt-5 space-y-3">
              <PreviewLine
                icon={<DoorOpen className="h-4 w-4" />}
                label="Tên phòng"
                value={roomName}
              />

              <PreviewLine
                icon={<BedDouble className="h-4 w-4" />}
                label="Loại phòng"
                value={roomType}
              />

              <PreviewLine
                icon={<Layers className="h-4 w-4" />}
                label="Tầng"
                value={floor ? `Tầng ${floor}` : ""}
              />

              <PreviewLine
                icon={<Users className="h-4 w-4" />}
                label="Sức chứa"
                value={capacity ? `${capacity} người` : ""}
              />
            </div>
          </aside>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={handleCancel} disabled={submitting}>
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>

          <Button type="primary" htmlType="submit" loading={submitting}>
            {editingRoom ? (
              <Pencil className="mr-1 h-4 w-4" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}

            {editingRoom ? "Cập nhật phòng" : "Lưu phòng"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
