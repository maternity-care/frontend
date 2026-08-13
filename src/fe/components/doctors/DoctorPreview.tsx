"use client";

import type { ReactNode } from "react";
import { Tag } from "antd";
import {
  Award,
  Building2,
  DoorOpen,
  Mail,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { DOCTOR_EXPERIENCE_OPTIONS } from "@/management/features/doctors/doctors.constants";
import type {
  Doctor,
  DoctorExperienceLevel,
  DoctorStatus,
} from "@/management/features/doctors/doctors.types";

type Props = {
  editingDoctor: Doctor | null;
  name?: string;
  personalEmail?: string;
  phone?: string;
  address?: string;
  staffId?: string;
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: DoctorExperienceLevel;
  workingRoomTypeId?: string;
  status?: DoctorStatus;
  roomTypeOptions: Array<{ value: string; label: string }>;
};

function PreviewLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="flex gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="mb-0 text-[11px] font-semibold uppercase text-slate-400">
          {label}
        </p>
        <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value || "Chưa nhập"}
        </div>
      </div>
    </div>
  );
}

export function DoctorPreview({
  editingDoctor,
  name,
  personalEmail,
  phone,
  address,
  staffId,
  licenseNo,
  title,
  specialty,
  yearsOfExperience,
  workingRoomTypeId,
  status,
  roomTypeOptions,
}: Props) {
  const isEditing = Boolean(editingDoctor);
  const previewTitle =
    title?.trim() && specialty?.trim()
      ? `${title.trim()} · ${specialty.trim()}`
      : title?.trim() || specialty?.trim() || editingDoctor?.title || "Bác sĩ mới";

  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50 p-3 xl:self-start">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="mb-0 truncate text-base font-semibold text-slate-950">
            {previewTitle}
          </p>
          <p className="mb-0 truncate text-sm text-slate-500">
            {isEditing
              ? `Staff ID: ${staffId || editingDoctor?.staffId || "Chưa cập nhật"}`
              : personalEmail || "Chưa có email"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Tag color="blue">Bác sĩ</Tag>
        {isEditing ? (
          <Tag color={status === "inactive" ? "default" : "green"}>
            {status === "inactive" ? "Ngừng hoạt động" : "Hoạt động"}
          </Tag>
        ) : (
          <Tag color="green">Tài khoản mới</Tag>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {isEditing ? (
          <>
            <PreviewLine icon={<UserRound className="h-4 w-4" />} label="Staff ID" value={staffId} />
            <PreviewLine icon={<Mail className="h-4 w-4" />} label="Email cá nhân" value={personalEmail} />
            <PreviewLine icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={phone} />
            <PreviewLine icon={<Building2 className="h-4 w-4" />} label="Địa chỉ" value={address} />
          </>
        ) : (
          <>
            <PreviewLine icon={<UserRound className="h-4 w-4" />} label="Họ tên" value={name} />
            <PreviewLine icon={<Mail className="h-4 w-4" />} label="Email" value={personalEmail} />
            <PreviewLine icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={phone} />
          </>
        )}

        <PreviewLine icon={<Award className="h-4 w-4" />} label="Giấy phép" value={licenseNo} />
        <PreviewLine icon={<Stethoscope className="h-4 w-4" />} label="Chuyên khoa" value={specialty} />
        <PreviewLine
          icon={<Award className="h-4 w-4" />}
          label="Kinh nghiệm"
          value={
            yearsOfExperience
              ? DOCTOR_EXPERIENCE_OPTIONS.find(
                  (option) => option.value === yearsOfExperience,
                )?.label
              : undefined
          }
        />
        <PreviewLine
          icon={<DoorOpen className="h-4 w-4" />}
          label="Loại phòng làm việc"
          value={roomTypeOptions.find((option) => option.value === workingRoomTypeId)?.label}
        />
      </div>
    </aside>
  );
}