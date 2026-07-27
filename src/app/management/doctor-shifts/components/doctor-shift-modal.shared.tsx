"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
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
  Plus,
  Trash2,
} from "lucide-react";
import {
  checkDoctorShiftConflicts,
} from "@/management/features/doctor-shifts/doctor-shifts.api";
import type {
  CreateDoctorShiftInput,
  DoctorShiftItem,
  DoctorShiftStatus,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import { getShiftSlotLookup } from "@/management/features/shift-slots/shift-slots.api";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";

const { Text, Title } = Typography;
const { TextArea } = Input;

export type FacilityOption = {
  id: string;
  name: string;
  code: string;
  address: string;
};

export type RoomOption = {
  id: string;
  facilityId: string;
  name: string;
  floor: string;
};

export type DoctorOption = {
  id: string;
  name: string;
  title: string;
  specialty: string;
  status: "active" | "inactive";
  facilityIds: string[];
};

type ShiftAssignmentFormValue = {
  doctorId: string;
  roomId: string;
  slotId: string;
  maxAppointments: number;
};

type ShiftFormValues = {
  shiftDate: string;
  facilityId: string;
  status: DoctorShiftStatus;
  note: string;
  assignments: ShiftAssignmentFormValue[];
};

export type ShiftFormPayload = Omit<
  CreateDoctorShiftInput,
  "status"
> & {
  status: DoctorShiftStatus;
};

export type ValidatedShiftForm = {
  payloads: ShiftFormPayload[];
  slotById: Map<string, ShiftSlotLookupItem>;
};

type DoctorShiftFormModalBaseProps = {
  mode: "create" | "edit";
  open: boolean;
  editingShift?: DoctorShiftItem | null;
  shifts: DoctorShiftItem[];
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  onClose: () => void;
  onSubmitValidated: (
    value: ValidatedShiftForm,
  ) => Promise<string>;
};

export function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            errors?: {
              fields?: string[];
            };
          };
        };
      }
    ).response;

    const fields = response?.data?.errors?.fields;

    if (Array.isArray(fields) && fields.length > 0) {
      return fields.join(", ");
    }

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

export function shiftsOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  return (
    timeToMinutes(firstStart) < timeToMinutes(secondEnd) &&
    timeToMinutes(secondStart) < timeToMinutes(firstEnd)
  );
}

export function readConflictResponse(raw: unknown) {
  if (typeof raw === "boolean") {
    return {
      hasConflict: raw,
      message: undefined as string | undefined,
      target: "doctor" as "doctor" | "room",
    };
  }

  if (
    raw === null ||
    typeof raw !== "object" ||
    Array.isArray(raw)
  ) {
    return {
      hasConflict: false,
      message: undefined as string | undefined,
      target: "doctor" as "doctor" | "room",
    };
  }

  const result = raw as Record<string, unknown>;
  const conflicts = Array.isArray(result.conflicts)
    ? result.conflicts
    : [];

  const doctorConflict = Boolean(
    result.doctorConflict ??
      result.hasDoctorConflict,
  );
  const roomConflict = Boolean(
    result.roomConflict ??
      result.hasRoomConflict,
  );

  const explicitConflict =
    result.hasConflict ?? result.conflict;
  const explicitAvailable =
    result.available ?? result.isAvailable;

  let hasConflict = false;

  if (typeof explicitConflict === "boolean") {
    hasConflict = explicitConflict;
  } else if (typeof explicitAvailable === "boolean") {
    hasConflict = !explicitAvailable;
  } else {
    hasConflict =
      doctorConflict ||
      roomConflict ||
      conflicts.length > 0;
  }

  return {
    hasConflict,
    message:
      typeof result.message === "string"
        ? result.message
        : undefined,
    target: roomConflict
      ? ("room" as const)
      : ("doctor" as const),
  };
}

export function formatLongDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const formatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getShiftLabel(
  startTime: string,
  endTime: string,
) {
  const hour = Number(startTime.split(":")[0]);

  if (hour < 12) {
    return `Ca sáng (${startTime} - ${endTime})`;
  }

  if (hour < 18) {
    return `Ca chiều (${startTime} - ${endTime})`;
  }

  return `Ca tối (${startTime} - ${endTime})`;
}

export function renderDoctorShiftStatus(
  status: DoctorShiftStatus,
) {
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
  const room = rooms.find(
    (item) => item.id === payload.roomId,
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
    facilityId: payload.facilityId,
    roomId: payload.roomId,
    slotId: payload.slotId,
    shiftDate: payload.shiftDate,
    maxAppointments: payload.maxAppointments,
    status: payload.status,
    note: payload.note,
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
        });
        return;
      }

      setShiftSlots([]);
      form.resetFields();
      form.setFieldsValue({
        status: "available",
        note: "",
        assignments: [
          {
            doctorId: "",
            roomId: "",
            slotId: "",
            maxAppointments: 8,
          },
        ],
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [editingShift, form, mode, open]);

  useEffect(() => {
    if (!open || !watchedFacilityId) return;

    let cancelled = false;

    void Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setSlotsLoading(true);
        }

        return getShiftSlotLookup({
          facilityId: watchedFacilityId,
          status: "active",
          limit: 30,
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
            status: "active",
          });
        }

        setShiftSlots(nextSlots);
      })
      .catch((slotError) => {
        if (!cancelled) {
          setError(getErrorMessage(slotError));
          setShiftSlots([]);
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
      shiftSlots.map((slot) => ({
        value: slot.id,
        label: `${slot.name} (${slot.code}) · ${slot.startTime} - ${slot.endTime}`,
      })),
    [shiftSlots],
  );

  function getDoctorOptions(rowIndex: number) {
    const row = watchedAssignments[rowIndex];
    const selectedSlot = row?.slotId
      ? slotById.get(row.slotId)
      : undefined;

    return doctors
      .filter((doctor) => doctor.status === "active")
      .filter((doctor) =>
        doctor.facilityIds.includes(
          watchedFacilityId,
        ),
      )
      .map((doctor) => {
        const busyInSavedSchedule = selectedSlot
          ? shifts.some(
              (shift) =>
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

        const duplicatedInCurrentForm =
          selectedSlot
            ? watchedAssignments.some(
                (
                  assignment,
                  assignmentIndex,
                ) => {
                  if (
                    assignmentIndex === rowIndex ||
                    assignment?.doctorId !== doctor.id ||
                    !assignment?.slotId
                  ) {
                    return false;
                  }

                  const otherSlot = slotById.get(
                    assignment.slotId,
                  );

                  return otherSlot
                    ? shiftsOverlap(
                        otherSlot.startTime,
                        otherSlot.endTime,
                        selectedSlot.startTime,
                        selectedSlot.endTime,
                      )
                    : false;
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
            row?.doctorId !== doctor.id,
          label: `${doctor.title} ${doctor.name} · ${doctor.specialty}${
            unavailable &&
            row?.doctorId !== doctor.id
              ? " · Trùng ca"
              : ""
          }`,
        };
      });
  }

  async function handleFinish(values: ShiftFormValues) {
    setError(null);

    try {
      const payloads: ShiftFormPayload[] = [];

      for (
        let index = 0;
        index < values.assignments.length;
        index += 1
      ) {
        const assignment = values.assignments[index];
        const selectedSlot = slotById.get(
          assignment.slotId,
        );

        if (!selectedSlot) {
          form.setFields([
            {
              name: [
                "assignments",
                index,
                "slotId",
              ],
              errors: [
                "Khung ca không hợp lệ hoặc đã ngừng hoạt động.",
              ],
            },
          ]);
          return;
        }

        const duplicateDoctor = values.assignments.some(
          (other, otherIndex) => {
            if (
              otherIndex === index ||
              other.doctorId !== assignment.doctorId
            ) {
              return false;
            }

            const otherSlot = slotById.get(other.slotId);

            return otherSlot
              ? shiftsOverlap(
                  otherSlot.startTime,
                  otherSlot.endTime,
                  selectedSlot.startTime,
                  selectedSlot.endTime,
                )
              : false;
          },
        );

        if (duplicateDoctor) {
          form.setFields([
            {
              name: [
                "assignments",
                index,
                "doctorId",
              ],
              errors: [
                "Bác sĩ bị trùng thời gian trong các dòng đang nhập.",
              ],
            },
          ]);
          return;
        }

        const duplicateRoom = values.assignments.some(
          (other, otherIndex) => {
            if (
              otherIndex === index ||
              other.roomId !== assignment.roomId
            ) {
              return false;
            }

            const otherSlot = slotById.get(other.slotId);

            return otherSlot
              ? shiftsOverlap(
                  otherSlot.startTime,
                  otherSlot.endTime,
                  selectedSlot.startTime,
                  selectedSlot.endTime,
                )
              : false;
          },
        );

        if (duplicateRoom) {
          form.setFields([
            {
              name: [
                "assignments",
                index,
                "roomId",
              ],
              errors: [
                "Phòng bị trùng thời gian trong các dòng đang nhập.",
              ],
            },
          ]);
          return;
        }

        const existingDoctorConflict = shifts.some(
          (shift) =>
            shift.id !== editingShift?.id &&
            shift.doctorId === assignment.doctorId &&
            shift.shiftDate === values.shiftDate &&
            shiftsOverlap(
              shift.startTime,
              shift.endTime,
              selectedSlot.startTime,
              selectedSlot.endTime,
            ),
        );

        if (existingDoctorConflict) {
          form.setFields([
            {
              name: [
                "assignments",
                index,
                "doctorId",
              ],
              errors: [
                "Bác sĩ đã có lịch trong khung ca này.",
              ],
            },
          ]);
          return;
        }

        const existingRoomConflict = shifts.some(
          (shift) =>
            shift.id !== editingShift?.id &&
            shift.roomId === assignment.roomId &&
            shift.shiftDate === values.shiftDate &&
            shiftsOverlap(
              shift.startTime,
              shift.endTime,
              selectedSlot.startTime,
              selectedSlot.endTime,
            ),
        );

        if (existingRoomConflict) {
          form.setFields([
            {
              name: [
                "assignments",
                index,
                "roomId",
              ],
              errors: [
                "Phòng đã được sử dụng trong khung ca này.",
              ],
            },
          ]);
          return;
        }

        payloads.push({
          doctorId: assignment.doctorId.trim(),
          facilityId: values.facilityId.trim(),
          roomId: assignment.roomId.trim(),
          slotId: assignment.slotId.trim(),
          shiftDate: values.shiftDate,
          maxAppointments: Number(
            assignment.maxAppointments,
          ),
          status:
            mode === "create"
              ? "available"
              : values.status,
          note: values.note?.trim() ?? "",
        });
      }

      if (mode === "edit" && editingShift) {
        const firstPayload = payloads[0];
        const hasChanges =
          firstPayload.doctorId !==
            editingShift.doctorId ||
          firstPayload.facilityId !==
            editingShift.facilityId ||
          firstPayload.roomId !==
            editingShift.roomId ||
          firstPayload.slotId !==
            editingShift.slotId ||
          firstPayload.shiftDate !==
            editingShift.shiftDate ||
          Number(firstPayload.maxAppointments) !==
            Number(editingShift.maxAppointments) ||
          firstPayload.status !==
            editingShift.status ||
          firstPayload.note.trim() !==
            editingShift.note.trim();

        if (!hasChanges) {
          modalApi.info({
            centered: true,
            title: "Không có gì thay đổi",
            content:
              "Thông tin ca trực hiện tại giống hoàn toàn với dữ liệu ban đầu.",
            okText: "Đóng",
          });
          return;
        }

        const confirmed =
          await new Promise<boolean>(
            (resolve) => {
              let resolved = false;

              const finish = (value: boolean) => {
                if (resolved) return;
                resolved = true;
                resolve(value);
              };

              modalApi.confirm({
                centered: true,
                closable: false,
                mask: {
                  closable: false,
                },
                title:
                  "Xác nhận cập nhật ca trực",
                content:
                  "Bạn có chắc chắn muốn lưu các thay đổi của ca trực này không?",
                okText: "Xác nhận cập nhật",
                cancelText: "Kiểm tra lại",
                onOk: () => finish(true),
                onCancel: () => finish(false),
              });
            },
          );

        if (!confirmed) return;
      }

      setSubmitting(true);

      const conflictResponses = await Promise.all(
        payloads.map((payload) =>
          checkDoctorShiftConflicts({
            doctorId: payload.doctorId,
            facilityId: payload.facilityId,
            roomId: payload.roomId,
            slotId: payload.slotId,
            shiftDate: payload.shiftDate,
            excludeShiftId: editingShift?.id,
          }),
        ),
      );

      const conflicts = conflictResponses.map(
        readConflictResponse,
      );
      const conflictIndex = conflicts.findIndex(
        (conflict) => conflict.hasConflict,
      );

      if (conflictIndex >= 0) {
        const conflict = conflicts[conflictIndex];

        form.setFields([
          {
            name: [
              "assignments",
              conflictIndex,
              conflict.target === "room"
                ? "roomId"
                : "doctorId",
            ],
            errors: [
              conflict.message ||
                "Ca trực bị trùng với lịch đã có.",
            ],
          },
        ]);
        return;
      }

      const successMessage =
        await onSubmitValidated({
          payloads,
          slotById,
        });

      messageApi.success(successMessage);
      form.resetFields();
      onClose();
    } catch (submitError) {
      const message = getErrorMessage(
        submitError,
      );

      setError(message);
      messageApi.error(message);
    } finally {
      setSubmitting(false);
    }
  }

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
      width={1040}
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
          maxHeight: "74vh",
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
              Chọn cơ sở, bác sĩ, phòng và khung ca. Thời gian và trạng thái được hiển thị theo dữ liệu API.
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
            const assignments =
              form.getFieldValue("assignments") ?? [];

            setShiftSlots([]);
            setSlotsLoading(Boolean(facilityId));

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
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} md={10}>
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
                options={facilities.map(
                  (facility) => ({
                    value: facility.id,
                    label: `${facility.name} (${facility.code})`,
                  }),
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={6}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn trạng thái.",
                },
              ]}
            >
              <Select
                disabled={mode === "create"}
                options={
                  mode === "create"
                    ? [
                        {
                          value: "available",
                          label: "Còn trống",
                        },
                      ]
                    : [
                        {
                          value: "available",
                          label: "Còn trống",
                        },
                        {
                          value: "full",
                          label: "Đã đầy",
                        },
                        {
                          value: "cancelled",
                          label: "Đã hủy",
                        },
                        {
                          value: "off",
                          label: "Nghỉ",
                        },
                      ]
                }
              />
            </Form.Item>
          </Col>
        </Row>

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
                placeholder="Nhập ghi chú cho ca trực..."
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.List
          name="assignments"
          rules={[
            {
              validator: async (
                _,
                assignments: ShiftAssignmentFormValue[],
              ) => {
                if (
                  !assignments ||
                  assignments.length === 0
                ) {
                  throw new Error(
                    "Cần ít nhất một ca trực.",
                  );
                }
              },
            },
          ]}
        >
          {(
            fields,
            { add, remove },
            { errors },
          ) => (
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
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {index + 1}
                        </span>

                        <Text strong>
                          Thông tin ca trực
                        </Text>
                      </div>

                      {mode === "create" &&
                      fields.length > 1 ? (
                        <Button
                          danger
                          type="text"
                          icon={
                            <Trash2 className="h-4 w-4" />
                          }
                          onClick={() =>
                            remove(field.name)
                          }
                        >
                          Xóa dòng
                        </Button>
                      ) : null}
                    </div>

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
                            options={getDoctorOptions(
                              index,
                            )}
                            notFoundContent={
                              watchedFacilityId
                                ? "Cơ sở chưa có bác sĩ đang hoạt động"
                                : "Vui lòng chọn cơ sở"
                            }
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
                              required: true,
                              message: "Chọn phòng.",
                            },
                          ]}
                        >
                          <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Chọn phòng"
                            options={roomOptions}
                            notFoundContent={
                              watchedFacilityId
                                ? "Cơ sở chưa có phòng hoạt động"
                                : "Vui lòng chọn cơ sở"
                            }
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} md={12} xl={6}>
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
                            notFoundContent={
                              slotsLoading
                                ? "Đang tải khung ca..."
                                : watchedFacilityId
                                  ? "Cơ sở chưa có khung ca hoạt động"
                                  : "Vui lòng chọn cơ sở"
                            }
                          />
                        </Form.Item>

                        {selectedSlot ? (
                          <div className="-mt-3 mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>
                              {selectedSlot.startTime} -{" "}
                              {selectedSlot.endTime}
                            </span>
                          </div>
                        ) : null}
                      </Col>

                      <Col xs={24} md={12} xl={3}>
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

              {mode === "create" ? (
                <Button
                  type="dashed"
                  block
                  size="large"
                  icon={
                    <Plus className="h-4 w-4" />
                  }
                  onClick={() =>
                    add({
                      doctorId: "",
                      roomId: "",
                      slotId: "",
                      maxAppointments: 8,
                    })
                  }
                >
                  Thêm ca trực
                </Button>
              ) : null}

              <Form.ErrorList errors={errors} />
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}