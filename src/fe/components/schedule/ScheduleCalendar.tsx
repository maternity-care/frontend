"use client";

import { Badge, Button, Calendar, Card, Popover, Tag, Typography } from "antd";
import type { CalendarProps } from "antd";
import { CalendarPlus } from "lucide-react";
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
  const getSchedulesByDate = (value: Dayjs) => {
    return schedules.filter(
      (item) =>
        (item.status === "upcoming" || item.status === "action_required") &&
        dayjs(item.date).isSame(value, "day"),
    );
  };

  const handleSelect: CalendarProps<Dayjs>["onSelect"] = (date, selectInfo) => {
    if (selectInfo?.source && selectInfo.source !== "date") return;

    onCreateSchedule?.(date);
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

  return (
    <Card
      title={RESPONSE_MESSAGES.SCHEDULE.CALENDAR_VIEW}
      className="schedule-calendar-card shadow-sm [&_.ant-picker-calendar-date-content]:!h-[82px] [&_.ant-picker-calendar-date]:!m-0 [&_.ant-picker-cell-inner]:!rounded-md"
    >
      <Calendar cellRender={cellRender} onSelect={handleSelect} />
    </Card>
  );
}
