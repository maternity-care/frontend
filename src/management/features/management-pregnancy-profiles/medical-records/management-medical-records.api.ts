import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  BackendMedicalRecord,
  CreateMedicalRecordInput,
  MedicalRecord,
  MedicalRecordFile,
  BackendMedicalRecordFile,
  BackendAppointment,
  Appointment,
  PendingMedicalRecordFile,
} from "./management-medical-records.types";

const MEDICAL_RECORDS_URL = "/management/medical-records";
const APPOINTMENTS_BY_PREGNANCY_PROFILE_URL =
  "/management/appointments/pregnancy-profile";

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

function normalizeAppointment(
  item: BackendAppointment,
): Appointment {
  return {
    id: toStringValue(item.id),
    pregnancyProfileId: toNullableString(item.pregnancyProfileId),
    doctorId: toNullableString(item.doctorId),
    appointmentAt: item.appointmentAt ?? null,
    status: item.status ?? null,
    note: item.note ?? null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
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

export async function getAppointmentsByPregnancyProfileId(
  pregnancyProfileId: string,
): Promise<Appointment[]> {
  const data = await unwrapApiData<BackendAppointment[] | BackendAppointment>(
    apiClient.get(
      `${APPOINTMENTS_BY_PREGNANCY_PROFILE_URL}/${pregnancyProfileId}`,
    ),
  );

  // Hỗ trợ cả trường hợp backend trả về array hoặc single object
  const list = Array.isArray(data) ? data : data ? [data] : [];
  return list.map(normalizeAppointment);
}

export async function getPendingMedicalRecordFiles(
  appointmentId: string,
): Promise<PendingMedicalRecordFile[]> {
  const data = await unwrapApiData<PendingMedicalRecordFile[]>(
    apiClient.get(`${MEDICAL_RECORDS_URL}/pending-files`, {
      params: { appointmentId },
    }),
  );

  return Array.isArray(data) ? data : [];
}
