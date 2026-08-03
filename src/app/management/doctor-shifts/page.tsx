"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import { getRooms } from "@/management/features/rooms/rooms.api";
import type { ClinicRoom } from "@/management/features/rooms/rooms.types";
import { getDoctors } from "@/management/features/doctors/doctors.api";
import {
  checkDoctorShiftConflicts,
  deleteDoctorShift,
  getDoctorShift,
  getDoctorShifts,
  updateDoctorShift,
} from "@/management/features/doctor-shifts/doctor-shifts.api";
import type {
  DoctorShiftItem,
  DoctorShiftStatus,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import { DoctorShiftCreateModal } from "./components/DoctorShiftCreateModal";
import { DoctorShiftEditModal } from "./components/DoctorShiftEditModal";
import { DoctorShiftDetailModal } from "./components/DoctorShiftDetailModal";
import {
  getErrorMessage,
  readConflictResponse,
  shiftsOverlap,
} from "./components/doctor-shift-modal.shared";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "./components/doctor-shift-modal.shared";

const { Text, Title } = Typography;

type ViewMode = "day" | "week" | "month";

type WeeklyScheduleRow = {
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

type DayShiftGroupMeta = {
  key: string;
  groupIndex: number;
  rowSpan: number;
  isFirstRow: boolean;
};

const STATUS_OPTIONS: Array<{
  value: DoctorShiftStatus;
  label: string;
}> = [
  { value: "available", label: "Còn trống" },
  { value: "full", label: "Đã đầy" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "off", label: "Nghỉ" },
];

const WEEKDAY_LABELS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const TODAY = toDateKey(new Date());

function addDays(value: string | Date, amount: number) {
  const date =
    typeof value === "string"
      ? parseDateKey(value)
      : new Date(value);

  date.setDate(date.getDate() + amount);

  return date;
}

function startOfWeek(value: string | Date) {
  const date =
    typeof value === "string"
      ? parseDateKey(value)
      : new Date(value);

  const day = date.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - distanceFromMonday);

  return date;
}

function getMonthGrid(value: string) {
  const selected = parseDateKey(value);
  const firstDay = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    1,
  );
  const gridStart = startOfWeek(firstDay);

  return Array.from(
    { length: 42 },
    (_, index) => addDays(gridStart, index),
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDateKey(value));
}

function formatLongDate(value: string) {
  const formatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDateKey(value));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getPeriodTitle(
  viewMode: ViewMode,
  selectedDate: string,
) {
  if (viewMode === "day") {
    return formatLongDate(selectedDate);
  }

  if (viewMode === "week") {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = addDays(weekStart, 6);

    return `Tuần ${new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(weekStart)} - ${new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(weekEnd)}`;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(parseDateKey(selectedDate));
}

function getShiftShortLabel(startTime: string) {
  const hour = Number(startTime.split(":")[0]);

  if (hour < 12) return "Ca sáng";
  if (hour < 18) return "Ca chiều";

  return "Ca tối";
}

function getShiftAccent(startTime: string) {
  const hour = Number(startTime.split(":")[0]);

  if (hour < 12) {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  if (hour < 18) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-violet-200 bg-violet-50 text-violet-900";
}

function getDayShiftGroupKey(
  shift: DoctorShiftItem,
) {
  const slotIdentity =
    shift.slotId ||
    shift.slotCode ||
    shift.slotName ||
    `${shift.startTime}-${shift.endTime}`;

  return `${shift.facilityId}:${slotIdentity}`;
}

function getDayShiftMergedCellClass(
  startTime: string,
) {
  const hour = Number(startTime.split(":")[0]);

  if (hour < 12) {
    return "!bg-blue-50/70 !border-l-4 !border-l-blue-400 align-top";
  }

  if (hour < 18) {
    return "!bg-amber-50/70 !border-l-4 !border-l-amber-400 align-top";
  }

  return "!bg-violet-50/70 !border-l-4 !border-l-violet-400 align-top";
}

function renderStatus(status: DoctorShiftStatus) {
  if (status === "available") {
    return <Tag color="green">Còn trống</Tag>;
  }

  if (status === "full") {
    return <Tag color="blue">Đã đầy</Tag>;
  }

  if (status === "cancelled") {
    return <Tag color="red">Đã hủy</Tag>;
  }

  return <Tag>Nghỉ</Tag>;
}

export default function DoctorShiftPage() {
  const [modal, modalContextHolder] = Modal.useModal();

  const [shifts, setShifts] = useState<
    DoctorShiftItem[]
  >([]);
  const [facilities, setFacilities] = useState<
    FacilityOption[]
  >([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [doctors, setDoctors] = useState<
    DoctorOption[]
  >([]);

  const [viewMode, setViewMode] =
    useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] =
    useState(TODAY);

  const [keyword, setKeyword] = useState("");
  const [facilityFilter, setFacilityFilter] =
    useState<string>();
  const [roomFilter, setRoomFilter] =
    useState<string>();
  const [doctorFilter, setDoctorFilter] =
    useState<string>();
  const [statusFilter, setStatusFilter] =
    useState<DoctorShiftStatus>();

  const [detailShift, setDetailShift] =
    useState<DoctorShiftItem | null>(null);
  const [createModalOpen, setCreateModalOpen] =
    useState(false);
  const [editingShift, setEditingShift] =
    useState<DoctorShiftItem | null>(null);
  const [deletingShift, setDeletingShift] =
    useState<DoctorShiftItem | null>(null);
  const [deleteReason, setDeleteReason] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [deleteLoading, setDeleteLoading] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      getDoctorShifts({ limit: 30 }),
      getFacilities(),
      getRooms({
        status: "active",
        page: 1,
        limit: 100,
      }),
      getDoctors({
        page: 1,
        limit: 50,
        status: "active",
        sortYearsOfExperience: "desc",
      }),
    ])
      .then(
        ([
          shiftData,
          facilityData,
          roomResult,
          doctorData,
        ]) => {
          if (cancelled) return;

          const doctorInfoById = new Map<
            string,
            {
              name: string;
              title: string;
              specialty: string;
            }
          >();

          shiftData.forEach((shift) => {
            if (
              doctorInfoById.has(
                shift.doctorId,
              )
            ) {
              return;
            }

            doctorInfoById.set(
              shift.doctorId,
              {
                name:
                  shift.doctorName ||
                  `Bác sĩ #${shift.doctorId}`,
                title:
                  shift.doctorTitle ||
                  "Bác sĩ",
                specialty:
                  shift.doctorSpecialty ||
                  "Chưa cập nhật",
              },
            );
          });

          setShifts(shiftData);

          setFacilities(
            facilityData
              .filter(
                (facility) =>
                  facility.status === "active",
              )
              .map((facility) => ({
                id: facility.id,
                name: facility.name,
                code: facility.code,
                address: facility.address,
              })),
          );

          setRooms(
            roomResult.items
              .filter(
                (room: ClinicRoom) =>
                  room.status === "active",
              )
              .map(
                (room: ClinicRoom) => ({
                  id: room.id,
                  facilityId:
                    room.facilityId,
                  name: room.roomName,
                  floor: room.floor,
                }),
              ),
          );

          setDoctors(
            doctorData.items.map((doctor) => {
              const shiftDoctor =
                doctorInfoById.get(
                  doctor.id,
                );

              return {
                id: doctor.id,
                name:
                  doctor.name ||
                  shiftDoctor?.name ||
                  `Bác sĩ #${doctor.id}`,
                title:
                  doctor.title ||
                  shiftDoctor?.title ||
                  "Bác sĩ",
                specialty:
                  doctor.specialty ||
                  shiftDoctor?.specialty ||
                  "Chưa cập nhật",
                status:
                  doctor.status === "active" &&
                  doctor.staffStatus === "active"
                    ? "active"
                    : "inactive",
                facilityIds:
                  doctor.facilityIds.length > 0
                    ? doctor.facilityIds
                    : doctor.facilityId
                      ? [doctor.facilityId]
                      : [],
              };
            }),
          );

          setError(null);
        },
      )
      .catch((loadError) => {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const doctorById = useMemo(
    () =>
      new Map(
        doctors.map((doctor) => [
          doctor.id,
          doctor,
        ]),
      ),
    [doctors],
  );

  const facilityById = useMemo(
    () =>
      new Map(
        facilities.map((facility) => [
          facility.id,
          facility,
        ]),
      ),
    [facilities],
  );

  const roomById = useMemo(
    () =>
      new Map(
        rooms.map((room) => [room.id, room]),
      ),
    [rooms],
  );

  const filteredShifts = useMemo(() => {
    const normalizedKeyword = keyword
      .trim()
      .toLowerCase();

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
          value
            .toLowerCase()
            .includes(normalizedKeyword),
        );

      return (
        matchesKeyword &&
        (!facilityFilter ||
          shift.facilityId === facilityFilter) &&
        (!roomFilter ||
          shift.roomId === roomFilter) &&
        (!doctorFilter ||
          shift.doctorId === doctorFilter) &&
        (!statusFilter ||
          shift.status === statusFilter)
      );
    });
  }, [
    doctorFilter,
    facilityFilter,
    keyword,
    roomFilter,
    shifts,
    statusFilter,
  ]);

  const scopedShifts = useMemo(() => {
    if (viewMode === "day") {
      return filteredShifts.filter(
        (shift) =>
          shift.shiftDate === selectedDate,
      );
    }

    if (viewMode === "week") {
      const weekStartKey = toDateKey(
        startOfWeek(selectedDate),
      );
      const weekEndKey = toDateKey(
        addDays(startOfWeek(selectedDate), 6),
      );

      return filteredShifts.filter(
        (shift) =>
          shift.shiftDate >= weekStartKey &&
          shift.shiftDate <= weekEndKey,
      );
    }

    const selected = parseDateKey(selectedDate);

    return filteredShifts.filter((shift) => {
      const shiftDate = parseDateKey(
        shift.shiftDate,
      );

      return (
        shiftDate.getFullYear() ===
          selected.getFullYear() &&
        shiftDate.getMonth() ===
          selected.getMonth()
      );
    });
  }, [filteredShifts, selectedDate, viewMode]);

  const sortedScopedShifts = useMemo(
    () =>
      [...scopedShifts].sort(
        (first, second) =>
          `${first.shiftDate}-${first.startTime}`.localeCompare(
            `${second.shiftDate}-${second.startTime}`,
          ),
      ),
    [scopedShifts],
  );

  const dayTableShifts = useMemo(() => {
    if (viewMode !== "day") {
      return sortedScopedShifts;
    }

    return [...sortedScopedShifts].sort(
      (first, second) => {
        const firstFacility =
          first.facilityName ||
          facilityById.get(first.facilityId)?.name ||
          "";
        const secondFacility =
          second.facilityName ||
          facilityById.get(second.facilityId)?.name ||
          "";

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
      },
    );
  }, [
    facilityById,
    sortedScopedShifts,
    viewMode,
  ]);

  const dayShiftGroupMeta = useMemo(() => {
    const metadata: DayShiftGroupMeta[] = [];
    let groupIndex = -1;
    let index = 0;

    while (index < dayTableShifts.length) {
      const groupKey = getDayShiftGroupKey(
        dayTableShifts[index],
      );
      let groupEnd = index + 1;

      while (
        groupEnd < dayTableShifts.length &&
        getDayShiftGroupKey(
          dayTableShifts[groupEnd],
        ) === groupKey
      ) {
        groupEnd += 1;
      }

      groupIndex += 1;
      const groupSize = groupEnd - index;

      for (
        let rowIndex = index;
        rowIndex < groupEnd;
        rowIndex += 1
      ) {
        metadata[rowIndex] = {
          key: groupKey,
          groupIndex,
          rowSpan:
            rowIndex === index
              ? groupSize
              : 0,
          isFirstRow: rowIndex === index,
        };
      }

      index = groupEnd;
    }

    return metadata;
  }, [dayTableShifts]);

  const monthGrid = useMemo(
    () => getMonthGrid(selectedDate),
    [selectedDate],
  );

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate);

    return Array.from(
      { length: 7 },
      (_, index) => addDays(weekStart, index),
    );
  }, [selectedDate]);

  const weeklyScheduleRows = useMemo(() => {
    const rows = new Map<string, WeeklyScheduleRow>();

    sortedScopedShifts.forEach((shift) => {
      const slotIdentity =
        shift.slotId ||
        shift.slotCode ||
        `${shift.startTime}-${shift.endTime}`;
      const rowKey = `${shift.facilityId}:${slotIdentity}`;
      const existingRow = rows.get(rowKey);

      const row: WeeklyScheduleRow =
        existingRow ?? {
          key: rowKey,
          slotId: shift.slotId,
          slotName:
            shift.slotName ||
            shift.slotCode ||
            getShiftShortLabel(shift.startTime),
          slotCode: shift.slotCode,
          facilityId: shift.facilityId,
          facilityName:
            shift.facilityName ||
            facilityById.get(shift.facilityId)?.name ||
            "",
          startTime: shift.startTime,
          endTime: shift.endTime,
          shiftsByDate: {},
        };

      const dayShifts =
        row.shiftsByDate[shift.shiftDate] ?? [];

      dayShifts.push(shift);
      row.shiftsByDate[shift.shiftDate] = dayShifts;
      rows.set(rowKey, row);
    });

    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        shiftsByDate: Object.fromEntries(
          Object.entries(row.shiftsByDate).map(
            ([dateKey, dayShifts]) => [
              dateKey,
              [...dayShifts].sort((first, second) =>
                `${first.doctorName}-${first.roomName}`.localeCompare(
                  `${second.doctorName}-${second.roomName}`,
                ),
              ),
            ],
          ),
        ),
      }))
      .sort((first, second) =>
        `${first.startTime}-${first.endTime}-${first.facilityName}`.localeCompare(
          `${second.startTime}-${second.endTime}-${second.facilityName}`,
        ),
      );
  }, [
    facilityById,
    sortedScopedShifts,
  ]);

  const periodStartDate = useMemo(() => {
    if (viewMode === "week") {
      return toDateKey(
        startOfWeek(selectedDate),
      );
    }

    if (viewMode === "month") {
      const current =
        parseDateKey(selectedDate);

      return toDateKey(
        new Date(
          current.getFullYear(),
          current.getMonth(),
          1,
        ),
      );
    }

    return selectedDate;
  }, [selectedDate, viewMode]);

  function openCreate() {
    setCreateModalOpen(true);
  }

  function openEdit(shift: DoctorShiftItem) {
    setEditingShift(shift);
  }

  function handleCreated(
    createdShifts: DoctorShiftItem[],
  ) {
    setShifts((current: DoctorShiftItem[]) => [
      ...current,
      ...createdShifts,
    ]);
    setSelectedDate(
      createdShifts[0]?.shiftDate ?? selectedDate,
    );
  }

  function handleUpdated(
    updatedShift: DoctorShiftItem,
  ) {
    setShifts((current: DoctorShiftItem[]) =>
      current.map((item) =>
        item.id === updatedShift.id
          ? updatedShift
          : item,
      ),
    );

    setDetailShift(
      (current: DoctorShiftItem | null) =>
        current?.id === updatedShift.id
          ? updatedShift
          : current,
    );
  }

  async function openDetail(
    shift: DoctorShiftItem,
  ) {
    setDetailShift(shift);
    setDetailLoading(true);

    try {
      const detail = await getDoctorShift(
        shift.id,
      );

      setDetailShift(detail);
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setDetailLoading(false);
    }
  }

  async function assignDoctor(
    doctorId: string,
  ) {
    if (!detailShift) return;

    setDetailLoading(true);
    setError(null);

    try {
      const conflictRaw =
        await checkDoctorShiftConflicts({
          doctorId,
          facilityId:
            detailShift.facilityId,
          roomId: detailShift.roomId,
          slotId: detailShift.slotId,
          shiftDate:
            detailShift.shiftDate,
          excludeShiftId:
            detailShift.id,
        });

      const conflict =
        readConflictResponse(conflictRaw);

      if (conflict.hasConflict) {
        throw new Error(
          conflict.message ||
            "Bác sĩ bị trùng ca trực.",
        );
      }

      const response =
        await updateDoctorShift(
          detailShift.id,
          {
            doctorId,
            facilityId:
              detailShift.facilityId,
            roomId: detailShift.roomId,
            slotId: detailShift.slotId,
            shiftDate:
              detailShift.shiftDate,
            maxAppointments:
              detailShift.maxAppointments,
          },
        );

      const selectedDoctor = doctors.find(
        (item) => item.id === doctorId,
      );

      let updatedShift: DoctorShiftItem;

      try {
        const detail = await getDoctorShift(
          response.data.id ||
            detailShift.id,
        );

        updatedShift = {
          ...detailShift,
          ...response.data,
          ...detail,
          doctorId,
          doctorName:
            detail.doctorName ||
            response.data.doctorName ||
            selectedDoctor?.name ||
            detailShift.doctorName,
          doctorTitle:
            detail.doctorTitle ||
            response.data.doctorTitle ||
            selectedDoctor?.title ||
            detailShift.doctorTitle,
          doctorSpecialty:
            detail.doctorSpecialty ||
            response.data.doctorSpecialty ||
            selectedDoctor?.specialty ||
            detailShift.doctorSpecialty,
          note:
            detail.note ||
            response.data.note ||
            detailShift.note,
        };
      } catch {
        updatedShift = {
          ...detailShift,
          ...response.data,
          id:
            response.data.id ||
            detailShift.id,
          doctorId,
          doctorName:
            response.data.doctorName ||
            selectedDoctor?.name ||
            detailShift.doctorName,
          doctorTitle:
            response.data.doctorTitle ||
            selectedDoctor?.title ||
            detailShift.doctorTitle,
          doctorSpecialty:
            response.data.doctorSpecialty ||
            selectedDoctor?.specialty ||
            detailShift.doctorSpecialty,
          note:
            response.data.note ||
            detailShift.note,
        };
      }

      setShifts(
        (current: DoctorShiftItem[]) =>
          current.map((shift) =>
            shift.id === updatedShift.id
              ? updatedShift
              : shift,
          ),
      );
      setDetailShift(updatedShift);

      modal.success({
        centered: true,
        title: "Cập nhật ca trực thành công",
        content:
          "Bác sĩ phụ trách đã được cập nhật.",
        okText: "Đóng",
      });
    } catch (assignError) {
      const message =
        getErrorMessage(assignError);

      setError(message);

      modal.error({
        centered: true,
        title: "Không thể cập nhật ca trực",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deletingShift) return;

    const reason = deleteReason.trim();

    if (!reason) {
      setError(
        "Vui lòng nhập lý do xóa ca trực.",
      );
      return;
    }

    const shift = deletingShift;

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteDoctorShift(
        shift.id,
        reason,
      );

      setShifts(
        (current: DoctorShiftItem[]) =>
          current.filter(
            (item) => item.id !== shift.id,
          ),
      );

      setDetailShift(
        (current: DoctorShiftItem | null) =>
          current?.id === shift.id
            ? null
            : current,
      );

      setDeletingShift(null);
      setDeleteReason("");

      modal.success({
        centered: true,
        title:
          "Xóa ca trực thành công",
        content:
          "Ca trực đã được xóa khỏi hệ thống.",
        okText: "Đóng",
      });
    } catch (deleteError) {
      const message =
        getErrorMessage(deleteError);

      setError(message);

      modal.error({
        centered: true,
        title:
          "Không thể xóa ca trực",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  function movePeriod(direction: -1 | 1) {
    if (viewMode === "day") {
      setSelectedDate(
        toDateKey(
          addDays(selectedDate, direction),
        ),
      );
      return;
    }

    if (viewMode === "week") {
      setSelectedDate(
        toDateKey(
          addDays(
            selectedDate,
            direction * 7,
          ),
        ),
      );
      return;
    }

    const current = parseDateKey(selectedDate);

    setSelectedDate(
      toDateKey(
        new Date(
          current.getFullYear(),
          current.getMonth() + direction,
          1,
        ),
      ),
    );
  }

  function handlePeriodStartChange(
    value: string,
  ) {
    if (!value) return;

    if (viewMode === "week") {
      setSelectedDate(
        toDateKey(startOfWeek(value)),
      );
      return;
    }

    if (viewMode === "month") {
      const selected =
        parseDateKey(value);

      setSelectedDate(
        toDateKey(
          new Date(
            selected.getFullYear(),
            selected.getMonth(),
            1,
          ),
        ),
      );
      return;
    }

    setSelectedDate(value);
  }

  function resetFilters() {
    setSelectedDate(TODAY);
    setKeyword("");
    setFacilityFilter(undefined);
    setRoomFilter(undefined);
    setDoctorFilter(undefined);
    setStatusFilter(undefined);
  }

  const tableColumns: ColumnsType<DoctorShiftItem> = [
    {
      title: "STT",
      width: "5%",
      align: "center",
      render: (_value, _record, index) =>
        index + 1,
    },
    {
      title: "Ca trực",
      width: "18%",
      onCell: (
        shift,
        index,
      ) => {
        const group =
          dayShiftGroupMeta[index ?? 0];

        return {
          rowSpan: group?.rowSpan ?? 1,
          className:
            group?.rowSpan === 0
              ? undefined
              : getDayShiftMergedCellClass(
                  shift.startTime,
                ),
        };
      },
      render: (_value, shift, index) => {
        const group =
          dayShiftGroupMeta[index];

        return (
          <div className="min-w-0 py-1">
            <Text
              strong
              className="block truncate text-sm text-slate-950"
            >
              {shift.slotName ||
                shift.slotCode ||
                getShiftShortLabel(
                  shift.startTime,
                )}
            </Text>

            <Text
              className="mt-1 block truncate text-xs font-semibold text-slate-700"
            >
              {shift.startTime} -{" "}
              {shift.endTime}
            </Text>

            {shift.slotCode &&
            shift.slotName ? (
              <Text
                type="secondary"
                className="mt-1 block truncate text-xs"
              >
                {shift.slotCode}
              </Text>
            ) : null}

            <Text
              type="secondary"
              className="mt-2 block truncate text-xs"
            >
              {shift.facilityName ||
                facilityById.get(
                  shift.facilityId,
                )?.name ||
                "Chưa cập nhật cơ sở"}
            </Text>

            {group?.rowSpan &&
            group.rowSpan > 1 ? (
              <Tag
                color="blue"
                className="mt-2 max-w-full truncate"
              >
                {group.rowSpan} bác sĩ
              </Tag>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Ngày trực",
      dataIndex: "shiftDate",
      width: "12%",
      sorter: (first, second) =>
        first.shiftDate.localeCompare(
          second.shiftDate,
        ),
      render: (value: string) => (
        <div>
          <Text strong>
            {formatShortDate(value)}
          </Text>

          <Text
            type="secondary"
            className="block text-xs"
          >
            {new Intl.DateTimeFormat(
              "vi-VN",
              {
                weekday: "long",
              },
            ).format(parseDateKey(value))}
          </Text>
        </div>
      ),
    },
    {
      title: "Bác sĩ",
      width: "20%",
      render: (_value, shift) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <Stethoscope className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <Text
              strong
              className="block truncate"
            >
              {shift.doctorTitle ||
                doctorById.get(
                  shift.doctorId,
                )?.title ||
                "Bác sĩ"}{" "}
              {shift.doctorName ||
                doctorById.get(
                  shift.doctorId,
                )?.name ||
                `#${shift.doctorId}`}
            </Text>

            <Text
              type="secondary"
              className="block truncate text-xs"
            >
              {shift.doctorSpecialty ||
                doctorById.get(
                  shift.doctorId,
                )?.specialty ||
                "Chưa cập nhật"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Cơ sở / Phòng",
      width: "20%",
      render: (_value, shift) => (
        <div className="min-w-0">
          <Text
            strong
            className="block truncate"
          >
            {shift.facilityName ||
              facilityById.get(
                shift.facilityId,
              )?.name ||
              "Chưa cập nhật"}
          </Text>

          <Text
            type="secondary"
            className="block truncate text-xs"
          >
            {shift.roomName ||
              roomById.get(
                shift.roomId,
              )?.name ||
              "Chưa cập nhật"}
            {roomById.get(shift.roomId)?.floor
              ? ` · ${
                  roomById.get(
                    shift.roomId,
                  )?.floor
                }`
              : ""}
          </Text>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: "11%",
      align: "center",
      render: (
        status: DoctorShiftStatus,
      ) => renderStatus(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "14%",
      align: "center",
      render: (_value, shift) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={
                <Eye className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();
                void openDetail(shift);
              }}
            />
          </Tooltip>

          <Tooltip title="Cập nhật">
            <Button
              size="small"
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();
                openEdit(shift);
              }}
            />
          </Tooltip>

          <Tooltip title="Xóa ca trực">
            <Button
              danger
              size="small"
              icon={
                <Trash2 className="h-4 w-4" />
              }
              onClick={(event) => {
                event.stopPropagation();
                setDeletingShift(shift);
                setDeleteReason("");
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      {modalContextHolder}

      <PageHeader
        title="Quản lý ca trực"
        description="Quản lý ca trực theo ngày, tuần, tháng và phân công bác sĩ."
      />

      <div className="mt-6 flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() => setError(null)}
          />
        ) : null}

        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  icon={
                    <ChevronLeft className="h-4 w-4" />
                  }
                  onClick={() =>
                    movePeriod(-1)
                  }
                />

                <Button
                  onClick={() =>
                    setSelectedDate(TODAY)
                  }
                >
                  Hôm nay
                </Button>

                <Button
                  icon={
                    <ChevronRight className="h-4 w-4" />
                  }
                  onClick={() =>
                    movePeriod(1)
                  }
                />

                <Title
                  level={4}
                  className="!mb-0 !ml-1 !text-slate-950"
                >
                  {getPeriodTitle(
                    viewMode,
                    selectedDate,
                  )}
                </Title>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type={
                    viewMode === "day"
                      ? "primary"
                      : "default"
                  }
                  onClick={() =>
                    setViewMode("day")
                  }
                >
                  Ngày
                </Button>

                <Button
                  type={
                    viewMode === "week"
                      ? "primary"
                      : "default"
                  }
                  onClick={() =>
                    setViewMode("week")
                  }
                >
                  Tuần
                </Button>

                <Button
                  type={
                    viewMode === "month"
                      ? "primary"
                      : "default"
                  }
                  onClick={() =>
                    setViewMode("month")
                  }
                >
                  Tháng
                </Button>

                <Button
                  type="primary"
                  icon={
                    <Plus className="h-4 w-4" />
                  }
                  disabled={
                    facilities.length === 0 ||
                    rooms.length === 0 ||
                    doctors.length === 0
                  }
                  onClick={() =>
                    openCreate()
                  }
                >
                  Thêm ca trực
                </Button>
              </div>
            </div>

            <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <div className="flex min-w-0 flex-col gap-1">
                <Text className="text-xs font-medium text-slate-500">
                  {viewMode === "week"
                    ? "Ngày bắt đầu tuần"
                    : viewMode === "month"
                      ? "Ngày bắt đầu tháng"
                      : "Ngày xem"}
                </Text>

                <Input
                  type="date"
                  value={periodStartDate}
                  onChange={(event) =>
                    handlePeriodStartChange(
                      event.target.value,
                    )
                  }
                />
              </div>

              <Input
                allowClear
                value={keyword}
                prefix={
                  <Search className="h-4 w-4 text-slate-400" />
                }
                placeholder="Tìm bác sĩ, cơ sở, phòng, slot..."
                onChange={(event) =>
                  setKeyword(
                    event.target.value,
                  )
                }
              />

              <Select
                allowClear
                value={facilityFilter}
                placeholder="Tất cả cơ sở"
                options={facilities.map(
                  (facility) => ({
                    value: facility.id,
                    label: facility.name,
                  }),
                )}
                onChange={(value) => {
                  setFacilityFilter(value);
                  setRoomFilter(undefined);
                }}
              />

              <Select
                allowClear
                value={roomFilter}
                placeholder="Tất cả phòng"
                options={rooms
                  .filter(
                    (room) =>
                      !facilityFilter ||
                      room.facilityId ===
                        facilityFilter,
                  )
                  .map((room) => ({
                    value: room.id,
                    label: room.name,
                  }))}
                onChange={setRoomFilter}
              />

              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={doctorFilter}
                placeholder="Tất cả bác sĩ"
                options={doctors.map(
                  (doctor) => ({
                    value: doctor.id,
                    label: `${doctor.title} ${doctor.name}`,
                  }),
                )}
                onChange={setDoctorFilter}
              />

              <Select
                allowClear
                value={statusFilter}
                placeholder="Trạng thái"
                options={STATUS_OPTIONS}
                onChange={setStatusFilter}
              />

              <Tooltip title="Xóa bộ lọc">
                <Button
                  block
                  icon={
                    <X className="h-4 w-4" />
                  }
                  onClick={resetFilters}
                >
                  Xóa bộ lọc
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>

        {viewMode === "month" ? (
          <Card
            className="overflow-hidden border-slate-200 bg-white"
            styles={{ body: { padding: 0 } }}
            title={
              <div>
                <p className="mb-0 text-base font-semibold text-slate-950">
                  Lịch ca trực theo tháng
                </p>

                <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                  Bấm vào một ngày để xem danh sách ca trực của ngày đó.
                </p>
              </div>
            }
          >
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="border-r border-slate-200 px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 last:border-r-0"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthGrid.map((date) => {
                const dateKey = toDateKey(date);
                const dayShifts = filteredShifts
                  .filter(
                    (shift) =>
                      shift.shiftDate === dateKey,
                  )
                  .sort((first, second) =>
                    first.startTime.localeCompare(
                      second.startTime,
                    ),
                  );
                const selected =
                  dateKey === selectedDate;
                const today = dateKey === TODAY;
                const sameMonth =
                  date.getMonth() ===
                  parseDateKey(
                    selectedDate,
                  ).getMonth();

                return (
                  <div
                    key={dateKey}
                    role="button"
                    tabIndex={0}
                    className={`min-h-[145px] cursor-pointer border-b border-r border-slate-200 p-2 transition hover:bg-slate-50 ${
                      !sameMonth
                        ? "bg-slate-50/70 text-slate-400"
                        : "bg-white"
                    } ${
                      selected
                        ? "ring-2 ring-inset ring-blue-500"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedDate(dateKey);
                      setViewMode("day");
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        setSelectedDate(dateKey);
                        setViewMode("day");
                      }
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          today
                            ? "bg-blue-600 text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {dayShifts.length > 0 ? (
                        <Badge
                          count={dayShifts.length}
                          size="small"
                        />
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {dayShifts
                        .slice(0, 3)
                        .map((shift) => (
                          <button
                            key={shift.id}
                            type="button"
                            className={`w-full truncate rounded-md border px-2 py-1.5 text-left text-[11px] font-medium ${getShiftAccent(
                              shift.startTime,
                            )}`}
                            title={`${shift.startTime} - ${shift.endTime} · ${shift.doctorName}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              void openDetail(
                                shift,
                              );
                            }}
                          >
                            {shift.startTime} ·{" "}
                            {shift.doctorName ||
                              `Bác sĩ #${shift.doctorId}`}
                          </button>
                        ))}

                      {dayShifts.length > 3 ? (
                        <span className="px-1 text-xs font-semibold text-slate-500">
                          +{dayShifts.length - 3} ca khác
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : viewMode === "week" ? (
          <Card
            className="overflow-hidden border-slate-200 bg-white"
            styles={{ body: { padding: 0 } }}
            title={
              <div>
                <p className="mb-0 text-base font-semibold text-slate-950">
                  Lịch ca trực theo tuần
                </p>

                <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                  Cột bên trái là khung ca; mỗi ô hiển thị lịch của bác sĩ trong ngày tương ứng.
                </p>
              </div>
            }
            extra={
              <Text type="secondary">
                {sortedScopedShifts.length} lịch trực
              </Text>
            }
          >
            <div className="w-full overflow-hidden">
              <div className="w-full">
                <div
                  className="grid border-b border-slate-200 bg-slate-50"
                  style={{
                    gridTemplateColumns:
                      "minmax(150px, 1.15fr) repeat(7, minmax(0, 1fr))",
                  }}
                >
                  <div className="flex min-w-0 items-center border-r border-slate-200 bg-slate-100 px-2 py-3 lg:px-3">
                    <Text className="text-xs font-bold uppercase tracking-wide text-slate-600">
                      Khung ca
                    </Text>
                  </div>

                  {weekDays.map((date, index) => {
                    const dateKey = toDateKey(date);
                    const today = dateKey === TODAY;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        className={`min-w-0 border-r border-slate-200 px-1 py-3 text-center last:border-r-0 sm:px-2 ${
                          today
                            ? "bg-blue-50"
                            : "bg-slate-50"
                        }`}
                        onClick={() => {
                          setSelectedDate(dateKey);
                          setViewMode("day");
                        }}
                      >
                        <Text
                          strong
                          className={`block text-xs uppercase ${
                            today
                              ? "text-blue-700"
                              : "text-slate-600"
                          }`}
                        >
                          {WEEKDAY_LABELS[index]}
                        </Text>

                        <span
                          className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                            today
                              ? "bg-blue-600 text-white"
                              : "text-slate-800"
                          }`}
                        >
                          {String(date.getDate()).padStart(
                            2,
                            "0",
                          )}
                        </span>

                        <Text
                          type="secondary"
                          className="mt-1 block truncate text-[9px] lg:text-[11px]"
                        >
                          {String(
                            date.getMonth() + 1,
                          ).padStart(2, "0")}
                          /{date.getFullYear()}
                        </Text>
                      </button>
                    );
                  })}
                </div>

                {weeklyScheduleRows.length === 0 ? (
                  <div className="px-6 py-12">
                    <Empty
                      image={
                        Empty.PRESENTED_IMAGE_SIMPLE
                      }
                      description="Không có ca trực phù hợp trong tuần này."
                    >
                      <Button
                        type="primary"
                        onClick={() => openCreate()}
                      >
                        Thêm ca trực
                      </Button>
                    </Empty>
                  </div>
                ) : (
                  weeklyScheduleRows.map((row) => (
                    <div
                      key={row.key}
                      className="grid border-b border-slate-200 last:border-b-0"
                      style={{
                        gridTemplateColumns:
                          "minmax(150px, 1.15fr) repeat(7, minmax(0, 1fr))",
                      }}
                    >
                      <div className="min-w-0 border-r border-slate-200 bg-slate-50 px-2 py-3 lg:px-3">
                        <Text
                          strong
                          className="block text-slate-950"
                        >
                          {row.slotName}
                        </Text>

                        <Text
                          type="secondary"
                          className="mt-1 block text-xs"
                        >
                          {row.startTime} -{" "}
                          {row.endTime}
                        </Text>

                        {row.slotCode ? (
                          <Text
                            type="secondary"
                            className="mt-1 block truncate text-xs"
                          >
                            {row.slotCode}
                          </Text>
                        ) : null}

                        {!facilityFilter &&
                        row.facilityName ? (
                          <Text className="mt-2 block truncate text-xs font-medium text-blue-700">
                            {row.facilityName}
                          </Text>
                        ) : null}
                      </div>

                      {weekDays.map((date) => {
                        const dateKey = toDateKey(date);
                        const dayShifts =
                          row.shiftsByDate[dateKey] ?? [];
                        const today =
                          dateKey === TODAY;

                        return (
                          <div
                            key={`${row.key}-${dateKey}`}
                            className={`min-w-0 border-r border-slate-200 p-1.5 last:border-r-0 lg:p-2 ${
                              today
                                ? "bg-blue-50/30"
                                : "bg-white"
                            }`}
                          >
                            {dayShifts.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {dayShifts.map(
                                  (shift) => (
                                    <button
                                      key={shift.id}
                                      type="button"
                                      className={`w-full min-w-0 rounded-md border px-1.5 py-2 text-left transition hover:shadow-sm lg:px-2 ${getShiftAccent(
                                        shift.startTime,
                                      )}`}
                                      title={`${shift.doctorTitle || "Bác sĩ"} ${shift.doctorName} · ${shift.roomName || "Chưa có phòng"}`}
                                      onClick={() =>
                                        void openDetail(
                                          shift,
                                        )
                                      }
                                    >
                                      <span className="block truncate text-[10px] font-semibold sm:text-[11px] lg:text-xs">
                                        {shift.doctorTitle ||
                                          doctorById.get(
                                            shift.doctorId,
                                          )?.title ||
                                          "Bác sĩ"}{" "}
                                        {shift.doctorName ||
                                          doctorById.get(
                                            shift.doctorId,
                                          )?.name ||
                                          `#${shift.doctorId}`}
                                      </span>

                                      <span className="mt-1 block truncate text-[9px] opacity-80 sm:text-[10px] lg:text-[11px]">
                                        {shift.roomName ||
                                          roomById.get(
                                            shift.roomId,
                                          )?.name ||
                                          "Chưa cập nhật phòng"}
                                      </span>

                                      <span className="mt-1 block truncate text-[9px] font-medium opacity-75 lg:text-[10px]">
                                        Tối đa{" "}
                                        {shift.maxAppointments}{" "}
                                        lịch
                                      </span>
                                    </button>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="flex min-h-[92px] items-center justify-center lg:min-h-[110px]">
                                <Text
                                  type="secondary"
                                  className="text-xs"
                                >
                                  Chưa có lịch
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card
            className="overflow-hidden border-slate-200 bg-white"
            styles={{ body: { padding: 0 } }}
            title={
              <div>
                <p className="mb-0 text-base font-semibold text-slate-950">
                  Danh sách ca trực ngày{" "}
                  {formatShortDate(selectedDate)}
                </p>

                <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                  Bấm vào một dòng để xem chi tiết.
                </p>
              </div>
            }
            extra={
              <Text type="secondary">
                {sortedScopedShifts.length} ca trực phù hợp
              </Text>
            }
          >
            <Table
              rowKey="id"
              size="middle"
              tableLayout="fixed"
              loading={loading}
              columns={tableColumns}
              dataSource={dayTableShifts}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    image={
                      Empty.PRESENTED_IMAGE_SIMPLE
                    }
                    description="Không có ca trực phù hợp trong ngày này."
                  >
                    <Button
                      type="primary"
                      onClick={() =>
                        openCreate()
                      }
                    >
                      Thêm ca trực
                    </Button>
                  </Empty>
                ),
              }}
              rowClassName={(
                _shift,
                index,
              ) => {
                const group =
                  dayShiftGroupMeta[index];

                return [
                  "cursor-pointer",
                  group?.isFirstRow &&
                  index > 0
                    ? "[&>td]:border-t-2 [&>td]:border-t-slate-300"
                    : "",
                  group?.groupIndex % 2 === 1
                    ? "[&>td]:bg-slate-50/35"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");
              }}
              onRow={(shift) => ({
                onClick: (event) => {
                  const target =
                    event.target as HTMLElement;

                  if (
                    target.closest(
                      "button",
                    ) ||
                    target.closest("a")
                  ) {
                    return;
                  }

                  void openDetail(shift);
                },
              })}
              className="management-table [&_.ant-table-cell]:px-3"
            />
          </Card>
        )}

      </div>

      <DoctorShiftCreateModal
        open={createModalOpen}
        shifts={shifts}
        facilities={facilities}
        rooms={rooms}
        doctors={doctors}
        onClose={() =>
          setCreateModalOpen(false)
        }
        onCreated={handleCreated}
      />

      <DoctorShiftEditModal
        open={Boolean(editingShift)}
        shift={editingShift}
        shifts={shifts}
        facilities={facilities}
        rooms={rooms}
        doctors={doctors}
        onClose={() =>
          setEditingShift(null)
        }
        onUpdated={handleUpdated}
      />

      <DoctorShiftDetailModal
        open={Boolean(detailShift)}
        shift={detailShift}
        loading={detailLoading}
        shifts={shifts}
        facilities={facilities}
        rooms={rooms}
        doctors={doctors}
        onClose={() =>
          setDetailShift(null)
        }
        onEdit={(shift) => {
          setDetailShift(null);
          openEdit(shift);
        }}
        onDelete={(shift) => {
          setDeletingShift(shift);
          setDeleteReason("");
        }}
        onAssignDoctor={assignDoctor}
      />

      <Modal
        open={Boolean(deletingShift)}
        centered
        width={480}
        title={null}
        footer={null}
        closable={false}
        onCancel={() => {
          if (!deleteLoading) {
            setDeletingShift(null);
            setDeleteReason("");
          }
        }}
        mask={{
          closable: !deleteLoading,
        }}
        className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
        styles={{ body: { padding: 0 } }}
      >
        <div className="relative px-6 pb-6 pt-7 text-center">
          <button
            type="button"
            aria-label="Đóng"
            disabled={deleteLoading}
            onClick={() => {
              setDeletingShift(null);
              setDeleteReason("");
            }}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">
            Xóa ca trực?
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Nhập lý do xóa. Thao tác này không thể hoàn tác.
          </p>

          {deletingShift ? (
            <div className="mx-auto mt-4 max-w-[350px] rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="mb-0 font-semibold">
                {deletingShift.slotName ||
                  deletingShift.slotCode ||
                  `Ca trực #${deletingShift.id}`}
              </p>

              <p className="mb-0 mt-1">
                {formatShortDate(
                  deletingShift.shiftDate,
                )}{" "}
                · {deletingShift.startTime} -{" "}
                {deletingShift.endTime}
              </p>
            </div>
          ) : null}

          <div className="mt-4 text-left">
            <label
              htmlFor="delete-shift-reason"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Lý do xóa
            </label>

            <Input.TextArea
              id="delete-shift-reason"
              rows={3}
              value={deleteReason}
              maxLength={300}
              showCount
              disabled={deleteLoading}
              placeholder="Ví dụ: bác sĩ nghỉ đột xuất, phòng bảo trì..."
              onChange={(event) =>
                setDeleteReason(
                  event.target.value,
                )
              }
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              disabled={deleteLoading}
              onClick={() => {
                setDeletingShift(null);
                setDeleteReason("");
              }}
            >
              Hủy
            </Button>

            <Button
              danger
              type="primary"
              size="large"
              loading={deleteLoading}
              disabled={!deleteReason.trim()}
              onClick={() =>
                void confirmDelete()
              }
            >
              Xóa ca trực
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
