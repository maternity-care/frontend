"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Alert,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import {
  CheckCircle2,
  Eye,
  FilePlus2,
  FileText,
  LogIn,
  RefreshCw,
  UserX,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import {
  TableFilter,
  type TableFilterColumn,
  type TableFilterValues,
} from "@/management/components/ui/TableFilter";
import {
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  getManagementAppointments,
  markNoShowAppointment,
  rescheduleAppointment,
} from "@/management/features/appointments/appointments.api";
import type {
  ManagementAppointment,
  ManagementAppointmentStatus,
} from "@/management/features/appointments/appointments.types";
import { getDoctors } from "@/management/features/doctors/doctors.api";
import type { Doctor } from "@/management/features/doctors/doctors.types";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import {
  getManagementPregnancyProfiles,
  getManagementPregnancyProfileById,
} from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.api";
import type { ManagementPregnancyProfile } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";
import { PregnancyProfileDetailModal } from "@/fe/components/records/management/PregnancyProfileDetailModal";
import { CreateMedicalRecordModal } from "@/fe/components/records/management-medical-records/CreateMedicalRecordModal";
import { getDoctorAvailability } from "@/management/features/doctor-shifts/doctor-shifts.api";
import { useAuthStore } from "@/features/auth/auth.store";

const { Text } = Typography;

const statusMeta: Record<
  ManagementAppointmentStatus,
  { label: string; color: string }
> = {
  pending_payment: { label: "Chờ thanh toán", color: "gold" },
  booked: { label: "Đã đặt", color: "blue" },
  confirmed: { label: "Đã xác nhận", color: "cyan" },
  checked_in: { label: "Đã check-in", color: "purple" },
  in_progress: { label: "Đang khám", color: "processing" },
  completed: { label: "Đã xong", color: "green" },
  rescheduled: { label: "Đã dời", color: "orange" },
  cancelled: { label: "Đã hủy", color: "red" },
  no_show: { label: "Không đến", color: "default" },
};

type CheckInFormValues = {
  pregnancyProfileId: string;
  doctorId?: string;
  confirmDoctorChange?: boolean;
};

type RescheduleFormValues = {
  doctorId: string;
  date: Dayjs;
  slot: string;
  reason?: string;
};

type AvailabilitySlot = { startTime: string; endTime: string } | string;
type DoctorAvailability = {
  shifts?: Array<{
    shiftId: string;
    availableSlots: AvailabilitySlot[];
  }>;
};

function getDoctorLabel(doctor: Doctor) {
  return `${doctor.title ? `${doctor.title} ` : ""}${doctor.name}${
    doctor.specialty ? ` - ${doctor.specialty}` : ""
  }`;
}

function formatPatient(appointment: ManagementAppointment) {
  return appointment.patientName || `User #${appointment.patientId}`;
}

export default function ManagementAppointmentsPage() {
  const authUser = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const isSuperAdmin =
    authUser?.roles?.some((role) => role.name === "super_admin") ?? false;
  const activeFacility = authUser?.facilities?.find(
    (facility) => String(facility.id) === String(activeFacilityId),
  );

  const [appointments, setAppointments] = useState<ManagementAppointment[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [status, setStatus] = useState<
    ManagementAppointmentStatus | undefined
  >();
  const [facilityId, setFacilityId] = useState<string | undefined>();
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [profileOptions, setProfileOptions] = useState<
    ManagementPregnancyProfile[]
  >([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<ManagementAppointment | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [profileDetail, setProfileDetail] =
    useState<ManagementPregnancyProfile | null>(null);
  const [creatingMedicalRecordFor, setCreatingMedicalRecordFor] =
    useState<ManagementPregnancyProfile | null>(null);
  const [medicalRecordAppointmentId, setMedicalRecordAppointmentId] =
    useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<
    Array<{
      shiftId: string;
      label: string;
      startTime: string;
      endTime: string;
    }>
  >([]);
  const [checkInForm] = Form.useForm<CheckInFormValues>();
  const [rescheduleForm] = Form.useForm<RescheduleFormValues>();
  const scopedFacilityId = isSuperAdmin
    ? facilityId
    : (activeFacilityId ?? undefined);

  const doctorOptions = useMemo(
    () =>
      doctors.map((doctor) => ({
        value: doctor.id,
        label: getDoctorLabel(doctor),
      })),
    [doctors],
  );

  const filterColumns: TableFilterColumn[] = useMemo(
    () => [
      {
        field: "search",
        label: "Tìm kiếm",
        type: "text",
        width: 280,
        contains: true,
        placeholder: "Mã lịch, user, SĐT, dịch vụ, bác sĩ...",
      },
      {
        field: "status",
        label: "Trạng thái",
        type: "select",
        width: 180,
        options: Object.entries(statusMeta).map(([value, meta]) => ({
          value,
          label: meta.label,
        })),
      },
      {
        field: "facilityId",
        label: "Cơ sở",
        type: "select",
        width: 240,
        options: facilityOptions,
        disabled: !isSuperAdmin,
      },
      {
        field: "doctorId",
        label: "Bác sĩ",
        type: "select",
        width: 260,
        options: doctorOptions,
      },
      {
        field: "dateRange",
        label: "Khoảng ngày",
        type: "dateRange",
        width: 280,
      },
    ],
    [doctorOptions, facilityOptions, isSuperAdmin],
  );

  const filterValues: TableFilterValues = {
    search: searchInput || undefined,
    status,
    facilityId: isSuperAdmin ? facilityId : (activeFacilityId ?? undefined),
    doctorId,
    dateRange: dateRange ?? undefined,
  };

  const handleFilterChange = (values: TableFilterValues) => {
    const nextSearch =
      typeof values.search === "string" ? values.search : "";

    setSearchInput(nextSearch);
    setSearch(nextSearch.trim());

    setStatus(
      values.status === undefined || values.status === null
        ? undefined
        : (String(values.status) as ManagementAppointmentStatus),
    );

    if (isSuperAdmin) {
      setFacilityId(
        values.facilityId === undefined || values.facilityId === null
          ? undefined
          : String(values.facilityId),
      );
    }

    setDoctorId(
      values.doctorId === undefined || values.doctorId === null
        ? undefined
        : String(values.doctorId),
    );

    if (Array.isArray(values.dateRange)) {
      setDateRange(values.dateRange as [Dayjs | null, Dayjs | null]);
    } else {
      setDateRange(null);
    }
  };

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(
        await getManagementAppointments({
          scope,
          status,
          search,
          facilityId: scopedFacilityId,
          doctorId,
          dateFrom: dateRange?.[0]?.format("YYYY-MM-DD"),
          dateTo: dateRange?.[1]?.format("YYYY-MM-DD"),
        }),
      );
    } catch {
      message.error("Không tải được lịch đặt khám.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, doctorId, scope, scopedFacilityId, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAppointments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAppointments]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDoctorId(undefined);
      if (!authUser || (!isSuperAdmin && !activeFacilityId)) {
        setDoctors([]);
        return;
      }
      void getDoctors({
        limit: 100,
        facilityId: isSuperAdmin
          ? facilityId
          : (activeFacilityId ?? undefined),
      })
        .then((result) => setDoctors(result.items))
        .catch(() => setDoctors([]));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeFacilityId, authUser, facilityId, isSuperAdmin]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!authUser) {
        setFacilityOptions([]);
        return;
      }
      if (!isSuperAdmin) {
        setFacilityOptions(
          activeFacility
            ? [
                {
                  value: String(activeFacility.id),
                  label: `${activeFacility.name} (${activeFacility.code})`,
                },
              ]
            : [],
        );
        return;
      }
      void getFacilities({ status: "active", limit: 100 })
        .then((facilities) =>
          setFacilityOptions(
            facilities.map((facility) => ({
              value: facility.id,
              label: `${facility.name} (${facility.code})`,
            })),
          ),
        )
        .catch(() => setFacilityOptions([]));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeFacility, authUser, isSuperAdmin]);

  const openCheckIn = async (appointment: ManagementAppointment) => {
    setSelectedAppointment(appointment);
    setCheckInOpen(true);
    checkInForm.setFieldsValue({
      pregnancyProfileId: appointment.pregnancyProfileId ?? undefined,
      doctorId: appointment.doctorId ?? undefined,
      confirmDoctorChange: false,
    });
    setLoadingProfiles(true);
    try {
      const profiles = await getManagementPregnancyProfiles({
        patientId: appointment.patientId,
        limit: 50,
      });
      setProfileOptions(profiles.items);
      if (!profiles.items.length) {
        message.warning(
          "User này chưa có hồ sơ thai kỳ. Cần tạo hồ sơ trước khi check-in.",
        );
      }
    } catch {
      message.warning("Không tải được hồ sơ thai kỳ của user.");
      setProfileOptions([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const openReschedule = (appointment: ManagementAppointment) => {
    setSelectedAppointment(appointment);
    setAvailableSlots([]);
    setRescheduleOpen(true);
    rescheduleForm.setFieldsValue({
      doctorId: appointment.doctorId ?? undefined,
      date: dayjs(appointment.date),
      slot: undefined,
      reason: "",
    });
  };

  const refreshSlots = async () => {
    const values = rescheduleForm.getFieldsValue();
    if (!selectedAppointment || !values.doctorId || !values.date) return;
    try {
      const data = (await getDoctorAvailability(values.doctorId, {
        facilityId: selectedAppointment.facilityId,
        date: values.date.format("YYYY-MM-DD"),
        slotMinutes: 30,
      })) as DoctorAvailability;
      const slots = (data.shifts ?? []).flatMap((shift) =>
        shift.availableSlots.map((slot) => {
          const startTime =
            typeof slot === "string" ? slot.split(" - ")[0] : slot.startTime;
          const endTime =
            typeof slot === "string" ? slot.split(" - ")[1] : slot.endTime;
          return {
            shiftId: shift.shiftId,
            startTime,
            endTime,
            label: `${startTime} - ${endTime}`,
          };
        }),
      );
      setAvailableSlots(slots);
    } catch {
      message.error("Không lấy được slot trống.");
    }
  };

  const handleCheckIn = async (values: CheckInFormValues) => {
    if (!selectedAppointment) return;
    if (
      values.doctorId &&
      values.doctorId !== selectedAppointment.doctorId &&
      !values.confirmDoctorChange
    ) {
      message.warning("Nếu đổi bác sĩ, bạn cần tick xác nhận đổi bác sĩ.");
      return;
    }
    try {
      await checkInAppointment(selectedAppointment.id, {
        pregnancyProfileId: values.pregnancyProfileId,
        doctorId:
          values.doctorId !== selectedAppointment.doctorId
            ? values.doctorId
            : undefined,
      });
      message.success("Check-in thành công.");
      setCheckInOpen(false);
      loadAppointments();
    } catch {
      message.error("Check-in thất bại.");
    }
  };

  const handleReschedule = async (values: RescheduleFormValues) => {
    if (!selectedAppointment) return;
    const slot = availableSlots.find((item) => item.label === values.slot);
    if (!slot) {
      message.warning("Bạn cần chọn slot trống.");
      return;
    }
    Modal.confirm({
      title: "Xác nhận dời lịch?",
      content: `Dời lịch #${selectedAppointment.id} sang ${values.date.format("DD/MM/YYYY")} ${slot.label}`,
      okText: "Dời lịch",
      cancelText: "Hủy",
      onOk: async () => {
        await rescheduleAppointment(selectedAppointment.id, {
          doctorId: values.doctorId,
          shiftId: slot.shiftId,
          date: values.date.format("YYYY-MM-DD"),
          startTime: slot.startTime,
          endTime: slot.endTime,
          reason: values.reason,
        });
        message.success("Đã dời lịch.");
        setRescheduleOpen(false);
        loadAppointments();
      },
    });
  };

  const handleCancel = (appointment: ManagementAppointment) => {
    Modal.confirm({
      title: "Hủy lịch khám?",
      content: (
        <Input.TextArea
          id="appointment-cancel-reason"
          rows={3}
          placeholder="Lý do hủy..."
        />
      ),
      okText: "Hủy lịch",
      okButtonProps: { danger: true },
      cancelText: "Đóng",
      onOk: async () => {
        const reason = (
          document.getElementById(
            "appointment-cancel-reason",
          ) as HTMLTextAreaElement | null
        )?.value;
        await cancelAppointment(appointment.id, reason);
        message.success("Đã hủy lịch.");
        loadAppointments();
      },
    });
  };

  const handleNoShow = (appointment: ManagementAppointment) => {
    Modal.confirm({
      title: "Đánh dấu user không đến?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        await markNoShowAppointment(
          appointment.id,
          "User không đến theo lịch hẹn.",
        );
        message.success("Đã đánh dấu không đến.");
        loadAppointments();
      },
    });
  };

  const handleComplete = (appointment: ManagementAppointment) => {
    Modal.confirm({
      title: "Hoàn tất lịch khám?",
      content: "Sau khi hoàn tất, lịch sẽ chuyển trạng thái đã xong.",
      okText: "Hoàn tất",
      cancelText: "Hủy",
      onOk: async () => {
        await completeAppointment(appointment.id);
        message.success("Đã hoàn tất.");
        loadAppointments();
      },
    });
  };

  const openProfileDetail = async (profileId?: string | null) => {
    if (!profileId) return;
    try {
      setProfileDetail(await getManagementPregnancyProfileById(profileId));
    } catch {
      message.error("Không tải được chi tiết hồ sơ.");
    }
  };

  const openCreateMedicalRecord = async (
    appointment: ManagementAppointment,
  ) => {
    if (!appointment.pregnancyProfileId) {
      message.warning("Lịch này chưa gắn hồ sơ thai kỳ.");
      return;
    }

    try {
      const profile = await getManagementPregnancyProfileById(
        appointment.pregnancyProfileId,
      );
      setMedicalRecordAppointmentId(appointment.id);
      setCreatingMedicalRecordFor(profile);
    } catch {
      message.error("Không tải được hồ sơ để thêm kết quả khám.");
    }
  };

  const columns: ColumnsType<ManagementAppointment> = [
    {
      title: "Lịch",
      render: (_, item) => (
        <div>
          <Text strong>
            #{item.id} · {item.startTime} - {item.endTime}
          </Text>
          <div className="text-xs text-slate-500">
            {dayjs(item.date).format("DD/MM/YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "User",
      render: (_, item) => (
        <div>
          <Text>{formatPatient(item)}</Text>
          <div className="text-xs text-slate-500">
            {item.patientPhone ||
              item.patientEmail ||
              `ID ${item.patientId}`}
          </div>
        </div>
      ),
    },
    { title: "Dịch vụ", dataIndex: "serviceName" },
    {
      title: "Bác sĩ",
      render: (_, item) =>
        `${item.doctorTitle ? `${item.doctorTitle} ` : ""}${item.doctorName ?? "—"}`,
    },
    {
      title: "HS thai kỳ",
      render: (_, item) =>
        item.pregnancyProfileId ? (
          <Button
            size="small"
            icon={<FileText className="h-3.5 w-3.5" />}
            onClick={() => openProfileDetail(item.pregnancyProfileId)}
          >
            {item.pregnancyProfileCode || `HS #${item.pregnancyProfileId}`}
          </Button>
        ) : (
          <Tag>Chưa gắn</Tag>
        ),
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
      title: "Thao tác",
      fixed: "right",
      render: (_, item) => (
        <Space wrap>
          <Button
            size="small"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => {
              setSelectedAppointment(item);
              setDetailOpen(true);
            }}
          >
            Chi tiết
          </Button>
          {item.pregnancyProfileId ? (
            <Button
              size="small"
              icon={<FilePlus2 className="h-3.5 w-3.5" />}
              onClick={() => openCreateMedicalRecord(item)}
            >
              Thêm kết quả
            </Button>
          ) : null}
          {["booked", "confirmed", "rescheduled"].includes(item.status) ? (
            <Button
              size="small"
              type="primary"
              icon={<LogIn className="h-3.5 w-3.5" />}
              onClick={() => openCheckIn(item)}
            >
              Check-in
            </Button>
          ) : null}
          {["checked_in", "in_progress"].includes(item.status) ? (
            <Button
              size="small"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={() => handleComplete(item)}
            >
              Đã xong
            </Button>
          ) : null}
          {["booked", "confirmed", "rescheduled"].includes(item.status) ? (
            <>
              <Button
                size="small"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => openReschedule(item)}
              >
                Dời
              </Button>
              <Button
                size="small"
                icon={<UserX className="h-3.5 w-3.5" />}
                onClick={() => handleNoShow(item)}
              >
                No-show
              </Button>
              <Button
                danger
                size="small"
                icon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() => handleCancel(item)}
              >
                Hủy
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  const listContent = (
    <div className="mt-4 flex flex-col gap-4">
      <TableFilter
        columns={filterColumns}
        values={filterValues}
        clearLabel="Xóa bộ lọc"
        onChange={handleFilterChange}
      />
{/* 
      <div className="flex justify-end">
        <Button loading={loading} onClick={() => void loadAppointments()}>
          Tải lại
        </Button>
      </div> */}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={appointments}
        scroll={{ x: 1200 }}
      />
    </div>
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý lịch đặt khám"
        description="Check-in, đổi bác sĩ, dời/hủy lịch và theo dõi lịch khám của bác sĩ."
      />

      <div className="mt-6">
        <Tabs
          activeKey={scope}
          onChange={(value) => setScope(value as "all" | "mine")}
          items={[
            {
              key: "all",
              label: "Tất cả",
              children: listContent,
            },
            {
              key: "mine",
              label: "Lịch của tôi",
              children: listContent,
            },
          ]}
        />
      </div>

      <Modal
        title="Chi tiết lịch đặt"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
      >
        {selectedAppointment ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã lịch">
              #{selectedAppointment.id}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {formatPatient(selectedAppointment)}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(selectedAppointment.date).format("DD/MM/YYYY")}{" "}
              {selectedAppointment.startTime} - {selectedAppointment.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              {selectedAppointment.serviceName}
            </Descriptions.Item>
            <Descriptions.Item label="Bác sĩ">
              {selectedAppointment.doctorTitle}{" "}
              {selectedAppointment.doctorName}
            </Descriptions.Item>
            <Descriptions.Item label="Cơ sở">
              {selectedAppointment.facilityName}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng">
              {selectedAppointment.roomName}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {statusMeta[selectedAppointment.status]?.label}
            </Descriptions.Item>
            <Descriptions.Item label="Hồ sơ">
              {selectedAppointment.pregnancyProfileId ? (
                <Button
                  onClick={() =>
                    openProfileDetail(selectedAppointment.pregnancyProfileId)
                  }
                >
                  Xem chi tiết HS
                </Button>
              ) : (
                "Chưa gắn hồ sơ"
              )}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>

      <Modal
        title="Check-in lịch khám"
        open={checkInOpen}
        onCancel={() => setCheckInOpen(false)}
        onOk={() => checkInForm.submit()}
        okText="Check-in"
        okButtonProps={{
          disabled: !profileOptions.length || loadingProfiles,
        }}
      >
        <Form form={checkInForm} layout="vertical" onFinish={handleCheckIn}>
          {!loadingProfiles && !profileOptions.length ? (
            <Alert
              showIcon
              type="warning"
              className="mb-4"
              title="Người dùng này chưa có hồ sơ thai kỳ"
              description="Cần tạo hồ sơ thai kỳ cho user trước, sau đó quay lại check-in và chọn hồ sơ."
              action={
                <Button size="small" href="/management/records">
                  Tạo hồ sơ
                </Button>
              }
            />
          ) : null}

          <Form.Item
            name="pregnancyProfileId"
            label="Hồ sơ thai kỳ"
            rules={[
              {
                required: true,
                message: "Chọn hồ sơ thai kỳ khi check-in",
              },
            ]}
          >
            <Select
              showSearch
              loading={loadingProfiles}
              disabled={!profileOptions.length}
              placeholder="Chọn hồ sơ của user"
              optionFilterProp="label"
              options={profileOptions.map((profile) => ({
                value: profile.id,
                label: `${profile.code || `HS #${profile.id}`} - ${profile.user?.name || ""}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="doctorId" label="Bác sĩ phụ trách">
            <Select
              showSearch
              optionFilterProp="label"
              options={doctorOptions}
            />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) =>
              getFieldValue("doctorId") &&
              getFieldValue("doctorId") !== selectedAppointment?.doctorId ? (
                <Form.Item
                  name="confirmDoctorChange"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Cần xác nhận đổi bác sĩ"),
                            ),
                    },
                  ]}
                >
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" className="mr-1" />
                    Tôi xác nhận đổi bác sĩ cho lịch này.
                  </label>
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Dời lịch khám"
        open={rescheduleOpen}
        onCancel={() => setRescheduleOpen(false)}
        onOk={() => rescheduleForm.submit()}
        okText="Dời lịch"
      >
        <Form
          form={rescheduleForm}
          layout="vertical"
          onFinish={handleReschedule}
        >
          <Form.Item name="doctorId" label="Bác sĩ" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={doctorOptions}
              onChange={() => setAvailableSlots([])}
            />
          </Form.Item>
          <Form.Item name="date" label="Ngày" rules={[{ required: true }]}>
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              onChange={() => setAvailableSlots([])}
            />
          </Form.Item>
          <Button className="mb-3" onClick={refreshSlots}>
            Lấy slot trống
          </Button>
          <Form.Item name="slot" label="Slot trống" rules={[{ required: true }]}>
            <Select
              options={availableSlots.map((slot) => ({
                value: slot.label,
                label: slot.label,
              }))}
            />
          </Form.Item>
          <Form.Item name="reason" label="Lý do dời lịch">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <PregnancyProfileDetailModal
        open={Boolean(profileDetail)}
        profile={profileDetail}
        onClose={() => setProfileDetail(null)}
        onEdit={() => undefined}
      />

      <CreateMedicalRecordModal
        open={creatingMedicalRecordFor !== null}
        profile={creatingMedicalRecordFor}
        initialAppointmentId={medicalRecordAppointmentId}
        onCancel={() => {
          setCreatingMedicalRecordFor(null);
          setMedicalRecordAppointmentId(null);
        }}
        onSuccess={() => {
          setCreatingMedicalRecordFor(null);
          setMedicalRecordAppointmentId(null);
          loadAppointments();
        }}
      />
    </AdminLayout>
  );
}