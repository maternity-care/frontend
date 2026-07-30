"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
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
import { CalendarClock, CheckCircle2, Eye, FileText, LogIn, RefreshCw, Search, UserX, XCircle } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
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
import { getManagementPregnancyProfiles, getManagementPregnancyProfileById } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.api";
import type { ManagementPregnancyProfile } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";
import { PregnancyProfileDetailModal } from "@/fe/components/records/management/PregnancyProfileDetailModal";
import { getDoctorAvailability } from "@/management/features/doctor-shifts/doctor-shifts.api";
import { useAuthStore } from "@/features/auth/auth.store";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const statusMeta: Record<ManagementAppointmentStatus, { label: string; color: string }> = {
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
  return `${doctor.title ? `${doctor.title} ` : ""}${doctor.name}${doctor.specialty ? ` - ${doctor.specialty}` : ""}`;
}

function formatPatient(appointment: ManagementAppointment) {
  return appointment.patientName || `User #${appointment.patientId}`;
}

export default function ManagementAppointmentsPage() {
  const authUser = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const isSuperAdmin = authUser?.roles?.some((role) => role.name === "super_admin") ?? false;
  const activeFacility = authUser?.facilities?.find(
    (facility) => String(facility.id) === String(activeFacilityId),
  );
  const [appointments, setAppointments] = useState<ManagementAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [status, setStatus] = useState<ManagementAppointmentStatus | undefined>();
  const [facilityId, setFacilityId] = useState<string | undefined>();
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [profileOptions, setProfileOptions] = useState<ManagementPregnancyProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ManagementAppointment | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [profileDetail, setProfileDetail] = useState<ManagementPregnancyProfile | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<{ shiftId: string; label: string; startTime: string; endTime: string }>>([]);
  const [checkInForm] = Form.useForm<CheckInFormValues>();
  const [rescheduleForm] = Form.useForm<RescheduleFormValues>();
  const scopedFacilityId = isSuperAdmin ? facilityId : activeFacilityId ?? undefined;

  const doctorOptions = useMemo(
    () => doctors.map((doctor) => ({ value: doctor.id, label: getDoctorLabel(doctor) })),
    [doctors],
  );

  const loadAppointments = async () => {
    setLoading(true);
    try {
      setAppointments(await getManagementAppointments({
        scope,
        status,
        search,
        facilityId: scopedFacilityId,
        doctorId,
        dateFrom: dateRange?.[0]?.format("YYYY-MM-DD"),
        dateTo: dateRange?.[1]?.format("YYYY-MM-DD"),
      }));
    } catch {
      message.error("Không tải được lịch đặt khám.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [scope, status, search, scopedFacilityId, doctorId, dateRange]);

  useEffect(() => {
    setDoctorId(undefined);
    if (!authUser || (!isSuperAdmin && !activeFacilityId)) {
      setDoctors([]);
      return;
    }
    getDoctors({ limit: 100, facilityId: isSuperAdmin ? facilityId : activeFacilityId ?? undefined })
      .then((result) => setDoctors(result.items))
      .catch(() => setDoctors([]));
  }, [activeFacilityId, authUser, facilityId, isSuperAdmin]);

  useEffect(() => {
    if (!authUser) {
      setFacilityOptions([]);
      return;
    }
    if (!isSuperAdmin) {
      setFacilityOptions(
        activeFacility
          ? [{ value: String(activeFacility.id), label: `${activeFacility.name} (${activeFacility.code})` }]
          : [],
      );
      return;
    }
    getFacilities({ status: "active", limit: 100 })
      .then((facilities) =>
        setFacilityOptions(
          facilities.map((facility) => ({
            value: facility.id,
            label: `${facility.name} (${facility.code})`,
          })),
        ),
      )
      .catch(() => setFacilityOptions([]));
  }, [activeFacility?.code, activeFacility?.id, activeFacility?.name, authUser, isSuperAdmin]);

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
        message.warning("User này chưa có hồ sơ thai kỳ. Cần tạo hồ sơ trước khi check-in.");
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
          const startTime = typeof slot === "string" ? slot.split(" - ")[0] : slot.startTime;
          const endTime = typeof slot === "string" ? slot.split(" - ")[1] : slot.endTime;
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
    if (values.doctorId && values.doctorId !== selectedAppointment.doctorId && !values.confirmDoctorChange) {
      message.warning("Nếu đổi bác sĩ, bạn cần tick xác nhận đổi bác sĩ.");
      return;
    }
    try {
      await checkInAppointment(selectedAppointment.id, {
        pregnancyProfileId: values.pregnancyProfileId,
        doctorId: values.doctorId !== selectedAppointment.doctorId ? values.doctorId : undefined,
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
      content: <Input.TextArea id="appointment-cancel-reason" rows={3} placeholder="Lý do hủy..." />,
      okText: "Hủy lịch",
      okButtonProps: { danger: true },
      cancelText: "Đóng",
      onOk: async () => {
        const reason = (document.getElementById("appointment-cancel-reason") as HTMLTextAreaElement | null)?.value;
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
        await markNoShowAppointment(appointment.id, "User không đến theo lịch hẹn.");
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

  const columns: ColumnsType<ManagementAppointment> = [
    {
      title: "Lịch",
      render: (_, item) => (
        <div>
          <Text strong>#{item.id} · {item.startTime} - {item.endTime}</Text>
          <div className="text-xs text-slate-500">{dayjs(item.date).format("DD/MM/YYYY")}</div>
        </div>
      ),
    },
    {
      title: "User",
      render: (_, item) => (
        <div>
          <Text>{formatPatient(item)}</Text>
          <div className="text-xs text-slate-500">{item.patientPhone || item.patientEmail || `ID ${item.patientId}`}</div>
        </div>
      ),
    },
    { title: "Dịch vụ", dataIndex: "serviceName" },
    { title: "Bác sĩ", render: (_, item) => `${item.doctorTitle ? `${item.doctorTitle} ` : ""}${item.doctorName ?? "—"}` },
    {
      title: "HS thai kỳ",
      render: (_, item) =>
        item.pregnancyProfileId ? (
          <Button size="small" icon={<FileText className="h-3.5 w-3.5" />} onClick={() => openProfileDetail(item.pregnancyProfileId)}>
            {item.pregnancyProfileCode || `HS #${item.pregnancyProfileId}`}
          </Button>
        ) : (
          <Tag>Chưa gắn</Tag>
        ),
    },
    {
      title: "Trạng thái",
      render: (_, item) => <Tag color={statusMeta[item.status]?.color}>{statusMeta[item.status]?.label ?? item.status}</Tag>,
    },
    {
      title: "Thao tác",
      fixed: "right",
      render: (_, item) => (
        <Space wrap>
          <Button size="small" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => { setSelectedAppointment(item); setDetailOpen(true); }}>Chi tiết</Button>
          {["booked", "confirmed", "rescheduled"].includes(item.status) ? (
            <Button size="small" type="primary" icon={<LogIn className="h-3.5 w-3.5" />} onClick={() => openCheckIn(item)}>Check-in</Button>
          ) : null}
          {["checked_in", "in_progress"].includes(item.status) ? (
            <Button size="small" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => handleComplete(item)}>Đã xong</Button>
          ) : null}
          {["booked", "confirmed", "rescheduled"].includes(item.status) ? (
            <>
              <Button size="small" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => openReschedule(item)}>Dời</Button>
              <Button size="small" icon={<UserX className="h-3.5 w-3.5" />} onClick={() => handleNoShow(item)}>No-show</Button>
              <Button danger size="small" icon={<XCircle className="h-3.5 w-3.5" />} onClick={() => handleCancel(item)}>Hủy</Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý lịch đặt khám"
        description="Check-in, đổi bác sĩ, dời/hủy lịch và theo dõi lịch khám của bác sĩ."
      />

      <Card className="mb-4">
        <Space wrap>
          <Tabs
            activeKey={scope}
            onChange={(value) => setScope(value as "all" | "mine")}
            items={[
              { key: "all", label: "Tất cả" },
              { key: "mine", label: "Lịch của tôi" },
            ]}
          />
          <Select
            allowClear
            className="w-56"
            placeholder="Lọc trạng thái"
            value={status}
            onChange={setStatus}
            options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))}
          />
          <Select
            allowClear={isSuperAdmin}
            showSearch
            className="w-72"
            placeholder="Tìm theo cơ sở"
            value={isSuperAdmin ? facilityId : activeFacilityId ?? undefined}
            onChange={isSuperAdmin ? setFacilityId : undefined}
            disabled={!isSuperAdmin}
            optionFilterProp="label"
            options={facilityOptions}
          />
          <Select
            allowClear
            showSearch
            className="w-72"
            placeholder="Tìm theo bác sĩ"
            value={doctorId}
            onChange={setDoctorId}
            optionFilterProp="label"
            options={doctorOptions}
          />
          <RangePicker
            className="w-full md:w-72"
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
            value={dateRange}
            onChange={(value) => setDateRange(value)}
          />
          <Input.Search
            allowClear
            className="w-full md:w-80"
            prefix={<Search className="h-4 w-4 text-slate-400" />}
            placeholder="Tìm mã lịch, user, SĐT, dịch vụ, bác sĩ..."
            value={searchInput}
            onChange={(event) => {
              const value = event.target.value;
              setSearchInput(value);
              if (!value) setSearch("");
            }}
            onSearch={(value) => setSearch(value.trim())}
            enterButton="Tìm"
          />
          <Button icon={<CalendarClock className="h-4 w-4" />} onClick={loadAppointments}>Tải lại</Button>
        </Space>
      </Card>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={appointments}
        scroll={{ x: 1200 }}
      />

      <Modal title="Chi tiết lịch đặt" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={720}>
        {selectedAppointment ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã lịch">#{selectedAppointment.id}</Descriptions.Item>
            <Descriptions.Item label="User">{formatPatient(selectedAppointment)}</Descriptions.Item>
            <Descriptions.Item label="Thời gian">{dayjs(selectedAppointment.date).format("DD/MM/YYYY")} {selectedAppointment.startTime} - {selectedAppointment.endTime}</Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">{selectedAppointment.serviceName}</Descriptions.Item>
            <Descriptions.Item label="Bác sĩ">{selectedAppointment.doctorTitle} {selectedAppointment.doctorName}</Descriptions.Item>
            <Descriptions.Item label="Cơ sở">{selectedAppointment.facilityName}</Descriptions.Item>
            <Descriptions.Item label="Phòng">{selectedAppointment.roomName}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{statusMeta[selectedAppointment.status]?.label}</Descriptions.Item>
            <Descriptions.Item label="Hồ sơ">
              {selectedAppointment.pregnancyProfileId ? (
                <Button onClick={() => openProfileDetail(selectedAppointment.pregnancyProfileId)}>Xem chi tiết HS</Button>
              ) : "Chưa gắn hồ sơ"}
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
        okButtonProps={{ disabled: !profileOptions.length || loadingProfiles }}
      >
        <Form form={checkInForm} layout="vertical" onFinish={handleCheckIn}>
          {!loadingProfiles && !profileOptions.length ? (
            <Alert
              showIcon
              type="warning"
              className="mb-4"
              message="User này chưa có hồ sơ thai kỳ"
              description="Cần tạo hồ sơ thai kỳ cho user trước, sau đó quay lại check-in và chọn hồ sơ."
              action={
                <Button size="small" href="/management/records">
                  Tạo hồ sơ
                </Button>
              }
            />
          ) : null}

          <Form.Item name="pregnancyProfileId" label="Hồ sơ thai kỳ" rules={[{ required: true, message: "Chọn hồ sơ thai kỳ khi check-in" }]}>
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
            <Select showSearch optionFilterProp="label" options={doctorOptions} />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) =>
              getFieldValue("doctorId") && getFieldValue("doctorId") !== selectedAppointment?.doctorId ? (
                <Form.Item name="confirmDoctorChange" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error("Cần xác nhận đổi bác sĩ")) }]}>
                  <input type="checkbox" className="mr-2" /> Tôi xác nhận đổi bác sĩ cho lịch này.
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Dời lịch khám" open={rescheduleOpen} onCancel={() => setRescheduleOpen(false)} onOk={() => rescheduleForm.submit()} okText="Dời lịch">
        <Form form={rescheduleForm} layout="vertical" onFinish={handleReschedule}>
          <Form.Item name="doctorId" label="Bác sĩ" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={doctorOptions} onChange={() => setAvailableSlots([])} />
          </Form.Item>
          <Form.Item name="date" label="Ngày" rules={[{ required: true }]}>
            <DatePicker className="w-full" format="DD/MM/YYYY" onChange={() => setAvailableSlots([])} />
          </Form.Item>
          <Button className="mb-3" onClick={refreshSlots}>Lấy slot trống</Button>
          <Form.Item name="slot" label="Slot trống" rules={[{ required: true }]}>
            <Select options={availableSlots.map((slot) => ({ value: slot.label, label: slot.label }))} />
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
    </AdminLayout>
  );
}
