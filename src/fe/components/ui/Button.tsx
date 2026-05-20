import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "light" | "ghost";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-teal-700 text-white hover:bg-teal-800",
        variant === "light" && "bg-white text-teal-800 shadow-sm ring-1 ring-teal-100 hover:bg-teal-50",
        variant === "ghost" && "text-slate-700 hover:bg-teal-50",
        className,
      )}
      {...props}
    />
  );
}
