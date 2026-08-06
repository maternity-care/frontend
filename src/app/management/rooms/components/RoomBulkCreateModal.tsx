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
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Typography,
} from "antd";
import type {
  FormProps,
} from "antd";
import {
  DoorOpen,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createRoom,
  getRoomTypeLookup,
} from "@/management/features/rooms/rooms.api";
import type {
  CreateRoomInput,
  RoomStatus,
  RoomType,
} from "@/management/features/rooms/rooms.types";
import type {
  FacilityOption,
} from "./room-form.shared";

const { Text, Title } = Typography;

type BulkRoomField =
  | "facilityId"
  | "name"
  | "roomTypeId"
  | "floor"
  | "status";

type BulkRoomRow = {
  facilityId: string;
  name: string;
  roomTypeId: string;
  floor: string;
  status: RoomStatus;
};

type BulkRoomFormValues = {
  rooms: BulkRoomRow[];
};

type BulkRoomFieldPath =
  | ["rooms", number, "facilityId"]
  | ["rooms", number, "name"]
  | ["rooms", number, "roomTypeId"]
  | ["rooms", number, "floor"]
  | ["rooms", number, "status"];

function getRoomFieldPath(
  rowIndex: number,
  field: BulkRoomField,
): BulkRoomFieldPath {
  switch (field) {
    case "facilityId":
      return [
        "rooms",
        rowIndex,
        "facilityId",
      ];
    case "name":
      return [
        "rooms",
        rowIndex,
        "name",
      ];
    case "roomTypeId":
      return [
        "rooms",
        rowIndex,
        "roomTypeId",
      ];
    case "floor":
      return [
        "rooms",
        rowIndex,
        "floor",
      ];
    case "status":
      return [
        "rooms",
        rowIndex,
        "status",
      ];
  }
}

type BackendFieldIssue = {
  rowIndex: number;
  field: BulkRoomField;
  message: string;
};
type RoomCreateFailure = {
  originalIndex: number;
  room: BulkRoomRow;
  facilityName: string;
  message: string;
};


type RoomBulkCreateModalProps = {
  open: boolean;
  facilities: FacilityOption[];
  defaultFacilityId?: string;
  onClose: () => void;
  onCompleted: () => void;
};

const FIELD_LABELS: Record<
  BulkRoomField,
  string
> = {
  facilityId: "Cơ sở",
  name: "Tên phòng",
  roomTypeId: "Loại phòng",
  floor: "Tầng",
  status: "Trạng thái",
};

const FIELD_KEYS: BulkRoomField[] = [
  "facilityId",
  "name",
  "roomTypeId",
  "floor",
  "status",
];

function getResponseData(
  error: unknown,
): Record<string, unknown> | null {
  if (
    !error ||
    typeof error !== "object" ||
    !("response" in error)
  ) {
    return null;
  }

  const data = (
    error as {
      response?: {
        data?: unknown;
      };
    }
  ).response?.data;

  return data &&
    typeof data === "object" &&
    !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null;
}

function collectMessages(
  value: unknown,
): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectMessages);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.entries(
      value as Record<string, unknown>,
    ).flatMap(([key, item]) => {
      const nested = collectMessages(item);

      return nested.map((message) =>
        message.includes(key)
          ? message
          : `${key}: ${message}`,
      );
    });
  }

  return [];
}

function getBackendMessages(
  error: unknown,
): string[] {
  const data = getResponseData(error);

  if (data) {
    const errors = data.errors;
    const messages = [
      ...collectMessages(errors),
      ...collectMessages(data.message),
    ];

    if (messages.length > 0) {
      return Array.from(new Set(messages));
    }
  }

  if (error instanceof Error) {
    return [error.message];
  }

  return [
    "Không thể tạo danh sách phòng.",
  ];
}

function detectField(
  message: string,
): BulkRoomField | null {
  const normalized =
    message.toLowerCase();

  if (
    /facilityid|facility_id|cơ sở/.test(
      normalized,
    )
  ) {
    return "facilityId";
  }

  if (
    /roomtypeid|room_type_id|loại phòng/.test(
      normalized,
    )
  ) {
    return "roomTypeId";
  }

  if (/floor|tầng/.test(normalized)) {
    return "floor";
  }

  if (
    /status|trạng thái/.test(normalized)
  ) {
    return "status";
  }

  if (
    /(?:^|[.\s:_-])name(?:$|[.\s:_-])|tên phòng/.test(
      normalized,
    )
  ) {
    return "name";
  }

  return null;
}

function detectRowIndex(
  message: string,
  roomCount: number,
): number | null {
  const normalized = message.replace(
    /\[(\d+)\]/g,
    ".$1",
  );

  const pathMatch = normalized.match(
    /(?:rooms?|items?)\.(\d+)(?:\.|:|\s)/i,
  );

  if (pathMatch) {
    const index = Number(pathMatch[1]);

    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < roomCount
    ) {
      return index;
    }
  }

  const vietnameseMatch =
    message.match(/phòng\s+(\d+)/i);

  if (vietnameseMatch) {
    const index =
      Number(vietnameseMatch[1]) - 1;

    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index < roomCount
    ) {
      return index;
    }
  }

  return roomCount === 1 ? 0 : null;
}

function parseBackendIssues(
  messages: string[],
  roomCount: number,
): {
  fieldIssues: BackendFieldIssue[];
  generalMessages: string[];
} {
  const fieldIssues: BackendFieldIssue[] =
    [];
  const generalMessages: string[] = [];

  for (const message of messages) {
    const field = detectField(message);
    const rowIndex = detectRowIndex(
      message,
      roomCount,
    );

    if (field && rowIndex !== null) {
      fieldIssues.push({
        rowIndex,
        field,
        message,
      });
      continue;
    }

    generalMessages.push(message);
  }

  return {
    fieldIssues,
    generalMessages,
  };
}

function formatIssue(
  issue: BackendFieldIssue,
) {
  return `Phòng ${issue.rowIndex + 1} - ${
    FIELD_LABELS[issue.field]
  }: ${issue.message}`;
}

function buildContextualRoomError(
  failure: RoomCreateFailure,
) {
  const facilityName =
    failure.facilityName ||
    failure.room.facilityId ||
    "Cơ sở đã chọn";
  const roomName =
    failure.room.name.trim() ||
    "phòng chưa đặt tên";
  const backendMessage =
    failure.message.trim();

  const normalizedMessage =
    backendMessage.toLowerCase();

  const isDuplicateError =
    normalizedMessage.includes(
      "đã tồn tại",
    ) ||
    normalizedMessage.includes(
      "already exists",
    ) ||
    normalizedMessage.includes(
      "duplicate",
    );

  if (isDuplicateError) {
    return `${facilityName} đã tồn tại phòng ${roomName}.`;
  }

  return `Không thể tạo phòng ${roomName} tại ${facilityName}: ${backendMessage}`;
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
  const [error, setError] = useState<
    string | null
  >(null);
  const [failures, setFailures] =
    useState<RoomCreateFailure[]>([]);

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

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setError(null);
      setFailures([]);
      setRoomTypesLoading(true);

      form.resetFields();
      form.setFieldsValue({
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
        limit: 30,
      })
        .then((data) => {
          if (!cancelled) {
            setRoomTypes(data);
          }
        })
        .catch((loadError) => {
          if (!cancelled) {
            const message =
              getBackendMessages(
                loadError,
              ).join(", ");

            setError(message);
            setRoomTypes([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setRoomTypesLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
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

  function clearBackendFieldErrors(
    roomCount: number,
  ) {
    const fields: Parameters<
      typeof form.setFields
    >[0] = [];

    for (
      let rowIndex = 0;
      rowIndex < roomCount;
      rowIndex += 1
    ) {
      for (const field of FIELD_KEYS) {
        fields.push({
          name: getRoomFieldPath(
            rowIndex,
            field,
          ),
          errors: [],
        });
      }
    }

    form.setFields(fields);
  }

  async function handleFinish(
    values: BulkRoomFormValues,
  ) {
    setError(null);
    setFailures([]);
    clearBackendFieldErrors(
      values.rooms.length,
    );
    setSubmitting(true);

    const submittedRooms =
      values.rooms.map(toInput);

    try {
      const results =
        await Promise.allSettled(
          submittedRooms.map((room) =>
            createRoom(room),
          ),
        );

      const nextFailures: RoomCreateFailure[] =
        [];
      const successfulIndexes: number[] =
        [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulIndexes.push(index);
          return;
        }

        const room = values.rooms[index];
        const facility =
          facilityById.get(
            room.facilityId,
          );
        const messages =
          getBackendMessages(
            result.reason,
          );
        const message =
          messages.join(", ") ||
          "Không thể tạo phòng.";

        nextFailures.push({
          originalIndex: index,
          room,
          facilityName:
            facility?.name ||
            room.facilityId,
          message,
        });
      });

      if (nextFailures.length === 0) {
        messageApi.success(
          `Tạo thành công ${successfulIndexes.length} phòng.`,
        );

        form.resetFields();
        onCompleted();
        onClose();
        return;
      }

      const failedRows =
        nextFailures.map(
          (failure) => failure.room,
        );

      form.setFieldsValue({
        rooms: failedRows,
      });

      const failedFieldData: Parameters<
        typeof form.setFields
      >[0] = nextFailures.map(
        (failure, failedIndex) => ({
          name: getRoomFieldPath(
            failedIndex,
            "name",
          ),
          errors: [
            buildContextualRoomError(
              failure,
            ),
          ],
        }),
      );

      form.setFields(failedFieldData);
      setFailures(nextFailures);

      const summary =
        successfulIndexes.length > 0
          ? `Đã tạo ${successfulIndexes.length} phòng. Còn ${nextFailures.length} phòng bị lỗi.`
          : `Có ${nextFailures.length} phòng không thể tạo.`;

      setError(summary);

      if (successfulIndexes.length > 0) {
        onCompleted();
      }

      messageApi.error(summary);

      form.scrollToField(
        getRoomFieldPath(0, "name"),
        {
          block: "center",
        },
      );
    } finally {
      setSubmitting(false);
    }
  }

  const handleFinishFailed: FormProps<
    BulkRoomFormValues
  >["onFinishFailed"] = ({
    errorFields,
  }) => {
    const firstError = errorFields[0];

    if (!firstError) return;

    form.scrollToField(firstError.name, {
      block: "center",
    });

    const [
      collectionName,
      rowIndex,
      field,
    ] = firstError.name;

    const isRoomField =
      collectionName === "rooms" &&
      typeof rowIndex === "number" &&
      typeof field === "string" &&
      FIELD_KEYS.includes(
        field as BulkRoomField,
      );

    if (isRoomField) {
      const typedField =
        field as BulkRoomField;
      const message = String(
        firstError.errors[0] ??
          "Dữ liệu không hợp lệ.",
      );

      setError(
        `Phòng ${rowIndex + 1} - ${
          FIELD_LABELS[typedField]
        }: ${message}`,
      );
      return;
    }

    setError(
      String(
        firstError.errors[0] ??
          "Vui lòng kiểm tra lại dữ liệu.",
      ),
    );
  };

  function handleClose() {
    if (submitting) return;

    form.resetFields();
    setError(null);
    setFailures([]);
    onClose();
  }

  return (
    <Modal
      open={open}
      centered
      width={1080}
      title={null}
      okText="Tạo phòng"
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
            <DoorOpen className="h-5 w-5" />
          </span>

          <div>
            <Title
              level={4}
              className="!mb-1 !text-slate-950"
            >
              Thêm phòng
            </Title>

            <Text type="secondary">
              Nhập phòng và bấm Tạo phòng để lưu trực tiếp.
            </Text>
          </div>
        </div>
      </div>

      {error ? (
        <Alert
          type="error"
          title="Không thể tạo phòng"
          description={
            <div className="space-y-3">
              <p className="mb-0">
                {error}
              </p>

              {failures.map(
                (failure) => (
                  <div
                    key={`${failure.originalIndex}-${failure.room.facilityId}-${failure.room.name}`}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700"
                  >
                    {buildContextualRoomError(
                      failure,
                    )}
                  </div>
                ),
              )}
            </div>
          }
          showIcon
          closable
          className="mb-4"
          onClose={() => {
            setError(null);
            setFailures([]);
          }}
        />
      ) : null}

      <Form<BulkRoomFormValues>
        form={form}
        layout="vertical"
        onFinish={(values) =>
          void handleFinish(values)
        }
        onFinishFailed={
          handleFinishFailed
        }
      >
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
                                "Vui lòng chọn cơ sở.",
                            },
                          ]}
                        >
                          <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Chọn cơ sở"
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
                                "Vui lòng nhập tên phòng.",
                            },
                            {
                              max: 120,
                              message:
                                "Tên phòng tối đa 120 ký tự.",
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
                                "Vui lòng nhập tầng.",
                            },
                            {
                              max: 50,
                              message:
                                "Tầng tối đa 50 ký tự.",
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
                                "Vui lòng chọn trạng thái.",
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
  );
}