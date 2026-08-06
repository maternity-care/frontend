"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Progress,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AlertTriangle,
  Baby,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HeartPulse,
  RefreshCw,
  Search,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { getManagementAppointments } from "@/management/features/appointments/appointments.api";
import type {
  ManagementAppointment,
  ManagementAppointmentStatus,
} from "@/management/features/appointments/appointments.types";
import { getDoctorShifts } from "@/management/features/doctor-shifts/doctor-shifts.api";
import type { DoctorShiftItem } from "@/management/features/doctor-shifts/doctor-shifts.types";
import { getDoctors } from "@/management/features/doctors/doctors.api";
import { getFacilitiesPage } from "@/management/features/facilities/facilities.api";
import { getManagementPregnancyProfiles } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.api";
import type { ManagementPregnancyProfile } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";
import { getStaffsPage } from "@/management/features/staffs/staffs.api";

const { Text, Title } = Typography;

type DashboardRole = "super_admin" | "admin" | "doctor" | "nurse" | "staff";
type DashboardWindow = "today" | "7-days" | "30-days";
type AlertLevel = "critical" | "warning" | "info";
type StatTone = "blue" | "emerald" | "violet" | "amber";

type DashboardState = {
  appointments: ManagementAppointment[];
  shifts: DoctorShiftItem[];
  profiles: ManagementPregnancyProfile[];
  doctorsTotal: number;
  staffsTotal: number;
  facilitiesTotal: number;
  errors: string[];
};

type DailyMetric = {
  date: string;
  label: string;
  appointments: number;
  completed: number;
};

type DashboardAlert = {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  meta: string;
};

type FacilityUtilization = {
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  appointments: number;
  maxAppointments: number;
  activeDoctors: number;
  roomsInUse: number;
  totalRooms: number;
};

const emptyState: DashboardState = {
  appointments: [],
  shifts: [],
  profiles: [],
  doctorsTotal: 0,
  staffsTotal: 0,
  facilitiesTotal: 0,
  errors: [],
};

const roleLabels: Record<DashboardRole, string> = {
  super_admin: "Super Admin",
  admin: "Quản trị cơ sở",
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
  staff: "Nhân viên vận hành",
};

const roleDescriptions: Record<DashboardRole, string> = {
  super_admin: "Tổng quan toàn hệ thống: cơ sở, nhân sự, bác sĩ, lịch khám và hồ sơ thai kỳ.",
  admin: "Tổng quan cơ sở đang chọn: lịch khám, ca trực, bác sĩ, nhân sự và hồ sơ thai kỳ.",
  doctor: "Tập trung vào lịch khám, ca trực và hồ sơ thai kỳ cần theo dõi chuyên môn.",
  nurse: "Tập trung vào lịch khám, ca trực, hỗ trợ thai phụ và điều phối vận hành.",
  staff: "Tập trung vào lịch đặt khám, ca trực và các đầu việc vận hành trong ngày.",
};

const statusLabels: Record<ManagementAppointmentStatus, string> = {
  pending_payment: "Chờ thanh toán",
  booked: "Đã đặt",
  confirmed: "Đã xác nhận",
  checked_in: "Đã check-in",
  in_progress: "Đang khám",
  completed: "Hoàn thành",
  rescheduled: "Đổi lịch",
  cancelled: "Đã hủy",
  no_show: "Không đến",
};

const statusColors: Record<ManagementAppointmentStatus, string> = {
  pending_payment: "gold",
  booked: "blue",
  confirmed: "cyan",
  checked_in: "geekblue",
  in_progress: "purple",
  completed: "green",
  rescheduled: "orange",
  cancelled: "red",
  no_show: "volcano",
};

const periodOptions: { value: DashboardWindow; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "7-days", label: "7 ngày gần nhất" },
  { value: "30-days", label: "30 ngày gần nhất" },
];

const statToneClasses: Record<
  StatTone,
  {
    card: string;
    icon: string;
    trend: string;
  }
> = {
  blue: {
    card: "border-blue-100 bg-blue-50/70",
    icon: "bg-blue-600 text-white",
    trend: "text-blue-700",
  },
  emerald: {
    card: "border-emerald-100 bg-emerald-50/70",
    icon: "bg-emerald-600 text-white",
    trend: "text-emerald-700",
  },
  violet: {
    card: "border-violet-100 bg-violet-50/70",
    icon: "bg-violet-600 text-white",
    trend: "text-violet-700",
  },
  amber: {
    card: "border-amber-100 bg-amber-50/70",
    icon: "bg-amber-500 text-white",
    trend: "text-amber-700",
  },
};

function getDashboardRole(roles: string[]): DashboardRole {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("doctor")) return "doctor";
  if (roles.includes("nurse")) return "nurse";
  return "staff";
}

function formatDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getWindowRange(window: DashboardWindow) {
  const today = new Date();
  const days = window === "today" ? 1 : window === "7-days" ? 7 : 30;
  return {
    dateFrom: formatDateKey(addDays(today, -(days - 1))),
    dateTo: formatDateKey(today),
    days,
  };
}

function countByStatus(
  appointments: ManagementAppointment[],
  statuses: ManagementAppointmentStatus[],
) {
  return appointments.filter((appointment) => statuses.includes(appointment.status)).length;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không tải được dữ liệu.";
}

function normalizeRoleScope(role: DashboardRole) {
  return role === "doctor" ? "mine" : undefined;
}

function getPeriodLabel(value: DashboardWindow) {
  return periodOptions.find((item) => item.value === value)?.label ?? "Khoảng ngày";
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function includesKeyword(value: string | null | undefined, keyword: string) {
  return value?.toLowerCase().includes(keyword) ?? false;
}

function getAlertVisual(level: AlertLevel) {
  if (level === "critical") {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      iconClass: "bg-red-100 text-red-700",
      borderClass: "border-red-100 bg-red-50/60",
      tag: <Tag color="red">Khẩn</Tag>,
    };
  }

  if (level === "warning") {
    return {
      icon: <Clock3 className="h-4 w-4" />,
      iconClass: "bg-amber-100 text-amber-700",
      borderClass: "border-amber-100 bg-amber-50/60",
      tag: <Tag color="gold">Cần chú ý</Tag>,
    };
  }

  return {
    icon: <CheckCircle2 className="h-4 w-4" />,
    iconClass: "bg-blue-100 text-blue-700",
    borderClass: "border-blue-100 bg-blue-50/60",
    tag: <Tag color="blue">Thông tin</Tag>,
  };
}

function StatCard({
  title,
  value,
  suffix,
  helper,
  icon,
  trend,
  trendDirection,
  tone,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  helper: string;
  icon: ReactNode;
  trend: string;
  trendDirection: "up" | "down";
  tone: StatTone;
}) {
  const toneClasses = statToneClasses[tone];

  return (
    <Card className={`h-full overflow-hidden ${toneClasses.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Text className="text-sm font-medium text-slate-500">{title}</Text>
          <Statistic
            value={value}
            suffix={suffix}
            className="mt-1"
            styles={{
              content: {
                color: "#0f172a",
                fontSize: 28,
                lineHeight: 1.25,
                fontWeight: 700,
              },
            }}
          />
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses.icon}`}>
          {icon}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 font-semibold ${toneClasses.trend}`}>
          {trendDirection === "up" ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {trend}
        </span>
        <span className="truncate text-slate-500">{helper}</span>
      </div>
    </Card>
  );
}

function AppointmentTrendChart({ data }: { data: DailyMetric[] }) {
  if (data.length === 0) {
    return <Empty description="Không có dữ liệu lịch hẹn trong khoảng ngày đã chọn." />;
  }

  const maxValue = Math.max(...data.map((item) => item.appointments), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          Tổng lịch hẹn
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Đã hoàn thành
        </span>
      </div>

      <div className="space-y-3">
        {data.map((item) => {
          const totalPercent = Math.round((item.appointments / maxValue) * 100);
          const completedPercent =
            item.appointments === 0
              ? 0
              : Math.round((item.completed / item.appointments) * totalPercent);

          return (
            <div key={item.date} className="grid gap-2 sm:grid-cols-[96px_1fr_82px] sm:items-center">
              <Text type="secondary" className="text-xs">
                {item.label}
              </Text>
              <div className="h-7 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500/80"
                  style={{ width: `${totalPercent}%` }}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${completedPercent}%` }}
                  />
                </div>
              </div>
              <Text strong className="text-right text-xs text-slate-700">
                {item.appointments} lịch
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShiftCard({ shift, bookedCount }: { shift: DoctorShiftItem; bookedCount: number }) {
  const fillPercent =
    shift.maxAppointments === 0
      ? 0
      : Math.min(100, Math.round((bookedCount / shift.maxAppointments) * 100));
  const isAvailable = shift.status === "available" || shift.status === "full";
  const doctorName = shift.doctorName;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isAvailable ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {isAvailable ? <Stethoscope className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Text strong className="truncate text-slate-950">
                {doctorName ? `${shift.doctorTitle ? `${shift.doctorTitle} ` : ""}${doctorName}` : "Chưa phân công bác sĩ"}
              </Text>
              <Tag color={shift.status === "full" ? "orange" : isAvailable ? "green" : "default"}>
                {shift.status === "full"
                  ? "Đã đầy"
                  : shift.status === "available"
                    ? "Sẵn sàng"
                    : shift.status === "off"
                      ? "Nghỉ"
                      : "Đã hủy"}
              </Tag>
            </div>
            <Text type="secondary" className="mt-0.5 block truncate text-xs">
              {shift.doctorSpecialty || "Chuyên môn"} · {shift.roomName || "Chưa có phòng"}
            </Text>
            <Text type="secondary" className="mt-0.5 block truncate text-xs">
              {shift.facilityName || shift.facilityCode || "Cơ sở"} · {shift.startTime} - {shift.endTime}
            </Text>
          </div>
        </div>

        <Text strong className="shrink-0 text-xs text-slate-700">
          {bookedCount}/{shift.maxAppointments}
        </Text>
      </div>

      <Progress
        percent={fillPercent}
        size="small"
        showInfo={false}
        status={fillPercent >= 100 ? "exception" : "normal"}
        className="!mb-0 !mt-3"
      />
    </div>
  );
}

export default function ManagementDashboardPage() {
  const { message } = App.useApp();
  const roles = useAuthStore((state) => state.roles);
  const currentUser = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const dashboardRole = getDashboardRole(roles);
  const [windowValue, setWindowValue] = useState<DashboardWindow>("7-days");
  const [appointmentKeyword, setAppointmentKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardState>(emptyState);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const range = useMemo(() => getWindowRange(windowValue), [windowValue]);
  const canViewSystemStats = dashboardRole === "super_admin" || dashboardRole === "admin";
  const canViewStaffStats = dashboardRole === "super_admin" || dashboardRole === "admin";

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const errors: string[] = [];
    const facilityId = dashboardRole === "super_admin" ? undefined : activeFacilityId ?? undefined;

    const [
      appointmentsResult,
      shiftsResult,
      profilesResult,
      doctorsResult,
      staffsResult,
      facilitiesResult,
    ] = await Promise.allSettled([
      getManagementAppointments({
        facilityId,
        scope: normalizeRoleScope(dashboardRole),
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      }),
      getDoctorShifts({
        facilityId,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
        limit: 100,
      }),
      getManagementPregnancyProfiles({
        page: 1,
        limit: 100,
      }),
      canViewSystemStats
        ? getDoctors({
            page: 1,
            limit: 1,
            facilityId,
          })
        : Promise.resolve({ total: 0 }),
      canViewStaffStats
        ? getStaffsPage({
            page: 1,
            limit: 1,
            facilityId,
            status: "active",
          })
        : Promise.resolve({ total: 0 }),
      canViewSystemStats
        ? getFacilitiesPage({
            page: 1,
            limit: 1,
            status: "active",
          })
        : Promise.resolve({ total: 0 }),
    ]);

    const nextState: DashboardState = { ...emptyState };

    if (appointmentsResult.status === "fulfilled") {
      nextState.appointments = appointmentsResult.value;
    } else {
      errors.push(`Lịch khám: ${getErrorMessage(appointmentsResult.reason)}`);
    }

    if (shiftsResult.status === "fulfilled") {
      nextState.shifts = shiftsResult.value.items;
    } else {
      errors.push(`Ca trực: ${getErrorMessage(shiftsResult.reason)}`);
    }

    if (profilesResult.status === "fulfilled") {
      nextState.profiles = profilesResult.value.items;
    } else {
      errors.push(`Hồ sơ thai kỳ: ${getErrorMessage(profilesResult.reason)}`);
    }

    if (doctorsResult.status === "fulfilled") {
      nextState.doctorsTotal = doctorsResult.value.total ?? 0;
    } else if (canViewSystemStats) {
      errors.push(`Bác sĩ: ${getErrorMessage(doctorsResult.reason)}`);
    }

    if (staffsResult.status === "fulfilled") {
      nextState.staffsTotal = staffsResult.value.total ?? 0;
    } else if (canViewStaffStats) {
      errors.push(`Nhân sự: ${getErrorMessage(staffsResult.reason)}`);
    }

    if (facilitiesResult.status === "fulfilled") {
      nextState.facilitiesTotal = facilitiesResult.value.total ?? 0;
    } else if (canViewSystemStats) {
      errors.push(`Cơ sở: ${getErrorMessage(facilitiesResult.reason)}`);
    }

    nextState.errors = errors;
    setData(nextState);
    setLastRefresh(
      new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
    );
    setLoading(false);
  }, [
    activeFacilityId,
    canViewStaffStats,
    canViewSystemStats,
    dashboardRole,
    range.dateFrom,
    range.dateTo,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard().catch((error) => {
        setLoading(false);
        void message.error(getErrorMessage(error));
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard, message]);

  const appointmentSummary = useMemo(() => {
    const total = data.appointments.length;
    const completed = countByStatus(data.appointments, ["completed"]);
    const active = countByStatus(data.appointments, [
      "booked",
      "confirmed",
      "checked_in",
      "in_progress",
    ]);
    const cancelled = countByStatus(data.appointments, ["cancelled", "no_show"]);
    const waiting = countByStatus(data.appointments, ["pending_payment"]);
    return { total, completed, active, cancelled, waiting };
  }, [data.appointments]);

  const shiftSummary = useMemo(() => {
    const active = data.shifts.filter((shift) => shift.status === "available" || shift.status === "full");
    const full = data.shifts.filter((shift) => shift.status === "full").length;
    const off = data.shifts.filter((shift) => shift.status === "off" || shift.status === "cancelled").length;
    const capacity = active.reduce((sum, shift) => sum + shift.maxAppointments, 0);
    return {
      total: data.shifts.length,
      active: active.length,
      full,
      off,
      capacity,
    };
  }, [data.shifts]);

  const highRiskProfiles = useMemo(
    () => data.profiles.filter((profile) => profile.riskLevel === "high").length,
    [data.profiles],
  );

  const completionRate =
    appointmentSummary.total === 0
      ? 0
      : Math.round((appointmentSummary.completed / appointmentSummary.total) * 100);

  const bookedByShiftId = useMemo(() => {
    const next = new Map<string, number>();

    data.appointments.forEach((appointment) => {
      const matchedShift = data.shifts.find(
        (shift) =>
          shift.doctorId === appointment.doctorId &&
          shift.facilityId === appointment.facilityId &&
          shift.shiftDate === appointment.date &&
          appointment.startTime >= shift.startTime &&
          appointment.startTime < shift.endTime,
      );

      if (matchedShift) {
        next.set(matchedShift.id, (next.get(matchedShift.id) ?? 0) + 1);
      }
    });

    return next;
  }, [data.appointments, data.shifts]);

  const totalBooked = data.appointments.filter(
    (appointment) => !["cancelled", "no_show"].includes(appointment.status),
  ).length;
  const bookingRate =
    shiftSummary.capacity === 0 ? 0 : Math.min(100, Math.round((totalBooked / shiftSummary.capacity) * 100));
  const vacantShifts = data.shifts.filter(
    (shift) => (shift.status === "available" || shift.status === "full") && !shift.doctorName,
  ).length;
  const activeDoctors = new Set(
    data.shifts
      .filter((shift) => shift.status === "available" || shift.status === "full")
      .map((shift) => shift.doctorId || shift.staffId)
      .filter(Boolean),
  ).size;

  const appointmentTrend = useMemo<DailyMetric[]>(() => {
    return Array.from({ length: range.days }, (_, index) => {
      const date = formatDateKey(addDays(new Date(range.dateFrom), index));
      const appointments = data.appointments.filter((appointment) => appointment.date === date);

      return {
        date,
        label: range.days === 1 ? "Hôm nay" : formatDisplayDate(date),
        appointments: appointments.length,
        completed: appointments.filter((appointment) => appointment.status === "completed").length,
      };
    });
  }, [data.appointments, range.dateFrom, range.days]);

  const visibleAppointments = useMemo(() => {
    const keyword = appointmentKeyword.trim().toLowerCase();
    if (!keyword) return data.appointments;

    return data.appointments.filter(
      (appointment) =>
        includesKeyword(appointment.patientName, keyword) ||
        includesKeyword(appointment.patientPhone, keyword) ||
        includesKeyword(appointment.serviceName, keyword) ||
        includesKeyword(appointment.doctorName, keyword) ||
        includesKeyword(appointment.facilityName, keyword) ||
        includesKeyword(appointment.pregnancyProfileCode, keyword),
    );
  }, [appointmentKeyword, data.appointments]);

  const visibleShifts = useMemo(
    () => data.shifts.filter((shift) => shift.status === "available" || shift.status === "full"),
    [data.shifts],
  );

  const dashboardAlerts = useMemo<DashboardAlert[]>(() => {
    const alerts: DashboardAlert[] = [];

    if (appointmentSummary.waiting > 0) {
      alerts.push({
        id: "pending-payment",
        level: "warning",
        title: `${appointmentSummary.waiting} lịch chờ thanh toán`,
        description: "Các lịch này cần được xác nhận thanh toán trước khi tiếp nhận.",
        meta: `${range.dateFrom} đến ${range.dateTo}`,
      });
    }

    if (appointmentSummary.cancelled > 0) {
      alerts.push({
        id: "cancelled",
        level: "critical",
        title: `${appointmentSummary.cancelled} lịch hủy hoặc không đến`,
        description: "Kiểm tra lý do hủy để điều phối lại suất khám còn trống.",
        meta: "Dữ liệu lấy từ lịch khám thật",
      });
    }

    if (highRiskProfiles > 0) {
      alerts.push({
        id: "high-risk",
        level: "critical",
        title: `${highRiskProfiles} hồ sơ thai kỳ nguy cơ cao`,
        description: "Ưu tiên theo dõi hồ sơ có riskLevel high trong danh sách hồ sơ thai kỳ.",
        meta: "Dữ liệu hồ sơ thai kỳ",
      });
    }

    if (shiftSummary.full > 0 || vacantShifts > 0) {
      alerts.push({
        id: "shift-capacity",
        level: shiftSummary.full > 0 ? "warning" : "info",
        title: shiftSummary.full > 0 ? `${shiftSummary.full} ca trực đã đầy` : `${vacantShifts} ca chưa có bác sĩ`,
        description:
          shiftSummary.full > 0
            ? "Một số ca đã hết công suất, cần cân nhắc mở thêm ca nếu còn nhu cầu."
            : "Kiểm tra lại lịch phân công trước khi mở thêm lịch đặt hẹn.",
        meta: "Dữ liệu ca trực",
      });
    }

    return alerts.slice(0, 3);
  }, [
    appointmentSummary.cancelled,
    appointmentSummary.waiting,
    highRiskProfiles,
    range.dateFrom,
    range.dateTo,
    shiftSummary.full,
    vacantShifts,
  ]);

  const facilityUtilization = useMemo<FacilityUtilization[]>(() => {
    const facilities = new Map<string, FacilityUtilization>();

    data.shifts.forEach((shift) => {
      const current =
        facilities.get(shift.facilityId) ??
        {
          facilityId: shift.facilityId,
          facilityName: shift.facilityName || "Cơ sở",
          facilityCode: shift.facilityCode || "-",
          appointments: 0,
          maxAppointments: 0,
          activeDoctors: 0,
          roomsInUse: 0,
          totalRooms: 0,
        };

      current.maxAppointments += shift.status === "available" || shift.status === "full" ? shift.maxAppointments : 0;
      current.totalRooms += shift.roomId ? 1 : 0;
      current.roomsInUse += shift.status === "available" || shift.status === "full" ? 1 : 0;
      facilities.set(shift.facilityId, current);
    });

    data.appointments.forEach((appointment) => {
      const current =
        facilities.get(appointment.facilityId) ??
        {
          facilityId: appointment.facilityId,
          facilityName: appointment.facilityName || "Cơ sở",
          facilityCode: "-",
          appointments: 0,
          maxAppointments: 0,
          activeDoctors: 0,
          roomsInUse: 0,
          totalRooms: 0,
        };

      if (!["cancelled", "no_show"].includes(appointment.status)) {
        current.appointments += 1;
      }
      facilities.set(appointment.facilityId, current);
    });

    return Array.from(facilities.values()).map((facility) => ({
      ...facility,
      activeDoctors: new Set(
        data.shifts
          .filter(
            (shift) =>
              shift.facilityId === facility.facilityId &&
              (shift.status === "available" || shift.status === "full"),
          )
          .map((shift) => shift.doctorId || shift.staffId)
          .filter(Boolean),
      ).size,
    }));
  }, [data.appointments, data.shifts]);

  const appointmentColumns: ColumnsType<ManagementAppointment> = [
    {
      title: "Lịch khám",
      key: "appointment",
      render: (_, appointment) => (
        <div>
          <Text strong>{appointment.patientName || "Chưa có tên"}</Text>
          <Text type="secondary" className="block text-xs">
            {appointment.date} · {appointment.startTime} - {appointment.endTime}
          </Text>
        </div>
      ),
    },
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      render: (value: string | undefined) => value || "-",
    },
    {
      title: "Bác sĩ",
      key: "doctor",
      render: (_, appointment) => appointment.doctorName || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ManagementAppointmentStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Tổng quan theo vai trò, dùng dữ liệu thật từ hệ thống."
      />

      <div className="mt-6 flex flex-col gap-5">
        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <Tag color="blue" className="mb-2">
                {roleLabels[dashboardRole]}
              </Tag>
              <Title level={4} className="!mb-1 !text-slate-950">
                Xin chào, {currentUser?.name ?? "tài khoản quản lý"}
              </Title>
              <Text type="secondary">{roleDescriptions[dashboardRole]}</Text>
            </div>

            <Space wrap>
              <Select<DashboardWindow>
                value={windowValue}
                className="w-[170px]"
                options={periodOptions}
                onChange={setWindowValue}
              />
              <Tooltip title={lastRefresh ? `Cập nhật lần cuối lúc ${lastRefresh}` : "Chưa tải dữ liệu"}>
                <Button
                  icon={<RefreshCw className="h-4 w-4" />}
                  loading={loading}
                  onClick={() => void loadDashboard()}
                >
                  Làm mới
                </Button>
              </Tooltip>
            </Space>
          </div>
          <Text type="secondary" className="mt-3 block text-xs">
            Khoảng dữ liệu: {range.dateFrom} đến {range.dateTo}
            {lastRefresh ? ` · Cập nhật lúc ${lastRefresh}` : ""}
          </Text>
        </Card>

        {data.errors.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            message="Một số API không tải được"
            description={data.errors.join(" | ")}
          />
        ) : null}

        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatCard
                title="Lịch hẹn trong kỳ"
                value={appointmentSummary.total}
                icon={<CalendarCheck className="h-5 w-5" />}
                trend={`${completionRate}% hoàn thành`}
                trendDirection={completionRate >= 60 ? "up" : "down"}
                helper={`${range.days} ngày được chọn`}
                tone="blue"
              />
              <StatCard
                title="Thai phụ đang theo dõi"
                value={data.profiles.length}
                icon={<Baby className="h-5 w-5" />}
                trend={highRiskProfiles > 0 ? `${highRiskProfiles} nguy cơ cao` : "Ổn định"}
                trendDirection={highRiskProfiles > 0 ? "down" : "up"}
                helper={canViewSystemStats ? "trên phạm vi được phép" : "theo dữ liệu hồ sơ"}
                tone="violet"
              />
              <StatCard
                title="Bác sĩ đang trực"
                value={activeDoctors}
                suffix={`/ ${visibleShifts.length}`}
                icon={<UserRoundCheck className="h-5 w-5" />}
                trend={vacantShifts > 0 ? `${vacantShifts} ca trống` : "Đủ nhân sự"}
                trendDirection={vacantShifts > 0 ? "down" : "up"}
                helper={`${shiftSummary.capacity} suất khám khả dụng`}
                tone="emerald"
              />
            </div>

            <Card
              className="border-slate-200 bg-white"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Xu hướng lịch hẹn
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    So sánh tổng số lịch hẹn và số lượt đã hoàn thành.
                  </p>
                </div>
              }
              extra={<Tag color="blue">{getPeriodLabel(windowValue)}</Tag>}
            >
              <AppointmentTrendChart data={appointmentTrend} />
            </Card>

            <Card
              className="border-slate-200 bg-white"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Tình trạng lịch hẹn
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    Phân bổ lịch hẹn, tỷ lệ hoàn thành và công suất trong khoảng ngày.
                  </p>
                </div>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <Text type="secondary" className="text-xs">
                    Hoàn thành
                  </Text>
                  <div className="mt-1 text-2xl font-bold text-slate-950">
                    {appointmentSummary.completed}
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <Text type="secondary" className="text-xs">
                    Đang xử lý
                  </Text>
                  <div className="mt-1 text-2xl font-bold text-slate-950">
                    {appointmentSummary.active}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Text type="secondary" className="text-xs">
                    Đã hủy
                  </Text>
                  <div className="mt-1 text-2xl font-bold text-slate-950">
                    {appointmentSummary.cancelled}
                  </div>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
                  <Text type="secondary" className="text-xs">
                    Tỷ lệ lấp đầy
                  </Text>
                  <div className="mt-1 text-2xl font-bold text-slate-950">
                    {bookingRate}%
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <Text>Đã hoàn thành</Text>
                    <Text strong>
                      {appointmentSummary.completed}/{appointmentSummary.total}
                    </Text>
                  </div>
                  <Progress percent={completionRate} showInfo={false} size="small" status="success" />
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <Text>Công suất lịch khám</Text>
                    <Text strong>
                      {totalBooked}/{shiftSummary.capacity}
                    </Text>
                  </div>
                  <Progress percent={bookingRate} showInfo={false} size="small" />
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div>
                      <Text strong className="block text-slate-950">
                        {vacantShifts} ca chưa có bác sĩ
                      </Text>
                      <Text type="secondary" className="mt-1 block text-xs leading-5">
                        Kiểm tra lại lịch phân công trước khi mở lịch đặt hẹn.
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {canViewSystemStats ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-blue-700" />
                    <div>
                      <Text type="secondary" className="block text-xs">
                        Cơ sở hoạt động
                      </Text>
                      <Text strong className="text-xl">
                        {data.facilitiesTotal}
                      </Text>
                    </div>
                  </div>
                </Card>
                <Card className="border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <UserRoundCheck className="h-5 w-5 text-emerald-700" />
                    <div>
                      <Text type="secondary" className="block text-xs">
                        Bác sĩ
                      </Text>
                      <Text strong className="text-xl">
                        {data.doctorsTotal}
                      </Text>
                    </div>
                  </div>
                </Card>
                <Card className="border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-violet-700" />
                    <div>
                      <Text type="secondary" className="block text-xs">
                        Nhân sự đang hoạt động
                      </Text>
                      <Text strong className="text-xl">
                        {data.staffsTotal}
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>
            ) : null}

            <Card
              className="border-slate-200 bg-white"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Lịch hẹn trong khoảng ngày
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    Danh sách lịch hẹn phù hợp role, cơ sở và khoảng ngày đang chọn.
                  </p>
                </div>
              }
            >
              <Input
                allowClear
                value={appointmentKeyword}
                prefix={<Search className="h-4 w-4 text-slate-400" />}
                placeholder="Tìm thai phụ, dịch vụ, bác sĩ, cơ sở..."
                className="mb-4 max-w-[420px]"
                onChange={(event) => setAppointmentKeyword(event.target.value)}
              />

              <Table<ManagementAppointment>
                rowKey="id"
                size="middle"
                columns={appointmentColumns}
                dataSource={visibleAppointments}
                pagination={{
                  pageSize: 8,
                  showTotal: (total, rangeValues) => `${rangeValues[0]}-${rangeValues[1]} / ${total} lịch hẹn`,
                }}
                scroll={{ x: 960 }}
                locale={{ emptyText: <Empty description="Không có lịch hẹn phù hợp bộ lọc." /> }}
              />
            </Card>

            <Card
              className="border-slate-200 bg-white"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Ca trực
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    Theo dõi bác sĩ, phòng khám và công suất từng ca.
                  </p>
                </div>
              }
              extra={<Badge count={vacantShifts} showZero color={vacantShifts > 0 ? "#f59e0b" : "#10b981"} />}
            >
              {visibleShifts.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                  {visibleShifts.map((shift) => (
                    <ShiftCard key={shift.id} shift={shift} bookedCount={bookedByShiftId.get(shift.id) ?? 0} />
                  ))}
                </div>
              ) : (
                <Empty description="Không có ca trực trong khoảng ngày này." />
              )}
            </Card>

            <Card
              className="border-slate-200 bg-white"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Công việc cần xử lý
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    Các cảnh báo vận hành được tính từ dữ liệu thật.
                  </p>
                </div>
              }
              extra={<Badge count={dashboardAlerts.length} color={dashboardAlerts.length > 0 ? "#ef4444" : "#10b981"} />}
            >
              {dashboardAlerts.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-3">
                  {dashboardAlerts.map((item) => {
                    const visual = getAlertVisual(item.level);

                    return (
                      <div key={item.id} className={`rounded-xl border p-4 ${visual.borderClass}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${visual.iconClass}`}>
                              {visual.icon}
                            </span>
                            <div className="min-w-0">
                              <Text strong className="block text-slate-950">
                                {item.title}
                              </Text>
                              <Text type="secondary" className="mt-1 block text-sm leading-6">
                                {item.description}
                              </Text>
                              <Text type="secondary" className="mt-1.5 block text-xs">
                                {item.meta}
                              </Text>
                            </div>
                          </div>
                          <div className="shrink-0">{visual.tag}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty description="Không có công việc cần xử lý." />
              )}
            </Card>

            <Card
              className="border-slate-200 bg-white"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Hiệu suất cơ sở
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    Mức sử dụng lịch khám, phòng và nhân sự theo dữ liệu đã tải.
                  </p>
                </div>
              }
            >
              {facilityUtilization.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {facilityUtilization.map((item) => {
                    const appointmentPercent =
                      item.maxAppointments === 0
                        ? 0
                        : Math.min(100, Math.round((item.appointments / item.maxAppointments) * 100));
                    const roomPercent =
                      item.totalRooms === 0 ? 0 : Math.min(100, Math.round((item.roomsInUse / item.totalRooms) * 100));

                    return (
                      <div key={item.facilityId} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                              <Building2 className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <Text strong className="block truncate text-slate-950">
                                {item.facilityName}
                              </Text>
                              <Text type="secondary" className="block text-xs">
                                {item.facilityCode} · {item.activeDoctors} bác sĩ đang trực
                              </Text>
                            </div>
                          </div>
                          <Tag color="green">Đang hoạt động</Tag>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                              <Text type="secondary">Công suất lịch</Text>
                              <Text strong>
                                {item.appointments}/{item.maxAppointments}
                              </Text>
                            </div>
                            <Progress percent={appointmentPercent} showInfo={false} size="small" />
                          </div>
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                              <Text type="secondary">Phòng đang sử dụng</Text>
                              <Text strong>
                                {item.roomsInUse}/{item.totalRooms}
                              </Text>
                            </div>
                            <Progress percent={roomPercent} showInfo={false} size="small" status="success" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty description="Không có dữ liệu cơ sở phù hợp." />
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <Users className="mx-auto h-5 w-5 text-slate-500" />
                  <div className="mt-2 text-xl font-bold text-slate-950">
                    {canViewStaffStats ? data.staffsTotal : activeDoctors}
                  </div>
                  <Text type="secondary" className="text-xs">
                    Nhân sự hoạt động
                  </Text>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <HeartPulse className="mx-auto h-5 w-5 text-slate-500" />
                  <div className="mt-2 text-xl font-bold text-slate-950">
                    {completionRate}%
                  </div>
                  <Text type="secondary" className="text-xs">
                    Lịch khám hoàn thành
                  </Text>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <div>
                    <Text type="secondary" className="block text-xs">
                      Chờ thanh toán
                    </Text>
                    <Text strong className="text-lg text-slate-950">
                      {appointmentSummary.waiting} lịch
                    </Text>
                  </div>
                </div>
              </Card>
              <Card className="border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <Text type="secondary" className="block text-xs">
                      Tỷ lệ hoàn thành lịch
                    </Text>
                    <Text strong className="text-lg text-slate-950">
                      {completionRate}%
                    </Text>
                  </div>
                </div>
              </Card>
              <Card className="border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Stethoscope className="h-4 w-4" />
                  </span>
                  <div>
                    <Text type="secondary" className="block text-xs">
                      Bác sĩ có lịch
                    </Text>
                    <Text strong className="text-lg text-slate-950">
                      {activeDoctors} bác sĩ
                    </Text>
                  </div>
                </div>
              </Card>
              <Card className="border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <Text type="secondary" className="block text-xs">
                      Phòng đang sử dụng
                    </Text>
                    <Text strong className="text-lg text-slate-950">
                      {facilityUtilization.reduce((sum, item) => sum + item.roomsInUse, 0)} /{" "}
                      {facilityUtilization.reduce((sum, item) => sum + item.totalRooms, 0)} phòng
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
