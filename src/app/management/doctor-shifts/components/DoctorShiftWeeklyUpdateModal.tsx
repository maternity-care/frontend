"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Tag,
  Typography,
} from "antd";
import {
  Calendar,
  Clock,
  Copy,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  getGroupedDoctorShifts,
} from "@/management/features/doctor-shifts/doctor-shifts.api";
import type {
  DoctorShiftItem,
  DoctorShiftStatus,
  DoctorShiftWorkingDay,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import {
  getShiftSlotLookup,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlotLookupItem,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  getErrorMessage,
} from "./doctor-shift-modal.shared";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "./doctor-shift-modal.shared";

const { Text, Title } = Typography;

const CURRENT_WEEK_UPDATE_DRAFT_PREFIX =
  "management-doctor-shifts-current-week-update-draft:v3";

const WORKING_DAY_OPTIONS: Array<{
  label: string;
  value: DoctorShiftWorkingDay;
}> = [
  { label: "Thứ 2", value: "MON" },
  { label: "Thứ 3", value: "TUE" },
  { label: "Thứ 4", value: "WED" },
  { label: "Thứ 5", value: "THU" },
  { label: "Thứ 6", value: "FRI" },
  { label: "Thứ 7", value: "SAT" },
  { label: "Chủ nhật", value: "SUN" },
];

function getSlotWorkingDayOptions(
  slot?: ShiftSlotLookupItem | null,
) {
  const applicableDays =
    slot?.applicableDays?.length
      ? new Set(slot.applicableDays)
      : null;

  return WORKING_DAY_OPTIONS.filter(
    (option) =>
      !applicableDays ||
      applicableDays.has(option.value),
  );
}

function getDefaultWorkingDays(
  slot?: ShiftSlotLookupItem | null,
): DoctorShiftWorkingDay[] {
  const slotDays = getSlotWorkingDayOptions(slot).map(
    (option) => option.value,
  );

  return slotDays.length > 0
    ? slotDays
    : ["MON", "TUE", "WED", "THU", "FRI"];
}

type WeeklyUpdateStatus = Extract<
  DoctorShiftStatus,
  "available" | "off"
>;

type WeeklyUpdateAssignment = {
  staffId: string;
  roomId: string;
  workingDays: DoctorShiftWorkingDay[];
  maxAppointments: number;
  status: WeeklyUpdateStatus;
};

type WeeklyUpdateSlotGroup = {
  slotId: string;
  assignments: WeeklyUpdateAssignment[];
};

type WeeklyUpdateFormValues = {
  facilityId: string;
  fromDate: string;
  slotGroups: WeeklyUpdateSlotGroup[];
};

type WeeklyUpdateDraft = {
  version: 3;
  savedAt: string;
  values: WeeklyUpdateFormValues;
};

type DoctorShiftWeeklyUpdateModalProps = {
  open: boolean;
  shifts: DoctorShiftItem[];
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  onClose: () => void;
};

type LockedWeekDateInputProps = {
  value?: string;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(
  dateKey: string,
  amount: number,
) {
  const date = new Date(
    `${dateKey}T00:00:00`,
  );
  date.setDate(
    date.getDate() + amount,
  );

  return toDateKey(date);
}

function getCurrentWeekDateRange() {
  const currentDate = new Date();
  const currentDay =
    currentDate.getDay();
  const daysFromMonday =
    currentDay === 0
      ? 6
      : currentDay - 1;

  currentDate.setDate(
    currentDate.getDate() -
      daysFromMonday,
  );

  const dateFrom =
    toDateKey(currentDate);

  return {
    dateFrom,
    dateTo:
      addDaysToDateKey(
        dateFrom,
        6,
      ),
  };
}

function formatIssueDate(
  value: string,
) {
  const [year, month, day] =
    value.split("-");

  if (!year || !month || !day) {
    return value || "Không rõ ngày";
  }

  return `${day}/${month}/${year}`;
}

function formatLockedWeekDate(
  value?: string,
) {
  if (!value) {
    return "";
  }

  const [year, month, day] =
    value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}-${month}-${year}`;
}

function LockedWeekDateInput({
  value,
}: LockedWeekDateInputProps) {
  return (
    <Input
      value={
        value
          ? `${formatLockedWeekDate(
              value,
            )} - ${formatLockedWeekDate(
              addDaysToDateKey(
                value,
                6,
              ),
            )}`
          : ""
      }
      readOnly
      disabled
    />
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getDraftStorageKey(
  facilityId: string,
  fromDate: string,
) {
  return `${CURRENT_WEEK_UPDATE_DRAFT_PREFIX}:${facilityId}:${fromDate}`;
}

function readDraft(
  facilityId: string,
  fromDate: string,
): WeeklyUpdateFormValues | null {
  if (
    typeof window === "undefined" ||
    !facilityId ||
    !fromDate
  ) {
    return null;
  }

  const storageKey =
    getDraftStorageKey(
      facilityId,
      fromDate,
    );

  try {
    const rawValue =
      window.localStorage.getItem(
        storageKey,
      );

    if (!rawValue) {
      return null;
    }

    const parsed: unknown =
      JSON.parse(rawValue);

    if (
      !isRecord(parsed) ||
      parsed.version !== 3 ||
      !isRecord(parsed.values)
    ) {
      window.localStorage.removeItem(
        storageKey,
      );
      return null;
    }

    const values = parsed.values;

    if (
      values.facilityId !==
        facilityId ||
      values.fromDate !==
        fromDate ||
      !Array.isArray(
        values.slotGroups,
      )
    ) {
      window.localStorage.removeItem(
        storageKey,
      );
      return null;
    }

    return values as unknown as
      WeeklyUpdateFormValues;
  } catch {
    window.localStorage.removeItem(
      storageKey,
    );
    return null;
  }
}

function saveDraft(
  values: WeeklyUpdateFormValues,
) {
  if (
    typeof window === "undefined" ||
    !values.facilityId ||
    !values.fromDate
  ) {
    return;
  }

  const draft: WeeklyUpdateDraft = {
    version: 3,
    savedAt:
      new Date().toISOString(),
    values,
  };

  window.localStorage.setItem(
    getDraftStorageKey(
      values.facilityId,
      values.fromDate,
    ),
    JSON.stringify(draft),
  );
}

function getWorkingDay(
  dateKey: string,
): DoctorShiftWorkingDay {
  const day = new Date(
    `${dateKey}T00:00:00`,
  ).getDay();

  const dayMap: Record<
    number,
    DoctorShiftWorkingDay
  > = {
    0: "SUN",
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
    6: "SAT",
  };

  return dayMap[day] ?? "MON";
}

function buildGroupsFromShifts(
  slots: ShiftSlotLookupItem[],
  shifts: DoctorShiftItem[],
  doctors: DoctorOption[],
  facilityId: string,
  dateFrom: string,
  dateTo: string,
): WeeklyUpdateSlotGroup[] {
  const assignmentMaps =
    new Map<
      string,
      Map<
        string,
        WeeklyUpdateAssignment
      >
    >();

  const currentWeekShifts =
    shifts.filter(
      (shift) =>
        String(
          shift.facilityId,
        ) ===
          String(facilityId) &&
        shift.shiftDate >=
          dateFrom &&
        shift.shiftDate <=
          dateTo &&
        shift.status !==
          "cancelled",
    );

  for (
    const shift of
      currentWeekShifts
  ) {
    const slotId = String(
      shift.slotId ?? "",
    );

    if (!slotId) {
      continue;
    }

    const doctor = doctors.find(
      (item) =>
        item.id ===
          shift.doctorId ||
        item.staffId ===
          shift.staffId,
    );
    const staffId = String(
      shift.staffId ??
        doctor?.staffId ??
        "",
    );
    const roomId = String(
      shift.roomId ?? "",
    );

    if (!staffId || !roomId) {
      continue;
    }

    const status: WeeklyUpdateStatus =
      shift.status === "off"
        ? "off"
        : "available";
    const maxAppointments =
      Math.max(
        1,
        Number(
          shift.maxAppointments,
        ) || 8,
      );
    const assignmentKey = [
      staffId,
      roomId,
      status,
      maxAppointments,
    ].join(":");
    const assignments =
      assignmentMaps.get(
        slotId,
      ) ??
      new Map<
        string,
        WeeklyUpdateAssignment
      >();
    const existing =
      assignments.get(
        assignmentKey,
      );
    const workingDay =
      getWorkingDay(
        shift.shiftDate,
      );

    assignments.set(
      assignmentKey,
      {
        staffId,
        roomId,
        status,
        maxAppointments,
        workingDays:
          Array.from(
            new Set([
              ...(existing
                ?.workingDays ?? []),
              workingDay,
            ]),
          ),
      },
    );
    assignmentMaps.set(
      slotId,
      assignments,
    );
  }

  return slots.map((slot) => ({
    slotId: slot.id,
    assignments:
      Array.from(
        assignmentMaps.get(
          slot.id,
        )?.values() ?? [],
      ),
  }));
}

function mergeDraftGroups(
  slots: ShiftSlotLookupItem[],
  fallbackGroups:
    WeeklyUpdateSlotGroup[],
  draft:
    | WeeklyUpdateFormValues
    | null,
) {
  const draftBySlotId =
    new Map(
      (draft?.slotGroups ?? [])
        .filter((group) =>
          Boolean(group?.slotId),
        )
        .map((group) => [
          group.slotId,
          group,
        ]),
    );
  const fallbackBySlotId =
    new Map(
      fallbackGroups.map(
        (group) => [
          group.slotId,
          group,
        ],
      ),
    );

  return slots.map((slot) => ({
    slotId: slot.id,
    assignments:
      draftBySlotId.get(slot.id)
        ?.assignments ??
      fallbackBySlotId.get(slot.id)
        ?.assignments ??
      [],
  }));
}

export function DoctorShiftWeeklyUpdateModal({
  open,
  shifts,
  facilities,
  rooms,
  doctors,
  onClose,
}: DoctorShiftWeeklyUpdateModalProps) {
  const {
    message: messageApi,
  } = App.useApp();
  const [form] =
    Form.useForm<WeeklyUpdateFormValues>();
  const [shiftSlots, setShiftSlots] =
    useState<ShiftSlotLookupItem[]>([]);
  const [slotsLoading, setSlotsLoading] =
    useState(false);
  const [importWeekLoading, setImportWeekLoading] =
    useState(false);
  const [savingDraft, setSavingDraft] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const pendingDraftRef =
    useRef<
      WeeklyUpdateFormValues | null
    >(null);

  const watchedFacilityId =
    Form.useWatch(
      "facilityId",
      form,
    ) ?? "";
  const watchedFromDate =
    Form.useWatch(
      "fromDate",
      form,
    ) ?? "";
  const watchedSlotGroups =
    Form.useWatch(
      "slotGroups",
      form,
    ) ?? [];

  const slotById = useMemo(
    () =>
      new Map(
        shiftSlots.map(
          (slot) => [
            slot.id,
            slot,
          ],
        ),
      ),
    [shiftSlots],
  );

  const roomOptions = useMemo(
    () =>
      rooms
        .filter(
          (room) =>
            String(
              room.facilityId,
            ) ===
            String(
              watchedFacilityId,
            ),
        )
        .map((room) => ({
          value: room.id,
          label: `${room.name}${
            room.floor
              ? ` · ${room.floor}`
              : ""
          }`,
        })),
    [rooms, watchedFacilityId],
  );

  const doctorOptions = useMemo(
    () =>
      doctors
        .filter(
          (doctor) =>
            doctor.status ===
              "active" &&
            doctor.staffId &&
            doctor.roleId &&
            doctor.facilityIds.includes(
              watchedFacilityId,
            ),
        )
        .map((doctor) => ({
          value:
            doctor.staffId,
          label: `${doctor.title} ${doctor.name} · ${doctor.specialty}`,
        })),
    [doctors, watchedFacilityId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const { dateFrom } =
      getCurrentWeekDateRange();
    const defaultFacilityId =
      facilities.length === 1
        ? facilities[0]?.id
        : undefined;
    const restoredDraft =
      defaultFacilityId
        ? readDraft(
            defaultFacilityId,
            dateFrom,
          )
        : null;

    const timer =
      window.setTimeout(() => {
        pendingDraftRef.current =
          restoredDraft;
        form.resetFields();
        form.setFieldsValue({
          facilityId:
            defaultFacilityId,
          fromDate: dateFrom,
          slotGroups: [],
        });
        setShiftSlots([]);
        setError(null);
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    facilities,
    form,
    open,
  ]);

  useEffect(() => {
    if (
      !open ||
      !watchedFacilityId ||
      !watchedFromDate
    ) {
      return;
    }

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setSlotsLoading(true);
        }

        return getShiftSlotLookup({
          facilityId:
            watchedFacilityId,
          status: "active",
          limit: 40,
        });
      })
      .then((slots) => {
        if (cancelled) {
          return;
        }

        const dateTo =
          addDaysToDateKey(
            watchedFromDate,
            6,
          );
        const currentGroups =
          buildGroupsFromShifts(
            slots,
            shifts,
            doctors,
            watchedFacilityId,
            watchedFromDate,
            dateTo,
          );
        const slotGroups =
          mergeDraftGroups(
            slots,
            currentGroups,
            pendingDraftRef.current,
          );

        setShiftSlots(slots);
        form.setFieldsValue({
          slotGroups,
        });
        pendingDraftRef.current =
          null;
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        setShiftSlots([]);
        pendingDraftRef.current =
          null;
        form.setFieldsValue({
          slotGroups: [],
        });
        setError(
          getErrorMessage(
            loadError,
          ),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setSlotsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    doctors,
    form,
    open,
    shifts,
    watchedFacilityId,
    watchedFromDate,
  ]);

  async function handleImportCurrentWeek() {
    setError(null);

    if (!watchedFacilityId) {
      const warning =
        "Không xác định được cơ sở hiện tại.";
      setError(warning);
      messageApi.warning(warning);
      return;
    }

    const {
      dateFrom,
      dateTo,
    } = getCurrentWeekDateRange();

    setImportWeekLoading(true);

    try {
      const schedule =
        await getGroupedDoctorShifts({
          facilityId:
            watchedFacilityId,
          dateFrom,
          dateTo,
        });
      const activeSlotIds =
        new Set(
          shiftSlots.map(
            (slot) => slot.id,
          ),
        );
      const availableRoomIds =
        new Set(
          rooms
            .filter(
              (room) =>
                room.facilityId ===
                watchedFacilityId,
            )
            .map(
              (room) => room.id,
            ),
        );
      const assignmentMaps =
        new Map<
          string,
          Map<
            string,
            WeeklyUpdateAssignment
          >
        >();
      let skippedGroups = 0;

      for (
        const group of
          schedule.groups ?? []
      ) {
        const sourceShift =
          group.shifts?.[0];

        if (
          !sourceShift ||
          sourceShift.status ===
            "cancelled"
        ) {
          skippedGroups += 1;
          continue;
        }

        const slotId = String(
          sourceShift.slotId ?? "",
        );
        const staffId = String(
          sourceShift.staffId ?? "",
        );
        const roleId = String(
          sourceShift.roleId ?? "",
        );
        const roomId = String(
          sourceShift.roomId ?? "",
        );
        const doctor = doctors.find(
          (item) =>
            item.staffId ===
              staffId &&
            String(item.roleId) ===
              roleId &&
            item.status ===
              "active" &&
            item.facilityIds.includes(
              watchedFacilityId,
            ),
        );
        const workingDays =
          (group.workingDays ?? [])
            .filter((day) =>
              WORKING_DAY_OPTIONS.some(
                (option) =>
                  option.value === day,
              ),
            );

        if (
          !slotId ||
          !activeSlotIds.has(
            slotId,
          ) ||
          !doctor ||
          !roomId ||
          !availableRoomIds.has(
            roomId,
          ) ||
          workingDays.length === 0
        ) {
          skippedGroups += 1;
          continue;
        }

        const status:
          WeeklyUpdateStatus =
          sourceShift.status ===
            "off"
            ? "off"
            : "available";
        const maxAppointments =
          Math.max(
            1,
            Number(
              sourceShift.maxAppointments,
            ) || 8,
          );
        const assignmentKey = [
          staffId,
          roomId,
          status,
          maxAppointments,
        ].join(":");
        const assignments =
          assignmentMaps.get(
            slotId,
          ) ??
          new Map<
            string,
            WeeklyUpdateAssignment
          >();
        const existing =
          assignments.get(
            assignmentKey,
          );

        assignments.set(
          assignmentKey,
          {
            staffId,
            roomId,
            status,
            maxAppointments,
            workingDays:
              Array.from(
                new Set([
                  ...(existing
                    ?.workingDays ?? []),
                  ...workingDays,
                ]),
              ),
          },
        );
        assignmentMaps.set(
          slotId,
          assignments,
        );
      }

      const slotGroups =
        shiftSlots.map((slot) => ({
          slotId: slot.id,
          assignments:
            Array.from(
              assignmentMaps.get(
                slot.id,
              )?.values() ?? [],
            ),
        }));
      const importedAssignments =
        slotGroups.reduce(
          (total, group) =>
            total +
            group.assignments.length,
          0,
        );

      if (importedAssignments === 0) {
        const warning =
          `Không có lịch phù hợp trong tuần ${formatIssueDate(
            dateFrom,
          )} - ${formatIssueDate(
            dateTo,
          )}.`;
        setError(warning);
        messageApi.warning(warning);
        return;
      }

      const nextValues:
        WeeklyUpdateFormValues = {
        facilityId:
          watchedFacilityId,
        fromDate: dateFrom,
        slotGroups,
      };

      form.setFieldsValue(
        nextValues,
      );
      saveDraft(nextValues);

      const skippedMessage =
        skippedGroups > 0
          ? ` Bỏ qua ${skippedGroups} nhóm không còn hợp lệ.`
          : "";

      messageApi.success(
        `Đã lấy ${importedAssignments} phân công của tuần hiện tại.${skippedMessage}`,
      );
    } catch (importError) {
      const importMessage =
        getErrorMessage(
          importError,
        );
      setError(importMessage);
      messageApi.error(
        importMessage,
      );
    } finally {
      setImportWeekLoading(false);
    }
  }

  function handleCancel() {
    if (
      slotsLoading ||
      importWeekLoading ||
      savingDraft
    ) {
      return;
    }

    const currentValues =
      form.getFieldsValue(true);
    saveDraft(currentValues);
    setError(null);
    onClose();
  }

  async function handleSaveDraft() {
    setError(null);
    setSavingDraft(true);

    try {
      const values =
        await form.validateFields();

      saveDraft(values);
      messageApi.success(
        "Đã lưu bản nháp cập nhật lịch tuần. Chưa gọi API cập nhật.",
      );
      onClose();
    } catch (saveError) {
      if (
        !(
          isRecord(saveError) &&
          "errorFields" in saveError
        )
      ) {
        const saveMessage =
          getErrorMessage(
            saveError,
          );
        setError(saveMessage);
        messageApi.error(
          saveMessage,
        );
      }
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <Modal
      open={open}
      centered
      width={1120}
      title={null}
      footer={null}
      closable={false}
      onCancel={handleCancel}
      mask={{
        closable:
          !slotsLoading &&
          !importWeekLoading &&
          !savingDraft,
      }}
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "82vh",
          overflow: "hidden",
        },
      }}
    >
      <div className="relative mb-5 border-b border-slate-200 pb-4 pr-12">
        <button
          type="button"
          aria-label="Đóng"
          disabled={
            slotsLoading ||
            importWeekLoading ||
            savingDraft
          }
          onClick={handleCancel}
          className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Calendar className="h-5 w-5" />
          </span>

          <div>
            <Title
              level={4}
              className="!mb-1 !text-slate-950"
            >
              Cập nhật lịch trực 1 tuần
            </Title>

            <Text type="secondary">
              Điều chỉnh bác sĩ theo từng khung ca, phòng và ngày làm việc của tuần hiện tại, từ Thứ 2 đến Chủ nhật.
            </Text>

            <Text
              type="secondary"
              className="mt-1 block text-xs"
            >
              Bản nháp được tự động lưu và sẽ được khôi phục khi mở lại.
            </Text>
          </div>
        </div>
      </div>

      <div
        className="pr-3"
        style={{
          maxHeight:
            "calc(82vh - 180px)",
          overflowY: "auto",
          scrollbarGutter:
            "stable",
        }}
      >
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            className="mb-4"
            onClose={() =>
              setError(null)
            }
          />
        ) : null}

        <Form<WeeklyUpdateFormValues>
          form={form}
          layout="vertical"
          requiredMark="optional"
          onValuesChange={(
            changedValues,
            allValues,
          ) => {
            setError(null);

            if (
              "facilityId" in
              changedValues
            ) {
              const facilityId =
                changedValues.facilityId as string;

              setShiftSlots([]);
              setSlotsLoading(
                Boolean(facilityId),
              );
              form.setFieldsValue({
                slotGroups: [],
              });
            }

            saveDraft(allValues);
          }}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="facilityId"
                label="Cơ sở"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng chọn cơ sở.",
                  },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  disabled={
                    facilities.length === 1
                  }
                  placeholder="Chọn cơ sở khám"
                  options={facilities.map(
                    (facility) => ({
                      value:
                        facility.id,
                      label: `${facility.name} (${facility.code})`,
                    }),
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                name="fromDate"
                label="Tuần được cập nhật"
                extra={
                  watchedFromDate
                    ? `Từ Thứ 2 ${formatIssueDate(
                        watchedFromDate,
                      )} đến Chủ nhật ${formatIssueDate(
                        addDaysToDateKey(
                          watchedFromDate,
                          6,
                        ),
                      )}.`
                    : "Hệ thống tự xác định tuần hiện tại."
                }
                rules={[
                  {
                    required: true,
                    message:
                      "Không xác định được tuần hiện tại.",
                  },
                ]}
              >
                <LockedWeekDateInput />
              </Form.Item>
            </Col>
          </Row>

          <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <Text
                strong
                className="block text-slate-950"
              >
                Phân công theo khung ca
              </Text>

              <Text
                type="secondary"
                className="text-sm"
              >
                Mỗi bác sĩ chọn phòng, các ngày làm việc trong tuần và số lịch tối đa.
              </Text>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={
                  <Copy className="h-4 w-4" />
                }
                loading={
                  importWeekLoading
                }
                disabled={
                  !watchedFacilityId ||
                  slotsLoading ||
                  savingDraft
                }
                onClick={() =>
                  void handleImportCurrentWeek()
                }
              >
                Lấy lịch tuần này
              </Button>

              {watchedFacilityId &&
              !slotsLoading ? (
                <Tag color="blue">
                  {shiftSlots.length} khung ca
                </Tag>
              ) : null}
            </div>
          </div>

          {!watchedFacilityId ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <Clock className="mx-auto h-7 w-7 text-slate-400" />

              <Text className="mt-3 block font-medium text-slate-700">
                Vui lòng chọn cơ sở
              </Text>

              <Text
                type="secondary"
                className="mt-1 block text-sm"
              >
                Các khung ca hoạt động của cơ sở sẽ hiển thị tại đây.
              </Text>
            </div>
          ) : slotsLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <Text type="secondary">
                Đang tải danh sách khung ca...
              </Text>
            </div>
          ) : shiftSlots.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              title="Cơ sở chưa có khung ca hoạt động"
            />
          ) : (
            <Form.List name="slotGroups">
              {(groupFields) => (
                <div className="grid gap-4">
                  {groupFields.map(
                    (
                      groupField,
                      groupIndex,
                    ) => {
                      const group =
                        watchedSlotGroups[
                          groupIndex
                        ];
                      const slot =
                        slotById.get(
                          group?.slotId ??
                            shiftSlots[
                              groupIndex
                            ]?.id ??
                            "",
                        );

                      if (!slot) {
                        return null;
                      }

                      const assignmentCount =
                        group?.assignments
                          ?.length ?? 0;

                      return (
                        <div
                          key={
                            groupField.key
                          }
                          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                          <Form.Item
                            name={[
                              groupField.name,
                              "slotId",
                            ]}
                            hidden
                          >
                            <Input />
                          </Form.Item>

                          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                                <Clock className="h-5 w-5" />
                              </span>

                              <div>
                                <Text
                                  strong
                                  className="block text-slate-950"
                                >
                                  {slot.name}
                                </Text>

                                <Text
                                  type="secondary"
                                  className="text-sm"
                                >
                                  {slot.code} ·{" "}
                                  {slot.startTime} -{" "}
                                  {slot.endTime}
                                </Text>
                              </div>
                            </div>

                            <Tag
                              color={
                                assignmentCount > 0
                                  ? "green"
                                  : "default"
                              }
                            >
                              {assignmentCount > 0
                                ? `${assignmentCount} phân công`
                                : "Chưa phân công"}
                            </Tag>
                          </div>

                          <div className="p-4">
                            <Form.List
                              name={[
                                groupField.name,
                                "assignments",
                              ]}
                            >
                              {(
                                assignmentFields,
                                { add, remove },
                              ) => (
                                <div className="flex flex-col gap-3">
                                  {assignmentFields.length ===
                                  0 ? (
                                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                                      <Text
                                        type="secondary"
                                        className="text-sm"
                                      >
                                        Chưa có bác sĩ trong khung ca này.
                                      </Text>
                                    </div>
                                  ) : null}

                                  {assignmentFields.map(
                                    (
                                      assignmentField,
                                      assignmentIndex,
                                    ) => (
                                      <div
                                        key={
                                          assignmentField.key
                                        }
                                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                                      >
                                        <div className="mb-2 flex items-center justify-between">
                                          <Text
                                            strong
                                            className="text-sm text-slate-700"
                                          >
                                            Phân công{" "}
                                            {assignmentIndex +
                                              1}
                                          </Text>

                                          <Button
                                            danger
                                            type="text"
                                            size="small"
                                            icon={
                                              <Trash2 className="h-4 w-4" />
                                            }
                                            onClick={() =>
                                              remove(
                                                assignmentField.name,
                                              )
                                            }
                                          >
                                            Xóa
                                          </Button>
                                        </div>

                                        <Row
                                          gutter={[
                                            12,
                                            0,
                                          ]}
                                        >
                                          <Col
                                            xs={24}
                                            lg={9}
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "staffId",
                                              ]}
                                              label="Bác sĩ"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Chọn bác sĩ.",
                                                },
                                              ]}
                                            >
                                              <Select
                                                showSearch
                                                optionFilterProp="label"
                                                placeholder="Chọn bác sĩ"
                                                options={
                                                  doctorOptions
                                                }
                                                notFoundContent="Cơ sở chưa có bác sĩ phù hợp"
                                              />
                                            </Form.Item>
                                          </Col>

                                          <Col
                                            xs={24}
                                            md={12}
                                            lg={6}
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "roomId",
                                              ]}
                                              label="Phòng"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Chọn phòng.",
                                                },
                                              ]}
                                            >
                                              <Select
                                                showSearch
                                                optionFilterProp="label"
                                                placeholder="Chọn phòng"
                                                options={
                                                  roomOptions
                                                }
                                              />
                                            </Form.Item>
                                          </Col>

                                          <Col
                                            xs={24}
                                            md={6}
                                            lg={4}
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "maxAppointments",
                                              ]}
                                              label="Số lịch tối đa"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Nhập số lịch.",
                                                },
                                              ]}
                                            >
                                              <InputNumber
                                                min={1}
                                                className="w-full"
                                              />
                                            </Form.Item>
                                          </Col>

                                          <Col
                                            xs={24}
                                            md={6}
                                            lg={5}
                                          >
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "status",
                                              ]}
                                              label="Trạng thái"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Chọn trạng thái.",
                                                },
                                              ]}
                                            >
                                              <Select
                                                options={[
                                                  {
                                                    value:
                                                      "available",
                                                    label:
                                                      "Còn trống",
                                                  },
                                                  {
                                                    value:
                                                      "off",
                                                    label:
                                                      "Nghỉ",
                                                  },
                                                ]}
                                              />
                                            </Form.Item>
                                          </Col>

                                          <Col xs={24}>
                                            <Form.Item
                                              name={[
                                                assignmentField.name,
                                                "workingDays",
                                              ]}
                                              label="Ngày làm việc trong tuần"
                                              rules={[
                                                {
                                                  required:
                                                    true,
                                                  message:
                                                    "Chọn ít nhất một ngày làm việc.",
                                                },
                                              ]}
                                            >
                                              <Checkbox.Group
                                                options={
                                                  getSlotWorkingDayOptions(
                                                    slot,
                                                  )
                                                }
                                                className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
                                              />
                                            </Form.Item>
                                          </Col>
                                        </Row>
                                      </div>
                                    ),
                                  )}

                                  <Button
                                    type="dashed"
                                    block
                                    icon={
                                      <Plus className="h-4 w-4" />
                                    }
                                    onClick={() =>
                                      add({
                                        staffId: "",
                                        roomId: "",
                                        workingDays: [
                                          ...getDefaultWorkingDays(
                                            slot,
                                          ),
                                        ],
                                        maxAppointments:
                                          8,
                                        status:
                                          "available",
                                      })
                                    }
                                  >
                                    Thêm bác sĩ vào{" "}
                                    {slot.name}
                                  </Button>
                                </div>
                              )}
                            </Form.List>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </Form.List>
          )}
        </Form>
      </div>

      <div className="mt-4 flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row">
        <Button
          disabled={
            slotsLoading ||
            importWeekLoading ||
            savingDraft
          }
          onClick={handleCancel}
        >
          Hủy
        </Button>

        <Button
          type="primary"
          loading={savingDraft}
          disabled={
            slotsLoading ||
            importWeekLoading
          }
          icon={
            <Save className="h-4 w-4" />
          }
          onClick={() =>
            void handleSaveDraft()
          }
        >
          Lưu bản nháp
        </Button>
      </div>
    </Modal>
  );
}
