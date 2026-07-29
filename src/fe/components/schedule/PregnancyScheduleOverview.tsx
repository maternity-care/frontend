"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Progress, Row, Spin, Statistic, Typography, message } from "antd";
import { CalendarPlus, CalendarDays, Clock, Download, Hospital } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";

import type { PregnancyScheduleItem } from "@/features/schedule/schedule.types";
import {
  createMySchedule,
  deleteMySchedule,
  getMySchedules,
} from "@/features/schedule/schedule.api";
import {
  buildGoogleCalendarUrl,
  downloadSchedulesIcs,
} from "@/features/schedule/schedule.utils";
import { CreateScheduleModal } from "./CreateScheduleModal";
import { ScheduleList } from "./ScheduleList";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Title, Text } = Typography;

type PregnancyScheduleOverviewProps = {
  patientName?: string;
  gestationalWeek?: number;
  initialSchedules?: PregnancyScheduleItem[];
};

export function PregnancyScheduleOverview({
  patientName,
  gestationalWeek = 24,
  initialSchedules = [],
}: PregnancyScheduleOverviewProps) {
  const [schedules, setSchedules] = useState<PregnancyScheduleItem[]>(initialSchedules);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createScheduleDate, setCreateScheduleDate] = useState<Dayjs | undefined>();

  useEffect(() => {
    setLoadingSchedules(true);
    getMySchedules()
      .then(setSchedules)
      .catch(() => message.warning("Không tải được lịch cá nhân."))
      .finally(() => setLoadingSchedules(false));
  }, []);

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const aTime = dayjs(`${a.date} ${a.time}`, "YYYY-MM-DD HH:mm").valueOf();
      const bTime = dayjs(`${b.date} ${b.time}`, "YYYY-MM-DD HH:mm").valueOf();

      return aTime - bTime;
    });
  }, [schedules]);

  const upcomingSchedules = sortedSchedules.filter(
    (item) => item.status === "upcoming"
  );

  const nextSchedule = upcomingSchedules[0];

  const completedCount = schedules.filter((item) => item.status === "done").length;
  const totalCount = schedules.length;
  const progressPercent = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  const handleCreateSchedule = async (newSchedule: PregnancyScheduleItem) => {
    try {
      const savedSchedule = await createMySchedule({
        title: newSchedule.title,
        type: newSchedule.type,
        date: newSchedule.date,
        time: newSchedule.time,
        location: newSchedule.location,
        note: newSchedule.note,
      });
      setSchedules((prev) => [...prev, savedSchedule]);
      setOpenCreateModal(false);
      message.success("Đã lưu lịch vào database.");
    } catch {
      message.error("Không tạo được lịch. Bạn thử lại nhé.");
    }
  };

  const handleOpenCreateModal = (date?: Dayjs) => {
    setCreateScheduleDate(date);
    setOpenCreateModal(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteMySchedule(scheduleId);
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
      message.success("Đã xóa lịch.");
    } catch {
      message.error("Không xóa được lịch này.");
    }
  };

  const handleOpenGoogleCalendar = (schedule: PregnancyScheduleItem) => {
    window.open(buildGoogleCalendarUrl(schedule), "_blank", "noopener,noreferrer");
  };

  const handleImportAllToCalendar = () => {
    downloadSchedulesIcs(sortedSchedules);
  };

  return (
    <div className="space-y-6">
      <Spin spinning={loadingSchedules}>
      <Card className="overflow-hidden border-0 shadow-sm">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={15}>
            <div className="mb-2 text-sm font-medium text-pink-600">
              {RESPONSE_MESSAGES.COMMON.HELLO}, {patientName || RESPONSE_MESSAGES.COMMON.PREGNANT}
            </div>

            <Title level={2} className="!mb-2">
              {RESPONSE_MESSAGES.SCHEDULE.TITLE}
            </Title>

            <Text type="secondary">
              {RESPONSE_MESSAGES.SCHEDULE.TITLE_DESCRIPTION}
            </Text>

            {nextSchedule ? (
              <div className="mt-6 rounded-2xl border border-pink-100 bg-pink-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-pink-700">
                  <CalendarDays className="h-4 w-4" />
                  {RESPONSE_MESSAGES.SCHEDULE.NEXT_APPOINTMENT}
                </div>

                <div className="text-lg font-semibold text-slate-950">
                  {nextSchedule.title}
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {nextSchedule.time} -{" "}
                    {dayjs(nextSchedule.date).format("DD/MM/YYYY")}
                  </span>

                  {nextSchedule.location ? (
                    <span className="flex items-center gap-1">
                      <Hospital className="h-4 w-4" />
                      {nextSchedule.location}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card className="!bg-pink-50">
                  <Statistic title={RESPONSE_MESSAGES.SCHEDULE.GESTATIONAL_WEEK} value={gestationalWeek} suffix="tuần" />
                </Card>
              </Col>

              <Col span={12}>
                <Card className="!bg-pink-50">
                  <Statistic title={RESPONSE_MESSAGES.SCHEDULE.UPCOMING_APPOINTMENTS} value={totalCount} suffix="mục" />
                </Card>
              </Col>

              <Col span={24}>
                <Card className="!bg-pink-50">
                  <div className="mb-2 flex items-center justify-between">
                    <Text strong>{RESPONSE_MESSAGES.SCHEDULE.PROGRESS_CARE}</Text>
                    <Text type="secondary">
                      {completedCount}/{totalCount}
                    </Text>
                  </div>
                  <Progress percent={progressPercent} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
      </Spin>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title level={3} className="!mb-1">
            {RESPONSE_MESSAGES.SCHEDULE.MANAGE_SCHEDULE}
          </Title>
          <Text type="secondary">
            {RESPONSE_MESSAGES.SCHEDULE.MANAGE_SCHEDULE_DESCRIPTION} Chọn một ngày trên lịch để tạo nhanh.
          </Text>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="large"
            icon={<Download className="h-4 w-4" />}
            disabled={!sortedSchedules.length}
            onClick={handleImportAllToCalendar}
          >
            Import tất cả
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<CalendarPlus className="h-4 w-4" />}
            onClick={() => handleOpenCreateModal()}
          >
            {RESPONSE_MESSAGES.SCHEDULE.CREATE_SCHEDULE}
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={8}>
          <ScheduleList
            schedules={upcomingSchedules}
            onDelete={handleDeleteSchedule}
            onOpenGoogleCalendar={handleOpenGoogleCalendar}
          />
        </Col>

        <Col xs={24} xl={16}>
          <ScheduleCalendar
            schedules={sortedSchedules}
            onCreateSchedule={handleOpenCreateModal}
            onOpenGoogleCalendar={handleOpenGoogleCalendar}
          />
        </Col>
      </Row>

      <CreateScheduleModal
        open={openCreateModal}
        initialDate={createScheduleDate}
        onCancel={() => setOpenCreateModal(false)}
        onCreate={handleCreateSchedule}
      />
    </div>
  );
}
