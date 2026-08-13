"use client";

import { Card, Form, Space } from "antd";
import { Clock3 } from "lucide-react";
import {
  FacilityScheduleEditor,
  validateFacilitySchedules,
} from "./FacilityScheduleEditor";

export function FacilityScheduleCard({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  return (
    <Card
      className="border-slate-200"
      title={
        <Space>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Clock3 className="h-4 w-4" />
          </span>
          <span className="font-semibold text-slate-950">Lịch hoạt động</span>
        </Space>
      }
    >
      <Form.Item
        name="schedules"
        rules={[{ validator: (_rule, value) => validateFacilitySchedules(value) }]}
      >
        <FacilityScheduleEditor disabled={disabled} />
      </Form.Item>
    </Card>
  );
}
