import { apiClient, unwrapApiData } from "@/lib/axios";
import type { CreateTestJobInput, TestJobResponse } from "./jobs.types";

export function createTestJob(input: CreateTestJobInput) {
  return unwrapApiData<TestJobResponse>(
    apiClient.post("/management/jobs/test", {
      message: input.message,
      payload: input.payload,
    }),
  );
}
