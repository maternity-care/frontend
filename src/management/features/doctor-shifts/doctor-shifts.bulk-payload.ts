import type {
  BulkGenerateDoctorShiftsInput,
} from "./doctor-shifts.types";
import type { DoctorOption } from "./doctor-shifts.ui-types";
import type { BulkGenerateFormValues } from "./doctor-shifts.bulk-draft";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import {
  isNextWeekMondayDateKey,
  sanitizeSlotWorkingDays,
} from "./doctor-shifts.weekly-utils";
import { addDaysToDoctorShiftDateKey } from "./doctor-shifts.utils";

export function buildBulkGeneratePayload(
  values: BulkGenerateFormValues,
  doctors: DoctorOption[],
  shiftSlots: ShiftSlotLookupItem[],
): BulkGenerateDoctorShiftsInput {
  if (!isNextWeekMondayDateKey(values.fromDate)) {
    throw new Error("Chỉ được xếp lịch cho tuần kế tiếp.");
  }

  const slotAssignments = (values.slotGroups ?? [])
    .map((group) => {
      const slotId = group.slotId.trim();
      const slot = shiftSlots.find((item) => item.id === slotId);
      if (!slot) {
        throw new Error("Khung ca đã bị xóa hoặc không còn hoạt động.");
      }

      return {
        slotId,
        assignments: (group.assignments ?? []).map((assignment) => {
          const doctor = doctors.find(
            (item) => item.staffId === assignment.staffId,
          );
          if (!doctor) {
            throw new Error(
              "Không tìm thấy thông tin nhân sự của bác sĩ đã chọn.",
            );
          }

          const workingDays = sanitizeSlotWorkingDays(
            slot,
            assignment.workingDays,
          );
          if (workingDays.length === 0) {
            throw new Error(
              `Khung ca ${slot.name} không còn ngày áp dụng phù hợp.`,
            );
          }

          return {
            staffId: assignment.staffId.trim(),
            roleId: String(doctor.roleId),
            roomId: assignment.roomId.trim(),
            workingDays,
            maxAppointments: Number(assignment.maxAppointments),
            status: assignment.status,
          };
        }),
      };
    })
    .filter((group) => group.assignments.length > 0);

  if (slotAssignments.length === 0) {
    throw new Error(
      "Vui lòng phân công ít nhất một bác sĩ vào một khung ca.",
    );
  }

  return {
    facilityId: values.facilityId.trim(),
    fromDate: values.fromDate,
    toDate: addDaysToDoctorShiftDateKey(values.fromDate, 6),
    slotAssignments,
    saveOnlyValid: true,
  };
}
