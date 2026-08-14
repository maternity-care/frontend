"use client";

import { Badge, Card } from "antd";
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import { DOCTOR_SHIFT_WEEKDAY_LABELS } from "@/management/features/doctor-shifts/doctor-shifts.constants";
import {
  DOCTOR_SHIFT_TODAY,
  getDoctorShiftAccent,
  parseDoctorShiftDateKey,
  toDoctorShiftDateKey,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";

type Props = {
  selectedDate: string;
  monthGrid: Date[];
  shifts: DoctorShiftItem[];
  onOpenDay: (dateKey: string) => void;
  onOpenDetail: (shift: DoctorShiftItem) => void;
};

export function DoctorShiftMonthView({
  selectedDate,
  monthGrid,
  shifts,
  onOpenDay,
  onOpenDetail,
}: Props) {
  return (
    <Card
      className="overflow-hidden border-slate-200 bg-white"
      styles={{ body: { padding: 0 } }}
      title={
        <div>
          <p className="mb-0 text-base font-semibold text-slate-950">
            Lịch ca trực theo tháng
          </p>
          <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
            Bấm vào một ngày để xem danh sách ca trực của ngày đó.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DOCTOR_SHIFT_WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="border-r border-slate-200 px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthGrid.map((date) => {
          const dateKey = toDoctorShiftDateKey(date);
          const dayShifts = shifts
            .filter((shift) => shift.shiftDate === dateKey)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const selected = dateKey === selectedDate;
          const today = dateKey === DOCTOR_SHIFT_TODAY;
          const sameMonth =
            date.getMonth() === parseDoctorShiftDateKey(selectedDate).getMonth();

          return (
            <div
              key={dateKey}
              role="button"
              tabIndex={0}
              className={`min-h-[145px] cursor-pointer border-b border-r border-slate-200 p-2 transition hover:bg-slate-50 ${
                !sameMonth ? "bg-slate-50/70 text-slate-400" : "bg-white"
              } ${selected ? "ring-2 ring-inset ring-blue-500" : ""}`}
              onClick={() => onOpenDay(dateKey)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onOpenDay(dateKey);
                }
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                    today ? "bg-blue-600 text-white" : "text-slate-700"
                  }`}
                >
                  {date.getDate()}
                </span>

                {dayShifts.length > 0 ? (
                  <Badge count={dayShifts.length} size="small" />
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                {dayShifts.slice(0, 3).map((shift) => (
                  <button
                    key={shift.id}
                    type="button"
                    className={`w-full truncate rounded-md border px-2 py-1.5 text-left text-[11px] font-medium ${getDoctorShiftAccent(
                      shift.startTime,
                    )}`}
                    title={`${shift.startTime} - ${shift.endTime} · ${shift.doctorName}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDetail(shift);
                    }}
                  >
                    {shift.startTime} · {shift.doctorName || `Bác sĩ #${shift.doctorId}`}
                  </button>
                ))}

                {dayShifts.length > 3 ? (
                  <span className="px-1 text-xs font-semibold text-slate-500">
                    +{dayShifts.length - 3} ca khác
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
