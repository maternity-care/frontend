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
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import {
  DoorOpen,
  Pencil,
  X,
} from "lucide-react";
import {
  getRoomById,
  reactivateRoom,
  suspendRoom,
  updateRoom,
} from "@/management/features/rooms/rooms.api";
import {
  ROOM_STATUS_OPTIONS,
} from "@/management/features/rooms/rooms.constants";
import type {
  ClinicRoom,
  RoomFacilityOption,
  RoomStatus,
  RoomType,
} from "@/management/features/rooms/rooms.types";
import {
  getRoomErrorMessage,
  mergeRoomFallback,
  toRoomIsoDateTime,
} from "@/management/features/rooms/rooms.utils";
import {
  RoomPreview,
} from "./RoomPreview";

const {
  Text,
  Title,
} = Typography;
const { TextArea } = Input;

type RoomEditFormValues = {
  facilityId: string;
  roomName: string;
  roomTypeId: string;
  floor: string;
  status: RoomStatus;
  suspendReason?: string;
  suspendUntil?: string;
};

type Props = {
  open: boolean;
  room: ClinicRoom | null;
  facilities: RoomFacilityOption[];
  roomTypes: RoomType[];
  onClose: () => void;
  onUpdated: (
    room: ClinicRoom,
  ) => void;
};

function hasInformationChanges(
  values: RoomEditFormValues,
  room: ClinicRoom,
) {
  return (
    values.roomName.trim() !==
      room.roomName ||
    values.roomTypeId !==
      room.roomTypeId ||
    values.floor.trim() !==
      room.floor
  );
}

export function RoomEditModal({
  open,
  room,
  facilities,
  roomTypes,
  onClose,
  onUpdated,
}: Props) {
  const {
    message: messageApi,
    modal: modalApi,
  } = App.useApp();

  const [form] =
    Form.useForm<RoomEditFormValues>();
  const [
    submitting,
    setSubmitting,
  ] = useState(false);
  const [error, setError] =
    useState<string | null>(
      null,
    );

  const roomName =
    Form.useWatch(
      "roomName",
      form,
    );
  const roomTypeId =
    Form.useWatch(
      "roomTypeId",
      form,
    );
  const floor =
    Form.useWatch(
      "floor",
      form,
    );
  const status =
    Form.useWatch(
      "status",
      form,
    );

  const roomTypeOptions =
    useMemo(() => {
      if (!room) {
        return roomTypes;
      }

      if (
        roomTypes.some(
          (item) =>
            item.id ===
            room.roomTypeId,
        )
      ) {
        return roomTypes;
      }

      return [
        ...roomTypes,
        {
          id:
            room.roomTypeId,
          code:
            room.roomTypeCode,
          name:
            room.roomTypeName ||
            `Loại phòng #${room.roomTypeId}`,
          description:
            room.roomTypeDescription,
          status:
            room.roomTypeStatus,
          createdAt: "",
          updatedAt: "",
        },
      ];
    }, [
      room,
      roomTypes,
    ]);

  const selectedRoomType =
    roomTypeOptions.find(
      (item) =>
        item.id ===
        roomTypeId,
    );

  const selectedFacility =
    facilities.find(
      (facility) =>
        facility.id ===
        room?.facilityId,
    );

  const statusChanged =
    Boolean(
      room &&
        status &&
        status !==
          room.status,
    );

  useEffect(() => {
    if (
      !open ||
      !room
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setError(null);
          form.setFieldsValue({
            facilityId:
              room.facilityId,
            roomName:
              room.roomName,
            roomTypeId:
              room.roomTypeId,
            floor:
              room.floor,
            status:
              room.status,
            suspendReason:
              "",
            suspendUntil:
              "",
          });
        },
        0,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    form,
    open,
    room,
  ]);

  function handleClose() {
    if (submitting) {
      return;
    }

    form.resetFields();
    setError(null);
    onClose();
  }

  async function handleFinish(
    values: RoomEditFormValues,
  ) {
    if (!room) {
      return;
    }

    const informationChanged =
      hasInformationChanges(
        values,
        room,
      );
    const nextStatusChanged =
      values.status !==
      room.status;

    if (
      !informationChanged &&
      !nextStatusChanged
    ) {
      modalApi.info({
        centered: true,
        title:
          "Không có gì thay đổi",
        content:
          "Thông tin phòng hiện tại giống dữ liệu ban đầu.",
        okText: "Đóng",
      });
      return;
    }

    const confirmed =
      await new Promise<boolean>(
        (resolve) => {
          let resolved = false;

          const finish = (
            result: boolean,
          ) => {
            if (resolved) {
              return;
            }

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
              nextStatusChanged
                ? values.status ===
                  "inactive"
                  ? "Phòng sẽ được tạm ngưng. Các ca trực/lịch hẹn bị ảnh hưởng sẽ được backend xử lý theo nghiệp vụ hiện tại."
                  : "Phòng sẽ được mở lại. Các ca trực đã bị hủy trước đó sẽ không tự khôi phục."
                : "Bạn có chắc chắn muốn lưu các thay đổi của phòng này không?",
            okText:
              "Xác nhận cập nhật",
            cancelText:
              "Kiểm tra lại",
            onOk: () =>
              finish(true),
            onCancel: () =>
              finish(false),
          });
        },
      );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let nextRoom =
        mergeRoomFallback(
          room,
          {
            roomName:
              values.roomName,
            roomTypeId:
              values.roomTypeId,
            roomTypeName:
              selectedRoomType?.name,
            roomTypeCode:
              selectedRoomType?.code,
            roomTypeDescription:
              selectedRoomType?.description,
            roomTypeStatus:
              selectedRoomType?.status,
            floor:
              values.floor,
            status:
              values.status,
          },
        );

      if (
        informationChanged
      ) {
        await updateRoom(
          room.id,
          {
            name:
              values.roomName.trim(),
            roomTypeId:
              values.roomTypeId.trim(),
            floor:
              values.floor.trim(),
          },
        );
      }

      let statusMessage = "";

      if (
        nextStatusChanged
      ) {
        if (
          values.status ===
          "inactive"
        ) {
          const response =
            await suspendRoom(
              room.id,
              {
                inactiveUntil:
                  toRoomIsoDateTime(
                    values.suspendUntil,
                  ),
                reason:
                  values.suspendReason,
              },
            );

          nextRoom =
            response.data.room;

          statusMessage =
            ` Ca trực bị hủy: ${
              response.data
                .impact
                .cancelledShifts ??
              0
            }; lịch hẹn bị ảnh hưởng: ${
              response.data
                .impact
                .affectedAppointments ??
              0
            }.`;
        } else {
          const response =
            await reactivateRoom(
              room.id,
            );

          nextRoom =
            response.data.room;
          statusMessage =
            " Phòng đã được mở lại.";
        }
      }

      try {
        nextRoom =
          await getRoomById(
            room.id,
          );
      } catch {
      }

      onUpdated(nextRoom);
      form.resetFields();
      onClose();

      messageApi.success(
        `Cập nhật phòng thành công.${statusMessage}`,
      );
    } catch (submitError) {
      const message =
        getRoomErrorMessage(
          submitError,
          "Không thể cập nhật phòng.",
        );

      setError(message);
      messageApi.error(
        message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!room) {
    return null;
  }

  return (
    <Modal
      open={open}
      centered
      width={920}
      title={null}
      footer={null}
      onCancel={
        handleClose
      }
      mask={{
        closable:
          !submitting,
      }}
      destroyOnHidden
      styles={{
        body: {
          maxHeight:
            "76vh",
          overflowY:
            "auto",
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
          Cập nhật phòng
        </Title>

        <Text className="text-sm text-slate-500">
          Cập nhật thông tin và
          trạng thái hoạt động của
          phòng.
        </Text>
      </div>

      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          closable
          className="mt-4"
          onClose={() =>
            setError(null)
          }
        />
      ) : null}

      <Form<RoomEditFormValues>
        form={form}
        layout="vertical"
        onFinish={(values) =>
          void handleFinish(
            values,
          )
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
                      Thông tin nhận diện,
                      phân loại và trạng
                      thái phòng.
                    </p>
                  </span>
                </Space>
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
                  >
                    <Select
                      disabled
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

                <Col
                  xs={24}
                  md={12}
                >
                  <Form.Item
                    name="roomName"
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
                    <Input placeholder="Ví dụ: Phòng khám thai 201" />
                  </Form.Item>
                </Col>

                <Col
                  xs={24}
                  md={12}
                >
                  <Form.Item
                    name="roomTypeId"
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
                      placeholder="Chọn loại phòng"
                      options={roomTypeOptions.map(
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

                <Col
                  xs={24}
                  md={12}
                >
                  <Form.Item
                    name="floor"
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
                    <Input placeholder="Ví dụ: Tầng 2" />
                  </Form.Item>
                </Col>

                <Col
                  xs={24}
                  md={12}
                >
                  <Form.Item
                    name="status"
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
                      options={
                        ROOM_STATUS_OPTIONS
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              {selectedRoomType
                ?.description ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  {
                    selectedRoomType.description
                  }
                </div>
              ) : null}

              {statusChanged ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  {status ===
                  "inactive" ? (
                    <div>
                      <Text strong>
                        Tạm ngưng phòng
                      </Text>
                      <Text
                        type="secondary"
                        className="mt-1 block text-xs"
                      >
                        Có thể nhập lý do
                        và thời điểm mở
                        lại dự kiến.
                      </Text>

                      <Form.Item
                        name="suspendReason"
                        label="Lý do"
                        className="!mb-3 !mt-4"
                      >
                        <TextArea
                          rows={3}
                          disabled={
                            submitting
                          }
                          placeholder="Ví dụ: Bảo trì phòng"
                        />
                      </Form.Item>

                      <Form.Item
                        name="suspendUntil"
                        label="Tạm ngưng đến"
                        className="!mb-0"
                      >
                        <Input
                          type="datetime-local"
                          disabled={
                            submitting
                          }
                        />
                      </Form.Item>
                    </div>
                  ) : (
                    <div>
                      <Text strong>
                        Mở lại phòng
                      </Text>
                      <Text
                        type="secondary"
                        className="mt-1 block"
                      >
                        Khi lưu, phòng sẽ
                        chuyển về trạng
                        thái hoạt động.
                        Các ca trực đã hủy
                        trước đó không tự
                        khôi phục.
                      </Text>
                    </div>
                  )}
                </div>
              ) : null}
            </Card>
          </div>

          <RoomPreview
            room={room}
            roomName={
              roomName
            }
            floor={floor}
            status={status}
            selectedRoomType={
              selectedRoomType
            }
            selectedFacility={
              selectedFacility
            }
          />
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button
            onClick={
              handleClose
            }
            disabled={
              submitting
            }
          >
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={
              submitting
            }
          >
            <Pencil className="mr-1 h-4 w-4" />
            Cập nhật phòng
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
