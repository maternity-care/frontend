"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
import type {
  ClinicRoom,
  RoomFormValues,
} from "@/management/features/rooms/rooms.types";

const { Text, Title } = Typography;

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
  icon: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="flex gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="mt-0.5 text-slate-400">{icon}</div>

      <div className="min-w-0">
        <p className="mb-0 text-[11px] font-semibold uppercase text-slate-400">
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<RoomFormValues | null>(
    null,
  );

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
    ? "Chỉnh sửa thông tin phòng khám, loại phòng, tầng, sức chứa và trạng thái."
    : "Tạo phòng khám mới trong cơ sở.";

  const previewRoomName = useMemo(() => {
    if (!roomName) return editingRoom ? editingRoom.roomName : "Phòng khám mới";

    return roomName;
  }, [roomName, editingRoom]);

  function handleCancel() {
    if (submitting) return;

    form.resetFields();
    setConfirmOpen(false);
    setPendingValues(null);
    onClose();
  }

  function handleCloseConfirm() {
    if (submitting) return;

    setConfirmOpen(false);
    setPendingValues(null);
  }

  async function handleFinish(values: RoomFormValues) {
    const formattedValues: RoomFormValues = {
      roomName: values.roomName,
      roomType: values.roomType,
      floor: values.floor,
      capacity: values.capacity,
      status: values.status,
    };

    if (editingRoom) {
      setPendingValues(formattedValues);
      setConfirmOpen(true);
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(formattedValues);
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmUpdate() {
    if (!pendingValues) return;

    setSubmitting(true);

    try {
      await onSubmit(pendingValues);

      form.resetFields();
      setConfirmOpen(false);
      setPendingValues(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        width={980}
        centered
        title={null}
        footer={null}
        onCancel={handleCancel}
        mask={{ closable: !submitting && !confirmOpen }}
        className="clinic-room-form-modal"
        styles={{
          body: {
            paddingTop: 20,
            paddingBottom: 16,
          },
        }}
      >
        <div className="border-b border-slate-200 px-1 pb-3">
          <Title level={4} className="!mb-1 !text-slate-950">
            {modalTitle}
          </Title>

          <Text className="text-sm text-slate-500">{modalDescription}</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleFinish}
          className="mt-4"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <Card
                size="small"
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
                  <Space size={10}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
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
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="roomName"
                      label="Tên phòng"
                      className="!mb-1"
                      rules={[
                        { required: true, message: "Vui lòng nhập tên phòng" },
                      ]}
                    >
                      <Input placeholder="Ví dụ: P101" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="roomType"
                      label="Loại phòng"
                      className="!mb-1"
                      rules={[
                        { required: true, message: "Vui lòng chọn loại phòng" },
                      ]}
                    >
                      <Select
                        placeholder="Chọn loại phòng"
                        options={roomTypeOptions}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="status"
                      label="Trạng thái"
                      className="!mb-1"
                      rules={[
                        { required: true, message: "Vui lòng chọn trạng thái" },
                      ]}
                    >
                      <Select
                        placeholder="Chọn trạng thái"
                        options={statusOptions}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card
                size="small"
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
                  <Space size={10} className="ml-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
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
                <Row gutter={[12, 0]} className="pl-6">
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="floor"
                      label="Tầng"
                      className="!mb-1"
                      rules={[
                        { required: true, message: "Vui lòng nhập tầng" },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        className="w-[112px]"
                        placeholder="Ví dụ: 1"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={6}>
                    <Form.Item
                      name="capacity"
                      label="Sức chứa"
                      className="!mb-1"
                      rules={[
                        { required: true, message: "Vui lòng nhập sức chứa" },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        className="w-[112px]"
                        placeholder="Ví dụ: 2"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:self-start">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <BedDouble className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="mb-0 truncate text-base font-semibold text-slate-950">
                    {previewRoomName}
                  </p>

                  <p className="mb-0 text-sm text-slate-500">
                    {roomType || "Chưa chọn loại phòng"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Tag color={status === "suspended" ? "default" : "green"}>
                  {status === "suspended" ? "Tạm ngưng" : "Đang hoạt động"}
                </Tag>
              </div>

              <div className="mt-4 space-y-2.5">
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

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
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

      <Modal
        open={confirmOpen}
        centered
        width={456}
        title={null}
        footer={null}
        closable={false}
        onCancel={handleCloseConfirm}
        mask={{ closable: !submitting }}
        className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div className="relative px-6 pb-6 pt-7 text-center">
          <button
            type="button"
            aria-label="Đóng"
            onClick={handleCloseConfirm}
            disabled={submitting}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Pencil className="h-7 w-7 text-blue-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">
            Xác nhận cập nhật phòng
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Bạn có chắc chắn muốn cập nhật thông tin phòng khám này không?
          </p>

          {editingRoom ? (
            <p className="mx-auto mt-2 max-w-[340px] truncate text-sm font-semibold text-slate-800">
              {editingRoom.roomName} - {editingRoom.roomType}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={handleCloseConfirm}
              disabled={submitting}
              className="h-11 rounded-lg font-semibold"
            >
              Hủy
            </Button>

            <Button
              type="primary"
              size="large"
              loading={submitting}
              onClick={handleConfirmUpdate}
              className="h-11 rounded-lg font-semibold"
            >
              Cập nhật
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}