"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Modal, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { CalendarDays, CheckCircle2, ClipboardList, Eye, FilePlus2, Globe2, LogIn, PlayCircle, Radio } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { CreateMedicalRecordModal } from "@/fe/components/records/management-medical-records/CreateMedicalRecordModal";
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
import { getManagementPregnancyProfileById } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.api";
import type { ManagementPregnancyProfile } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";
import {
  getManagementMedicalRecordsByServiceItemId,
  publishManagementMedicalRecord,
} from "@/management/features/management-pregnancy-profiles/medical-records/management-medical-records.api";
import type { MedicalRecord } from "@/management/features/management-pregnancy-profiles/medical-records/management-medical-records.types";
import { useNotificationRealtime } from "@/features/notifications/useNotificationRealtime";

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

function isToday(value?: string | null) {
  return value ? dayjs(value).isSame(dayjs(), "day") : false;
}

export default function ManagementServiceIndicationsPage() {
  const [items, setItems] = useState<AppointmentServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [creatingMedicalRecordFor, setCreatingMedicalRecordFor] =
    useState<ManagementPregnancyProfile | null>(null);
  const [medicalRecordAppointmentId, setMedicalRecordAppointmentId] =
    useState<string | null>(null);
  const [medicalRecordServiceItemId, setMedicalRecordServiceItemId] =
    useState<string | null>(null);
  const [medicalRecordAppointmentLabel, setMedicalRecordAppointmentLabel] =
    useState<string | null>(null);
  const [medicalRecordDoctorLabel, setMedicalRecordDoctorLabel] =
    useState<string | null>(null);
  const [viewingResultsFor, setViewingResultsFor] = useState<AppointmentServiceItem | null>(null);
  const [viewingAppointmentFor, setViewingAppointmentFor] = useState<AppointmentServiceItem | null>(null);
  const [resultRecords, setResultRecords] = useState<MedicalRecord[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const realtimeReloadTimerRef = useRef<number | null>(null);

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

  const scheduleRealtimeReload = useCallback(() => {
    if (realtimeReloadTimerRef.current) {
      window.clearTimeout(realtimeReloadTimerRef.current);
    }
    realtimeReloadTimerRef.current = window.setTimeout(() => {
      void loadItems();
      realtimeReloadTimerRef.current = null;
    }, 250);
  }, [loadItems]);

  const handleRealtimeServiceItemNotification = useCallback(
    (notification: { referenceType: string }) => {
      if (
        notification.referenceType !== "appointment_service_item" &&
        notification.referenceType !== "appointment"
      ) {
        return;
      }
      scheduleRealtimeReload();
    },
    [scheduleRealtimeReload],
  );

  useNotificationRealtime({
    management: true,
    onNotification: handleRealtimeServiceItemNotification,
  });

  useEffect(
    () => () => {
      if (realtimeReloadTimerRef.current) {
        window.clearTimeout(realtimeReloadTimerRef.current);
      }
    },
    [],
  );

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

  const openCreateMedicalRecord = async (item: AppointmentServiceItem) => {
    if (!item.pregnancyProfileId) {
      message.warning("Lịch này chưa gắn hồ sơ thai kỳ.");
      return;
    }

    try {
      const profile = await getManagementPregnancyProfileById(item.pregnancyProfileId);
      const scheduledLabel = item.scheduledStart
        ? `${dayjs(item.scheduledStart).format("DD/MM/YYYY HH:mm")}${
            item.scheduledEnd ? ` - ${dayjs(item.scheduledEnd).format("HH:mm")}` : ""
          }`
        : "Chưa có giờ";
      const patientLabel = item.patientName || `User #${item.patientId ?? "-"}`;
      const appointmentLabel = `Lịch #${item.appointmentId} • ${patientLabel} • ${scheduledLabel} • ${
        item.serviceName || `Dịch vụ #${item.serviceId}`
      }`;
      const doctorLabel =
        [item.doctorTitle, item.doctorName].filter(Boolean).join(" ") ||
        (item.doctorStaffId ? `Bác sĩ #${item.doctorStaffId}` : "");
      setMedicalRecordAppointmentId(item.appointmentId);
      setMedicalRecordServiceItemId(item.id);
      setMedicalRecordAppointmentLabel(appointmentLabel);
      setMedicalRecordDoctorLabel(
        item.doctorSpecialty && doctorLabel
          ? `${doctorLabel} • ${item.doctorSpecialty}`
          : doctorLabel || null,
      );
      setCreatingMedicalRecordFor(profile);
    } catch {
      message.error("Không tải được hồ sơ để thêm kết quả.");
    }
  };

  const loadResultRecords = async (item: AppointmentServiceItem) => {
    setResultsLoading(true);
    try {
      setResultRecords(await getManagementMedicalRecordsByServiceItemId(item.id));
    } catch {
      message.error("Không tải được kết quả đã upload.");
      setResultRecords([]);
    } finally {
      setResultsLoading(false);
    }
  };

  const openResultsModal = async (item: AppointmentServiceItem) => {
    setViewingResultsFor(item);
    await loadResultRecords(item);
  };

  const handlePublishResult = async (record: MedicalRecord) => {
    if (!viewingResultsFor) return;
    setActionKey(`publish-result-${record.id}`);
    try {
      await publishManagementMedicalRecord(record.id);
      message.success("Đã công khai kết quả cho thai phụ.");
      await loadResultRecords(viewingResultsFor);
      await loadItems();
    } catch {
      message.error("Không công khai được kết quả. Chỉ bác sĩ được công khai kết quả lịch hôm nay.");
    } finally {
      setActionKey(null);
    }
  };

  const columns = useMemo<ColumnsType<AppointmentServiceItem>>(
    () => [
      {
        title: "Chỉ định",
        width: 320,
        render: (_, item) => (
          <div className="min-w-0">
            <Text strong className="block whitespace-normal break-words">
              {item.serviceName || `Dịch vụ #${item.serviceId}`}
            </Text>
            <div className="text-xs leading-5 text-slate-500 whitespace-normal break-words">
              Lịch #{item.appointmentId} · {formatDateTime(item.scheduledStart)}
            </div>
            <div className="text-xs leading-5 text-slate-500 whitespace-normal break-words">
              Lịch đặt: {item.bookedServiceName || `Dịch vụ #${item.bookedServiceId ?? "-"}`}
            </div>
          </div>
        ),
      },
      {
        title: "Người bệnh",
        width: 220,
        render: (_, item) => (
          <div className="min-w-0">
            <Text className="block whitespace-normal break-words">
              {item.patientName || `User #${item.patientId ?? "-"}`}
            </Text>
            <div className="text-xs text-slate-500 whitespace-normal break-words">
              {item.patientPhone || "-"}
            </div>
          </div>
        ),
      },
      {
        title: "Người chỉ định",
        width: 220,
        render: (_, item) => {
          const orderingDoctorText =
            [item.orderingDoctorTitle, item.orderingDoctorName].filter(Boolean).join(" ") ||
            (item.orderingDoctorId ? `Bác sĩ #${item.orderingDoctorId}` : "Chưa rõ");

          return (
            <div className="min-w-0">
              <Text className="block whitespace-normal break-words">{orderingDoctorText}</Text>
              {item.orderingDoctorSpecialty ? (
                <div className="text-xs text-slate-500 whitespace-normal break-words">
                  {item.orderingDoctorSpecialty}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "Phòng",
        width: 150,
        render: (_, item) => item.roomName || `Phòng #${item.roomId}`,
      },
      {
        title: "Bác sĩ thực hiện",
        width: 220,
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
            <Space wrap size={4}>
              <Tag color="green">Đã upload</Tag>
              {item.medicalRecordIsPublic ? (
                <Tag color="blue">Đã công khai</Tag>
              ) : (
                <Tag>Chưa công khai</Tag>
              )}
            </Space>
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
            <Button
              size="small"
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              onClick={() => setViewingAppointmentFor(item)}
            >
              Xem lịch hẹn
            </Button>
            <Button
              size="small"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => void openResultsModal(item)}
            >
              Xem kết quả
            </Button>
            <Button
              size="small"
              icon={<FilePlus2 className="h-3.5 w-3.5" />}
              onClick={() => void openCreateMedicalRecord(item)}
            >
              Thêm kết quả
            </Button>
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
          tableLayout="fixed"
          scroll={{ x: 1500 }}
        />
      </div>
      <Modal
        open={viewingAppointmentFor !== null}
        title={
          viewingAppointmentFor
            ? `Chi tiết lịch hẹn #${viewingAppointmentFor.appointmentId}`
            : "Chi tiết lịch hẹn"
        }
        width={860}
        footer={null}
        onCancel={() => setViewingAppointmentFor(null)}
      >
        {viewingAppointmentFor ? (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">Người bệnh</div>
                <div className="font-medium text-slate-800">
                  {viewingAppointmentFor.patientName ||
                    `User #${viewingAppointmentFor.patientId ?? "-"}`}
                </div>
                <div className="text-sm text-slate-500">
                  {[
                    viewingAppointmentFor.patientPhone,
                    viewingAppointmentFor.patientEmail,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">Thời gian</div>
                <div className="font-medium text-slate-800">
                  {formatDateTime(viewingAppointmentFor.scheduledStart)}
                  {viewingAppointmentFor.scheduledEnd
                    ? ` - ${dayjs(viewingAppointmentFor.scheduledEnd).format("HH:mm")}`
                    : ""}
                </div>
                <Tag className="mt-1">
                  {viewingAppointmentFor.appointmentStatus || "-"}
                </Tag>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">
                  Dịch vụ khách đặt
                </div>
                <div className="font-medium text-slate-800">
                  {viewingAppointmentFor.bookedServiceName ||
                    `Dịch vụ #${viewingAppointmentFor.bookedServiceId ?? "-"}`}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">Cơ sở</div>
                <div className="font-medium text-slate-800">
                  {viewingAppointmentFor.facilityName || "-"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">
                  Bác sĩ khám/chỉ định
                </div>
                <div className="font-medium text-slate-800">
                  {[viewingAppointmentFor.orderingDoctorTitle, viewingAppointmentFor.orderingDoctorName]
                    .filter(Boolean)
                    .join(" ") ||
                    (viewingAppointmentFor.orderingDoctorId
                      ? `Bác sĩ #${viewingAppointmentFor.orderingDoctorId}`
                      : "-")}
                </div>
                <div className="text-sm text-slate-500">
                  {viewingAppointmentFor.orderingDoctorSpecialty || ""}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">Hồ sơ thai kỳ</div>
                <div className="font-medium text-slate-800">
                  {viewingAppointmentFor.pregnancyProfileId
                    ? `#${viewingAppointmentFor.pregnancyProfileId}`
                    : "Chưa gắn"}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">
                Chỉ định đang xem
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Dịch vụ chỉ định</div>
                  <div className="font-medium text-slate-800">
                    {viewingAppointmentFor.serviceName ||
                      `Dịch vụ #${viewingAppointmentFor.serviceId}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Bác sĩ thực hiện</div>
                  <div className="font-medium text-slate-800">
                    {[viewingAppointmentFor.doctorTitle, viewingAppointmentFor.doctorName]
                      .filter(Boolean)
                      .join(" ") ||
                      (viewingAppointmentFor.doctorStaffId
                        ? `Bác sĩ #${viewingAppointmentFor.doctorStaffId}`
                        : "-")}
                  </div>
                  <div className="text-sm text-slate-500">
                    {viewingAppointmentFor.doctorSpecialty || ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Phòng thực hiện</div>
                  <div className="font-medium text-slate-800">
                    {viewingAppointmentFor.roomName ||
                      `Phòng #${viewingAppointmentFor.roomId}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Ghi chú</div>
                  <div className="whitespace-pre-wrap text-slate-800">
                    {viewingAppointmentFor.note || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={viewingResultsFor !== null}
        title={
          viewingResultsFor
            ? `Kết quả chỉ định - ${viewingResultsFor.serviceName || `Dịch vụ #${viewingResultsFor.serviceId}`}`
            : "Kết quả chỉ định"
        }
        width={980}
        footer={null}
        onCancel={() => {
          setViewingResultsFor(null);
          setResultRecords([]);
        }}
      >
        <div className="mb-4 text-sm text-slate-500">
          {viewingResultsFor ? (
            <>
              Lịch #{viewingResultsFor.appointmentId} ·{" "}
              {viewingResultsFor.patientName || `User #${viewingResultsFor.patientId ?? "-"}`} ·{" "}
              {formatDateTime(viewingResultsFor.scheduledStart)}
            </>
          ) : null}
        </div>
        {resultsLoading ? (
          <div className="py-10 text-center text-slate-500">Đang tải kết quả...</div>
        ) : resultRecords.length === 0 ? (
          <Empty description="Chưa có kết quả đã upload" />
        ) : (
          <div className="space-y-4">
            {resultRecords.map((record, index) => (
              <div key={record.id} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Text strong>Kết quả #{resultRecords.length - index}</Text>
                    <div className="text-xs text-slate-500">
                      Upload: {formatDateTime(record.createdAt)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Bác sĩ: {record.doctor?.name || (record.doctorId ? `#${record.doctorId}` : "-")}
                    </div>
                  </div>
                  <Space wrap>
                    <Tag color="green">Đã upload</Tag>
                    {record.isPublic ? (
                      <Tag color="blue">Đã công khai</Tag>
                    ) : (
                      <Tag>Chưa công khai</Tag>
                    )}
                    {!record.isPublic && viewingResultsFor && isToday(viewingResultsFor.scheduledStart) ? (
                      <Button
                        size="small"
                        icon={<Globe2 className="h-3.5 w-3.5" />}
                        loading={actionKey === `publish-result-${record.id}`}
                        onClick={() => void handlePublishResult(record)}
                      >
                        Công khai cho thai phụ
                      </Button>
                    ) : null}
                  </Space>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">Chẩn đoán</div>
                    <div className="whitespace-pre-wrap text-sm text-slate-700">
                      {record.diagnosis || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">Kết luận</div>
                    <div className="whitespace-pre-wrap text-sm text-slate-700">
                      {record.conclusion || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">Khuyến nghị</div>
                    <div className="whitespace-pre-wrap text-sm text-slate-700">
                      {record.recommendation || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-400">Tái khám</div>
                    <div className="text-sm text-slate-700">
                      {formatDateTime(record.nextAppointmentSuggestedAt)}
                    </div>
                  </div>
                </div>
                {record.files.length > 0 ? (
                  <div className="mt-3">
                    <div className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      Tài liệu đính kèm
                    </div>
                    <Space wrap>
                      {record.files.map((file) => (
                        <Button key={file.id} size="small" href={file.fileUrl} target="_blank">
                          {file.fileName}
                        </Button>
                      ))}
                    </Space>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Modal>
      <CreateMedicalRecordModal
        open={creatingMedicalRecordFor !== null}
        profile={creatingMedicalRecordFor}
        initialAppointmentId={medicalRecordAppointmentId}
        initialAppointmentServiceItemId={medicalRecordServiceItemId}
        initialAppointmentLabel={medicalRecordAppointmentLabel}
        initialDoctorLabel={medicalRecordDoctorLabel}
        onCancel={() => {
          setCreatingMedicalRecordFor(null);
          setMedicalRecordAppointmentId(null);
          setMedicalRecordServiceItemId(null);
          setMedicalRecordAppointmentLabel(null);
          setMedicalRecordDoctorLabel(null);
        }}
        onSuccess={() => {
          setCreatingMedicalRecordFor(null);
          setMedicalRecordAppointmentId(null);
          setMedicalRecordServiceItemId(null);
          setMedicalRecordAppointmentLabel(null);
          setMedicalRecordDoctorLabel(null);
          void loadItems();
        }}
      />
    </AdminLayout>
  );
}
