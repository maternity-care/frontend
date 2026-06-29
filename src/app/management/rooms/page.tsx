// src/app/management/rooms/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Modal,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  Building2,
  DoorOpen,
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { useAuthStore } from "@/features/auth/auth.store";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { TableFilter } from "@/management/components/ui/TableFilter";
import {
  createRoom,
  deleteRoom,
  deleteRooms,
  getRooms,
  getRoomsByFacility,
  updateRoom,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
  RoomFormValues,
  RoomStatus,
} from "@/management/features/rooms/rooms.types";
import { ClinicRoomFormModal } from "./components/ClinicRoomFormModal";

const { Text, Title } = Typography;
const ROOM_MESSAGES = RESPONSE_MESSAGES.CLINIC_ROOM_MANAGEMENT;

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

const roomTypeOptions = [
  {
    value: ROOM_MESSAGES.ROOM_TYPES.ULTRASOUND,
    label: ROOM_MESSAGES.ROOM_TYPES.ULTRASOUND,
  },
  {
    value: ROOM_MESSAGES.ROOM_TYPES.TESTING,
    label: ROOM_MESSAGES.ROOM_TYPES.TESTING,
  },
  {
    value: ROOM_MESSAGES.ROOM_TYPES.CONSULTING,
    label: ROOM_MESSAGES.ROOM_TYPES.CONSULTING,
  },
  {
    value: ROOM_MESSAGES.ROOM_TYPES.ANTENATAL_CARE,
    label: ROOM_MESSAGES.ROOM_TYPES.ANTENATAL_CARE,
  },
  {
    value: ROOM_MESSAGES.ROOM_TYPES.EMERGENCY,
    label: ROOM_MESSAGES.ROOM_TYPES.EMERGENCY,
  },
];

const statusOptions = [
  { value: "active", label: ROOM_MESSAGES.ACTIVE },
  { value: "suspended", label: ROOM_MESSAGES.SUSPENDED },
];

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    if (err.message.includes("Validation failed")) {
      return ROOM_MESSAGES.VALIDATION_FAILED;
    }

    return err.message;
  }

  return ROOM_MESSAGES.DEFAULT_ERROR;
}

function formatDateTime(value?: string) {
  if (!value) return ROOM_MESSAGES.NOT_UPDATED;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(ROOM_MESSAGES.DATE_TIME_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ClinicRoomManagementContent() {
  const searchParams = useSearchParams();

  const facilityIdFromQuery = searchParams.get("facilityId");
  const facilityNameFromQuery = searchParams.get("facilityName");
  const sessionFacilityId = useAuthStore((state) => state.activeFacilityId);

  const activeFacilityId = facilityIdFromQuery || sessionFacilityId;
  const isFacilityFiltered = Boolean(activeFacilityId);

  const [rooms, setRooms] = useState<ClinicRoom[]>([]);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState<string>();
  const [roomTypeFilter, setRoomTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<RoomStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ClinicRoom | null>(null);
  const [detailRoom, setDetailRoom] = useState<ClinicRoom | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
  });

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadRooms() {
      setLoading(true);
      setError(null);

      try {
        const data = isFacilityFiltered
          ? await getRoomsByFacility(activeFacilityId!, {
              rawSearch: searchQuery,
            })
          : await getRooms({ rawSearch: searchQuery });

        if (mounted) {
          setRooms(data);
          setSelectedRoomIds([]);
          setCurrentPage(1);
        }
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRooms();

    return () => {
      mounted = false;
    };
  }, [activeFacilityId, isFacilityFiltered, searchQuery]);

  const filteredRooms = rooms;

  const activeRooms = rooms.filter((room) => room.status === "active").length;

  const suspendedRooms = rooms.filter(
    (room) => room.status === "suspended",
  ).length;

  function openCreateModal() {
    setEditingRoom(null);
    setRoomModalOpen(true);
  }

  function openEditModal(room: ClinicRoom) {
    setEditingRoom(room);
    setRoomModalOpen(true);
  }

  function closeRoomModal() {
    setRoomModalOpen(false);
    setEditingRoom(null);
  }

  function openDetailModal(room: ClinicRoom) {
    setDetailRoom(room);
  }

  function closeDetailModal() {
    setDetailRoom(null);
  }

  async function handleSubmitRoom(values: RoomFormValues) {
    setError(null);

    if (!activeFacilityId) {
      const message = "Vui lòng chọn cơ sở trước khi quản lý phòng.";
      setError(message);
      Modal.warning({
        title: "Chưa chọn cơ sở",
        content: message,
        centered: true,
      });
      return;
    }

    if (editingRoom) {
      try {
        const response = await updateRoom(editingRoom.id, {
          facilityId: activeFacilityId,
          name: values.roomName.trim(),
          roomType: values.roomType,
          floor: String(values.floor),
          status: values.status,
          capacity: values.capacity,
        });

        const updatedRoom: ClinicRoom = {
          ...response.data,
          capacity: values.capacity,
        };

        setRooms((current) =>
          current.map((room) =>
            room.id === editingRoom.id ? updatedRoom : room,
          ),
        );

        setDetailRoom((current) =>
          current?.id === editingRoom.id ? updatedRoom : current,
        );

        closeRoomModal();

        Modal.success({
          title: ROOM_MESSAGES.UPDATE_SUCCESS_TITLE,
          content: ROOM_MESSAGES.UPDATE_SUCCESS_CONTENT,
          okText: ROOM_MESSAGES.DETAIL_CLOSE,
          centered: true,
        });

        return;
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);

        Modal.error({
          title: ROOM_MESSAGES.UPDATE_ERROR_TITLE,
          content: message,
          okText: ROOM_MESSAGES.DETAIL_CLOSE,
          centered: true,
        });

        throw err;
      }
    }

    try {
      const response = await createRoom({
        facilityId: activeFacilityId,
        name: values.roomName.trim(),
        roomType: values.roomType,
        floor: String(values.floor),
        status: values.status,
        capacity: values.capacity,
      });

      const createdRoom: ClinicRoom = {
        ...response.data,
        capacity: values.capacity,
      };

      setRooms((current) => [createdRoom, ...current]);
      setCurrentPage(1);
      closeRoomModal();

      Modal.success({
        title: ROOM_MESSAGES.CREATE_SUCCESS_TITLE,
        content: ROOM_MESSAGES.CREATE_SUCCESS_CONTENT,
        okText: ROOM_MESSAGES.DETAIL_CLOSE,
        centered: true,
      });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      Modal.error({
        title: ROOM_MESSAGES.CREATE_ERROR_TITLE,
        content: message,
        okText: ROOM_MESSAGES.DETAIL_CLOSE,
        centered: true,
      });

      throw err;
    }
  }

  function confirmDeleteRoom(room: ClinicRoom) {
    setDeleteConfirm({
      open: true,
      mode: "single",
      room,
    });
  }

  function confirmDeleteSelected() {
    if (selectedRoomIds.length === 0) return;

    setDeleteConfirm({
      open: true,
      mode: "selected",
      ids: selectedRoomIds,
      count: selectedRoomIds.length,
    });
  }

  function closeDeleteConfirm() {
    if (deleteLoading) return;

    setDeleteConfirm({
      open: false,
    });
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm.open) return;

    setDeleteLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      if (deleteConfirm.mode === "single") {
        const roomId = deleteConfirm.room.id;

        await deleteRoom(roomId);

        setRooms((current) => current.filter((room) => room.id !== roomId));

        setSelectedRoomIds((current) => current.filter((id) => id !== roomId));

        setDetailRoom((current) => (current?.id === roomId ? null : current));

        Modal.success({
          title: ROOM_MESSAGES.DELETE_SUCCESS_TITLE,
          content: ROOM_MESSAGES.DELETE_SINGLE_SUCCESS_CONTENT,
          okText: ROOM_MESSAGES.DETAIL_CLOSE,
          centered: true,
        });
      } else {
        const ids = deleteConfirm.ids;

        await deleteRooms(ids);

        setRooms((current) => current.filter((room) => !ids.includes(room.id)));

        setDetailRoom((current) =>
          current && ids.includes(current.id) ? null : current,
        );

        setSelectedRoomIds([]);
        setCurrentPage(1);

        Modal.success({
          title: ROOM_MESSAGES.DELETE_SUCCESS_TITLE,
          content: ROOM_MESSAGES.DELETE_SELECTED_SUCCESS_CONTENT,
          okText: ROOM_MESSAGES.DETAIL_CLOSE,
          centered: true,
        });
      }

      setDeleteConfirm({
        open: false,
      });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      Modal.error({
        title: ROOM_MESSAGES.DELETE_ERROR_TITLE,
        content: message,
        okText: ROOM_MESSAGES.DETAIL_CLOSE,
        centered: true,
      });
    } finally {
      setDeleteLoading(false);
      setTableLoading(false);
    }
  }

  const columns: ColumnsType<ClinicRoom> = [
    {
      title: ROOM_MESSAGES.STT,
      width: 70,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: <div className="text-center">{ROOM_MESSAGES.ROOM_NAME}</div>,
      dataIndex: "roomName",
      render: (roomName: string) => (
        <div className="flex items-center justify-start gap-3 pl-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <DoorOpen className="h-4 w-4" />
          </span>

          <Text strong>{roomName}</Text>
        </div>
      ),
    },
    {
      title: ROOM_MESSAGES.ROOM_TYPE,
      dataIndex: "roomType",
      align: "center",
      render: (roomType: string) => (
        <Tag color="blue">{roomType || ROOM_MESSAGES.NOT_UPDATED}</Tag>
      ),
    },
    {
      title: ROOM_MESSAGES.FLOOR,
      dataIndex: "floor",
      width: 100,
      align: "center",
    },
    {
      title: ROOM_MESSAGES.CAPACITY,
      dataIndex: "capacity",
      width: 120,
      align: "center",
      render: (capacity: number) => (
        <span className="font-medium text-slate-700">{capacity}</span>
      ),
    },
    {
      title: ROOM_MESSAGES.STATUS,
      dataIndex: "status",
      width: 160,
      align: "center",
      render: (status: RoomStatus) =>
        status === "active" ? (
          <Tag color="green">{ROOM_MESSAGES.ACTIVE}</Tag>
        ) : (
          <Tag color="default">{ROOM_MESSAGES.SUSPENDED}</Tag>
        ),
    },
    {
      title: ROOM_MESSAGES.ACTIONS,
      key: "actions",
      width: 180,
      align: "center",
      render: (_value, record) => (
        <Space size={8}>
          <Button
            title={ROOM_MESSAGES.VIEW_DETAIL}
            icon={<Eye className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              openDetailModal(record);
            }}
          />

          <Button
            title={ROOM_MESSAGES.EDIT}
            icon={<Pencil className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(record);
            }}
          />

          <Button
            danger
            title={ROOM_MESSAGES.DELETE}
            icon={<Trash2 className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              confirmDeleteRoom(record);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout roles={["super_admin", "admin"]} permissions={["user.view"]}>
      <PageHeader
        title={ROOM_MESSAGES.PAGE_TITLE}
        description={ROOM_MESSAGES.PAGE_DESCRIPTION}
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

        <Card className="management-filter">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <p className="mb-1 text-sm font-semibold uppercase text-sky-700">
                {ROOM_MESSAGES.FACILITY}
              </p>

              <Title level={3} className="!mb-0 !text-slate-950">
                {isFacilityFiltered
                  ? `${ROOM_MESSAGES.ROOMS_AT_FACILITY_PREFIX} ${
                      facilityNameFromQuery ||
                      ROOM_MESSAGES.SELECTED_FACILITY_FALLBACK
                    }`
                  : ROOM_MESSAGES.ALL_ROOMS_TITLE}
              </Title>

              <Text className="text-slate-500">
                {isFacilityFiltered
                  ? ROOM_MESSAGES.FILTERED_FACILITY_DESCRIPTION
                  : ROOM_MESSAGES.ALL_ROOMS_DESCRIPTION}
              </Text>
            </div>
          </div>
        </Card>

        <div className="order-2">
        <TableFilter
          columns={[
            { field: "name", label: ROOM_MESSAGES.SEARCH_PLACEHOLDER, type: "text", contains: true },
            { field: "roomType", label: ROOM_MESSAGES.ROOM_TYPE_PLACEHOLDER, type: "select", options: roomTypeOptions, width: 180 },
            { field: "status", label: ROOM_MESSAGES.STATUS_PLACEHOLDER, type: "select", options: statusOptions, width: 180 },
          ]}
          values={{ name: query, roomType: roomTypeFilter, status: statusFilter }}
          clearLabel={ROOM_MESSAGES.CLEAR_FILTERS}
          onChange={(values, search) => {
            setSearchQuery(search);
            setQuery(String(values.name ?? ""));
            setRoomTypeFilter(values.roomType ? String(values.roomType) : undefined);
            setStatusFilter(values.status as RoomStatus | undefined);
            setCurrentPage(1);
          }}
        />
        </div>

        <div className="order-1 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title={
                <span className="text-slate-500">
                  {ROOM_MESSAGES.TOTAL_ROOMS}
                </span>
              }
              value={rooms.length}
              formatter={(value) => (
                <span className="text-slate-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title={
                <span className="text-emerald-700">
                  {ROOM_MESSAGES.ACTIVE_ROOMS}
                </span>
              }
              value={activeRooms}
              formatter={(value) => (
                <span className="text-emerald-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title={
                <span className="text-red-700">
                  {ROOM_MESSAGES.SUSPENDED_ROOMS}
                </span>
              }
              value={suspendedRooms}
              formatter={(value) => (
                <span className="text-red-950">{value}</span>
              )}
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
                {ROOM_MESSAGES.ROOM_LIST_TITLE}
              </p>

              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                {ROOM_MESSAGES.ROOM_LIST_DESCRIPTION}
              </p>
            </div>
          }
          extra={
            <Space wrap>
              <Button
                danger
                disabled={selectedRoomIds.length === 0}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={confirmDeleteSelected}
              >
                {ROOM_MESSAGES.DELETE_SELECTED}
                {selectedRoomIds.length > 0
                  ? ` (${selectedRoomIds.length})`
                  : ""}
              </Button>

              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={openCreateModal}
              >
                {ROOM_MESSAGES.ADD_ROOM}
              </Button>
            </Space>
          }
        >
          <Table
            className="management-table"
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading || tableLoading}
            columns={columns}
            dataSource={filteredRooms}
            scroll={{ x: 860 }}
            onRow={(record) => ({
              className: "cursor-pointer",
              onClick: (event) => {
                const target = event.target as HTMLElement;

                if (
                  target.closest("button") ||
                  target.closest("a") ||
                  target.closest(".ant-checkbox") ||
                  target.closest(".ant-checkbox-wrapper")
                ) {
                  return;
                }

                openDetailModal(record);
              },
            })}
            rowSelection={{
              selectedRowKeys: selectedRoomIds,
              onChange: (selectedRowKeys) => {
                setSelectedRoomIds(selectedRowKeys.map(String));
              },
            }}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredRooms.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${ROOM_MESSAGES.PAGINATION_TOTAL_PREFIX} ${range[0]} - ${range[1]} ${ROOM_MESSAGES.PAGINATION_TOTAL_MIDDLE} ${total} ${ROOM_MESSAGES.PAGINATION_TOTAL_SUFFIX}`,
              onChange: (page, nextPageSize) => {
                setCurrentPage(nextPageSize !== pageSize ? 1 : page);
                setPageSize(nextPageSize);
              },
            }}
          />
        </Card>
      </div>

      <ClinicRoomFormModal
        open={roomModalOpen}
        editingRoom={editingRoom}
        onClose={closeRoomModal}
        onSubmit={handleSubmitRoom}
      />

      <Modal
        open={Boolean(detailRoom)}
        width={720}
        centered
        title={null}
        footer={
          <div className="flex justify-end">
            <Button type="primary" onClick={closeDetailModal}>
              {ROOM_MESSAGES.DETAIL_CLOSE}
            </Button>
          </div>
        }
        onCancel={closeDetailModal}
        mask={{ closable: true }}
      >
        {detailRoom ? (
          <div>
            <div className="mb-5 flex items-start gap-4 border-b border-slate-200 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <DoorOpen className="h-6 w-6" />
              </div>

              <div>
                <Title level={3} className="!mb-1 !text-slate-950">
                  {detailRoom.roomName}
                </Title>

                <Space size={8} wrap>
                  <Tag color="blue">{detailRoom.roomType}</Tag>

                  {detailRoom.status === "active" ? (
                    <Tag color="green">{ROOM_MESSAGES.ACTIVE}</Tag>
                  ) : (
                    <Tag color="default">{ROOM_MESSAGES.SUSPENDED}</Tag>
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
                  width: 160,
                  fontWeight: 600,
                },
              }}
            >
              <Descriptions.Item label={ROOM_MESSAGES.ROOM_NAME} span={1}>
                {detailRoom.roomName}
              </Descriptions.Item>

              <Descriptions.Item label={ROOM_MESSAGES.ROOM_TYPE} span={1}>
                {detailRoom.roomType}
              </Descriptions.Item>

              <Descriptions.Item label={ROOM_MESSAGES.FLOOR} span={1}>
                {detailRoom.floor}
              </Descriptions.Item>

              <Descriptions.Item label={ROOM_MESSAGES.CAPACITY} span={1}>
                {detailRoom.capacity} {ROOM_MESSAGES.PERSON_SUFFIX}
              </Descriptions.Item>

              <Descriptions.Item label={ROOM_MESSAGES.STATUS} span={1}>
                {detailRoom.status === "active" ? (
                  <Tag color="green">{ROOM_MESSAGES.ACTIVE}</Tag>
                ) : (
                  <Tag color="default">{ROOM_MESSAGES.SUSPENDED}</Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={ROOM_MESSAGES.ROOM_CODE} span={1}>
                {detailRoom.id}
              </Descriptions.Item>

              <Descriptions.Item label={ROOM_MESSAGES.CREATED_AT} span={1}>
                {formatDateTime(detailRoom.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label={ROOM_MESSAGES.UPDATED_AT} span={1}>
                {formatDateTime(detailRoom.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={deleteConfirm.open}
        centered
        width={456}
        title={null}
        footer={null}
        closable={false}
        onCancel={closeDeleteConfirm}
        mask={{ closable: !deleteLoading }}
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
            aria-label={ROOM_MESSAGES.DETAIL_CLOSE}
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
            {deleteConfirm.open && deleteConfirm.mode === "selected"
              ? ROOM_MESSAGES.DELETE_SELECTED_ROOMS
              : ROOM_MESSAGES.DELETE_ROOM}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {deleteConfirm.open && deleteConfirm.mode === "selected"
              ? `${ROOM_MESSAGES.DELETE_SELECTED_CONFIRM_PREFIX} ${deleteConfirm.count} ${ROOM_MESSAGES.DELETE_SELECTED_CONFIRM_SUFFIX}`
              : ROOM_MESSAGES.DELETE_SINGLE_CONFIRM}
          </p>

          {deleteConfirm.open && deleteConfirm.mode === "single" ? (
            <p className="mx-auto mt-2 max-w-[340px] truncate text-sm font-semibold text-slate-800">
              {deleteConfirm.room.roomName} - {deleteConfirm.room.roomType}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={closeDeleteConfirm}
              disabled={deleteLoading}
              className="h-11 rounded-lg font-semibold"
            >
              {ROOM_MESSAGES.CANCEL}
            </Button>

            <Button
              danger
              type="primary"
              size="large"
              loading={deleteLoading}
              onClick={handleConfirmDelete}
              className="h-11 rounded-lg font-semibold"
            >
              {ROOM_MESSAGES.DELETE}
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
          {ROOM_MESSAGES.LOADING_ROOMS}
        </div>
      }
    >
      <ClinicRoomManagementContent />
    </Suspense>
  );
}
