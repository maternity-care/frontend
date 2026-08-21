import { apiClient, unwrapApiData } from "@/lib/axios";
import type {
  PublicBackendDoctorShift,
  PublicDoctorAvailabilityParams,
  PublicDoctorAvailabilityResponse,
  PublicDoctorShiftItem,
  PublicWeeklyDoctorShiftsParams,
} from "./public-doctor-shifts.types";

const ENDPOINT = "/public/shifts";

function compactObject(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== undefined && item !== null && item !== "",
    ),
  );
}

function toStringValue(value: unknown): string {
  return String(value ?? "").trim();
}

function toNumberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeTime(value: string): string {
  const [hour = "00", minute = "00"] = String(value ?? "")
    .trim()
    .split(":");

  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function normalizeDoctorShift(shift: PublicBackendDoctorShift): PublicDoctorShiftItem {
  return {
    id: toStringValue(shift.id),
    doctorId: toStringValue(shift.doctorId),
    staffId: toStringValue(shift.staffId),
    roleId: toStringValue(shift.roleId),
    slotId: toStringValue(shift.slotId),
    facilityId: toStringValue(shift.facilityId),
    roomId: toStringValue(shift.roomId),
    shiftDate: toStringValue(shift.shiftDate),
    startTime: normalizeTime(shift.startTime),
    endTime: normalizeTime(shift.endTime),
    maxAppointments: toNumberValue(shift.maxAppointments),
    bookedAppointments: toNumberValue(shift.bookedAppointments),
    status: toStringValue(shift.status) as PublicDoctorShiftItem["status"],
    note: toStringValue(shift.note),
    createdAt: toStringValue(shift.createdAt),
    updatedAt: toStringValue(shift.updatedAt),
    staffName: toStringValue(shift.staffName || shift.doctorName),
    roleName: toStringValue(shift.roleName),
    doctorName: toStringValue(shift.doctorName || shift.staffName),
    doctorTitle: toStringValue(shift.doctorTitle),
    doctorSpecialty: toStringValue(shift.doctorSpecialty),
    facilityCode: toStringValue(shift.facilityCode),
    facilityName: toStringValue(shift.facilityName),
    roomName: toStringValue(shift.roomName),
    roomType: toStringValue(shift.roomType),
    roomTypeId: toStringValue(shift.roomTypeId),
    roomTypeName: toStringValue(shift.roomTypeName),
    slotCode: toStringValue(shift.slotCode),
    slotName: toStringValue(shift.slotName),
  };
}

type PublicWeeklyShiftData =
  | PublicBackendDoctorShift[]
  | {
      days?: Array<{
        date?: string;
        shifts?: PublicBackendDoctorShift[];
      }>;
    };

function normalizeDoctorShiftItems(data: PublicWeeklyShiftData): PublicDoctorShiftItem[] {
  if (Array.isArray(data)) {
    return data.map(normalizeDoctorShift);
  }

  if (Array.isArray(data.days)) {
    return data.days.flatMap((day) =>
      (day.shifts ?? []).map((shift) =>
        normalizeDoctorShift({
          ...shift,
          shiftDate: shift.shiftDate || day.date || "",
        }),
      ),
    );
  }

  return [];
}

export async function getPublicWeeklyDoctorShifts(
  params: PublicWeeklyDoctorShiftsParams,
): Promise<PublicDoctorShiftItem[]> {
  const data = await unwrapApiData<PublicWeeklyShiftData>(
    apiClient.get(`${ENDPOINT}/weekly`, {
      params: compactObject({
        facilityId: params.facilityId?.trim(),
        doctorId: params.doctorId?.trim(),
        specialty: params.specialty?.trim(),
        weekStart: params.weekStart,
      }),
    }),
  );

  return normalizeDoctorShiftItems(data);
}

export function getPublicDoctorAvailability(
  doctorId: string,
  params: PublicDoctorAvailabilityParams,
) {
  return unwrapApiData<PublicDoctorAvailabilityResponse>(
    apiClient.get(`${ENDPOINT}/availability/doctors/${doctorId}`, {
      params: compactObject({
        facilityId: params.facilityId?.trim(),
        date: params.date,
        slotMinutes: params.slotMinutes ?? 30,
      }),
    }),
  );
}
