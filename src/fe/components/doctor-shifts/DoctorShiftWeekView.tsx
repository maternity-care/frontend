"use client";

import {
  Button,
  Card,
  Empty,
  Tooltip,
  Typography,
} from "antd";
import {
  ChevronRight,
} from "lucide-react";
import type {
  DoctorShiftItem,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DoctorOption,
  RoomOption,
  WeeklyScheduleRow,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import {
  DOCTOR_SHIFT_WEEKDAY_LABELS,
} from "@/management/features/doctor-shifts/doctor-shifts.constants";
import {
  DOCTOR_SHIFT_TODAY,
  getDoctorShiftAccent,
  toDoctorShiftDateKey,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";

const { Text } = Typography;

/**
 * Chỉ preview tối đa 2 lịch trong mỗi ô tuần.
 *
 * Khi số bác sĩ tăng nhiều, toàn bộ lịch vẫn còn trong dữ liệu,
 * nhưng UI không kéo chiều cao của một hàng lên vô hạn.
 * Người dùng bấm "+ N lịch khác" để chuyển sang màn ngày và xem đầy đủ.
 */
const MAX_VISIBLE_SHIFTS_PER_CELL = 2;

type Props = {
  weekDays: Date[];
  rows: WeeklyScheduleRow[];
  total: number;
  facilityFilter?: string;
  canManage: boolean;
  doctorById: Map<string, DoctorOption>;
  roomById: Map<string, RoomOption>;
  onOpenDay: (dateKey: string) => void;
  onOpenDetail: (
    shift: DoctorShiftItem,
  ) => void;
  onCreate: () => void;
};

function getDoctorDisplayName(
  shift: DoctorShiftItem,
  doctorById: Map<
    string,
    DoctorOption
  >,
) {
  const doctor =
    doctorById.get(
      shift.doctorId,
    );

  const title =
    shift.doctorTitle ||
    doctor?.title ||
    "Bác sĩ";

  const name =
    shift.doctorName ||
    doctor?.name ||
    `#${shift.doctorId}`;

  return `${title} ${name}`;
}

function getRoomDisplayName(
  shift: DoctorShiftItem,
  roomById: Map<
    string,
    RoomOption
  >,
) {
  return (
    shift.roomName ||
    roomById.get(
      shift.roomId,
    )?.name ||
    "Chưa cập nhật phòng"
  );
}

export function DoctorShiftWeekView({
  weekDays,
  rows,
  total,
  facilityFilter,
  canManage,
  doctorById,
  roomById,
  onOpenDay,
  onOpenDetail,
  onCreate,
}: Props) {
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
            Lịch ca trực theo tuần
          </p>

          <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
            Mỗi ô hiển thị tối đa 2 lịch. Bấm vào ngày hoặc “+ lịch khác” để xem đầy đủ.
          </p>
        </div>
      }
      extra={
        <Text type="secondary">
          {total} lịch trực
        </Text>
      }
    >
      {rows.length === 0 ? (
        <div className="px-6 py-12">
          <Empty
            image={
              Empty.PRESENTED_IMAGE_SIMPLE
            }
            description="Không có ca trực phù hợp trong tuần này."
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
        </div>
      ) : (
        /**
         * Vùng lịch có scroll riêng:
         * - ngang: không ép 7 ngày thành các ô quá hẹp.
         * - dọc: nhiều khung ca không làm cả trang dài vô hạn.
         */
        <div className="max-h-[680px] overflow-auto">
          <div className="min-w-[1120px]">
            <div
              className="sticky top-0 z-30 grid border-b border-slate-200 bg-slate-50"
              style={{
                gridTemplateColumns:
                  "180px repeat(7, minmax(132px, 1fr))",
              }}
            >
              <div className="sticky left-0 z-40 flex min-w-0 items-center border-r border-slate-200 bg-slate-100 px-3 py-2.5">
                <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Khung ca
                </Text>
              </div>

              {weekDays.map(
                (
                  date,
                  index,
                ) => {
                  const dateKey =
                    toDoctorShiftDateKey(
                      date,
                    );

                  const today =
                    dateKey ===
                    DOCTOR_SHIFT_TODAY;

                  return (
                    <button
                      key={
                        dateKey
                      }
                      type="button"
                      className={`min-w-0 border-r border-slate-200 px-2 py-2 text-center last:border-r-0 ${
                        today
                          ? "bg-blue-50"
                          : "bg-slate-50"
                      }`}
                      onClick={() =>
                        onOpenDay(
                          dateKey,
                        )
                      }
                    >
                      <Text
                        strong
                        className={`block text-[11px] uppercase ${
                          today
                            ? "text-blue-700"
                            : "text-slate-600"
                        }`}
                      >
                        {
                          DOCTOR_SHIFT_WEEKDAY_LABELS[
                            index
                          ]
                        }
                      </Text>

                      <span
                        className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          today
                            ? "bg-blue-600 text-white"
                            : "text-slate-800"
                        }`}
                      >
                        {String(
                          date.getDate(),
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <Text
                        type="secondary"
                        className="mt-0.5 block text-[10px]"
                      >
                        {String(
                          date.getMonth() +
                            1,
                        ).padStart(
                          2,
                          "0",
                        )}
                        /
                        {date.getFullYear()}
                      </Text>
                    </button>
                  );
                },
              )}
            </div>

            {rows.map(
              (row) => (
                <div
                  key={row.key}
                  className="grid border-b border-slate-200 last:border-b-0"
                  style={{
                    gridTemplateColumns:
                      "180px repeat(7, minmax(132px, 1fr))",
                  }}
                >
                  <div className="sticky left-0 z-20 min-w-0 border-r border-slate-200 bg-slate-50 px-3 py-2.5">
                    <Text
                      strong
                      className="block truncate text-sm text-slate-950"
                      title={
                        row.slotName
                      }
                    >
                      {row.slotName}
                    </Text>

                    <Text
                      type="secondary"
                      className="mt-0.5 block text-[11px]"
                    >
                      {row.startTime} -{" "}
                      {row.endTime}
                    </Text>

                    {row.slotCode ? (
                      <Text
                        type="secondary"
                        className="mt-0.5 block truncate text-[10px]"
                      >
                        {row.slotCode}
                      </Text>
                    ) : null}

                    {!facilityFilter &&
                    row.facilityName ? (
                      <Tooltip
                        title={
                          row.facilityName
                        }
                      >
                        <Text className="mt-1 block truncate text-[11px] font-medium text-blue-700">
                          {
                            row.facilityName
                          }
                        </Text>
                      </Tooltip>
                    ) : null}
                  </div>

                  {weekDays.map(
                    (date) => {
                      const dateKey =
                        toDoctorShiftDateKey(
                          date,
                        );

                      const dayShifts =
                        row.shiftsByDate[
                          dateKey
                        ] ?? [];

                      const visibleShifts =
                        dayShifts.slice(
                          0,
                          MAX_VISIBLE_SHIFTS_PER_CELL,
                        );

                      const hiddenCount =
                        Math.max(
                          0,
                          dayShifts.length -
                            visibleShifts.length,
                        );

                      const today =
                        dateKey ===
                        DOCTOR_SHIFT_TODAY;

                      return (
                        <div
                          key={`${row.key}-${dateKey}`}
                          className={`min-w-0 border-r border-slate-200 p-1.5 last:border-r-0 ${
                            today
                              ? "bg-blue-50/30"
                              : "bg-white"
                          }`}
                        >
                          {dayShifts.length >
                          0 ? (
                            <div className="flex min-h-[84px] flex-col gap-1.5">
                              {visibleShifts.map(
                                (
                                  shift,
                                ) => {
                                  const doctorName =
                                    getDoctorDisplayName(
                                      shift,
                                      doctorById,
                                    );

                                  const roomName =
                                    getRoomDisplayName(
                                      shift,
                                      roomById,
                                    );

                                  return (
                                    <Tooltip
                                      key={
                                        shift.id
                                      }
                                      placement="top"
                                      title={
                                        <div>
                                          <div className="font-semibold">
                                            {
                                              doctorName
                                            }
                                          </div>

                                          <div>
                                            {
                                              roomName
                                            }
                                          </div>

                                          <div>
                                            {
                                              shift.bookedAppointments
                                            }
                                            /
                                            {
                                              shift.maxAppointments
                                            }{" "}
                                            đã đặt
                                          </div>
                                        </div>
                                      }
                                    >
                                      <button
                                        type="button"
                                        className={`w-full min-w-0 rounded-md border px-2 py-1.5 text-left transition hover:-translate-y-px hover:shadow-sm ${getDoctorShiftAccent(
                                          shift.startTime,
                                        )}`}
                                        onClick={() =>
                                          onOpenDetail(
                                            shift,
                                          )
                                        }
                                      >
                                        <span className="block truncate text-[11px] font-semibold leading-4">
                                          {
                                            doctorName
                                          }
                                        </span>

                                        <span className="mt-0.5 flex min-w-0 items-center justify-between gap-1 text-[10px] leading-4 opacity-80">
                                          <span className="min-w-0 truncate">
                                            {
                                              roomName
                                            }
                                          </span>

                                          <span className="shrink-0 font-medium">
                                            {
                                              shift.bookedAppointments
                                            }
                                            /
                                            {
                                              shift.maxAppointments
                                            }
                                          </span>
                                        </span>
                                      </button>
                                    </Tooltip>
                                  );
                                },
                              )}

                              {hiddenCount >
                              0 ? (
                                <button
                                  type="button"
                                  className="mt-auto flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() =>
                                    onOpenDay(
                                      dateKey,
                                    )
                                  }
                                >
                                  +{" "}
                                  {
                                    hiddenCount
                                  }{" "}
                                  lịch khác
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="flex min-h-[84px] w-full items-center justify-center rounded-md text-[11px] text-slate-400 transition hover:bg-slate-50 hover:text-blue-600"
                              onClick={() =>
                                onOpenDay(
                                  dateKey,
                                )
                              }
                            >
                              Chưa có lịch
                            </button>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </Card>
  );
}