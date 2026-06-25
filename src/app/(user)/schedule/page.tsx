"use client";

import { PregnancyScheduleOverview } from "@/fe/components/schedule/PregnancyScheduleOverview";
import type { PregnancyScheduleItem } from "@/features/schedule/schedule.types";
import useAuth from "@/hooks/useAuth";

const mockSchedules: PregnancyScheduleItem[] = [
  {
    id: "1",
    title: "Khám thai định kỳ tháng 6",
    type: "checkup",
    date: "2026-06-28",
    time: "08:30",
    location: "Phòng khám Maternity Care - Cần Thơ",
    doctor: "BS. Nguyễn Minh Anh",
    status: "upcoming",
    note: "Mang theo sổ khám thai và kết quả xét nghiệm gần nhất.",
  },
  {
    id: "2",
    title: "Siêu âm thai 4D",
    type: "ultrasound",
    date: "2026-07-05",
    time: "09:00",
    location: "Khoa Chẩn đoán hình ảnh",
    doctor: "BS. Trần Thu Hà",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Xét nghiệm máu thai kỳ",
    type: "lab",
    date: "2026-06-12",
    time: "07:30",
    location: "Phòng xét nghiệm",
    status: "done",
  },
  {
    id: "4",
    title: "Tư vấn dinh dưỡng thai kỳ",
    type: "consultation",
    date: "2026-06-18",
    time: "14:00",
    location: "Tư vấn online",
    doctor: "Chuyên viên dinh dưỡng",
    status: "done",
  },
];

export default function SchedulePage() {
  const { currentUser } = useAuth();

  return (
    <PregnancyScheduleOverview
      patientName={currentUser?.name}
      gestationalWeek={24}
      initialSchedules={mockSchedules}
    />
  );
}