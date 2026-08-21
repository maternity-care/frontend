"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { CheckCircle2, ClipboardList, LogIn, PlayCircle, Radio } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import {
  callAppointmentServiceItem,
  checkInAppointmentServiceItem,
  completeAppointmentServiceItem,
  getMySpecialistServiceItems,
  startAppointmentServiceItem,
} from "@/management/features/appointments/appointments.api";
import type {
  AppointmentServiceItem,
  AppointmentServiceItemStatus,
} from "@/management/features/appointments/appointments.types";

const { Text } = Typography;

const statusMeta: Record<AppointmentServiceItemStatus, { label: string; color: string }> = {
  ordered: { label: "Đã chỉ định", color: "blue" },
  checked_in: { label: "Đã check-in", color: "purple" },
  waiting: { label: "Đang chờ", color: "gold" },
  called: { label: "Đã gọi", color: "cyan" },
  in_progress: { label: "Đang làm", color: "processing" },
  waiting_result: { label: "Chờ kết quả", color: "orange" },
  result_uploaded: { label: "Đã có KQ", color: "green" },
  completed: { label: "Hoàn tất", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

function formatDateTime(value?: string | null) {
  return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-";
}

export default function ManagementServiceIndicationsPage() {
  const [items, setItems] = useState<AppointmentServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getMySpecialistServiceItems());
    } catch {
      message.error("Không tải được danh sách chỉ định.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const runAction = async (
    item: AppointmentServiceItem,
    action: () => Promise<AppointmentServiceItem>,
    successMessage: string,
  ) => {
    const key = `${item.id}-${successMessage}`;
    setActionKey(key);
    try {
      await action();
      message.success(successMessage);
      await loadItems();
    } catch {
      message.error("Thao tác chỉ định thất bại.");
    } finally {
      setActionKey(null);
    }
  };

  const columns = useMemo<ColumnsType<AppointmentServiceItem>>(
    () => [
      {
        title: "Chỉ định",
        render: (_, item) => (
          <div className="min-w-[220px]">
            <Text strong>{item.serviceName || `Dịch vụ #${item.serviceId}`}</Text>
            <div className="text-xs text-slate-500">
              Lịch #{item.appointmentId} · {formatDateTime(item.scheduledStart)}
            </div>
          </div>
        ),
      },
      {
        title: "Người bệnh",
        render: (_, item) => (
          <div>
            <Text>{item.patientName || `User #${item.patientId ?? "-"}`}</Text>
            <div className="text-xs text-slate-500">{item.patientPhone || "-"}</div>
          </div>
        ),
      },
      {
        title: "Phòng",
        render: (_, item) => item.roomName || `Phòng #${item.roomId}`,
      },
      {
        title: "Bác sĩ thực hiện",
        render: (_, item) => {
          const assignedDoctorText =
            [item.doctorTitle, item.doctorName].filter(Boolean).join(" ") ||
            (item.doctorStaffId ? `Bác sĩ #${item.doctorStaffId}` : "Chưa gán");

          return (
            <div>
              <Text>{assignedDoctorText}</Text>
              {item.doctorSpecialty ? (
                <div className="text-xs text-slate-500">{item.doctorSpecialty}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "Trạng thái",
        render: (_, item) => (
          <Tag color={statusMeta[item.status]?.color}>
            {statusMeta[item.status]?.label ?? item.status}
          </Tag>
        ),
      },
      {
        title: "Kết quả",
        render: (_, item) =>
          item.medicalRecordId ? (
            <Tag color="green">Đã upload</Tag>
          ) : item.resultExpectedAt ? (
            <Tag color="orange">Hẹn {formatDateTime(item.resultExpectedAt)}</Tag>
          ) : (
            <Tag>Chưa có</Tag>
          ),
      },
      {
        title: "Thao tác",
        fixed: "right",
        render: (_, item) => (
          <Space wrap>
            {item.status === "ordered" ? (
              <Button
                size="small"
                type="primary"
                icon={<LogIn className="h-3.5 w-3.5" />}
                loading={actionKey === `${item.id}-Đã check-in chỉ định.`}
                onClick={() =>
                  runAction(
                    item,
                    () => checkInAppointmentServiceItem(item.appointmentId, item.id),
                    "Đã check-in chỉ định.",
                  )
                }
              >
                Check-in
              </Button>
            ) : null}
            {item.status === "waiting" ? (
              <Button
                size="small"
                icon={<Radio className="h-3.5 w-3.5" />}
                loading={actionKey === `${item.id}-Đã gọi vào phòng.`}
                onClick={() =>
                  runAction(
                    item,
                    () => callAppointmentServiceItem(item.appointmentId, item.id),
                    "Đã gọi vào phòng.",
                  )
                }
              >
                Gọi
              </Button>
            ) : null}
            {item.status === "called" ? (
              <Button
                size="small"
                icon={<PlayCircle className="h-3.5 w-3.5" />}
                loading={actionKey === `${item.id}-Đã bắt đầu dịch vụ.`}
                onClick={() =>
                  runAction(
                    item,
                    () => startAppointmentServiceItem(item.appointmentId, item.id),
                    "Đã bắt đầu dịch vụ.",
                  )
                }
              >
                Bắt đầu
              </Button>
            ) : null}
            {item.status === "in_progress" ? (
              <Button
                size="small"
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                loading={actionKey === `${item.id}-Đã hoàn tất dịch vụ.`}
                onClick={() =>
                  runAction(
                    item,
                    () => completeAppointmentServiceItem(item.appointmentId, item.id),
                    "Đã hoàn tất dịch vụ.",
                  )
                }
              >
                Xong
              </Button>
            ) : null}
          </Space>
        ),
      },
    ],
    [actionKey, loadItems],
  );

  return (
    <AdminLayout roles={["doctor"]}>
      <PageHeader
        title="Chỉ định dịch vụ"
        description="Danh sách chỉ định thuộc chuyên khoa của bác sĩ đang đăng nhập."
      />

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ClipboardList className="h-4 w-4" />
            Chỉ định cần thực hiện
          </div>
          <Button loading={loading} onClick={() => void loadItems()}>
            Tải lại
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 1000 }}
        />
      </div>
    </AdminLayout>
  );
}
