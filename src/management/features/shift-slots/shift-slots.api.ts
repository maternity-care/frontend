import {
  apiClient,
} from "@/lib/axios";
import {
  SHIFT_SLOT_API_DEFAULT_LIMIT,
  SHIFT_SLOT_APPLICABLE_DAYS,
} from "./shift-slots.constants";
import type {
  BackendShiftSlot,
  BackendShiftSlotLookupItem,
  BackendShiftSlotPagination,
  CreateShiftSlotInput,
  GetShiftSlotLookupParams,
  GetShiftSlotsParams,
  ShiftSlot,
  ShiftSlotApplicableDay,
  ShiftSlotApiResponse,
  ShiftSlotListResult,
  ShiftSlotLookupItem,
  ShiftSlotStatus,
  UpdateShiftSlotInput,
} from "./shift-slots.types";

const ENDPOINT =
  "/management/shift-slots";

const DEFAULT_PAGE = 1;

function compactObject(
  value: Record<
    string,
    unknown
  >,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) =>
        item !== undefined &&
        item !== null &&
        item !== "",
    ),
  );
}

function normalizePositiveInteger(
  value: unknown,
  fallback: number,
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function normalizeNonNegativeInteger(
  value: unknown,
  fallback: number,
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function normalizeTime(
  value: unknown,
): string {
  const [
    hour = "00",
    minute = "00",
  ] = String(
    value ?? "",
  )
    .trim()
    .split(":");

  return `${hour.padStart(
    2,
    "0",
  )}:${minute.padStart(
    2,
    "0",
  )}`;
}

function normalizeStatus(
  status: unknown,
): ShiftSlotStatus {
  return String(
    status ?? "",
  )
    .trim()
    .toLowerCase() ===
    "inactive"
    ? "inactive"
    : "active";
}

function normalizeBoolean(
  value: unknown,
): boolean {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return value === 1;
  }

  const normalized =
    String(
      value ?? "",
    )
      .trim()
      .toLowerCase();

  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes"
  );
}

function normalizeApplicableDays(
  value: unknown,
): ShiftSlotApplicableDay[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const selectedDays =
    new Set(
      value.map((item) =>
        String(
          item ?? "",
        )
          .trim()
          .toUpperCase(),
      ),
    );

  return SHIFT_SLOT_APPLICABLE_DAYS.filter(
    (day) =>
      selectedDays.has(day),
  );
}

function normalizeShiftSlot(
  slot: BackendShiftSlot,
): ShiftSlot {
  return {
    id: String(
      slot?.id ?? "",
    ),
    facilityId: String(
      slot?.facilityId ?? "",
    ),
    facilityName: String(
      slot?.facilityName ?? "",
    ),
    facilityCode: String(
      slot?.facilityCode ?? "",
    ),
    code: String(
      slot?.code ?? "",
    ),
    name: String(
      slot?.name ?? "",
    ),
    startTime:
      normalizeTime(
        slot?.startTime,
      ),
    endTime:
      normalizeTime(
        slot?.endTime,
      ),
    isOvernight:
      normalizeBoolean(
        slot?.isOvernight,
      ),
    applicableDays:
      normalizeApplicableDays(
        slot?.applicableDays,
      ),
    status:
      normalizeStatus(
        slot?.status,
      ),
    createdAt: String(
      slot?.createdAt ?? "",
    ),
    updatedAt: String(
      slot?.updatedAt ?? "",
    ),
  };
}

function normalizeLookupItem(
  slot: BackendShiftSlotLookupItem,
): ShiftSlotLookupItem {
  return {
    id: String(
      slot?.id ?? "",
    ),
    facilityId: String(
      slot?.facilityId ?? "",
    ),
    code: String(
      slot?.code ?? "",
    ),
    name: String(
      slot?.name ?? "",
    ),
    startTime:
      normalizeTime(
        slot?.startTime,
      ),
    endTime:
      normalizeTime(
        slot?.endTime,
      ),
    applicableDays:
      normalizeApplicableDays(
        slot?.applicableDays,
      ),
    status:
      normalizeStatus(
        slot?.status,
      ),
  };
}

function readResponseData<T>(
  raw: unknown,
): {
  success: boolean;
  message: string;
  data: T;
} {
  if (
    raw === undefined ||
    raw === null ||
    raw === ""
  ) {
    return {
      success: true,
      message: "",
      data: null as T,
    };
  }

  if (
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (
      "data" in raw ||
      "success" in raw ||
      "message" in raw
    )
  ) {
    const envelope =
      raw as {
        success?: boolean;
        message?: string;
        data?: T;
      };

    return {
      success:
        envelope.success ??
        true,
      message:
        envelope.message ??
        "",
      data:
        envelope.data ??
        (null as T),
    };
  }

  return {
    success: true,
    message: "",
    data: raw as T,
  };
}

function toListParams(
  params?: GetShiftSlotsParams,
) {
  return compactObject({
    search:
      params?.search?.trim(),
    facilityId:
      params?.facilityId?.trim(),
    status:
      params?.status,
    page:
      params?.page ??
      DEFAULT_PAGE,
    limit:
      params?.limit ??
      SHIFT_SLOT_API_DEFAULT_LIMIT,
  });
}

function toLookupParams(
  params?: GetShiftSlotLookupParams,
) {
  return compactObject({
    search:
      params?.search?.trim(),
    facilityId:
      params?.facilityId?.trim(),
    status:
      params?.status ??
      "active",
    limit:
      params?.limit ??
      SHIFT_SLOT_API_DEFAULT_LIMIT,
  });
}

function toCreatePayload(
  input: CreateShiftSlotInput,
) {
  return {
    facilityId:
      input.facilityId.trim(),
    name:
      input.name.trim(),
    startTime:
      normalizeTime(
        input.startTime,
      ),
    endTime:
      normalizeTime(
        input.endTime,
      ),
    isOvernight:
      input.isOvernight,
    applicableDays:
      input.applicableDays &&
      input.applicableDays
        .length > 0
        ? input.applicableDays
        : undefined,
    status:
      input.status,
  };
}

function toUpdatePayload(
  input: UpdateShiftSlotInput,
) {
  return compactObject({
    facilityId:
      input.facilityId?.trim(),
    name:
      input.name?.trim(),
    startTime:
      input.startTime
        ? normalizeTime(
            input.startTime,
          )
        : undefined,
    endTime:
      input.endTime
        ? normalizeTime(
            input.endTime,
          )
        : undefined,
    isOvernight:
      input.isOvernight,
    applicableDays:
      input.applicableDays !==
      undefined
        ? input.applicableDays
        : undefined,
    status:
      input.status,
  });
}

export async function getShiftSlots(
  params?: GetShiftSlotsParams,
): Promise<ShiftSlotListResult> {
  const requestedPage =
    params?.page ??
    DEFAULT_PAGE;

  const requestedLimit =
    params?.limit ??
    SHIFT_SLOT_API_DEFAULT_LIMIT;

  const response =
    await apiClient.get(
      ENDPOINT,
      {
        params:
          toListParams(
            params,
          ),
      },
    );

  const result =
    readResponseData<
      | BackendShiftSlotPagination
      | BackendShiftSlot[]
    >(response.data);

  if (
    Array.isArray(
      result.data,
    )
  ) {
    const items =
      result.data.map(
        normalizeShiftSlot,
      );

    return {
      items,
      total:
        items.length,
      page:
        requestedPage,
      limit:
        requestedLimit,
      totalPages:
        items.length > 0
          ? 1
          : 0,
    };
  }

  const pagination =
    result.data;

  const items =
    Array.isArray(
      pagination?.items,
    )
      ? pagination.items.map(
          normalizeShiftSlot,
        )
      : [];

  const total =
    normalizeNonNegativeInteger(
      pagination?.total,
      items.length,
    );

  const page =
    normalizePositiveInteger(
      pagination?.page,
      requestedPage,
    );

  const limit =
    normalizePositiveInteger(
      pagination?.limit,
      requestedLimit,
    );

  const calculatedTotalPages =
    total === 0
      ? 0
      : Math.ceil(
          total / limit,
        );

  return {
    items,
    total,
    page,
    limit,
    totalPages:
      normalizeNonNegativeInteger(
        pagination?.totalPages,
        calculatedTotalPages,
      ),
  };
}

export async function getShiftSlotLookup(
  params?: GetShiftSlotLookupParams,
): Promise<ShiftSlotLookupItem[]> {
  const response =
    await apiClient.get(
      `${ENDPOINT}/lookup`,
      {
        params:
          toLookupParams(
            params,
          ),
      },
    );

  const result =
    readResponseData<
      BackendShiftSlotLookupItem[]
    >(response.data);

  return Array.isArray(
    result.data,
  )
    ? result.data.map(
        normalizeLookupItem,
      )
    : [];
}

export async function getShiftSlot(
  id: string,
): Promise<ShiftSlot> {
  const response =
    await apiClient.get(
      `${ENDPOINT}/${encodeURIComponent(
        id,
      )}`,
    );

  const result =
    readResponseData<
      BackendShiftSlot
    >(response.data);

  return normalizeShiftSlot(
    result.data,
  );
}

export async function createShiftSlot(
  input: CreateShiftSlotInput,
): Promise<
  ShiftSlotApiResponse<ShiftSlot>
> {
  const response =
    await apiClient.post(
      ENDPOINT,
      toCreatePayload(
        input,
      ),
    );

  const result =
    readResponseData<
      BackendShiftSlot
    >(response.data);

  return {
    success:
      result.success,
    message:
      result.message ||
      "Tạo khung ca thành công",
    data:
      normalizeShiftSlot(
        result.data,
      ),
  };
}

export async function updateShiftSlot(
  id: string,
  input: UpdateShiftSlotInput,
): Promise<
  ShiftSlotApiResponse<ShiftSlot>
> {
  const response =
    await apiClient.patch(
      `${ENDPOINT}/${encodeURIComponent(
        id,
      )}`,
      toUpdatePayload(
        input,
      ),
    );

  const result =
    readResponseData<
      BackendShiftSlot
    >(response.data);

  return {
    success:
      result.success,
    message:
      result.message ||
      "Cập nhật khung ca thành công",
    data:
      normalizeShiftSlot(
        result.data,
      ),
  };
}

/**
 * Xóa một khung ca.
 * Chức năng này được giữ nguyên theo nghiệp vụ hiện tại.
 */
export async function deleteShiftSlot(
  id: string,
): Promise<
  ShiftSlotApiResponse<null>
> {
  const response =
    await apiClient.delete(
      `${ENDPOINT}/${encodeURIComponent(
        id,
      )}`,
    );

  const result =
    readResponseData<null>(
      response.data,
    );

  return {
    success:
      result.success,
    message:
      result.message ||
      "Xóa khung ca thành công",
    data: null,
  };
}
