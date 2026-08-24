"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Progress,
  Segmented,
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
  DollarSign,
  Download,
  HeartPulse,
  RefreshCw,
  Search,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
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
import type { Facility } from "@/management/features/facilities/facilities.types";
import { getManagementPregnancyProfiles } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.api";
import type { ManagementPregnancyProfile } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";
import { getStaffsPage } from "@/management/features/staffs/staffs.api";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

type DashboardRole = "super_admin" | "admin" | "doctor" | "nurse" | "staff";
type DashboardWindow = "day" | "week" | "30-days" | "custom";
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

type ServiceMetric = {
  serviceId: string;
  serviceName: string;
  appointments: number;
  completed: number;
  revenue: number;
};

type DashboardStatCard = {
  title: string;
  value: string | number;
  suffix?: string;
  helper: string;
  icon: ReactNode;
  trend: string;
  trendDirection: "up" | "down";
  tone: StatTone;
  onClick?: () => void;
};

type RoleDashboardConfig = {
  label: string;
  description: string;
  scopeLabel: string;
  primaryMetric: string;
  secondaryMetric: string;
  shiftMetric: string;
  showSystemCards: boolean;
  showFacilityUtilization: boolean;
  showDoctorColumn: boolean;
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

const roleDashboardConfig: Record<DashboardRole, RoleDashboardConfig> = {
  super_admin: {
    label: "Super Admin",
    description: "Tổng quan toàn hệ thống: cơ sở, nhân sự, bác sĩ, lịch khám và hồ sơ thai kỳ.",
    scopeLabel: "Toàn hệ thống",
    primaryMetric: "Lịch hẹn toàn hệ thống",
    secondaryMetric: "Thai phụ đang theo dõi",
    shiftMetric: "Bác sĩ đang trực",
    showSystemCards: true,
    showFacilityUtilization: true,
    showDoctorColumn: true,
  },
  admin: {
    label: "Quản trị cơ sở",
    description: "Tổng quan cơ sở đang chọn: lịch khám, ca trực, bác sĩ, nhân sự và hồ sơ thai kỳ.",
    scopeLabel: "Cơ sở đang chọn",
    primaryMetric: "Lịch hẹn của cơ sở",
    secondaryMetric: "Hồ sơ thai kỳ tại cơ sở",
    shiftMetric: "Nhân sự trực tại cơ sở",
    showSystemCards: true,
    showFacilityUtilization: true,
    showDoctorColumn: true,
  },
  doctor: {
    label: "Bác sĩ",
    description: "Tập trung vào lịch khám của bạn, ca trực và hồ sơ thai kỳ cần theo dõi chuyên môn.",
    scopeLabel: "Dữ liệu của bác sĩ",
    primaryMetric: "Lịch khám của tôi",
    secondaryMetric: "Hồ sơ cần theo dõi",
    shiftMetric: "Ca trực của tôi",
    showSystemCards: false,
    showFacilityUtilization: false,
    showDoctorColumn: false,
  },
  nurse: {
    label: "Điều dưỡng",
    description: "Tập trung vào lịch tiếp nhận, ca trực và các cảnh báo cần hỗ trợ thai phụ.",
    scopeLabel: "Cơ sở đang chọn",
    primaryMetric: "Lịch cần hỗ trợ",
    secondaryMetric: "Thai phụ cần chăm sóc",
    shiftMetric: "Ca trực hỗ trợ",
    showSystemCards: false,
    showFacilityUtilization: false,
    showDoctorColumn: true,
  },
  staff: {
    label: "Nhân viên vận hành",
    description: "Tập trung vào đặt lịch, xác nhận thanh toán và điều phối ca khám trong ngày.",
    scopeLabel: "Cơ sở đang chọn",
    primaryMetric: "Lịch cần xử lý",
    secondaryMetric: "Hồ sơ liên quan",
    shiftMetric: "Ca khám khả dụng",
    showSystemCards: false,
    showFacilityUtilization: false,
    showDoctorColumn: true,
  },
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

const shiftStatusLabels: Record<DoctorShiftItem["status"], string> = {
  available: "Còn trống",
  full: "Đã đầy",
  cancelled: "Đã hủy",
  off: "Nghỉ",
};

const periodOptions: { value: DashboardWindow; label: string }[] = [
  { value: "day", label: "Theo ngày" },
  { value: "week", label: "Theo tuần" },
  { value: "30-days", label: "30 ngày gần nhất" },
  { value: "custom", label: "Tùy chọn" },
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

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function getDaysBetween(dateFrom: string, dateTo: string) {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const diff = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(diff, 62));
}

function getWindowRange(
  window: DashboardWindow,
  selectedDate: Date,
  customRange: [Date, Date],
) {
  if (window === "day") {
    const date = formatDateKey(selectedDate);
    return {
      dateFrom: date,
      dateTo: date,
      days: 1,
    };
  }

  if (window === "week") {
    const dateFrom = formatDateKey(startOfWeek(selectedDate));
    const dateTo = formatDateKey(addDays(startOfWeek(selectedDate), 6));
    return {
      dateFrom,
      dateTo,
      days: 7,
    };
  }

  if (window === "custom") {
    const dateFrom = formatDateKey(customRange[0]);
    const dateTo = formatDateKey(customRange[1]);
    return {
      dateFrom,
      dateTo,
      days: getDaysBetween(dateFrom, dateTo),
    };
  }

  const today = new Date();
  const days = 30;
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

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator === 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatExportDateTime(value = new Date()) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function isRevenueAppointment(appointment: ManagementAppointment) {
  return !["cancelled", "no_show", "pending_payment"].includes(appointment.status);
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = `\ufeff${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  onClick,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  helper: string;
  icon: ReactNode;
  trend: string;
  trendDirection: "up" | "down";
  tone: StatTone;
  onClick?: () => void;
}) {
  const toneClasses = statToneClasses[tone];

  return (
    <Card
      hoverable={Boolean(onClick)}
      className={`h-full overflow-hidden ${toneClasses.card} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
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

function AppointmentTrendChart({
  data,
  onDateClick,
}: {
  data: DailyMetric[];
  onDateClick?: (date: string) => void;
}) {
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
            <button
              key={item.date}
              type="button"
              className="grid w-full gap-2 rounded-lg text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 sm:grid-cols-[96px_1fr_82px] sm:items-center"
              onClick={() => onDateClick?.(item.date)}
            >
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
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ManagementDashboardPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const roles = useAuthStore((state) => state.roles);
  const currentUser = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const dashboardRole = getDashboardRole(roles);
  const roleConfig = roleDashboardConfig[dashboardRole];
  const [windowValue, setWindowValue] = useState<DashboardWindow>("week");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [customRange, setCustomRange] = useState<[Date, Date]>(() => [
    addDays(new Date(), -6),
    new Date(),
  ]);
  const [appointmentKeyword, setAppointmentKeyword] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState("all");
  const [facilityOptions, setFacilityOptions] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardState>(emptyState);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const range = useMemo(
    () => getWindowRange(windowValue, selectedDate, customRange),
    [customRange, selectedDate, windowValue],
  );
  const selectedDateKey = useMemo(
    () => formatDateKey(selectedDate),
    [selectedDate],
  );
  const canViewSystemStats = roleConfig.showSystemCards;
  const canViewStaffStats = roleConfig.showSystemCards;
  const canOpenShiftManagement = ["super_admin", "admin", "doctor", "nurse"].includes(dashboardRole);
  const canOpenRoomManagement = ["super_admin", "admin"].includes(dashboardRole);
  const canOpenPregnancyProfiles = ["doctor", "staff"].includes(dashboardRole);
  const canViewRevenueStats = ["super_admin", "admin"].includes(dashboardRole);
  const dashboardFacilityId =
    dashboardRole === "super_admin"
      ? selectedFacilityId === "all"
        ? undefined
        : selectedFacilityId
      : activeFacilityId ?? undefined;

  const buildAppointmentUrl = useCallback(
    (overrides: Record<string, string | undefined> = {}) => {
      const params = new URLSearchParams();
      params.set("dateFrom", overrides.dateFrom ?? selectedDateKey);
      params.set("dateTo", overrides.dateTo ?? overrides.dateFrom ?? selectedDateKey);

      if (dashboardFacilityId) {
        params.set("facilityId", dashboardFacilityId);
      }

      if (dashboardRole === "doctor") {
        params.set("scope", "mine");
      }

      Object.entries(overrides).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      return `/management/appointments?${params.toString()}`;
    },
    [dashboardFacilityId, dashboardRole, selectedDateKey],
  );

  const goToAppointments = useCallback(
    (overrides: Record<string, string | undefined> = {}) => {
      router.push(buildAppointmentUrl(overrides));
    },
    [buildAppointmentUrl, router],
  );

  const goToManagement = useCallback(
    (path: string, params?: Record<string, string | undefined>) => {
      const query = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      router.push(query.size > 0 ? `${path}?${query.toString()}` : path);
    },
    [router],
  );

  const handleSelectedDateChange = (value: Dayjs | null) => {
    if (value) {
      setSelectedDate(value.toDate());
    }
  };

  const handleCustomRangeChange = (values: null | [Dayjs | null, Dayjs | null]) => {
    if (values?.[0] && values[1]) {
      setCustomRange([values[0].toDate(), values[1].toDate()]);
    }
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const errors: string[] = [];
    const facilityId = dashboardFacilityId;

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
            limit: dashboardRole === "super_admin" ? 100 : 1,
            status: "active",
          })
        : Promise.resolve({ items: [], total: 0, page: 1, limit: 1, totalPages: 0 }),
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
      if (dashboardRole === "super_admin") {
        setFacilityOptions(facilitiesResult.value.items);
      }
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
    canViewStaffStats,
    canViewSystemStats,
    dashboardFacilityId,
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

  const revenueSummary = useMemo(() => {
    const billableAppointments = data.appointments.filter(isRevenueAppointment);
    const estimatedRevenue = billableAppointments.reduce(
      (sum, appointment) => sum + parseMoney(appointment.servicePrice),
      0,
    );
    const completedRevenue = data.appointments
      .filter((appointment) => appointment.status === "completed")
      .reduce((sum, appointment) => sum + parseMoney(appointment.servicePrice), 0);
    const averageRevenue =
      billableAppointments.length === 0
        ? 0
        : Math.round(estimatedRevenue / billableAppointments.length);

    return {
      estimatedRevenue,
      completedRevenue,
      averageRevenue,
      billableCount: billableAppointments.length,
    };
  }, [data.appointments]);

  const serviceMetrics = useMemo<ServiceMetric[]>(() => {
    const services = new Map<string, ServiceMetric>();

    data.appointments.forEach((appointment) => {
      const serviceId = appointment.serviceId || "unknown";
      const current =
        services.get(serviceId) ??
        {
          serviceId,
          serviceName: appointment.serviceName || "Chưa cập nhật dịch vụ",
          appointments: 0,
          completed: 0,
          revenue: 0,
        };

      current.appointments += 1;
      if (appointment.status === "completed") current.completed += 1;
      if (isRevenueAppointment(appointment)) {
        current.revenue += parseMoney(appointment.servicePrice);
      }
      services.set(serviceId, current);
    });

    return Array.from(services.values()).sort((a, b) => b.revenue - a.revenue || b.appointments - a.appointments);
  }, [data.appointments]);

  const appointmentStatusMetrics = useMemo(() => {
    return (Object.keys(statusLabels) as ManagementAppointmentStatus[])
      .map((status) => {
        const appointments = data.appointments.filter((appointment) => appointment.status === status);
        const revenue = appointments
          .filter(isRevenueAppointment)
          .reduce((sum, appointment) => sum + parseMoney(appointment.servicePrice), 0);

        return {
          status,
          label: statusLabels[status],
          appointments: appointments.length,
          revenue,
        };
      })
      .filter((item) => item.appointments > 0);
  }, [data.appointments]);

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

  const exportDashboard = useCallback(() => {
    const selectedFacility = dashboardFacilityId
      ? facilityOptions.find((facility) => String(facility.id) === String(dashboardFacilityId))
      : null;
    const facilityLabel =
      dashboardRole === "super_admin" && selectedFacilityId === "all"
        ? "Tất cả cơ sở"
        : selectedFacility
          ? `${selectedFacility.code} - ${selectedFacility.name}`
          : dashboardFacilityId ?? "-";
    const exportRows: unknown[][] = [
      ["DASHBOARD"],
      ["Khoảng ngày", `${range.dateFrom} - ${range.dateTo}`],
      ["Kiểu thống kê", getPeriodLabel(windowValue)],
      ["Phạm vi", roleConfig.scopeLabel],
      ["Vai trò", roleConfig.label],
      ["Cơ sở", facilityLabel],
      ["Người xuất", currentUser?.name ?? "-"],
      ["Email", currentUser?.email ?? "-"],
      ["Thời điểm xuất", formatExportDateTime()],
      [],
      ["TỔNG QUAN"],
      ["Chỉ số", "Giá trị", "Ghi chú"],
      ["Tổng lịch", appointmentSummary.total, `${range.days} ngày được chọn`],
      ["Lịch đang xử lý", appointmentSummary.active, "Đã đặt, xác nhận, check-in hoặc đang khám"],
      ["Lịch hoàn thành", appointmentSummary.completed, `${completionRate}% hoàn thành`],
      ["Lịch chờ thanh toán", appointmentSummary.waiting, "Cần xác nhận thanh toán"],
      ["Lịch hủy/không đến", appointmentSummary.cancelled, "Hủy hoặc no-show"],
      ["Tổng lịch tính doanh thu", revenueSummary.billableCount, "Không gồm chờ thanh toán, hủy, no-show"],
      ["Doanh thu ước tính", revenueSummary.estimatedRevenue, formatCurrency(revenueSummary.estimatedRevenue)],
      ["Doanh thu hoàn thành", revenueSummary.completedRevenue, formatCurrency(revenueSummary.completedRevenue)],
      ["Doanh thu trung bình/lịch", revenueSummary.averageRevenue, formatCurrency(revenueSummary.averageRevenue)],
      ["Tổng ca trực", shiftSummary.total, "Tất cả trạng thái"],
      ["Ca đang mở", shiftSummary.active, "Còn trống hoặc đã đầy"],
      ["Ca đã đầy", shiftSummary.full, ""],
      ["Ca nghỉ/hủy", shiftSummary.off, ""],
      ["Công suất suất khám", shiftSummary.capacity, `${bookingRate}% đã đặt`],
      ["Bác sĩ đang trực", activeDoctors, ""],
      ["Ca chưa có bác sĩ", vacantShifts, ""],
      ["Hồ sơ thai kỳ", data.profiles.length, ""],
      ["Hồ sơ nguy cơ cao", highRiskProfiles, ""],
      ["Tổng bác sĩ", data.doctorsTotal, ""],
      ["Tổng nhân viên", data.staffsTotal, ""],
      ["Tổng cơ sở", data.facilitiesTotal, ""],
      [],
      ["TRẠNG THÁI LỊCH"],
      ["Trạng thái", "Số lịch", "Tỷ lệ", "Doanh thu ước tính"],
      ...appointmentStatusMetrics.map((item) => [
        item.label,
        item.appointments,
        formatPercent(item.appointments, appointmentSummary.total),
        item.revenue,
      ]),
      [],
      ["XU HƯỚNG THEO NGÀY"],
      ["Ngày", "Nhãn", "Số lịch", "Hoàn thành", "Tỷ lệ hoàn thành"],
      ...appointmentTrend.map((item) => [
        item.date,
        item.label,
        item.appointments,
        item.completed,
        formatPercent(item.completed, item.appointments),
      ]),
      [],
      ["THỐNG KÊ DỊCH VỤ"],
      ["Mã dịch vụ", "Dịch vụ", "Số lịch", "Hoàn thành", "Tỷ lệ hoàn thành", "Doanh thu ước tính", "Trung bình/lịch"],
      ...serviceMetrics.map((item) => [
        item.serviceId,
        item.serviceName,
        item.appointments,
        item.completed,
        formatPercent(item.completed, item.appointments),
        item.revenue,
        item.appointments === 0 ? 0 : Math.round(item.revenue / item.appointments),
      ]),
      [],
      ["HIỆU SUẤT CƠ SỞ"],
      ["Mã cơ sở", "Cơ sở", "Số lịch", "Công suất", "Tỷ lệ đặt", "Bác sĩ đang trực", "Phòng đang dùng", "Tổng phòng/ca"],
      ...facilityUtilization.map((item) => [
        item.facilityCode,
        item.facilityName,
        item.appointments,
        item.maxAppointments,
        formatPercent(item.appointments, item.maxAppointments),
        item.activeDoctors,
        item.roomsInUse,
        item.totalRooms,
      ]),
      [],
      ["CA TRỰC"],
      [
        "Mã ca",
        "Ngày",
        "Bắt đầu",
        "Kết thúc",
        "Cơ sở",
        "Phòng",
        "Loại phòng",
        "Bác sĩ",
        "Chuyên khoa",
        "Trạng thái",
        "Đã đặt",
        "Công suất",
      ],
      ...data.shifts.map((shift) => [
        shift.id,
        shift.shiftDate,
        shift.startTime,
        shift.endTime,
        shift.facilityName,
        shift.roomName,
        shift.roomTypeName || shift.roomType,
        [shift.doctorTitle, shift.doctorName].filter(Boolean).join(" "),
        shift.doctorSpecialty,
        shiftStatusLabels[shift.status],
        shift.bookedAppointments,
        shift.maxAppointments,
      ]),
      [],
      ["CẢNH BÁO"],
      ["Mức", "Tiêu đề", "Mô tả", "Thông tin"],
      ...dashboardAlerts.map((alert) => [
        alert.level,
        alert.title,
        alert.description,
        alert.meta,
      ]),
      [],
      ["DANH SÁCH LỊCH CHI TIẾT"],
      [
        "Mã lịch",
        "Ngày",
        "Giờ bắt đầu",
        "Giờ kết thúc",
        "Thai phụ",
        "SĐT",
        "Email",
        "Mã hồ sơ thai",
        "Cơ sở",
        "Phòng",
        "Mã dịch vụ",
        "Dịch vụ",
        "Bác sĩ",
        "Chuyên khoa bác sĩ",
        "Trạng thái",
        "Trạng thái gốc",
        "Giá",
        "Đã check-in lúc",
        "Lý do hủy",
      ],
      ...visibleAppointments.map((appointment) => [
        appointment.id,
        appointment.date,
        appointment.startTime,
        appointment.endTime,
        appointment.patientName,
        appointment.patientPhone,
        appointment.patientEmail,
        appointment.pregnancyProfileCode,
        appointment.facilityName,
        appointment.roomName,
        appointment.serviceId,
        appointment.serviceName,
        [appointment.doctorTitle, appointment.doctorName].filter(Boolean).join(" "),
        appointment.doctorSpecialty,
        statusLabels[appointment.status],
        appointment.status,
        parseMoney(appointment.servicePrice),
        appointment.checkedInAt,
        appointment.cancelReason,
      ]),
    ];

    downloadCsv(`dashboard-${range.dateFrom}-${range.dateTo}.csv`, exportRows);
  }, [
    activeDoctors,
    appointmentStatusMetrics,
    appointmentSummary.active,
    appointmentSummary.cancelled,
    appointmentSummary.completed,
    appointmentSummary.total,
    appointmentSummary.waiting,
    appointmentTrend,
    bookingRate,
    completionRate,
    currentUser?.email,
    currentUser?.name,
    dashboardAlerts,
    dashboardFacilityId,
    dashboardRole,
    data.doctorsTotal,
    data.facilitiesTotal,
    data.profiles.length,
    data.shifts,
    data.staffsTotal,
    facilityOptions,
    facilityUtilization,
    highRiskProfiles,
    range.dateFrom,
    range.dateTo,
    range.days,
    revenueSummary.averageRevenue,
    revenueSummary.billableCount,
    revenueSummary.completedRevenue,
    revenueSummary.estimatedRevenue,
    roleConfig.label,
    roleConfig.scopeLabel,
    selectedFacilityId,
    serviceMetrics,
    shiftSummary.active,
    shiftSummary.capacity,
    shiftSummary.full,
    shiftSummary.off,
    shiftSummary.total,
    vacantShifts,
    visibleAppointments,
    windowValue,
  ]);

  const roleStatCards = useMemo(() => {
    const cards: DashboardStatCard[] = [
      {
        title: roleConfig.primaryMetric,
        value: appointmentSummary.total,
        icon: <CalendarCheck className="h-5 w-5" />,
        trend: `${completionRate}% hoàn thành`,
        trendDirection: completionRate >= 60 ? "up" as const : "down" as const,
        helper: `${range.days} ngày được chọn`,
        tone: "blue" as const,
        onClick: () => goToAppointments(),
      },
      {
        title: roleConfig.secondaryMetric,
        value: data.profiles.length,
        icon: <Baby className="h-5 w-5" />,
        trend: highRiskProfiles > 0 ? `${highRiskProfiles} nguy cơ cao` : "Ổn định",
        trendDirection: highRiskProfiles > 0 ? "down" as const : "up" as const,
        helper: roleConfig.scopeLabel,
        tone: "violet" as const,
        onClick: canOpenPregnancyProfiles ? () => goToManagement("/management/records") : undefined,
      },
      {
        title: roleConfig.shiftMetric,
        value: dashboardRole === "doctor" ? visibleShifts.length : activeDoctors,
        suffix: dashboardRole === "doctor" ? undefined : `/ ${visibleShifts.length}`,
        icon: <UserRoundCheck className="h-5 w-5" />,
        trend: vacantShifts > 0 ? `${vacantShifts} ca trống` : "Đủ nhân sự",
        trendDirection: vacantShifts > 0 ? "down" as const : "up" as const,
        helper: `${shiftSummary.capacity} suất khám khả dụng`,
        tone: "emerald" as const,
        onClick: canOpenShiftManagement
          ? () => goToManagement("/management/doctor-shifts", {
              dateFrom: range.dateFrom,
              dateTo: range.dateTo,
              facilityId: dashboardFacilityId,
            })
          : undefined,
      },
    ];

    if (canViewRevenueStats) {
      cards.push({
        title: "Doanh thu ước tính",
        value: formatCurrency(revenueSummary.estimatedRevenue),
        icon: <DollarSign className="h-5 w-5" />,
        trend: `${revenueSummary.billableCount} lịch hợp lệ`,
        trendDirection: revenueSummary.estimatedRevenue > 0 ? "up" as const : "down" as const,
        helper: `${serviceMetrics.length} dịch vụ`,
        tone: "amber" as const,
        onClick: () => goToAppointments(),
      });
    }

    return cards;
  }, [
      activeDoctors,
      appointmentSummary.total,
      canOpenPregnancyProfiles,
      canOpenShiftManagement,
      canViewRevenueStats,
      completionRate,
      dashboardRole,
      dashboardFacilityId,
      data.profiles.length,
      goToAppointments,
      goToManagement,
      highRiskProfiles,
      range.dateFrom,
      range.dateTo,
      range.days,
      roleConfig,
      revenueSummary.billableCount,
      revenueSummary.estimatedRevenue,
      serviceMetrics.length,
      shiftSummary.capacity,
      vacantShifts,
      visibleShifts.length,
    ]);

  const appointmentColumns = useMemo<ColumnsType<ManagementAppointment>>(
    () =>
      [
        {
          title: "Lịch khám",
          key: "appointment",
          render: (_: unknown, appointment: ManagementAppointment) => (
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
        roleConfig.showDoctorColumn
          ? {
              title: "Bác sĩ",
              key: "doctor",
              render: (_: unknown, appointment: ManagementAppointment) => appointment.doctorName || "-",
            }
          : null,
        {
          title: "Trạng thái",
          dataIndex: "status",
          key: "status",
          render: (status: ManagementAppointmentStatus) => (
            <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
          ),
        },
      ].filter(Boolean) as ColumnsType<ManagementAppointment>,
    [roleConfig.showDoctorColumn],
  );

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Tổng quan theo vai trò, dùng dữ liệu thật từ hệ thống."
      />

      <div className="mt-6 flex flex-col gap-5">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Tag color="blue" className="!m-0 !rounded-md !px-3 !py-1 text-sm">
                  {roleConfig.label}
                </Tag>
                <Tag className="!m-0 !rounded-md !px-3 !py-1 text-sm">
                  {roleConfig.scopeLabel}
                </Tag>
              </div>
              <Title level={3} className="!mb-2 !text-slate-950">
                Xin chào, {currentUser?.name ?? "tài khoản quản lý"}
              </Title>
              <Text type="secondary" className="text-base">
                {roleConfig.description}
              </Text>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <Segmented<DashboardWindow>
                value={windowValue}
                options={periodOptions}
                onChange={setWindowValue}
              />

              <Space wrap className="justify-start xl:justify-end">
                {dashboardRole === "super_admin" ? (
                  <Select
                    value={selectedFacilityId}
                    className="min-w-[240px]"
                    options={[
                      { value: "all", label: "Tất cả cơ sở" },
                      ...facilityOptions.map((facility) => ({
                        value: facility.id,
                        label: `${facility.name} (${facility.code})`,
                      })),
                    ]}
                    onChange={setSelectedFacilityId}
                  />
                ) : null}
                {windowValue === "custom" ? (
                  <RangePicker
                    allowClear={false}
                    value={[dayjs(customRange[0]), dayjs(customRange[1])]}
                    format="DD/MM/YYYY"
                    onChange={handleCustomRangeChange}
                  />
                ) : windowValue === "30-days" ? null : (
                  <DatePicker
                    allowClear={false}
                    value={dayjs(selectedDate)}
                    format="DD/MM/YYYY"
                    picker="date"
                    placeholder={windowValue === "week" ? "Chọn ngày trong tuần" : "Chọn ngày"}
                    onChange={handleSelectedDateChange}
                  />
                )}
                <Button
                  icon={<Download className="h-4 w-4" />}
                  disabled={loading}
                  onClick={exportDashboard}
                >
                  Xuất Excel
                </Button>
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
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="rounded-md bg-slate-50 px-3 py-2">
              Khoảng dữ liệu: <span className="font-medium text-slate-700">{range.dateFrom}</span> đến{" "}
              <span className="font-medium text-slate-700">{range.dateTo}</span>
            </span>
            {lastRefresh ? (
              <span className="rounded-md bg-slate-50 px-3 py-2">
                Cập nhật lúc <span className="font-medium text-slate-700">{lastRefresh}</span>
              </span>
            ) : null}
          </div>
        </Card>

        {data.errors.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            title="Một số API không tải được"
            description={data.errors.join(" | ")}
          />
        ) : null}

        {loading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {roleStatCards.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
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
              <AppointmentTrendChart
                data={appointmentTrend}
                onDateClick={(date) => goToAppointments({ dateFrom: date, dateTo: date })}
              />
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
                <button
                  type="button"
                  className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onClick={() => goToAppointments({ status: "completed" })}
                >
                  <Text type="secondary" className="text-xs">
                    Hoàn thành
                  </Text>
                  <div className="mt-1 text-2xl font-bold text-slate-950">
                    {appointmentSummary.completed}
                  </div>
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => goToAppointments({ status: "in_progress" })}
                >
                  <Text type="secondary" className="text-xs">
                    Đang xử lý
                  </Text>
                  <div className="mt-1 text-2xl font-bold text-slate-950">
                    {appointmentSummary.active}
                  </div>
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                  onClick={() => goToAppointments({ status: "cancelled" })}
                >
                  <Text type="secondary" className="text-xs">
                    Đã hủy
                  </Text>
                  <div className="mt-1 text-2xl font-bold text-slate-950">
                    {appointmentSummary.cancelled}
                  </div>
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-violet-100 bg-violet-50/70 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  onClick={() => goToAppointments()}
                >
                  <Text type="secondary" className="text-xs">
                    Tỷ lệ lấp đầy
                  </Text>
                  <div className="mt-1 text-2xl font-bold text-slate-950">
                    {bookingRate}%
                  </div>
                </button>
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

            <Card
              className="border-slate-200 bg-white"
              title={
                <div>
                  <p className="mb-0 text-base font-semibold text-slate-950">
                    Thống kê dịch vụ
                  </p>
                  <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                    {canViewRevenueStats
                      ? "Doanh thu ước tính và số lượt theo từng dịch vụ trong khoảng ngày."
                      : "Số lượt theo từng dịch vụ trong khoảng ngày."}
                  </p>
                </div>
              }
              extra={
                canViewRevenueStats ? (
                  <Tag color="gold">{formatCurrency(revenueSummary.completedRevenue)} đã hoàn thành</Tag>
                ) : null
              }
            >
              {serviceMetrics.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-3">
                  {serviceMetrics.slice(0, 6).map((item) => {
                    const completionPercent =
                      item.appointments === 0 ? 0 : Math.round((item.completed / item.appointments) * 100);

                    return (
                      <button
                        key={item.serviceId}
                        type="button"
                        className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        onClick={() => goToAppointments({ q: item.serviceName })}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Text strong className="block truncate text-slate-950">
                              {item.serviceName}
                            </Text>
                            <Text type="secondary" className="mt-1 block text-xs">
                              {item.appointments} lịch · {item.completed} hoàn thành
                            </Text>
                          </div>
                          <Tag color="blue">{completionPercent}%</Tag>
                        </div>
                        {canViewRevenueStats ? (
                          <div className="mt-3 text-xl font-bold text-slate-950">
                            {formatCurrency(item.revenue)}
                          </div>
                        ) : null}
                        <Progress
                          percent={completionPercent}
                          showInfo={false}
                          size="small"
                          className="mt-2"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Empty description="Không có dữ liệu dịch vụ trong khoảng ngày." />
              )}
            </Card>

            {canViewSystemStats ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Card
                  hoverable
                  className="cursor-pointer border-slate-200 bg-white"
                  onClick={() => goToManagement("/management/facilities")}
                >
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
                <Card
                  hoverable
                  className="cursor-pointer border-slate-200 bg-white"
                  onClick={() => goToManagement("/management/doctors", { facilityId: dashboardFacilityId })}
                >
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
                <Card
                  hoverable
                  className="cursor-pointer border-slate-200 bg-white"
                  onClick={() => goToManagement("/management/staffs", { facilityId: dashboardFacilityId })}
                >
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
                rowClassName="cursor-pointer"
                onRow={(appointment) => ({
                  onClick: () => goToAppointments({
                    appointmentId: String(appointment.id),
                    q: String(appointment.id),
                  }),
                })}
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
                      <button
                        key={item.id}
                        type="button"
                        className={`rounded-xl border p-4 text-left transition hover:brightness-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500 ${visual.borderClass}`}
                        onClick={() => {
                          if (item.id === "pending-payment") {
                            goToAppointments({ status: "pending_payment" });
                          } else if (item.id === "cancelled") {
                            goToAppointments({ status: "cancelled" });
                          } else if (item.id === "shift-capacity") {
                            if (canOpenShiftManagement) {
                              goToManagement("/management/doctor-shifts", {
                                dateFrom: range.dateFrom,
                                dateTo: range.dateTo,
                                facilityId: dashboardFacilityId,
                              });
                            }
                          } else if (dashboardRole === "doctor") {
                            goToManagement("/management/records");
                          }
                        }}
                      >
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
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Empty description="Không có công việc cần xử lý." />
              )}
            </Card>

            {roleConfig.showFacilityUtilization ? (
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
                        item.totalRooms === 0
                          ? 0
                          : Math.min(100, Math.round((item.roomsInUse / item.totalRooms) * 100));

                      return (
                        <button
                          key={item.facilityId}
                          type="button"
                          className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          onClick={() => goToAppointments({ facilityId: item.facilityId })}
                        >
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
                        </button>
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
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card
                hoverable
                className="cursor-pointer border-slate-200 bg-white"
                onClick={() => goToAppointments({ status: "pending_payment" })}
              >
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
              <Card
                hoverable
                className="cursor-pointer border-slate-200 bg-white"
                onClick={() => goToAppointments({ status: "completed" })}
              >
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
              <Card
                hoverable={canOpenShiftManagement}
                className={`border-slate-200 bg-white ${canOpenShiftManagement ? "cursor-pointer" : ""}`}
                onClick={
                  canOpenShiftManagement
                    ? () => goToManagement("/management/doctor-shifts", {
                        dateFrom: range.dateFrom,
                        dateTo: range.dateTo,
                        facilityId: dashboardFacilityId,
                      })
                    : undefined
                }
              >
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
              {canOpenRoomManagement ? (
                <Card
                  hoverable
                  className="cursor-pointer border-slate-200 bg-white"
                  onClick={() => goToManagement("/management/rooms", { facilityId: dashboardFacilityId })}
                >
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
              ) : null}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
