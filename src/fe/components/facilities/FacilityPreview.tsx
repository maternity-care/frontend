"use client";

import { Tag } from "antd";
import {
  Building2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import type {
  FacilityScheduleInput,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import {
  getFacilityStatusText,
  getScheduleSummary,
} from "./facility-form.shared";

function PreviewLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value || "Chưa nhập"}
        </p>
      </div>
    </div>
  );
}

type Props = {
  name?: string;
  code?: string;
  status?: FacilityStatus;
  ownerName?: string;
  hotline?: string;
  email?: string;
  fullAddress?: string;
  schedules?: FacilityScheduleInput[];
};

export function FacilityPreview({
  name,
  code,
  status = "active",
  ownerName,
  hotline,
  email,
  fullAddress,
  schedules,
}: Props) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5 xl:sticky xl:top-0 xl:self-start">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-950">
            {name || "Cơ sở khám"}
          </p>
          <p className="text-sm text-slate-500">
            {code || "Mã được tạo tự động"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Tag color={status === "active" ? "green" : "default"}>
          {getFacilityStatusText(status)}
        </Tag>
      </div>

      <div className="mt-5 space-y-3">
        <PreviewLine icon={<UserRound className="h-4 w-4" />} label="Chủ cơ sở" value={ownerName} />
        <PreviewLine icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={hotline} />
        <PreviewLine icon={<Mail className="h-4 w-4" />} label="Email" value={email} />
        <PreviewLine icon={<MapPin className="h-4 w-4" />} label="Địa chỉ" value={fullAddress} />
        <PreviewLine icon={<Clock3 className="h-4 w-4" />} label="Lịch hoạt động" value={getScheduleSummary(schedules)} />
      </div>
    </aside>
  );
}
