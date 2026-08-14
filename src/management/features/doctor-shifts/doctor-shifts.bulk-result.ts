import { isRecord } from "./doctor-shifts.utils";

export function getResponseMessage(
  raw: unknown,
  fallback: string,
) {
  if (!isRecord(raw)) return fallback;

  if (typeof raw.message === "string") {
    return raw.message;
  }

  if (
    isRecord(raw.data) &&
    typeof raw.data.message === "string"
  ) {
    return raw.data.message;
  }

  return fallback;
}


export type BulkGenerationIssue = {
  source: "conflict" | "skipped";
  slotAssignmentIndex: number;
  assignmentIndex: number;
  shiftDate: string;
  startTime: string;
  endTime: string;
  staffId: string;
  roomId: string;
  reason: string;
  hasDoctorConflict: boolean;
  hasRoomConflict: boolean;
};

export type BulkGenerationResult = {
  recognized: boolean;
  canConfirm?: boolean;
  allOrNothingRejected: boolean;
  totalCandidates: number;
  valid: number;
  skipped: number;
  conflicted: number;
  createdCount: number;
  issues: BulkGenerationIssue[];
};

function readNumberValue(
  value: unknown,
  fallback = 0,
) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function readStringValue(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readRecordArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(isRecord)
    : [];
}

export function readBulkGenerationResult(
  raw: unknown,
): BulkGenerationResult {
  const rawRecord = isRecord(raw)
    ? raw
    : {};

  const root =
    isRecord(rawRecord.data) &&
    (
      "summary" in rawRecord.data ||
      "conflictItems" in rawRecord.data ||
      "skippedItems" in rawRecord.data ||
      "createdCount" in rawRecord.data
    )
      ? rawRecord.data
      : rawRecord;

  const summary = isRecord(root.summary)
    ? root.summary
    : {};

  const conflictItems =
    readRecordArray(root.conflictItems);
  const skippedItems =
    readRecordArray(root.skippedItems);

  function parseIssue(
    issue: Record<string, unknown>,
    source: BulkGenerationIssue["source"],
  ): BulkGenerationIssue {
    const candidate = isRecord(
      issue.candidate,
    )
      ? issue.candidate
      : {};

    const doctorConflicts =
      readRecordArray(
        issue.doctorConflicts,
      );
    const roomConflicts =
      readRecordArray(
        issue.roomConflicts,
      );

    return {
      source,
      slotAssignmentIndex:
        readNumberValue(
          issue.slotAssignmentIndex ??
            candidate.slotAssignmentIndex,
          -1,
        ),
      assignmentIndex:
        readNumberValue(
          issue.assignmentIndex ??
            candidate.assignmentIndex,
          -1,
        ),
      shiftDate:
        readStringValue(
          issue.shiftDate ??
            candidate.shiftDate,
        ),
      startTime:
        readStringValue(
          candidate.startTime ??
            issue.startTime,
        ),
      endTime:
        readStringValue(
          candidate.endTime ??
            issue.endTime,
        ),
      staffId:
        readStringValue(
          candidate.staffId ??
            issue.staffId,
        ),
      roomId:
        readStringValue(
          candidate.roomId ??
            issue.roomId,
        ),
      reason:
        readStringValue(
          issue.reason ??
            issue.message,
        ) ||
        (
          source === "conflict"
            ? "Ca trực bị trùng lịch."
            : "Ca trực không thể được tạo."
        ),
      hasDoctorConflict:
        doctorConflicts.length > 0 ||
        Boolean(
          issue.doctorConflict ??
            issue.hasDoctorConflict,
        ),
      hasRoomConflict:
        roomConflicts.length > 0 ||
        Boolean(
          issue.roomConflict ??
            issue.hasRoomConflict,
        ),
    };
  }

  const recognized =
    "summary" in root ||
    "canConfirm" in root ||
    "allOrNothingRejected" in root ||
    "createdCount" in root ||
    "conflictItems" in root ||
    "skippedItems" in root;

  return {
    recognized,
    canConfirm:
      typeof root.canConfirm ===
      "boolean"
        ? root.canConfirm
        : undefined,
    allOrNothingRejected:
      root.allOrNothingRejected ===
      true,
    totalCandidates:
      readNumberValue(
        summary.totalCandidates,
      ),
    valid:
      readNumberValue(summary.valid),
    skipped:
      readNumberValue(
        summary.skipped,
        skippedItems.length,
      ),
    conflicted:
      readNumberValue(
        summary.conflicted,
        conflictItems.length,
      ),
    createdCount:
      readNumberValue(
        root.createdCount,
        Array.isArray(
          root.createdShifts,
        )
          ? root.createdShifts.length
          : 0,
      ),
    issues: [
      ...conflictItems.map(
        (issue) =>
          parseIssue(
            issue,
            "conflict",
          ),
      ),
      ...skippedItems.map(
        (issue) =>
          parseIssue(
            issue,
            "skipped",
          ),
      ),
    ],
  };
}

export function formatIssueTime(value: string) {
  return value
    ? value.slice(0, 5)
    : "";
}

