"use client";

import { useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Button,
  Card,
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
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import {
  ClinicRoomFormModal,
  type ClinicRoom,
  type RoomFormValues,
  type RoomStatus,
} from "./components/ClinicRoomFormModal";

const { Text, Title } = Typography;

const PAGE_SIZE = 5;

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

const initialRooms: ClinicRoom[] = [
  {
    id: "1",
    roomName: "P101",
    roomType: "Siêu âm",
    floor: 1,
    capacity: 2,
    status: "active",
  },
  {
    id: "2",
    roomName: "P202",
    roomType: "Xét nghiệm",
    floor: 2,
    capacity: 3,
    status: "active",
  },
  {
    id: "3",
    roomName: "P301",
    roomType: "Tư vấn",
    floor: 3,
    capacity: 4,
    status: "suspended",
  },
];

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

export default function ClinicRoomManagementPage() {
  const [rooms, setRooms] = useState<ClinicRoom[]>(initialRooms);
  const [query, setQuery] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<RoomStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ClinicRoom | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  async function handleSubmitRoom(values: RoomFormValues) {
    if (editingRoom) {
      const updatedRoom: ClinicRoom = {
        ...editingRoom,
        roomName: values.roomName.trim().toUpperCase(),
        roomType: values.roomType,
        floor: values.floor,
        capacity: values.capacity,
        status: values.status,
      };

      setRooms((current) =>
        current.map((room) =>
          room.id === editingRoom.id ? updatedRoom : room,
        ),
      );

      closeRoomModal();

      Modal.success({
        title: "Cập nhật phòng thành công",
        content: "Thông tin phòng khám đã được cập nhật.",
        okText: "Đóng",
        centered: true,
      });

      return;
    }

    const newRoom: ClinicRoom = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),
      roomName: values.roomName.trim().toUpperCase(),
      roomType: values.roomType,
      floor: values.floor,
      capacity: values.capacity,
      status: values.status,
    };

    setRooms((current) => [newRoom, ...current]);
    setCurrentPage(1);
    closeRoomModal();

    Modal.success({
      title: "Thêm phòng thành công",
      content: "Phòng khám mới đã được thêm vào danh sách.",
      okText: "Đóng",
      centered: true,
    });
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

    try {
      if (deleteConfirm.mode === "single") {
        const roomId = deleteConfirm.room.id;

        setRooms((current) => current.filter((room) => room.id !== roomId));

        setSelectedRoomIds((current) =>
          current.filter((id) => id !== roomId),
        );

        Modal.success({
          title: "Xóa phòng thành công",
          content: "Phòng khám đã được xóa khỏi danh sách.",
          okText: "Đóng",
          centered: true,
        });
      } else {
        const ids = deleteConfirm.ids;

        setRooms((current) =>
          current.filter((room) => !ids.includes(room.id)),
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
    } finally {
      setDeleteLoading(false);
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
      title: "Tên phòng",
      dataIndex: "roomName",
      align: "center",
      render: (roomName: string) => (
        <Space size={10}>
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
            <DoorOpen className="h-4 w-4" />
          </span>

          <Text strong>{roomName}</Text>
        </Space>
      ),
    },
    {
      title: "Loại phòng",
      dataIndex: "roomType",
      align: "center",
      render: (roomType: string) => <Tag color="blue">{roomType}</Tag>,
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
      width: 140,
      align: "center",
      render: (_value, record) => (
        <Space size={8}>
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
                Phòng khám tại Cơ sở Quận 1
              </Title>

              <Text className="text-slate-500">
                Quản lý phòng, loại phòng, tầng, sức chứa và trạng thái hoạt
                động.
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
              title={
                <span className="text-emerald-700">Đang hoạt động</span>
              }
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
                Theo dõi tên phòng, loại phòng, tầng, sức chứa và trạng thái.
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
            columns={columns}
            dataSource={filteredRooms}
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