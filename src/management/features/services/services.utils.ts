import type {
  CreateFacilityServiceInput,
  CreateMaternityPackageInput,
  CreatePackageServiceInput,
  CreateServiceInput,
  FacilityMaternityPackage,
  FacilityService,
  GetFacilityServicesParams,
  GetMaternityPackagesParams,
  GetPackageServicesParams,
  GetPublicFacilityServicesParams,
  GetPublicPackageServicesParams,
  GetServicesParams,
  MaternityPackage,
  PackageService,
  Service,
  UpdateFacilityServiceInput,
  UpdateMaternityPackageInput,
  UpdatePackageServiceInput,
  UpdateServiceInput,
} from "./services.types";

// ============================================================
// Backend types
// Một số field backend có thể trả boolean dạng 0/1
// hoặc number dưới dạng string.
// ============================================================

type BackendBoolean =
  | boolean
  | 0
  | 1
  | "0"
  | "1"
  | "true"
  | "false";

type BackendService = Omit<
  Service,
  | "description"
  | "defaultDurationMinutes"
  | "requiresDoctorWarning"
  | "allowDoctorSelection"
  | "doctorSpecialty"
> & {
  description?: unknown;
  defaultDurationMinutes: unknown;
  requiresDoctorWarning: BackendBoolean;
  allowDoctorSelection?: BackendBoolean;
  doctorSpecialty?: unknown;
};

type BackendFacilityService = Omit<
  FacilityService,
  | "durationMinutes"
  | "serviceDescription"
  | "serviceDefaultDurationMinutes"
  | "serviceRequiresDoctorWarning"
  | "serviceAllowDoctorSelection"
  | "serviceDoctorSpecialty"
> & {
  durationMinutes: unknown;
  serviceDescription?: unknown;
  serviceDefaultDurationMinutes: unknown;
  serviceRequiresDoctorWarning: BackendBoolean;
  serviceAllowDoctorSelection?: BackendBoolean;
  serviceDoctorSpecialty?: unknown;
  facility?: unknown;
  service?: unknown;
};

type BackendMaternityPackage = Omit<
  MaternityPackage,
  "description" | "durationDays" | "priorityLevel"
> & {
  description?: unknown;
  durationDays?: unknown;
  priorityLevel: unknown;
};

type BackendFacilityMaternityPackage = Omit<
  FacilityMaternityPackage,
  | "description"
  | "durationDays"
  | "priorityLevel"
  | "totalServiceCount"
  | "availableServiceCount"
> & {
  description?: unknown;
  durationDays?: unknown;
  priorityLevel: unknown;
  totalServiceCount: unknown;
  availableServiceCount: unknown;
};

type BackendPackageService = Omit<
  PackageService,
  | "includedQuantity"
  | "isRequired"
  | "isOptional"
  | "serviceDescription"
  | "facilityIds"
> & {
  includedQuantity: unknown;
  isRequired: BackendBoolean;
  isOptional: BackendBoolean;
  serviceDescription?: unknown;
  facilityIds?: unknown;
};

type UnknownRecord = Record<string, unknown>;

export type {
  BackendFacilityMaternityPackage,
  BackendFacilityService,
  BackendMaternityPackage,
  BackendPackageService,
  BackendService,
};

// ============================================================
// Common helpers
// ============================================================

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimOrUndefined(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue || undefined;
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== undefined,
    ),
  ) as Partial<T>;
}

function compactQueryParams<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => {
        if (typeof item === "string") {
          const normalizedValue = item.trim();

          return [key, normalizedValue || undefined];
        }

        return [key, item];
      })
      .filter(
        ([, item]) => item !== undefined && item !== null,
      ),
  ) as Partial<T>;
}

function normalizeBoolean(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : fallback;
  }

  return fallback;
}

function normalizeNullableNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : null;
  }

  return null;
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

function normalizeString(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) {
    return fallback;
  }

  const normalizedValue = String(value).trim();

  return normalizedValue || fallback;
}

function pickNestedValue(
  record: UnknownRecord,
  key: string,
  nestedRecord: UnknownRecord | null,
  nestedKey: string,
) {
  return record[key] ?? nestedRecord?.[nestedKey];
}

function normalizeFacilityServiceType(
  value: unknown,
): FacilityService["serviceType"] {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";

  if (
    normalized === "consultation" ||
    normalized === "ultrasound" ||
    normalized === "lab_test" ||
    normalized === "screening" ||
    normalized === "procedure" ||
    normalized === "other"
  ) {
    return normalized;
  }

  return "other";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

// ============================================================
// Normalize list response
// Hỗ trợ backend trả:
// - Item[]
// - { data: Item[] }
// - { items: Item[], total }
// - { services: Item[], total }
// ============================================================

export function normalizeListPayload<T>(
  payload: unknown,
  collectionKeys: readonly string[],
): {
  items: T[];
  total: number;
} {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      total: payload.length,
    };
  }

  if (!isRecord(payload)) {
    return {
      items: [],
      total: 0,
    };
  }

  if (Array.isArray(payload.data)) {
    return {
      items: payload.data as T[],
      total: normalizeNumber(payload.total, payload.data.length),
    };
  }

  const source = isRecord(payload.data)
    ? payload.data
    : payload;

  const keys = [
    ...collectionKeys,
    "items",
    "rows",
    "results",
  ];

  for (const key of keys) {
    const items = source[key];

    if (Array.isArray(items)) {
      return {
        items: items as T[],
        total: normalizeNumber(source.total, items.length),
      };
    }
  }

  return {
    items: [],
    total: normalizeNumber(source.total),
  };
}

// ============================================================
// Service helpers
// ============================================================

export function normalizeService(
  service: BackendService,
): Service {
  return {
    ...service,
    description: normalizeNullableString(service.description),
    defaultDurationMinutes: normalizeNumber(
      service.defaultDurationMinutes,
    ),
    requiresDoctorWarning: normalizeBoolean(
      service.requiresDoctorWarning,
    ),
    allowDoctorSelection: normalizeBoolean(
      service.allowDoctorSelection ?? service.requiresDoctorWarning,
    ),
    doctorSpecialty: normalizeNullableString(service.doctorSpecialty),
  };
}

export function toServicesQueryParams(
  params?: GetServicesParams,
) {
  return compactQueryParams({
    search: params?.search,
    serviceType: params?.serviceType,
    status: params?.status,
    page: params?.page,
    limit: params?.limit,
  });
}

export function toCreateServicePayload(
  input: CreateServiceInput,
) {
  return {
    code: input.code.trim(),
    name: input.name.trim(),
    description: trimOrUndefined(input.description),
    serviceType: input.serviceType,
    defaultDurationMinutes: input.defaultDurationMinutes,
    basePrice: input.basePrice.trim(),
    requiresDoctorWarning: input.requiresDoctorWarning,
    allowDoctorSelection: input.allowDoctorSelection ?? input.requiresDoctorWarning,
    doctorSpecialty: trimOrUndefined(input.doctorSpecialty),
    status: input.status,
  };
}

export function toUpdateServicePayload(
  input: UpdateServiceInput,
) {
  return compactObject({
    code: trimOrUndefined(input.code),
    name: trimOrUndefined(input.name),
    description:
      input.description === null
        ? null
        : trimOrUndefined(input.description),
    serviceType: input.serviceType,
    defaultDurationMinutes: input.defaultDurationMinutes,
    basePrice: trimOrUndefined(input.basePrice),
    requiresDoctorWarning: input.requiresDoctorWarning,
    allowDoctorSelection: input.allowDoctorSelection,
    doctorSpecialty:
      input.doctorSpecialty === null
        ? null
        : trimOrUndefined(input.doctorSpecialty),
    status: input.status,
  });
}

// ============================================================
// Facility Service helpers
// ============================================================

export function normalizeFacilityService(
  facilityService: BackendFacilityService,
): FacilityService {
  const record = facilityService as unknown as UnknownRecord;
  const facility = isRecord(facilityService.facility)
    ? facilityService.facility
    : null;
  const service = isRecord(facilityService.service)
    ? facilityService.service
    : null;
  const serviceTypeRecord = isRecord(service?.serviceType)
    ? service.serviceType
    : null;

  return {
    ...facilityService,
    durationMinutes: normalizeNumber(
      facilityService.durationMinutes,
    ),
    facilityCode: normalizeString(
      pickNestedValue(record, "facilityCode", facility, "code"),
    ),
    facilityName: normalizeString(
      pickNestedValue(record, "facilityName", facility, "name"),
    ),
    facilityAddress: normalizeString(
      pickNestedValue(record, "facilityAddress", facility, "address"),
    ),
    facilityProvince: normalizeString(
      pickNestedValue(record, "facilityProvince", facility, "province"),
    ),
    facilityDistrict: normalizeString(
      pickNestedValue(record, "facilityDistrict", facility, "district"),
    ),
    serviceCode: normalizeString(
      pickNestedValue(record, "serviceCode", service, "code"),
    ),
    serviceName: normalizeString(
      pickNestedValue(record, "serviceName", service, "name"),
      "Dịch vụ",
    ),
    serviceDescription: normalizeNullableString(
      pickNestedValue(
        record,
        "serviceDescription",
        service,
        "description",
      ),
    ),
    serviceType: normalizeFacilityServiceType(
      record.serviceType ??
        service?.serviceType ??
        serviceTypeRecord?.code,
    ),
    serviceBasePrice: normalizeString(
      pickNestedValue(record, "serviceBasePrice", service, "basePrice"),
      facilityService.price,
    ),
    serviceDefaultDurationMinutes: normalizeNumber(
      pickNestedValue(
        record,
        "serviceDefaultDurationMinutes",
        service,
        "defaultDurationMinutes",
      ),
    ),
    serviceRequiresDoctorWarning: normalizeBoolean(
      pickNestedValue(
        record,
        "serviceRequiresDoctorWarning",
        service,
        "requiresDoctorWarning",
      ),
    ),
    serviceAllowDoctorSelection: normalizeBoolean(
      pickNestedValue(
        record,
        "serviceAllowDoctorSelection",
        service,
        "allowDoctorSelection",
      ) ??
        pickNestedValue(
          record,
          "serviceRequiresDoctorWarning",
          service,
          "requiresDoctorWarning",
        ),
    ),
    serviceDoctorSpecialty: normalizeNullableString(
      pickNestedValue(
        record,
        "serviceDoctorSpecialty",
        service,
        "doctorSpecialty",
      ),
    ),
  };
}

export function toFacilityServicesQueryParams(
  params?: GetFacilityServicesParams,
) {
  return compactQueryParams({
    search: params?.search,
    facilityId: params?.facilityId,
    serviceId: params?.serviceId,
    serviceType: params?.serviceType,
    status: params?.status,
    page: params?.page,
    limit: params?.limit,
  });
}

export function toPublicFacilityServicesQueryParams(
  params?: GetPublicFacilityServicesParams,
) {
  return compactQueryParams({
    search: params?.search,
    serviceId: params?.serviceId,
    serviceType: params?.serviceType,
    status: params?.status,
    page: params?.page,
    limit: params?.limit,
  });
}

export function toCreateFacilityServicePayload(
  input: CreateFacilityServiceInput,
) {
  return {
    facilityId: input.facilityId.trim(),
    serviceId: input.serviceId.trim(),
    price: input.price.trim(),
    durationMinutes: input.durationMinutes,
    status: input.status,
  };
}

export function toUpdateFacilityServicePayload(
  input: UpdateFacilityServiceInput,
) {
  return compactObject({
    facilityId: trimOrUndefined(input.facilityId),
    serviceId: trimOrUndefined(input.serviceId),
    price: trimOrUndefined(input.price),
    durationMinutes: input.durationMinutes,
    status: input.status,
  });
}

// ============================================================
// Maternity Package helpers
// ============================================================

export function normalizeMaternityPackage(
  maternityPackage: BackendMaternityPackage,
): MaternityPackage {
  return {
    ...maternityPackage,
    description: normalizeNullableString(
      maternityPackage.description,
    ),
    durationDays: normalizeNullableNumber(
      maternityPackage.durationDays,
    ),
    priorityLevel: normalizeNumber(
      maternityPackage.priorityLevel,
    ),
  };
}

export function normalizeFacilityMaternityPackage(
  maternityPackage: BackendFacilityMaternityPackage,
): FacilityMaternityPackage {
  return {
    ...maternityPackage,
    description: normalizeNullableString(
      maternityPackage.description,
    ),
    durationDays: normalizeNullableNumber(
      maternityPackage.durationDays,
    ),
    priorityLevel: normalizeNumber(
      maternityPackage.priorityLevel,
    ),
    totalServiceCount: normalizeNumber(
      maternityPackage.totalServiceCount,
    ),
    availableServiceCount: normalizeNumber(
      maternityPackage.availableServiceCount,
    ),
  };
}

export function toMaternityPackagesQueryParams(
  params?: GetMaternityPackagesParams,
) {
  return compactQueryParams({
    search: params?.search,
    status: params?.status,
    page: params?.page,
    limit: params?.limit,
  });
}

export function toCreateMaternityPackagePayload(
  input: CreateMaternityPackageInput,
) {
  return {
    code: input.code.trim(),
    name: input.name.trim(),
    description: trimOrUndefined(input.description),
    price: input.price.trim(),
    durationDays: input.durationDays,
    priorityLevel: input.priorityLevel,
    status: input.status,
  };
}

export function toUpdateMaternityPackagePayload(
  input: UpdateMaternityPackageInput,
) {
  return compactObject({
    code: trimOrUndefined(input.code),
    name: trimOrUndefined(input.name),
    description:
      input.description === null
        ? null
        : trimOrUndefined(input.description),
    price: trimOrUndefined(input.price),
    durationDays: input.durationDays,
    priorityLevel: input.priorityLevel,
    status: input.status,
  });
}

// ============================================================
// Package Service helpers
// ============================================================

export function normalizePackageService(
  packageService: BackendPackageService,
): PackageService {
  return {
    ...packageService,
    includedQuantity: normalizeNumber(
      packageService.includedQuantity,
    ),
    isRequired: normalizeBoolean(
      packageService.isRequired,
    ),
    isOptional: normalizeBoolean(
      packageService.isOptional,
    ),
    serviceDescription:
      normalizeNullableString(
        packageService.serviceDescription,
      ),
    facilityIds: normalizeStringArray(
      packageService.facilityIds,
    ),
  };
}

export function toPackageServicesQueryParams(
  params?: GetPackageServicesParams,
) {
  return compactQueryParams({
    packageId: params?.packageId,
    serviceId: params?.serviceId,
    serviceType: params?.serviceType,
    allowedFacilityScope: params?.allowedFacilityScope,
    search: params?.search,
    page: params?.page,
    limit: params?.limit,
  });
}

export function toPublicPackageServicesQueryParams(
  params?: GetPublicPackageServicesParams,
) {
  return compactQueryParams({
    serviceId: params?.serviceId,
    serviceType: params?.serviceType,
    allowedFacilityScope: params?.allowedFacilityScope,
    search: params?.search,
    page: params?.page,
    limit: params?.limit,
  });
}

export function toCreatePackageServicePayload(
  input: CreatePackageServiceInput,
) {
  return {
    packageId: input.packageId.trim(),
    serviceId: input.serviceId.trim(),
    includedQuantity: input.includedQuantity,
    isRequired: input.isRequired,
    isOptional: input.isOptional,
    allowedFacilityScope: input.allowedFacilityScope,
    facilityIds:
      input.allowedFacilityScope === "selected"
        ? input.facilityIds
        : [],
  };
}

export function toUpdatePackageServicePayload(
  input: UpdatePackageServiceInput,
) {
  const facilityIds =
    input.allowedFacilityScope === "all"
      ? []
      : input.facilityIds;

  return compactObject({
    packageId: trimOrUndefined(input.packageId),
    serviceId: trimOrUndefined(input.serviceId),
    includedQuantity: input.includedQuantity,
    isRequired: input.isRequired,
    isOptional: input.isOptional,
    allowedFacilityScope: input.allowedFacilityScope,
    facilityIds,
  });
}
