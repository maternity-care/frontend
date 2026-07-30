"use client";

import dayjs from "dayjs";
import { Button, Checkbox, Select, Space, TimePicker, Typography } from "antd";
import { Plus, Trash2 } from "lucide-react";
import type {
  DayOfWeek,
  FacilityScheduleInput,
} from "@/management/features/facilities/facilities.types";

const { Text } = Typography;

const DAY_OPTIONS: Array<{ value: DayOfWeek; label: string }> = [
  { value: "MON", label: "Thứ 2" },
  { value: "TUE", label: "Thứ 3" },
  { value: "WED", label: "Thứ 4" },
  { value: "THU", label: "Thứ 5" },
  { value: "FRI", label: "Thứ 6" },
  { value: "SAT", label: "Thứ 7" },
  { value: "SUN", label: "Chủ nhật" },
];

const VALID_DAYS = new Set<DayOfWeek>(
  DAY_OPTIONS.map((option) => option.value),
);

export const DEFAULT_FACILITY_SCHEDULES: FacilityScheduleInput[] = [
  {
    days: ["MON", "TUE", "WED", "THU", "FRI"],
    isClosed: false,
    openTime: "07:00",
    closeTime: "19:00",
  },
  {
    days: ["SAT"],
    isClosed: false,
    openTime: "08:00",
    closeTime: "17:00",
  },
  {
    days: ["SUN"],
    isClosed: true,
  },
];

function parseTime(value?: string) {
  if (!value) return null;

  const parsed = dayjs(`2000-01-01T${value.slice(0, 5)}:00`);
  return parsed.isValid() ? parsed : null;
}

function isDayOfWeek(value: unknown): value is DayOfWeek {
  return typeof value === "string" && VALID_DAYS.has(value as DayOfWeek);
}

function normalizeScheduleValue(value: unknown): FacilityScheduleInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => {
      const days = Array.isArray(item.days)
        ? item.days.filter(isDayOfWeek)
        : [];

      return {
        days,
        isClosed: Boolean(item.isClosed),
        openTime:
          typeof item.openTime === "string"
            ? item.openTime.slice(0, 5)
            : undefined,
        closeTime:
          typeof item.closeTime === "string"
            ? item.closeTime.slice(0, 5)
            : undefined,
      };
    });
}

export function validateFacilitySchedules(value?: unknown) {
  const schedules = normalizeScheduleValue(value);

  if (schedules.length === 0) {
    return Promise.reject(new Error("Vui lòng thiết lập giờ hoạt động."));
  }

  const selectedDays = schedules.flatMap((schedule) => schedule.days);

  if (selectedDays.length === 0) {
    return Promise.reject(new Error("Vui lòng chọn ít nhất một ngày."));
  }

  if (new Set(selectedDays).size !== selectedDays.length) {
    return Promise.reject(
      new Error("Một ngày chỉ được xuất hiện trong một nhóm lịch."),
    );
  }

  for (const schedule of schedules) {
    if (schedule.days.length === 0) {
      return Promise.reject(
        new Error("Mỗi nhóm lịch phải có ít nhất một ngày."),
      );
    }

    if (schedule.isClosed) continue;

    if (!schedule.openTime || !schedule.closeTime) {
      return Promise.reject(
        new Error("Nhóm ngày mở cửa phải có giờ mở và giờ đóng."),
      );
    }

    if (schedule.openTime >= schedule.closeTime) {
      return Promise.reject(
        new Error("Giờ đóng cửa phải lớn hơn giờ mở cửa."),
      );
    }
  }

  return Promise.resolve();
}

type FacilityScheduleEditorProps = {
  value?: FacilityScheduleInput[] | null;
  onChange?: (value: FacilityScheduleInput[]) => void;
  disabled?: boolean;
};

export function FacilityScheduleEditor({
  value,
  onChange,
  disabled = false,
}: FacilityScheduleEditorProps) {
  const schedules = normalizeScheduleValue(value);

  function updateGroup(
    index: number,
    patch: Partial<FacilityScheduleInput>,
  ) {
    const nextValue = schedules.map((group, groupIndex) =>
      groupIndex === index
        ? Object.assign({}, group, patch)
        : group,
    );

    onChange?.(nextValue);
  }

  function addGroup() {
    const nextGroup: FacilityScheduleInput = {
      days: [],
      isClosed: false,
      openTime: "08:00",
      closeTime: "17:00",
    };

    onChange?.(schedules.concat(nextGroup));
  }

  function removeGroup(index: number) {
    onChange?.(
      schedules.filter((_, groupIndex) => groupIndex !== index),
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map((group, index) => {
        const usedByOtherGroups = new Set(
          schedules
            .filter((_, groupIndex) => groupIndex !== index)
            .flatMap((item) => item.days),
        );

        return (
          <div
            key={`${index}-${group.days.join("-")}`}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_auto_auto] lg:items-end">
              <div>
                <Text className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Ngày áp dụng
                </Text>

                <Select<DayOfWeek[]>
                  mode="multiple"
                  value={group.days}
                  disabled={disabled}
                  placeholder="Chọn ngày"
                  className="w-full"
                  options={DAY_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                    disabled: usedByOtherGroups.has(option.value),
                  }))}
                  onChange={(days) =>
                    updateGroup(index, {
                      days: Array.isArray(days)
                        ? days.filter(isDayOfWeek)
                        : [],
                    })
                  }
                />
              </div>

              <div>
                <Text className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Giờ mở cửa
                </Text>

                <TimePicker
                  value={parseTime(group.openTime)}
                  format="HH:mm"
                  minuteStep={5}
                  disabled={disabled || group.isClosed}
                  className="w-full"
                  onChange={(time) =>
                    updateGroup(index, {
                      openTime: time?.format("HH:mm") ?? undefined,
                    })
                  }
                />
              </div>

              <div>
                <Text className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Giờ đóng cửa
                </Text>

                <TimePicker
                  value={parseTime(group.closeTime)}
                  format="HH:mm"
                  minuteStep={5}
                  disabled={disabled || group.isClosed}
                  className="w-full"
                  onChange={(time) =>
                    updateGroup(index, {
                      closeTime: time?.format("HH:mm") ?? undefined,
                    })
                  }
                />
              </div>

              <Checkbox
                checked={group.isClosed}
                disabled={disabled}
                onChange={(event) => {
                  const isClosed = event.target.checked;

                  updateGroup(index, {
                    isClosed,
                    openTime: isClosed
                      ? undefined
                      : group.openTime || "08:00",
                    closeTime: isClosed
                      ? undefined
                      : group.closeTime || "17:00",
                  });
                }}
              >
                Đóng cửa
              </Checkbox>

              <Button
                danger
                title="Xóa nhóm lịch"
                disabled={disabled || schedules.length <= 1}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => removeGroup(index)}
              />
            </div>
          </div>
        );
      })}

      <Space>
        <Button
          type="dashed"
          disabled={disabled}
          icon={<Plus className="h-4 w-4" />}
          onClick={addGroup}
        >
          Thêm nhóm ngày
        </Button>

        <Text type="secondary">
          Mỗi ngày chỉ được nằm trong một nhóm lịch.
        </Text>
      </Space>
    </div>
  );
}
