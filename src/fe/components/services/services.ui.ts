import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import type {
  AllowedFacilityScope,
  FacilityServiceStatus,
  MaternityPackageStatus,
  ServiceStatus,
  ServiceType,
} from "@/management/features/services/services.types";

export const serviceTypeOptions = [
  {
    value: "consultation",
    label: RESPONSE_MESSAGES.SERVICES.TYPE.consultation,
  },
  {
    value: "ultrasound",
    label: RESPONSE_MESSAGES.SERVICES.TYPE.ultrasound,
  },
  {
    value: "lab_test",
    label: RESPONSE_MESSAGES.SERVICES.TYPE.lab_test,
  },
  {
    value: "screening",
    label: RESPONSE_MESSAGES.SERVICES.TYPE.screening,
  },
  {
    value: "procedure",
    label: RESPONSE_MESSAGES.SERVICES.TYPE.procedure,
  },
  {
    value: "other",
    label: RESPONSE_MESSAGES.COMMON.OTHER,
  },
] satisfies Array<{
  value: ServiceType;
  label: string;
}>;

export const serviceStatusOptions = [
  {
    value: "active",
    label: RESPONSE_MESSAGES.COMMON.status.active,
  },
  {
    value: "inactive",
    label: RESPONSE_MESSAGES.COMMON.status.inactive,
  },
] satisfies Array<{
  value: ServiceStatus;
  label: string;
}>;

export const facilityServiceStatusOptions = [
  {
    value: "available",
    label: RESPONSE_MESSAGES.COMMON.status.available,
  },
  {
    value: "unavailable",
    label: RESPONSE_MESSAGES.COMMON.status.unavailable,
  },
] satisfies Array<{
  value: FacilityServiceStatus;
  label: string;
}>;

export const maternityPackageStatusOptions = [
  {
    value: "draft",
    label: RESPONSE_MESSAGES.COMMON.status.draft,
  },
  {
    value: "active",
    label: RESPONSE_MESSAGES.COMMON.status.active,
  },
  {
    value: "inactive",
    label: RESPONSE_MESSAGES.COMMON.status.inactive,
  },
] satisfies Array<{
  value: MaternityPackageStatus;
  label: string;
}>;

export const packageScopeOptions = [
  {
    value: "all",
    label: "Tất cả cơ sở",
  },
  {
    value: "selected",
    label: "Các cơ sở được chọn",
  },
] satisfies Array<{
  value: AllowedFacilityScope;
  label: string;
}>;

export const packageRequirementOptions = [
  {
    value: "required",
    label: RESPONSE_MESSAGES.COMMON.status.required,
  },
  {
    value: "optional",
    label: RESPONSE_MESSAGES.COMMON.status.optional,
  },
] as const;

const serviceTypeLabels: Record<
  ServiceType,
  string
> = {
  consultation: RESPONSE_MESSAGES.SERVICES.TYPE.consultation,
  ultrasound: RESPONSE_MESSAGES.SERVICES.TYPE.ultrasound,
  lab_test: RESPONSE_MESSAGES.SERVICES.TYPE.lab_test,
  screening: RESPONSE_MESSAGES.SERVICES.TYPE.screening,
  procedure: RESPONSE_MESSAGES.SERVICES.TYPE.procedure,
  other: RESPONSE_MESSAGES.COMMON.OTHER,
};

export function getServiceTypeLabel(
  value: ServiceType,
) {
  return serviceTypeLabels[value];
}

export function getPackageStatusLabel(
  value: MaternityPackageStatus,
) {
  if (value === "active") {
    return RESPONSE_MESSAGES.COMMON.status.active;
  }

  if (value === "draft") {
    return RESPONSE_MESSAGES.COMMON.status.draft;
  }

  return RESPONSE_MESSAGES.COMMON.status.inactive;
}

export function getPackageStatusColor(
  value: MaternityPackageStatus,
) {
  if (value === "active") {
    return "green";
  }

  if (value === "draft") {
    return "gold";
  }

  return "default";
}

export function formatCurrency(
  value?: string | number | null,
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export function getErrorMessage(
  error: unknown,
): string {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return RESPONSE_MESSAGES.COMMON.log.error;
  }

  const possibleError = error as {
    message?: string;
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  const responseMessage =
    possibleError.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(", ");
  }

  if (
    typeof responseMessage === "string"
  ) {
    return responseMessage;
  }

  if (
    typeof possibleError.message ===
    "string"
  ) {
    return possibleError.message;
  }

  return RESPONSE_MESSAGES.COMMON.log.error;
}