"use client";

import type { Dispatch, SetStateAction } from "react";
import { App } from "antd";
import type { FormInstance } from "antd";
import {
  checkDoctorShiftConflicts,
} from "@/management/features/doctor-shifts/doctor-shifts.api";
import type {
  DoctorShiftItem,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import type {
  DoctorOption,
} from "@/management/features/doctor-shifts/doctor-shifts.ui-types";
import {
  doctorShiftsOverlap as shiftsOverlap,
  getDoctorShiftErrorMessage as getErrorMessage,
  readDoctorShiftConflictResponse as readConflictResponse,
  shiftBlocksDoctorConflict,
  shiftBlocksRoomConflict,
} from "@/management/features/doctor-shifts/doctor-shifts.utils";
import type { ShiftSlotLookupItem } from "@/management/features/shift-slots/shift-slots.types";
import type {
  DoctorFieldPath,
  RoomFieldPath,
  ShiftFormPayload,
  ShiftFormValues,
  ValidatedShiftForm,
} from "./doctor-shift-form.types";

type AppContext = ReturnType<typeof App.useApp>;

type Props = {
  form: FormInstance<ShiftFormValues>;
  mode: "create" | "edit";
  editingShift: DoctorShiftItem | null;
  shifts: DoctorShiftItem[];
  doctors: DoctorOption[];
  slotById: Map<string, ShiftSlotLookupItem>;
  modalApi: AppContext["modal"];
  messageApi: AppContext["message"];
  setError: Dispatch<SetStateAction<string | null>>;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  onSubmitValidated: (value: ValidatedShiftForm) => Promise<string>;
  onClose: () => void;
};

function describeRoomConflict(shift: DoctorShiftItem) {
  const staff = shift.staffName || shift.doctorName || "nhân sự khác";
  return `Phòng đang được ca #${shift.id} sử dụng (${shift.shiftDate}, ${shift.startTime} - ${shift.endTime}, ${staff}).`;
}

export function useDoctorShiftFormSubmit({
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
}: Props) {
  async function handleFinish(values: ShiftFormValues) {
    setError(null);

    try {
      const payloads: ShiftFormPayload[] = [];
      const payloadFieldPaths: Array<{
        doctor: DoctorFieldPath;
        room: RoomFieldPath;
      }> = [];

      if (mode === "create") {
        const groups = values.slotGroups ?? [];
        const selectedAssignmentCount = groups.reduce(
          (total, group) =>
            total + (group.assignments?.length ?? 0),
          0,
        );

        if (selectedAssignmentCount === 0) {
          setError(
            "Vui lòng thêm ít nhất một bác sĩ vào một khung ca.",
          );
          return;
        }

        for (
          let groupIndex = 0;
          groupIndex < groups.length;
          groupIndex += 1
        ) {
          const group = groups[groupIndex];
          const selectedSlot = slotById.get(
            group.slotId,
          );

          if (!selectedSlot) {
            continue;
          }

          const assignments = group.assignments ?? [];

          for (
            let assignmentIndex = 0;
            assignmentIndex < assignments.length;
            assignmentIndex += 1
          ) {
            const assignment =
              assignments[assignmentIndex];

            const duplicateDoctor = groups.some(
              (otherGroup, otherGroupIndex) => {
                const otherSlot = slotById.get(
                  otherGroup.slotId,
                );

                if (!otherSlot) return false;

                return (
                  otherGroup.assignments ?? []
                ).some(
                  (other, otherAssignmentIndex) => {
                    if (
                      otherGroupIndex === groupIndex &&
                      otherAssignmentIndex ===
                        assignmentIndex
                    ) {
                      return false;
                    }

                    return (
                      other.doctorId ===
                        assignment.doctorId &&
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
            );

            if (duplicateDoctor) {
              form.setFields([
                {
                  name: [
                    "slotGroups",
                    groupIndex,
                    "assignments",
                    assignmentIndex,
                    "doctorId",
                  ],
                  errors: [
                    "Bác sĩ bị trùng thời gian trong các khung ca đang chọn.",
                  ],
                },
              ]);
              return;
            }

            const duplicateRoom = groups.some(
              (otherGroup, otherGroupIndex) => {
                const otherSlot = slotById.get(
                  otherGroup.slotId,
                );

                if (!otherSlot) return false;

                return (
                  otherGroup.assignments ?? []
                ).some(
                  (other, otherAssignmentIndex) => {
                    if (
                      otherGroupIndex === groupIndex &&
                      otherAssignmentIndex ===
                        assignmentIndex
                    ) {
                      return false;
                    }

                    return (
                      other.roomId === assignment.roomId &&
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
            );

            if (duplicateRoom) {
              form.setFields([
                {
                  name: [
                    "slotGroups",
                    groupIndex,
                    "assignments",
                    assignmentIndex,
                    "roomId",
                  ],
                  errors: [
                    "Phòng bị trùng thời gian trong các khung ca đang chọn.",
                  ],
                },
              ]);
              return;
            }

            const existingDoctorConflict = shifts.some(
              (shift) =>
                shiftBlocksDoctorConflict(shift) &&
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
                    "slotGroups",
                    groupIndex,
                    "assignments",
                    assignmentIndex,
                    "doctorId",
                  ],
                  errors: [
                    "Bác sĩ đã có lịch trong thời gian này.",
                  ],
                },
              ]);
              return;
            }

            const existingRoomConflict = shifts.find(
              (shift) =>
                shiftBlocksRoomConflict(shift) &&
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
                    "slotGroups",
                    groupIndex,
                    "assignments",
                    assignmentIndex,
                    "roomId",
                  ],
                  errors: [
                    "Phòng đã được sử dụng trong thời gian này.",
                  ],
                },
              ]);
              return;
            }

            const selectedDoctor = doctors.find(
              (doctor) =>
                doctor.id === assignment.doctorId,
            );

            if (!selectedDoctor?.staffId || !selectedDoctor.roleId) {
              form.setFields([
                {
                  name: [
                    "slotGroups",
                    groupIndex,
                    "assignments",
                    assignmentIndex,
                    "doctorId",
                  ],
                  errors: [
                    "Bác sĩ chưa có staffId hợp lệ.",
                  ],
                },
              ]);
              return;
            }

            payloads.push({
              doctorId: assignment.doctorId.trim(),
              staffId: selectedDoctor.staffId.trim(),
              roleId: selectedDoctor.roleId,
              facilityId: values.facilityId.trim(),
              roomId: assignment.roomId.trim(),
              slotId: group.slotId.trim(),
              shiftDate: values.shiftDate,
              maxAppointments: Number(
                assignment.maxAppointments,
              ),
              status: "available",
              note: values.note?.trim() ?? "",
            });
            payloadFieldPaths.push({
              doctor: [
                "slotGroups",
                groupIndex,
                "assignments",
                assignmentIndex,
                "doctorId",
              ],
              room: [
                "slotGroups",
                groupIndex,
                "assignments",
                assignmentIndex,
                "roomId",
              ],
            });
          }
        }
      } else {
        const assignment = values.assignments?.[0];

        if (!assignment?.slotId) {
          throw new Error(
            "Không tìm thấy khung ca cần cập nhật.",
          );
        }

        const selectedSlot = slotById.get(
          assignment.slotId,
        );

        if (!selectedSlot) {
          form.setFields([
            {
              name: ["assignments", 0, "slotId"],
              errors: [
                "Khung ca không hợp lệ hoặc đã ngừng hoạt động.",
              ],
            },
          ]);
          return;
        }

        const selectedStatus =
          values.status ?? "available";
        const isEditingOffShift =
          selectedStatus === "off";
        const shouldCheckEditConflicts =
          selectedStatus !== "cancelled";

        const existingDoctorConflict = shouldCheckEditConflicts && shifts.some(
          (shift) =>
            shiftBlocksDoctorConflict(shift) &&
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
              name: ["assignments", 0, "doctorId"],
              errors: [
                "Bác sĩ đã có lịch trong thời gian này.",
              ],
            },
          ]);
          return;
        }

        const existingRoomConflict = shouldCheckEditConflicts && !isEditingOffShift
          ? shifts.find(
              (shift) =>
                shiftBlocksRoomConflict(shift) &&
                shift.id !== editingShift?.id &&
                shift.roomId === assignment.roomId &&
                shift.shiftDate === values.shiftDate &&
                shiftsOverlap(
                  shift.startTime,
                  shift.endTime,
                  selectedSlot.startTime,
                  selectedSlot.endTime,
                ),
            )
          : undefined;

        if (existingRoomConflict) {
          form.setFields([
            {
              name: ["assignments", 0, "roomId"],
              errors: [
                "Phòng đã được sử dụng trong thời gian này.",
              ],
            },
          ]);
          form.setFields([
            {
              name: ["assignments", 0, "roomId"],
              errors: [describeRoomConflict(existingRoomConflict)],
            },
          ]);
          return;
        }

        const selectedDoctor = doctors.find(
          (doctor) =>
            doctor.id === assignment.doctorId,
        );

        if (!selectedDoctor?.staffId || !selectedDoctor.roleId) {
          form.setFields([
            {
              name: ["assignments", 0, "doctorId"],
              errors: [
                "Bác sĩ chưa có staffId hợp lệ.",
              ],
            },
          ]);
          return;
        }

        payloads.push({
          doctorId: assignment.doctorId.trim(),
          staffId: selectedDoctor.staffId.trim(),
          roleId: selectedDoctor.roleId,
          facilityId: values.facilityId.trim(),
          roomId: isEditingOffShift
            ? null
            : assignment.roomId.trim(),
          slotId: assignment.slotId.trim(),
          shiftDate: values.shiftDate,
          maxAppointments: Number(
            assignment.maxAppointments,
          ),
          status: selectedStatus,
          note: values.note?.trim() ?? "",
        });
        payloadFieldPaths.push({
          doctor: ["assignments", 0, "doctorId"],
          room: ["assignments", 0, "roomId"],
        });
      }

      if (mode === "edit" && editingShift) {
        const firstPayload = payloads[0];

        if (!firstPayload) {
          throw new Error(
            "Không tìm thấy dữ liệu ca trực cần cập nhật.",
          );
        }

        const hasChanges =
          firstPayload.doctorId !==
            editingShift.doctorId ||
          firstPayload.staffId !==
            editingShift.staffId ||
          firstPayload.roleId !==
            editingShift.roleId ||
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
          await new Promise<boolean>((resolve) => {
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
          });

        if (!confirmed) return;
      }

      setSubmitting(true);

      const conflictResponses = await Promise.all(
        payloads.map((payload) =>
          payload.status === "cancelled" ||
          payload.status === "off"
            ? Promise.resolve({ hasConflict: false })
            : checkDoctorShiftConflicts({
                doctorId: payload.doctorId,
                staffId: payload.staffId,
                roleId: payload.roleId,
                facilityId: payload.facilityId,
                roomId: payload.roomId ?? "",
                slotId: payload.slotId,
                shiftDate: payload.shiftDate,
                note: payload.note,
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
        const paths = payloadFieldPaths[conflictIndex];

        if (paths) {
          form.setFields([
            {
              name:
                conflict.target === "room"
                  ? paths.room
                  : paths.doctor,
              errors: [
                conflict.message ||
                  "Ca trực bị trùng với lịch đã có.",
              ],
            },
          ]);
        }
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

  return handleFinish;
}
