"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Typography,
} from "antd";
import {
  ClipboardCheck,
  Plus,
  Trash2,
} from "lucide-react";
import {
  bulkCreateRooms,
  confirmBulkCreateRooms,
  getRoomTypeLookup,
  previewBulkCreateRooms,
} from "@/management/features/rooms/rooms.api";
import type {
  BulkCreateRoomsPreviewInput,
  CreateRoomInput,
  RoomStatus,
  RoomType,
} from "@/management/features/rooms/rooms.types";
import type {
  FacilityOption,
} from "./room-form.shared";

const { Text, Title } = Typography;

type BulkMode = "preview" | "direct";

type BulkRoomRow = {
  facilityId: string;
  name: string;
  roomTypeId: string;
  floor: string;
  status: RoomStatus;
};

type BulkRoomFormValues = {
  mode: BulkMode;
  saveOnlyValid: boolean;
  rooms: BulkRoomRow[];
};

type RoomBulkCreateModalProps = {
  open: boolean;
  facilities: FacilityOption[];
  defaultFacilityId?: string;
  onClose: () => void;
  onCompleted: () => void;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const message = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
          };
        };
      }
    ).response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xử lý danh sách phòng.";
}

function stringifyPreview(value: unknown) {
  try {
    return JSON.stringify(
      value,
      null,
      2,
    );
  } catch {
    return String(value);
  }
}

export function RoomBulkCreateModal({
  open,
  facilities,
  defaultFacilityId,
  onClose,
  onCompleted,
}: RoomBulkCreateModalProps) {
  const { message: messageApi } =
    App.useApp();
  const [form] =
    Form.useForm<BulkRoomFormValues>();
  const [roomTypes, setRoomTypes] =
    useState<RoomType[]>([]);
  const [
    roomTypesLoading,
    setRoomTypesLoading,
  ] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [previewOpen, setPreviewOpen] =
    useState(false);
  const [
    previewResult,
    setPreviewResult,
  ] = useState<unknown>(null);
  const [
    pendingPreviewInput,
    setPendingPreviewInput,
  ] =
    useState<BulkCreateRoomsPreviewInput | null>(
      null,
    );
  const [error, setError] = useState<
    string | null
  >(null);

  const mode =
    Form.useWatch("mode", form) ??
    "preview";

  const roomTypeOptions = useMemo(
    () =>
      roomTypes.map((roomType) => ({
        value: roomType.id,
        label: `${roomType.name}${
          roomType.code
            ? ` (${roomType.code})`
            : ""
        }`,
      })),
    [roomTypes],
  );

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setError(null);
      setPreviewOpen(false);
      setPreviewResult(null);
      setPendingPreviewInput(null);
      setRoomTypesLoading(true);

      form.resetFields();
      form.setFieldsValue({
        mode: "preview",
        saveOnlyValid: true,
        rooms: [
          {
            facilityId:
              defaultFacilityId ?? "",
            name: "",
            roomTypeId: "",
            floor: "",
            status: "active",
          },
        ],
      });

      void getRoomTypeLookup({
        status: "active",
        limit: 100,
      })
        .then(setRoomTypes)
        .catch((loadError) => {
          setError(
            getErrorMessage(loadError),
          );
          setRoomTypes([]);
        })
        .finally(() => {
          setRoomTypesLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    defaultFacilityId,
    form,
    open,
  ]);

  function toInput(
    row: BulkRoomRow,
  ): CreateRoomInput {
    return {
      facilityId:
        row.facilityId.trim(),
      name: row.name.trim(),
      roomTypeId:
        row.roomTypeId.trim(),
      floor: row.floor.trim(),
      status: row.status,
    };
  }

  async function handleFinish(
    values: BulkRoomFormValues,
  ) {
    setError(null);

    const rooms =
      values.rooms.map(toInput);

    setSubmitting(true);

    try {
      if (values.mode === "direct") {
        const response =
          await bulkCreateRooms({
            rooms,
          });

        messageApi.success(
          response.message ||
            `Tạo thành công ${response.data.length} phòng.`,
        );

        form.resetFields();
        onCompleted();
        onClose();
        return;
      }

      const previewInput: BulkCreateRoomsPreviewInput =
        {
          rooms,
          saveOnlyValid:
            values.saveOnlyValid,
        };

      const response =
        await previewBulkCreateRooms(
          previewInput,
        );

      setPreviewResult(response.data);
      setPendingPreviewInput(
        previewInput,
      );
      setPreviewOpen(true);
      messageApi.success(
        response.message ||
          "Đã kiểm tra danh sách phòng.",
      );
    } catch (submitError) {
      const message =
        getErrorMessage(submitError);

      setError(message);
      messageApi.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmPreview() {
    if (!pendingPreviewInput) return;

    setSubmitting(true);

    try {
      const response =
        await confirmBulkCreateRooms(
          pendingPreviewInput,
        );

      messageApi.success(
        response.message ||
          "Đã lưu các phòng hợp lệ.",
      );

      setPreviewOpen(false);
      setPreviewResult(null);
      setPendingPreviewInput(null);
      form.resetFields();
      onCompleted();
      onClose();
    } catch (confirmError) {
      messageApi.error(
        getErrorMessage(confirmError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;

    form.resetFields();
    setError(null);
    setPreviewOpen(false);
    setPreviewResult(null);
    setPendingPreviewInput(null);
    onClose();
  }

  return (
    <>
      <Modal
        open={open}
        centered
        width={1080}
        title={null}
        okText={
          mode === "direct"
            ? "Tạo trực tiếp"
            : "Kiểm tra danh sách"
        }
        cancelText="Hủy"
        confirmLoading={submitting}
        onOk={() => form.submit()}
        onCancel={handleClose}
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
        <div className="mb-5 border-b border-slate-200 pb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ClipboardCheck className="h-5 w-5" />
            </span>

            <div>
              <Title
                level={4}
                className="!mb-1 !text-slate-950"
              >
                Tạo nhiều phòng
              </Title>

              <Text type="secondary">
                Có thể tạo trực tiếp hoặc xem trước rồi xác nhận lưu.
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

        <Form<BulkRoomFormValues>
          form={form}
          layout="vertical"
          onFinish={(values) =>
            void handleFinish(values)
          }
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="mode"
                label="Cách tạo"
              >
                <Radio.Group
                  options={[
                    {
                      value: "preview",
                      label:
                        "Xem trước và xác nhận",
                    },
                    {
                      value: "direct",
                      label:
                        "Tạo trực tiếp",
                    },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              {mode === "preview" ? (
                <Form.Item
                  name="saveOnlyValid"
                  valuePropName="checked"
                  label="Xử lý dữ liệu"
                >
                  <Checkbox>
                    Chỉ lưu các phòng hợp lệ
                  </Checkbox>
                </Form.Item>
              ) : null}
            </Col>
          </Row>

          <Form.List
            name="rooms"
            rules={[
              {
                validator: async (
                  _,
                  rooms: BulkRoomRow[],
                ) => {
                  if (
                    !rooms ||
                    rooms.length === 0
                  ) {
                    throw new Error(
                      "Cần ít nhất một phòng.",
                    );
                  }
                },
              },
            ]}
          >
            {(
              fields,
              { add, remove },
              { errors },
            ) => (
              <div className="flex flex-col gap-3">
                {fields.map(
                  (field, index) => (
                    <div
                      key={field.key}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Text strong>
                          Phòng {index + 1}
                        </Text>

                        {fields.length > 1 ? (
                          <Button
                            danger
                            type="text"
                            icon={
                              <Trash2 className="h-4 w-4" />
                            }
                            onClick={() =>
                              remove(
                                field.name,
                              )
                            }
                          >
                            Xóa dòng
                          </Button>
                        ) : null}
                      </div>

                      <Row gutter={[12, 0]}>
                        <Col
                          xs={24}
                          md={12}
                          xl={5}
                        >
                          <Form.Item
                            name={[
                              field.name,
                              "facilityId",
                            ]}
                            label="Cơ sở"
                            rules={[
                              {
                                required:
                                  true,
                                message:
                                  "Chọn cơ sở.",
                              },
                            ]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              options={facilities.map(
                                (
                                  facility,
                                ) => ({
                                  value:
                                    facility.id,
                                  label:
                                    facility.name,
                                }),
                              )}
                            />
                          </Form.Item>
                        </Col>

                        <Col
                          xs={24}
                          md={12}
                          xl={5}
                        >
                          <Form.Item
                            name={[
                              field.name,
                              "name",
                            ]}
                            label="Tên phòng"
                            rules={[
                              {
                                required:
                                  true,
                                whitespace:
                                  true,
                                message:
                                  "Nhập tên phòng.",
                              },
                            ]}
                          >
                            <Input placeholder="Phòng khám thai 201" />
                          </Form.Item>
                        </Col>

                        <Col
                          xs={24}
                          md={12}
                          xl={5}
                        >
                          <Form.Item
                            name={[
                              field.name,
                              "roomTypeId",
                            ]}
                            label="Loại phòng"
                            rules={[
                              {
                                required:
                                  true,
                                message:
                                  "Chọn loại phòng.",
                              },
                            ]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              loading={
                                roomTypesLoading
                              }
                              options={
                                roomTypeOptions
                              }
                            />
                          </Form.Item>
                        </Col>

                        <Col
                          xs={24}
                          md={12}
                          xl={4}
                        >
                          <Form.Item
                            name={[
                              field.name,
                              "floor",
                            ]}
                            label="Tầng"
                            rules={[
                              {
                                required:
                                  true,
                                whitespace:
                                  true,
                                message:
                                  "Nhập tầng.",
                              },
                            ]}
                          >
                            <Input placeholder="Tầng 2" />
                          </Form.Item>
                        </Col>

                        <Col
                          xs={24}
                          md={12}
                          xl={5}
                        >
                          <Form.Item
                            name={[
                              field.name,
                              "status",
                            ]}
                            label="Trạng thái"
                            rules={[
                              {
                                required:
                                  true,
                                message:
                                  "Chọn trạng thái.",
                              },
                            ]}
                          >
                            <Select
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
                                    "Ngừng hoạt động",
                                },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  ),
                )}

                <Button
                  type="dashed"
                  block
                  size="large"
                  icon={
                    <Plus className="h-4 w-4" />
                  }
                  onClick={() =>
                    add({
                      facilityId:
                        defaultFacilityId ??
                        "",
                      name: "",
                      roomTypeId: "",
                      floor: "",
                      status: "active",
                    })
                  }
                >
                  Thêm phòng
                </Button>

                <Form.ErrorList
                  errors={errors}
                />
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        open={previewOpen}
        centered
        width={820}
        title="Kết quả xem trước"
        okText="Xác nhận và lưu"
        cancelText="Quay lại chỉnh sửa"
        confirmLoading={submitting}
        onOk={() =>
          void handleConfirmPreview()
        }
        onCancel={() =>
          setPreviewOpen(false)
        }
        mask={{
          closable: !submitting,
        }}
      >
        <Alert
          type="info"
          showIcon
          title="Dữ liệu dưới đây là kết quả do backend trả về."
          description="Kiểm tra kết quả trước khi xác nhận lưu các phòng hợp lệ."
          className="mb-4"
        />

        <pre className="max-h-[440px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {stringifyPreview(
            previewResult,
          )}
        </pre>
      </Modal>
    </>
  );
}