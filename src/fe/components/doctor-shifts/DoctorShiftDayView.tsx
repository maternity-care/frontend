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
import type {
  ColumnsType,
} from "antd/es/table";
import {
  Eye,
  Pencil,
  Stethoscope,
  Trash2,
} from "lucide-react";
import type {
  DoctorShiftItem,
  DoctorShiftStatus,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
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
  doctorById: Map<
    string,
    DoctorOption
  >;
  facilityById: Map<
    string,
    FacilityOption
  >;
  roomById: Map<
    string,
    RoomOption
  >;
  canManageShift: (
    shift: DoctorShiftItem,
  ) => boolean;
  onOpenDetail: (
    shift: DoctorShiftItem,
  ) => void;
  onEdit: (
    shift: DoctorShiftItem,
  ) => void;
  onDelete: (
    shift: DoctorShiftItem,
  ) => void;
  onCreate: () => void;
};

/**
 * Day View được tối ưu cho danh sách lớn:
 *
 * - Bỏ cột "Ngày trực" vì tất cả bản ghi trong view đã cùng selectedDate.
 * - Dùng table size="small" để giảm chiều cao mỗi row.
 * - Bảng có scroll dọc 560px và header cố định.
 * - Dùng chiều rộng số thay vì % để các cột không bị co giãn khó đọc.
 */
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
  const columns:
    ColumnsType<DoctorShiftItem> = [
    {
      title: "STT",
      width: 58,
      align: "center",
      render: (
        _value,
        _record,
        index,
      ) => index + 1,
    },
    {
      title: "Ca trực",
      width: 190,
      onCell: (
        shift,
        index,
      ) => {
        const group =
          groupMeta[
            index ?? 0
          ];

        return {
          rowSpan:
            group?.rowSpan ??
            1,
          className:
            group?.rowSpan ===
            0
              ? undefined
              : getDayShiftMergedCellClass(
                  shift.startTime,
                ),
        };
      },
      render: (
        _value,
        shift,
        index,
      ) => {
        const group =
          groupMeta[index];

        return (
          <div className="min-w-0 py-0.5">
            <Text
              strong
              className="block truncate text-[13px] text-slate-950"
              title={
                shift.slotName ||
                shift.slotCode ||
                getDoctorShiftShortLabel(
                  shift.startTime,
                )
              }
            >
              {shift.slotName ||
                shift.slotCode ||
                getDoctorShiftShortLabel(
                  shift.startTime,
                )}
            </Text>

            <Text className="mt-0.5 block text-[11px] font-semibold text-slate-700">
              {shift.startTime} -{" "}
              {shift.endTime}
            </Text>

            {shift.slotCode &&
            shift.slotName ? (
              <Text
                type="secondary"
                className="mt-0.5 block truncate text-[10px]"
              >
                {shift.slotCode}
              </Text>
            ) : null}

            <Tooltip
              title={
                shift.facilityName ||
                facilityById.get(
                  shift.facilityId,
                )?.name ||
                "Chưa cập nhật cơ sở"
              }
            >
              <Text
                type="secondary"
                className="mt-1 block truncate text-[10px]"
              >
                {shift.facilityName ||
                  facilityById.get(
                    shift.facilityId,
                  )?.name ||
                  "Chưa cập nhật cơ sở"}
              </Text>
            </Tooltip>

            {group?.rowSpan &&
            group.rowSpan > 1 ? (
              <Tag
                color="blue"
                className="!mt-1 !mr-0 !text-[10px]"
              >
                {group.rowSpan} bác sĩ
              </Tag>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Bác sĩ",
      width: 245,
      render: (
        _value,
        shift,
      ) => {
        const doctor =
          doctorById.get(
            shift.doctorId,
          );

        const doctorName =
          shift.doctorName ||
          doctor?.name ||
          `#${shift.doctorId}`;

        const doctorTitle =
          shift.doctorTitle ||
          doctor?.title ||
          "Bác sĩ";

        const specialty =
          shift.doctorSpecialty ||
          doctor?.specialty ||
          "Chưa cập nhật";

        return (
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <Stethoscope className="h-3.5 w-3.5" />
            </span>

            <div className="min-w-0">
              <Tooltip
                title={`${doctorTitle} ${doctorName}`}
              >
                <Text
                  strong
                  className="block truncate text-[13px]"
                >
                  {doctorTitle}{" "}
                  {doctorName}
                </Text>
              </Tooltip>

              <Tooltip
                title={specialty}
              >
                <Text
                  type="secondary"
                  className="block truncate text-[11px]"
                >
                  {specialty}
                </Text>
              </Tooltip>
            </div>
          </div>
        );
      },
    },
    {
      title: "Cơ sở / Phòng",
      width: 250,
      render: (
        _value,
        shift,
      ) => {
        const facilityName =
          shift.facilityName ||
          facilityById.get(
            shift.facilityId,
          )?.name ||
          "Chưa cập nhật";

        const room =
          roomById.get(
            shift.roomId,
          );

        const roomName =
          shift.roomName ||
          room?.name ||
          "Chưa cập nhật";

        const roomText =
          room?.floor
            ? `${roomName} · ${room.floor}`
            : roomName;

        return (
          <div className="min-w-0">
            <Tooltip
              title={
                facilityName
              }
            >
              <Text
                strong
                className="block truncate text-[13px]"
              >
                {facilityName}
              </Text>
            </Tooltip>

            <Tooltip
              title={roomText}
            >
              <Text
                type="secondary"
                className="block truncate text-[11px]"
              >
                {roomText}
              </Text>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex:
        "status",
      width: 145,
      align: "center",
      render: (
        _status:
          DoctorShiftStatus,
        shift,
      ) => (
        <div>
          {renderDoctorShiftStatus(
            shift.status,
          )}

          <Text
            type="secondary"
            className="mt-0.5 block whitespace-nowrap text-[10px]"
          >
            {
              shift.bookedAppointments
            }
            /
            {
              shift.maxAppointments
            }{" "}
            đã đặt
          </Text>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width:
        canManage
          ? 132
          : 72,
      fixed: "right",
      align: "center",
      render: (
        _value,
        shift,
      ) => {
        const manageable =
          canManageShift(
            shift,
          );

        return (
          <Space size={4}>
            <Tooltip title="Xem chi tiết">
              <Button
                size="small"
                icon={
                  <Eye className="h-4 w-4" />
                }
                onClick={(
                  event,
                ) => {
                  event.stopPropagation();

                  onOpenDetail(
                    shift,
                  );
                }}
              />
            </Tooltip>

            {manageable ? (
              <>
                <Tooltip title="Cập nhật">
                  <Button
                    size="small"
                    icon={
                      <Pencil className="h-4 w-4" />
                    }
                    onClick={(
                      event,
                    ) => {
                      event.stopPropagation();

                      onEdit(
                        shift,
                      );
                    }}
                  />
                </Tooltip>

                <Tooltip title="Xóa ca trực">
                  <Button
                    danger
                    size="small"
                    icon={
                      <Trash2 className="h-4 w-4" />
                    }
                    onClick={(
                      event,
                    ) => {
                      event.stopPropagation();

                      onDelete(
                        shift,
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
        <div>
          <p className="mb-0 text-base font-semibold text-slate-950">
            Danh sách ca trực ngày{" "}
            {formatDoctorShiftShortDate(
              selectedDate,
            )}
          </p>

          <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
            Danh sách được cuộn bên trong để vẫn dễ theo dõi khi có nhiều ca trực.
          </p>
        </div>
      }
      extra={
        <Text type="secondary">
          {shifts.length} ca trong ngày ·{" "}
          {total} ca phù hợp
        </Text>
      }
    >
      <Table
        rowKey="id"
        size="small"
        tableLayout="fixed"
        sticky
        loading={loading}
        columns={columns}
        dataSource={shifts}
        pagination={false}
        scroll={{
          x: canManage
            ? 1020
            : 960,
          y: 560,
        }}
        locale={{
          emptyText: (
            <Empty
              image={
                Empty.PRESENTED_IMAGE_SIMPLE
              }
              description="Không có ca trực phù hợp trong ngày này."
            >
              {canManage ? (
                <Button
                  type="primary"
                  onClick={onCreate}
                >
                  Thêm ca trực
                </Button>
              ) : null}
            </Empty>
          ),
        }}
        rowClassName={(
          _shift,
          index,
        ) => {
          const group =
            groupMeta[index];

          return [
            "cursor-pointer",
            group?.isFirstRow &&
            index > 0
              ? "[&>td]:border-t-2 [&>td]:border-t-slate-300"
              : "",
            group?.groupIndex %
              2 ===
            1
              ? "[&>td]:bg-slate-50/35"
              : "",
          ]
            .filter(Boolean)
            .join(" ");
        }}
        onRow={(shift) => ({
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

            onOpenDetail(
              shift,
            );
          },
        })}
        className="management-table [&_.ant-table-cell]:!px-2.5 [&_.ant-table-cell]:!py-2"
      />
    </Card>
  );
}