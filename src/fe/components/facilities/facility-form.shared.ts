import type {
  DayOfWeek,
  Facility,
  FacilityOperatingHoursImpactedShiftSlot,
  FacilityOperatingHoursPreview,
  FacilityScheduleInput,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import {
  DEFAULT_FACILITY_SCHEDULES,
  FACILITY_DAY_OPTIONS,
} from "@/management/features/facilities/facilities.constants";

const VALID_DAYS = new Set<DayOfWeek>(
  FACILITY_DAY_OPTIONS.map((option) => option.value),
);

const DAY_LABELS = Object.fromEntries(
  FACILITY_DAY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<DayOfWeek, string>;

export type FacilityMapLocation = {
  coordinates: string;
  embedUrl: string;
  externalUrl: string;
};

type ReverseGeocodeAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  residential?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  ward?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  state?: string;
  province?: string;
};

type ReverseGeocodeResponse = {
  display_name?: string;
  address?: ReverseGeocodeAddress;
};

export function getFacilityErrorMessage(
  error: unknown,
  fallback = "Có lỗi xảy ra khi xử lý cơ sở.",
) {
  if (!(error instanceof Error)) return fallback;

  if (error.message.includes("Facility code already exists")) {
    return "Mã cơ sở đã tồn tại.";
  }

  if (error.message.includes("Validation failed")) {
    return "Dữ liệu cơ sở không hợp lệ.";
  }

  return error.message || fallback;
}

export function getFacilityStatusText(status: FacilityStatus) {
  return status === "active" ? "Hoạt động" : "Tạm ngưng";
}

export function formatFacilityDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function isDayOfWeek(value: unknown): value is DayOfWeek {
  return typeof value === "string" && VALID_DAYS.has(value as DayOfWeek);
}

export function normalizeScheduleValue(
  value: unknown,
): FacilityScheduleInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => ({
      days: Array.isArray(item.days) ? item.days.filter(isDayOfWeek) : [],
      isClosed: Boolean(item.isClosed),
      openTime:
        typeof item.openTime === "string"
          ? item.openTime.slice(0, 5)
          : undefined,
      closeTime:
        typeof item.closeTime === "string"
          ? item.closeTime.slice(0, 5)
          : undefined,
    }));
}

export function validateFacilitySchedules(value?: unknown) {
  const schedules = normalizeScheduleValue(value);

  if (!schedules.length) {
    return Promise.reject(new Error("Vui lòng thiết lập giờ hoạt động."));
  }

  const selectedDays = schedules.flatMap((schedule) => schedule.days);

  if (!selectedDays.length) {
    return Promise.reject(new Error("Vui lòng chọn ít nhất một ngày."));
  }

  if (new Set(selectedDays).size !== selectedDays.length) {
    return Promise.reject(
      new Error("Một ngày chỉ được xuất hiện trong một nhóm lịch."),
    );
  }

  for (const schedule of schedules) {
    if (!schedule.days.length) {
      return Promise.reject(
        new Error("Mỗi nhóm lịch phải có ít nhất một ngày."),
      );
    }

    if (schedule.isClosed) continue;

    if (!schedule.openTime || !schedule.closeTime) {
      return Promise.reject(
        new Error("Nhóm ngày mở cửa phải có giờ mở và giờ đóng."),
      );
    }

    if (schedule.openTime >= schedule.closeTime) {
      return Promise.reject(
        new Error("Giờ đóng cửa phải lớn hơn giờ mở cửa."),
      );
    }
  }

  return Promise.resolve();
}

export function getFacilitySchedules(
  facility: Facility,
): FacilityScheduleInput[] {
  if (facility.operatingHourGroups.length) {
    return facility.operatingHourGroups.map((group) => ({
      days: group.days,
      isClosed: group.isClosed,
      openTime: group.openTime?.slice(0, 5) ?? undefined,
      closeTime: group.closeTime?.slice(0, 5) ?? undefined,
    }));
  }

  if (facility.operatingHours.length) {
    return facility.operatingHours.map((hour) => ({
      days: [hour.dayOfWeek],
      isClosed: hour.isClosed,
      openTime: hour.openTime?.slice(0, 5) ?? undefined,
      closeTime: hour.closeTime?.slice(0, 5) ?? undefined,
    }));
  }

  return DEFAULT_FACILITY_SCHEDULES;
}

export function getScheduleSummary(schedules?: FacilityScheduleInput[]) {
  if (!schedules?.length) return "Chưa thiết lập";

  return schedules
    .map((schedule) => {
      const days =
        schedule.days.map((day) => DAY_LABELS[day]).join(", ") ||
        "Chưa chọn ngày";
      const time = schedule.isClosed
        ? "Đóng cửa"
        : `${schedule.openTime || "--:--"} - ${schedule.closeTime || "--:--"}`;

      return `${days}: ${time}`;
    })
    .join("; ");
}

export function getOperatingHoursImpactCounts(
  preview: FacilityOperatingHoursPreview,
) {
  return {
    impactedShiftCount:
      preview.summary?.impactedShiftCount ?? preview.impactedShifts?.length ?? 0,
    impactedShiftSlotCount:
      preview.summary?.impactedShiftSlotCount ??
      preview.impactedShiftSlots?.length ??
      0,
  };
}

export function getShiftSlotImpactLabel(
  slot: FacilityOperatingHoursImpactedShiftSlot,
) {
  const time = `${slot.startTime?.slice(0, 5)} - ${slot.endTime?.slice(0, 5)}`;
  return `${slot.code || slot.id} - ${slot.name || "Khung ca"} (${time})`;
}

export function getGoogleMapLocation(
  latitudeValue?: string,
  longitudeValue?: string,
): FacilityMapLocation | null {
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  const valid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!valid) return null;

  const coordinates = `${latitude},${longitude}`;
  const encodedCoordinates = encodeURIComponent(coordinates);

  return {
    coordinates,
    embedUrl:
      `https://www.google.com/maps?q=${encodedCoordinates}` +
      "&hl=vi&z=16&output=embed",
    externalUrl:
      "https://www.google.com/maps/search/" +
      `?api=1&query=${encodedCoordinates}`,
  };
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return (
    values.find(
      (value) => typeof value === "string" && value.trim().length > 0,
    )?.trim() ?? ""
  );
}

export function extractGeocodeFields(result: ReverseGeocodeResponse) {
  const address = result.address ?? {};
  const streetName = firstNonEmpty(
    address.road,
    address.pedestrian,
    address.residential,
  );

  return {
    streetAddress: [address.house_number, streetName]
      .filter(Boolean)
      .join(" ")
      .trim(),
    ward: firstNonEmpty(
      address.ward,
      address.suburb,
      address.quarter,
      address.neighbourhood,
      address.village,
      address.town,
    ),
    city: firstNonEmpty(
      address.city,
      address.municipality,
      address.state,
      address.province,
    ),
  };
}

export function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResponse> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    "accept-language": "vi",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error("Không thể tra cứu địa chỉ từ tọa độ hiện tại.");
  }

  return (await response.json()) as ReverseGeocodeResponse;
}

export function getLocationErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = Number((error as { code?: unknown }).code);

    if (code === 1) {
      return "Bạn chưa cấp quyền truy cập vị trí cho trình duyệt.";
    }

    if (code === 2) {
      return "Không thể xác định vị trí hiện tại.";
    }

    if (code === 3) {
      return "Yêu cầu lấy vị trí đã hết thời gian chờ.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Không thể lấy vị trí hiện tại.";
}

export function toIsoDateTime(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
