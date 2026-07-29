import { apiClient, unwrapApiData } from "@/lib/axios";
import type { PregnancyScheduleItem } from "./schedule.types";

export type CreateScheduleInput = Pick<
  PregnancyScheduleItem,
  "title" | "type" | "date" | "time" | "location" | "note"
>;

export async function getMySchedules(): Promise<PregnancyScheduleItem[]> {
  return unwrapApiData<PregnancyScheduleItem[]>(
    apiClient.get("/schedules"),
  );
}

export async function createMySchedule(
  input: CreateScheduleInput,
): Promise<PregnancyScheduleItem> {
  return unwrapApiData<PregnancyScheduleItem>(
    apiClient.post("/schedules", input),
  );
}

export async function deleteMySchedule(id: string): Promise<{ id: string }> {
  return unwrapApiData<{ id: string }>(
    apiClient.delete(`/schedules/${encodeURIComponent(id)}`),
  );
}
