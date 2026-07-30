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
import {
  Boxes,
  Eye,
  Pencil,
  Plus,
  Search,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/features/auth/auth.store";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import {
  getFacilities,
} from "@/management/features/facilities/facilities.api";
import {
  getRooms,
  getRoomTypeLookup,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
  RoomStatus,
  RoomType,
} from "@/management/features/rooms/rooms.types";
import { RoomCreateModal } from "./components/RoomCreateModal";
import { RoomEditModal } from "./components/RoomEditModal";
import { RoomDetailModal } from "./components/RoomDetailModal";
import {
  RoomDeleteModal,
} from "./components/RoomDeleteModal";
import type {
  RoomDeleteTarget,
} from "./components/RoomDeleteModal";
import { RoomBulkCreateModal } from "./components/RoomBulkCreateModal";
import { RoomTypeManagementModal } from "./components/RoomTypeManagementModal";
import type {
  FacilityOption,
} from "./components/room-form.shared";

const { Text } = Typography;

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

  return "Không tải được danh sách phòng.";
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

function isEmptyRoomResult(
  error: unknown,
) {
  if (
    !error ||
    typeof error !== "object" ||
    !("response" in error)
  ) {
    return false;
  }

  const response = (
    error as {
      response?: {
        status?: number;
        data?: {
          message?:
            | string
            | string[];
        };
      };
    }
  ).response;

  const messages = Array.isArray(
    response?.data?.message,
  )
    ? response.data.message
    : [response?.data?.message];

  const normalizedMessage = messages
    .filter(
      (message): message is string =>
        typeof message === "string",
    )
    .join(" ")
    .trim()
    .toLowerCase();

  return (
    response?.status === 404 ||
    normalizedMessage.includes(
      "không tìm thấy phòng",
    ) ||
    normalizedMessage.includes(
      "không có phòng",
    ) ||
    normalizedMessage.includes(
      "no rooms found",
    ) ||
    normalizedMessage.includes(
      "room not found",
    )
  );
}

function ClinicRoomManagementContent() {
  const searchParams = useSearchParams();
  const sessionFacilityId = useAuthStore(
    (state) => state.activeFacilityId,
  );
  const initialFacilityId =
    searchParams.get("facilityId") ||
    sessionFacilityId ||
    undefined;

  const [facilities, setFacilities] =
    useState<FacilityOption[]>([]);
  const [roomTypes, setRoomTypes] =
    useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<
    ClinicRoom[]
  >([]);
  const [totalRooms, setTotalRooms] =
    useState(0);

  const [searchInput, setSearchInput] =
    useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");
  const [facilityFilter, setFacilityFilter] =
    useState<string | undefined>(
      initialFacilityId,
    );
  const [floorFilter, setFloorFilter] =
    useState<string>();
  const [roomTypeIdFilter, setRoomTypeIdFilter] =
    useState<string>();
  const [statusFilter, setStatusFilter] =
    useState<RoomStatus>();

  const [currentPage, setCurrentPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState(20);
  const [selectedRoomIds, setSelectedRoomIds] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState<
    string | null
  >(null);
  const [reloadKey, setReloadKey] =
    useState(0);
  const [
    roomTypeLookupReloadKey,
    setRoomTypeLookupReloadKey,
  ] = useState(0);

  const [createOpen, setCreateOpen] =
    useState(false);
  const [editingRoom, setEditingRoom] =
    useState<ClinicRoom | null>(null);
  const [detailRoomId, setDetailRoomId] =
    useState<string | null>(null);
  const [detailInitialRoom, setDetailInitialRoom] =
    useState<ClinicRoom | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<RoomDeleteTarget | null>(
      null,
    );
  const [bulkOpen, setBulkOpen] =
    useState(false);
  const [roomTypesOpen, setRoomTypesOpen] =
    useState(false);

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

    const timer = window.setTimeout(() => {
      void getFacilities()
        .then((data) => {
          if (cancelled) return;

          setFacilities(
            data.map((facility) => ({
              id: String(facility.id),
              name: String(facility.name),
              code: String(
                facility.code ?? "",
              ),
              address: String(
                facility.address ?? "",
              ),
              status: String(
                facility.status ?? "",
              ),
            })),
          );
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
      void getRoomTypeLookup({
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
  }, [roomTypeLookupReloadKey]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      setLoading(true);

      const params = {
        search:
          debouncedSearch || undefined,
        floor: floorFilter,
        roomTypeId:
          roomTypeIdFilter,
        status: statusFilter,
        page: currentPage,
        limit: pageSize,
      };

      const request = getRooms({
        ...params,
        facilityId: facilityFilter,
      });

      void request
        .then((result) => {
          if (cancelled) return;

          setRooms(result.items);
          setTotalRooms(result.total);
          setSelectedRoomIds([]);
          setError(null);
        })
        .catch((loadError) => {
          if (cancelled) return;

          setRooms([]);
          setTotalRooms(0);
          setSelectedRoomIds([]);

          if (
            isEmptyRoomResult(loadError)
          ) {
            setError(null);
            return;
          }

          setError(
            getErrorMessage(loadError),
          );
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    currentPage,
    debouncedSearch,
    facilityFilter,
    floorFilter,
    pageSize,
    reloadKey,
    roomTypeIdFilter,
    statusFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: totalRooms,
      activeOnPage: rooms.filter(
        (room) =>
          room.status === "active",
      ).length,
      inactiveOnPage: rooms.filter(
        (room) =>
          room.status === "inactive",
      ).length,
    }),
    [rooms, totalRooms],
  );

  const roomById = useMemo(
    () =>
      new Map(
        rooms.map((room) => [
          room.id,
          room,
        ]),
      ),
    [rooms],
  );

  function refreshRooms() {
    setReloadKey(
      (current) => current + 1,
    );
  }

  function resetFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    setFacilityFilter(undefined);
    setFloorFilter(undefined);
    setRoomTypeIdFilter(undefined);
    setStatusFilter(undefined);
    setCurrentPage(1);
  }

  function openDetail(
    roomId: string,
  ) {
    setDetailInitialRoom(
      roomById.get(roomId) ?? null,
    );
    setDetailRoomId(roomId);
  }

  function handleDeleted(
    deletedIds: string[],
  ) {
    setDetailRoomId((current) =>
      current &&
      deletedIds.includes(current)
        ? null
        : current,
    );
    setEditingRoom((current) =>
      current &&
      deletedIds.includes(current.id)
        ? null
        : current,
    );
    setSelectedRoomIds([]);

    if (
      rooms.length <=
        deletedIds.length &&
      currentPage > 1
    ) {
      setCurrentPage(
        (current) =>
          Math.max(1, current - 1),
      );
    } else {
      refreshRooms();
    }
  }

  const columns: ColumnsType<ClinicRoom> = [
    {
      title: "STT",
      width: 65,
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
      width: 150,
      align: "center",
      render: (status: RoomStatus) =>
        renderStatus(status),
    },
    {
      title: "Thao tác",
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
                openDetail(room.id);
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
                setEditingRoom(room);
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
                setDeleteTarget({
                  mode: "single",
                  room,
                });
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
        description="Quản lý phòng, loại phòng và dữ liệu phòng theo từng cơ sở."
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title="Tổng số phòng"
              value={stats.total}
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

          <Card className="border-slate-200 bg-slate-50/70">
            <Statistic
              title="Ngừng hoạt động trên trang"
              value={
                stats.inactiveOnPage
              }
            />
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Input
              allowClear
              value={searchInput}
              prefix={
                <Search className="h-4 w-4 text-slate-400" />
              }
              placeholder="Tên phòng hoặc cơ sở"
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

            <Input
              allowClear
              value={floorFilter}
              placeholder="Tầng"
              onChange={(event) => {
                setFloorFilter(
                  event.target.value ||
                    undefined,
                );
                setCurrentPage(1);
              }}
            />

            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={roomTypeIdFilter}
              placeholder="Tất cả loại phòng"
              options={roomTypes.map(
                (roomType) => ({
                  value: roomType.id,
                  label: roomType.name,
                }),
              )}
              onChange={(value) => {
                setRoomTypeIdFilter(
                  value,
                );
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
                  label:
                    "Ngừng hoạt động",
                },
              ]}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            />

            <Button
              icon={
                <X className="h-4 w-4" />
              }
              onClick={resetFilters}
            >
              Xóa bộ lọc
            </Button>
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
                Danh sách phòng
              </p>
            </div>
          }
          extra={
            <Space wrap>
              <Badge
                count={totalRooms}
                showZero
                color="#0f766e"
              />

              <Button
                icon={
                  <Shapes className="h-4 w-4" />
                }
                onClick={() =>
                  setRoomTypesOpen(true)
                }
              >
                Loại phòng
              </Button>

              <Button
                icon={
                  <Boxes className="h-4 w-4" />
                }
                onClick={() =>
                  setBulkOpen(true)
                }
              >
                Tạo nhiều
              </Button>

              <Button
                danger
                disabled={
                  selectedRoomIds.length ===
                  0
                }
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={() =>
                  setDeleteTarget({
                    mode: "selected",
                    ids: selectedRoomIds,
                    count:
                      selectedRoomIds.length,
                  })
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
                onClick={() =>
                  setCreateOpen(true)
                }
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
              x: 1165,
            }}
            rowSelection={{
              selectedRowKeys:
                selectedRoomIds,
              onChange: (
                selectedKeys,
              ) =>
                setSelectedRoomIds(
                  selectedKeys.map(String),
                ),
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

                openDetail(room.id);
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

      <RoomCreateModal
        open={createOpen}
        facilities={facilities}
        defaultFacilityId={
          facilityFilter ||
          initialFacilityId
        }
        onClose={() =>
          setCreateOpen(false)
        }
        onCreated={() => {
          setCreateOpen(false);
          setCurrentPage(1);
          refreshRooms();
        }}
      />

      <RoomEditModal
        open={Boolean(editingRoom)}
        room={editingRoom}
        facilities={facilities}
        onClose={() =>
          setEditingRoom(null)
        }
        onUpdated={(room) => {
          setEditingRoom(null);
          setDetailInitialRoom(room);
          refreshRooms();
        }}
      />

      <RoomDetailModal
        open={Boolean(detailRoomId)}
        roomId={detailRoomId}
        initialRoom={detailInitialRoom}
        onClose={() => {
          setDetailRoomId(null);
          setDetailInitialRoom(null);
        }}
        onEdit={(room) => {
          setDetailRoomId(null);
          setDetailInitialRoom(null);
          setEditingRoom(room);
        }}
        onDelete={(room) => {
          setDetailRoomId(null);
          setDetailInitialRoom(null);
          setDeleteTarget({
            mode: "single",
            room,
          });
        }}
      />

      <RoomDeleteModal
        open={Boolean(deleteTarget)}
        target={deleteTarget}
        onClose={() =>
          setDeleteTarget(null)
        }
        onDeleted={handleDeleted}
      />

      <RoomBulkCreateModal
        open={bulkOpen}
        facilities={facilities}
        defaultFacilityId={
          facilityFilter ||
          initialFacilityId
        }
        onClose={() =>
          setBulkOpen(false)
        }
        onCompleted={() => {
          setBulkOpen(false);
          setCurrentPage(1);
          refreshRooms();
        }}
      />

      <RoomTypeManagementModal
        open={roomTypesOpen}
        onClose={() =>
          setRoomTypesOpen(false)
        }
        onChanged={() => {
          setRoomTypeLookupReloadKey(
            (current) => current + 1,
          );
          refreshRooms();
        }}
      />
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