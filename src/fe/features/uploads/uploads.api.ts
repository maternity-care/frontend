import { apiClient, unwrapApiData } from "@/lib/axios";
import type { CreateUserPresignedUploadInput, PresignedUploadResponse } from "./uploads.types";

export function createUserPresignedUpload(input: CreateUserPresignedUploadInput) {
  return unwrapApiData<PresignedUploadResponse>(apiClient.post("/uploads/presign", input));
}
