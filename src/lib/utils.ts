import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể thực hiện yêu cầu.";
}

export function formatCurrency(value: string | number | null | undefined) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isFormValidationError(error: unknown) {
  return typeof error === "object" && error !== null && "errorFields" in error;
}