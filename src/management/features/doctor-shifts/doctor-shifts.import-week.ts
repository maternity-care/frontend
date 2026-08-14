import type { BackendGroupedDoctorShifts } from "./doctor-shifts.types";
import type {
  DoctorOption,
  RoomOption,
  WeeklySlotGroupFormValue,
} from "./doctor-shifts.ui-types";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import { DOCTOR_SHIFT_WORKING_DAY_OPTIONS } from "./doctor-shifts.constants";

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
  const activeSlotIds = new Set(shiftSlots.map((slot) => slot.id));
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

    if (!sourceShift || sourceShift.status === "cancelled") {
      skippedGroups += 1;
      continue;
    }

    const slotId = String(sourceShift.slotId ?? "");
    const staffId = String(sourceShift.staffId ?? "");
    const roleId = String(sourceShift.roleId ?? "");
    const roomId = String(sourceShift.roomId ?? "");
    const doctor = doctors.find(
      (item) =>
        item.staffId === staffId &&
        String(item.roleId) === roleId &&
        item.status === "active" &&
        item.facilityIds.includes(facilityId),
    );
    const workingDays = (group.workingDays ?? []).filter((day) =>
      DOCTOR_SHIFT_WORKING_DAY_OPTIONS.some((option) => option.value === day),
    );

    if (
      !slotId ||
      !activeSlotIds.has(slotId) ||
      !doctor ||
      !roomId ||
      !availableRoomIds.has(roomId) ||
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
    const assignmentKey = [staffId, roomId, status, maxAppointments].join(":");
    const assignments = assignmentMaps.get(slotId) ?? new Map();
    const existing = assignments.get(assignmentKey);

    assignments.set(assignmentKey, {
      staffId,
      roleId: doctor.roleId,
      roomId,
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
