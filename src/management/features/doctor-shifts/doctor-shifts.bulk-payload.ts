import type {
  BulkGenerateDoctorShiftsInput,
} from "./doctor-shifts.types";
import type { DoctorOption } from "./doctor-shifts.ui-types";
import type { BulkGenerateFormValues } from "./doctor-shifts.bulk-draft";
import { isNextWeekMondayDateKey } from "./doctor-shifts.weekly-utils";
import { addDaysToDoctorShiftDateKey } from "./doctor-shifts.utils";

export function buildBulkGeneratePayload(
  values: BulkGenerateFormValues,
  doctors: DoctorOption[],
): BulkGenerateDoctorShiftsInput {
  if (!isNextWeekMondayDateKey(values.fromDate)) {
    throw new Error("Chỉ được xếp lịch cho tuần kế tiếp.");
  }

  const slotAssignments = (values.slotGroups ?? [])
    .map((group) => ({
      slotId: group.slotId.trim(),
      assignments: (group.assignments ?? []).map((assignment) => {
        const doctor = doctors.find(
          (item) => item.staffId === assignment.staffId,
        );
        if (!doctor) {
          throw new Error(
            "Không tìm thấy thông tin nhân sự của bác sĩ đã chọn.",
          );
        }

        return {
          staffId: assignment.staffId.trim(),
          roleId: String(doctor.roleId),
          roomId: assignment.roomId.trim(),
          workingDays: assignment.workingDays,
          maxAppointments: Number(assignment.maxAppointments),
          status: assignment.status,
        };
      }),
    }))
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
