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
  Moon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  SHIFT_SLOT_DAY_LABELS,
} from "@/management/features/shift-slots/shift-slots.constants";
import type {
  ShiftSlot,
  ShiftSlotFacilityOption,
  ShiftSlotStatus,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  getShiftSlotStatusLabel,
} from "@/management/features/shift-slots/shift-slots.utils";

const { Text } =
  Typography;

type Props = {
  slots: ShiftSlot[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  canManageSlots: boolean;
  canManageSlot: (
    slot: ShiftSlot,
  ) => boolean;
  facilityById: Map<
    string,
    ShiftSlotFacilityOption
  >;
  onView: (
    slot: ShiftSlot,
  ) => void;
  onEdit: (
    slot: ShiftSlot,
  ) => void;
  onDelete: (
    slot: ShiftSlot,
  ) => void;
  onCreate: () => void;
  onPageChange: (
    page: number,
    pageSize: number,
  ) => void;
};

export function ShiftSlotTable({
  slots,
  loading,
  currentPage,
  pageSize,
  total,
  canManageSlots,
  canManageSlot,
  facilityById,
  onView,
  onEdit,
  onDelete,
  onCreate,
  onPageChange,
}: Props) {
  const columns:
    ColumnsType<ShiftSlot> = [
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
      title: "Khung ca",
      width: 220,
      render: (
        _value,
        slot,
      ) => (
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
      width: 230,
      render: (
        _value,
        slot,
      ) => {
        const facility =
          facilityById.get(
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
      width: 175,
      sorter: (
        first,
        second,
      ) =>
        first.startTime.localeCompare(
          second.startTime,
        ),
      render: (
        _value,
        slot,
      ) => (
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
      title: "Ngày áp dụng",
      width: 180,
      render: (
        _value,
        slot,
      ) =>
        slot.applicableDays
          .length > 0 ? (
          <Space
            size={4}
            wrap
          >
            {slot.applicableDays.map(
              (day) => (
                <Tag
                  key={day}
                  color="blue"
                >
                  {
                    SHIFT_SLOT_DAY_LABELS[
                      day
                    ]
                  }
                </Tag>
              ),
            )}
          </Space>
        ) : (
          <Text type="secondary">
            Tự tính
          </Text>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex:
        "status",
      width: 140,
      align: "center",
      render: (
        status: ShiftSlotStatus,
      ) => (
        <Tag
          color={
            status ===
            "active"
              ? "green"
              : "red"
          }
        >
          {getShiftSlotStatusLabel(
            status,
          )}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width:
        canManageSlots
          ? 150
          : 80,
      align: "center",
      render: (
        _value,
        slot,
      ) => {
        const manageable =
          canManageSlot(
            slot,
          );

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
                  onView(
                    slot,
                  );
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
                      onEdit(
                        slot,
                      );
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
                      onDelete(
                        slot,
                      );
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
          Danh sách khung ca
        </p>
      }
      extra={
        <Space wrap>
          <Badge
            count={total}
            showZero
            color="#0f766e"
          />

          {canManageSlots ? (
            <Button
              type="primary"
              icon={
                <Plus className="h-4 w-4" />
              }
              onClick={
                onCreate
              }
            >
              Thêm khung ca
            </Button>
          ) : null}
        </Space>
      }
    >
      <Table
        rowKey="id"
        size="middle"
        tableLayout="fixed"
        loading={loading}
        columns={columns}
        dataSource={slots}
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
            30,
            50,
          ],
          showQuickJumper:
            true,
          showTotal: (
            totalValue,
            range,
          ) =>
            `Hiển thị ${range[0]} - ${range[1]} trong tổng ${totalValue} khung ca`,
          onChange:
            onPageChange,
        }}
        locale={{
          emptyText: (
            <Empty
              image={
                Empty.PRESENTED_IMAGE_SIMPLE
              }
              description="Không có khung ca phù hợp."
            >
              {canManageSlots ? (
                <Button
                  type="primary"
                  onClick={
                    onCreate
                  }
                >
                  Thêm khung ca
                </Button>
              ) : null}
            </Empty>
          ),
        }}
        onRow={(slot) => ({
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
              target.closest(
                "a",
              )
            ) {
              return;
            }

            onView(slot);
          },
        })}
        className="management-table [&_.ant-table-cell]:px-3"
      />
    </Card>
  );
}
