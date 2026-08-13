import type {
  RoomStatus,
} from "./rooms.types";

export const ROOM_DEFAULT_PAGE_SIZE = 5;
export const ROOM_TYPE_DEFAULT_PAGE_SIZE = 10;

export const ROOM_STATUS_OPTIONS: Array<{
  value: RoomStatus;
  label: string;
}> = [
  {
    value: "active",
    label: "Hoạt động",
  },
  {
    value: "inactive",
    label: "Ngừng hoạt động",
  },
];
