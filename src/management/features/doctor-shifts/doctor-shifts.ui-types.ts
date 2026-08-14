import type {
  DoctorShiftItem,
  DoctorShiftWorkingDay,
} from "./doctor-shifts.types";

export type FacilityOption = {
  id: string;
  name: string;
  code: string;
  address: string;
};

export type RoomOption = {
  id: string;
  facilityId: string;
  name: string;
  floor: string;
};

export type DoctorOption = {
  id: string;
  staffId: string;
  roleId: string;
  name: string;
  title: string;
  specialty: string;
  status: "active" | "inactive";
  facilityIds: string[];
};

export type WeeklyScheduleRow = {
  key: string;
  slotId: string;
  slotName: string;
  slotCode: string;
  facilityId: string;
  facilityName: string;
  startTime: string;
  endTime: string;
  shiftsByDate: Record<string, DoctorShiftItem[]>;
};

export type DayShiftGroupMeta = {
  key: string;
  groupIndex: number;
  rowSpan: number;
  isFirstRow: boolean;
};


export type WeeklyAssignmentFormValue = {
  staffId: string;
  roleId?: string | null;
  roomId: string;
  workingDays: DoctorShiftWorkingDay[];
  maxAppointments: number;
  status: "available" | "off";
};

export type WeeklySlotGroupFormValue = {
  slotId: string;
  assignments: WeeklyAssignmentFormValue[];
};
