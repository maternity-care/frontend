//src/app/management/clinic-room-management/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Select,
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
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
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

const PAGE_SIZE = 5;
const DEFAULT_FACILITY_ID = "1";

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

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    if (err.message.includes("Validation failed")) {
      return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.";
    }

    return err.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
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

  const activeFacilityId = facilityIdFromQuery || DEFAULT_FACILITY_ID;
  const isFacilityFiltered = Boolean(facilityIdFromQuery);

  const [rooms, setRooms] = useState<ClinicRoom[]>([]);
  const [query, setQuery] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<RoomStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
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
          ? await getRoomsByFacility(activeFacilityId, {
              search: query,
              status: statusFilter,
            })
          : await getRooms();

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
  }, [activeFacilityId, isFacilityFiltered, query, statusFilter]);

  const filteredRooms = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchKeyword =
        !keyword ||
        room.roomName.toLowerCase().includes(keyword) ||
        room.roomType.toLowerCase().includes(keyword);

      const matchType = !roomTypeFilter || room.roomType === roomTypeFilter;
      const matchStatus = !statusFilter || room.status === statusFilter;

      return matchKeyword && matchType && matchStatus;
    });
  }, [rooms, query, roomTypeFilter, statusFilter]);

  const activeRooms = rooms.filter((room) => room.status === "active").length;

  const suspendedRooms = rooms.filter(
    (room) => room.status === "suspended",
  ).length;

  function clearFilters() {
    setQuery("");
    setRoomTypeFilter(undefined);
    setStatusFilter(undefined);
    setCurrentPage(1);
  }

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
          title: "Cập nhật phòng thành công",
          content: "Thông tin phòng khám đã được cập nhật.",
          okText: "Đóng",
          centered: true,
        });

        return;
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);

        Modal.error({
          title: "Cập nhật phòng thất bại",
          content: message,
          okText: "Đóng",
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
        title: "Thêm phòng thành công",
        content: "Phòng khám mới đã được thêm vào danh sách.",
        okText: "Đóng",
        centered: true,
      });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      Modal.error({
        title: "Thêm phòng thất bại",
        content: message,
        okText: "Đóng",
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
          title: "Xóa phòng thành công",
          content: "Phòng khám đã được xóa khỏi danh sách.",
          okText: "Đóng",
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
          title: "Xóa phòng thành công",
          content: "Các phòng đã chọn đã được xóa khỏi danh sách.",
          okText: "Đóng",
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
        title: "Xóa phòng thất bại",
        content: message,
        okText: "Đóng",
        centered: true,
      });
    } finally {
      setDeleteLoading(false);
      setTableLoading(false);
    }
  }

  const columns: ColumnsType<ClinicRoom> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: <div className="text-center">Tên phòng</div>,
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
      title: "Loại phòng",
      dataIndex: "roomType",
      align: "center",
      render: (roomType: string) => (
        <Tag color="blue">{roomType || "Chưa cập nhật"}</Tag>
      ),
    },
    {
      title: "Tầng",
      dataIndex: "floor",
      width: 100,
      align: "center",
    },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      width: 120,
      align: "center",
      render: (capacity: number) => (
        <span className="font-medium text-slate-700">{capacity}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 160,
      align: "center",
      render: (status: RoomStatus) =>
        status === "active" ? (
          <Tag color="green">Đang hoạt động</Tag>
        ) : (
          <Tag color="default">Tạm ngưng</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center",
      render: (_value, record) => (
        <Space size={8}>
          <Button
            title="Xem chi tiết"
            icon={<Eye className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              openDetailModal(record);
            }}
          />

          <Button
            title="Sửa"
            icon={<Pencil className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(record);
            }}
          />

          <Button
            danger
            title="Xóa"
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
    <AdminLayout permissions={["user.view"]}>
      <PageHeader
        title="Clinic Room Management"
        description="Quản lý danh sách phòng khám tại cơ sở."
      />

      <div className="mt-6 space-y-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() => setError(null)}
          />
        ) : null}

        <Card className="border-slate-200 bg-white">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <p className="mb-1 text-sm font-semibold uppercase text-sky-700">
                Cơ sở khám
              </p>

              <Title level={3} className="!mb-0 !text-slate-950">
                {isFacilityFiltered
                  ? `Phòng khám tại ${facilityNameFromQuery || "cơ sở đã chọn"}`
                  : "Tất cả phòng khám"}
              </Title>

              <Text className="text-slate-500">
                {isFacilityFiltered
                  ? "Danh sách phòng được lọc theo cơ sở khám đã chọn."
                  : "Quản lý phòng, loại phòng, tầng, sức chứa và trạng thái hoạt động."}
              </Text>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <Input
              size="large"
              allowClear
              value={query}
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Tìm theo tên phòng"
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
            />

            <Select
              size="large"
              allowClear
              value={roomTypeFilter}
              placeholder="Loại phòng"
              options={roomTypeOptions}
              onChange={(value: string | undefined) => {
                setRoomTypeFilter(value);
                setCurrentPage(1);
              }}
            />

            <Select
              size="large"
              allowClear
              value={statusFilter}
              placeholder="Trạng thái"
              options={statusOptions}
              onChange={(value: RoomStatus | undefined) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            />

            <Button size="large" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </Card>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title={<span className="text-slate-500">Tổng phòng</span>}
              value={rooms.length}
              formatter={(value) => (
                <span className="text-slate-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title={<span className="text-emerald-700">Đang hoạt động</span>}
              value={activeRooms}
              formatter={(value) => (
                <span className="text-emerald-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title={<span className="text-red-700">Tạm ngưng</span>}
              value={suspendedRooms}
              formatter={(value) => (
                <span className="text-red-950">{value}</span>
              )}
            />
          </Card>
        </div>

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 0,
            },
          }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Danh sách phòng khám
              </p>

              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Click vào một dòng hoặc icon con mắt để xem chi tiết phòng khám.
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
                Xóa đã chọn
                {selectedRoomIds.length > 0
                  ? ` (${selectedRoomIds.length})`
                  : ""}
              </Button>

              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={openCreateModal}
              >
                Thêm phòng
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading || tableLoading}
            columns={columns}
            dataSource={filteredRooms}
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
              pageSize: PAGE_SIZE,
              total: filteredRooms.length,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} phòng`,
              onChange: (page) => setCurrentPage(page),
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
              Đóng
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
                    <Tag color="green">Đang hoạt động</Tag>
                  ) : (
                    <Tag color="default">Tạm ngưng</Tag>
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
              <Descriptions.Item label="Tên phòng" span={1}>
                {detailRoom.roomName}
              </Descriptions.Item>

              <Descriptions.Item label="Loại phòng" span={1}>
                {detailRoom.roomType}
              </Descriptions.Item>

              <Descriptions.Item label="Tầng" span={1}>
                {detailRoom.floor}
              </Descriptions.Item>

              <Descriptions.Item label="Sức chứa" span={1}>
                {detailRoom.capacity} người
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái" span={1}>
                {detailRoom.status === "active" ? (
                  <Tag color="green">Đang hoạt động</Tag>
                ) : (
                  <Tag color="default">Tạm ngưng</Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Mã phòng" span={1}>
                {detailRoom.id}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo" span={1}>
                {formatDateTime(detailRoom.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Cập nhật lần cuối" span={1}>
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
            {deleteConfirm.open && deleteConfirm.mode === "selected"
              ? "Xóa phòng đã chọn"
              : "Xóa phòng khám"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {deleteConfirm.open && deleteConfirm.mode === "selected"
              ? `Bạn có chắc chắn muốn xóa ${deleteConfirm.count} phòng đã chọn không?`
              : "Bạn có chắc chắn muốn xóa phòng khám này không?"}
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
              Hủy
            </Button>

            <Button
              danger
              type="primary"
              size="large"
              loading={deleteLoading}
              onClick={handleConfirmDelete}
              className="h-11 rounded-lg font-semibold"
            >
              Xóa
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
          Đang tải danh sách phòng khám...
        </div>
      }
    >
      <ClinicRoomManagementContent />
    </Suspense>
  );
}
