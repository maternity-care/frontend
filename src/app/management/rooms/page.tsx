"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ColumnsType,
} from "antd/es/table";
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Modal,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Building2,
  DoorOpen,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { TableFilter } from "@/management/components/ui/TableFilter";
import {
  createRoom,
  deleteRoom,
  deleteRooms,
  getRoomById,
  getRooms,
  getRoomsByFacility,
  getRoomTypeLookup,
  updateRoom,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
  RoomFormValues,
  RoomStatus,
  RoomType,
} from "@/management/features/rooms/rooms.types";
import { ClinicRoomFormModal } from "./components/ClinicRoomFormModal";

const { Text, Title } = Typography;
const { TextArea } = Input;

type DeleteConfirmState =
  | {
      open: false;
    }
  | {
      open: true;
      mode: "single";
      room: ClinicRoom;
    }
  | {
      open: true;
      mode: "selected";
      ids: string[];
      count: number;
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

function formatDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function renderStatus(
  status: RoomStatus,
) {
  return status === "active" ? (
    <Tag color="green">Hoạt động</Tag>
  ) : (
    <Tag>Ngừng hoạt động</Tag>
  );
}

function ClinicRoomManagementContent() {
  const searchParams = useSearchParams();
  const {
    message: messageApi,
    modal: modalApi,
  } = App.useApp();

  const facilityIdFromQuery =
    searchParams.get("facilityId");
  const facilityNameFromQuery =
    searchParams.get("facilityName");
  const sessionFacilityId = useAuthStore(
    (state) => state.activeFacilityId,
  );

  const activeFacilityId =
    facilityIdFromQuery ||
    sessionFacilityId ||
    undefined;
  const isFacilityFiltered = Boolean(
    activeFacilityId,
  );

  const [rooms, setRooms] = useState<
    ClinicRoom[]
  >([]);
  const [roomTypes, setRoomTypes] =
    useState<RoomType[]>([]);

  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] =
    useState<string>();
  const [floorFilter, setFloorFilter] =
    useState<string>();
  const [
    roomTypeIdFilter,
    setRoomTypeIdFilter,
  ] = useState<string>();
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<RoomStatus>();

  const [currentPage, setCurrentPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState(20);
  const [totalRooms, setTotalRooms] =
    useState(0);
  const [
    selectedRoomIds,
    setSelectedRoomIds,
  ] = useState<string[]>([]);

  const [
    roomModalOpen,
    setRoomModalOpen,
  ] = useState(false);
  const [editingRoom, setEditingRoom] =
    useState<ClinicRoom | null>(null);
  const [detailRoom, setDetailRoom] =
    useState<ClinicRoom | null>(null);

  const [
    deleteConfirm,
    setDeleteConfirm,
  ] = useState<DeleteConfirmState>({
    open: false,
  });
  const [
    deleteReason,
    setDeleteReason,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);
  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);
  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);
  const [error, setError] = useState<
    string | null
  >(null);
  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void getRoomTypeLookup({
        status: "active",
        limit: 100,
      })
        .then((data) => {
          if (!cancelled) {
            setRoomTypes(data);
          }
        })
        .catch((loadError) => {
          if (!cancelled) {
            setError(
              getErrorMessage(loadError),
            );
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);

        try {
          const params = {
            search: searchQuery,
            floor: floorFilter,
            roomTypeId:
              roomTypeIdFilter,
            status: statusFilter,
            page: currentPage,
            limit: pageSize,
          };

          const result =
            isFacilityFiltered &&
            activeFacilityId
              ? await getRoomsByFacility(
                  activeFacilityId,
                  params,
                )
              : await getRooms(params);

          if (cancelled) return;

          setRooms(result.items);
          setTotalRooms(result.total);
          setSelectedRoomIds([]);
          setError(null);
        } catch (loadError) {
          if (cancelled) return;

          setError(
            getErrorMessage(loadError),
          );
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    activeFacilityId,
    currentPage,
    floorFilter,
    isFacilityFiltered,
    pageSize,
    reloadKey,
    roomTypeIdFilter,
    searchQuery,
    statusFilter,
  ]);

  const activeRoomsOnPage = rooms.filter(
    (room) => room.status === "active",
  ).length;

  const inactiveRoomsOnPage =
    rooms.length - activeRoomsOnPage;

  const roomTypeOptions = useMemo(
    () =>
      roomTypes.map((roomType) => ({
        value: roomType.id,
        label: roomType.name,
      })),
    [roomTypes],
  );

  function refreshRooms() {
    setReloadKey(
      (current) => current + 1,
    );
  }

  function openCreateModal() {
    if (!activeFacilityId) {
      modalApi.warning({
        centered: true,
        title: "Chưa chọn cơ sở",
        content:
          "Vui lòng chọn cơ sở trước khi thêm phòng mới.",
        okText: "Đóng",
      });
      return;
    }

    setEditingRoom(null);
    setRoomModalOpen(true);
  }

  function openEditModal(
    room: ClinicRoom,
  ) {
    setEditingRoom(room);
    setRoomModalOpen(true);
  }

  function closeRoomModal() {
    setRoomModalOpen(false);
    setEditingRoom(null);
  }

  async function openDetailModal(
    room: ClinicRoom,
  ) {
    setDetailRoom(room);
    setDetailLoading(true);

    try {
      const detail = await getRoomById(
        room.id,
      );

      setDetailRoom(detail);
    } catch (detailError) {
      const message =
        getErrorMessage(detailError);

      setError(message);
      messageApi.error(message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSubmitRoom(
    values: RoomFormValues,
  ) {
    setError(null);

    if (editingRoom) {
      try {
        const response = await updateRoom(
          editingRoom.id,
          {
            name: values.roomName,
            roomTypeId:
              values.roomTypeId,
            floor: values.floor,
            status: values.status,
          },
        );

        let updatedRoom = {
          ...editingRoom,
          ...response.data,
        };

        try {
          updatedRoom =
            await getRoomById(
              response.data.id ||
                editingRoom.id,
            );
        } catch {
          // Giữ dữ liệu PATCH khi endpoint chi tiết
          // chưa phản hồi ngay sau cập nhật.
        }

        setDetailRoom((current) =>
          current?.id === updatedRoom.id
            ? updatedRoom
            : current,
        );

        closeRoomModal();
        refreshRooms();
        messageApi.success(
          response.message ||
            "Cập nhật phòng thành công.",
        );
        return;
      } catch (updateError) {
        const message =
          getErrorMessage(updateError);

        setError(message);
        messageApi.error(message);
        throw updateError;
      }
    }

    if (!activeFacilityId) {
      const noFacilityError = new Error(
        "Vui lòng chọn cơ sở trước khi thêm phòng.",
      );

      setError(noFacilityError.message);
      messageApi.error(
        noFacilityError.message,
      );
      throw noFacilityError;
    }

    try {
      const response = await createRoom({
        facilityId: activeFacilityId,
        name: values.roomName,
        roomTypeId: values.roomTypeId,
        floor: values.floor,
        status: values.status,
      });

      closeRoomModal();
      setCurrentPage(1);
      refreshRooms();
      messageApi.success(
        response.message ||
          "Tạo phòng thành công.",
      );
    } catch (createError) {
      const message =
        getErrorMessage(createError);

      setError(message);
      messageApi.error(message);
      throw createError;
    }
  }

  function confirmDeleteRoom(
    room: ClinicRoom,
  ) {
    setDeleteReason("");
    setDeleteConfirm({
      open: true,
      mode: "single",
      room,
    });
  }

  function confirmDeleteSelected() {
    if (selectedRoomIds.length === 0) {
      return;
    }

    setDeleteReason("");
    setDeleteConfirm({
      open: true,
      mode: "selected",
      ids: selectedRoomIds,
      count: selectedRoomIds.length,
    });
  }

  function closeDeleteConfirm() {
    if (deleteLoading) return;

    setDeleteReason("");
    setDeleteConfirm({
      open: false,
    });
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm.open) return;

    const reason =
      deleteReason.trim();

    if (!reason) {
      messageApi.warning(
        "Vui lòng nhập lý do xóa phòng.",
      );
      return;
    }

    setDeleteLoading(true);
    setError(null);

    try {
      if (
        deleteConfirm.mode === "single"
      ) {
        await deleteRoom(
          deleteConfirm.room.id,
          reason,
        );
      } else {
        await deleteRooms(
          deleteConfirm.ids,
          reason,
        );
      }

      const deletedCount =
        deleteConfirm.mode === "single"
          ? 1
          : deleteConfirm.count;

      setDetailRoom((current) => {
        if (!current) return current;

        if (
          deleteConfirm.mode === "single"
        ) {
          return current.id ===
            deleteConfirm.room.id
            ? null
            : current;
        }

        return deleteConfirm.ids.includes(
          current.id,
        )
          ? null
          : current;
      });

      setDeleteConfirm({
        open: false,
      });
      setDeleteReason("");
      setSelectedRoomIds([]);

      if (
        rooms.length <= deletedCount &&
        currentPage > 1
      ) {
        setCurrentPage(
          (current) =>
            Math.max(1, current - 1),
        );
      } else {
        refreshRooms();
      }

      messageApi.success(
        deletedCount > 1
          ? `Đã xóa ${deletedCount} phòng.`
          : "Xóa phòng thành công.",
      );
    } catch (deleteError) {
      const message =
        getErrorMessage(deleteError);

      setError(message);
      messageApi.error(message);
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnsType<ClinicRoom> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (
        _value,
        _record,
        index,
      ) =>
        (currentPage - 1) *
          pageSize +
        index +
        1,
    },
    {
      title: "Tên phòng",
      dataIndex: "roomName",
      width: 230,
      render: (
        roomName: string,
        room,
      ) => (
        <div className="min-w-0">
          <Text
            strong
            className="block truncate text-slate-950"
          >
            {roomName}
          </Text>

          <Text
            type="secondary"
            className="block truncate text-xs"
          >
            {room.code ||
              `ID: ${room.id}`}
          </Text>
        </div>
      ),
    },
    {
      title: "Loại phòng",
      dataIndex: "roomTypeName",
      width: 190,
      render: (
        roomTypeName: string,
      ) => (
        <Tag color="blue">
          {roomTypeName ||
            "Chưa cập nhật"}
        </Tag>
      ),
    },
    {
      title: "Cơ sở",
      width: 250,
      render: (_value, room) => (
        <div className="min-w-0">
          <Text
            strong
            className="block truncate"
          >
            {room.facilityName ||
              "Chưa cập nhật"}
          </Text>

          <Text
            type="secondary"
            className="block truncate text-xs"
          >
            {room.facilityCode ||
              room.facilityId}
          </Text>
        </div>
      ),
    },
    {
      title: "Tầng",
      dataIndex: "floor",
      width: 120,
      align: "center",
      render: (floor: string) =>
        floor || "Chưa cập nhật",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 155,
      align: "center",
      render: (status: RoomStatus) =>
        renderStatus(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center",
      fixed: "right",
      render: (_value, room) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={
                <Eye className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();
                void openDetailModal(
                  room,
                );
              }}
            />
          </Tooltip>

          <Tooltip title="Cập nhật">
            <Button
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();
                openEditModal(room);
              }}
            />
          </Tooltip>

          <Tooltip title="Xóa">
            <Button
              danger
              icon={
                <Trash2 className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();
                confirmDeleteRoom(
                  room,
                );
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout
      roles={["super_admin", "admin"]}
      permissions={["user.view"]}
    >
      <PageHeader
        title="Quản lý phòng"
        description="Quản lý phòng khám theo cơ sở và loại phòng."
      />

      <div className="mt-6 flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() => setError(null)}
          />
        ) : null}

        <div className="order-2">
          <TableFilter
            columns={[
              {
                field: "name",
                label:
                  "Tìm theo tên phòng, cơ sở hoặc loại phòng",
                type: "text",
                contains: true,
                width: 320,
              },
              {
                field: "floor",
                label: "Tầng",
                type: "text",
                width: 180,
              },
              {
                field: "roomTypeId",
                label: "Loại phòng",
                type: "select",
                options: roomTypeOptions,
                width: 240,
              },
              {
                field: "status",
                label: "Trạng thái",
                type: "select",
                options: [
                  {
                    value: "active",
                    label: "Hoạt động",
                  },
                  {
                    value: "inactive",
                    label:
                      "Ngừng hoạt động",
                  },
                ],
                width: 220,
              },
            ]}
            values={{
              name: query,
              floor: floorFilter,
              roomTypeId:
                roomTypeIdFilter,
              status: statusFilter,
            }}
            clearLabel="Xóa bộ lọc"
            onChange={(values) => {
              setQuery(
                String(
                  values.name ?? "",
                ),
              );
              setSearchQuery(
                values.name
                  ? String(values.name)
                  : undefined,
              );
              setFloorFilter(
                values.floor
                  ? String(values.floor)
                  : undefined,
              );
              setRoomTypeIdFilter(
                values.roomTypeId
                  ? String(
                      values.roomTypeId,
                    )
                  : undefined,
              );
              setStatusFilter(
                values.status as
                  | RoomStatus
                  | undefined,
              );
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="order-1 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title="Tổng số phòng"
              value={totalRooms}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title="Hoạt động trên trang"
              value={activeRoomsOnPage}
            />
          </Card>

          <Card className="border-slate-200 bg-slate-50/70">
            <Statistic
              title="Ngừng hoạt động trên trang"
              value={inactiveRoomsOnPage}
            />
          </Card>
        </div>

        <Card
          className="order-3 overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 0,
            },
          }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Danh sách phòng
              </p>

              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Danh sách được tải theo bộ lọc và phân trang từ API.
              </p>
            </div>
          }
          extra={
            <Space wrap>
              <Button
                danger
                disabled={
                  selectedRoomIds.length ===
                  0
                }
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={
                  confirmDeleteSelected
                }
              >
                Xóa đã chọn
                {selectedRoomIds.length > 0
                  ? ` (${selectedRoomIds.length})`
                  : ""}
              </Button>

              <Button
                type="primary"
                icon={
                  <Plus className="h-4 w-4" />
                }
                onClick={openCreateModal}
              >
                Thêm phòng
              </Button>
            </Space>
          }
        >
          <Table
            className="management-table"
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading}
            columns={columns}
            dataSource={rooms}
            scroll={{
              x: 1175,
            }}
            rowSelection={{
              selectedRowKeys:
                selectedRoomIds,
              onChange: (
                selectedRowKeys,
              ) => {
                setSelectedRoomIds(
                  selectedRowKeys.map(
                    String,
                  ),
                );
              },
            }}
            onRow={(room) => ({
              className:
                "cursor-pointer",
              onClick: (event) => {
                const target =
                  event.target as HTMLElement;

                if (
                  target.closest(
                    "button",
                  ) ||
                  target.closest("a") ||
                  target.closest(
                    ".ant-checkbox",
                  ) ||
                  target.closest(
                    ".ant-checkbox-wrapper",
                  )
                ) {
                  return;
                }

                void openDetailModal(room);
              },
            })}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalRooms,
              showSizeChanger: true,
              pageSizeOptions: [
                10,
                20,
                50,
                100,
              ],
              showQuickJumper: true,
              showTotal: (
                total,
                range,
              ) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} phòng`,
              onChange: (
                page,
                nextPageSize,
              ) => {
                setCurrentPage(
                  nextPageSize !==
                    pageSize
                    ? 1
                    : page,
                );
                setPageSize(
                  nextPageSize,
                );
              },
            }}
            locale={{
              emptyText: (
                <Empty
                  image={
                    Empty.PRESENTED_IMAGE_SIMPLE
                  }
                  description="Không có phòng phù hợp."
                />
              ),
            }}
          />
        </Card>
      </div>

      <ClinicRoomFormModal
        open={roomModalOpen}
        editingRoom={editingRoom}
        roomTypes={roomTypes}
        facilityName={
          facilityNameFromQuery ||
          editingRoom?.facilityName
        }
        onClose={closeRoomModal}
        onSubmit={handleSubmitRoom}
      />

      <Modal
        open={Boolean(detailRoom)}
        width={780}
        centered
        title={null}
        footer={
          <div className="flex justify-end">
            <Button
              type="primary"
              onClick={() =>
                setDetailRoom(null)
              }
            >
              Đóng
            </Button>
          </div>
        }
        confirmLoading={detailLoading}
        onCancel={() =>
          setDetailRoom(null)
        }
        mask={{
          closable: !detailLoading,
        }}
      >
        {detailRoom ? (
          <div>
            <div className="mb-5 flex items-start gap-4 border-b border-slate-200 pb-4 pr-10 sm:pr-12">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <DoorOpen className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <Title
                  level={3}
                  className="!mb-1 truncate !text-slate-950"
                >
                  {detailRoom.roomName}
                </Title>

                <Space size={8} wrap>
                  <Tag color="blue">
                    {detailRoom.roomTypeName}
                  </Tag>

                  {renderStatus(
                    detailRoom.status,
                  )}
                </Space>
              </div>
            </div>

            <Descriptions
              bordered
              column={2}
              size="middle"
              styles={{
                label: {
                  width: 170,
                  fontWeight: 600,
                },
              }}
            >
              <Descriptions.Item
                label="Mã phòng"
                span={1}
              >
                {detailRoom.code ||
                  detailRoom.id}
              </Descriptions.Item>

              <Descriptions.Item
                label="Tầng"
                span={1}
              >
                {detailRoom.floor}
              </Descriptions.Item>

              <Descriptions.Item
                label="Loại phòng"
                span={1}
              >
                <div className="flex items-center gap-2">
                  <Shapes className="h-4 w-4 text-slate-400" />
                  {
                    detailRoom.roomTypeName
                  }
                </div>
              </Descriptions.Item>

              <Descriptions.Item
                label="Mã loại phòng"
                span={1}
              >
                {detailRoom.roomTypeCode ||
                  detailRoom.roomTypeId}
              </Descriptions.Item>

              <Descriptions.Item
                label="Cơ sở"
                span={2}
              >
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />

                  <div>
                    <Text strong>
                      {
                        detailRoom.facilityName
                      }
                    </Text>

                    <Text
                      type="secondary"
                      className="ml-2"
                    >
                      {
                        detailRoom.facilityCode
                      }
                    </Text>
                  </div>
                </div>
              </Descriptions.Item>

              <Descriptions.Item
                label="Địa chỉ"
                span={2}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />

                  <span>
                    {[
                      detailRoom.facilityAddress,
                      detailRoom.facilityWard,
                      detailRoom.facilityProvince,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                      "Chưa cập nhật"}
                  </span>
                </div>
              </Descriptions.Item>

              <Descriptions.Item
                label="Mô tả loại phòng"
                span={2}
              >
                {detailRoom.roomTypeDescription ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Ngày tạo"
                span={1}
              >
                {formatDateTime(
                  detailRoom.createdAt,
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label="Cập nhật lần cuối"
                span={1}
              >
                {formatDateTime(
                  detailRoom.updatedAt,
                )}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={deleteConfirm.open}
        centered
        width={480}
        title={null}
        footer={null}
        closable={false}
        onCancel={closeDeleteConfirm}
        mask={{
          closable: !deleteLoading,
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
            onClick={closeDeleteConfirm}
            disabled={deleteLoading}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">
            {deleteConfirm.open &&
            deleteConfirm.mode ===
              "selected"
              ? "Xóa các phòng đã chọn?"
              : "Xóa phòng?"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {deleteConfirm.open &&
            deleteConfirm.mode ===
              "selected"
              ? `Bạn đang xóa ${deleteConfirm.count} phòng.`
              : "Phòng bị xóa sẽ không còn xuất hiện trong danh sách hoạt động."}
          </p>

          {deleteConfirm.open &&
          deleteConfirm.mode ===
            "single" ? (
            <p className="mx-auto mt-2 max-w-[360px] truncate text-sm font-semibold text-slate-800">
              {
                deleteConfirm.room
                  .roomName
              }{" "}
              -{" "}
              {
                deleteConfirm.room
                  .roomTypeName
              }
            </p>
          ) : null}

          <div className="mt-5 text-left">
            <label
              htmlFor="room-delete-reason"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Lý do xóa
            </label>

            <TextArea
              id="room-delete-reason"
              value={deleteReason}
              rows={3}
              maxLength={500}
              showCount
              disabled={deleteLoading}
              placeholder="Nhập lý do xóa phòng..."
              onChange={(event) =>
                setDeleteReason(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={closeDeleteConfirm}
              disabled={deleteLoading}
              className="h-11 rounded-lg font-semibold"
            >
              Hủy
            </Button>

            <Button
              danger
              type="primary"
              size="large"
              loading={deleteLoading}
              disabled={
                !deleteReason.trim()
              }
              onClick={() =>
                void handleConfirmDelete()
              }
              className="h-11 rounded-lg font-semibold"
            >
              Xóa phòng
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

export default function ClinicRoomManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
          Đang tải danh sách phòng...
        </div>
      }
    >
      <ClinicRoomManagementContent />
    </Suspense>
  );
}