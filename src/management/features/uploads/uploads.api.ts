import { apiClient, unwrapApiData } from "@/lib/axios";
import type { CreatePresignedUploadInput, PresignedUploadResponse } from "./uploads.types";

export function createManagementPresignedUpload(input: CreatePresignedUploadInput) {
  return unwrapApiData<PresignedUploadResponse>(apiClient.post("/management/uploads/presign", input));
}
