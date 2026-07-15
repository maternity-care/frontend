import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type {
  BackendDoctorShift,
  BulkCreateDoctorShiftsInput,
  CheckDoctorShiftConflictsInput,
  CopyDoctorShiftWeekInput,
  CreateDoctorShiftInput,
  DoctorAvailabilitySlot,
  DoctorShiftConflictResult,
  DoctorShiftItem,
  DoctorShiftListResult,
  DoctorShiftStatus,
  GetDoctorAvailabilityParams,
  GetDoctorShiftsParams,
  GetWeeklyDoctorShiftsParams,
  UpdateDoctorShiftInput,
} from "./doctor-shifts.types";

const ENDPOINT = "/management/doctor-shifts";

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === undefined || item === null || item === "") return false;
      return true;
    }),
  );
}

function normalizeStatus(status: string): DoctorShiftStatus {
  const normalized = status.trim().toLowerCase();

  if (
    normalized === "available" ||
    normalized === "full" ||
    normalized === "cancelled" ||
    normalized === "off"
  ) {
    return normalized;
  }

  return "off";
}

function normalizeTime(value: string) {
  const [hour = "00", minute = "00"] = value.trim().split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function normalizeDoctorShift(shift: BackendDoctorShift): DoctorShiftItem {
  const maxAppointments = Number(shift.maxAppointments);

  return {
    id: String(shift.id),
    doctorId: String(shift.doctorId),
    facilityId: String(shift.facilityId),
    roomId: normalizeStringId(shift.roomId),
    shiftDate: shift.shiftDate,
    startTime: normalizeTime(shift.startTime),
    endTime: normalizeTime(shift.endTime),
    maxAppointments:
      Number.isFinite(maxAppointments) && maxAppointments > 0
        ? maxAppointments
        : 1,
    status: normalizeStatus(shift.status),
    createdAt: shift.createdAt,
    updatedAt: shift.updatedAt,
  };
}

function normalizeStringId(
  value: string | number | null | undefined,
): string | undefined {
  if (value === null || value === undefined) return undefined;

  const normalized = String(value).trim();
  return normalized || undefined;
}

function toShiftPayload(
  input: CreateDoctorShiftInput | UpdateDoctorShiftInput,
) {
  return compactObject({
    doctorId: normalizeStringId(input.doctorId),
    facilityId: normalizeStringId(input.facilityId),
    roomId: normalizeStringId(input.roomId),
    shiftDate: input.shiftDate,
    startTime: input.startTime ? normalizeTime(input.startTime) : undefined,
    endTime: input.endTime ? normalizeTime(input.endTime) : undefined,
    maxAppointments: input.maxAppointments,
    status: input.status,
  });
}

function toListParams(params?: GetDoctorShiftsParams) {
  return compactObject({
    doctorId: params?.doctorId?.trim(),
    facilityId: params?.facilityId?.trim(),
    roomId: params?.roomId?.trim(),
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    status: params?.status,
    page: params?.page,
    limit: params?.limit ?? 100,
  });
}

type BackendDoctorShiftPage = {
  items?: BackendDoctorShift[];
  results?: BackendDoctorShift[];
  data?: BackendDoctorShift[];
  total?: number;
  page?: number;
  limit?: number;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

export async function getDoctorShifts(
  params?: GetDoctorShiftsParams,
): Promise<DoctorShiftListResult> {
  const data = await unwrapApiData<
    BackendDoctorShift[] | BackendDoctorShiftPage
  >(
    apiClient.get(ENDPOINT, {
      params: toListParams(params),
    }),
  );

  if (Array.isArray(data)) {
    return {
      items: data.map(normalizeDoctorShift),
      total: data.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? 100,
    };
  }

  const items = data.items ?? data.results ?? data.data ?? [];

  return {
    items: items.map(normalizeDoctorShift),
    total: data.total ?? data.meta?.total ?? items.length,
    page: data.page ?? data.meta?.page ?? params?.page ?? 1,
    limit: data.limit ?? data.meta?.limit ?? params?.limit ?? 100,
  };
}

export async function getDoctorShift(id: string) {
  const data = await unwrapApiData<BackendDoctorShift>(
    apiClient.get(`${ENDPOINT}/${id}`),
  );

  return normalizeDoctorShift(data);
}

export async function createDoctorShift(input: CreateDoctorShiftInput) {
  const response = await unwrapApiResponse<BackendDoctorShift>(
    apiClient.post(ENDPOINT, toShiftPayload(input)),
  );

  return {
    ...response,
    data: normalizeDoctorShift(response.data),
  };
}

export async function updateDoctorShift(
  id: string,
  input: UpdateDoctorShiftInput,
) {
  const response = await unwrapApiResponse<BackendDoctorShift>(
    apiClient.patch(`${ENDPOINT}/${id}`, toShiftPayload(input)),
  );

  return {
    ...response,
    data: normalizeDoctorShift(response.data),
  };
}

export function deleteDoctorShift(id: string) {
  return unwrapApiResponse<null>(apiClient.delete(`${ENDPOINT}/${id}`));
}

export async function checkDoctorShiftConflicts(
  input: CheckDoctorShiftConflictsInput,
): Promise<DoctorShiftConflictResult> {
  const raw = await unwrapApiData<unknown>(
    apiClient.post(
      `${ENDPOINT}/check-conflicts`,
      compactObject({
        ...toShiftPayload(input),
        excludeShiftId: normalizeStringId(input.excludeShiftId),
      }),
    ),
  );

  if (typeof raw === "boolean") {
    return {
      hasConflict: raw,
      doctorConflict: raw,
      roomConflict: false,
      conflicts: [],
      raw,
    };
  }

  if (!raw || typeof raw !== "object") {
    return {
      hasConflict: false,
      doctorConflict: false,
      roomConflict: false,
      conflicts: [],
      raw,
    };
  }

  const result = raw as Record<string, unknown>;
  const conflicts = Array.isArray(result.conflicts) ? result.conflicts : [];
  const doctorConflict = Boolean(
    result.doctorConflict ?? result.hasDoctorConflict,
  );
  const roomConflict = Boolean(result.roomConflict ?? result.hasRoomConflict);
  const explicitConflict = result.hasConflict ?? result.conflict;
  const explicitAvailable = result.available ?? result.isAvailable;

  const hasConflict =
    typeof explicitConflict === "boolean"
      ? explicitConflict
      : typeof explicitAvailable === "boolean"
        ? !explicitAvailable
        : doctorConflict || roomConflict || conflicts.length > 0;

  return {
    hasConflict,
    doctorConflict,
    roomConflict,
    message: typeof result.message === "string" ? result.message : undefined,
    conflicts,
    raw,
  };
}

export async function bulkCreateDoctorShifts(
  input: BulkCreateDoctorShiftsInput,
) {
  return unwrapApiResponse<BackendDoctorShift[] | { created?: number }>(
    apiClient.post(
      `${ENDPOINT}/bulk-create`,
      compactObject({
        doctorId: normalizeStringId(input.doctorId),
        facilityId: normalizeStringId(input.facilityId),
        roomId: normalizeStringId(input.roomId),
        fromDate: input.fromDate,
        toDate: input.toDate,
        workingDays: input.workingDays,
        startTime: normalizeTime(input.startTime),
        endTime: normalizeTime(input.endTime),
        maxAppointments: input.maxAppointments,
        status: input.status,
      }),
    ),
  );
}

export function copyDoctorShiftWeek(input: CopyDoctorShiftWeekInput) {
  return unwrapApiResponse<BackendDoctorShift[] | { created?: number }>(
    apiClient.post(`${ENDPOINT}/copy-week`, {
      facilityId: input.facilityId.trim(),
      doctorId: input.doctorId.trim(),
      sourceWeekStart: input.sourceWeekStart,
      targetWeekStart: input.targetWeekStart,
    }),
  );
}

export async function getDoctorAvailability(
  doctorId: string,
  params: GetDoctorAvailabilityParams,
) {
  return unwrapApiData<DoctorAvailabilitySlot[]>(
    apiClient.get(`${ENDPOINT}/availability/doctors/${doctorId}`, {
      params: compactObject({
        facilityId: params.facilityId?.trim(),
        date: params.date,
        slotMinutes: params.slotMinutes ?? 30,
      }),
    }),
  );
}

export async function getWeeklyDoctorShifts(
  params?: GetWeeklyDoctorShiftsParams,
) {
  return unwrapApiData<unknown>(
    apiClient.get(`${ENDPOINT}/weekly`, {
      params: compactObject({
        facilityId: params?.facilityId?.trim(),
        doctorId: params?.doctorId?.trim(),
        weekStart: params?.weekStart,
      }),
    }),
  );
}

export const managementCatalogApi = {
  getDoctorShifts,
  getDoctorShift,
  createDoctorShift,
  updateDoctorShift,
  deleteDoctorShift,
  checkDoctorShiftConflicts,
  bulkCreateDoctorShifts,
  copyDoctorShiftWeek,
  getDoctorAvailability,
  getWeeklyDoctorShifts,
};