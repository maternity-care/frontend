"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Alert,
  DatePicker,
  Descriptions,
  Divider,
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
  ClipboardList,
  Eye,
  FilePlus2,
  FileText,
  LogIn,
  Printer,
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
  addAppointmentServiceItems,
  callAppointmentServiceItem,
  cancelAppointment,
  checkInAppointment,
  checkInAppointmentServiceItem,
  completeAppointment,
  completeAppointmentServiceItem,
  getManagementAppointment,
  getAppointmentServiceItems,
  getManagementAppointments,
  markNoShowAppointment,
  rescheduleAppointment,
  startAppointmentServiceItem,
} from "@/management/features/appointments/appointments.api";
import type {
  AppointmentServiceItem,
  AppointmentServiceItemStatus,
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
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import { getPublicWeeklyDoctorShifts } from "@/features/doctor-shifts/public-doctor-shifts.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { getFacilityServices } from "@/management/features/services/services.api";
import type { FacilityService } from "@/management/features/services/services.types";
import { getRooms } from "@/management/features/rooms/rooms.api";
import type { ClinicRoom } from "@/management/features/rooms/rooms.types";

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

const serviceItemStatusMeta: Record<
  AppointmentServiceItemStatus,
  { label: string; color: string }
> = {
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

type CheckInFormValues = {
  pregnancyProfileId: string;
  doctorId?: string;
};

type RescheduleFormValues = {
  doctorId: string;
  date: Dayjs;
  slot: string;
  reason?: string;
};

type ServiceIndicationFormValues = {
  serviceId: string;
  roomId: string;
  doctorId?: string;
  note?: string;
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

function getAppointmentDoctorLabel(appointment?: ManagementAppointment | null) {
  if (!appointment?.doctorId) return "";
  return (
    [appointment.doctorTitle, appointment.doctorName].filter(Boolean).join(" ") ||
    `Bác sĩ #${appointment.doctorId}`
  );
}

function formatPatient(appointment: ManagementAppointment) {
  return appointment.patientName || `User #${appointment.patientId}`;
}

function normalizeSearchText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSpecialtyKeyword(value?: string | null) {
  const text = normalizeSearchText(value);
  if (text.includes("sieu am")) return "sieu am";
  if (text.includes("xet nghiem") || text.includes("sang loc")) return "xet nghiem";
  if (text.includes("thu thuat")) return "thu thuat";
  if (text.includes("phu san") || text.includes("san phu") || text.includes("theo doi thai")) {
    return "san phu khoa";
  }
  return text;
}

function isObstetricsSpecialty(value?: string | null) {
  return getSpecialtyKeyword(value) === "san phu khoa";
}

function getServiceSpecialtyKey(service?: FacilityService | null) {
  if (!service) return "";
  const configuredSpecialty = getSpecialtyKeyword(service.serviceDoctorSpecialty);
  if (configuredSpecialty) return configuredSpecialty;

  if (service.serviceType === "ultrasound") return "sieu am";
  if (service.serviceType === "lab_test" || service.serviceType === "screening") {
    return "xet nghiem";
  }
  if (service.serviceType === "procedure") return "thu thuat";

  return getSpecialtyKeyword(
    [
      service.serviceCode,
      service.serviceName,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getSpecialtySearchLabel(key: string, service?: FacilityService | null) {
  if (service?.serviceDoctorSpecialty && getSpecialtyKeyword(service.serviceDoctorSpecialty) === key) {
    return service.serviceDoctorSpecialty;
  }

  if (key === "sieu am") return "Siêu âm";
  if (key === "xet nghiem") return "Xét nghiệm";
  if (key === "thu thuat") return "Thủ thuật";
  if (key === "san phu khoa") return "Sản phụ khoa";
  return undefined;
}

export default function ManagementAppointmentsPage() {
  const authUser = useAuthStore((state) => state.user);
  const effectiveRoleNames = useAuthStore((state) => state.roles);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const isSuperAdmin = effectiveRoleNames.includes("super_admin");
  const roleNames = useMemo(
    () => new Set(effectiveRoleNames),
    [effectiveRoleNames],
  );
  const isDoctor = roleNames.has("doctor");
  const doctorSpecialty =
    authUser?.doctor?.specialty ?? authUser?.staffProfile?.doctor?.specialty;
  const isObstetricsDoctor = isDoctor && isObstetricsSpecialty(doctorSpecialty);
  const canCreateIndication =
    roleNames.has("super_admin") || roleNames.has("admin") || isObstetricsDoctor;
  const canCheckInAppointment =
    roleNames.has("super_admin") || roleNames.has("admin") || roleNames.has("staff");
  const canOperateIndication =
    roleNames.has("super_admin") ||
    roleNames.has("admin") ||
    roleNames.has("doctor");
  const activeFacility = authUser?.facilities?.find(
    (facility) => String(facility.id) === String(activeFacilityId),
  );
  const queryInitializedRef = useRef(false);
  const canCreateIndicationForAppointment = useCallback(
    (appointment?: ManagementAppointment | null) =>
      canCreateIndication ||
      (isDoctor && isObstetricsSpecialty(appointment?.doctorSpecialty)),
    [canCreateIndication, isDoctor],
  );

  const [appointments, setAppointments] = useState<ManagementAppointment[]>(
    [],
  );
  const [initialAppointmentId, setInitialAppointmentId] = useState<string | null>(null);
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
  const [serviceItemsOpen, setServiceItemsOpen] = useState(false);
  const [serviceItems, setServiceItems] = useState<AppointmentServiceItem[]>([]);
  const [loadingServiceItems, setLoadingServiceItems] = useState(false);
  const [facilityServices, setFacilityServices] = useState<FacilityService[]>([]);
  const [serviceRooms, setServiceRooms] = useState<ClinicRoom[]>([]);
  const [serviceDoctorShifts, setServiceDoctorShifts] = useState<DoctorShiftItem[]>([]);
  const [serviceItemSubmitting, setServiceItemSubmitting] = useState(false);
  const [loadingServiceDoctors, setLoadingServiceDoctors] = useState(false);
  const [checkInForm] = Form.useForm<CheckInFormValues>();
  const [rescheduleForm] = Form.useForm<RescheduleFormValues>();
  const [serviceItemForm] = Form.useForm<ServiceIndicationFormValues>();
  const scopedFacilityId = isSuperAdmin
    ? facilityId
    : (activeFacilityId ?? undefined);

  useEffect(() => {
    if (queryInitializedRef.current || typeof window === "undefined") return;
    if (effectiveRoleNames.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const nextSearch = params.get("q") || params.get("search") || "";
    const nextStatus = params.get("status");
    const nextFacilityId = params.get("facilityId");
    const nextDoctorId = params.get("doctorId");
    const nextScope = params.get("scope");
    const dateFrom = params.get("dateFrom");
    const dateTo = params.get("dateTo");
    const appointmentId = params.get("appointmentId");

    if (nextSearch) {
      setSearchInput(nextSearch);
      setSearch(nextSearch.trim());
    }

    if (nextStatus && nextStatus in statusMeta) {
      setStatus(nextStatus as ManagementAppointmentStatus);
    }

    if (isSuperAdmin && nextFacilityId && nextFacilityId !== "all") {
      setFacilityId(nextFacilityId);
    }

    if (!isDoctor && nextDoctorId) {
      setDoctorId(nextDoctorId);
    }

    if (nextScope === "mine" || nextScope === "all") {
      setScope(nextScope);
    }

    if (dateFrom && dateTo) {
      const from = dayjs(dateFrom);
      const to = dayjs(dateTo);
      if (from.isValid() && to.isValid()) {
        setDateRange([from, to]);
      }
    }

    if (appointmentId) {
      setInitialAppointmentId(appointmentId);
    }

    queryInitializedRef.current = true;
  }, [effectiveRoleNames.length, isDoctor, isSuperAdmin]);

  const doctorOptions = useMemo(() => {
    const options = doctors.map((doctor) => ({
      value: String(doctor.id),
      label: getDoctorLabel(doctor),
    }));
    if (
      selectedAppointment?.doctorId &&
      !options.some((option) => option.value === String(selectedAppointment.doctorId))
    ) {
      options.unshift({
        value: String(selectedAppointment.doctorId),
        label: getAppointmentDoctorLabel(selectedAppointment),
      });
    }
    return options;
  }, [doctors, selectedAppointment]);

  const serviceDoctorOptions = useMemo(() => {
    const seen = new Set<string>();
    return serviceDoctorShifts
      .filter((shift) => shift.staffId && shift.roomId && !seen.has(shift.staffId))
      .map((shift) => {
        seen.add(shift.staffId);
        return {
          value: shift.staffId,
          label: `${shift.doctorTitle ? `${shift.doctorTitle} ` : ""}${shift.doctorName} · ${shift.doctorSpecialty || "Chuyên khoa"} · ${shift.roomName || `Phòng #${shift.roomId}`}`,
        };
      });
  }, [serviceDoctorShifts]);

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
        disabled: isDoctor,
      },
      {
        field: "dateRange",
        label: "Khoảng ngày",
        type: "dateRange",
        width: 280,
      },
    ],
    [doctorOptions, facilityOptions, isDoctor, isSuperAdmin],
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

    if (!isDoctor) {
      setDoctorId(
        values.doctorId === undefined || values.doctorId === null
          ? undefined
          : String(values.doctorId),
      );
    }

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
          scope: isDoctor ? "mine" : scope,
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
  }, [dateRange, doctorId, isDoctor, scope, scopedFacilityId, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAppointments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAppointments]);

  useEffect(() => {
    if (!initialAppointmentId || loading) return;

    const matchedAppointment = appointments.find(
      (appointment) => String(appointment.id) === String(initialAppointmentId),
    );

    if (matchedAppointment) {
      setSelectedAppointment(matchedAppointment);
      setDetailOpen(true);
      setInitialAppointmentId(null);
      return;
    }

    let active = true;
    void getManagementAppointment(initialAppointmentId)
      .then((appointment) => {
        if (!active) return;
        setSelectedAppointment(appointment);
        setDetailOpen(true);
        setInitialAppointmentId(null);
      })
      .catch(() => {
        if (!active) return;
        message.warning("Không mở được chi tiết lịch hẹn từ dashboard.");
        setInitialAppointmentId(null);
      });

    return () => {
      active = false;
    };
  }, [appointments, initialAppointmentId, loading]);

  useEffect(() => {
    const reloadFromExternalBooking = () => {
      void loadAppointments();
      void message.info("Có lịch đặt mới, danh sách đã được cập nhật.");
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "maternity-care:appointment-created-at") {
        reloadFromExternalBooking();
      }
    };

    const handleFocus = () => {
      void loadAppointments();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("maternity-care:appointment-created", reloadFromExternalBooking);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("maternity-care:appointment-created", reloadFromExternalBooking);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadAppointments, message]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDoctorId(undefined);
      if (!authUser || (!isSuperAdmin && !activeFacilityId)) {
        setDoctors([]);
        return;
      }
      const facilityIdForDoctors = isSuperAdmin
        ? facilityId
        : (activeFacilityId ?? undefined);
      const loadDoctors = async () => {
        const firstPage = await getDoctors({
          limit: 50,
          page: 1,
          facilityId: facilityIdForDoctors,
        });
        const totalPages = Math.max(1, firstPage.totalPages || 1);
        const restPages =
          totalPages > 1
            ? await Promise.all(
                Array.from({ length: totalPages - 1 }, (_, index) =>
                  getDoctors({
                    limit: 50,
                    page: index + 2,
                    facilityId: facilityIdForDoctors,
                  }),
                ),
              )
            : [];
        setDoctors([
          ...firstPage.items,
          ...restPages.flatMap((page) => page.items),
        ]);
      };
      void loadDoctors()
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
      doctorId: appointment.doctorId ? String(appointment.doctorId) : undefined,
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
      doctorId: appointment.doctorId ? String(appointment.doctorId) : undefined,
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

  const submitCheckIn = async (values: CheckInFormValues) => {
    if (!selectedAppointment) return;
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

  const handleCheckIn = async (values: CheckInFormValues) => {
    if (!selectedAppointment) return;
    const oldDoctorId = selectedAppointment.doctorId ?? undefined;
    const newDoctorId = values.doctorId;
    if (newDoctorId && oldDoctorId && newDoctorId !== oldDoctorId) {
      const oldDoctorLabel = getAppointmentDoctorLabel(selectedAppointment);
      const newDoctorLabel =
        doctorOptions.find((option) => option.value === newDoctorId)?.label ??
        `Bác sĩ #${newDoctorId}`;
      Modal.confirm({
        title: "Xác nhận đổi bác sĩ?",
        content: `Đổi bác sĩ phụ trách từ ${oldDoctorLabel} sang ${newDoctorLabel}.`,
        okText: "Xác nhận đổi",
        cancelText: "Hủy",
        centered: true,
        onOk: () => submitCheckIn(values),
      });
      return;
    }
    await submitCheckIn(values);
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

  const loadServiceItems = useCallback(async (appointmentId: string) => {
    setLoadingServiceItems(true);
    try {
      setServiceItems(await getAppointmentServiceItems(appointmentId));
    } catch {
      message.error("Không tải được danh sách chỉ định.");
      setServiceItems([]);
    } finally {
      setLoadingServiceItems(false);
    }
  }, []);

  const applyServiceShift = useCallback(
    (shift: DoctorShiftItem | null) => {
      if (!shift) {
        serviceItemForm.setFieldsValue({ doctorId: undefined, roomId: undefined });
        message.warning("Chưa có bác sĩ đang trực phù hợp trong ngày lịch này.");
        return;
      }
      serviceItemForm.setFieldsValue({
        doctorId: shift.staffId,
        roomId: shift.roomId,
      });
    },
    [serviceItemForm],
  );

  const handleServiceSelect = async (serviceId: string) => {
    if (!selectedAppointment) return;
    const service = facilityServices.find((item) => item.serviceId === serviceId);
    const normalizedSpecialty = getServiceSpecialtyKey(service);
    const specialty = getSpecialtySearchLabel(normalizedSpecialty, service);
    serviceItemForm.setFieldsValue({ doctorId: undefined, roomId: undefined });
    setServiceDoctorShifts([]);
    setLoadingServiceDoctors(true);
    try {
      const shifts = await getPublicWeeklyDoctorShifts({
        facilityId: selectedAppointment.facilityId,
        specialty,
        weekStart: selectedAppointment.date,
      });
      const availableShifts = shifts.filter(
        (shift) =>
          shift.staffId &&
          shift.roomId &&
          shift.status === "available" &&
          shift.shiftDate === selectedAppointment.date &&
          String(shift.facilityId) === String(selectedAppointment.facilityId) &&
          (!normalizedSpecialty ||
            getSpecialtyKeyword(shift.doctorSpecialty) === normalizedSpecialty),
      ) as unknown as DoctorShiftItem[];
      setServiceDoctorShifts(availableShifts);
      applyServiceShift(availableShifts[Math.floor(Math.random() * availableShifts.length)] ?? null);
    } catch {
      setServiceDoctorShifts([]);
      message.warning("Không tải được danh sách bác sĩ đang trực tại cơ sở này.");
    } finally {
      setLoadingServiceDoctors(false);
    }
  };

  const handleServiceDoctorSelect = (doctorId?: string) => {
    if (!doctorId) {
      serviceItemForm.setFieldsValue({ roomId: undefined });
      return;
    }
    const shift = serviceDoctorShifts.find((item) => item.staffId === doctorId && item.roomId);
    serviceItemForm.setFieldsValue({ roomId: shift?.roomId });
  };

  const openServiceItems = async (appointment: ManagementAppointment) => {
    setSelectedAppointment(appointment);
    setServiceItemsOpen(true);
    serviceItemForm.resetFields();
    void loadServiceItems(appointment.id);
    const facilityIdForLookup = appointment.facilityId;
    try {
      const [facilityServiceResult, roomResult] = await Promise.all([
        getFacilityServices({
          facilityId: facilityIdForLookup,
          status: "active" as never,
          limit: 200,
        }),
        getRooms({
          facilityId: facilityIdForLookup,
          status: "active",
          limit: 200,
        }),
      ]);
      setFacilityServices(facilityServiceResult);
      setServiceRooms(roomResult.items);
    } catch {
      message.warning("Không tải đủ danh sách dịch vụ/phòng/ca trực của cơ sở.");
      setFacilityServices([]);
      setServiceRooms([]);
    }

    setServiceDoctorShifts([]);
  };

  const handleAddServiceItem = async (values: ServiceIndicationFormValues) => {
    if (!selectedAppointment) return;
    setServiceItemSubmitting(true);
    try {
      if (!values.doctorId || !values.roomId) {
        message.warning("Cần chọn bác sĩ đang trực để tự lấy phòng thực hiện.");
        return;
      }
      const assignedDoctorId = values.doctorId;
      await addAppointmentServiceItems(selectedAppointment.id, {
        items: [
          {
            serviceId: values.serviceId,
            roomId: values.roomId,
            doctorId: assignedDoctorId,
            note: values.note,
          },
        ],
      });
      message.success("Đã thêm chỉ định dịch vụ.");
      serviceItemForm.resetFields();
      await loadServiceItems(selectedAppointment.id);
    } catch {
      message.error("Không thêm được chỉ định.");
    } finally {
      setServiceItemSubmitting(false);
    }
  };

  const refreshOneServiceItem = async (
    item: AppointmentServiceItem,
    action: () => Promise<AppointmentServiceItem>,
    successMessage: string,
  ) => {
    if (!selectedAppointment) return;
    try {
      await action();
      message.success(successMessage);
      await loadServiceItems(selectedAppointment.id);
    } catch {
      message.error("Thao tác chỉ định thất bại.");
    }
  };

  const printServiceItem = (item: AppointmentServiceItem) => {
    if (!selectedAppointment) return;
    const printWindow = window.open("", "_blank", "width=760,height=900");
    if (!printWindow) {
      message.warning("Trình duyệt đang chặn cửa sổ in.");
      return;
    }
    const doctorText = [selectedAppointment.doctorTitle, selectedAppointment.doctorName]
      .filter(Boolean)
      .join(" ");
    const assignedDoctorText =
      [item.doctorTitle, item.doctorName].filter(Boolean).join(" ") ||
      (item.doctorStaffId ? `Bác sĩ #${item.doctorStaffId}` : "");
    printWindow.document.write(`
      <html>
        <head>
          <title>Phiếu chỉ định #${item.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { font-size: 22px; margin: 0 0 18px; text-align: center; }
            .row { display: flex; border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
            .label { width: 190px; color: #475569; font-weight: 600; }
            .value { flex: 1; }
            .signatures { display: flex; justify-content: space-between; margin-top: 56px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>PHIẾU CHỈ ĐỊNH DỊCH VỤ</h1>
          <div class="row"><div class="label">Mã lịch</div><div class="value">#${selectedAppointment.id}</div></div>
          <div class="row"><div class="label">Người bệnh</div><div class="value">${formatPatient(selectedAppointment)}</div></div>
          <div class="row"><div class="label">SĐT/Email</div><div class="value">${selectedAppointment.patientPhone || selectedAppointment.patientEmail || ""}</div></div>
          <div class="row"><div class="label">Ngày khám</div><div class="value">${dayjs(selectedAppointment.date).format("DD/MM/YYYY")} ${selectedAppointment.startTime} - ${selectedAppointment.endTime}</div></div>
          <div class="row"><div class="label">Bác sĩ khám ban đầu</div><div class="value">${doctorText || ""}</div></div>
          <div class="row"><div class="label">Dịch vụ chỉ định</div><div class="value">${item.serviceName || `#${item.serviceId}`}</div></div>
          <div class="row"><div class="label">Bác sĩ thực hiện</div><div class="value">${assignedDoctorText}</div></div>
          <div class="row"><div class="label">Phòng thực hiện</div><div class="value">${item.roomName || `#${item.roomId}`}</div></div>
          <div class="row"><div class="label">Ghi chú</div><div class="value">${item.note || ""}</div></div>
          <div class="signatures">
            <div>Người chỉ định<br/><br/><br/>______________</div>
            <div>Nhân viên tiếp nhận<br/><br/><br/>______________</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      render: (_, item) => {
        return (
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
            {canCreateIndicationForAppointment(item) ? (
              <Button
                size="small"
                icon={<ClipboardList className="h-3.5 w-3.5" />}
                onClick={() => openServiceItems(item)}
              >
                Chỉ định
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
            {canCheckInAppointment && ["booked", "confirmed", "rescheduled"].includes(item.status) ? (
              <Button
                size="small"
                type="primary"
                icon={<LogIn className="h-3.5 w-3.5" />}
                onClick={() => openCheckIn(item)}
              >
                Check-in
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
        );
      },
    },
  ];

  const serviceItemColumns: ColumnsType<AppointmentServiceItem> = [
    {
      title: "Dịch vụ",
      render: (_, item) => (
        <div>
          <Text strong>{item.serviceName || `Dịch vụ #${item.serviceId}`}</Text>
          <div className="text-xs text-slate-500">
            {Number(item.durationMinutes ?? 0) || "—"} phút
          </div>
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
        <Tag color={serviceItemStatusMeta[item.status]?.color}>
          {serviceItemStatusMeta[item.status]?.label ?? item.status}
        </Tag>
      ),
    },
    {
      title: "KQ",
      render: (_, item) =>
        item.medicalRecordId ? (
          <Tag color="green">Đã upload</Tag>
        ) : item.resultExpectedAt ? (
          <Tag color="orange">
            Hẹn {dayjs(item.resultExpectedAt).format("HH:mm DD/MM")}
          </Tag>
        ) : (
          <Tag>Chưa có</Tag>
        ),
    },
    {
      title: "Thao tác",
      fixed: "right",
      render: (_, item) => (
        <Space wrap>
          <Button
            size="small"
            icon={<Printer className="h-3.5 w-3.5" />}
            onClick={() => printServiceItem(item)}
          >
            In phiếu
          </Button>
          {canOperateIndication && item.status === "ordered" ? (
            <Button
              size="small"
              type="primary"
              onClick={() =>
                refreshOneServiceItem(
                  item,
                  () =>
                    checkInAppointmentServiceItem(
                      item.appointmentId,
                      item.id,
                    ),
                  "Đã check-in chỉ định.",
                )
              }
            >
              Check-in
            </Button>
          ) : null}
          {canOperateIndication && item.status === "waiting" ? (
            <Button
              size="small"
              onClick={() =>
                refreshOneServiceItem(
                  item,
                  () => callAppointmentServiceItem(item.appointmentId, item.id),
                  "Đã gọi vào phòng.",
                )
              }
            >
              Gọi
            </Button>
          ) : null}
          {canOperateIndication && item.status === "called" ? (
            <Button
              size="small"
              onClick={() =>
                refreshOneServiceItem(
                  item,
                  () => startAppointmentServiceItem(item.appointmentId, item.id),
                  "Đã bắt đầu dịch vụ.",
                )
              }
            >
              Bắt đầu
            </Button>
          ) : null}
          {canOperateIndication && item.status === "in_progress" ? (
            <Button
              size="small"
              onClick={() =>
                refreshOneServiceItem(
                  item,
                  () =>
                    completeAppointmentServiceItem(item.appointmentId, item.id),
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
          activeKey={isDoctor ? "mine" : scope}
          onChange={(value) => setScope(value as "all" | "mine")}
          items={
            isDoctor
              ? [
                  {
                    key: "mine",
                    label: "Lịch của tôi",
                    children: listContent,
                  },
                ]
              : [
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
                ]
          }
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

      <Modal
        title={
          selectedAppointment
            ? `Chỉ định dịch vụ - lịch #${selectedAppointment.id}`
            : "Chỉ định dịch vụ"
        }
        open={serviceItemsOpen}
        onCancel={() => setServiceItemsOpen(false)}
        footer={null}
        width={980}
      >
        {selectedAppointment ? (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Người bệnh">
                {formatPatient(selectedAppointment)}
              </Descriptions.Item>
              <Descriptions.Item label="Lịch khám">
                {dayjs(selectedAppointment.date).format("DD/MM/YYYY")}{" "}
                {selectedAppointment.startTime} - {selectedAppointment.endTime}
              </Descriptions.Item>
              <Descriptions.Item label="Dịch vụ đặt lịch">
                {selectedAppointment.serviceName}
              </Descriptions.Item>
              <Descriptions.Item label="Bác sĩ khám">
                {selectedAppointment.doctorTitle} {selectedAppointment.doctorName}
              </Descriptions.Item>
            </Descriptions>

            {canCreateIndicationForAppointment(selectedAppointment) ? (
              <>
                <Divider>Thêm chỉ định</Divider>
                <Form
                  form={serviceItemForm}
                  layout="vertical"
                  onFinish={handleAddServiceItem}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Form.Item
                      name="serviceId"
                      label="Dịch vụ chỉ định"
                      rules={[{ required: true, message: "Chọn dịch vụ" }]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Chọn dịch vụ tại cơ sở"
                        onChange={handleServiceSelect}
                        options={facilityServices.map((item) => ({
                          value: item.serviceId,
                          label: `${item.serviceName} · ${item.durationMinutes} phút`,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="roomId"
                      label="Phòng thực hiện"
                      rules={[{ required: true, message: "Chọn phòng" }]}
                    >
                      <Select
                        showSearch
                        disabled
                        optionFilterProp="label"
                        placeholder="Tự lấy theo phòng trực của bác sĩ"
                        options={serviceRooms.map((room) => ({
                          value: room.id,
                          label: `${room.roomName} · ${room.floor}`,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item name="doctorId" label="Bác sĩ chuyên khoa">
                      <Select
                        allowClear
                        showSearch
                        loading={loadingServiceDoctors}
                        optionFilterProp="label"
                        placeholder="Tự chọn theo dịch vụ hoặc chỉ định bác sĩ"
                        options={serviceDoctorOptions}
                        onChange={handleServiceDoctorSelect}
                      />
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={serviceItemSubmitting}
                  >
                    Thêm chỉ định
                  </Button>
                </Form>
              </>
            ) : null}

            <Divider>Danh sách chỉ định</Divider>
            <Table
              rowKey="id"
              size="small"
              loading={loadingServiceItems}
              columns={serviceItemColumns}
              dataSource={serviceItems}
              pagination={false}
              scroll={{ x: 900 }}
            />
          </div>
        ) : null}
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
