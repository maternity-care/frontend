"use client";

import { Badge, Calendar, Card, Popover, Tag, Typography } from "antd";
import type { CalendarProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import type {
  PregnancyScheduleItem,
  PregnancyScheduleStatus,
  PregnancyScheduleType,
} from "@/features/schedule/schedule.types";

const { Text } = Typography;

const statusBadge: Record<PregnancyScheduleStatus, "processing" | "success" | "error"> = {
  upcoming: "processing",
  done: "success",
  missed: "error",
};

const typeText: Record<PregnancyScheduleType, string> = {
  checkup: "Khám thai",
  ultrasound: "Siêu âm",
  lab: "Xét nghiệm",
  medicine: "Thuốc",
  consultation: "Tư vấn",
  reminder: "Nhắc nhở",
};

type ScheduleCalendarProps = {
  schedules: PregnancyScheduleItem[];
};

export function ScheduleCalendar({ schedules }: ScheduleCalendarProps) {
  const getSchedulesByDate = (value: Dayjs) => {
    return schedules.filter((item) => dayjs(item.date).isSame(value, "day"));
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type !== "date") return info.originNode;

    const daySchedules = getSchedulesByDate(current);

    return (
      <div className="min-h-[86px]">
        {info.originNode}

        <div className="mt-1 space-y-1">
          {daySchedules.slice(0, 3).map((item) => (
            <Popover
              key={item.id}
              title={item.title}
              content={
                <div className="max-w-64 space-y-1 text-sm">
                  <div>
                    <Text type="secondary">Thời gian: </Text>
                    <Text>{item.time}</Text>
                  </div>

                  {item.location ? (
                    <div>
                      <Text type="secondary">Địa điểm: </Text>
                      <Text>{item.location}</Text>
                    </div>
                  ) : null}

                  {item.note ? (
                    <div>
                      <Text type="secondary">Ghi chú: </Text>
                      <Text>{item.note}</Text>
                    </div>
                  ) : null}

                  <Tag className="mt-2">{typeText[item.type]}</Tag>
                </div>
              }
            >
              <div className="cursor-pointer truncate rounded-md bg-pink-50 px-2 py-1 text-xs text-pink-700 hover:bg-pink-100">
                <Badge status={statusBadge[item.status]} />
                {item.time} {item.title}
              </div>
            </Popover>
          ))}

          {daySchedules.length > 3 ? (
            <div className="text-xs text-slate-500">
              +{daySchedules.length - 3} lịch khác
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <Card title="Dạng xem lịch" className="shadow-sm">
      <Calendar cellRender={cellRender} />
    </Card>
  );
}