"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  Modal,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarDays,
  Copy,
  Eye,
  Layers3,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { TableFilter } from "@/management/components/ui/TableFilter";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import type { Facility } from "@/management/features/facilities/facilities.types";
import { getRoomsGroupedByFacilities } from "@/management/features/rooms/rooms.api";
import type { ClinicRoom } from "@/management/features/rooms/rooms.types";
import { managementCatalogApi } from "@/management/features/doctor-shifts/doctor-shifts.api";
import type {
  BulkCreateDoctorShiftsInput,
  CopyDoctorShiftWeekInput,
  CreateDoctorShiftInput,
  DoctorShiftItem,
  DoctorShiftStatus,
  GetDoctorShiftsParams,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import { DoctorShiftBulkCreateModal } from "./components/DoctorShiftBulkCreateModal";
import { DoctorShiftCopyWeekModal } from "./components/DoctorShiftCopyWeekModal";
import { DoctorShiftDeleteModal } from "./components/DoctorShiftDeleteModal";
import { DoctorShiftDetailModal } from "./components/DoctorShiftDetailModal";
import { DoctorShiftFormModal } from "./components/DoctorShiftFormModal";

const { Text } = Typography;

const STATUS_OPTIONS = [
  { value: "available", label: "Còn trống" },
  { value: "full", label: "Đã đầy" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "off", label: "Nghỉ" },
];

const STATUS_TEXT: Record<DoctorShiftStatus, string> = {
  available: "Còn trống",
  full: "Đã đầy",
  cancelled: "Đã hủy",
  off: "Nghỉ",
};

function statusColor(status: DoctorShiftStatus) {
  if (status === "available") return "green";
  if (status === "full") return "orange";
  if (status === "cancelled") return "red";
  return "default";
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Đã xảy ra lỗi. Vui lòng thử lại.";
  }

  const message = error.message;

  if (/conflict|overlap|trùng/i.test(message)) {
    return "Ca trực bị trùng lịch của bác sĩ hoặc phòng khám.";
  }

  if (/operating hours|working hours|giờ hoạt động/i.test(message)) {
    return "Ca trực nằm ngoài giờ hoạt động của cơ sở.";
  }

  return message;
}

async function fetchDoctorShiftItems(params: GetDoctorShiftsParams) {
  const result = await managementCatalogApi.getDoctorShifts({
    ...params,
    page: 1,
    limit: 100,
  });

  return result.items;
}

export default function DoctorShiftsManagementPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  const [items, setItems] = useState<DoctorShiftItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [rooms, setRooms] = useState<ClinicRoom[]>([]);
  const [filters, setFilters] = useState<GetDoctorShiftsParams>({});
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<DoctorShiftItem | null>(
    null,
  );
  const [detailShift, setDetailShift] = useState<DoctorShiftItem | null>(null);
  const [deleteShift, setDeleteShift] = useState<DoctorShiftItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [copyWeekOpen, setCopyWeekOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogs() {
      try {
        const [facilityItems, groupedRoomItems] = await Promise.all([
          getFacilities(),
          getRoomsGroupedByFacilities(),
        ]);

        if (cancelled) return;

        setFacilities(facilityItems);
        setRooms(groupedRoomItems.flatMap((group) => group.rooms));
        setCatalogError(null);
      } catch (loadError) {
        if (!cancelled) {
          setCatalogError(
            `Không tải được danh sách cơ sở và phòng: ${getErrorMessage(
              loadError,
            )}`,
          );
        }
      } finally {
        if (!cancelled) {
          setCatalogsLoading(false);
        }
      }
    }

    void loadCatalogs();

    return () => {
      cancelled = true;
    };
  }, []);

  async function reload() {
    setTableLoading(true);
    setError(null);

    try {
      const nextItems = await fetchDoctorShiftItems(filters);
      setItems(nextItems);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDoctorShifts() {
      try {
        const nextItems = await fetchDoctorShiftItems(filters);

        if (cancelled) return;

        setItems(nextItems);
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTableLoading(false);
        }
      }
    }

    void loadDoctorShifts();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const facilityNameById = useMemo(
    () => new Map(facilities.map((facility) => [facility.id, facility.name])),
    [facilities],
  );

  const roomNameById = useMemo(
    () => new Map(rooms.map((room) => [room.id, room.roomName])),
    [rooms],
  );

  const facilityOptions = useMemo(
    () =>
      facilities.map((facility) => ({
        value: facility.id,
        label: facility.name,
      })),
    [facilities],
  );

  const roomOptions = useMemo(
    () =>
      rooms
        .filter(
          (room) => !filters.facilityId || room.facilityId === filters.facilityId,
        )
        .map((room) => ({
          value: room.id,
          label: room.roomName,
        })),
    [filters.facilityId, rooms],
  );

  const stats = useMemo(() => {
    return {
      total: items.length,
      available: items.filter((item) => item.status === "available").length,
      full: items.filter((item) => item.status === "full").length,
      unavailable: items.filter(
        (item) => item.status === "cancelled" || item.status === "off",
      ).length,
    };
  }, [items]);

  function openCreate() {
    setEditingShift(null);
    setFormOpen(true);
  }

  function openEdit(shift: DoctorShiftItem) {
    setEditingShift(shift);
    setFormOpen(true);
  }

  async function saveShift(values: CreateDoctorShiftInput) {
    const conflict = await managementCatalogApi.checkDoctorShiftConflicts({
      doctorId: values.doctorId,
      facilityId: values.facilityId,
      roomId: values.roomId,
      shiftDate: values.shiftDate,
      startTime: values.startTime,
      endTime: values.endTime,
      excludeShiftId: editingShift?.id,
    });

    if (conflict.hasConflict) {
      if (conflict.message) throw new Error(conflict.message);
      if (conflict.doctorConflict && conflict.roomConflict) {
        throw new Error("Ca trực trùng lịch của bác sĩ và phòng khám.");
      }
      if (conflict.doctorConflict) {
        throw new Error("Bác sĩ đã có ca trực trong khoảng thời gian này.");
      }
      if (conflict.roomConflict) {
        throw new Error(
          "Phòng khám đã được sử dụng trong khoảng thời gian này.",
        );
      }
      throw new Error("Ca trực bị trùng với lịch hiện có.");
    }

    if (editingShift) {
      await managementCatalogApi.updateDoctorShift(editingShift.id, values);
      modal.success({
        centered: true,
        title: "Cập nhật thành công",
        content: "Thông tin ca trực đã được cập nhật.",
        okText: "Đóng",
      });
    } else {
      await managementCatalogApi.createDoctorShift(values);
      modal.success({
        centered: true,
        title: "Tạo ca trực thành công",
        content: "Ca trực mới đã được thêm vào lịch làm việc.",
        okText: "Đóng",
      });
    }

    setEditingShift(null);
    setCurrentPage(1);
    await reload();
  }

  async function createBulk(values: BulkCreateDoctorShiftsInput) {
    await managementCatalogApi.bulkCreateDoctorShifts(values);
    setCurrentPage(1);
    await reload();

    modal.success({
      centered: true,
      title: "Tạo lịch hàng loạt thành công",
      content: "Các ca trực hợp lệ đã được thêm vào lịch làm việc.",
      okText: "Đóng",
    });
  }

  async function copyWeek(values: CopyDoctorShiftWeekInput) {
    await managementCatalogApi.copyDoctorShiftWeek(values);
    setCurrentPage(1);
    await reload();

    modal.success({
      centered: true,
      title: "Sao chép lịch thành công",
      content: "Lịch tuần nguồn đã được sao chép sang tuần đích.",
      okText: "Đóng",
    });
  }

  async function confirmDelete() {
    if (!deleteShift) return;

    const deletingShift = deleteShift;

    setDeleteLoading(true);
    setError(null);

    try {
      await managementCatalogApi.deleteDoctorShift(deletingShift.id);
      setDetailShift((current) =>
        current?.id === deletingShift.id ? null : current,
      );
      setDeleteShift(null);
      setCurrentPage(1);
      await reload();

      modal.success({
        centered: true,
        title: "Xóa ca trực thành công",
        content: "Ca trực đã được xóa khỏi lịch làm việc.",
        okText: "Đóng",
      });
    } catch (deleteError) {
      const message = getErrorMessage(deleteError);
      setError(message);
      modal.error({
        centered: true,
        title: "Không thể xóa ca trực",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnsType<DoctorShiftItem> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Bác sĩ",
      dataIndex: "doctorId",
      width: 150,
      render: (doctorId: string) => (
        <Space size={10}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <Stethoscope className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <Text strong className="block">
              Bác sĩ #{doctorId}
            </Text>
            <Text type="secondary" className="text-xs">
              Doctor ID
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Cơ sở / Phòng",
      width: 220,
      render: (_value, record) => (
        <div>
          <p className="mb-0 font-medium text-slate-800">
            {facilityNameById.get(record.facilityId) ??
              `Cơ sở #${record.facilityId}`}
          </p>
          <p className="mb-0 mt-0.5 text-xs text-slate-500">
            {record.roomId
              ? (roomNameById.get(record.roomId) ?? `Phòng #${record.roomId}`)
              : "Chưa gán phòng"}
          </p>
        </div>
      ),
    },
    {
      title: "Ngày trực",
      dataIndex: "shiftDate",
      width: 135,
      align: "center",
      sorter: (a, b) => a.shiftDate.localeCompare(b.shiftDate),
      render: (value: string) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Khung giờ",
      width: 145,
      align: "center",
      render: (_value, record) => (
        <div>
          <p className="mb-0 font-semibold text-slate-800">
            {record.startTime} - {record.endTime}
          </p>
          <p className="mb-0 mt-0.5 text-xs text-slate-500">
            {dayjs(`2000-01-01T${record.endTime}`).diff(
              dayjs(`2000-01-01T${record.startTime}`),
              "minute",
            )}{" "}
            phút
          </p>
        </div>
      ),
    },
    {
      title: "Số lịch tối đa",
      dataIndex: "maxAppointments",
      width: 125,
      align: "center",
      render: (value: number) => (
        <span className="font-semibold text-slate-800">{value}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 125,
      align: "center",
      render: (status: DoctorShiftStatus) => (
        <Tag color={statusColor(status)}>{STATUS_TEXT[status]}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_value, record) => (
        <Space size={8}>
          <Button
            title="Xem chi tiết"
            icon={<Eye className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              setDetailShift(record);
            }}
          />
          <Button
            title="Chỉnh sửa"
            icon={<Pencil className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              openEdit(record);
            }}
          />
          <Button
            danger
            title="Xóa ca trực"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              setDeleteShift(record);
            }}
          />
        </Space>
      ),
    },
  ];

  const displayedError = error ?? catalogError;

  return (
    <AdminLayout>
      {modalContextHolder}

      <PageHeader
        title="Quản lý ca trực bác sĩ"
        description="Quản lý lịch làm việc theo bác sĩ, cơ sở và phòng khám; kiểm tra xung đột trước khi lưu."
      />

      <div className="mt-6 flex flex-col gap-5">
        {displayedError ? (
          <Alert
            type="error"
            title={displayedError}
            showIcon
            closable
            onClose={() => {
              setError(null);
              setCatalogError(null);
            }}
          />
        ) : null}

        <div className="order-2">
          <TableFilter
            columns={[
              {
                field: "doctorId",
                label: "Doctor ID",
                type: "text",
                width: 150,
              },
              {
                field: "facilityId",
                label: "Cơ sở",
                type: "select",
                options: facilityOptions,
                width: 220,
              },
              {
                field: "roomId",
                label: "Phòng",
                type: "select",
                options: roomOptions,
                width: 190,
              },
              {
                field: "dateFrom",
                label: "Từ ngày (YYYY-MM-DD)",
                type: "text",
                width: 190,
              },
              {
                field: "dateTo",
                label: "Đến ngày (YYYY-MM-DD)",
                type: "text",
                width: 190,
              },
              {
                field: "status",
                label: "Trạng thái",
                type: "select",
                options: STATUS_OPTIONS,
                width: 150,
              },
            ]}
            values={{
              doctorId: filters.doctorId,
              facilityId: filters.facilityId,
              roomId: filters.roomId,
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
              status: filters.status,
            }}
            clearLabel="Xóa bộ lọc"
            onChange={(values) => {
              const nextFacilityId = values.facilityId
                ? String(values.facilityId).trim()
                : undefined;
              const requestedRoomId = values.roomId
                ? String(values.roomId).trim()
                : undefined;
              const nextRoomId =
                requestedRoomId &&
                (!nextFacilityId ||
                  rooms.some(
                    (room) =>
                      room.id === requestedRoomId &&
                      room.facilityId === nextFacilityId,
                  ))
                  ? requestedRoomId
                  : undefined;

              setTableLoading(true);
              setError(null);
              setFilters({
                doctorId: values.doctorId
                  ? String(values.doctorId).trim()
                  : undefined,
                facilityId: nextFacilityId,
                roomId: nextRoomId,
                dateFrom: values.dateFrom
                  ? String(values.dateFrom).trim()
                  : undefined,
                dateTo: values.dateTo
                  ? String(values.dateTo).trim()
                  : undefined,
                status: values.status as DoctorShiftStatus | undefined,
              });
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="order-1 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title={<span className="text-slate-500">Tổng ca trực</span>}
              value={stats.total}
              formatter={(value) => (
                <span className="text-slate-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title={<span className="text-emerald-700">Còn trống</span>}
              value={stats.available}
              formatter={(value) => (
                <span className="text-emerald-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-amber-100 bg-amber-50/60">
            <Statistic
              title={<span className="text-amber-700">Đã đầy</span>}
              value={stats.full}
              formatter={(value) => (
                <span className="text-amber-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title={<span className="text-red-700">Hủy / Nghỉ</span>}
              value={stats.unavailable}
              formatter={(value) => (
                <span className="text-red-950">{value}</span>
              )}
            />
          </Card>
        </div>

        <Card
          className="order-3 overflow-hidden border-slate-200 bg-white"
          styles={{ body: { padding: 0 } }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Danh sách ca trực
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Theo dõi ngày làm việc, phòng khám, sức chứa và trạng thái ca
                trực.
              </p>
            </div>
          }
          extra={
            <Space wrap>
              <Button
                icon={<Copy className="h-4 w-4" />}
                onClick={() => setCopyWeekOpen(true)}
              >
                Sao chép tuần
              </Button>
              <Button
                icon={<Layers3 className="h-4 w-4" />}
                onClick={() => setBulkOpen(true)}
              >
                Tạo hàng loạt
              </Button>
              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={openCreate}
              >
                Thêm ca trực
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
            dataSource={items}
            scroll={{ x: 1180 }}
            locale={{
              emptyText: (
                <div className="py-10 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mb-0 mt-3 font-semibold text-slate-700">
                    Chưa có ca trực
                  </p>
                  <p className="mb-0 mt-1 text-sm text-slate-500">
                    Thêm ca trực mới hoặc điều chỉnh bộ lọc để xem dữ liệu.
                  </p>
                </div>
              ),
            }}
            onRow={(record) => ({
              className: "cursor-pointer",
              onClick: (event) => {
                const target = event.target as HTMLElement;

                if (
                  target.closest("button") ||
                  target.closest("a") ||
                  target.closest(".ant-checkbox")
                ) {
                  return;
                }

                setDetailShift(record);
              },
            })}
            pagination={{
              current: currentPage,
              pageSize,
              total: items.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} ca trực`,
              onChange: (page, size) => {
                setCurrentPage(size !== pageSize ? 1 : page);
                setPageSize(size);
              },
            }}
          />
        </Card>
      </div>

      <DoctorShiftFormModal
        open={formOpen}
        shift={editingShift}
        facilities={facilities}
        rooms={rooms}
        catalogsLoading={catalogsLoading}
        onClose={() => {
          setFormOpen(false);
          setEditingShift(null);
        }}
        onSubmit={saveShift}
      />

      <DoctorShiftDetailModal
        open={Boolean(detailShift)}
        shift={detailShift}
        facilityName={
          detailShift
            ? facilityNameById.get(detailShift.facilityId)
            : undefined
        }
        roomName={
          detailShift?.roomId
            ? roomNameById.get(detailShift.roomId)
            : undefined
        }
        onClose={() => setDetailShift(null)}
        onEdit={openEdit}
      />

      <DoctorShiftBulkCreateModal
        open={bulkOpen}
        facilities={facilities}
        rooms={rooms}
        catalogsLoading={catalogsLoading}
        onClose={() => setBulkOpen(false)}
        onSubmit={createBulk}
      />

      <DoctorShiftCopyWeekModal
        open={copyWeekOpen}
        facilities={facilities}
        catalogsLoading={catalogsLoading}
        onClose={() => setCopyWeekOpen(false)}
        onSubmit={copyWeek}
      />

      <DoctorShiftDeleteModal
        open={Boolean(deleteShift)}
        shift={deleteShift}
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteShift(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </AdminLayout>
  );
}