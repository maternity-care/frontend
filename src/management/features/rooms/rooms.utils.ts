import type {
  ClinicRoom,
  RoomStatus,
} from "./rooms.types";

export function getRoomErrorMessage(
  error: unknown,
  fallback = "Đã có lỗi xảy ra.",
) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            errors?: {
              fields?: string[];
            };
          };
        };
      }
    ).response;

    const fields =
      response?.data?.errors?.fields;

    if (
      Array.isArray(fields) &&
      fields.length
    ) {
      return fields.join(", ");
    }

    const message =
      response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  return error instanceof Error
    ? error.message
    : fallback;
}

export function isEmptyRoomResult(
  error: unknown,
) {
  if (
    !error ||
    typeof error !== "object" ||
    !("response" in error)
  ) {
    return false;
  }

  const response = (
    error as {
      response?: {
        status?: number;
        data?: {
          message?: string | string[];
        };
      };
    }
  ).response;

  const messages = Array.isArray(
    response?.data?.message,
  )
    ? response.data.message
    : [response?.data?.message];

  const normalized = messages
    .filter(
      (message): message is string =>
        typeof message === "string",
    )
    .join(" ")
    .trim()
    .toLowerCase();

  return (
    response?.status === 404 ||
    normalized.includes(
      "không tìm thấy phòng",
    ) ||
    normalized.includes(
      "không có phòng",
    ) ||
    normalized.includes(
      "no rooms found",
    ) ||
    normalized.includes(
      "room not found",
    )
  );
}

export function getRoomStatusLabel(
  status: RoomStatus,
) {
  return status === "active"
    ? "Hoạt động"
    : "Ngừng hoạt động";
}

export function formatRoomDateTime(
  value?: string,
) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
}

export function toRoomIsoDateTime(
  value?: string,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date.toISOString();
}

export function getRoomFacilityAddress(
  room: ClinicRoom,
) {
  return [
    room.facilityAddress,
    room.facilityWard,
    room.facilityProvince,
  ]
    .filter(Boolean)
    .join(", ");
}

export function mergeRoomFallback(
  room: ClinicRoom,
  values: {
    roomName: string;
    roomTypeId: string;
    roomTypeName?: string;
    roomTypeCode?: string;
    roomTypeDescription?: string;
    roomTypeStatus?: RoomStatus;
    floor: string;
    status: RoomStatus;
  },
): ClinicRoom {
  return {
    ...room,
    roomName:
      values.roomName.trim(),
    roomTypeId:
      values.roomTypeId,
    roomTypeName:
      values.roomTypeName ??
      room.roomTypeName,
    roomTypeCode:
      values.roomTypeCode ??
      room.roomTypeCode,
    roomTypeDescription:
      values.roomTypeDescription ??
      room.roomTypeDescription,
    roomTypeStatus:
      values.roomTypeStatus ??
      room.roomTypeStatus,
    floor:
      values.floor.trim(),
    status: values.status,
  };
}
