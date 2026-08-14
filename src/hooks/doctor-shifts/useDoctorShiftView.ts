"use client";

import { useMemo, useState } from "react";
import type { DoctorShiftItem, DoctorShiftStatus } from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DayShiftGroupMeta,
  FacilityOption,
  WeeklyScheduleRow,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import type { DoctorShiftViewMode } from "@/management/features/doctor-shifts/doctor-shifts.constants";
import {
  DOCTOR_SHIFT_TODAY,
  addDoctorShiftDays,
  getDayShiftGroupKey,
  getDoctorShiftMonthGrid,
  getDoctorShiftShortLabel,
  parseDoctorShiftDateKey,
  startOfDoctorShiftWeek,
  toDoctorShiftDateKey,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";

type Props = {
  shifts: DoctorShiftItem[];
  facilityById: Map<string, FacilityOption>;
  canViewAllFacilities: boolean;
};

export function useDoctorShiftView({
  shifts,
  facilityById,
  canViewAllFacilities,
}: Props) {
  const [viewMode, setViewMode] = useState<DoctorShiftViewMode>("week");
  const [selectedDate, setSelectedDate] = useState(DOCTOR_SHIFT_TODAY);
  const [keyword, setKeyword] = useState("");
  const [facilityFilter, setFacilityFilter] = useState<string>();
  const [roomFilter, setRoomFilter] = useState<string>();
  const [doctorFilter, setDoctorFilter] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<DoctorShiftStatus>();

  const filteredShifts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return shifts.filter((shift) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          shift.id,
          shift.slotId,
          shift.slotCode,
          shift.slotName,
          shift.doctorName,
          shift.doctorTitle,
          shift.doctorSpecialty,
          shift.facilityName,
          shift.facilityCode,
          shift.roomName,
          shift.roomType,
          shift.roomTypeName,
          shift.note,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedKeyword),
        );

      return (
        matchesKeyword &&
        (!canViewAllFacilities || !facilityFilter || shift.facilityId === facilityFilter) &&
        (!roomFilter || shift.roomId === roomFilter) &&
        (!doctorFilter || shift.doctorId === doctorFilter) &&
        (!statusFilter || shift.status === statusFilter)
      );
    });
  }, [
    canViewAllFacilities,
    doctorFilter,
    facilityFilter,
    keyword,
    roomFilter,
    shifts,
    statusFilter,
  ]);

  const scopedShifts = useMemo(() => {
    if (viewMode === "day") {
      return filteredShifts.filter((shift) => shift.shiftDate === selectedDate);
    }

    if (viewMode === "week") {
      const start = toDoctorShiftDateKey(startOfDoctorShiftWeek(selectedDate));
      const end = toDoctorShiftDateKey(
        addDoctorShiftDays(startOfDoctorShiftWeek(selectedDate), 6),
      );
      return filteredShifts.filter(
        (shift) => shift.shiftDate >= start && shift.shiftDate <= end,
      );
    }

    const selected = parseDoctorShiftDateKey(selectedDate);
    return filteredShifts.filter((shift) => {
      const date = parseDoctorShiftDateKey(shift.shiftDate);
      return (
        date.getFullYear() === selected.getFullYear() &&
        date.getMonth() === selected.getMonth()
      );
    });
  }, [filteredShifts, selectedDate, viewMode]);

  const sortedScopedShifts = useMemo(
    () =>
      [...scopedShifts].sort((first, second) =>
        `${first.shiftDate}-${first.startTime}`.localeCompare(
          `${second.shiftDate}-${second.startTime}`,
        ),
      ),
    [scopedShifts],
  );

  const dayTableShifts = useMemo(() => {
    if (viewMode !== "day") return sortedScopedShifts;

    return [...sortedScopedShifts].sort((first, second) => {
      const firstFacility =
        first.facilityName || facilityById.get(first.facilityId)?.name || "";
      const secondFacility =
        second.facilityName || facilityById.get(second.facilityId)?.name || "";

      return [
        first.startTime,
        first.endTime,
        firstFacility,
        getDayShiftGroupKey(first),
        first.doctorName,
        first.roomName,
      ]
        .join("|")
        .localeCompare(
          [
            second.startTime,
            second.endTime,
            secondFacility,
            getDayShiftGroupKey(second),
            second.doctorName,
            second.roomName,
          ].join("|"),
        );
    });
  }, [facilityById, sortedScopedShifts, viewMode]);

  const dayShiftGroupMeta = useMemo(() => {
    const metadata: DayShiftGroupMeta[] = [];
    let groupIndex = -1;
    let index = 0;

    while (index < dayTableShifts.length) {
      const groupKey = getDayShiftGroupKey(dayTableShifts[index]);
      let groupEnd = index + 1;

      while (
        groupEnd < dayTableShifts.length &&
        getDayShiftGroupKey(dayTableShifts[groupEnd]) === groupKey
      ) {
        groupEnd += 1;
      }

      groupIndex += 1;
      const groupSize = groupEnd - index;

      for (let rowIndex = index; rowIndex < groupEnd; rowIndex += 1) {
        metadata[rowIndex] = {
          key: groupKey,
          groupIndex,
          rowSpan: rowIndex === index ? groupSize : 0,
          isFirstRow: rowIndex === index,
        };
      }

      index = groupEnd;
    }

    return metadata;
  }, [dayTableShifts]);

  const monthGrid = useMemo(
    () => getDoctorShiftMonthGrid(selectedDate),
    [selectedDate],
  );

  const weekDays = useMemo(() => {
    const weekStart = startOfDoctorShiftWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) =>
      addDoctorShiftDays(weekStart, index),
    );
  }, [selectedDate]);

  const weeklyScheduleRows = useMemo(() => {
    const rows = new Map<string, WeeklyScheduleRow>();

    sortedScopedShifts.forEach((shift) => {
      const slotIdentity =
        shift.slotId || shift.slotCode || `${shift.startTime}-${shift.endTime}`;
      const rowKey = `${shift.facilityId}:${slotIdentity}`;
      const existing = rows.get(rowKey);
      const row: WeeklyScheduleRow = existing ?? {
        key: rowKey,
        slotId: shift.slotId,
        slotName:
          shift.slotName ||
          shift.slotCode ||
          getDoctorShiftShortLabel(shift.startTime),
        slotCode: shift.slotCode,
        facilityId: shift.facilityId,
        facilityName:
          shift.facilityName || facilityById.get(shift.facilityId)?.name || "",
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftsByDate: {},
      };

      const dayShifts = row.shiftsByDate[shift.shiftDate] ?? [];
      dayShifts.push(shift);
      row.shiftsByDate[shift.shiftDate] = dayShifts;
      rows.set(rowKey, row);
    });

    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        shiftsByDate: Object.fromEntries(
          Object.entries(row.shiftsByDate).map(([dateKey, dayShifts]) => [
            dateKey,
            [...dayShifts].sort((first, second) =>
              `${first.doctorName}-${first.roomName}`.localeCompare(
                `${second.doctorName}-${second.roomName}`,
              ),
            ),
          ]),
        ),
      }))
      .sort((first, second) =>
        `${first.startTime}-${first.endTime}-${first.facilityName}`.localeCompare(
          `${second.startTime}-${second.endTime}-${second.facilityName}`,
        ),
      );
  }, [facilityById, sortedScopedShifts]);

  const periodStartDate = useMemo(() => {
    if (viewMode === "week") {
      return toDoctorShiftDateKey(startOfDoctorShiftWeek(selectedDate));
    }
    if (viewMode === "month") {
      const current = parseDoctorShiftDateKey(selectedDate);
      return toDoctorShiftDateKey(
        new Date(current.getFullYear(), current.getMonth(), 1),
      );
    }
    return selectedDate;
  }, [selectedDate, viewMode]);

  function movePeriod(direction: -1 | 1) {
    if (viewMode === "day") {
      setSelectedDate(
        toDoctorShiftDateKey(addDoctorShiftDays(selectedDate, direction)),
      );
      return;
    }
    if (viewMode === "week") {
      setSelectedDate(
        toDoctorShiftDateKey(addDoctorShiftDays(selectedDate, direction * 7)),
      );
      return;
    }

    const current = parseDoctorShiftDateKey(selectedDate);
    setSelectedDate(
      toDoctorShiftDateKey(
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
      ),
    );
  }

  function handlePeriodStartChange(value: string) {
    if (!value) return;
    if (viewMode === "week") {
      setSelectedDate(toDoctorShiftDateKey(startOfDoctorShiftWeek(value)));
      return;
    }
    if (viewMode === "month") {
      const selected = parseDoctorShiftDateKey(value);
      setSelectedDate(
        toDoctorShiftDateKey(
          new Date(selected.getFullYear(), selected.getMonth(), 1),
        ),
      );
      return;
    }
    setSelectedDate(value);
  }

  function resetFilters() {
    setSelectedDate(DOCTOR_SHIFT_TODAY);
    setKeyword("");
    setFacilityFilter(undefined);
    setRoomFilter(undefined);
    setDoctorFilter(undefined);
    setStatusFilter(undefined);
  }

  return {
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
    keyword,
    setKeyword,
    facilityFilter,
    setFacilityFilter,
    roomFilter,
    setRoomFilter,
    doctorFilter,
    setDoctorFilter,
    statusFilter,
    setStatusFilter,
    filteredShifts,
    sortedScopedShifts,
    dayTableShifts,
    dayShiftGroupMeta,
    monthGrid,
    weekDays,
    weeklyScheduleRows,
    periodStartDate,
    movePeriod,
    handlePeriodStartChange,
    resetFilters,
  };
}
