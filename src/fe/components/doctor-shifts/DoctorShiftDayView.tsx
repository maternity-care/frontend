"use client";

import {
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Eye, Pencil, Stethoscope, Trash2 } from "lucide-react";
import type { DoctorShiftItem, DoctorShiftStatus } from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DayShiftGroupMeta,
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import {
  formatDoctorShiftShortDate,
  getDayShiftMergedCellClass,
  getDoctorShiftShortLabel,
  parseDoctorShiftDateKey,
  renderDoctorShiftStatus,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";

const { Text } = Typography;

type Props = {
  selectedDate: string;
  shifts: DoctorShiftItem[];
  groupMeta: DayShiftGroupMeta[];
  loading: boolean;
  total: number;
  canManage: boolean;
  doctorById: Map<string, DoctorOption>;
  facilityById: Map<string, FacilityOption>;
  roomById: Map<string, RoomOption>;
  canManageShift: (shift: DoctorShiftItem) => boolean;
  onOpenDetail: (shift: DoctorShiftItem) => void;
  onEdit: (shift: DoctorShiftItem) => void;
  onDelete: (shift: DoctorShiftItem) => void;
  onCreate: () => void;
};

export function DoctorShiftDayView({
  selectedDate,
  shifts,
  groupMeta,
  loading,
  total,
  canManage,
  doctorById,
  facilityById,
  roomById,
  canManageShift,
  onOpenDetail,
  onEdit,
  onDelete,
  onCreate,
}: Props) {
  const columns: ColumnsType<DoctorShiftItem> = [
    {
      title: "STT",
      width: "5%",
      align: "center",
      render: (_value, _record, index) => index + 1,
    },
    {
      title: "Ca trực",
      width: "18%",
      onCell: (shift, index) => {
        const group = groupMeta[index ?? 0];
        return {
          rowSpan: group?.rowSpan ?? 1,
          className:
            group?.rowSpan === 0
              ? undefined
              : getDayShiftMergedCellClass(shift.startTime),
        };
      },
      render: (_value, shift, index) => {
        const group = groupMeta[index];
        return (
          <div className="min-w-0 py-1">
            <Text strong className="block truncate text-sm text-slate-950">
              {shift.slotName || shift.slotCode || getDoctorShiftShortLabel(shift.startTime)}
            </Text>
            <Text className="mt-1 block truncate text-xs font-semibold text-slate-700">
              {shift.startTime} - {shift.endTime}
            </Text>
            {shift.slotCode && shift.slotName ? (
              <Text type="secondary" className="mt-1 block truncate text-xs">
                {shift.slotCode}
              </Text>
            ) : null}
            <Text type="secondary" className="mt-2 block truncate text-xs">
              {shift.facilityName || facilityById.get(shift.facilityId)?.name || "Chưa cập nhật cơ sở"}
            </Text>
            {group?.rowSpan && group.rowSpan > 1 ? (
              <Tag color="blue" className="mt-2 max-w-full truncate">
                {group.rowSpan} bác sĩ
              </Tag>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Ngày trực",
      dataIndex: "shiftDate",
      width: "12%",
      sorter: (first, second) => first.shiftDate.localeCompare(second.shiftDate),
      render: (value: string) => (
        <div>
          <Text strong>{formatDoctorShiftShortDate(value)}</Text>
          <Text type="secondary" className="block text-xs">
            {new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(
              parseDoctorShiftDateKey(value),
            )}
          </Text>
        </div>
      ),
    },
    {
      title: "Bác sĩ",
      width: "20%",
      render: (_value, shift) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <Stethoscope className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <Text strong className="block truncate">
              {shift.doctorTitle || doctorById.get(shift.doctorId)?.title || "Bác sĩ"}{" "}
              {shift.doctorName || doctorById.get(shift.doctorId)?.name || `#${shift.doctorId}`}
            </Text>
            <Text type="secondary" className="block truncate text-xs">
              {shift.doctorSpecialty || doctorById.get(shift.doctorId)?.specialty || "Chưa cập nhật"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Cơ sở / Phòng",
      width: "20%",
      render: (_value, shift) => (
        <div className="min-w-0">
          <Text strong className="block truncate">
            {shift.facilityName || facilityById.get(shift.facilityId)?.name || "Chưa cập nhật"}
          </Text>
          <Text type="secondary" className="block truncate text-xs">
            {shift.roomName || roomById.get(shift.roomId)?.name || "Chưa cập nhật"}
            {roomById.get(shift.roomId)?.floor
              ? ` · ${roomById.get(shift.roomId)?.floor}`
              : ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: "11%",
      align: "center",
      render: (_status: DoctorShiftStatus, shift) => (
        <div className="space-y-1">
          {renderDoctorShiftStatus(shift.status)}
          <Text type="secondary" className="block text-xs">
            {shift.bookedAppointments}/{shift.maxAppointments} đã đặt
          </Text>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: canManage ? "14%" : "8%",
      align: "center",
      render: (_value, shift) => {
        const manageable = canManageShift(shift);
        return (
          <Space size={4}>
            <Tooltip title="Xem chi tiết">
              <Button
                size="small"
                icon={<Eye className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDetail(shift);
                }}
              />
            </Tooltip>

            {manageable ? (
              <>
                <Tooltip title="Cập nhật">
                  <Button
                    size="small"
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(shift);
                    }}
                  />
                </Tooltip>
                <Tooltip title="Xóa ca trực">
                  <Button
                    danger
                    size="small"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(shift);
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
      styles={{ body: { padding: 0 } }}
      title={
        <div>
          <p className="mb-0 text-base font-semibold text-slate-950">
            Danh sách ca trực ngày {formatDoctorShiftShortDate(selectedDate)}
          </p>
          <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
            Bấm vào một dòng để xem chi tiết.
          </p>
        </div>
      }
      extra={<Text type="secondary">{total} ca trực phù hợp</Text>}
    >
      <Table
        rowKey="id"
        size="middle"
        tableLayout="fixed"
        loading={loading}
        columns={columns}
        dataSource={shifts}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có ca trực phù hợp trong ngày này."
            >
              {canManage ? (
                <Button type="primary" onClick={onCreate}>
                  Thêm ca trực
                </Button>
              ) : null}
            </Empty>
          ),
        }}
        rowClassName={(_shift, index) => {
          const group = groupMeta[index];
          return [
            "cursor-pointer",
            group?.isFirstRow && index > 0
              ? "[&>td]:border-t-2 [&>td]:border-t-slate-300"
              : "",
            group?.groupIndex % 2 === 1 ? "[&>td]:bg-slate-50/35" : "",
          ]
            .filter(Boolean)
            .join(" ");
        }}
        onRow={(shift) => ({
          onClick: (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("button") || target.closest("a")) return;
            onOpenDetail(shift);
          },
        })}
        className="management-table [&_.ant-table-cell]:px-3"
      />
    </Card>
  );
}
