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
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Eye,
  PauseCircle,
  Pencil,
  PlayCircle,
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
  getFacility,
  getFacilities,
} from "@/management/features/facilities/facilities.api";
import {
  getRooms,
  getRoomTypeLookup,
  reactivateRoom,
  suspendRoom,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
  RoomStatus,
  RoomType,
} from "@/management/features/rooms/rooms.types";
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
const { TextArea } = Input;

type AuthRoleValue =
  | string
  | {
      name?: string | null;
    }
  | null
  | undefined;

type AuthFacilityAssignment = {
  facilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
};

type RoomAccessUser = {
  facilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
  staffProfile?: {
    facilityAssignments?:
      | AuthFacilityAssignment[]
      | null;
  } | null;
};

function readRoleName(
  role: AuthRoleValue,
) {
  return typeof role === "string"
    ? role
    : role?.name;
}

function normalizeRoles(
  values: AuthRoleValue[],
) {
  return new Set(
    values
      .map(readRoleName)
      .filter(
        (
          role,
        ): role is string =>
          Boolean(role),
      )
      .map((role) =>
        role.trim().toLowerCase(),
      ),
  );
}

type RoomStatusAction =
  | { mode: "suspend"; room: ClinicRoom }
  | { mode: "reactivate"; room: ClinicRoom }
  | null;

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
  const [modal, modalContextHolder] = Modal.useModal();
  const searchParams = useSearchParams();
  const roles = useAuthStore(
    (state) => state.roles,
  );
  const user = useAuthStore(
    (state) => state.user,
  );
  const activeFacilityId =
    useAuthStore(
      (state) =>
        state.activeFacilityId,
    );

  const authUser =
    user as unknown as
      | RoomAccessUser
      | null;

  const roomAccess = useMemo(() => {
    const globalRoles =
      normalizeRoles([
        ...(roles ?? []),
        ...(authUser?.roles ?? []),
      ]);

    if (
      globalRoles.has(
        "super_admin",
      )
    ) {
      return {
        canViewAllFacilities: true,
        canManage: false,
        facilityId: "",
      };
    }

    const assignments =
      authUser?.staffProfile
        ?.facilityAssignments ?? [];

    const assignedFacilityIds =
      new Set(
        assignments
          .map((assignment) =>
            String(
              assignment.facilityId ??
                "",
            ).trim(),
          )
          .filter(Boolean),
      );

    const directFacilityId =
      String(
        authUser?.facilityId ??
          "",
      ).trim();
    const requestedFacilityId =
      String(
        activeFacilityId ??
          "",
      ).trim();

    const requestedFacilityAllowed =
      Boolean(
        requestedFacilityId,
      ) &&
      (
        requestedFacilityId ===
          directFacilityId ||
        assignedFacilityIds.has(
          requestedFacilityId,
        )
      );

    const firstAdminAssignment =
      assignments.find(
        (assignment) =>
          normalizeRoles(
            assignment.roles ?? [],
          ).has("admin"),
      );

    const resolvedFacilityId =
      requestedFacilityAllowed
        ? requestedFacilityId
        : directFacilityId ||
          String(
            firstAdminAssignment
              ?.facilityId ??
              "",
          ).trim();

    const matchedAssignment =
      assignments.find(
        (assignment) =>
          String(
            assignment.facilityId ??
              "",
          ).trim() ===
          resolvedFacilityId,
      );

    const facilityRoles =
      normalizeRoles(
        matchedAssignment?.roles ??
          [],
      );

    const belongsToFacility =
      Boolean(
        resolvedFacilityId,
      ) &&
      (
        resolvedFacilityId ===
          directFacilityId ||
        Boolean(
          matchedAssignment,
        )
      );

    const hasAdminRole =
      facilityRoles.has("admin") ||
      (
        globalRoles.has("admin") &&
        resolvedFacilityId ===
          directFacilityId
      );

    return {
      canViewAllFacilities: false,
      canManage:
        belongsToFacility &&
        hasAdminRole,
      facilityId:
        belongsToFacility
          ? resolvedFacilityId
          : "",
    };
  }, [
    activeFacilityId,
    authUser,
    roles,
  ]);

  const canViewAllFacilities =
    roomAccess.canViewAllFacilities;
  const canManageRooms =
    roomAccess.canManage;
  const scopedFacilityId =
    roomAccess.facilityId;
  const requestedFacilityFilter =
    searchParams.get(
      "facilityId",
    ) || undefined;

  const [facilities, setFacilities] =
    useState<FacilityOption[]>([]);

  const managedFacilities = useMemo(
    () =>
      canManageRooms
        ? facilities.filter(
            (facility) =>
              String(
                facility.id,
              ) ===
              scopedFacilityId,
          )
        : [],
    [
      canManageRooms,
      facilities,
      scopedFacilityId,
    ],
  );

  function canManageRoom(
    room: ClinicRoom,
  ) {
    return Boolean(
      canManageRooms &&
      scopedFacilityId &&
      String(
        room.facilityId,
      ) ===
        scopedFacilityId,
    );
  }
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
      requestedFacilityFilter,
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
    useState(5);
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
  const [statusAction, setStatusAction] =
    useState<RoomStatusAction>(null);
  const [statusReason, setStatusReason] =
    useState("");
  const [
    statusInactiveUntil,
    setStatusInactiveUntil,
  ] = useState("");
  const [
    statusActionLoading,
    setStatusActionLoading,
  ] = useState(false);

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

    if (
      !canViewAllFacilities &&
      !scopedFacilityId
    ) {
      const timer =
        window.setTimeout(() => {
          setFacilities([]);
        }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    const facilityRequest =
      canViewAllFacilities
        ? getFacilities()
        : getFacility(
            scopedFacilityId,
          ).then((facility) => [
            facility,
          ]);

    const timer = window.setTimeout(() => {
      void facilityRequest
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
  }, [
    canViewAllFacilities,
    scopedFacilityId,
  ]);

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

    if (
      !canViewAllFacilities &&
      !scopedFacilityId
    ) {
      const emptyTimer =
        window.setTimeout(() => {
          setRooms([]);
          setTotalRooms(0);
          setLoading(false);
        }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(
          emptyTimer,
        );
      };
    }

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
        facilityId:
          canViewAllFacilities
            ? facilityFilter
            : scopedFacilityId,
      });

      void request
        .then((result) => {
          if (cancelled) return;

          setRooms(result.items);
          setTotalRooms(result.total);
          setError(null);
        })
        .catch((loadError) => {
          if (cancelled) return;

          setRooms([]);
          setTotalRooms(0);
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
    canViewAllFacilities,
    currentPage,
    debouncedSearch,
    facilityFilter,
    floorFilter,
    pageSize,
    reloadKey,
    roomTypeIdFilter,
    scopedFacilityId,
    statusFilter,
  ]);

  const tableRooms = useMemo(() => {
    if (
      rooms.length <= pageSize
    ) {
      return rooms;
    }

    const backendReturnedFullList =
      totalRooms > 0 &&
      rooms.length >= totalRooms;

    if (
      backendReturnedFullList
    ) {
      const offset =
        (currentPage - 1) *
        pageSize;

      return rooms.slice(
        offset,
        offset + pageSize,
      );
    }

    return rooms.slice(
      0,
      pageSize,
    );
  }, [
    currentPage,
    pageSize,
    rooms,
    totalRooms,
  ]);

  const roomById = useMemo(
    () =>
      new Map(
        tableRooms.map((room) => [
          room.id,
          room,
        ]),
      ),
    [tableRooms],
  );

  function refreshRooms() {
    setReloadKey(
      (current) => current + 1,
    );
  }

  function openStatusAction(
    action: RoomStatusAction,
  ) {
    if (
      !action ||
      !canManageRoom(action.room)
    ) {
      return;
    }

    setStatusAction(action);
    setStatusReason("");
    setStatusInactiveUntil("");
  }

  function closeStatusAction() {
    if (statusActionLoading) return;

    setStatusAction(null);
    setStatusReason("");
    setStatusInactiveUntil("");
  }

  function toIsoDateTime(value: string) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString();
  }

  function updateRoomInState(
    updatedRoom: ClinicRoom,
  ) {
    setRooms((current) =>
      current.map((room) =>
        room.id === updatedRoom.id
          ? updatedRoom
          : room,
      ),
    );
    setEditingRoom((current) =>
      current?.id === updatedRoom.id
        ? updatedRoom
        : current,
    );
    setDetailInitialRoom((current) =>
      current?.id === updatedRoom.id
        ? updatedRoom
        : current,
    );
  }

  async function handleConfirmStatusAction() {
    if (
      !statusAction ||
      !canManageRoom(
        statusAction.room,
      )
    ) {
      return;
    }

    setStatusActionLoading(true);
    setLoading(true);
    setError(null);

    try {
      if (statusAction.mode === "suspend") {
        const response = await suspendRoom(statusAction.room.id, {
          inactiveUntil: toIsoDateTime(statusInactiveUntil),
          reason: statusReason,
        });
        updateRoomInState(response.data.room);

        modal.success({
          title: "Đã tạm ngưng phòng",
          content: `Ca trực bị hủy: ${response.data.impact.cancelledShifts ?? 0}. Lịch hẹn bị ảnh hưởng: ${response.data.impact.affectedAppointments ?? 0}.`,
          centered: true,
        });
      } else {
        const response = await reactivateRoom(statusAction.room.id);
        updateRoomInState(response.data.room);

        modal.success({
          title: "Đã mở lại phòng",
          content: "Phòng đã được chuyển về trạng thái hoạt động.",
          centered: true,
        });
      }

      setStatusAction(null);
      setStatusReason("");
      setStatusInactiveUntil("");
      refreshRooms();
    } catch (statusError) {
      const message = getErrorMessage(statusError);
      setError(message);
      modal.error({
        title: "Không thể cập nhật trạng thái phòng",
        content: message,
        centered: true,
      });
    } finally {
      setStatusActionLoading(false);
      setLoading(false);
    }
  }

  function resetFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    if (canViewAllFacilities) {
      setFacilityFilter(undefined);
    }

    setFloorFilter(undefined);
    setRoomTypeIdFilter(undefined);
    setStatusFilter(undefined);
    setCurrentPage(1);
  }

  function openDetail(
    roomId: string,
  ) {
    const room =
      roomById.get(roomId);

    if (
      !room ||
      (
        !canViewAllFacilities &&
        String(
          room.facilityId,
        ) !==
          scopedFacilityId
      )
    ) {
      return;
    }

    setDetailInitialRoom(room);
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
    if (
      tableRooms.length <=
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
      ellipsis: true,
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
      width: 160,
      ellipsis: true,
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
      ellipsis: true,
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
      width: 90,
      align: "center",
      render: (floor: string) =>
        floor || "Chưa cập nhật",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      align: "center",
      render: (status: RoomStatus) =>
        renderStatus(status),
    },
    {
      title: "Thao tác",
      width: canManageRooms
        ? 185
        : 80,
      align: "center",
      render: (_value, room) => {
        const canManageCurrentRoom =
          canManageRoom(room);

        return (
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

            {canManageCurrentRoom ? (
              <>
                <Tooltip title="Cập nhật">
                  <Button
                    icon={
                      <Pencil className="h-4 w-4" />
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingRoom(
                        room,
                      );
                    }}
                  />
                </Tooltip>

                <Tooltip
                  title={
                    room.status === "active"
                      ? "Tạm ngưng phòng"
                      : "Mở lại phòng"
                  }
                >
                  <Button
                    icon={
                      room.status === "active" ? (
                        <PauseCircle className="h-4 w-4" />
                      ) : (
                        <PlayCircle className="h-4 w-4" />
                      )
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      openStatusAction({
                        mode:
                          room.status ===
                          "active"
                            ? "suspend"
                            : "reactivate",
                        room,
                      });
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
              </>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <AdminLayout
      roles={["super_admin", "admin"]}
      permissions={["user.view"]}
    >
      {modalContextHolder}
      <PageHeader
        title="Quản lý phòng"
        description="Quản lý phòng, loại phòng và dữ liệu phòng theo từng cơ sở."
      />

      <Modal
        open={
          canManageRooms &&
          Boolean(statusAction)
        }
        title={
          statusAction?.mode === "suspend"
            ? `Tạm ngưng phòng ${statusAction.room.roomName}`
            : `Mở lại phòng ${statusAction?.room.roomName ?? ""}`
        }
        okText={
          statusAction?.mode === "suspend"
            ? "Tạm ngưng"
            : "Mở lại"
        }
        cancelText="Hủy"
        confirmLoading={statusActionLoading}
        onCancel={closeStatusAction}
        onOk={handleConfirmStatusAction}
        centered
      >
        {statusAction?.mode === "suspend" ? (
          <Space
            direction="vertical"
            className="w-full"
            size={12}
          >
            <div>
              <Text strong>Lý do</Text>
              <TextArea
                className="mt-2"
                rows={3}
                value={statusReason}
                placeholder="Ví dụ: Bảo trì phòng"
                onChange={(event) =>
                  setStatusReason(event.target.value)
                }
              />
            </div>
            <div>
              <Text strong>Tạm ngưng đến</Text>
              <Input
                className="mt-2"
                type="datetime-local"
                value={statusInactiveUntil}
                onChange={(event) =>
                  setStatusInactiveUntil(
                    event.target.value,
                  )
                }
              />
              <Text
                type="secondary"
                className="mt-1 block text-xs"
              >
                Bỏ trống nếu tạm ngưng vô thời hạn. Hệ thống sẽ hủy ca trực tương lai trong khoảng tạm ngưng và chỉ ghi nhận lịch hẹn bị ảnh hưởng.
              </Text>
            </div>
          </Space>
        ) : (
          <Text>
            Phòng sẽ được chuyển về trạng thái hoạt động. Các ca trực đã bị hủy trước đó sẽ không tự khôi phục.
          </Text>
        )}
      </Modal>

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

        <Card className="border-slate-200 bg-white">
          <div
            className={`grid items-end gap-3 sm:grid-cols-2 ${
              canViewAllFacilities
                ? "lg:grid-cols-6"
                : "lg:grid-cols-5"
            }`}
          >
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

            {canViewAllFacilities ? (
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={facilityFilter}
                placeholder="Tất cả cơ sở"
                options={facilities.map(
                  (facility) => ({
                    value:
                      facility.id,
                    label:
                      facility.name,
                  }),
                )}
                onChange={(value) => {
                  setFacilityFilter(
                    value,
                  );
                  setCurrentPage(1);
                }}
              />
            ) : null}

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

              {canManageRooms ? (
                <>
                  <Button
                    icon={
                      <Shapes className="h-4 w-4" />
                    }
                    onClick={() =>
                      setRoomTypesOpen(
                        true,
                      )
                    }
                  >
                    Loại phòng
                  </Button>

                  <Button
                    type="primary"
                    icon={
                      <Plus className="h-4 w-4" />
                    }
                    onClick={() =>
                      setBulkOpen(true)
                    }
                  >
                    Thêm phòng
                  </Button>
                </>
              ) : null}
            </Space>
          }
        >
          <Table
            className="management-table [&_.ant-table-cell]:px-3"
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading}
            columns={columns}
            dataSource={tableRooms}
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
                  target.closest("a")
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
                5,
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

      {canManageRooms ? (
        <RoomEditModal
          open={Boolean(
            editingRoom,
          )}
          room={editingRoom}
          facilities={
            managedFacilities
          }
          onClose={() =>
            setEditingRoom(null)
          }
          onUpdated={(room) => {
            setEditingRoom(null);
            setDetailInitialRoom(
              room,
            );
            refreshRooms();
          }}
        />
      ) : null}

      <RoomDetailModal
        open={Boolean(detailRoomId)}
        roomId={detailRoomId}
        initialRoom={detailInitialRoom}
        canManage={
          detailInitialRoom
            ? canManageRoom(
                detailInitialRoom,
              )
            : false
        }
        allowedFacilityId={
          canViewAllFacilities
            ? undefined
            : scopedFacilityId
        }
        onClose={() => {
          setDetailRoomId(null);
          setDetailInitialRoom(null);
        }}
        onEdit={(room) => {
          if (!canManageRoom(room)) {
            return;
          }

          setDetailRoomId(null);
          setDetailInitialRoom(null);
          setEditingRoom(room);
        }}
        onDelete={(room) => {
          if (!canManageRoom(room)) {
            return;
          }

          setDetailRoomId(null);
          setDetailInitialRoom(null);
          setDeleteTarget({
            mode: "single",
            room,
          });
        }}
      />

      {canManageRooms ? (
        <RoomDeleteModal
          open={Boolean(
            deleteTarget,
          )}
          target={deleteTarget}
          onClose={() =>
            setDeleteTarget(null)
          }
          onDeleted={handleDeleted}
        />
      ) : null}

      {canManageRooms ? (
        <RoomBulkCreateModal
          open={bulkOpen}
          facilities={
            managedFacilities
          }
          defaultFacilityId={
            scopedFacilityId
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
      ) : null}

      {canManageRooms ? (
        <RoomTypeManagementModal
          open={roomTypesOpen}
          onClose={() =>
            setRoomTypesOpen(
              false,
            )
          }
          onChanged={() => {
            setRoomTypeLookupReloadKey(
              (current) =>
                current + 1,
            );
            refreshRooms();
          }}
        />
      ) : null}
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
