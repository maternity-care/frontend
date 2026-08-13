"use client";

import dayjs from "dayjs";
import {
  Button,
  Checkbox,
  Select,
  Space,
  TimePicker,
  Typography,
} from "antd";
import { Plus, Trash2 } from "lucide-react";
import { FACILITY_DAY_OPTIONS } from "@/management/features/facilities/facilities.constants";
import type {
  DayOfWeek,
  FacilityScheduleInput,
} from "@/management/features/facilities/facilities.types";
import {
  isDayOfWeek,
  normalizeScheduleValue,
  validateFacilitySchedules,
} from "./facility-form.shared";

const { Text } = Typography;
export { validateFacilitySchedules };

function parseTime(value?: string) {
  if (!value) return null;
  const parsed = dayjs(`2000-01-01T${value.slice(0, 5)}:00`);
  return parsed.isValid() ? parsed : null;
}

type Props = {
  value?: FacilityScheduleInput[] | null;
  onChange?: (value: FacilityScheduleInput[]) => void;
  disabled?: boolean;
};

export function FacilityScheduleEditor({
  value,
  onChange,
  disabled = false,
}: Props) {
  const schedules = normalizeScheduleValue(value);

  function updateGroup(
    index: number,
    patch: Partial<FacilityScheduleInput>,
  ) {
    onChange?.(
      schedules.map((group, groupIndex) =>
        groupIndex === index ? { ...group, ...patch } : group,
      ),
    );
  }

  function addGroup() {
    onChange?.([
      ...schedules,
      {
        days: [],
        isClosed: false,
        openTime: "08:00",
        closeTime: "17:00",
      },
    ]);
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
                  options={FACILITY_DAY_OPTIONS.map((option) => ({
                    ...option,
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

      <Space wrap>
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
