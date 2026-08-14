"use client";

import { useCallback, useRef, useState } from "react";
import type { FormInstance } from "antd";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import type {
  DoctorOption,
  RoomOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import type {
  BulkGenerateFormValues,
} from "@/management/features/doctor-shifts/doctor-shifts.bulk-draft";
import type {
  BulkGenerationIssue,
  BulkGenerationResult,
} from "@/management/features/doctor-shifts/doctor-shifts.bulk-result";
import { formatIssueTime } from "@/management/features/doctor-shifts/doctor-shifts.bulk-result";
import { formatDoctorShiftIssueDate } from "@/management/features/doctor-shifts/doctor-shifts.utils";

type IssueFieldPath =
  | ["slotGroups", number, "assignments", number, "staffId"]
  | ["slotGroups", number, "assignments", number, "roomId"];

type Props = {
  form: FormInstance<BulkGenerateFormValues>;
  slotById: Map<string, ShiftSlotLookupItem>;
  doctors: DoctorOption[];
  rooms: RoomOption[];
};

export function useDoctorShiftBulkIssues({
  form,
  slotById,
  doctors,
  rooms,
}: Props) {
  const [generationIssues, setGenerationIssues] = useState<string[]>([]);
  const issueFieldPathsRef = useRef<IssueFieldPath[]>([]);

  const clearIssueFields = useCallback(() => {
    if (issueFieldPathsRef.current.length > 0) {
      form.setFields(
        issueFieldPathsRef.current.map((name) => ({
          name,
          errors: [] as string[],
        })),
      );
    }
    issueFieldPathsRef.current = [];
  }, [form]);

  const clearIssues = useCallback(() => {
    clearIssueFields();
    setGenerationIssues([]);
  }, [clearIssueFields]);

  const getDisplayData = useCallback((
    issue: BulkGenerationIssue,
    values: BulkGenerateFormValues,
  ) => {
    const group = values.slotGroups?.[issue.slotAssignmentIndex];
    const assignment = group?.assignments?.[issue.assignmentIndex];
    const slot = slotById.get(group?.slotId ?? "");
    const staffId = issue.staffId || assignment?.staffId || "";
    const doctor = doctors.find((item) => item.staffId === staffId);
    const roomId = issue.roomId || assignment?.roomId || "";
    const room = rooms.find((item) => item.id === roomId);

    return {
      slotLabel:
        slot?.name ||
        slot?.code ||
        (issue.slotAssignmentIndex >= 0
          ? `Khung ca ${issue.slotAssignmentIndex + 1}`
          : "Không rõ khung ca"),
      assignmentLabel:
        issue.assignmentIndex >= 0
          ? `Phân công ${issue.assignmentIndex + 1}`
          : "Không rõ phân công",
      doctorLabel: doctor
        ? `${doctor.title} ${doctor.name}`
        : staffId
          ? `Nhân sự #${staffId}`
          : "Bác sĩ đã chọn",
      roomLabel: room?.name || (roomId ? `Phòng #${roomId}` : "Phòng đã chọn"),
      timeRange:
        issue.startTime && issue.endTime
          ? `${formatIssueTime(issue.startTime)} - ${formatIssueTime(issue.endTime)}`
          : "",
    };
  }, [doctors, rooms, slotById]);

  const applyIssues = useCallback((
    result: BulkGenerationResult,
    values: BulkGenerateFormValues,
  ) => {
    const fieldErrorMap = new Map<
      string,
      { name: IssueFieldPath; errors: string[] }
    >();

    const issueMessages = result.issues.map((issue) => {
      const display = getDisplayData(issue, values);
      const dateLabel = formatDoctorShiftIssueDate(issue.shiftDate);
      const prefix = [
        dateLabel,
        display.timeRange,
        display.slotLabel,
        display.assignmentLabel,
      ]
        .filter(Boolean)
        .join(" · ");
      const details: string[] = [];

      if (issue.hasDoctorConflict) {
        details.push(`${display.doctorLabel} đã có lịch trùng thời gian`);
      }
      if (issue.hasRoomConflict) {
        details.push(`${display.roomLabel} đã được sử dụng trong thời gian này`);
      }
      if (details.length === 0) details.push(issue.reason);
      else if (issue.reason && !details.includes(issue.reason)) {
        details.push(issue.reason);
      }

      const fieldMessage = `${dateLabel}${
        display.timeRange ? ` (${display.timeRange})` : ""
      }: ${details.join(". ")}.`;

      function addFieldError(field: "staffId" | "roomId") {
        if (issue.slotAssignmentIndex < 0 || issue.assignmentIndex < 0) return;
        const name: IssueFieldPath =
          field === "staffId"
            ? [
                "slotGroups",
                issue.slotAssignmentIndex,
                "assignments",
                issue.assignmentIndex,
                "staffId",
              ]
            : [
                "slotGroups",
                issue.slotAssignmentIndex,
                "assignments",
                issue.assignmentIndex,
                "roomId",
              ];
        const key = name.join(".");
        const current = fieldErrorMap.get(key);
        if (current) current.errors.push(fieldMessage);
        else fieldErrorMap.set(key, { name, errors: [fieldMessage] });
      }

      if (issue.hasDoctorConflict) addFieldError("staffId");
      if (issue.hasRoomConflict) addFieldError("roomId");

      return `${prefix}: ${details.join(". ")}.`;
    });

    if (issueMessages.length === 0) {
      issueMessages.push(
        `Backend từ chối tạo lịch: ${result.skipped} lịch bị bỏ qua, ${result.conflicted} lịch bị trùng và ${result.createdCount} lịch được tạo.`,
      );
    }

    const fieldErrors = Array.from(fieldErrorMap.values());
    if (fieldErrors.length > 0) {
      form.setFields(fieldErrors);
      issueFieldPathsRef.current = fieldErrors.map((item) => item.name);
      window.setTimeout(() => form.scrollToField(fieldErrors[0].name), 0);
    }

    setGenerationIssues(issueMessages);
    return issueMessages;
  }, [form, getDisplayData]);

  const hasFieldIssues = useCallback(
    () => issueFieldPathsRef.current.length > 0,
    [],
  );

  return {
    generationIssues,
    setGenerationIssues,
    hasFieldIssues,
    clearIssues,
    clearIssueFields,
    applyIssues,
  };
}
