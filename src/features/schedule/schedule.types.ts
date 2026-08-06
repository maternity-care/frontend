export type PregnancyScheduleStatus = "upcoming" | "done" | "missed" | "action_required" | "cancelled";

export type PregnancyScheduleType =
  | "checkup"
  | "ultrasound"
  | "lab"
  | "medicine"
  | "consultation"
  | "reminder";

export type PregnancyScheduleItem = {
  id: string;
  title: string;
  type: PregnancyScheduleType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location?: string;
  doctor?: string;
  status: PregnancyScheduleStatus;
  note?: string;
  createdByUser?: boolean;
  source?: "manual" | "appointment" | string;
  appointmentId?: string | null;
};
