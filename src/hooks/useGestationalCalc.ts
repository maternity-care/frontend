// hooks/useGestationalCalc.ts
import { useCallback } from "react";
import dayjs, { Dayjs } from "dayjs";
import type { FormInstance } from "antd";

type UseGestationalCalcOptions = {
  form: FormInstance;
  /** Tên field tuần thai (mặc định: gestationalWeek) */
  weekField?: string;
  /** Tên field ngày dự sinh (mặc định: expectedDueDate) */
  dueDateField?: string;
  /** Tuần thai tiêu chuẩn (mặc định: 40) */
  fullTermWeeks?: number;
};

export function useGestationalCalc({
  form,
  weekField = "gestationalWeek",
  dueDateField = "expectedDueDate",
  fullTermWeeks = 40,
}: UseGestationalCalcOptions) {
  /** Khi đổi tuần thai → tự tính ngày dự sinh */
  const handleGestationalWeekChange = useCallback(
    (week: number | null) => {
      if (week == null || week < 1 || week > 42) return;

      const remainingWeeks = fullTermWeeks - week;
      const estimatedDueDate = dayjs().add(remainingWeeks, "week");

      form.setFieldsValue({
        [dueDateField]: estimatedDueDate,
      });
    },
    [form, weekField, dueDateField, fullTermWeeks]
  );

  /** Khi đổi ngày dự sinh → tự tính tuần thai */
  const handleDueDateChange = useCallback(
    (date: Dayjs | null) => {
      if (!date) return;

      const weeksLeft = date.diff(dayjs(), "week");
      const estimatedWeek = Math.max(
        1,
        Math.min(42, fullTermWeeks - weeksLeft)
      );

      form.setFieldsValue({
        [weekField]: estimatedWeek,
      });
    },
    [form, weekField, dueDateField, fullTermWeeks]
  );

  return {
    handleGestationalWeekChange,
    handleDueDateChange,
  };
}