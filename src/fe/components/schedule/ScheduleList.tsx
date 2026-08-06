"use client";

import { Button, Card, Empty, Popconfirm, Space, Tag, Typography } from "antd";
import { AlertTriangle, CalendarPlus, Clock, Hospital, Stethoscope, Trash2 } from "lucide-react";
import dayjs from "dayjs";

import type {
  PregnancyScheduleItem,
  PregnancyScheduleStatus,
  PregnancyScheduleType,
} from "@/features/schedule/schedule.types";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Text } = Typography;

const statusText: Record<PregnancyScheduleStatus, string> = {
  upcoming: "Sắp tới",
  done: "Đã hoàn thành",
  missed: "Đã lỡ",
  action_required: "Cần xử lý",
  cancelled: "Đã hủy",
};

const statusColor: Record<PregnancyScheduleStatus, string> = {
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
  medicine: "Nhắc uống thuốc",
  consultation: "Tư vấn",
  reminder: "Nhắc nhở",
};

type ScheduleListProps = {
  schedules: PregnancyScheduleItem[];
  onDelete?: (scheduleId: string) => void;
  onOpenGoogleCalendar?: (schedule: PregnancyScheduleItem) => void;
};

export function ScheduleList({
  schedules,
  onDelete,
  onOpenGoogleCalendar,
}: ScheduleListProps) {
  return (
    <Card
      title={RESPONSE_MESSAGES.SCHEDULE.UPCOMING_APPOINTMENTS_CARE}
      className="h-full shadow-sm"
    >
      {schedules.length ? (
        <div className="divide-y divide-slate-100">
          {schedules.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Text strong>{item.title}</Text>

                <Tag color={statusColor[item.status]}>{statusText[item.status]}</Tag>

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

                {item.note ? <div className="text-slate-500">Ghi chú: {item.note}</div> : null}
              </div>

              <Space className="mt-3" wrap>
                {item.status === "action_required" ? (
                  <Button
                    type="primary"
                    size="small"
                    href="/appointment-disruptions"
                    icon={<AlertTriangle className="h-3.5 w-3.5" />}
                  >
                    Xử lý lịch
                  </Button>
                ) : null}
                <Button
                  size="small"
                  icon={<CalendarPlus className="h-3.5 w-3.5" />}
                  onClick={() => onOpenGoogleCalendar?.(item)}
                >
                  Google Calendar
                </Button>

                {item.createdByUser ? (
                  <Popconfirm
                    title="Xóa lịch này?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => onDelete?.(item.id)}
                  >
                    <Button
                      danger
                      size="small"
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                ) : null}
              </Space>
            </div>
          ))}
        </div>
      ) : (
        <Empty description={RESPONSE_MESSAGES.SCHEDULE.DONT_HAVE_UPCOMING_APPOINTMENTS} />
      )}
    </Card>
  );
}
