export interface CreateTestJobInput {
  message: string;
  payload?: Record<string, unknown>;
}

export interface TestJobResponse {
  jobId?: string;
  id?: string;
  [key: string]: unknown;
}
