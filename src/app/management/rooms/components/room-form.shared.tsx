"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Alert,
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
import {
  getRoomTypeLookup,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
  CreateRoomInput,
  RoomFormValues,
  RoomType,
} from "@/management/features/rooms/rooms.types";

const { Text, Title } = Typography;

export type FacilityOption = {
  id: string;
  name: string;
  code: string;
  address?: string;
  status?: string;
};

export type ValidatedRoomForm = {
  facilityId: string;
  input: Omit<CreateRoomInput, "facilityId">;
  roomType?: RoomType;
};

type RoomFormModalBaseProps = {
  mode: "create" | "edit";
  open: boolean;
  editingRoom?: ClinicRoom | null;
  facilities: FacilityOption[];
  defaultFacilityId?: string;
  onClose: () => void;
  onSubmitValidated: (
    value: ValidatedRoomForm,
  ) => Promise<string>;
};

function getErrorMessage(error: unknown) {
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

    const fields =
      response?.data?.errors?.fields;

    if (
      Array.isArray(fields) &&
      fields.length > 0
    ) {
      return fields.join(", ");
    }

    const message =
      response?.data?.message;

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
  values: RoomFormValues & {
    facilityId: string;
  },
  editingRoom: ClinicRoom,
) {
  return (
    values.roomName.trim() !==
      editingRoom.roomName ||
    values.roomTypeId !==
      editingRoom.roomTypeId ||
    values.floor.trim() !==
      editingRoom.floor ||
    values.status !==
      editingRoom.status
  );
}

type InternalRoomFormValues =
  RoomFormValues & {
    facilityId: string;
  };

export function RoomFormModalBase({
  mode,
  open,
  editingRoom = null,
  facilities,
  defaultFacilityId,
  onClose,
  onSubmitValidated,
}: RoomFormModalBaseProps) {
  const {
    message: messageApi,
    modal: modalApi,
  } = App.useApp();
  const [form] =
    Form.useForm<InternalRoomFormValues>();
  const [roomTypes, setRoomTypes] =
    useState<RoomType[]>([]);
  const [
    roomTypesLoading,
    setRoomTypesLoading,
  ] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);

  const roomName =
    Form.useWatch("roomName", form) ?? "";
  const roomTypeId =
    Form.useWatch("roomTypeId", form) ?? "";
  const floor =
    Form.useWatch("floor", form) ?? "";
  const status =
    Form.useWatch("status", form) ??
    "active";
  const facilityId =
    Form.useWatch("facilityId", form) ?? "";

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

  const facilityById = useMemo(
    () =>
      new Map(
        facilities.map((facility) => [
          facility.id,
          facility,
        ]),
      ),
    [facilities],
  );

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setError(null);
      setRoomTypesLoading(true);

      void getRoomTypeLookup({
        status: "active",
        limit: 30,
      })
        .then((data) => {
          const next = [...data];

          if (
            editingRoom?.roomTypeId &&
            !next.some(
              (item) =>
                item.id ===
                editingRoom.roomTypeId,
            )
          ) {
            next.push({
              id: editingRoom.roomTypeId,
              code:
                editingRoom.roomTypeCode,
              name:
                editingRoom.roomTypeName ||
                `Loại phòng #${editingRoom.roomTypeId}`,
              description:
                editingRoom.roomTypeDescription,
              status:
                editingRoom.roomTypeStatus,
              createdAt: "",
              updatedAt: "",
            });
          }

          setRoomTypes(next);
        })
        .catch((loadError) => {
          setError(
            getErrorMessage(loadError),
          );
          setRoomTypes([]);
        })
        .finally(() => {
          setRoomTypesLoading(false);
        });

      if (
        mode === "edit" &&
        editingRoom
      ) {
        form.setFieldsValue({
          facilityId:
            editingRoom.facilityId,
          roomName:
            editingRoom.roomName,
          roomTypeId:
            editingRoom.roomTypeId,
          floor: editingRoom.floor,
          status: editingRoom.status,
        });
        return;
      }

      form.resetFields();
      form.setFieldsValue({
        facilityId:
          defaultFacilityId ?? "",
        roomName: "",
        roomTypeId: "",
        floor: "",
        status: "active",
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    defaultFacilityId,
    editingRoom,
    form,
    mode,
    open,
  ]);

  async function handleFinish(
    values: InternalRoomFormValues,
  ) {
    setError(null);

    const facilityAllowed =
      facilities.some(
        (facility) =>
          String(
            facility.id,
          ) ===
          String(
            values.facilityId,
          ),
      );

    if (!facilityAllowed) {
      const message =
        "Bạn không có quyền quản lý phòng của cơ sở này.";

      setError(message);
      messageApi.error(message);
      return;
    }

    if (
      mode === "edit" &&
      editingRoom &&
      !hasChanges(values, editingRoom)
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
                "Xác nhận cập nhật phòng",
              content:
                "Bạn có chắc chắn muốn lưu các thay đổi của phòng này không?",
              okText:
                "Xác nhận cập nhật",
              cancelText:
                "Kiểm tra lại",
              onOk: () => finish(true),
              onCancel: () =>
                finish(false),
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
          input: {
            name:
              values.roomName.trim(),
            roomTypeId:
              values.roomTypeId.trim(),
            floor:
              values.floor.trim(),
            status: values.status,
          },
          roomType:
            roomTypeById.get(
              values.roomTypeId,
            ),
        });

      messageApi.success(
        successMessage,
      );
      form.resetFields();
      onClose();
    } catch (submitError) {
      const message =
        getErrorMessage(submitError);

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

  const selectedFacility =
    facilityById.get(facilityId);

  return (
    <Modal
      open={open}
      centered
      width={920}
      title={null}
      footer={null}
      onCancel={handleCancel}
      mask={{
        closable: !submitting,
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
          {mode === "edit"
            ? "Cập nhật phòng"
            : "Thêm phòng mới"}
        </Title>

        <Text className="text-sm text-slate-500">
          Chọn cơ sở, loại phòng, tầng và trạng thái.
        </Text>
      </div>

      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          closable
          className="mt-4"
          onClose={() => setError(null)}
        />
      ) : null}

      <Form<InternalRoomFormValues>
        form={form}
        layout="vertical"
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
                      Thông tin nhận diện và phân loại phòng.
                    </p>
                  </span>
                </Space>
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
                      disabled={
                        mode === "edit" ||
                        facilities.length === 1
                      }
                      placeholder="Chọn cơ sở"
                      options={facilities.map(
                        (facility) => ({
                          value:
                            facility.id,
                          label: `${facility.name} (${facility.code})`,
                        }),
                      )}
                    />
                  </Form.Item>
                </Col>

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
                      loading={
                        roomTypesLoading
                      }
                      placeholder="Chọn loại phòng"
                      options={roomTypes.map(
                        (roomType) => ({
                          value:
                            roomType.id,
                          label: `${roomType.name}${
                            roomType.code
                              ? ` (${roomType.code})`
                              : ""
                          }`,
                        }),
                      )}
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
                          "Tầng tối đa 50 ký tự.",
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
                          label:
                            "Hoạt động",
                        },
                        {
                          value:
                            "inactive",
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
          </div>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <DoorOpen className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="mb-0 truncate text-base font-semibold text-slate-950">
                  {roomName ||
                    editingRoom?.roomName ||
                    "Phòng mới"}
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
                  selectedFacility?.name ||
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
            {mode === "edit" ? (
              <Pencil className="mr-1 h-4 w-4" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}

            {mode === "edit"
              ? "Cập nhật phòng"
              : "Lưu phòng"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}