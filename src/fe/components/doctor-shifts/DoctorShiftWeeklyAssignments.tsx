"use client";

import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Tag,
  Typography,
} from "antd";
import type { FormInstance } from "antd";
import { Clock, Plus, Trash2 } from "lucide-react";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import {
  getDefaultWorkingDays,
  getSlotWorkingDayOptions,
} from "@/management/features/doctor-shifts/doctor-shifts.weekly-utils";
import type {
  WeeklySlotGroupFormValue,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";

export type {
  WeeklyAssignmentFormValue,
  WeeklySlotGroupFormValue,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";

const { Text } = Typography;


type Props = {
  form: FormInstance;
  shiftSlots: ShiftSlotLookupItem[];
  watchedSlotGroups: WeeklySlotGroupFormValue[];
  slotById: Map<string, ShiftSlotLookupItem>;
  doctorOptions: Array<{ value: string; label: string }>;
  roomOptions: Array<{ value: string; label: string }>;
  allowOffWithoutRoom?: boolean;
};

export function DoctorShiftWeeklyAssignments({
  form,
  shiftSlots,
  watchedSlotGroups,
  slotById,
  doctorOptions,
  roomOptions,
  allowOffWithoutRoom = false,
}: Props) {
  return (
    <Form.List name="slotGroups">
      {(groupFields) => (
        <div className="grid gap-4">
          {groupFields.map((groupField, groupIndex) => {
            const group = watchedSlotGroups[groupIndex];
            const slot = slotById.get(
              group?.slotId ?? shiftSlots[groupIndex]?.id ?? "",
            );

            if (!slot) return null;

            const assignmentCount = group?.assignments?.length ?? 0;

            return (
              <div
                key={groupField.key}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <Form.Item name={[groupField.name, "slotId"]} hidden>
                  <Input />
                </Form.Item>

                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <Clock className="h-5 w-5" />
                    </span>
                    <div>
                      <Text strong className="block text-slate-950">
                        {slot.name}
                      </Text>
                      <Text type="secondary" className="text-sm">
                        {slot.code} · {slot.startTime} - {slot.endTime}
                      </Text>
                    </div>
                  </div>

                  <Tag color={assignmentCount > 0 ? "green" : "default"}>
                    {assignmentCount > 0
                      ? `${assignmentCount} phân công`
                      : "Chưa phân công"}
                  </Tag>
                </div>

                <div className="p-4">
                  <Form.List name={[groupField.name, "assignments"]}>
                    {(assignmentFields, { add, remove }) => (
                      <div className="flex flex-col gap-3">
                        {assignmentFields.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                            <Text type="secondary" className="text-sm">
                              Chưa có bác sĩ trong khung ca này.
                            </Text>
                          </div>
                        ) : null}

                        {assignmentFields.map((assignmentField, assignmentIndex) => {
                          const status = form.getFieldValue([
                            "slotGroups",
                            groupField.name,
                            "assignments",
                            assignmentField.name,
                            "status",
                          ]);
                          const roomRequired =
                            !allowOffWithoutRoom || status !== "off";

                          return (
                            <div
                              key={assignmentField.key}
                              className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <Text strong className="text-sm text-slate-700">
                                  Phân công {assignmentIndex + 1}
                                </Text>
                                <Button
                                  danger
                                  type="text"
                                  size="small"
                                  icon={<Trash2 className="h-4 w-4" />}
                                  onClick={() => remove(assignmentField.name)}
                                >
                                  Xóa
                                </Button>
                              </div>

                              <Row gutter={[12, 0]}>
                                <Col xs={24} lg={9}>
                                  <Form.Item
                                    name={[assignmentField.name, "staffId"]}
                                    label="Bác sĩ"
                                    rules={[{ required: true, message: "Chọn bác sĩ." }]}
                                  >
                                    <Select
                                      showSearch
                                      optionFilterProp="label"
                                      placeholder="Chọn bác sĩ"
                                      options={doctorOptions}
                                      notFoundContent="Cơ sở chưa có bác sĩ phù hợp"
                                    />
                                  </Form.Item>
                                </Col>

                                <Col xs={24} md={12} lg={6}>
                                  <Form.Item
                                    name={[assignmentField.name, "roomId"]}
                                    label="Phòng"
                                    rules={[{ required: roomRequired, message: "Chọn phòng." }]}
                                  >
                                    <Select
                                      showSearch
                                      optionFilterProp="label"
                                      disabled={allowOffWithoutRoom && status === "off"}
                                      placeholder={
                                        allowOffWithoutRoom && status === "off"
                                          ? "Ca nghỉ không gán phòng"
                                          : "Chọn phòng"
                                      }
                                      options={roomOptions}
                                    />
                                  </Form.Item>
                                </Col>

                                <Col xs={24} md={6} lg={4}>
                                  <Form.Item
                                    name={[assignmentField.name, "maxAppointments"]}
                                    label="Số lịch tối đa"
                                    rules={[{ required: true, message: "Nhập số lịch." }]}
                                  >
                                    <InputNumber min={1} className="w-full" />
                                  </Form.Item>
                                </Col>

                                <Col xs={24} md={6} lg={5}>
                                  <Form.Item
                                    name={[assignmentField.name, "status"]}
                                    label="Trạng thái"
                                    rules={[{ required: true, message: "Chọn trạng thái." }]}
                                  >
                                    <Select
                                      options={[
                                        { value: "available", label: "Còn trống" },
                                        { value: "off", label: "Nghỉ" },
                                      ]}
                                      onChange={(value) => {
                                        if (allowOffWithoutRoom && value === "off") {
                                          form.setFieldValue(
                                            [
                                              "slotGroups",
                                              groupField.name,
                                              "assignments",
                                              assignmentField.name,
                                              "roomId",
                                            ],
                                            "",
                                          );
                                        }
                                      }}
                                    />
                                  </Form.Item>
                                </Col>

                                <Col xs={24}>
                                  <Form.Item
                                    name={[assignmentField.name, "workingDays"]}
                                    label="Ngày làm việc trong tuần"
                                    rules={[
                                      {
                                        required: true,
                                        message: "Chọn ít nhất một ngày làm việc.",
                                      },
                                    ]}
                                  >
                                    <Checkbox.Group
                                      options={getSlotWorkingDayOptions(slot)}
                                      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </div>
                          );
                        })}

                        <Button
                          type="dashed"
                          block
                          icon={<Plus className="h-4 w-4" />}
                          onClick={() =>
                            add({
                              staffId: "",
                              roomId: "",
                              workingDays: [...getDefaultWorkingDays(slot)],
                              maxAppointments: 8,
                              status: "available",
                            })
                          }
                        >
                          Thêm bác sĩ vào {slot.name}
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Form.List>
  );
}
