"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Typography,
} from "antd";
import {
  Calendar,
} from "lucide-react";
import type {
  DoctorShiftItem,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import { getShiftSlotLookup } from "@/management/features/shift-slots/shift-slots.api";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import { DoctorShiftFormAssignments } from "./DoctorShiftFormAssignments";
import {
  addDaysToDateKey,
  getNextWeekMondayDateKey,
  getTomorrowDateKey,
  isSlotApplicableToDate,
} from "@/management/features/doctor-shifts/doctor-shifts.weekly-utils";
import { useDoctorShiftFormSubmit } from "./useDoctorShiftFormSubmit";
import type {
  DoctorShiftFormModalBaseProps,
  ShiftAssignmentFormValue,
  ShiftFormPayload,
  ShiftFormValues,
} from "./doctor-shift-form.types";

export type {
  ShiftFormPayload,
  ValidatedShiftForm,
} from "./doctor-shift-form.types";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import {
  doctorShiftsOverlap,
  formatDoctorShiftLongDate,
  getDoctorShiftErrorMessage,
  getDoctorShiftLabel,
  isDoctorShiftInPast,
  readDoctorShiftConflictResponse,
  renderDoctorShiftStatus,
  shiftBlocksDoctorConflict,
  shiftBlocksRoomConflict,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";

export type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";

export const getErrorMessage = getDoctorShiftErrorMessage;
export const shiftsOverlap = doctorShiftsOverlap;
export const isShiftInPast = isDoctorShiftInPast;
export const readConflictResponse = readDoctorShiftConflictResponse;
export const formatLongDate = formatDoctorShiftLongDate;
export const getShiftLabel = getDoctorShiftLabel;
export {
  renderDoctorShiftStatus,
  shiftBlocksDoctorConflict,
  shiftBlocksRoomConflict,
};

const { Text, Title } = Typography;
const { TextArea } = Input;

export function mergeShiftDisplayData({
  original,
  response,
  detail,
  payload,
  doctors,
  facilities,
  rooms,
  slotById,
}: {
  original?: DoctorShiftItem;
  response: DoctorShiftItem;
  detail?: DoctorShiftItem;
  payload: ShiftFormPayload;
  doctors: DoctorOption[];
  facilities: FacilityOption[];
  rooms: RoomOption[];
  slotById: Map<string, ShiftSlotLookupItem>;
}): DoctorShiftItem {
  const doctor = doctors.find(
    (item) => item.id === payload.doctorId,
  );
  const facility = facilities.find(
    (item) => item.id === payload.facilityId,
  );
  const payloadRoomId = payload.roomId ?? "";
  const room = rooms.find(
    (item) => item.id === payloadRoomId,
  );
  const slot = slotById.get(payload.slotId);
  const merged = {
    ...original,
    ...response,
    ...detail,
  } as DoctorShiftItem;

  return {
    ...merged,
    id: merged.id || original?.id || "",
    doctorId: payload.doctorId,
    staffId: payload.staffId,
    roleId: payload.roleId,
    facilityId: payload.facilityId,
    roomId: payloadRoomId,
    slotId: payload.slotId,
    shiftDate: payload.shiftDate,
    maxAppointments: payload.maxAppointments,
    status: payload.status,
    note: payload.note,
    staffName:
      detail?.staffName ||
      response.staffName ||
      doctor?.name ||
      original?.staffName ||
      "",
    roleName:
      detail?.roleName ||
      response.roleName ||
      original?.roleName ||
      "Bác sĩ",
    doctorName:
      detail?.doctorName ||
      response.doctorName ||
      doctor?.name ||
      original?.doctorName ||
      `Bác sĩ #${payload.doctorId}`,
    doctorTitle:
      detail?.doctorTitle ||
      response.doctorTitle ||
      doctor?.title ||
      original?.doctorTitle ||
      "Bác sĩ",
    doctorSpecialty:
      detail?.doctorSpecialty ||
      response.doctorSpecialty ||
      doctor?.specialty ||
      original?.doctorSpecialty ||
      "Chưa cập nhật",
    facilityName:
      detail?.facilityName ||
      response.facilityName ||
      facility?.name ||
      original?.facilityName ||
      "",
    facilityCode:
      detail?.facilityCode ||
      response.facilityCode ||
      facility?.code ||
      original?.facilityCode ||
      "",
    roomName:
      detail?.roomName ||
      response.roomName ||
      room?.name ||
      original?.roomName ||
      "",
    slotCode:
      detail?.slotCode ||
      response.slotCode ||
      slot?.code ||
      original?.slotCode ||
      "",
    slotName:
      detail?.slotName ||
      response.slotName ||
      slot?.name ||
      original?.slotName ||
      "",
    startTime:
      detail?.startTime ||
      response.startTime ||
      slot?.startTime ||
      original?.startTime ||
      "",
    endTime:
      detail?.endTime ||
      response.endTime ||
      slot?.endTime ||
      original?.endTime ||
      "",
  };
}

export function DoctorShiftFormModalBase({
  mode,
  open,
  editingShift = null,
  shifts,
  facilities,
  rooms,
  doctors,
  onClose,
  onSubmitValidated,
}: DoctorShiftFormModalBaseProps) {
  const {
    message: messageApi,
    modal: modalApi,
  } = App.useApp();
  const [form] = Form.useForm<ShiftFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [shiftSlots, setShiftSlots] = useState<
    ShiftSlotLookupItem[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const watchedDate =
    Form.useWatch("shiftDate", form) ?? "";
  const watchedFacilityId =
    Form.useWatch("facilityId", form) ?? "";
  const watchedAssignments =
    Form.useWatch("assignments", form) ?? [];
  const watchedSlotGroups =
    Form.useWatch("slotGroups", form) ?? [];
  const watchedStatus =
    Form.useWatch("status", form) ?? "available";
  const isOffStatus = watchedStatus === "off";

  const slotById = useMemo(
    () =>
      new Map(
        shiftSlots.map((slot) => [slot.id, slot]),
      ),
    [shiftSlots],
  );

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setError(null);

      if (mode === "edit" && editingShift) {
        form.setFieldsValue({
          shiftDate: editingShift.shiftDate,
          facilityId: editingShift.facilityId,
          status: editingShift.status,
          note: editingShift.note,
          assignments: [
            {
              doctorId: editingShift.doctorId,
              roomId: editingShift.roomId,
              slotId: editingShift.slotId,
              maxAppointments:
                editingShift.maxAppointments,
            },
          ],
          slotGroups: [],
        });
        return;
      }

      setShiftSlots([]);
      form.resetFields();
      form.setFieldsValue({
        shiftDate: getTomorrowDateKey(),
        facilityId:
          facilities.length === 1
            ? facilities[0]?.id
            : undefined,
        status: "available",
        note: "",
        assignments: [],
        slotGroups: [],
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    editingShift,
    facilities,
    form,
    mode,
    open,
  ]);

  useEffect(() => {
    if (!open || !watchedFacilityId) {
      return;
    }

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setSlotsLoading(true);
        }

        return getShiftSlotLookup({
          facilityId: watchedFacilityId,
          status: "active",
          limit: 40,
        });
      })
      .then((data) => {
        if (cancelled) return;

        const nextSlots = [...data];

        if (
          mode === "edit" &&
          editingShift &&
          editingShift.facilityId === watchedFacilityId &&
          editingShift.slotId &&
          !nextSlots.some(
            (slot) => slot.id === editingShift.slotId,
          )
        ) {
          nextSlots.push({
            id: editingShift.slotId,
            facilityId: editingShift.facilityId,
            code: editingShift.slotCode,
            name:
              editingShift.slotName ||
              `Khung ca #${editingShift.slotId}`,
            startTime: editingShift.startTime,
            endTime: editingShift.endTime,
            applicableDays: [],
            status: "active",
          });
        }

        setShiftSlots(nextSlots);

        if (mode === "create") {
          form.setFieldsValue({
            slotGroups: nextSlots.map((slot) => ({
              slotId: slot.id,
              assignments: [],
            })),
          });
        }
      })
      .catch((slotError) => {
        if (!cancelled) {
          setError(getErrorMessage(slotError));
          setShiftSlots([]);
          if (mode === "create") {
            form.setFieldsValue({
              slotGroups: [],
            });
          }
        }
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
    editingShift,
    form,
    mode,
    open,
    watchedFacilityId,
  ]);

  const roomOptions = useMemo(
    () =>
      rooms
        .filter(
          (room) =>
            room.facilityId === watchedFacilityId,
        )
        .map((room) => ({
          value: room.id,
          label: `${room.name} · ${room.floor}`,
        })),
    [rooms, watchedFacilityId],
  );

  const slotOptions = useMemo(
    () =>
      shiftSlots
        .filter((slot) =>
          isSlotApplicableToDate(slot, watchedDate),
        )
        .map((slot) => ({
          value: slot.id,
          label: `${slot.name} (${slot.code}) · ${slot.startTime} - ${slot.endTime}`,
        })),
    [shiftSlots, watchedDate],
  );

  function getActiveDoctorsForFacility() {
    return doctors
      .filter((doctor) => doctor.status === "active")
      .filter((doctor) =>
        doctor.facilityIds.includes(
          watchedFacilityId,
        ),
      );
  }

  function getCreateDoctorOptions(
    groupIndex: number,
    assignmentIndex: number,
    slotId: string,
  ) {
    const selectedSlot = slotById.get(slotId);
    const currentDoctorId =
      watchedSlotGroups[groupIndex]?.assignments?.[
        assignmentIndex
      ]?.doctorId;

    return getActiveDoctorsForFacility().map(
      (doctor) => {
        const busyInSavedSchedule = selectedSlot
          ? shifts.some(
              (shift) =>
                shiftBlocksDoctorConflict(shift) &&
                shift.doctorId === doctor.id &&
                shift.shiftDate === watchedDate &&
                shiftsOverlap(
                  shift.startTime,
                  shift.endTime,
                  selectedSlot.startTime,
                  selectedSlot.endTime,
                ),
            )
          : false;

        const duplicatedInCurrentForm = selectedSlot
          ? watchedSlotGroups.some(
              (group, otherGroupIndex) => {
                const otherSlot = slotById.get(
                  group?.slotId,
                );

                if (!otherSlot) return false;

                return (
                  group?.assignments ?? []
                ).some(
                  (assignment, otherAssignmentIndex) => {
                    if (
                      otherGroupIndex === groupIndex &&
                      otherAssignmentIndex ===
                        assignmentIndex
                    ) {
                      return false;
                    }

                    return (
                      assignment?.doctorId === doctor.id &&
                      shiftsOverlap(
                        otherSlot.startTime,
                        otherSlot.endTime,
                        selectedSlot.startTime,
                        selectedSlot.endTime,
                      )
                    );
                  },
                );
              },
            )
          : false;

        const unavailable =
          busyInSavedSchedule ||
          duplicatedInCurrentForm;

        return {
          value: doctor.id,
          disabled:
            unavailable &&
            currentDoctorId !== doctor.id,
          label: `${doctor.title} ${doctor.name} · ${doctor.specialty}${
            unavailable && currentDoctorId !== doctor.id
              ? " · Trùng ca"
              : ""
          }`,
        };
      },
    );
  }

  function getEditDoctorOptions(rowIndex: number) {
    const row = watchedAssignments[rowIndex];
    const selectedSlot = row?.slotId
      ? slotById.get(row.slotId)
      : undefined;

    return getActiveDoctorsForFacility().map(
      (doctor) => {
        const busyInSavedSchedule = selectedSlot
          ? shifts.some(
              (shift) =>
                shiftBlocksDoctorConflict(shift) &&
                shift.id !== editingShift?.id &&
                shift.doctorId === doctor.id &&
                shift.shiftDate === watchedDate &&
                shiftsOverlap(
                  shift.startTime,
                  shift.endTime,
                  selectedSlot.startTime,
                  selectedSlot.endTime,
                ),
            )
          : false;

        return {
          value: doctor.id,
          disabled:
            busyInSavedSchedule &&
            row?.doctorId !== doctor.id,
          label: `${doctor.title} ${doctor.name} · ${doctor.specialty}${
            busyInSavedSchedule &&
            row?.doctorId !== doctor.id
              ? " · Trùng ca"
              : ""
          }`,
        };
      },
    );
  }

  const handleFinish = useDoctorShiftFormSubmit({
    form,
    mode,
    editingShift,
    shifts,
    doctors,
    slotById,
    modalApi,
    messageApi,
    setError,
    setSubmitting,
    onSubmitValidated,
    onClose,
  });

  function handleCancel() {
    if (submitting) return;

    form.resetFields();
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      centered
      width={1080}
      title={null}
      okText={
        mode === "edit"
          ? "Lưu thay đổi"
          : "Tạo lịch trực"
      }
      cancelText="Hủy"
      confirmLoading={submitting}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      mask={{
        closable: !submitting,
      }}
      destroyOnHidden
      styles={{
        body: {
          maxHeight: "76vh",
          overflowY: "auto",
          marginRight: 28,
          paddingRight: 12,
        },
      }}
    >
      <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Calendar className="h-5 w-5" />
          </span>

          <div>
            <Title
              level={4}
              className="!mb-1 !text-slate-950"
            >
              {mode === "edit"
                ? "Cập nhật ca trực"
                : "Thêm lịch trực mới"}
            </Title>

            <Text type="secondary">
              {mode === "create"
                ? "Chọn cơ sở, sau đó phân công bác sĩ theo từng khung ca hoạt động."
                : "Cập nhật bác sĩ, phòng và khung ca của lịch trực."}
            </Text>
          </div>
        </div>
      </div>

      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          closable
          className="mb-4"
          onClose={() => setError(null)}
        />
      ) : null}

      <Form<ShiftFormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={(values) =>
          void handleFinish(values)
        }
        onValuesChange={(changedValues) => {
          if ("facilityId" in changedValues) {
            const facilityId =
              changedValues.facilityId as string;

            setShiftSlots([]);
            setSlotsLoading(Boolean(facilityId));

            if (mode === "create") {
              form.setFieldsValue({
                slotGroups: [],
              });
            } else {
              const assignments =
                form.getFieldValue("assignments") ?? [];

              form.setFieldsValue({
                assignments: assignments.map(
                  (
                    assignment: ShiftAssignmentFormValue,
                  ) => ({
                    ...assignment,
                    doctorId: "",
                    roomId: "",
                    slotId: "",
                  }),
                ),
              });
            }
          }

          if (mode === "edit" && changedValues.status === "off") {
            const assignments =
              form.getFieldValue("assignments") ?? [];

            form.setFieldsValue({
              assignments: assignments.map(
                (
                  assignment: ShiftAssignmentFormValue,
                ) => ({
                  ...assignment,
                  roomId: "",
                }),
              ),
            });
          }
        }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={8}>
            <Form.Item
              name="shiftDate"
              label="Ngày trực"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn ngày trực.",
                },
              ]}
            >
              <Input
                type="date"
                min={mode === "create" ? getTomorrowDateKey() : undefined}
                max={mode === "create"
                  ? addDaysToDateKey(getNextWeekMondayDateKey(), 6)
                  : undefined}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={16}>
            <Form.Item
              name="facilityId"
              label="Cơ sở"
              rules={[
                {
                  required: true,
                  message: "Chọn cơ sở.",
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
                    value: facility.id,
                    label: `${facility.name} (${facility.code})`,
                  }),
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {mode === "edit" ? (
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[
                  {
                    required: true,
                    message: "Chọn trạng thái ca trực.",
                  },
                ]}
              >
                <Select
                  options={[
                    { value: "available", label: "Có thể đặt lịch" },
                    { value: "full", label: "Đã đầy" },
                    { value: "off", label: "Nghỉ" },
                    { value: "cancelled", label: "Đã hủy" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        ) : null}

        <Row gutter={[16, 0]}>
          <Col xs={24}>
            <Form.Item
              name="note"
              label="Ghi chú"
              rules={[
                {
                  max: 500,
                  message:
                    "Ghi chú tối đa 500 ký tự.",
                },
              ]}
            >
              <TextArea
                rows={2}
                maxLength={500}
                showCount
                placeholder="Nhập ghi chú chung cho các ca trực..."
              />
            </Form.Item>
          </Col>
        </Row>

        <DoctorShiftFormAssignments
          mode={mode}
          watchedFacilityId={watchedFacilityId}
          slotsLoading={slotsLoading}
          shiftSlots={shiftSlots}
          watchedSlotGroups={watchedSlotGroups}
          watchedAssignments={watchedAssignments}
          slotById={slotById}
          roomOptions={roomOptions}
          slotOptions={slotOptions}
          isOffStatus={isOffStatus}
          getCreateDoctorOptions={getCreateDoctorOptions}
          getEditDoctorOptions={getEditDoctorOptions}
        />
      </Form>
    </Modal>
  );
}
