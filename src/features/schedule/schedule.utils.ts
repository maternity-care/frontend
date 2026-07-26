import dayjs from "dayjs";
import type { PregnancyScheduleItem } from "./schedule.types";

export const USER_SCHEDULES_STORAGE_KEY = "maternity-care:user-schedules";

export function buildGoogleCalendarUrl(schedule: PregnancyScheduleItem) {
  const start = dayjs(`${schedule.date} ${schedule.time}`, "YYYY-MM-DD HH:mm");
  const end = start.add(1, "hour");
  const details = [schedule.note, schedule.doctor ? `Bác sĩ: ${schedule.doctor}` : undefined]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: schedule.title,
    dates: `${start.format("YYYYMMDDTHHmmss")}/${end.format("YYYYMMDDTHHmmss")}`,
    details,
    location: schedule.location ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value?: string) {
  return (value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatIcsDateTime(schedule: PregnancyScheduleItem, addHours = 0) {
  return dayjs(`${schedule.date} ${schedule.time}`, "YYYY-MM-DD HH:mm")
    .add(addHours, "hour")
    .format("YYYYMMDDTHHmmss");
}

export function buildSchedulesIcs(schedules: PregnancyScheduleItem[]) {
  const now = dayjs().format("YYYYMMDDTHHmmss");
  const events = schedules.map((schedule) => {
    const description = [schedule.note, schedule.doctor ? `Bác sĩ: ${schedule.doctor}` : undefined]
      .filter(Boolean)
      .join("\n");

    return [
      "BEGIN:VEVENT",
      `UID:${schedule.id}@maternity-care.local`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDateTime(schedule)}`,
      `DTEND:${formatIcsDateTime(schedule, 1)}`,
      `SUMMARY:${escapeIcsText(schedule.title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText(schedule.location)}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Maternity Care//Pregnancy Schedule//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadSchedulesIcs(schedules: PregnancyScheduleItem[]) {
  if (typeof window === "undefined") return;

  const blob = new Blob([buildSchedulesIcs(schedules)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "lich-thai-ky.ics";
  link.click();
  URL.revokeObjectURL(url);
}

export function readStoredSchedules() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(USER_SCHEDULES_STORAGE_KEY);
    if (!raw) return [];

    const schedules = JSON.parse(raw);
    return Array.isArray(schedules) ? (schedules as PregnancyScheduleItem[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredSchedules(schedules: PregnancyScheduleItem[]) {
  if (typeof window === "undefined") return;

  const userSchedules = schedules.filter((schedule) => schedule.createdByUser);
  window.localStorage.setItem(USER_SCHEDULES_STORAGE_KEY, JSON.stringify(userSchedules));
}
