"use client";

import type { ReactNode } from "react";

export function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="h-full rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
            {label}
          </p>
          <div className="break-words text-sm font-semibold text-slate-900">
            {value || "Chưa cập nhật"}
          </div>
        </div>
      </div>
    </div>
  );
}