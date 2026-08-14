"use client";

import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Tag,
  Typography,
} from "antd";
import { Clock, Plus, Trash2 } from "lucide-react";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";

const { Text } = Typography;

type AssignmentValue = {
  doctorId: string;
  roomId: string;
  slotId?: string;
  maxAppointments: number;
};

type SlotGroupValue = {
  slotId: string;
  assignments: AssignmentValue[];
};

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  mode: "create" | "edit";
  watchedFacilityId: string;
  slotsLoading: boolean;
  shiftSlots: ShiftSlotLookupItem[];
  watchedSlotGroups: SlotGroupValue[];
  watchedAssignments: AssignmentValue[];
  slotById: Map<string, ShiftSlotLookupItem>;
  roomOptions: Array<{ value: string; label: string }>;
  slotOptions: Array<{ value: string; label: string }>;
  isOffStatus: boolean;
  getCreateDoctorOptions: (
    groupIndex: number,
    assignmentIndex: number,
    slotId: string,
  ) => SelectOption[];
  getEditDoctorOptions: (rowIndex: number) => SelectOption[];
};

export function DoctorShiftFormAssignments({
  mode,
  watchedFacilityId,
  slotsLoading,
  shiftSlots,
  watchedSlotGroups,
  watchedAssignments,
  slotById,
  roomOptions,
  slotOptions,
  isOffStatus,
  getCreateDoctorOptions,
  getEditDoctorOptions,
}: Props) {
  return (
    <>
{mode === "create" ? (
  <div className="mt-1">
    <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
      <div>
        <Text strong className="block text-slate-950">
          Các khung ca của cơ sở
        </Text>
        <Text type="secondary" className="text-sm">
          Thêm một hoặc nhiều bác sĩ vào từng khung ca; mỗi bác sĩ chọn phòng và số lịch tối đa riêng.
        </Text>
      </div>

      {watchedFacilityId && !slotsLoading ? (
        <Tag color="blue">
          {shiftSlots.length} khung ca hoạt động
        </Tag>
      ) : null}
    </div>

    {!watchedFacilityId ? (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
        <Clock className="mx-auto h-7 w-7 text-slate-400" />
        <Text className="mt-3 block font-medium text-slate-700">
          Vui lòng chọn cơ sở khám
        </Text>
        <Text type="secondary" className="mt-1 block text-sm">
          Hệ thống sẽ hiển thị các khung ca đang hoạt động của cơ sở.
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
        description="Hãy tạo hoặc kích hoạt khung ca trước khi thêm lịch trực."
      />
    ) : (
      <Form.List name="slotGroups">
        {(groupFields) => (
          <div className="grid gap-4">
            {groupFields.map(
              (groupField, groupIndex) => {
                const group =
                  watchedSlotGroups[groupIndex];
                const slot = slotById.get(
                  group?.slotId ??
                    shiftSlots[groupIndex]?.id ??
                    "",
                );

                if (!slot) return null;

                const assignmentCount =
                  group?.assignments?.length ?? 0;

                return (
                  <div
                    key={groupField.key}
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
                          <Text strong className="block text-slate-950">
                            {slot.name}
                          </Text>
                          <Text type="secondary" className="text-sm">
                            {slot.code} · {slot.startTime} - {slot.endTime}
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
                          ? `${assignmentCount} bác sĩ`
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
                            {assignmentFields.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                                <Text type="secondary" className="text-sm">
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
                                  key={assignmentField.key}
                                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <Text strong className="text-sm text-slate-700">
                                      Bác sĩ {assignmentIndex + 1}
                                    </Text>

                                    <Button
                                      danger
                                      type="text"
                                      size="small"
                                      icon={<Trash2 className="h-4 w-4" />}
                                      onClick={() =>
                                        remove(
                                          assignmentField.name,
                                        )
                                      }
                                    >
                                      Xóa
                                    </Button>
                                  </div>

                                  <Row gutter={[12, 0]}>
                                    <Col xs={24} lg={10}>
                                      <Form.Item
                                        name={[
                                          assignmentField.name,
                                          "doctorId",
                                        ]}
                                        label="Bác sĩ"
                                        rules={[
                                          {
                                            required: true,
                                            message:
                                              "Chọn bác sĩ.",
                                          },
                                        ]}
                                      >
                                        <Select
                                          showSearch
                                          optionFilterProp="label"
                                          placeholder="Chọn bác sĩ"
                                          options={getCreateDoctorOptions(
                                            groupIndex,
                                            assignmentIndex,
                                            slot.id,
                                          )}
                                          notFoundContent="Cơ sở chưa có bác sĩ phù hợp"
                                        />
                                      </Form.Item>
                                    </Col>

                                    <Col xs={24} md={14} lg={9}>
                                      <Form.Item
                                        name={[
                                          assignmentField.name,
                                          "roomId",
                                        ]}
                                        label="Phòng"
                                        rules={[
                                          {
                                            required: true,
                                            message:
                                              "Chọn phòng.",
                                          },
                                        ]}
                                      >
                                        <Select
                                          showSearch
                                          optionFilterProp="label"
                                          placeholder="Chọn phòng"
                                          options={roomOptions}
                                          notFoundContent="Cơ sở chưa có phòng hoạt động"
                                        />
                                      </Form.Item>
                                    </Col>

                                    <Col xs={24} md={10} lg={5}>
                                      <Form.Item
                                        name={[
                                          assignmentField.name,
                                          "maxAppointments",
                                        ]}
                                        label="Số lịch tối đa"
                                        rules={[
                                          {
                                            required: true,
                                            message:
                                              "Nhập số lịch tối đa.",
                                          },
                                        ]}
                                      >
                                        <InputNumber
                                          min={0}
                                          className="w-full"
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
                              icon={<Plus className="h-4 w-4" />}
                              onClick={() =>
                                add({
                                  doctorId: "",
                                  roomId: "",
                                  maxAppointments: 8,
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
              },
            )}
          </div>
        )}
      </Form.List>
    )}
  </div>
) : (
  <Form.List name="assignments">
    {(fields) => (
      <div className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const selectedSlotId =
            watchedAssignments[index]?.slotId;
          const selectedSlot = selectedSlotId
            ? slotById.get(selectedSlotId)
            : undefined;

          return (
            <div
              key={field.key}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12} xl={7}>
                  <Form.Item
                    name={[
                      field.name,
                      "doctorId",
                    ]}
                    label="Bác sĩ"
                    rules={[
                      {
                        required: true,
                        message: "Chọn bác sĩ.",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn bác sĩ"
                      options={getEditDoctorOptions(
                        index,
                      )}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12} xl={5}>
                  <Form.Item
                    name={[
                      field.name,
                      "roomId",
                    ]}
                    label="Phòng"
                    rules={[
                      {
                        required: !isOffStatus,
                        message: "Chọn phòng.",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      disabled={isOffStatus}
                      placeholder={
                        isOffStatus
                          ? "Ca nghỉ không gán phòng"
                          : "Chọn phòng"
                      }
                      options={roomOptions}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12} xl={7}>
                  <Form.Item
                    name={[
                      field.name,
                      "slotId",
                    ]}
                    label="Khung ca"
                    rules={[
                      {
                        required: true,
                        message:
                          "Chọn khung ca.",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn khung ca"
                      loading={slotsLoading}
                      options={slotOptions}
                    />
                  </Form.Item>

                  {selectedSlot ? (
                    <div className="-mt-3 mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>
                        {selectedSlot.startTime} - {selectedSlot.endTime}
                      </span>
                    </div>
                  ) : null}
                </Col>

                <Col xs={24} md={12} xl={5}>
                  <Form.Item
                    name={[
                      field.name,
                      "maxAppointments",
                    ]}
                    label="Số lịch tối đa"
                    rules={[
                      {
                        required: true,
                        message:
                          "Nhập số lịch tối đa.",
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          );
        })}
      </div>
    )}
  </Form.List>
)}
    </>
  );
}
