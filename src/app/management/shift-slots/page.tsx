"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type {
  ColumnsType,
} from "antd/es/table";
import {
  Clock3,
  Eye,
  Moon,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import {
  deleteShiftSlot,
  getShiftSlot,
  getShiftSlots,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlot,
  ShiftSlotStatus,
} from "@/management/features/shift-slots/shift-slots.types";
import { ShiftSlotCreateModal } from "./components/ShiftSlotCreateModal";
import { ShiftSlotEditModal } from "./components/ShiftSlotEditModal";
import { ShiftSlotDetailModal } from "./components/ShiftSlotDetailModal";
import {
  getShiftSlotErrorMessage,
} from "./components/shift-slot-modal.shared";
import type {
  FacilityOption,
} from "./components/shift-slot-modal.shared";

const { Text } = Typography;

function renderStatus(
  status: ShiftSlotStatus,
) {
  return status === "active" ? (
    <Tag color="green">Hoạt động</Tag>
  ) : (
    <Tag color="red">Ngừng hoạt động</Tag>
  );
}


export default function ShiftSlotsPage() {
  const {
    message: messageApi,
    modal: modalApi,
  } = App.useApp();

  const [slots, setSlots] = useState<
    ShiftSlot[]
  >([]);
  const [totalSlots, setTotalSlots] =
    useState(0);
  const [facilities, setFacilities] =
    useState<FacilityOption[]>([]);

  const [searchInput, setSearchInput] =
    useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");
  const [facilityFilter, setFacilityFilter] =
    useState<string>();
  const [statusFilter, setStatusFilter] =
    useState<ShiftSlotStatus>();
  const [currentPage, setCurrentPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState(20);
  const [reloadKey, setReloadKey] =
    useState(0);

  const [createModalOpen, setCreateModalOpen] =
    useState(false);
  const [editingSlot, setEditingSlot] =
    useState<ShiftSlot | null>(null);
  const [detailSlot, setDetailSlot] =
    useState<ShiftSlot | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(
        searchInput.trim(),
      );
      setCurrentPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    void getFacilities()
      .then((data) => {
        if (cancelled) return;

        setFacilities(
          data.map((facility) => ({
            id: facility.id,
            name: facility.name,
            code: facility.code,
            address: facility.address,
          })),
        );
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            getShiftSlotErrorMessage(
              loadError,
            ),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);

        try {
          const result = await getShiftSlots({
            search:
              debouncedSearch || undefined,
            facilityId: facilityFilter,
            status: statusFilter,
            page: currentPage,
            limit: pageSize,
          });

          if (cancelled) return;

          setSlots(result.items);
          setTotalSlots(result.total);
          setError(null);
        } catch (loadError) {
          if (cancelled) return;

          setError(
            getShiftSlotErrorMessage(
              loadError,
            ),
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
    currentPage,
    debouncedSearch,
    facilityFilter,
    pageSize,
    reloadKey,
    statusFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: totalSlots,
      activeOnPage: slots.filter(
        (slot) => slot.status === "active",
      ).length,
      inactiveOnPage: slots.filter(
        (slot) => slot.status === "inactive",
      ).length,
      overnightOnPage: slots.filter(
        (slot) => slot.isOvernight,
      ).length,
    }),
    [slots, totalSlots],
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

  async function openDetail(slot: ShiftSlot) {
    setDetailSlot(slot);
    setDetailLoading(true);

    try {
      const detail = await getShiftSlot(
        slot.id,
      );

      setDetailSlot(detail);
    } catch (detailError) {
      const message =
        getShiftSlotErrorMessage(
          detailError,
        );

      setError(message);
      messageApi.error(message);
    } finally {
      setDetailLoading(false);
    }
  }

  function refreshSlots() {
    setReloadKey(
      (current) => current + 1,
    );
  }

  function handleCreated(
    _slot: ShiftSlot,
  ) {
    setCurrentPage(1);
    refreshSlots();
  }

  function handleUpdated(
    _slot: ShiftSlot,
  ) {
    refreshSlots();
  }

  function confirmDelete(slot: ShiftSlot) {
    modalApi.confirm({
      centered: true,
      title: "Xóa khung ca?",
      content: (
        <div>
          <p className="mb-2 text-slate-600">
            Bạn có chắc chắn muốn xóa khung ca
            này không?
          </p>

          <div className="rounded-lg bg-slate-50 p-3">
            <Text strong className="block">
              {slot.name}
            </Text>

            <Text
              type="secondary"
              className="mt-1 block"
            >
              {slot.startTime} -{" "}
              {slot.endTime} ·{" "}
              {slot.facilityName ||
                facilityById.get(
                  slot.facilityId,
                )?.name ||
                slot.facilityCode ||
                facilityById.get(
                  slot.facilityId,
                )?.code ||
                `Cơ sở #${slot.facilityId}`}
            </Text>
          </div>
        </div>
      ),
      okText: "Xóa khung ca",
      cancelText: "Hủy",
      okButtonProps: {
        danger: true,
      },
      mask: {
        closable: false,
      },
      onOk: async () => {
        try {
          const response =
            await deleteShiftSlot(slot.id);

          setDetailSlot(null);

          if (
            slots.length === 1 &&
            currentPage > 1
          ) {
            setCurrentPage(
              (current) => current - 1,
            );
          } else {
            refreshSlots();
          }

          messageApi.success(
            response.message ||
              "Xóa khung ca thành công.",
          );
        } catch (deleteError) {
          const message =
            getShiftSlotErrorMessage(
              deleteError,
            );

          messageApi.error(message);
          throw deleteError;
        }
      },
    });
  }

  function resetFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setFacilityFilter(undefined);
    setStatusFilter(undefined);
    setCurrentPage(1);
  }

  const columns: ColumnsType<ShiftSlot> = [
    {
      title: "STT",
      width: 65,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) *
          pageSize +
        index +
        1,
    },
    {
      title: "Khung ca",
      width: 230,
      render: (_value, slot) => (
        <div className="min-w-0">
          <Text
            strong
            className="block truncate text-slate-950"
          >
            {slot.name}
          </Text>

          <Text
            type="secondary"
            className="block truncate text-xs"
          >
            {slot.code ||
              `ID: ${slot.id}`}
          </Text>
        </div>
      ),
    },
    {
      title: "Cơ sở",
      width: 245,
      render: (_value, slot) => {
        const facility = facilityById.get(
          slot.facilityId,
        );

        return (
          <div className="min-w-0">
            <Text
              strong
              className="block truncate"
            >
              {slot.facilityName ||
                facility?.name ||
                "Chưa cập nhật"}
            </Text>

            <Text
              type="secondary"
              className="block truncate text-xs"
            >
              {slot.facilityCode ||
                facility?.code ||
                `Facility ID: ${slot.facilityId}`}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Thời gian",
      width: 180,
      sorter: (first, second) =>
        first.startTime.localeCompare(
          second.startTime,
        ),
      render: (_value, slot) => (
        <div>
          <Text strong>
            {slot.startTime} -{" "}
            {slot.endTime}
          </Text>

          {slot.isOvernight ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-violet-600">
              <Moon className="h-3.5 w-3.5" />
              Qua đêm
            </div>
          ) : (
            <Text
              type="secondary"
              className="mt-1 block text-xs"
            >
              Trong ngày
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 145,
      align: "center",
      render: (
        status: ShiftSlotStatus,
      ) => renderStatus(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_value, slot) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={
                <Eye className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();
                void openDetail(slot);
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
                setEditingSlot(slot);
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
                confirmDelete(slot);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý khung ca"
        description="Quản lý các khung thời gian làm việc theo từng cơ sở."
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title="Tổng khung ca"
              value={stats.total}
              prefix={
                <Clock3 className="h-5 w-5" />
              }
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title="Hoạt động trên trang"
              value={
                stats.activeOnPage
              }
            />
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title="Ngừng hoạt động trên trang"
              value={
                stats.inactiveOnPage
              }
            />
          </Card>

          <Card className="border-violet-100 bg-violet-50/60">
            <Statistic
              title="Qua đêm trên trang"
              value={
                stats.overnightOnPage
              }
              prefix={
                <Moon className="h-5 w-5" />
              }
            />
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                allowClear
                value={searchInput}
                prefix={
                  <Search className="h-4 w-4 text-slate-400" />
                }
                placeholder="Tìm theo mã hoặc tên khung ca"
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
              />

              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={facilityFilter}
                placeholder="Tất cả cơ sở"
                options={facilities.map(
                  (facility) => ({
                    value: facility.id,
                    label: facility.name,
                  }),
                )}
                onChange={(value) => {
                  setFacilityFilter(value);
                  setCurrentPage(1);
                }}
              />

              <Select
                allowClear
                value={statusFilter}
                placeholder="Tất cả trạng thái"
                options={[
                  {
                    value: "active",
                    label: "Hoạt động",
                  },
                  {
                    value: "inactive",
                    label: "Ngừng hoạt động",
                  },
                ]}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                icon={
                  <X className="h-4 w-4" />
                }
                onClick={resetFilters}
              >
                Xóa bộ lọc
              </Button>

              <Button
                type="primary"
                icon={
                  <Plus className="h-4 w-4" />
                }
                onClick={() =>
                  setCreateModalOpen(true)
                }
              >
                Thêm khung ca
              </Button>
            </div>
          </div>
        </Card>

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
                Danh sách khung ca
              </p>
            </div>
          }
          extra={
            <Badge
              count={totalSlots}
              showZero
              color="#0f766e"
            />
          }
        >
          <Table
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading}
            columns={columns}
            dataSource={slots}
            scroll={{
              x: 1030,
            }}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalSlots,
              showSizeChanger: true,
              pageSizeOptions: [
                10,
                20,
                30,
                50,
              ],
              showQuickJumper: true,
              showTotal: (
                total,
                range,
              ) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} khung ca`,
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
                  description="Không có khung ca phù hợp."
                >
                  <Button
                    type="primary"
                    onClick={() =>
                      setCreateModalOpen(
                        true,
                      )
                    }
                  >
                    Thêm khung ca
                  </Button>
                </Empty>
              ),
            }}
            onRow={(slot) => ({
              className:
                "cursor-pointer",
              onClick: (event) => {
                const target =
                  event.target as HTMLElement;

                if (
                  target.closest("button") ||
                  target.closest("a")
                ) {
                  return;
                }

                void openDetail(slot);
              },
            })}
            className="management-table [&_.ant-table-cell]:px-3"
          />
        </Card>
      </div>

      <ShiftSlotCreateModal
        open={createModalOpen}
        facilities={facilities}
        onClose={() =>
          setCreateModalOpen(false)
        }
        onCreated={handleCreated}
      />

      <ShiftSlotEditModal
        open={Boolean(editingSlot)}
        slot={editingSlot}
        facilities={facilities}
        onClose={() =>
          setEditingSlot(null)
        }
        onUpdated={handleUpdated}
      />

      <ShiftSlotDetailModal
        open={Boolean(detailSlot)}
        slot={detailSlot}
        loading={detailLoading}
        onClose={() =>
          setDetailSlot(null)
        }
        onEdit={(slot) => {
          setDetailSlot(null);
          setEditingSlot(slot);
        }}
        onDelete={(slot) => {
          setDetailSlot(null);
          confirmDelete(slot);
        }}
      />
    </AdminLayout>
  );
}