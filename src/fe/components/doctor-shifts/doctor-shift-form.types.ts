import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import type {
  CreateDoctorShiftInput,
  DoctorShiftItem,
  DoctorShiftStatus,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";

export type ShiftAssignmentFormValue = {
  doctorId: string;
  roomId: string;
  slotId?: string;
  maxAppointments: number;
};

export type ShiftSlotGroupFormValue = {
  slotId: string;
  assignments: ShiftAssignmentFormValue[];
};

export type ShiftFormValues = {
  shiftDate: string;
  facilityId: string;
  status?: DoctorShiftStatus;
  note: string;
  assignments: ShiftAssignmentFormValue[];
  slotGroups: ShiftSlotGroupFormValue[];
};

export type DoctorFieldPath =
  | ["assignments", number, "doctorId"]
  | ["slotGroups", number, "assignments", number, "doctorId"];

export type RoomFieldPath =
  | ["assignments", number, "roomId"]
  | ["slotGroups", number, "assignments", number, "roomId"];

export type ShiftFormPayload = Omit<
  CreateDoctorShiftInput,
  "roomId" | "status"
> & {
  roomId: string | null;
  status: DoctorShiftStatus;
};

export type ValidatedShiftForm = {
  payloads: ShiftFormPayload[];
  slotById: Map<string, ShiftSlotLookupItem>;
};

export type DoctorShiftFormModalBaseProps = {
  mode: "create" | "edit";
  open: boolean;
  editingShift?: DoctorShiftItem | null;
  shifts: DoctorShiftItem[];
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  onClose: () => void;
  onSubmitValidated: (value: ValidatedShiftForm) => Promise<string>;
};
