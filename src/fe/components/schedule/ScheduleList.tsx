"use client";

import { Card, Empty, Tag, Typography } from "antd";
import { Clock, Hospital, Stethoscope } from "lucide-react";
import dayjs from "dayjs";

import type {
  PregnancyScheduleItem,
  PregnancyScheduleStatus,
  PregnancyScheduleType,
} from "@/features/schedule/schedule.types";

const { Text } = Typography;

const statusText: Record<PregnancyScheduleStatus, string> = {
  upcoming: "Sắp tới",
  done: "Đã hoàn thành",
  missed: "Đã lỡ",
};

const statusColor: Record<PregnancyScheduleStatus, string> = {
  upcoming: "processing",
  done: "success",
  missed: "error",
};

const typeText: Record<PregnancyScheduleType, string> = {
  checkup: "Khám thai",
  ultrasound: "Siêu âm",
  lab: "Xét nghiệm",
  medicine: "Nhắc uống thuốc",
  consultation: "Tư vấn",
  reminder: "Nhắc nhở",
};

type ScheduleListProps = {
  schedules: PregnancyScheduleItem[];
};

export function ScheduleList({ schedules }: ScheduleListProps) {
  return (
    <Card title="Lịch chăm sóc sắp tới" className="h-full shadow-sm">
      {schedules.length ? (
        <div className="divide-y divide-slate-100">
          {schedules.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Text strong>{item.title}</Text>

                <Tag color={statusColor[item.status]}>
                  {statusText[item.status]}
                </Tag>

                <Tag color={item.createdByUser ? "pink" : undefined}>
                  {typeText[item.type]}
                </Tag>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {item.time} - {dayjs(item.date).format("DD/MM/YYYY")}
                  </span>
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
                  <div className="text-slate-500">
                    Ghi chú: {item.note}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty description="Chưa có lịch sắp tới" />
      )}
    </Card>
  );
}