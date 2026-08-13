"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Alert,
  Button,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  Building2,
  DoorOpen,
  MapPin,
  Pencil,
  Shapes,
  X,
} from "lucide-react";
import {
  getRoomById,
} from "@/management/features/rooms/rooms.api";
import type {
  ClinicRoom,
} from "@/management/features/rooms/rooms.types";
import {
  formatRoomDateTime,
  getRoomFacilityAddress,
} from "@/management/features/rooms/rooms.utils";

const { Text, Title } = Typography;

type RoomDetailModalProps = {
  open: boolean;
  roomId: string | null;
  initialRoom?: ClinicRoom | null;
  canManage: boolean;
  allowedFacilityId?: string;
  onClose: () => void;
  onEdit: (
    room: ClinicRoom,
  ) => void;
};

export function RoomDetailModal({
  open,
  roomId,
  initialRoom = null,
  canManage,
  allowedFacilityId,
  onClose,
  onEdit,
}: RoomDetailModalProps) {
  const [room, setRoom] =
    useState<ClinicRoom | null>(
      initialRoom,
    );
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!open || !roomId) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setRoom(initialRoom);
      setError(null);
      setLoading(true);

      void getRoomById(roomId)
        .then((data) => {
          if (cancelled) return;

          if (
            allowedFacilityId &&
            String(
              data.facilityId,
            ) !==
              allowedFacilityId
          ) {
            setRoom(null);
            setError(
              "Bạn không có quyền xem phòng của cơ sở này.",
            );
            return;
          }

          setRoom(data);
        })
        .catch((loadError) => {
          if (!cancelled) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Không tải được chi tiết phòng.",
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    allowedFacilityId,
    initialRoom,
    open,
    roomId,
  ]);

  return (
    <Modal
      open={open}
      centered
      width={820}
      title={null}
      footer={null}
      onCancel={onClose}
      mask={{
        closable: !loading,
      }}
    >
      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          className="mb-4"
        />
      ) : null}

      {room ? (
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 pr-10 sm:flex-row sm:items-start sm:pr-12">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <DoorOpen className="h-6 w-6" />
              </span>

              <div className="min-w-0">
                <Title
                  level={3}
                  className="!mb-1 truncate !text-slate-950"
                >
                  {room.roomName}
                </Title>

                <Space size={8} wrap>
                  <Tag color="blue">
                    {room.roomTypeName}
                  </Tag>

                  {room.status === "active" ? (
                    <Tag color="green">
                      Hoạt động
                    </Tag>
                  ) : (
                    <Tag>
                      Ngừng hoạt động
                    </Tag>
                  )}
                </Space>
              </div>
            </div>

            {canManage ? (
              <Space size={8} wrap>
                <Button
                  icon={
                    <Pencil className="h-4 w-4" />
                  }
                  onClick={() =>
                    onEdit(room)
                  }
                >
                  Cập nhật
                </Button>

              </Space>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Mã phòng
              </p>

              <p className="mb-0 font-semibold text-slate-950">
                {room.code || room.id}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Tầng
              </p>

              <p className="mb-0 font-semibold text-slate-950">
                {room.floor ||
                  "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Shapes className="h-5 w-5 text-slate-500" />

                <p className="mb-0 font-semibold text-slate-950">
                  Loại phòng
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Text
                    type="secondary"
                    className="block text-xs"
                  >
                    Tên loại phòng
                  </Text>

                  <Text strong>
                    {room.roomTypeName}
                  </Text>
                </div>

                <div>
                  <Text
                    type="secondary"
                    className="block text-xs"
                  >
                    Mã loại phòng
                  </Text>

                  <Text>
                    {room.roomTypeCode ||
                      room.roomTypeId}
                  </Text>
                </div>

                <div>
                  <Text
                    type="secondary"
                    className="block text-xs"
                  >
                    Mô tả
                  </Text>

                  <Text>
                    {room.roomTypeDescription ||
                      "Chưa cập nhật"}
                  </Text>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-500" />

                <p className="mb-0 font-semibold text-slate-950">
                  Cơ sở
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Text
                    type="secondary"
                    className="block text-xs"
                  >
                    Tên cơ sở
                  </Text>

                  <Text strong>
                    {room.facilityName ||
                      "Chưa cập nhật"}
                  </Text>
                </div>

                <div>
                  <Text
                    type="secondary"
                    className="block text-xs"
                  >
                    Mã cơ sở
                  </Text>

                  <Text>
                    {room.facilityCode ||
                      room.facilityId}
                  </Text>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <Text>
                    {getRoomFacilityAddress(room) ||
                      "Chưa cập nhật địa chỉ"}
                  </Text>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Ngày tạo
              </p>

              <p className="mb-0 text-sm font-medium text-slate-800">
                {formatRoomDateTime(
                  room.createdAt,
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Cập nhật lần cuối
              </p>

              <p className="mb-0 text-sm font-medium text-slate-800">
                {formatRoomDateTime(
                  room.updatedAt,
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="primary"
              icon={
                <X className="h-4 w-4" />
              }
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}