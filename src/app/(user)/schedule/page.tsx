"use client";

import { PregnancyScheduleOverview } from "@/fe/components/schedule/PregnancyScheduleOverview";
import useAuth from "@/hooks/useAuth";

export default function SchedulePage() {
  const { currentUser } = useAuth();

  return (
    <PregnancyScheduleOverview
      patientName={currentUser?.name}
      gestationalWeek={24}
    />
  );
}
