import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "green" | "blue" | "red";
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tone === "neutral" && "bg-slate-100 text-slate-700 ring-slate-200",
        tone === "green" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
        tone === "blue" && "bg-blue-50 text-blue-700 ring-blue-200",
        tone === "red" && "bg-red-50 text-red-700 ring-red-200",
        className,
      )}
      {...props}
    />
  );
}
