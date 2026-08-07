import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  BackendMedicalRecord,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  MedicalRecord,
  MedicalRecordFile,
  BackendMedicalRecordFile,
  BackendAppointment,
  Appointment,
  PendingMedicalRecordFile,
  MedicalRecordDoctor,
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

function normalizeFile(file: BackendMedicalRecordFile): MedicalRecordFile {
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

function normalizeDoctor(
  doctor?: {
    id?: string | number;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    employeeCode?: string | null;
  } | null,
): MedicalRecordDoctor | null {
  if (!doctor) return null;

  return {
    id: toStringValue(doctor.id),
    name: doctor.name ?? null,
    email: doctor.email ?? null,
    phone: doctor.phone ?? null,
    employeeCode: doctor.employeeCode ?? null,
  };
}

function normalizeAppointment(item: BackendAppointment): Appointment {
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
  record: BackendMedicalRecord & {
    doctor?: {
      id?: string | number;
      name?: string | null;
    };
  },
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
    doctor: normalizeDoctor(record.doctor),
  };
}

/** GET /management/medical-records/{id} */
export async function getManagementMedicalRecordById(
  id: string,
): Promise<MedicalRecord> {
  const data = await unwrapApiData<BackendMedicalRecord>(
    apiClient.get(`${MEDICAL_RECORDS_URL}/${id}`),
  );
  return normalizeMedicalRecord(data);
}

/** POST /management/medical-records */
export async function createManagementMedicalRecord(
  input: CreateMedicalRecordInput,
): Promise<MedicalRecord> {
  const data = await unwrapApiData<BackendMedicalRecord>(
    apiClient.post(MEDICAL_RECORDS_URL, input),
  );
  return normalizeMedicalRecord(data);
}

/** PATCH /management/medical-records/{id} */
export async function updateManagementMedicalRecord(
  id: string,
  input: UpdateMedicalRecordInput,
): Promise<MedicalRecord> {
  const data = await unwrapApiData<BackendMedicalRecord>(
    apiClient.patch(`${MEDICAL_RECORDS_URL}/${id}`, input),
  );
  return normalizeMedicalRecord(data);
}

/** DELETE /management/medical-records/{id} */
export async function deleteManagementMedicalRecord(id: string): Promise<void> {
  await apiClient.delete(`${MEDICAL_RECORDS_URL}/${id}`);
}

/** GET /management/medical-records/pending-files */
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

export async function getAppointmentsByPregnancyProfileId(
  pregnancyProfileId: string,
): Promise<Appointment[]> {
  const data = await unwrapApiData<BackendAppointment[] | BackendAppointment>(
    apiClient.get(
      `${APPOINTMENTS_BY_PREGNANCY_PROFILE_URL}/${pregnancyProfileId}`,
    ),
  );
  const list = Array.isArray(data) ? data : data ? [data] : [];
  return list.map(normalizeAppointment);
}