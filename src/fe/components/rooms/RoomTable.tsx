"use client";

import type {
  ColumnsType,
} from "antd/es/table";
import {
  Badge,
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Eye,
  Pencil,
  Plus,
  Shapes,
  Trash2,
} from "lucide-react";
import type {
  ClinicRoom,
  RoomStatus,
} from "@/management/features/rooms/rooms.types";
import {
  getRoomStatusLabel,
} from "@/management/features/rooms/rooms.utils";

const { Text } = Typography;

type Props = {
  rooms: ClinicRoom[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  canManageRooms: boolean;
  canManageRoom: (
    room: ClinicRoom,
  ) => boolean;
  onView: (
    room: ClinicRoom,
  ) => void;
  onEdit: (
    room: ClinicRoom,
  ) => void;
  onDelete: (
    room: ClinicRoom,
  ) => void;
  onOpenRoomTypes: () => void;
  onCreate: () => void;
  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
};

export function RoomTable({
  rooms,
  loading,
  currentPage,
  pageSize,
  total,
  canManageRooms,
  canManageRoom,
  onView,
  onEdit,
  onDelete,
  onOpenRoomTypes,
  onCreate,
  onPageChange,
}: Props) {
  const columns:
    ColumnsType<ClinicRoom> = [
    {
      title: "STT",
      width: 65,
      align: "center",
      render:
        (
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
      dataIndex:
        "roomName",
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
      dataIndex:
        "roomTypeName",
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
      render: (
        _value,
        room,
      ) => (
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
      render: (
        floor: string,
      ) =>
        floor ||
        "Chưa cập nhật",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      align: "center",
      render: (
        status: RoomStatus,
      ) => (
        <Tag
          color={
            status ===
            "active"
              ? "green"
              : "default"
          }
        >
          {getRoomStatusLabel(
            status,
          )}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      width:
        canManageRooms
          ? 145
          : 80,
      align: "center",
      render: (
        _value,
        room,
      ) => {
        const manageable =
          canManageRoom(room);

        return (
          <Space size={6}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={
                  <Eye className="h-4 w-4" />
                }
                onClick={(
                  event,
                ) => {
                  event.stopPropagation();
                  onView(room);
                }}
              />
            </Tooltip>

            {manageable ? (
              <>
                <Tooltip title="Cập nhật">
                  <Button
                    icon={
                      <Pencil className="h-4 w-4" />
                    }
                    onClick={(
                      event,
                    ) => {
                      event.stopPropagation();
                      onEdit(room);
                    }}
                  />
                </Tooltip>

                <Tooltip title="Xóa">
                  <Button
                    danger
                    icon={
                      <Trash2 className="h-4 w-4" />
                    }
                    onClick={(
                      event,
                    ) => {
                      event.stopPropagation();
                      onDelete(room);
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
    <Card
      className="overflow-hidden border-slate-200 bg-white"
      styles={{
        body: {
          padding: 0,
        },
      }}
      title={
        <p className="mb-0 text-base font-semibold text-slate-950">
          Danh sách phòng
        </p>
      }
      extra={
        <Space wrap>
          <Badge
            count={total}
            showZero
            color="#0f766e"
          />

          {canManageRooms ? (
            <>
              <Button
                icon={
                  <Shapes className="h-4 w-4" />
                }
                onClick={
                  onOpenRoomTypes
                }
              >
                Loại phòng
              </Button>

              <Button
                type="primary"
                icon={
                  <Plus className="h-4 w-4" />
                }
                onClick={onCreate}
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
        dataSource={rooms}
        onRow={(room) => ({
          className:
            "cursor-pointer",
          onClick: (
            event,
          ) => {
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

            onView(room);
          },
        })}
        pagination={{
          current:
            currentPage,
          pageSize,
          total,
          showSizeChanger:
            true,
          pageSizeOptions: [
            5,
            10,
            20,
            50,
            100,
          ],
          showQuickJumper:
            true,
          showTotal: (
            totalValue,
            range,
          ) =>
            `Hiển thị ${range[0]} - ${range[1]} trong tổng ${totalValue} phòng`,
          onChange:
            onPageChange,
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
  );
}
