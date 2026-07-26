"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  App,
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
import {
  Building2,
  DoorOpen,
  Layers,
  Pencil,
  Save,
  Shapes,
  X,
} from "lucide-react";
import type {
  ClinicRoom,
  RoomFormValues,
  RoomType,
} from "@/management/features/rooms/rooms.types";

const { Text, Title } = Typography;

type ClinicRoomFormModalProps = {
  open: boolean;
  editingRoom: ClinicRoom | null;
  roomTypes: RoomType[];
  facilityName?: string;
  onClose: () => void;
  onSubmit: (
    values: RoomFormValues,
  ) => void | Promise<void>;
};

const initialValues: RoomFormValues = {
  roomName: "",
  roomTypeId: "",
  floor: "",
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
      <div className="mt-0.5 text-slate-400">
        {icon}
      </div>

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

function hasChanges(
  values: RoomFormValues,
  editingRoom: ClinicRoom,
) {
  return (
    values.roomName.trim() !==
      editingRoom.roomName ||
    values.roomTypeId !==
      editingRoom.roomTypeId ||
    values.floor.trim() !==
      editingRoom.floor ||
    values.status !== editingRoom.status
  );
}

export function ClinicRoomFormModal({
  open,
  editingRoom,
  roomTypes,
  facilityName,
  onClose,
  onSubmit,
}: ClinicRoomFormModalProps) {
  const { modal: modalApi } = App.useApp();
  const [form] =
    Form.useForm<RoomFormValues>();
  const [submitting, setSubmitting] =
    useState(false);
  const [confirmOpen, setConfirmOpen] =
    useState(false);
  const [pendingValues, setPendingValues] =
    useState<RoomFormValues | null>(null);

  const roomName =
    Form.useWatch("roomName", form) ?? "";
  const roomTypeId =
    Form.useWatch("roomTypeId", form) ?? "";
  const floor =
    Form.useWatch("floor", form) ?? "";
  const status =
    Form.useWatch("status", form) ??
    "active";

  const roomTypeById = useMemo(
    () =>
      new Map(
        roomTypes.map((roomType) => [
          roomType.id,
          roomType,
        ]),
      ),
    [roomTypes],
  );

  const selectedRoomType =
    roomTypeById.get(roomTypeId);

  const roomTypeOptions = useMemo(() => {
    const options = roomTypes.map(
      (roomType) => ({
        value: roomType.id,
        label: `${roomType.name}${
          roomType.code
            ? ` (${roomType.code})`
            : ""
        }`,
      }),
    );

    if (
      editingRoom &&
      editingRoom.roomTypeId &&
      !options.some(
        (option) =>
          option.value ===
          editingRoom.roomTypeId,
      )
    ) {
      options.push({
        value: editingRoom.roomTypeId,
        label:
          editingRoom.roomTypeName ||
          `Loại phòng #${editingRoom.roomTypeId}`,
      });
    }

    return options;
  }, [editingRoom, roomTypes]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setConfirmOpen(false);
      setPendingValues(null);

      if (editingRoom) {
        form.setFieldsValue({
          roomName: editingRoom.roomName,
          roomTypeId:
            editingRoom.roomTypeId,
          floor: editingRoom.floor,
          status: editingRoom.status,
        });
        return;
      }

      form.resetFields();
      form.setFieldsValue(initialValues);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [editingRoom, form, open]);

  const previewRoomName =
    roomName ||
    editingRoom?.roomName ||
    "Phòng mới";

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

  async function handleFinish(
    values: RoomFormValues,
  ) {
    const formattedValues: RoomFormValues = {
      roomName: values.roomName.trim(),
      roomTypeId: values.roomTypeId,
      floor: values.floor.trim(),
      status: values.status,
    };

    if (
      editingRoom &&
      !hasChanges(
        formattedValues,
        editingRoom,
      )
    ) {
      modalApi.info({
        centered: true,
        title: "Không có gì thay đổi",
        content:
          "Thông tin phòng hiện tại giống hoàn toàn với dữ liệu ban đầu.",
        okText: "Đóng",
      });
      return;
    }

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
        width={920}
        centered
        title={null}
        footer={null}
        onCancel={handleCancel}
        mask={{
          closable:
            !submitting && !confirmOpen,
        }}
        destroyOnHidden
        styles={{
          body: {
            maxHeight: "76vh",
            overflowY: "auto",
            marginRight: 28,
            paddingRight: 12,
          },
        }}
      >
        <div className="border-b border-slate-200 pb-4">
          <Title
            level={4}
            className="!mb-1 !text-slate-950"
          >
            {editingRoom
              ? "Cập nhật phòng"
              : "Thêm phòng mới"}
          </Title>

          <Text className="text-sm text-slate-500">
            {editingRoom
              ? "Chỉnh sửa tên phòng, loại phòng, tầng và trạng thái."
              : "Khai báo phòng mới cho cơ sở đang được chọn."}
          </Text>
        </div>

        <Form<RoomFormValues>
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={(values) =>
            void handleFinish(values)
          }
          className="mt-4"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <Card
                size="small"
                className="border-slate-200"
                title={
                  <Space size={10}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <DoorOpen className="h-4 w-4" />
                    </span>

                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Thông tin phòng
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Nhập thông tin nhận diện của phòng.
                      </p>
                    </span>
                  </Space>
                }
              >
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="roomName"
                      label="Tên phòng"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message:
                            "Vui lòng nhập tên phòng.",
                        },
                        {
                          max: 120,
                          message:
                            "Tên phòng tối đa 120 ký tự.",
                        },
                      ]}
                    >
                      <Input placeholder="Ví dụ: Phòng khám thai 201" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="roomTypeId"
                      label="Loại phòng"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng chọn loại phòng.",
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Chọn loại phòng"
                        options={roomTypeOptions}
                        notFoundContent="Không có loại phòng đang hoạt động"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="floor"
                      label="Tầng"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message:
                            "Vui lòng nhập tầng.",
                        },
                        {
                          max: 50,
                          message:
                            "Thông tin tầng tối đa 50 ký tự.",
                        },
                      ]}
                    >
                      <Input placeholder="Ví dụ: Tầng 2" />
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
                            label:
                              "Ngừng hoạt động",
                          },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {selectedRoomType?.description ? (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    {
                      selectedRoomType.description
                    }
                  </div>
                ) : null}
              </Card>

              <Card
                size="small"
                className="border-slate-200"
                title={
                  <Space size={10}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Building2 className="h-4 w-4" />
                    </span>

                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Cơ sở áp dụng
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Phòng sẽ thuộc cơ sở đang được quản lý.
                      </p>
                    </span>
                  </Space>
                }
              >
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <Text strong>
                    {facilityName ||
                      editingRoom?.facilityName ||
                      "Cơ sở đang chọn"}
                  </Text>
                </div>
              </Card>
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:self-start">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <DoorOpen className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="mb-0 truncate text-base font-semibold text-slate-950">
                    {previewRoomName}
                  </p>

                  <p className="mb-0 truncate text-sm text-slate-500">
                    {selectedRoomType?.name ||
                      editingRoom?.roomTypeName ||
                      "Chưa chọn loại phòng"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Tag
                  color={
                    status === "active"
                      ? "green"
                      : "default"
                  }
                >
                  {status === "active"
                    ? "Hoạt động"
                    : "Ngừng hoạt động"}
                </Tag>
              </div>

              <div className="mt-4 space-y-2.5">
                <PreviewLine
                  icon={
                    <DoorOpen className="h-4 w-4" />
                  }
                  label="Tên phòng"
                  value={roomName}
                />

                <PreviewLine
                  icon={
                    <Shapes className="h-4 w-4" />
                  }
                  label="Loại phòng"
                  value={
                    selectedRoomType?.name ||
                    editingRoom?.roomTypeName
                  }
                />

                <PreviewLine
                  icon={
                    <Layers className="h-4 w-4" />
                  }
                  label="Tầng"
                  value={floor}
                />

                <PreviewLine
                  icon={
                    <Building2 className="h-4 w-4" />
                  }
                  label="Cơ sở"
                  value={
                    facilityName ||
                    editingRoom?.facilityName
                  }
                />
              </div>
            </aside>
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              onClick={handleCancel}
              disabled={submitting}
            >
              <X className="mr-1 h-4 w-4" />
              Hủy
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              {editingRoom ? (
                <Pencil className="mr-1 h-4 w-4" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}

              {editingRoom
                ? "Cập nhật phòng"
                : "Lưu phòng"}
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
        mask={{
          closable: !submitting,
        }}
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
            Bạn có chắc chắn muốn lưu các thay đổi của phòng này không?
          </p>

          {editingRoom ? (
            <p className="mx-auto mt-2 max-w-[340px] truncate text-sm font-semibold text-slate-800">
              {editingRoom.roomName} -{" "}
              {editingRoom.roomTypeName}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={handleCloseConfirm}
              disabled={submitting}
              className="h-11 rounded-lg font-semibold"
            >
              Kiểm tra lại
            </Button>

            <Button
              type="primary"
              size="large"
              loading={submitting}
              onClick={() =>
                void handleConfirmUpdate()
              }
              className="h-11 rounded-lg font-semibold"
            >
              Xác nhận cập nhật
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}