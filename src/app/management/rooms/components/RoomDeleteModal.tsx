"use client";

import { useState } from "react";
import {
  App,
  Button,
  Input,
  Modal,
} from "antd";
import {
  Trash2,
  X,
} from "lucide-react";
import {
  deleteRoom,
  deleteRooms,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
} from "@/management/features/rooms/rooms.types";

const { TextArea } = Input;

export type RoomDeleteTarget =
  | {
      mode: "single";
      room: ClinicRoom;
    }
  | {
      mode: "selected";
      ids: string[];
      count: number;
    };

type RoomDeleteModalProps = {
  open: boolean;
  target: RoomDeleteTarget | null;
  onClose: () => void;
  onDeleted: (
    deletedIds: string[],
  ) => void;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const message = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
          };
        };
      }
    ).response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xóa phòng.";
}

export function RoomDeleteModal({
  open,
  target,
  onClose,
  onDeleted,
}: RoomDeleteModalProps) {
  const { message: messageApi } =
    App.useApp();
  const [reason, setReason] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);

  function handleClose() {
    if (submitting) return;

    setReason("");
    onClose();
  }

  async function handleDelete() {
    if (!target) return;

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      messageApi.warning(
        "Vui lòng nhập lý do xóa phòng.",
      );
      return;
    }

    setSubmitting(true);

    try {
      let deletedIds: string[];

      if (target.mode === "single") {
        await deleteRoom(
          target.room.id,
          trimmedReason,
        );
        deletedIds = [target.room.id];
      } else {
        await deleteRooms(
          target.ids,
          trimmedReason,
        );
        deletedIds = target.ids;
      }

      onDeleted(deletedIds);
      setReason("");
      onClose();

      messageApi.success(
        deletedIds.length > 1
          ? `Đã xóa ${deletedIds.length} phòng.`
          : "Xóa phòng thành công.",
      );
    } catch (error) {
      messageApi.error(
        getErrorMessage(error),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      centered
      width={480}
      title={null}
      footer={null}
      closable={false}
      onCancel={handleClose}
      mask={{
        closable: !submitting,
      }}
      className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <div className="relative px-6 pb-6 pt-7 text-center">
        <button
          type="button"
          aria-label="Đóng"
          onClick={handleClose}
          disabled={submitting}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-7 w-7 text-red-600" />
        </div>

        <h3 className="mt-5 text-lg font-bold text-slate-950">
          {target?.mode === "selected"
            ? "Xóa các phòng đã chọn?"
            : "Xóa phòng?"}
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          {target?.mode === "selected"
            ? `Bạn đang xóa ${target.count} phòng.`
            : "Phòng bị xóa sẽ không còn xuất hiện trong danh sách hoạt động."}
        </p>

        {target?.mode === "single" ? (
          <p className="mx-auto mt-2 max-w-[360px] truncate text-sm font-semibold text-slate-800">
            {target.room.roomName} -{" "}
            {target.room.roomTypeName}
          </p>
        ) : null}

        <div className="mt-5 text-left">
          <label
            htmlFor="room-delete-reason"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Lý do xóa
          </label>

          <TextArea
            id="room-delete-reason"
            value={reason}
            rows={3}
            maxLength={500}
            showCount
            disabled={submitting}
            placeholder="Nhập lý do xóa phòng..."
            onChange={(event) =>
              setReason(event.target.value)
            }
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            size="large"
            onClick={handleClose}
            disabled={submitting}
            className="h-11 rounded-lg font-semibold"
          >
            Hủy
          </Button>

          <Button
            danger
            type="primary"
            size="large"
            loading={submitting}
            disabled={!reason.trim()}
            onClick={() =>
              void handleDelete()
            }
            className="h-11 rounded-lg font-semibold"
          >
            Xóa phòng
          </Button>
        </div>
      </div>
    </Modal>
  );
}