import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-primary text-white hover:bg-slate-800",
        variant === "secondary" && "border border-border bg-white text-foreground hover:bg-slate-50",
        variant === "danger" && "bg-danger text-white hover:bg-red-700",
        variant === "ghost" && "text-foreground hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
