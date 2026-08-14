"use client";

import {
  useState,
} from "react";
import {
  App,
  Button,
  Modal,
  Typography,
} from "antd";
import {
  Trash2,
  X,
} from "lucide-react";
import {
  deleteShiftSlot,
} from "@/management/features/shift-slots/shift-slots.api";
import type {
  ShiftSlot,
  ShiftSlotFacilityOption,
} from "@/management/features/shift-slots/shift-slots.types";
import {
  getShiftSlotErrorMessage,
} from "@/management/features/shift-slots/shift-slots.utils";

const { Text } =
  Typography;

type Props = {
  open: boolean;
  slot:
    | ShiftSlot
    | null;
  facility?: ShiftSlotFacilityOption;
  onClose: () => void;
  onDeleted: (
    slotId: string,
  ) => void;
};

export function ShiftSlotDeleteModal({
  open,
  slot,
  facility,
  onClose,
  onDeleted,
}: Props) {
  const {
    message: messageApi,
  } = App.useApp();

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  function handleClose() {
    if (
      submitting
    ) {
      return;
    }

    onClose();
  }

  async function handleDelete() {
    if (!slot) {
      return;
    }

    setSubmitting(
      true,
    );

    try {
      const response =
        await deleteShiftSlot(
          slot.id,
        );

      onDeleted(
        slot.id,
      );

      onClose();

      messageApi.success(
        response.message ||
          "Xóa khung ca thành công.",
      );
    } catch (
      deleteError
    ) {
      messageApi.error(
        getShiftSlotErrorMessage(
          deleteError,
          "Không thể xóa khung ca.",
        ),
      );
    } finally {
      setSubmitting(
        false,
      );
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
      onCancel={
        handleClose
      }
      mask={{
        closable:
          !submitting,
      }}
    >
      <div className="relative px-2 pb-2 pt-3 text-center">
        <button
          type="button"
          aria-label="Đóng"
          disabled={
            submitting
          }
          onClick={
            handleClose
          }
          className="absolute right-0 top-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-7 w-7 text-red-600" />
        </div>

        <h3 className="mt-5 text-lg font-bold text-slate-950">
          Xóa khung ca?
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Bạn có chắc chắn muốn xóa
          khung ca này không?
        </p>

        {slot ? (
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-left">
            <Text
              strong
              className="block"
            >
              {slot.name}
            </Text>

            <Text
              type="secondary"
              className="mt-1 block"
            >
              {slot.startTime} -{" "}
              {slot.endTime}
            </Text>

            <Text
              type="secondary"
              className="mt-1 block"
            >
              {slot.facilityName ||
                facility?.name ||
                slot.facilityCode ||
                facility?.code ||
                `Cơ sở #${slot.facilityId}`}
            </Text>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            size="large"
            disabled={
              submitting
            }
            onClick={
              handleClose
            }
          >
            Hủy
          </Button>

          <Button
            danger
            type="primary"
            size="large"
            loading={
              submitting
            }
            onClick={() =>
              void handleDelete()
            }
          >
            Xóa khung ca
          </Button>
        </div>
      </div>
    </Modal>
  );
}
