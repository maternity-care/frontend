"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Modal,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  Building2,
  DoorOpen,
  Search,
} from "lucide-react";
import {
  getRoomLookup,
} from "@/management/features/rooms/rooms.api";
import type {
  RoomLookupItem,
  RoomStatus,
} from "@/management/features/rooms/rooms.types";
import type {
  FacilityOption,
} from "./room-form.shared";

const { Text } = Typography;

type RoomQuickLookupModalProps = {
  open: boolean;
  facilities: FacilityOption[];
  defaultFacilityId?: string;
  onClose: () => void;
  onSelectRoom: (
    roomId: string,
  ) => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Không tải được danh sách gợi ý phòng.";
}

export function RoomQuickLookupModal({
  open,
  facilities,
  defaultFacilityId,
  onClose,
  onSelectRoom,
}: RoomQuickLookupModalProps) {
  const [searchInput, setSearchInput] =
    useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");
  const [facilityId, setFacilityId] =
    useState<string | undefined>(
      defaultFacilityId,
    );
  const [status, setStatus] =
    useState<RoomStatus | undefined>(
      "active",
    );
  const [items, setItems] = useState<
    RoomLookupItem[]
  >([]);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);

  const facilityById = useMemo(
    () =>
      new Map(
        facilities.map((facility) => [
          facility.id,
          facility,
        ]),
      ),
    [facilities],
  );

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setDebouncedSearch(
        searchInput.trim(),
      );
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, searchInput]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void getRoomLookup({
        search:
          debouncedSearch || undefined,
        facilityId,
        status,
        limit: 30,
      })
        .then((data) => {
          if (!cancelled) {
            setItems(data);
          }
        })
        .catch((loadError) => {
          if (!cancelled) {
            setError(
              getErrorMessage(loadError),
            );
            setItems([]);
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
    debouncedSearch,
    facilityId,
    open,
    status,
  ]);

  function handleClose() {
    setSearchInput("");
    setDebouncedSearch("");
    setFacilityId(
      defaultFacilityId,
    );
    setStatus("active");
    setItems([]);
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      centered
      width={760}
      title="Tìm nhanh phòng"
      footer={null}
      onCancel={handleClose}
      mask={{
        closable: !loading,
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          allowClear
          value={searchInput}
          prefix={
            <Search className="h-4 w-4 text-slate-400" />
          }
          placeholder="Tên phòng, loại phòng..."
          onChange={(event) =>
            setSearchInput(
              event.target.value,
            )
          }
        />

        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          value={facilityId}
          placeholder="Tất cả cơ sở"
          options={facilities.map(
            (facility) => ({
              value: facility.id,
              label: facility.name,
            }),
          )}
          onChange={setFacilityId}
        />

        <Select
          allowClear
          value={status}
          placeholder="Tất cả trạng thái"
          options={[
            {
              value: "active",
              label: "Hoạt động",
            },
            {
              value: "inactive",
              label: "Ngừng hoạt động",
            },
          ]}
          onChange={setStatus}
        />
      </div>

      {error ? (
        <Alert
          type="error"
          title={error}
          showIcon
          className="mt-4"
        />
      ) : null}

      <div className="mt-4 max-h-[440px] overflow-y-auto rounded-xl border border-slate-200">
        <Spin spinning={loading}>
          {items.length === 0 && !loading ? (
            <div className="flex min-h-[220px] items-center justify-center px-4 py-8">
              <Empty
                image={
                  Empty.PRESENTED_IMAGE_SIMPLE
                }
                description="Không có phòng phù hợp."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {items.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  onClick={() => {
                    onSelectRoom(room.id);
                    handleClose();
                  }}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <DoorOpen className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                      <Text
                        strong
                        className="block truncate"
                      >
                        {room.name}
                      </Text>

                      <Text
                        type="secondary"
                        className="block truncate text-xs"
                      >
                        {room.roomTypeName} ·{" "}
                        {room.floor}
                      </Text>

                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Building2 className="h-3.5 w-3.5" />

                        <span className="truncate">
                          {room.facilityName ||
                            facilityById.get(
                              room.facilityId,
                            )?.name ||
                            room.facilityId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {room.status === "active" ? (
                    <Tag color="green">
                      Hoạt động
                    </Tag>
                  ) : (
                    <Tag>
                      Ngừng hoạt động
                    </Tag>
                  )}
                </button>
              ))}
            </div>
          )}
        </Spin>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
}