import type { Staff } from "@/management/features/staffs/staffs.types";
import { DOCTOR_EXPERIENCE_OPTIONS } from "./doctors.constants";
import type {
  Doctor,
  DoctorExperienceLevel,
  DoctorStatus,
} from "./doctors.types";

export function getDoctorErrorMessage(
  error: unknown,
  fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.",
) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            errors?: { fields?: string[] };
          };
        };
      }
    ).response;

    const fields = response?.data?.errors?.fields;
    if (Array.isArray(fields) && fields.length > 0) {
      return fields.join(", ");
    }

    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
  }

  return error instanceof Error ? error.message : fallback;
}

export function getDoctorExperienceLabel(value: DoctorExperienceLevel) {
  return (
    DOCTOR_EXPERIENCE_OPTIONS.find((item) => item.value === value)?.label ??
    "Chưa cập nhật"
  );
}

export function getDoctorStatusLabel(status: DoctorStatus) {
  return status === "active" ? "Hoạt động" : "Ngừng hoạt động";
}

export function doctorBelongsToFacility(
  doctor: Doctor,
  facilityId: string,
) {
  if (!facilityId) return false;

  if (doctor.facilityIds.length > 0) {
    return doctor.facilityIds.some((item) => String(item) === facilityId);
  }

  return String(doctor.facilityId ?? "") === facilityId;
}

export function readStaffFacilityIds(user: Staff) {
  const profile = user.staffProfile as
    | {
        facilityId?: unknown;
        homeFacilityId?: unknown;
        facilityAssignments?: Array<{ facilityId?: unknown }> | null;
      }
    | null
    | undefined;

  const directFacilityId = (
    user as unknown as { facilityId?: unknown }
  ).facilityId;

  return Array.from(
    new Set(
      [
        profile?.facilityId,
        profile?.homeFacilityId,
        directFacilityId,
        ...(profile?.facilityAssignments ?? []).map(
          (assignment) => assignment.facilityId,
        ),
      ]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );
}

export function formatDoctorDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function mergeDoctorDetail(current: Doctor, detail: Doctor): Doctor {
  const fallbackName = `Bác sĩ #${detail.id}`;

  return {
    ...current,
    ...detail,
    name:
      detail.name && detail.name !== fallbackName ? detail.name : current.name,
    employeeCode: detail.employeeCode || current.employeeCode,
    personalEmail: detail.personalEmail || current.personalEmail,
    email: detail.email || current.email,
    phone: detail.phone || current.phone,
    address: detail.address || current.address,
    facilityId: detail.facilityId || current.facilityId,
    facilityIds:
      detail.facilityIds.length > 0 ? detail.facilityIds : current.facilityIds,
    workingRoomTypeId:
      detail.workingRoomTypeId || current.workingRoomTypeId,
  };
}