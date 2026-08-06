"use client";

import { useMemo } from "react";
import {
  Button,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import type {
  DoctorShiftItem,
} from "@/management/features/doctor-shifts/doctor-shifts.types";
import {
  formatLongDate,
  getShiftLabel,
  renderDoctorShiftStatus,
  shiftsOverlap,
} from "./doctor-shift-modal.shared";
import type {
  DoctorOption,
  FacilityOption,
  RoomOption,
} from "./doctor-shift-modal.shared";

const { Text, Title } = Typography;

type DoctorShiftDetailModalProps = {
  open: boolean;
  shift: DoctorShiftItem | null;
  loading: boolean;
  shifts: DoctorShiftItem[];
  facilities: FacilityOption[];
  rooms: RoomOption[];
  doctors: DoctorOption[];
  canManage: boolean;
  onClose: () => void;
  onEdit: (shift: DoctorShiftItem) => void;
  onDelete: (shift: DoctorShiftItem) => void;
  onAssignDoctor: (
    doctorId: string,
  ) => Promise<void> | void;
};

export function DoctorShiftDetailModal({
  open,
  shift,
  loading,
  shifts,
  facilities,
  rooms,
  doctors,
  canManage,
  onClose,
  onEdit,
  onDelete,
  onAssignDoctor,
}: DoctorShiftDetailModalProps) {
  const facilityById = useMemo(
    () =>
      new Map(
        facilities.map((facility) => [
          facility.id,
          facility,
        ]),
      ),
    [facilities],
  );

  const roomById = useMemo(
    () =>
      new Map(
        rooms.map((room) => [room.id, room]),
      ),
    [rooms],
  );

  const doctorById = useMemo(
    () =>
      new Map(
        doctors.map((doctor) => [
          doctor.id,
          doctor,
        ]),
      ),
    [doctors],
  );

  return (
    <Modal
      open={open}
      centered
      width={900}
      title={null}
      footer={null}
      onCancel={onClose}
      mask={{
        closable: !loading,
      }}
    >
      {shift ? (
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 pr-10 sm:flex-row sm:items-start sm:pr-12">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Calendar className="h-6 w-6" />
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Title
                    level={3}
                    className="!mb-0 !text-slate-950"
                  >
                    {shift.slotName ||
                      shift.slotCode ||
                      `Ca trực #${shift.id}`}
                  </Title>

                  {renderDoctorShiftStatus(
                    shift.status,
                  )}
                </div>

                <Text
                  type="secondary"
                  className="mt-1 block"
                >
                  {formatLongDate(
                    shift.shiftDate,
                  )}{" "}
                  · {shift.startTime} -{" "}
                  {shift.endTime}
                </Text>
              </div>
            </div>

            {canManage ? (
              <Space size={8} wrap>
                <Button
                  icon={
                    <Pencil className="h-4 w-4" />
                  }
                  onClick={() =>
                    onEdit(shift)
                  }
                >
                  Cập nhật
                </Button>

                <Button
                  danger
                  icon={
                    <Trash2 className="h-4 w-4" />
                  }
                  onClick={() =>
                    onDelete(shift)
                  }
                >
                  Xóa
                </Button>
              </Space>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Thời gian
              </p>

              <p className="mb-0 font-semibold text-slate-950">
                {getShiftLabel(
                  shift.startTime,
                  shift.endTime,
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Số lịch tối đa
              </p>

              <p className="mb-0 font-semibold text-slate-950">
                {shift.maxAppointments} lịch
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Slot
              </p>

              <p className="mb-0 font-semibold text-slate-950">
                {shift.slotName ||
                  shift.slotCode ||
                  shift.slotId}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Trạng thái
              </p>

              <div className="mt-1">
                {renderDoctorShiftStatus(
                  shift.status,
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-slate-500" />

                <p className="mb-0 font-semibold text-slate-950">
                  Bác sĩ phụ trách
                </p>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Stethoscope className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <Text
                    strong
                    className="block truncate text-blue-950"
                  >
                    {shift.doctorTitle ||
                      doctorById.get(
                        shift.doctorId,
                      )?.title ||
                      "Bác sĩ"}{" "}
                    {shift.doctorName ||
                      doctorById.get(
                        shift.doctorId,
                      )?.name ||
                      `#${shift.doctorId}`}
                  </Text>

                  <Text className="block truncate text-sm text-blue-700">
                    {shift.doctorSpecialty ||
                      doctorById.get(
                        shift.doctorId,
                      )?.specialty ||
                      "Chưa cập nhật"}
                  </Text>
                </div>
              </div>

              {canManage ? (
                <Select
                  showSearch
                  optionFilterProp="label"
                  className="w-full"
                  value={shift.doctorId}
                  loading={loading}
                  placeholder="Chọn bác sĩ phụ trách"
                  options={doctors
                  .filter(
                    (doctor) =>
                      doctor.status === "active",
                  )
                  .filter((doctor) =>
                    doctor.facilityIds.includes(
                      shift.facilityId,
                    ),
                  )
                  .map((doctor) => {
                    const busy = shifts.some(
                      (item) =>
                        item.id !== shift.id &&
                        item.doctorId ===
                          doctor.id &&
                        item.shiftDate ===
                          shift.shiftDate &&
                        shiftsOverlap(
                          item.startTime,
                          item.endTime,
                          shift.startTime,
                          shift.endTime,
                        ),
                    );

                    return {
                      value: doctor.id,
                      disabled:
                        busy &&
                        doctor.id !==
                          shift.doctorId,
                      label: `${doctor.title} ${doctor.name} · ${doctor.specialty}${
                        busy &&
                        doctor.id !==
                          shift.doctorId
                          ? " · Trùng ca"
                          : ""
                      }`,
                    };
                  })}
                  onChange={(value) =>
                    void onAssignDoctor(
                      value,
                    )
                  }
                />
              ) : (
                <Text
                  type="secondary"
                  className="block text-sm"
                >
                  Bạn đang ở chế độ chỉ xem.
                </Text>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-3 font-semibold text-slate-950">
                Cơ sở và phòng
              </p>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <div>
                    <p className="mb-0 font-medium text-slate-800">
                      {shift.facilityName ||
                        facilityById.get(
                          shift.facilityId,
                        )?.name ||
                        "Chưa cập nhật"}
                    </p>

                    <p className="mb-0 text-slate-500">
                      {shift.facilityCode ||
                        facilityById.get(
                          shift.facilityId,
                        )?.code}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <p className="mb-0 text-slate-600">
                    {facilityById.get(
                      shift.facilityId,
                    )?.address ||
                      "Chưa cập nhật địa chỉ"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <p className="mb-0 text-slate-600">
                    {shift.roomName ||
                      roomById.get(
                        shift.roomId,
                      )?.name ||
                      "Chưa cập nhật"}
                    {shift.roomTypeName
                      ? ` · ${shift.roomTypeName}`
                      : shift.roomType
                        ? ` · ${shift.roomType}`
                        : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Ghi chú
                </p>

                <p className="mb-0 whitespace-pre-wrap text-sm text-slate-700">
                  {shift.note ||
                    "Không có ghi chú."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="primary"
              icon={<X className="h-4 w-4" />}
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}