import { UserProfile } from "../profile/profile.types";

export type PregnancyScheduleStatus = "upcoming" | "done" | "missed";

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
};
