"use client";

import { useState } from "react";
import { Badge, Button, Calendar, Card, Empty, Modal, Popover, Space, Tag, Typography } from "antd";
import type { CalendarProps } from "antd";
import { CalendarPlus, Clock, Hospital, Stethoscope } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";

import type {
  PregnancyScheduleItem,
  PregnancyScheduleStatus,
  PregnancyScheduleType,
} from "@/features/schedule/schedule.types";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Text } = Typography;

const statusBadge: Record<PregnancyScheduleStatus, "processing" | "success" | "error" | "warning" | "default"> = {
  upcoming: "processing",
  done: "success",
  missed: "error",
  action_required: "warning",
  cancelled: "default",
};

const typeText: Record<PregnancyScheduleType, string> = {
  checkup: "Khám thai",
  ultrasound: "Siêu âm",
  lab: "Xét nghiệm",
  medicine: "Thuốc",
  consultation: "Tư vấn",
  reminder: "Nhắc nhở",
};

const typeColor: Record<PregnancyScheduleType, string> = {
  checkup: "magenta",
  ultrasound: "purple",
  lab: "blue",
  medicine: "green",
  consultation: "cyan",
  reminder: "orange",
};

type ScheduleCalendarProps = {
  schedules: PregnancyScheduleItem[];
  onCreateSchedule?: (date: Dayjs) => void;
  onOpenGoogleCalendar?: (schedule: PregnancyScheduleItem) => void;
};

export function ScheduleCalendar({
  schedules,
  onCreateSchedule,
  onOpenGoogleCalendar,
}: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  const getSchedulesByDate = (value: Dayjs) => {
    return schedules.filter(
      (item) =>
        (item.status === "upcoming" || item.status === "action_required") &&
        dayjs(item.date).isSame(value, "day"),
    );
  };

  const handleSelect: CalendarProps<Dayjs>["onSelect"] = (date, selectInfo) => {
    // Chỉ xử lý khi chọn ngày (không phải header tháng/năm)
    if (selectInfo?.source && selectInfo.source !== "date") return;

    const daySchedules = getSchedulesByDate(date);

    // Luôn mở modal xem lịch trong ngày
    setSelectedDate(date);
    setDayModalOpen(true);

    // Nếu muốn vẫn cho tạo lịch khi ngày trống, có thể bỏ comment dòng dưới:
    // if (!daySchedules.length) onCreateSchedule?.(date);
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type !== "date") return info.originNode;

    const daySchedules = getSchedulesByDate(current);
    const isToday = current.isSame(dayjs(), "day");

    return (
      <div className="group h-[76px] overflow-hidden rounded-md px-1.5 py-1 transition hover:bg-pink-50">
        <div className="mb-1 flex items-center justify-between">
          <span
            className={
              isToday
                ? "flex h-6 min-w-6 items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs font-semibold text-white"
                : "text-xs font-medium text-slate-700"
            }
          >
            {current.date()}
          </span>

          {!daySchedules.length ? (
            <CalendarPlus className="h-3.5 w-3.5 text-pink-300 opacity-0 transition group-hover:opacity-100" />
          ) : null}
        </div>

        <div className="space-y-1">
          {daySchedules.slice(0, 2).map((item) => (
            <Popover
              key={item.id}
              title={item.title}
              content={
                <div className="max-w-72 space-y-2 text-sm">
                  <div>
                    <Text type="secondary">{RESPONSE_MESSAGES.COMMON.HOUR}: </Text>
                    <Text>{item.time}</Text>
                  </div>

                  {item.location ? (
                    <div>
                      <Text type="secondary">{RESPONSE_MESSAGES.COMMON.LOCATION}: </Text>
                      <Text>{item.location}</Text>
                    </div>
                  ) : null}

                  {item.note ? (
                    <div>
                      <Text type="secondary">{RESPONSE_MESSAGES.COMMON.NOTE}: </Text>
                      <Text>{item.note}</Text>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Tag color={typeColor[item.type]} className="m-0">
                      {typeText[item.type]}
                    </Tag>

                    <Button
                      size="small"
                      icon={<CalendarPlus className="h-3.5 w-3.5" />}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenGoogleCalendar?.(item);
                      }}
                    >
                      Google Calendar
                    </Button>
                  </div>
                </div>
              }
            >
              <button
                type="button"
                className="block w-full truncate rounded border border-pink-100 bg-pink-50 px-1.5 py-0.5 text-left text-[11px] leading-5 text-pink-700 transition hover:border-pink-300 hover:bg-pink-100"
                onClick={(event) => event.stopPropagation()}
              >
                <Badge status={statusBadge[item.status]} className="mr-0.5" />
                <span className="font-semibold">{item.time}</span>{" "}
                {item.title}
              </button>
            </Popover>
          ))}

          {daySchedules.length > 2 ? (
            <div className="truncate px-1.5 text-[11px] leading-5 text-slate-500">
              +{daySchedules.length - 2} {RESPONSE_MESSAGES.SCHEDULE.OTHER_SCHEDULE}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const selectedDaySchedules = selectedDate ? getSchedulesByDate(selectedDate) : [];

  return (
    <>
      <Card
        title={RESPONSE_MESSAGES.SCHEDULE.CALENDAR_VIEW}
        className="schedule-calendar-card shadow-sm [&_.ant-picker-calendar-date-content]:!h-[82px] [&_.ant-picker-calendar-date]:!m-0 [&_.ant-picker-cell-inner]:!rounded-md"
      >
        <Calendar cellRender={cellRender} onSelect={handleSelect} />
      </Card>

      {/* Modal xem tất cả lịch trong ngày */}
      <Modal
        title={
          selectedDate
            ? `Lịch ngày ${selectedDate.format("DD/MM/YYYY")}`
            : "Lịch trong ngày"
        }
        open={dayModalOpen}
        onCancel={() => setDayModalOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setDayModalOpen(false)}>Đóng</Button>
            {selectedDate && (
              <Button
                type="primary"
                icon={<CalendarPlus className="h-4 w-4" />}
                onClick={() => {
                  setDayModalOpen(false);
                  onCreateSchedule?.(selectedDate);
                }}
              >
                Thêm lịch mới
              </Button>
            )}
          </Space>
        }
        width={520}
      >
        {selectedDaySchedules.length === 0 ? (
          <Empty description="Không có lịch nào trong ngày này" />
        ) : (
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {selectedDaySchedules.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-3"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Text strong>{item.title}</Text>
                  <Tag color={typeColor[item.type]} className="m-0">
                    {typeText[item.type]}
                  </Tag>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{item.time}</span>
                  </div>

                  {item.location ? (
                    <div className="flex items-center gap-2">
                      <Hospital className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                  ) : null}

                  {item.doctor ? (
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      <span>{item.doctor}</span>
                    </div>
                  ) : null}

                  {item.note ? (
                    <div className="text-slate-500">Ghi chú: {item.note}</div>
                  ) : null}
                </div>

                <div className="mt-2">
                  <Button
                    size="small"
                    icon={<CalendarPlus className="h-3.5 w-3.5" />}
                    onClick={() => onOpenGoogleCalendar?.(item)}
                  >
                    Google Calendar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}