import type { BackendGroupedDoctorShifts } from "./doctor-shifts.types";
import type {
  DoctorOption,
  RoomOption,
  WeeklySlotGroupFormValue,
} from "./doctor-shifts.ui-types";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import { DOCTOR_SHIFT_WORKING_DAY_OPTIONS } from "./doctor-shifts.constants";
import { sanitizeSlotWorkingDays } from "./doctor-shifts.weekly-utils";

export function buildImportedWeekSlotGroups({
  schedule,
  shiftSlots,
  rooms,
  doctors,
  facilityId,
}: {
  schedule: BackendGroupedDoctorShifts;
  shiftSlots: ShiftSlotLookupItem[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  facilityId: string;
}) {
  const activeSlotById = new Map(shiftSlots.map((slot) => [slot.id, slot]));
  const availableRoomIds = new Set(
    rooms
      .filter((room) => room.facilityId === facilityId)
      .map((room) => room.id),
  );
  const assignmentMaps = new Map<
    string,
    Map<string, WeeklySlotGroupFormValue["assignments"][number]>
  >();
  let skippedGroups = 0;

  for (const group of schedule.groups ?? []) {
    const sourceShift = group.shifts?.[0];

    if (!sourceShift) {
      skippedGroups += 1;
      continue;
    }

    const slotId = String(sourceShift.slotId ?? "");
    const staffId = String(sourceShift.staffId ?? "");
    const roleId = String(sourceShift.roleId ?? "");
    const roomId = String(sourceShift.roomId ?? "");
    // BE trả roomId=null khi phòng cũ inactive/đã xóa; giữ phân công và để FE bắt chọn phòng mới.
    const resolvedRoomId = roomId && availableRoomIds.has(roomId) ? roomId : "";
    const doctor = doctors.find(
      (item) =>
        item.staffId === staffId &&
        String(item.roleId) === roleId &&
        item.status === "active" &&
        item.facilityIds.includes(facilityId),
    );
    const slot = activeSlotById.get(slotId);
    const knownWorkingDays = (group.workingDays ?? []).filter((day) =>
      DOCTOR_SHIFT_WORKING_DAY_OPTIONS.some((option) => option.value === day),
    );
    const workingDays = slot
      ? sanitizeSlotWorkingDays(slot, knownWorkingDays)
      : [];

    if (
      !slotId ||
      !slot ||
      !doctor ||
      workingDays.length === 0
    ) {
      skippedGroups += 1;
      continue;
    }

    const status = sourceShift.status === "off" ? "off" : "available";
    const maxAppointments = Math.max(
      1,
      Number(sourceShift.maxAppointments) || 8,
    );
    const assignmentKey = [staffId, resolvedRoomId, status, maxAppointments].join(":");
    const assignments = assignmentMaps.get(slotId) ?? new Map();
    const existing = assignments.get(assignmentKey);

    assignments.set(assignmentKey, {
      staffId,
      roleId: doctor.roleId,
      roomId: resolvedRoomId,
      status,
      maxAppointments,
      workingDays: Array.from(
        new Set([...(existing?.workingDays ?? []), ...workingDays]),
      ),
    });
    assignmentMaps.set(slotId, assignments);
  }

  const slotGroups: WeeklySlotGroupFormValue[] = shiftSlots.map((slot) => ({
    slotId: slot.id,
    assignments: Array.from(assignmentMaps.get(slot.id)?.values() ?? []),
  }));
  const importedAssignments = slotGroups.reduce(
    (total, group) => total + group.assignments.length,
    0,
  );

  return {
    slotGroups,
    importedAssignments,
    skippedGroups,
  };
}
