"use client";

import { Button, Card, Empty, Typography } from "antd";
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DoctorOption,
  RoomOption,
  WeeklyScheduleRow,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import { DOCTOR_SHIFT_WEEKDAY_LABELS } from "@/management/features/doctor-shifts/doctor-shifts.constants";
import {
  DOCTOR_SHIFT_TODAY,
  getDoctorShiftAccent,
  toDoctorShiftDateKey,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";

const { Text } = Typography;

type Props = {
  weekDays: Date[];
  rows: WeeklyScheduleRow[];
  total: number;
  facilityFilter?: string;
  canManage: boolean;
  doctorById: Map<string, DoctorOption>;
  roomById: Map<string, RoomOption>;
  onOpenDay: (dateKey: string) => void;
  onOpenDetail: (shift: DoctorShiftItem) => void;
  onCreate: () => void;
};

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
      styles={{ body: { padding: 0 } }}
      title={
        <div>
          <p className="mb-0 text-base font-semibold text-slate-950">
            Lịch ca trực theo tuần
          </p>
          <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
            Cột bên trái là khung ca; mỗi ô hiển thị lịch của bác sĩ trong ngày tương ứng.
          </p>
        </div>
      }
      extra={<Text type="secondary">{total} lịch trực</Text>}
    >
      <div className="w-full overflow-hidden">
        <div className="w-full">
          <div
            className="grid border-b border-slate-200 bg-slate-50"
            style={{
              gridTemplateColumns:
                "minmax(150px, 1.15fr) repeat(7, minmax(0, 1fr))",
            }}
          >
            <div className="flex min-w-0 items-center border-r border-slate-200 bg-slate-100 px-2 py-3 lg:px-3">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Khung ca
              </Text>
            </div>

            {weekDays.map((date, index) => {
              const dateKey = toDoctorShiftDateKey(date);
              const today = dateKey === DOCTOR_SHIFT_TODAY;
              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`min-w-0 border-r border-slate-200 px-1 py-3 text-center last:border-r-0 sm:px-2 ${
                    today ? "bg-blue-50" : "bg-slate-50"
                  }`}
                  onClick={() => onOpenDay(dateKey)}
                >
                  <Text
                    strong
                    className={`block text-xs uppercase ${
                      today ? "text-blue-700" : "text-slate-600"
                    }`}
                  >
                    {DOCTOR_SHIFT_WEEKDAY_LABELS[index]}
                  </Text>
                  <span
                    className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      today ? "bg-blue-600 text-white" : "text-slate-800"
                    }`}
                  >
                    {String(date.getDate()).padStart(2, "0")}
                  </span>
                  <Text type="secondary" className="mt-1 block truncate text-[9px] lg:text-[11px]">
                    {String(date.getMonth() + 1).padStart(2, "0")}/{date.getFullYear()}
                  </Text>
                </button>
              );
            })}
          </div>

          {rows.length === 0 ? (
            <div className="px-6 py-12">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có ca trực phù hợp trong tuần này."
              >
                {canManage ? (
                  <Button type="primary" onClick={onCreate}>
                    Thêm ca trực
                  </Button>
                ) : null}
              </Empty>
            </div>
          ) : (
            rows.map((row) => (
              <div
                key={row.key}
                className="grid border-b border-slate-200 last:border-b-0"
                style={{
                  gridTemplateColumns:
                    "minmax(150px, 1.15fr) repeat(7, minmax(0, 1fr))",
                }}
              >
                <div className="min-w-0 border-r border-slate-200 bg-slate-50 px-2 py-3 lg:px-3">
                  <Text strong className="block text-slate-950">{row.slotName}</Text>
                  <Text type="secondary" className="mt-1 block text-xs">
                    {row.startTime} - {row.endTime}
                  </Text>
                  {row.slotCode ? (
                    <Text type="secondary" className="mt-1 block truncate text-xs">
                      {row.slotCode}
                    </Text>
                  ) : null}
                  {!facilityFilter && row.facilityName ? (
                    <Text className="mt-2 block truncate text-xs font-medium text-blue-700">
                      {row.facilityName}
                    </Text>
                  ) : null}
                </div>

                {weekDays.map((date) => {
                  const dateKey = toDoctorShiftDateKey(date);
                  const dayShifts = row.shiftsByDate[dateKey] ?? [];
                  const today = dateKey === DOCTOR_SHIFT_TODAY;
                  return (
                    <div
                      key={`${row.key}-${dateKey}`}
                      className={`min-w-0 border-r border-slate-200 p-1.5 last:border-r-0 lg:p-2 ${
                        today ? "bg-blue-50/30" : "bg-white"
                      }`}
                    >
                      {dayShifts.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {dayShifts.map((shift) => (
                            <button
                              key={shift.id}
                              type="button"
                              className={`w-full min-w-0 rounded-md border px-1.5 py-2 text-left transition hover:shadow-sm lg:px-2 ${getDoctorShiftAccent(
                                shift.startTime,
                              )}`}
                              title={`${shift.doctorTitle || "Bác sĩ"} ${shift.doctorName} · ${shift.roomName || "Chưa có phòng"}`}
                              onClick={() => onOpenDetail(shift)}
                            >
                              <span className="block truncate text-[10px] font-semibold sm:text-[11px] lg:text-xs">
                                {shift.doctorTitle || doctorById.get(shift.doctorId)?.title || "Bác sĩ"}{" "}
                                {shift.doctorName || doctorById.get(shift.doctorId)?.name || `#${shift.doctorId}`}
                              </span>
                              <span className="mt-1 block truncate text-[9px] opacity-80 sm:text-[10px] lg:text-[11px]">
                                {shift.roomName || roomById.get(shift.roomId)?.name || "Chưa cập nhật phòng"}
                              </span>
                              <span className="mt-1 block truncate text-[9px] font-medium opacity-75 lg:text-[10px]">
                                {shift.bookedAppointments}/{shift.maxAppointments} đã đặt · Tối đa {shift.maxAppointments} lịch
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-[92px] items-center justify-center lg:min-h-[110px]">
                          <Text type="secondary" className="text-xs">Chưa có lịch</Text>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
