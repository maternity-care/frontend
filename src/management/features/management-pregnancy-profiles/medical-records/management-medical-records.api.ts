import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  BackendMedicalRecord,
  CreateMedicalRecordInput,
  MedicalRecord,
  MedicalRecordFile,
  BackendMedicalRecordFile,
} from "./management-medical-records.types";

const MEDICAL_RECORDS_URL = "/management/medical-records";

function toStringValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toNullableString(
  value: string | number | null | undefined,
): string | null {
  const result = toStringValue(value).trim();
  return result || null;
}

function normalizeFile(
  file: BackendMedicalRecordFile,
): MedicalRecordFile {
  return {
    id: toStringValue(file.id),
    medicalRecordId: toStringValue(file.medicalRecordId),
    fileType: file.fileType || "other",
    fileName: file.fileName || "Tài liệu",
    fileUrl: file.fileUrl || "",
    mimeType: file.mimeType || "application/octet-stream",
    uploadedBy: file.uploadedBy ?? null,
    createdAt: file.createdAt ?? null,
    updatedAt: file.updatedAt ?? null,
  };
}

export function normalizeMedicalRecord(
  record: BackendMedicalRecord,
): MedicalRecord {
  return {
    id: toStringValue(record.id),
    appointmentId: toNullableString(record.appointmentId),
    pregnancyProfileId: toNullableString(record.pregnancyProfileId),
    doctorId: toNullableString(record.doctorId),
    diagnosis: record.diagnosis ?? null,
    conclusion: record.conclusion ?? null,
    recommendation: record.recommendation ?? null,
    nextAppointmentSuggestedAt: record.nextAppointmentSuggestedAt ?? null,
    files: (record.files ?? []).map(normalizeFile),
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
  };
}

export async function createManagementMedicalRecord(
  input: CreateMedicalRecordInput,
): Promise<MedicalRecord> {
  const data = await unwrapApiData<BackendMedicalRecord>(
    apiClient.post(MEDICAL_RECORDS_URL, input),
  );

  return normalizeMedicalRecord(data);
}