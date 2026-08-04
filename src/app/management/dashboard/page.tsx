// "use client";

// import Link from "next/link";
// import { useEffect, useMemo, useState } from "react";
// import {
//   Activity,
//   ArrowUpRight,
//   BriefcaseBusiness,
//   Building2,
//   CheckCircle2,
//   Database,
//   KeyRound,
//   LockKeyhole,
//   ShieldCheck,
//   Users,
// } from "lucide-react";
// import { AdminLayout } from "@/management/components/layouts/AdminLayout";
// import { Badge } from "@/management/components/ui/Badge";
// import { Card, CardTitle } from "@/management/components/ui/Card";
// import { PageHeader } from "@/management/components/ui/PageHeader";
// import { StateBlock } from "@/management/components/ui/StateBlock";
// import { useAuthStore } from "@/features/auth/auth.store";
// import type { UserProfile } from "@/features/profile/profile.types";
// import { getPermissions } from "@/management/features/permissions/permissions.api";
// import type { Permission } from "@/management/features/permissions/permissions.types";
// import { getRoles } from "@/management/features/roles/roles.api";
// import type { Role } from "@/management/features/roles/roles.types";
// import { getUsers } from "@/management/features/users/users.api";
// import type { User } from "@/management/features/users/users.types";
// import { cn, formatDate, getErrorMessage } from "@/lib/utils";

// function permissionGroup(name: string) {
//   return name.split(/[.:-]/)[0] || "general";
// }

// function SuperAdminDashboard() {
//   const storeUser = useAuthStore((state) => state.user);
//   const [cachedUser] = useState<UserProfile | null>(() => {
//     if (typeof window === "undefined") return null;

//     try {
//       const value = window.localStorage.getItem("fe:user");
//       return value ? (JSON.parse(value) as UserProfile) : null;
//     } catch {
//       return null;
//     }
//   });
//   const [users, setUsers] = useState<User[]>([]);
//   const [roles, setRoles] = useState<Role[]>([]);
//   const [permissions, setPermissions] = useState<Permission[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let mounted = true;

//     Promise.all([getUsers(), getRoles(), getPermissions()])
//       .then(([usersData, rolesData, permissionsData]) => {
//         if (!mounted) return;
//         setUsers(usersData);
//         setRoles(rolesData);
//         setPermissions(permissionsData);
//       })
//       .catch((err) => {
//         if (mounted) setError(getErrorMessage(err));
//       })
//       .finally(() => {
//         if (mounted) setLoading(false);
//       });

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const currentUser = storeUser ?? cachedUser;

//   const activeUsers = users.filter((item) => item.status === "active").length;
//   const inactiveUsers = Math.max(users.length - activeUsers, 0);
//   const userOverrides = users.reduce((count, item) => count + (item.permissionOverrides?.length ?? 0), 0);
//   const permissionModules = useMemo(
//     () => [...new Set(permissions.map((permission) => permissionGroup(permission.name)))],
//     [permissions],
//   );

//   const topRoles = useMemo(
//     () => [...roles].sort((a, b) => (b.permissions?.length ?? 0) - (a.permissions?.length ?? 0)).slice(0, 5),
//     [roles],
//   );

//   const recentUsers = useMemo(
//     () =>
//       [...users]
//         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
//         .slice(0, 5),
//     [users],
//   );

//   const roleCoverage = roles.length && permissions.length
//     ? Math.round(
//         (roles.reduce((total, role) => total + (role.permissions?.length ?? 0), 0) / (roles.length * permissions.length)) * 100,
//       )
//     : 0;

//   const stats = [
//     {
//       label: "Total users",
//       value: users.length,
//       detail: `${activeUsers} active, ${inactiveUsers} inactive`,
//       href: "/management/users",
//       icon: Users,
//       accent: "bg-slate-950 text-white",
//       panel: "bg-white",
//     },
//     {
//       label: "Roles",
//       value: roles.length,
//       detail: `${roleCoverage}% avg permission coverage`,
//       href: "/management/roles",
//       icon: ShieldCheck,
//       accent: "bg-emerald-600 text-white",
//       panel: "bg-emerald-50/60 border-emerald-100",
//     },
//     {
//       label: "Permissions",
//       value: permissions.length,
//       detail: `${permissionModules.length} modules`,
//       href: "/management/permissions",
//       icon: KeyRound,
//       accent: "bg-blue-600 text-white",
//       panel: "bg-blue-50/60 border-blue-100",
//     },
//     {
//       label: "Overrides",
//       value: userOverrides,
//       detail: "direct user allow/deny rules",
//       href: "/management/users",
//       icon: BriefcaseBusiness,
//       accent: "bg-amber-500 text-white",
//       panel: "bg-amber-50/70 border-amber-100",
//     },
//   ];

//   return (
//     <AdminLayout>
//       <PageHeader title="Dashboard" description="Operational view for users, roles, permissions, and access coverage." />

//       {loading ? <StateBlock type="loading" title="Loading dashboard" /> : null}
//       {error ? <StateBlock type="error" title="Cannot load dashboard" description={error} /> : null}

//       {!loading && !error ? (
//         <div className="space-y-6">
//           <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
//             <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
//               <div className="p-6 lg:p-8">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <Badge className="bg-cyan-400/15 text-cyan-100 ring-cyan-300/25">Live RBAC</Badge>
//                   <Badge className="bg-white/10 text-slate-200 ring-white/15">NestJS API</Badge>
//                 </div>
//                 <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-normal lg:text-4xl">
//                   Access control, users, and system permissions in one place.
//                 </h2>
//                 <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
//                   Track who has access, how roles are configured, and where user-level permission overrides are active.
//                 </p>
//                 <div className="mt-6 flex flex-wrap gap-3">
//                   <Link
//                     href="/management/users"
//                     className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-slate-100"
//                   >
//                     Manage users
//                     <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
//                   </Link>
//                   <Link
//                     href="/management/roles"
//                     className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/10"
//                   >
//                     Review roles
//                     <ShieldCheck className="h-4 w-4" aria-hidden="true" />
//                   </Link>
//                 </div>
//               </div>

//               <div className="border-t border-white/10 bg-white/[0.04] p-6 lg:border-l lg:border-t-0 lg:p-8">
//                 <p className="text-sm font-medium text-slate-300">Access health</p>
//                 <div className="mt-5 grid grid-cols-2 gap-3">
//                   <div className="rounded-lg bg-white/10 p-4 ring-1 ring-inset ring-white/10">
//                     <p className="text-3xl font-semibold">{roleCoverage}%</p>
//                     <p className="mt-1 text-xs text-slate-300">role coverage</p>
//                   </div>
//                   <div className="rounded-lg bg-white/10 p-4 ring-1 ring-inset ring-white/10">
//                     <p className="text-3xl font-semibold">{userOverrides}</p>
//                     <p className="mt-1 text-xs text-slate-300">overrides</p>
//                   </div>
//                 </div>
//                 <div className="mt-5 rounded-lg bg-cyan-400/10 p-4 ring-1 ring-inset ring-cyan-300/20">
//                   <div className="flex items-center gap-2 text-cyan-100">
//                     <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
//                     <p className="text-sm font-medium">Permission evaluation is active</p>
//                   </div>
//                   <p className="mt-2 text-xs leading-5 text-cyan-100/75">Role permissions are merged with user allow/deny overrides.</p>
//                 </div>
//               </div>
//             </div>
//           </section>

//           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             {stats.map((item) => {
//               const Icon = item.icon;
//               return (
//                 <Link key={item.label} href={item.href} className="block">
//                   <Card className={cn("min-h-40 transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(15,23,42,0.1)]", item.panel)}>
//                     <div className="flex items-start justify-between gap-4">
//                       <div className="min-w-0">
//                         <p className="truncate text-sm font-medium text-slate-600">{item.label}</p>
//                         <p className="mt-3 text-4xl font-semibold text-slate-950">{item.value}</p>
//                       </div>
//                       <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md", item.accent)}>
//                         <Icon className="h-5 w-5" aria-hidden="true" />
//                       </div>
//                     </div>
//                     <div className="mt-5 flex items-center justify-between gap-3">
//                       <p className="text-sm text-slate-500">{item.detail}</p>
//                       <ArrowUpRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
//                     </div>
//                   </Card>
//                 </Link>
//               );
//             })}
//           </div>

//           <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
//             <Card className="p-0">
//               <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
//                 <div>
//                   <CardTitle>Role Coverage</CardTitle>
//                   <p className="mt-1 text-sm text-slate-500">Largest permission sets by role.</p>
//                 </div>
//                 <Activity className="h-5 w-5 text-slate-400" aria-hidden="true" />
//               </div>
//               <div className="space-y-4 p-5">
//                 {topRoles.map((role) => {
//                   const count = role.permissions?.length ?? 0;
//                   const width = permissions.length ? Math.round((count / permissions.length) * 100) : 0;
//                   return (
//                     <div key={role.id} className="rounded-lg border border-slate-200 p-4">
//                       <div className="mb-3 flex items-center justify-between gap-3">
//                         <div className="min-w-0">
//                           <p className="truncate text-sm font-semibold text-slate-950">{role.name}</p>
//                           <p className="text-xs text-slate-500">Guard: {role.guardName}</p>
//                         </div>
//                         <Badge tone={width >= 80 ? "green" : width >= 30 ? "blue" : "neutral"}>{width}%</Badge>
//                       </div>
//                       <div className="h-2 overflow-hidden rounded-full bg-slate-100">
//                         <div
//                           className={cn("h-full rounded-full", width >= 80 ? "bg-emerald-600" : width >= 30 ? "bg-blue-600" : "bg-slate-400")}
//                           style={{ width: `${width}%` }}
//                         />
//                       </div>
//                       <div className="mt-3 flex flex-wrap gap-1.5">
//                         {(role.permissions ?? []).slice(0, 4).map((permission) => (
//                           <Badge key={permission.id}>{permission.name}</Badge>
//                         ))}
//                         {count > 4 ? <Badge>+{count - 4}</Badge> : null}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </Card>

//             <div className="space-y-5">
//               <Card className="p-0">
//                 <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
//                   <div>
//                     <CardTitle>Permission Modules</CardTitle>
//                     <p className="mt-1 text-sm text-slate-500">{permissionModules.length} active modules.</p>
//                   </div>
//                   <Database className="h-5 w-5 text-slate-400" aria-hidden="true" />
//                 </div>
//                 <div className="flex flex-wrap gap-2 p-5">
//                   {permissionModules.map((moduleName) => (
//                     <Badge key={moduleName} tone="blue">
//                       {moduleName}
//                     </Badge>
//                   ))}
//                 </div>
//               </Card>

//               <Card>
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
//                     <LockKeyhole className="h-5 w-5" aria-hidden="true" />
//                   </div>
//                   <div className="min-w-0">
//                     <CardTitle>Current Session</CardTitle>
//                     <p className="truncate text-sm text-slate-500">{currentUser?.email ?? "Unknown user"}</p>
//                   </div>
//                 </div>
//                 <div className="mt-5 grid gap-3 sm:grid-cols-2">
//                   <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
//                     <p className="text-xs font-medium uppercase text-slate-500">Name</p>
//                     <p className="mt-1 truncate text-sm font-semibold text-slate-950">{currentUser?.name ?? "-"}</p>
//                   </div>
//                   <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
//                     <p className="text-xs font-medium uppercase text-slate-500">Status</p>
//                     <div className="mt-1">
//                       <Badge tone={currentUser?.status === "active" ? "green" : "neutral"}>
//                         {currentUser?.status === "active" ? "Active" : "Inactive"}
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="mt-4 flex flex-wrap gap-2">
//                   {currentUser?.roles?.length ? currentUser.roles.map((role) => <Badge key={role.id}>{role.name}</Badge>) : <span>-</span>}
//                 </div>
//               </Card>
//             </div>
//           </div>

//           <Card className="overflow-hidden p-0">
//             <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
//               <div>
//                 <CardTitle>Recent Users</CardTitle>
//                 <p className="mt-1 text-sm text-slate-500">Latest user records from management API.</p>
//               </div>
//               <Link href="/management/users" className="text-sm font-medium text-cyan-700 hover:text-cyan-900">
//                 View all
//               </Link>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[760px] text-left text-sm">
//                 <thead className="bg-slate-50 text-xs uppercase text-slate-500">
//                   <tr>
//                     <th className="px-5 py-3 font-medium">User</th>
//                     <th className="px-5 py-3 font-medium">Roles</th>
//                     <th className="px-5 py-3 font-medium">Overrides</th>
//                     <th className="px-5 py-3 font-medium">Created</th>
//                     <th className="px-5 py-3 font-medium">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-200">
//                   {recentUsers.map((item) => (
//                     <tr key={item.id} className="bg-white">
//                       <td className="px-5 py-3">
//                         <div className="flex items-center gap-3">
//                           <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
//                             {item.name.slice(0, 1).toUpperCase()}
//                           </div>
//                           <div className="min-w-0">
//                             <p className="truncate font-medium text-slate-950">{item.name}</p>
//                             <p className="truncate text-xs text-slate-500">{item.email}</p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-5 py-3">
//                         <div className="flex flex-wrap gap-1.5">
//                           {(item.roles ?? []).slice(0, 2).map((role) => (
//                             <Badge key={role.id}>{role.name}</Badge>
//                           ))}
//                         </div>
//                       </td>
//                       <td className="px-5 py-3 text-slate-600">{item.permissionOverrides?.length ?? 0}</td>
//                       <td className="px-5 py-3 text-slate-600">{formatDate(item.createdAt)}</td>
//                       <td className="px-5 py-3">
//                         <Badge tone={item.status === "active" ? "green" : "neutral"}>{item.status === "active" ? "Active" : "Inactive"}</Badge>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </Card>
//         </div>
//       ) : null}
//     </AdminLayout>
//   );
// }

// function FacilityDashboard() {
//   const user = useAuthStore((state) => state.user);
//   const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
//   const roles = useAuthStore((state) => state.roles);
//   const activeFacility = user?.facilities?.find(
//     (facility) => String(facility.id) === String(activeFacilityId),
//   );

//   return (
//     <AdminLayout roles={["admin", "doctor", "nurse", "staff"]}>
//       <PageHeader
//         title="Tổng quan cơ sở"
//         description={activeFacility?.name ?? "Chọn cơ sở làm việc để tiếp tục."}
//       />
//       <Card>
//         <div className="flex items-start gap-4">
//           <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
//             <Building2 className="h-5 w-5" aria-hidden="true" />
//           </div>
//           <div className="min-w-0">
//             <CardTitle>{activeFacility?.name ?? "Chưa chọn cơ sở"}</CardTitle>
//             <p className="mt-1 text-sm text-slate-500">
//               {activeFacility?.code ?? "-"}
//             </p>
//             <div className="mt-4 flex flex-wrap gap-2">
//               {roles.map((role) => (
//                 <Badge key={role} tone="blue">
//                   {role}
//                 </Badge>
//               ))}
//             </div>
//           </div>
//         </div>
//       </Card>
//     </AdminLayout>
//   );
// }

// export default function DashboardPage() {
//   const roles = useAuthStore((state) => state.roles);

//   return roles.includes("super_admin") ? (
//     <SuperAdminDashboard />
//   ) : (
//     <FacilityDashboard />
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Progress,
  Select,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AlertTriangle,
  Baby,
  Banknote,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  HeartPulse,
  MessageCircle,
  RefreshCw,
  Search,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { API_BASE_URL } from "@/lib/constants";

const { Text, Title } = Typography;

const MOCK_TODAY = "2026-07-21";

type PeriodValue = "today" | "7-days" | "30-days";
type DateRangeMode = PeriodValue | "custom";
type DashboardTab = "overview" | "revenue";
type AppointmentStatus =
  | "confirmed"
  | "waiting"
  | "in-progress"
  | "completed"
  | "cancelled";
type ShiftType = "morning" | "afternoon" | "evening";
type AlertLevel = "critical" | "warning" | "info";
type StatTone = "blue" | "emerald" | "violet" | "amber";
type ChatbotStatus = "bot" | "waiting_for_staff" | "staff_joined" | "closed";

type ChatbotMessage = {
  id: string;
  conversationId: string;
  sender: "user" | "bot" | "staff" | "system";
  senderName?: string;
  content: string;
  createdAt: string;
};

type ChatbotConversation = {
  conversationId: string;
  status: ChatbotStatus;
  requester?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string | null;
  };
  assignedStaffId?: string;
  assignedStaffName?: string;
  claimExpiresAt?: string;
  messages: ChatbotMessage[];
};

type Facility = {
  id: string;
  name: string;
  code: string;
  address: string;
};

type Appointment = {
  id: string;
  code: string;
  appointmentDate: string;
  time: string;
  patientName: string;
  gestationalAge: string;
  service: string;
  doctorName: string;
  doctorTitle: string;
  facilityId: string;
  roomName: string;
  status: AppointmentStatus;
};

type DoctorShift = {
  id: string;
  doctorName: string | null;
  doctorTitle: string | null;
  specialty: string;
  facilityId: string;
  roomName: string;
  shiftType: ShiftType;
  timeRange: string;
  bookedAppointments: number;
  maxAppointments: number;
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
  appointments: number;
  maxAppointments: number;
  activeDoctors: number;
  roomsInUse: number;
  totalRooms: number;
};


type RevenuePoint = {
  key: string;
  label: string;
  revenue: number;
  previousRevenue: number;
};

type ServiceCategory = "examination" | "ultrasound" | "laboratory" | "package";

type ServiceRevenueSeed = {
  id: string;
  name: string;
  category: ServiceCategory;
  baseVisits: number;
  baseRevenue: number;
  facilityRatio: Record<string, number>;
};

type ServicePerformance = {
  id: string;
  name: string;
  category: ServiceCategory;
  visits: number;
  revenue: number;
  averageRevenue: number;
  revenueShare: number;
};

type RevenueMixItem = {
  key: string;
  label: string;
  revenue: number;
  percent: number;
  color: string;
};

type FacilityRevenueRow = {
  key: string;
  facilityId: string;
  revenue: number;
  previousRevenue: number;
  transactions: number;
  collected: number;
  outstanding: number;
};

const FACILITIES: Facility[] = [
  {
    id: "facility-1",
    name: "Phòng khám Sản An Tâm",
    code: "AT-HN",
    address: "25 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  },
  {
    id: "facility-2",
    name: "Trung tâm Mẹ & Bé Bình An",
    code: "BA-CG",
    address: "118 Trần Thái Tông, Cầu Giấy, Hà Nội",
  },
  {
    id: "facility-3",
    name: "Phòng khám Mẹ Tròn Con Vuông",
    code: "MC-HD",
    address: "62 Nguyễn Văn Lộc, Hà Đông, Hà Nội",
  },
  {
    id: "facility-4",
    name: "Trung tâm Thai sản An Nhiên",
    code: "AN-LB",
    address: "15 Nguyễn Văn Cừ, Long Biên, Hà Nội",
  },
  {
    id: "facility-5",
    name: "Phòng khám Phụ sản Hạnh Phúc",
    code: "HP-HBT",
    address: "86 Bạch Mai, Hai Bà Trưng, Hà Nội",
  },
];

const APPOINTMENTS: Appointment[] = [
  {
    id: "appointment-01",
    code: "LH-1507-001",
    appointmentDate: "2026-07-15",
    time: "08:00",
    patientName: "Nguyễn Thu Trang",
    gestationalAge: "12 tuần 3 ngày",
    service: "Khám thai định kỳ",
    doctorName: "Nguyễn Minh Anh",
    doctorTitle: "BS.CKII",
    facilityId: "facility-1",
    roomName: "Phòng khám 101",
    status: "completed",
  },
  {
    id: "appointment-02",
    code: "LH-1707-002",
    appointmentDate: "2026-07-17",
    time: "08:30",
    patientName: "Trần Ngọc Mai",
    gestationalAge: "22 tuần 1 ngày",
    service: "Siêu âm hình thái thai",
    doctorName: "Vũ Thanh Hương",
    doctorTitle: "BS.CKI",
    facilityId: "facility-1",
    roomName: "Phòng siêu âm 102",
    status: "completed",
  },
  {
    id: "appointment-03",
    code: "LH-1907-003",
    appointmentDate: "2026-07-19",
    time: "09:00",
    patientName: "Lê Minh Hằng",
    gestationalAge: "8 tuần 5 ngày",
    service: "Khám thai lần đầu",
    doctorName: "Trần Thu Hà",
    doctorTitle: "ThS.BS",
    facilityId: "facility-1",
    roomName: "Phòng khám 101",
    status: "waiting",
  },
  {
    id: "appointment-04",
    code: "LH-2107-004",
    appointmentDate: MOCK_TODAY,
    time: "09:30",
    patientName: "Phạm Ngọc Lan",
    gestationalAge: "30 tuần 2 ngày",
    service: "Theo dõi thai kỳ nguy cơ cao",
    doctorName: "Phạm Ngọc Mai",
    doctorTitle: "BS.CKII",
    facilityId: "facility-1",
    roomName: "Phòng khám 201",
    status: "confirmed",
  },

  {
    id: "appointment-05",
    code: "LH-1507-005",
    appointmentDate: "2026-07-15",
    time: "08:15",
    patientName: "Đỗ Thanh Thảo",
    gestationalAge: "18 tuần",
    service: "Tư vấn kết quả xét nghiệm",
    doctorName: "Đỗ Quang Huy",
    doctorTitle: "ThS.BS",
    facilityId: "facility-2",
    roomName: "Phòng khám A01",
    status: "completed",
  },
  {
    id: "appointment-06",
    code: "LH-1607-006",
    appointmentDate: "2026-07-16",
    time: "10:00",
    patientName: "Bùi Khánh Linh",
    gestationalAge: "26 tuần 4 ngày",
    service: "Khám thai định kỳ",
    doctorName: "Đỗ Quang Huy",
    doctorTitle: "ThS.BS",
    facilityId: "facility-2",
    roomName: "Phòng khám A01",
    status: "completed",
  },
  {
    id: "appointment-07",
    code: "LH-2007-007",
    appointmentDate: "2026-07-20",
    time: "14:00",
    patientName: "Hoàng Thu Uyên",
    gestationalAge: "14 tuần 6 ngày",
    service: "Siêu âm thai",
    doctorName: "Lê Hoàng Nam",
    doctorTitle: "BS.CKI",
    facilityId: "facility-2",
    roomName: "Phòng siêu âm A02",
    status: "waiting",
  },
  {
    id: "appointment-08",
    code: "LH-2107-008",
    appointmentDate: MOCK_TODAY,
    time: "14:30",
    patientName: "Vũ Mỹ Duyên",
    gestationalAge: "34 tuần 1 ngày",
    service: "Khám thai định kỳ",
    doctorName: "Đỗ Quang Huy",
    doctorTitle: "ThS.BS",
    facilityId: "facility-2",
    roomName: "Phòng khám A01",
    status: "cancelled",
  },

  {
    id: "appointment-09",
    code: "LH-1507-009",
    appointmentDate: "2026-07-15",
    time: "07:45",
    patientName: "Nguyễn Quỳnh Anh",
    gestationalAge: "10 tuần 2 ngày",
    service: "Khám thai lần đầu",
    doctorName: "Nguyễn Hải Yến",
    doctorTitle: "BS.CKI",
    facilityId: "facility-3",
    roomName: "Phòng khám M01",
    status: "completed",
  },
  {
    id: "appointment-10",
    code: "LH-1707-010",
    appointmentDate: "2026-07-17",
    time: "09:15",
    patientName: "Trịnh Mai Phương",
    gestationalAge: "24 tuần",
    service: "Siêu âm thai 4D",
    doctorName: "Trần Gia Bảo",
    doctorTitle: "ThS.BS",
    facilityId: "facility-3",
    roomName: "Phòng siêu âm M02",
    status: "completed",
  },
  {
    id: "appointment-11",
    code: "LH-1807-011",
    appointmentDate: "2026-07-18",
    time: "13:30",
    patientName: "Phan Khánh Vy",
    gestationalAge: "29 tuần 5 ngày",
    service: "Xét nghiệm sàng lọc trước sinh",
    doctorName: "Lương Thu Giang",
    doctorTitle: "BS.CKII",
    facilityId: "facility-3",
    roomName: "Phòng xét nghiệm M03",
    status: "in-progress",
  },
  {
    id: "appointment-12",
    code: "LH-2107-012",
    appointmentDate: MOCK_TODAY,
    time: "15:00",
    patientName: "Đặng Thu Hương",
    gestationalAge: "36 tuần",
    service: "Theo dõi thai kỳ nguy cơ cao",
    doctorName: "Lương Thu Giang",
    doctorTitle: "BS.CKII",
    facilityId: "facility-3",
    roomName: "Phòng khám M04",
    status: "confirmed",
  },

  {
    id: "appointment-13",
    code: "LH-1607-013",
    appointmentDate: "2026-07-16",
    time: "08:40",
    patientName: "Ngô Thanh Vân",
    gestationalAge: "16 tuần 4 ngày",
    service: "Khám thai định kỳ",
    doctorName: "Phạm Minh Châu",
    doctorTitle: "BS.CKI",
    facilityId: "facility-4",
    roomName: "Phòng khám N01",
    status: "completed",
  },
  {
    id: "appointment-14",
    code: "LH-1807-014",
    appointmentDate: "2026-07-18",
    time: "10:20",
    patientName: "Lê Hà My",
    gestationalAge: "21 tuần",
    service: "Siêu âm hình thái thai",
    doctorName: "Đinh Quốc Hưng",
    doctorTitle: "ThS.BS",
    facilityId: "facility-4",
    roomName: "Phòng siêu âm N02",
    status: "cancelled",
  },
  {
    id: "appointment-15",
    code: "LH-2007-015",
    appointmentDate: "2026-07-20",
    time: "14:10",
    patientName: "Đinh Ngọc Ánh",
    gestationalAge: "32 tuần 3 ngày",
    service: "Khám thai định kỳ",
    doctorName: "Phạm Minh Châu",
    doctorTitle: "BS.CKI",
    facilityId: "facility-4",
    roomName: "Phòng khám N01",
    status: "waiting",
  },
  {
    id: "appointment-16",
    code: "LH-2107-016",
    appointmentDate: MOCK_TODAY,
    time: "16:00",
    patientName: "Mai Thùy Linh",
    gestationalAge: "7 tuần 6 ngày",
    service: "Khám thai lần đầu",
    doctorName: "Phạm Minh Châu",
    doctorTitle: "BS.CKI",
    facilityId: "facility-4",
    roomName: "Phòng khám N03",
    status: "confirmed",
  },

  {
    id: "appointment-17",
    code: "LH-1507-017",
    appointmentDate: "2026-07-15",
    time: "08:10",
    patientName: "Tạ Ngọc Diệp",
    gestationalAge: "13 tuần 2 ngày",
    service: "Xét nghiệm sàng lọc trước sinh",
    doctorName: "Võ Thu Hà",
    doctorTitle: "BS.CKII",
    facilityId: "facility-5",
    roomName: "Phòng xét nghiệm H01",
    status: "completed",
  },
  {
    id: "appointment-18",
    code: "LH-1707-018",
    appointmentDate: "2026-07-17",
    time: "09:50",
    patientName: "Chu Minh Nguyệt",
    gestationalAge: "20 tuần 5 ngày",
    service: "Siêu âm thai 4D",
    doctorName: "Nguyễn Đức Long",
    doctorTitle: "ThS.BS",
    facilityId: "facility-5",
    roomName: "Phòng siêu âm H02",
    status: "completed",
  },
  {
    id: "appointment-19",
    code: "LH-1907-019",
    appointmentDate: "2026-07-19",
    time: "13:45",
    patientName: "Dương Hải Yến",
    gestationalAge: "27 tuần",
    service: "Gói quản lý thai kỳ",
    doctorName: "Võ Thu Hà",
    doctorTitle: "BS.CKII",
    facilityId: "facility-5",
    roomName: "Phòng khám H03",
    status: "in-progress",
  },
  {
    id: "appointment-20",
    code: "LH-2107-020",
    appointmentDate: MOCK_TODAY,
    time: "15:30",
    patientName: "Hà Phương Thảo",
    gestationalAge: "38 tuần 1 ngày",
    service: "Theo dõi thai kỳ nguy cơ cao",
    doctorName: "Võ Thu Hà",
    doctorTitle: "BS.CKII",
    facilityId: "facility-5",
    roomName: "Phòng theo dõi H04",
    status: "waiting",
  },
];

const DOCTOR_SHIFTS: DoctorShift[] = [
  {
    id: "shift-01",
    doctorName: "Trần Thu Hà",
    doctorTitle: "ThS.BS",
    specialty: "Sản phụ khoa",
    facilityId: "facility-1",
    roomName: "Phòng khám 101",
    shiftType: "morning",
    timeRange: "08:00 - 12:00",
    bookedAppointments: 7,
    maxAppointments: 8,
  },
  {
    id: "shift-02",
    doctorName: "Vũ Thanh Hương",
    doctorTitle: "BS.CKI",
    specialty: "Siêu âm sản",
    facilityId: "facility-1",
    roomName: "Phòng siêu âm 102",
    shiftType: "morning",
    timeRange: "08:00 - 12:00",
    bookedAppointments: 5,
    maxAppointments: 6,
  },
  {
    id: "shift-03",
    doctorName: "Phạm Ngọc Mai",
    doctorTitle: "BS.CKII",
    specialty: "Thai kỳ nguy cơ cao",
    facilityId: "facility-1",
    roomName: "Phòng khám 201",
    shiftType: "afternoon",
    timeRange: "13:30 - 17:30",
    bookedAppointments: 6,
    maxAppointments: 6,
  },

  {
    id: "shift-04",
    doctorName: "Đỗ Quang Huy",
    doctorTitle: "ThS.BS",
    specialty: "Sản phụ khoa",
    facilityId: "facility-2",
    roomName: "Phòng khám A01",
    shiftType: "afternoon",
    timeRange: "13:30 - 17:30",
    bookedAppointments: 3,
    maxAppointments: 8,
  },
  {
    id: "shift-05",
    doctorName: "Lê Hoàng Nam",
    doctorTitle: "BS.CKI",
    specialty: "Chẩn đoán hình ảnh",
    facilityId: "facility-2",
    roomName: "Phòng siêu âm A02",
    shiftType: "afternoon",
    timeRange: "13:30 - 17:30",
    bookedAppointments: 5,
    maxAppointments: 7,
  },
  {
    id: "shift-06",
    doctorName: null,
    doctorTitle: null,
    specialty: "Sản phụ khoa",
    facilityId: "facility-2",
    roomName: "Phòng khám A03",
    shiftType: "evening",
    timeRange: "18:00 - 21:00",
    bookedAppointments: 0,
    maxAppointments: 6,
  },

  {
    id: "shift-07",
    doctorName: "Nguyễn Hải Yến",
    doctorTitle: "BS.CKI",
    specialty: "Sản phụ khoa",
    facilityId: "facility-3",
    roomName: "Phòng khám M01",
    shiftType: "morning",
    timeRange: "07:30 - 11:30",
    bookedAppointments: 8,
    maxAppointments: 9,
  },
  {
    id: "shift-08",
    doctorName: "Trần Gia Bảo",
    doctorTitle: "ThS.BS",
    specialty: "Siêu âm sản",
    facilityId: "facility-3",
    roomName: "Phòng siêu âm M02",
    shiftType: "morning",
    timeRange: "08:00 - 12:00",
    bookedAppointments: 7,
    maxAppointments: 7,
  },
  {
    id: "shift-09",
    doctorName: "Lương Thu Giang",
    doctorTitle: "BS.CKII",
    specialty: "Thai kỳ nguy cơ cao",
    facilityId: "facility-3",
    roomName: "Phòng khám M04",
    shiftType: "afternoon",
    timeRange: "13:00 - 17:00",
    bookedAppointments: 8,
    maxAppointments: 10,
  },
  {
    id: "shift-10",
    doctorName: "Hoàng Ngọc Trâm",
    doctorTitle: "BS.CKI",
    specialty: "Xét nghiệm trước sinh",
    facilityId: "facility-3",
    roomName: "Phòng xét nghiệm M03",
    shiftType: "evening",
    timeRange: "17:30 - 20:30",
    bookedAppointments: 4,
    maxAppointments: 5,
  },

  {
    id: "shift-11",
    doctorName: "Phạm Minh Châu",
    doctorTitle: "BS.CKI",
    specialty: "Sản phụ khoa",
    facilityId: "facility-4",
    roomName: "Phòng khám N01",
    shiftType: "morning",
    timeRange: "08:00 - 12:00",
    bookedAppointments: 3,
    maxAppointments: 8,
  },
  {
    id: "shift-12",
    doctorName: "Đinh Quốc Hưng",
    doctorTitle: "ThS.BS",
    specialty: "Siêu âm sản",
    facilityId: "facility-4",
    roomName: "Phòng siêu âm N02",
    shiftType: "afternoon",
    timeRange: "13:30 - 17:30",
    bookedAppointments: 2,
    maxAppointments: 7,
  },
  {
    id: "shift-13",
    doctorName: null,
    doctorTitle: null,
    specialty: "Sản phụ khoa",
    facilityId: "facility-4",
    roomName: "Phòng khám N03",
    shiftType: "evening",
    timeRange: "18:00 - 21:00",
    bookedAppointments: 0,
    maxAppointments: 5,
  },

  {
    id: "shift-14",
    doctorName: "Võ Thu Hà",
    doctorTitle: "BS.CKII",
    specialty: "Thai kỳ nguy cơ cao",
    facilityId: "facility-5",
    roomName: "Phòng khám H03",
    shiftType: "morning",
    timeRange: "07:30 - 11:30",
    bookedAppointments: 8,
    maxAppointments: 8,
  },
  {
    id: "shift-15",
    doctorName: "Nguyễn Đức Long",
    doctorTitle: "ThS.BS",
    specialty: "Chẩn đoán hình ảnh",
    facilityId: "facility-5",
    roomName: "Phòng siêu âm H02",
    shiftType: "afternoon",
    timeRange: "13:00 - 17:00",
    bookedAppointments: 6,
    maxAppointments: 8,
  },
  {
    id: "shift-16",
    doctorName: "Bùi Ngọc Mai",
    doctorTitle: "BS.CKI",
    specialty: "Xét nghiệm trước sinh",
    facilityId: "facility-5",
    roomName: "Phòng xét nghiệm H01",
    shiftType: "afternoon",
    timeRange: "13:30 - 17:30",
    bookedAppointments: 5,
    maxAppointments: 6,
  },
];

const METRICS_BY_PERIOD: Record<PeriodValue, DailyMetric[]> = {
  today: [
    {
      date: MOCK_TODAY,
      label: "Hôm nay",
      appointments: 34,
      completed: 18,
    },
  ],
  "7-days": [
    { date: "2026-07-20", label: "T2", appointments: 31, completed: 29 },
    { date: "2026-07-21", label: "T3", appointments: 34, completed: 18 },
    { date: "2026-07-22", label: "T4", appointments: 37, completed: 0 },
    { date: "2026-07-23", label: "T5", appointments: 29, completed: 0 },
    { date: "2026-07-24", label: "T6", appointments: 41, completed: 0 },
    { date: "2026-07-25", label: "T7", appointments: 26, completed: 0 },
    { date: "2026-07-26", label: "CN", appointments: 18, completed: 0 },
  ],
  "30-days": [
    { date: "week-1", label: "Tuần 1", appointments: 142, completed: 136 },
    { date: "week-2", label: "Tuần 2", appointments: 156, completed: 149 },
    { date: "week-3", label: "Tuần 3", appointments: 168, completed: 160 },
    { date: "week-4", label: "Tuần 4", appointments: 181, completed: 91 },
  ],
};

const DAILY_APPOINTMENT_METRICS: DailyMetric[] =
  Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const date = `2026-07-${String(day).padStart(2, "0")}`;
    const weekdayFactor =
      index % 7 === 5 ? -6 : index % 7 === 6 ? -10 : 0;
    const appointments =
      30 + ((index * 7) % 17) + weekdayFactor;
    const completed = Math.max(
      0,
      appointments - (3 + (index % 6)),
    );

    return {
      date,
      label: `${String(day).padStart(2, "0")}/07`,
      appointments,
      completed,
    };
  });

const ALERTS: DashboardAlert[] = [
  {
    id: "alert-01",
    level: "critical",
    title: "Ca tối chưa được phân công bác sĩ",
    description:
      "Phòng khám A01 tại Trung tâm Mẹ & Bé Bình An chưa có bác sĩ phụ trách ca 18:00 - 21:00.",
    meta: "Cần xử lý trước 17:00 hôm nay",
  },
  {
    id: "alert-02",
    level: "warning",
    title: "Ca trực đã đạt 100% số lịch",
    description:
      "Ca chiều của BS.CKII Phạm Ngọc Mai đã đủ 6/6 lịch hẹn.",
    meta: "Phòng khám 201 · 13:30 - 17:30",
  },
  {
    id: "alert-03",
    level: "warning",
    title: "03 hồ sơ thai kỳ nguy cơ cao cần theo dõi",
    description:
      "Các hồ sơ có chỉ định tái khám trong 48 giờ nhưng chưa xác nhận lịch.",
    meta: "Cập nhật 15 phút trước",
  },
  {
    id: "alert-04",
    level: "info",
    title: "05 khoản thanh toán đang chờ đối soát",
    description:
      "Tổng giá trị 8.750.000 ₫ đang ở trạng thái chờ xác nhận.",
    meta: "Bộ phận thu ngân",
  },
];

const FACILITY_UTILIZATION: FacilityUtilization[] = [
  {
    facilityId: "facility-1",
    appointments: 23,
    maxAppointments: 32,
    activeDoctors: 3,
    roomsInUse: 3,
    totalRooms: 4,
  },
  {
    facilityId: "facility-2",
    appointments: 13,
    maxAppointments: 21,
    activeDoctors: 2,
    roomsInUse: 2,
    totalRooms: 4,
  },
  {
    facilityId: "facility-3",
    appointments: 31,
    maxAppointments: 38,
    activeDoctors: 4,
    roomsInUse: 4,
    totalRooms: 5,
  },
  {
    facilityId: "facility-4",
    appointments: 8,
    maxAppointments: 24,
    activeDoctors: 2,
    roomsInUse: 2,
    totalRooms: 4,
  },
  {
    facilityId: "facility-5",
    appointments: 21,
    maxAppointments: 30,
    activeDoctors: 3,
    roomsInUse: 3,
    totalRooms: 5,
  },
];

const REVENUE_TREND_BY_PERIOD: Record<PeriodValue, RevenuePoint[]> = {
  today: [
    { key: "08", label: "08:00", revenue: 3600000, previousRevenue: 3150000 },
    { key: "10", label: "10:00", revenue: 5100000, previousRevenue: 4600000 },
    { key: "12", label: "12:00", revenue: 6250000, previousRevenue: 5740000 },
    { key: "14", label: "14:00", revenue: 7400000, previousRevenue: 6810000 },
    { key: "16", label: "16:00", revenue: 8200000, previousRevenue: 7540000 },
    { key: "18", label: "18:00", revenue: 8100000, previousRevenue: 7880000 },
  ],
  "7-days": [
    { key: "2026-07-20", label: "T2", revenue: 35400000, previousRevenue: 32100000 },
    { key: "2026-07-21", label: "T3", revenue: 38650000, previousRevenue: 35720000 },
    { key: "2026-07-22", label: "T4", revenue: 42100000, previousRevenue: 38900000 },
    { key: "2026-07-23", label: "T5", revenue: 39200000, previousRevenue: 37100000 },
    { key: "2026-07-24", label: "T6", revenue: 44700000, previousRevenue: 41600000 },
    { key: "2026-07-25", label: "T7", revenue: 31300000, previousRevenue: 29800000 },
    { key: "2026-07-26", label: "CN", revenue: 24600000, previousRevenue: 23100000 },
  ],
  "30-days": [
    { key: "01", label: "01/07", revenue: 33200000, previousRevenue: 30100000 },
    { key: "02", label: "02/07", revenue: 35100000, previousRevenue: 31700000 },
    { key: "03", label: "03/07", revenue: 37400000, previousRevenue: 34500000 },
    { key: "04", label: "04/07", revenue: 29600000, previousRevenue: 28400000 },
    { key: "05", label: "05/07", revenue: 26300000, previousRevenue: 25100000 },
    { key: "06", label: "06/07", revenue: 34800000, previousRevenue: 31900000 },
    { key: "07", label: "07/07", revenue: 39100000, previousRevenue: 35600000 },
    { key: "08", label: "08/07", revenue: 40700000, previousRevenue: 38200000 },
    { key: "09", label: "09/07", revenue: 36500000, previousRevenue: 34100000 },
    { key: "10", label: "10/07", revenue: 42800000, previousRevenue: 39500000 },
    { key: "11", label: "11/07", revenue: 45100000, previousRevenue: 41700000 },
    { key: "12", label: "12/07", revenue: 31800000, previousRevenue: 29900000 },
    { key: "13", label: "13/07", revenue: 27900000, previousRevenue: 26400000 },
    { key: "14", label: "14/07", revenue: 35200000, previousRevenue: 32700000 },
    { key: "15", label: "15/07", revenue: 38600000, previousRevenue: 35400000 },
    { key: "16", label: "16/07", revenue: 41200000, previousRevenue: 37900000 },
    { key: "17", label: "17/07", revenue: 43900000, previousRevenue: 40100000 },
    { key: "18", label: "18/07", revenue: 46300000, previousRevenue: 42600000 },
    { key: "19", label: "19/07", revenue: 33700000, previousRevenue: 31600000 },
    { key: "20", label: "20/07", revenue: 35400000, previousRevenue: 32100000 },
    { key: "21", label: "21/07", revenue: 38650000, previousRevenue: 35720000 },
    { key: "22", label: "22/07", revenue: 42100000, previousRevenue: 38900000 },
    { key: "23", label: "23/07", revenue: 39200000, previousRevenue: 37100000 },
    { key: "24", label: "24/07", revenue: 44700000, previousRevenue: 41600000 },
    { key: "25", label: "25/07", revenue: 31300000, previousRevenue: 29800000 },
    { key: "26", label: "26/07", revenue: 24600000, previousRevenue: 23100000 },
    { key: "27", label: "27/07", revenue: 36800000, previousRevenue: 33900000 },
    { key: "28", label: "28/07", revenue: 40500000, previousRevenue: 37300000 },
    { key: "29", label: "29/07", revenue: 43600000, previousRevenue: 39800000 },
    { key: "30", label: "30/07", revenue: 41800000, previousRevenue: 38400000 },
  ],
};

const DAILY_REVENUE_TREND: RevenuePoint[] =
  REVENUE_TREND_BY_PERIOD["30-days"].map(
    (item, index) => ({
      ...item,
      key: `2026-07-${String(
        index + 1,
      ).padStart(2, "0")}`,
    }),
  );

const SERVICE_REVENUE_SEEDS: ServiceRevenueSeed[] = [
  {
    id: "service-01",
    name: "Khám thai định kỳ",
    category: "examination",
    baseVisits: 64,
    baseRevenue: 35200000,
    facilityRatio: { "facility-1": 0.25, "facility-2": 0.17, "facility-3": 0.24, "facility-4": 0.13, "facility-5": 0.21 },
  },
  {
    id: "service-02",
    name: "Siêu âm hình thái thai",
    category: "ultrasound",
    baseVisits: 48,
    baseRevenue: 43200000,
    facilityRatio: { "facility-1": 0.28, "facility-2": 0.15, "facility-3": 0.25, "facility-4": 0.11, "facility-5": 0.21 },
  },
  {
    id: "service-03",
    name: "Xét nghiệm sàng lọc trước sinh",
    category: "laboratory",
    baseVisits: 31,
    baseRevenue: 44950000,
    facilityRatio: { "facility-1": 0.23, "facility-2": 0.16, "facility-3": 0.27, "facility-4": 0.12, "facility-5": 0.22 },
  },
  {
    id: "service-04",
    name: "Gói quản lý thai kỳ",
    category: "package",
    baseVisits: 18,
    baseRevenue: 75600000,
    facilityRatio: { "facility-1": 0.29, "facility-2": 0.13, "facility-3": 0.26, "facility-4": 0.10, "facility-5": 0.22 },
  },
  {
    id: "service-05",
    name: "Khám thai lần đầu",
    category: "examination",
    baseVisits: 27,
    baseRevenue: 17550000,
    facilityRatio: { "facility-1": 0.22, "facility-2": 0.20, "facility-3": 0.23, "facility-4": 0.15, "facility-5": 0.20 },
  },
  {
    id: "service-06",
    name: "Tư vấn thai kỳ nguy cơ cao",
    category: "examination",
    baseVisits: 16,
    baseRevenue: 13600000,
    facilityRatio: { "facility-1": 0.27, "facility-2": 0.14, "facility-3": 0.28, "facility-4": 0.09, "facility-5": 0.22 },
  },
  {
    id: "service-07",
    name: "Siêu âm thai 4D",
    category: "ultrasound",
    baseVisits: 23,
    baseRevenue: 24150000,
    facilityRatio: { "facility-1": 0.24, "facility-2": 0.17, "facility-3": 0.25, "facility-4": 0.12, "facility-5": 0.22 },
  },
];

const SERVICE_CATEGORY_META: Record<
  ServiceCategory,
  { label: string; color: string; tagColor: string }
> = {
  examination: {
    label: "Khám & tư vấn",
    color: "#2563eb",
    tagColor: "blue",
  },
  ultrasound: {
    label: "Siêu âm",
    color: "#8b5cf6",
    tagColor: "purple",
  },
  laboratory: {
    label: "Xét nghiệm",
    color: "#0f766e",
    tagColor: "cyan",
  },
  package: {
    label: "Gói thai sản",
    color: "#f59e0b",
    tagColor: "gold",
  },
};

const FACILITY_REVENUE_SHARE: Record<string, number> = {
  "facility-1": 0.26,
  "facility-2": 0.17,
  "facility-3": 0.25,
  "facility-4": 0.12,
  "facility-5": 0.2,
};

const FACILITY_APPOINTMENT_SHARE: Record<string, number> = {
  "facility-1": 0.24,
  "facility-2": 0.16,
  "facility-3": 0.28,
  "facility-4": 0.11,
  "facility-5": 0.21,
};

const FACILITY_ON_TIME_RATE: Record<string, number> = {
  "facility-1": 97.2,
  "facility-2": 93.8,
  "facility-3": 98.1,
  "facility-4": 89.6,
  "facility-5": 95.4,
};

const PERIOD_OPTIONS: Array<{
  value: DateRangeMode;
  label: string;
}> = [
  { value: "today", label: "Hôm nay" },
  { value: "7-days", label: "7 ngày" },
  { value: "30-days", label: "30 ngày" },
  { value: "custom", label: "Tùy chọn ngày" },
];

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; color: string }
> = {
  confirmed: { label: "Đã xác nhận", color: "blue" },
  waiting: { label: "Đang chờ", color: "gold" },
  "in-progress": { label: "Đang khám", color: "purple" },
  completed: { label: "Hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "default" },
};

const SHIFT_META: Record<
  ShiftType,
  { label: string; color: string }
> = {
  morning: { label: "Ca sáng", color: "blue" },
  afternoon: { label: "Ca chiều", color: "orange" },
  evening: { label: "Ca tối", color: "purple" },
};

const STAT_TONE_CLASSES: Record<
  StatTone,
  { card: string; icon: string; trend: string }
> = {
  blue: {
    card: "border-blue-100 bg-gradient-to-br from-white to-blue-50/80",
    icon: "bg-blue-100 text-blue-700",
    trend: "text-blue-700",
  },
  emerald: {
    card: "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80",
    icon: "bg-emerald-100 text-emerald-700",
    trend: "text-emerald-700",
  },
  violet: {
    card: "border-violet-100 bg-gradient-to-br from-white to-violet-50/80",
    icon: "bg-violet-100 text-violet-700",
    trend: "text-violet-700",
  },
  amber: {
    card: "border-amber-100 bg-gradient-to-br from-white to-amber-50/80",
    icon: "bg-amber-100 text-amber-700",
    trend: "text-amber-700",
  },
};

function getFacility(facilityId: string) {
  return FACILITIES.find((facility) => facility.id === facilityId);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string) {
  const [year, month, day] =
    value.split("-");

  return `${day}/${month}/${year}`;
}

function addDaysToDateKey(
  dateKey: string,
  amount: number,
) {
  const [year, month, day] =
    dateKey.split("-").map(Number);
  const date = new Date(
    year,
    month - 1,
    day,
  );

  date.setDate(
    date.getDate() + amount,
  );

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getDate(),
    ).padStart(2, "0"),
  ].join("-");
}

function getDateRangeDayCount(
  fromDate: string,
  toDate: string,
) {
  const start = new Date(
    `${fromDate}T00:00:00`,
  );
  const end = new Date(
    `${toDate}T00:00:00`,
  );

  return Math.max(
    1,
    Math.floor(
      (end.getTime() -
        start.getTime()) /
        86_400_000,
    ) + 1,
  );
}

function getDateRangeDescription(
  fromDate: string,
  toDate: string,
) {
  if (fromDate === toDate) {
    return `Dữ liệu ngày ${formatShortDate(
      fromDate,
    )}`;
  }

  return `Dữ liệu từ ${formatShortDate(
    fromDate,
  )} đến ${formatShortDate(
    toDate,
  )}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}


function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 2,
    }).format(value / 1_000_000_000)} tỷ`;
  }

  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 1,
    }).format(value / 1_000_000)} triệu`;
  }

  return new Intl.NumberFormat("vi-VN").format(value);
}

function roundCurrency(value: number) {
  return Math.round(value / 50_000) * 50_000;
}

function getFacilityRevenueFactor(facilityId?: string) {
  if (!facilityId) return 1;
  return FACILITY_REVENUE_SHARE[facilityId] ?? 1;
}

function getVisitPeriodFactor(
  period: DateRangeMode,
  dayCount: number,
) {
  if (period === "today") return 0.16;
  if (period === "30-days") return 4.25;
  if (period === "custom") {
    return Math.max(
      0.16,
      dayCount / 7,
    );
  }

  return 1;
}

function getAlertVisual(level: AlertLevel) {
  if (level === "critical") {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      iconClass: "bg-rose-100 text-rose-700",
      borderClass: "border-rose-100 bg-rose-50/60",
      tag: <Tag color="red">Khẩn cấp</Tag>,
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
    icon: <CircleDollarSign className="h-4 w-4" />,
    iconClass: "bg-blue-100 text-blue-700",
    borderClass: "border-blue-100 bg-blue-50/60",
    tag: <Tag color="blue">Thông tin</Tag>,
  };
}

function StatCard({
  title,
  value,
  suffix,
  icon,
  trend,
  trendDirection,
  helper,
  tone,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  icon: ReactNode;
  trend: string;
  trendDirection: "up" | "down";
  helper: string;
  tone: StatTone;
}) {
  const toneClasses = STAT_TONE_CLASSES[tone];

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

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses.icon}`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 font-semibold ${toneClasses.trend}`}
        >
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
    return (
      <Empty description="Không có dữ liệu lịch hẹn trong khoảng ngày đã chọn." />
    );
  }

  const maxValue = Math.max(...data.map((item) => item.appointments), 1);

  if (data.length === 1) {
    const item = data[0];
    const completionRate =
      item.appointments === 0
        ? 0
        : Math.round((item.completed / item.appointments) * 100);

    return (
      <div className="space-y-5">
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

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Text type="secondary" className="text-sm">
                  Tổng lịch hẹn hôm nay
                </Text>
                <div className="mt-1 text-3xl font-bold text-slate-950">
                  {item.appointments}
                </div>
              </div>
              <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                100%
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-full rounded-full bg-blue-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Text type="secondary" className="text-sm">
                  Lịch đã hoàn thành
                </Text>
                <div className="mt-1 text-3xl font-bold text-slate-950">
                  {item.completed}
                </div>
              </div>
              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {completionRate}%
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Text className="font-medium text-slate-700">Tỷ lệ hoàn thành trong ngày</Text>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-40 overflow-hidden rounded-full bg-slate-200 sm:w-56">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <Text strong className="min-w-10 text-right text-slate-950">
              {completionRate}%
            </Text>
          </div>
        </div>
      </div>
    );
  }

  const width = 900;
  const height = 292;
  const padding = { top: 24, right: 24, bottom: 46, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const roundedMax = Math.max(10, Math.ceil(maxValue / 10) * 10);
  const gridValues = Array.from({ length: 5 }, (_, index) =>
    Math.round((roundedMax / 4) * index),
  );
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.max(18, Math.min(34, groupWidth * 0.25));
  const barGap = Math.max(7, Math.min(12, groupWidth * 0.08));
  const getY = (value: number) =>
    padding.top + chartHeight - (value / roundedMax) * chartHeight;

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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50 px-2 py-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto min-w-[680px] w-full"
          role="img"
          aria-label="Biểu đồ cột so sánh tổng lịch hẹn và số lịch đã hoàn thành"
        >
          {gridValues.map((value) => {
            const y = getY(value);
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {data.map((item, index) => {
            const centerX = padding.left + groupWidth * index + groupWidth / 2;
            const appointmentX = centerX - barGap / 2 - barWidth;
            const completedX = centerX + barGap / 2;
            const appointmentY = getY(item.appointments);
            const completedY = getY(item.completed);
            const appointmentHeight = padding.top + chartHeight - appointmentY;
            const completedHeight = padding.top + chartHeight - completedY;

            return (
              <g key={item.date}>
                <rect
                  x={appointmentX}
                  y={appointmentY}
                  width={barWidth}
                  height={Math.max(0, appointmentHeight)}
                  rx="6"
                  fill="#2563eb"
                >
                  <title>{`${item.label}: ${item.appointments} lịch hẹn`}</title>
                </rect>
                <rect
                  x={completedX}
                  y={completedY}
                  width={barWidth}
                  height={Math.max(0, completedHeight)}
                  rx="6"
                  fill="#10b981"
                >
                  <title>{`${item.label}: ${item.completed} lịch hoàn thành`}</title>
                </rect>

                <text
                  x={appointmentX + barWidth / 2}
                  y={Math.max(14, appointmentY - 8)}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#1e3a8a"
                >
                  {item.appointments}
                </text>
                {item.completed > 0 && (
                  <text
                    x={completedX + barWidth / 2}
                    y={Math.max(14, completedY - 8)}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#047857"
                  >
                    {item.completed}
                  </text>
                )}
                <text
                  x={centerX}
                  y={height - 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="500"
                  fill="#64748b"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function RevenueMetricCard({
  label,
  value,
  helper,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  helper: ReactNode;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <Card className="h-full border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Text type="secondary" className="block text-sm">
            {label}
          </Text>
          <div className="mt-1 truncate text-2xl font-bold text-slate-950">
            {value}
          </div>
          <div className="mt-2 text-xs text-slate-500">{helper}</div>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

function RevenueLineChart({ data }: { data: RevenuePoint[] }) {
  if (data.length === 0) {
    return (
      <Empty description="Không có dữ liệu doanh thu trong khoảng ngày đã chọn." />
    );
  }

  const width = 920;
  const height = 278;
  const padding = { top: 18, right: 22, bottom: 40, left: 72 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    ...data.flatMap((item) => [item.revenue, item.previousRevenue]),
    1,
  );
  const roundedMax = Math.ceil(maxValue / 10_000_000) * 10_000_000;
  const gridValues = Array.from({ length: 5 }, (_, index) =>
    Math.round((roundedMax / 4) * index),
  );

  const getX = (index: number) =>
    padding.left +
    (data.length <= 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
  const getY = (value: number) =>
    padding.top + chartHeight - (value / roundedMax) * chartHeight;

  const currentPoints = data
    .map((item, index) => `${getX(index)},${getY(item.revenue)}`)
    .join(" ");
  const previousPoints = data
    .map((item, index) => `${getX(index)},${getY(item.previousRevenue)}`)
    .join(" ");
  const areaPath = data.length
    ? `M ${getX(0)} ${padding.top + chartHeight} L ${data
        .map((item, index) => `${getX(index)} ${getY(item.revenue)}`)
        .join(" L ")} L ${getX(data.length - 1)} ${padding.top + chartHeight} Z`
    : "";
  const labelStep = data.length > 15 ? 5 : data.length > 8 ? 2 : 1;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          Kỳ hiện tại
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 border-t-2 border-dashed border-slate-400" />
          Kỳ trước tương ứng
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto min-w-[680px] w-full"
          role="img"
          aria-label="Biểu đồ đường thể hiện xu hướng doanh thu theo thời gian"
        >
          <defs>
            <linearGradient id="dashboardRevenueArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridValues.map((value) => {
            const y = getY(value);
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {formatCompactCurrency(value)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#dashboardRevenueArea)" />
          <polyline
            points={previousPoints}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="7 6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={currentPoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {data.map((item, index) => (
            <g key={item.key}>
              <circle
                cx={getX(index)}
                cy={getY(item.revenue)}
                r="4.5"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="3"
              >
                <title>{`${item.label}: ${formatCurrency(item.revenue)}`}</title>
              </circle>
              {(index % labelStep === 0 || index === data.length - 1) && (
                <text
                  x={getX(index)}
                  y={height - 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                >
                  {item.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <Text type="secondary" className="mt-1 block text-xs">
        Trục ngang là thời gian; trục dọc là doanh thu phát sinh trong từng khoảng thời gian, không phải doanh thu lũy kế.
      </Text>
    </div>
  );
}

function RevenueMixDonut({
  items,
  totalRevenue,
}: {
  items: RevenueMixItem[];
  totalRevenue: number;
}) {
  let cursor = 0;
  const gradientStops = items.map((item) => {
    const start = cursor;
    cursor += item.percent;
    return `${item.color} ${start}% ${cursor}%`;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-center">
      <div
        className="mx-auto flex h-44 w-44 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${gradientStops.join(", ")})` }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
          <Text type="secondary" className="text-[11px] uppercase tracking-wide">
            Tổng doanh thu
          </Text>
          <Text strong className="mt-1 text-base text-slate-950">
            {formatCompactCurrency(totalRevenue)}
          </Text>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0">
                <Text strong className="block truncate text-sm text-slate-950">
                  {item.label}
                </Text>
                <Text type="secondary" className="block text-xs">
                  {item.percent.toFixed(1).replace(".", ",")}% tổng doanh thu
                </Text>
              </div>
            </div>
            <Text strong className="shrink-0 text-sm text-slate-950">
              {formatCompactCurrency(item.revenue)}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceRankingChart({ data }: { data: ServicePerformance[] }) {
  const maxVisits = Math.max(...data.map((item) => item.visits), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const widthPercent = Math.max(4, (item.visits / maxVisits) * 100);
        const category = SERVICE_CATEGORY_META[item.category];

        return (
          <div key={item.id}>
            <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <Text strong className="block truncate text-sm text-slate-950">
                    {item.name}
                  </Text>
                  <Tag color={category.tagColor} className="!mt-1 !text-[10px]">
                    {category.label}
                  </Tag>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-3 gap-4 text-right text-xs sm:min-w-[330px]">
                <div>
                  <Text type="secondary" className="block text-[10px] uppercase">
                    Số lượt
                  </Text>
                  <Text strong>{item.visits}</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-[10px] uppercase">
                    Doanh thu
                  </Text>
                  <Text strong>{formatCompactCurrency(item.revenue)}</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-[10px] uppercase">
                    TB/lượt
                  </Text>
                  <Text strong>{formatCompactCurrency(item.averageRevenue)}</Text>
                </div>
              </div>
            </div>

            <div className="ml-8 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${widthPercent}%` }}
                title={`${item.visits} lượt`}
              />
            </div>
          </div>
        );
      })}

      <Text type="secondary" className="block text-xs">
        Chiều dài thanh biểu diễn số lượt sử dụng dịch vụ. Doanh thu và doanh thu trung bình được hiển thị riêng để tránh dùng chung hai đơn vị trên một trục.
      </Text>
    </div>
  );
}

function ShiftCard({ shift }: { shift: DoctorShift }) {
  const facility = getFacility(shift.facilityId);
  const fillPercent =
    shift.maxAppointments === 0
      ? 0
      : Math.round((shift.bookedAppointments / shift.maxAppointments) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              shift.doctorName
                ? "bg-blue-50 text-blue-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {shift.doctorName ? (
              <Stethoscope className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Text strong className="truncate text-slate-950">
                {shift.doctorName
                  ? `${shift.doctorTitle} ${shift.doctorName}`
                  : "Chưa phân công bác sĩ"}
              </Text>
              <Tag color={SHIFT_META[shift.shiftType].color}>
                {SHIFT_META[shift.shiftType].label}
              </Tag>
            </div>
            <Text type="secondary" className="mt-0.5 block truncate text-xs">
              {shift.specialty} · {shift.roomName}
            </Text>
            <Text type="secondary" className="mt-0.5 block truncate text-xs">
              {facility?.name} · {shift.timeRange}
            </Text>
          </div>
        </div>

        <Text strong className="shrink-0 text-xs text-slate-700">
          {shift.bookedAppointments}/{shift.maxAppointments}
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

function getChatSocketUrl() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
}

function ManagementChatStatusCard() {
  const [socketConnected, setSocketConnected] = useState(false);
  const [queue, setQueue] = useState<ChatbotConversation[]>([]);

  useEffect(() => {
    const socket: Socket = io(`${getChatSocketUrl()}/chatbot`, {
      transports: ["websocket", "polling"],
      auth: { mode: "staff" },
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("connect_error", () => setSocketConnected(false));
    socket.on("chatbot:staff-queue", (nextQueue: ChatbotConversation[]) => {
      setQueue(nextQueue);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const waitingCount = queue.filter(
    (conversation) =>
      conversation.status === "waiting_for_staff" && !conversation.assignedStaffId,
  ).length;
  const activeCount = queue.filter((conversation) => conversation.assignedStaffName).length;
  const visibleQueue = queue.slice(0, 4);

  return (
    <Card
      className="border-teal-100 bg-white"
      title={
        <div>
          <p className="mb-0 text-base font-semibold text-slate-950">
            Trạng thái tư vấn realtime
          </p>
          <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
            Theo dõi cuộc chat nào đang chờ và bác sĩ/tư vấn viên nào đang reply.
          </p>
        </div>
      }
      extra={
        <div className="flex items-center gap-2">
          <Badge count={waitingCount} color="#f97316" />
          <Tag color={socketConnected ? "green" : "red"}>
            {socketConnected ? "Socket online" : "Socket offline"}
          </Tag>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-orange-50 p-4">
          <Text type="secondary" className="block text-xs">
            Đang chờ bác sĩ
          </Text>
          <Text strong className="text-2xl text-orange-700">
            {waitingCount}
          </Text>
        </div>
        <div className="rounded-xl bg-teal-50 p-4">
          <Text type="secondary" className="block text-xs">
            Đang có người reply
          </Text>
          <Text strong className="text-2xl text-teal-700">
            {activeCount}
          </Text>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <Text type="secondary" className="block text-xs">
            Tổng cuộc chat hỗ trợ
          </Text>
          <Text strong className="text-2xl text-slate-950">
            {queue.length}
          </Text>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {visibleQueue.length ? (
          visibleQueue.map((conversation) => {
            const lastMessage = conversation.messages.at(-1);

            return (
              <div
                key={conversation.conversationId}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <Text strong className="block truncate text-slate-950">
                        {conversation.requester?.name
                          ? conversation.requester.name
                          : `Chat #${conversation.conversationId.slice(0, 8)}`}
                      </Text>
                      <Text type="secondary" className="mt-1 block truncate text-xs">
                        {conversation.requester?.phone
                          ? `${conversation.requester.phone} · ${lastMessage?.content ?? "Chưa có tin nhắn"}`
                          : lastMessage?.content ?? "Chưa có tin nhắn"}
                      </Text>
                    </div>
                  </div>
                  <Tag color={conversation.assignedStaffName ? "green" : "orange"}>
                    {conversation.assignedStaffName
                      ? `Đang rep: ${conversation.assignedStaffName}`
                      : "Chờ bác sĩ"}
                  </Tag>
                </div>
              </div>
            );
          })
        ) : (
          <div className="lg:col-span-2">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có cuộc chat cần bác sĩ/tư vấn viên hỗ trợ"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ManagementDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>();
  const [period, setPeriod] =
    useState<DateRangeMode>("7-days");
  const [fromDate, setFromDate] = useState(
    addDaysToDateKey(MOCK_TODAY, -6),
  );
  const [toDate, setToDate] =
    useState(MOCK_TODAY);
  const [keyword, setKeyword] = useState("");
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState("18:20");

  const appointmentPageSize = 5;

  useEffect(() => {
    setAppointmentPage(1);
  }, [
    keyword,
    selectedFacilityId,
    fromDate,
    toDate,
  ]);

  const visibleAppointments = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return APPOINTMENTS.filter((appointment) => {
      const matchesFacility =
        !selectedFacilityId ||
        appointment.facilityId ===
          selectedFacilityId;
      const matchesDate =
        appointment.appointmentDate >=
          fromDate &&
        appointment.appointmentDate <=
          toDate;
      const matchesKeyword =
        !search ||
        [
          appointment.code,
          appointment.patientName,
          appointment.service,
          appointment.doctorName,
          appointment.roomName,
        ].some((value) => value.toLowerCase().includes(search));

      return (
        matchesFacility &&
        matchesDate &&
        matchesKeyword
      );
    });
  }, [
    keyword,
    selectedFacilityId,
    fromDate,
    toDate,
  ]);

  const visibleShifts = useMemo(
    () =>
      DOCTOR_SHIFTS.filter(
        (shift) =>
          !selectedFacilityId || shift.facilityId === selectedFacilityId,
      ),
    [selectedFacilityId],
  );

  const visibleFacilityUtilization = useMemo(
    () =>
      FACILITY_UTILIZATION.filter(
        (item) =>
          !selectedFacilityId || item.facilityId === selectedFacilityId,
      ),
    [selectedFacilityId],
  );


  const dateRangeDays = useMemo(
    () =>
      getDateRangeDayCount(
        fromDate,
        toDate,
      ),
    [fromDate, toDate],
  );

  const appointmentTrend =
    useMemo(() => {
      const factor =
        selectedFacilityId
          ? FACILITY_APPOINTMENT_SHARE[
              selectedFacilityId
            ] ?? 1
          : 1;

      return DAILY_APPOINTMENT_METRICS
        .filter(
          (item) =>
            item.date >= fromDate &&
            item.date <= toDate,
        )
        .map((item) => ({
          ...item,
          appointments: Math.max(
            0,
            Math.round(
              item.appointments *
                factor,
            ),
          ),
          completed: Math.max(
            0,
            Math.round(
              item.completed *
                factor,
            ),
          ),
        }));
    }, [
      fromDate,
      selectedFacilityId,
      toDate,
    ]);

  const revenueTrend = useMemo(() => {
    const factor =
      getFacilityRevenueFactor(
        selectedFacilityId,
      );

    return DAILY_REVENUE_TREND
      .filter(
        (item) =>
          item.key >= fromDate &&
          item.key <= toDate,
      )
      .map((item) => ({
        ...item,
        revenue: roundCurrency(
          item.revenue * factor,
        ),
        previousRevenue:
          roundCurrency(
            item.previousRevenue *
              factor,
          ),
      }));
  }, [
    fromDate,
    selectedFacilityId,
    toDate,
  ]);

  const revenueSummary = useMemo(() => {
    const totalRevenue = revenueTrend.reduce(
      (sum, item) => sum + item.revenue,
      0,
    );
    const previousRevenue = revenueTrend.reduce(
      (sum, item) => sum + item.previousRevenue,
      0,
    );
    const collectedRevenue = roundCurrency(totalRevenue * 0.914);
    const outstandingRevenue = roundCurrency(totalRevenue * 0.071);
    const refundedRevenue = Math.max(
      0,
      totalRevenue - collectedRevenue - outstandingRevenue,
    );
    const baseTransactions =
      Math.max(
        12,
        Math.round(
          dateRangeDays * 31.5,
        ),
      );
    const transactions = Math.max(
      1,
      Math.round(
        baseTransactions *
          getFacilityRevenueFactor(
            selectedFacilityId,
          ),
      ),
    );
    const comparisonPercent =
      previousRevenue === 0
        ? 0
        : ((totalRevenue - previousRevenue) / previousRevenue) * 100;

    return {
      totalRevenue,
      previousRevenue,
      collectedRevenue,
      outstandingRevenue,
      refundedRevenue,
      transactions,
      averageTransaction: totalRevenue / transactions,
      comparisonPercent,
      collectionRate:
        totalRevenue === 0 ? 0 : (collectedRevenue / totalRevenue) * 100,
    };
  }, [
    dateRangeDays,
    revenueTrend,
    selectedFacilityId,
  ]);

  const servicePerformance = useMemo<ServicePerformance[]>(() => {
    const visitFactor =
      getVisitPeriodFactor(
        period,
        dateRangeDays,
      );
    const rawRows = SERVICE_REVENUE_SEEDS.map((service) => {
      const facilityRatio = selectedFacilityId
        ? service.facilityRatio[selectedFacilityId] ?? 0
        : 1;

      return {
        service,
        visits: Math.max(
          1,
          Math.round(service.baseVisits * visitFactor * facilityRatio),
        ),
        rawRevenue: service.baseRevenue * facilityRatio,
      };
    });
    const rawRevenueTotal = rawRows.reduce(
      (sum, item) => sum + item.rawRevenue,
      0,
    );
    const allocatableRevenue = revenueSummary.totalRevenue * 0.96;

    return rawRows
      .map(({ service, visits, rawRevenue }) => {
        const revenue = roundCurrency(
          rawRevenueTotal === 0
            ? 0
            : (rawRevenue / rawRevenueTotal) * allocatableRevenue,
        );

        return {
          id: service.id,
          name: service.name,
          category: service.category,
          visits,
          revenue,
          averageRevenue: visits === 0 ? 0 : revenue / visits,
          revenueShare:
            revenueSummary.totalRevenue === 0
              ? 0
              : (revenue / revenueSummary.totalRevenue) * 100,
        };
      })
      .sort((first, second) => second.visits - first.visits);
  }, [
    dateRangeDays,
    period,
    revenueSummary.totalRevenue,
    selectedFacilityId,
  ]);

  const revenueMix = useMemo<RevenueMixItem[]>(() => {
    const grouped = new Map<ServiceCategory, number>();

    servicePerformance.forEach((service) => {
      grouped.set(
        service.category,
        (grouped.get(service.category) ?? 0) + service.revenue,
      );
    });

    const categoryItems = (
      Object.keys(SERVICE_CATEGORY_META) as ServiceCategory[]
    ).map((category) => ({
      key: category,
      label: SERVICE_CATEGORY_META[category].label,
      revenue: grouped.get(category) ?? 0,
      percent:
        revenueSummary.totalRevenue === 0
          ? 0
          : ((grouped.get(category) ?? 0) / revenueSummary.totalRevenue) * 100,
      color: SERVICE_CATEGORY_META[category].color,
    }));
    const allocatedRevenue = categoryItems.reduce(
      (sum, item) => sum + item.revenue,
      0,
    );
    const otherRevenue = Math.max(
      0,
      revenueSummary.totalRevenue - allocatedRevenue,
    );

    return [
      ...categoryItems,
      {
        key: "other",
        label: "Dịch vụ khác",
        revenue: otherRevenue,
        percent:
          revenueSummary.totalRevenue === 0
            ? 0
            : (otherRevenue / revenueSummary.totalRevenue) * 100,
        color: "#94a3b8",
      },
    ].filter((item) => item.revenue > 0);
  }, [revenueSummary.totalRevenue, servicePerformance]);

  const facilityRevenueRows = useMemo<FacilityRevenueRow[]>(() => {
    const facilityIds = selectedFacilityId
      ? [selectedFacilityId]
      : FACILITIES.map((facility) => facility.id);
    const totalShare = facilityIds.reduce(
      (sum, facilityId) => sum + (FACILITY_REVENUE_SHARE[facilityId] ?? 0),
      0,
    );

    return facilityIds.map((facilityId) => {
      const normalizedShare = selectedFacilityId
        ? 1
        : (FACILITY_REVENUE_SHARE[facilityId] ?? 0) / totalShare;
      const revenue = roundCurrency(
        revenueSummary.totalRevenue * normalizedShare,
      );
      const previousRevenue = roundCurrency(
        revenueSummary.previousRevenue * normalizedShare,
      );
      const transactions = Math.max(
        1,
        Math.round(revenueSummary.transactions * normalizedShare),
      );
      const collected = roundCurrency(revenue * 0.914);

      return {
        key: facilityId,
        facilityId,
        revenue,
        previousRevenue,
        transactions,
        collected,
        outstanding: Math.max(0, revenue - collected),
      };
    });
  }, [revenueSummary, selectedFacilityId]);

  const appointmentSummary = useMemo(() => {
    const total = visibleAppointments.length;
    const completed = visibleAppointments.filter(
      (appointment) => appointment.status === "completed",
    ).length;
    const waiting = visibleAppointments.filter((appointment) =>
      ["waiting", "confirmed", "in-progress"].includes(appointment.status),
    ).length;
    const cancelled = visibleAppointments.filter(
      (appointment) => appointment.status === "cancelled",
    ).length;

    return { total, completed, waiting, cancelled };
  }, [visibleAppointments]);

  const trackedPregnancies =
    Math.max(
      1,
      Math.round(
        1284 *
          (selectedFacilityId
            ? FACILITY_REVENUE_SHARE[
                selectedFacilityId
              ] ?? 1
            : 1),
      ),
    );

  const activeStaffCount =
    selectedFacilityId
      ? Math.max(
          4,
          visibleShifts.filter(
            (shift) =>
              shift.doctorName,
          ).length * 3 + 2,
        )
      : 68;

  const onTimeRate =
    selectedFacilityId
      ? FACILITY_ON_TIME_RATE[
          selectedFacilityId
        ] ?? 94.2
      : 95.6;

  function applyPeriod(
    nextPeriod: DateRangeMode,
  ) {
    setPeriod(nextPeriod);

    if (nextPeriod === "custom") {
      return;
    }

    if (nextPeriod === "today") {
      setFromDate(MOCK_TODAY);
      setToDate(MOCK_TODAY);
      return;
    }

    if (nextPeriod === "7-days") {
      setFromDate(
        addDaysToDateKey(
          MOCK_TODAY,
          -6,
        ),
      );
      setToDate(MOCK_TODAY);
      return;
    }

    setFromDate(
      addDaysToDateKey(
        MOCK_TODAY,
        -29,
      ),
    );
    setToDate(MOCK_TODAY);
  }

  const appointmentColumns: ColumnsType<Appointment> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (_value, _appointment, index) =>
        (appointmentPage - 1) * appointmentPageSize + index + 1,
    },
    {
      title: "Thời gian",
      width: 105,
      render: (_value, appointment) => (
        <div>
          <Text strong className="block text-slate-950">
            {appointment.time}
          </Text>
          <Text type="secondary" className="block text-xs">
            {appointment.code}
          </Text>
        </div>
      ),
    },
    {
      title: "Thai phụ",
      width: 210,
      render: (_value, appointment) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">
            <Baby className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <Text strong className="block truncate text-slate-950">
              {appointment.patientName}
            </Text>
            <Text type="secondary" className="block truncate text-xs">
              Thai {appointment.gestationalAge}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Dịch vụ",
      dataIndex: "service",
      width: 210,
      ellipsis: true,
    },
    {
      title: "Bác sĩ phụ trách",
      width: 205,
      render: (_value, appointment) => (
        <div>
          <Text strong className="block truncate text-slate-900">
            {appointment.doctorTitle} {appointment.doctorName}
          </Text>
          <Text type="secondary" className="block truncate text-xs">
            {appointment.roomName}
          </Text>
        </div>
      ),
    },
    {
      title: "Cơ sở",
      width: 175,
      render: (_value, appointment) => {
        const facility = getFacility(appointment.facilityId);

        return (
          <div>
            <Text className="block truncate">{facility?.name}</Text>
            <Text type="secondary" className="block text-xs">
              {facility?.code}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      width: 125,
      align: "center",
      render: (_value, appointment) => (
        <Tag color={STATUS_META[appointment.status].color}>
          {STATUS_META[appointment.status].label}
        </Tag>
      ),
    },
  ];

  const activeDoctors = visibleShifts.filter((shift) => shift.doctorName).length;
  const vacantShifts = visibleShifts.filter((shift) => !shift.doctorName).length;
  const totalBooked = visibleShifts.reduce(
    (sum, shift) => sum + shift.bookedAppointments,
    0,
  );
  const totalCapacity = visibleShifts.reduce(
    (sum, shift) => sum + shift.maxAppointments,
    0,
  );
  const bookingRate =
    totalCapacity === 0 ? 0 : Math.round((totalBooked / totalCapacity) * 100);

  function refreshDashboard() {
    const currentTime = new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

    setLastRefresh(currentTime);
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Tổng quan vận hành phòng khám, lịch hẹn, ca trực và các công việc cần xử lý."
      />

      <div className="mt-6 flex flex-col gap-5">
        <Alert
          type="info"
          showIcon
          title="Màn hình đang sử dụng dữ liệu mô phỏng"
          description="Các số liệu được dựng để xem giao diện và chưa kết nối API."
        />

        <Card className="border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <Title level={4} className="!mb-1 !text-slate-950">
                {activeTab === "overview"
                  ? "Tổng quan hoạt động"
                  : "Phân tích doanh thu"}
              </Title>
              <Text type="secondary">
                {getDateRangeDescription(
                  fromDate,
                  toDate,
                )}
              </Text>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end xl:justify-end">
              <Select
                allowClear
                value={selectedFacilityId}
                className="w-full sm:w-[260px]"
                placeholder="Tất cả cơ sở"
                options={FACILITIES.map((facility) => ({
                  value: facility.id,
                  label: `${facility.name} (${facility.code})`,
                }))}
                onChange={setSelectedFacilityId}
              />

              <Select<DateRangeMode>
                value={period}
                className="w-full sm:w-[145px]"
                options={PERIOD_OPTIONS}
                onChange={applyPeriod}
              />

              <div className="w-full sm:w-[155px]">
                <Text
                  type="secondary"
                  className="mb-1 block text-xs"
                >
                  Từ ngày
                </Text>
                <Input
                  type="date"
                  value={fromDate}
                  min="2026-07-01"
                  max={toDate}
                  onChange={(event) => {
                    setFromDate(
                      event.target.value,
                    );
                    setPeriod("custom");
                  }}
                />
              </div>

              <div className="w-full sm:w-[155px]">
                <Text
                  type="secondary"
                  className="mb-1 block text-xs"
                >
                  Đến ngày
                </Text>
                <Input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max="2026-07-30"
                  onChange={(event) => {
                    setToDate(
                      event.target.value,
                    );
                    setPeriod("custom");
                  }}
                />
              </div>

              <Tooltip title={`Cập nhật lần cuối lúc ${lastRefresh}`}>
                <Button
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={refreshDashboard}
                >
                  Làm mới
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white" styles={{ body: { paddingBottom: 0 } }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as DashboardTab)}
            items={[
              { key: "overview", label: "Tổng quan vận hành" },
              { key: "revenue", label: "Doanh thu & dịch vụ" },
            ]}
          />
        </Card>

        <div
          className={
            activeTab === "overview"
              ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              : "hidden"
          }
        >
          <StatCard
            title="Lịch hẹn trong kỳ"
            value={visibleAppointments.length}
            icon={<CalendarCheck className="h-5 w-5" />}
            trend="+12,5%"
            trendDirection="up"
            helper={`${dateRangeDays} ngày được chọn`}
            tone="blue"
          />
          <StatCard
            title="Thai phụ đang theo dõi"
            value={trackedPregnancies}
            icon={<Baby className="h-5 w-5" />}
            trend="+38 hồ sơ"
            trendDirection="up"
            helper={
              selectedFacilityId
                ? "tại cơ sở đang chọn"
                : "trên toàn hệ thống"
            }
            tone="violet"
          />
          <StatCard
            title="Bác sĩ đang trực"
            value={activeDoctors}
            suffix={`/ ${visibleShifts.length}`}
            icon={<UserRoundCheck className="h-5 w-5" />}
            trend={vacantShifts > 0 ? `${vacantShifts} ca trống` : "Đủ nhân sự"}
            trendDirection={vacantShifts > 0 ? "down" : "up"}
            helper="trong ngày hôm nay"
            tone="emerald"
          />
        </div>

        <div className={activeTab === "overview" ? "contents" : "hidden"}>
          <ManagementChatStatusCard />
        </div>

        <div
          className={activeTab === "revenue" ? "contents" : "hidden"}
        >
          <Card className="border-slate-200 bg-slate-950 text-white">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                  <Banknote className="h-4 w-4" />
                </span>
                <Title level={4} className="!mb-0 !text-white">
                  Phân tích doanh thu
                </Title>
              </div>
              <Text className="mt-2 block !text-slate-300">
                Doanh thu đã ghi nhận theo thời gian, nguồn thu, dịch vụ và từng cơ sở.
              </Text>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <Text className="!text-slate-300">Mức hoàn thành mục tiêu kỳ này</Text>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-2xl font-bold text-white">92,4%</span>
                <span className="pb-1 text-xs text-emerald-300">+4,1 điểm %</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RevenueMetricCard
            label="Tổng doanh thu ghi nhận"
            value={formatCurrency(revenueSummary.totalRevenue)}
            icon={<Banknote className="h-5 w-5" />}
            iconClass="bg-blue-50 text-blue-700"
            helper={
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-semibold text-emerald-700">
                  {revenueSummary.comparisonPercent >= 0 ? "+" : ""}
                  {revenueSummary.comparisonPercent.toFixed(1).replace(".", ",")}%
                </span>
                so với kỳ trước
              </span>
            }
          />
          <RevenueMetricCard
            label="Đã thu thành công"
            value={formatCurrency(revenueSummary.collectedRevenue)}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClass="bg-emerald-50 text-emerald-700"
            helper={`${revenueSummary.collectionRate
              .toFixed(1)
              .replace(".", ",")}% tổng doanh thu · ${revenueSummary.transactions} giao dịch`}
          />
          <RevenueMetricCard
            label="Chờ thanh toán / đối soát"
            value={formatCurrency(revenueSummary.outstandingRevenue)}
            icon={<Clock3 className="h-5 w-5" />}
            iconClass="bg-amber-50 text-amber-700"
            helper={`Hoàn trả và điều chỉnh: ${formatCompactCurrency(
              revenueSummary.refundedRevenue,
            )}`}
          />
          <RevenueMetricCard
            label="Doanh thu trung bình / giao dịch"
            value={formatCurrency(revenueSummary.averageTransaction)}
            icon={<CircleDollarSign className="h-5 w-5" />}
            iconClass="bg-violet-50 text-violet-700"
            helper="Tổng doanh thu chia cho số giao dịch ghi nhận"
          />
        </div>

        <Card
          className="border-slate-200 bg-white"
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Xu hướng doanh thu theo thời gian
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                So sánh doanh thu phát sinh của kỳ hiện tại với kỳ trước tương ứng.
              </p>
            </div>
          }
          extra={
            <Tag color="blue">
              {PERIOD_OPTIONS.find((item) => item.value === period)?.label}
            </Tag>
          }
        >
          <RevenueLineChart data={revenueTrend} />
        </Card>

        <Card
          className="border-slate-200 bg-white"
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Cơ cấu doanh thu
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Tỷ trọng doanh thu theo nhóm dịch vụ trong cùng kỳ.
              </p>
            </div>
          }
        >
          <RevenueMixDonut
            items={revenueMix}
            totalRevenue={revenueSummary.totalRevenue}
          />
        </Card>

        <Card
          className="border-slate-200 bg-white"
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Dịch vụ được sử dụng nhiều nhất
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Xếp hạng theo số lượt, kèm doanh thu và giá trị trung bình mỗi lượt.
              </p>
            </div>
          }
          extra={
            <Tag color="geekblue">
              Top {Math.min(7, servicePerformance.length)}
            </Tag>
          }
        >
          <ServiceRankingChart data={servicePerformance.slice(0, 7)} />
        </Card>

        <Card
          className="border-slate-200 bg-white"
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Doanh thu theo cơ sở
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Đối chiếu doanh thu, giao dịch đã thu và khoản còn chờ.
              </p>
            </div>
          }
        >
          <Table<FacilityRevenueRow>
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 720 }}
            dataSource={facilityRevenueRows}
            columns={[
              {
                title: "Cơ sở",
                width: 260,
                render: (_value, row) => {
                  const facility = getFacility(row.facilityId);
                  return (
                    <div>
                      <Text strong className="block text-slate-950">
                        {facility?.name}
                      </Text>
                      <Text type="secondary" className="block text-xs">
                        {facility?.code} · {row.transactions} giao dịch
                      </Text>
                    </div>
                  );
                },
              },
              {
                title: "Doanh thu",
                width: 160,
                align: "right",
                render: (_value, row) => {
                  const change =
                    row.previousRevenue === 0
                      ? 0
                      : ((row.revenue - row.previousRevenue) /
                          row.previousRevenue) *
                        100;
                  return (
                    <div>
                      <Text strong className="block text-slate-950">
                        {formatCompactCurrency(row.revenue)}
                      </Text>
                      <Text
                        className={`block text-xs ${
                          change >= 0 ? "!text-emerald-600" : "!text-rose-600"
                        }`}
                      >
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(1).replace(".", ",")}%
                      </Text>
                    </div>
                  );
                },
              },
              {
                title: "Đã thu",
                width: 150,
                align: "right",
                render: (_value, row) => formatCompactCurrency(row.collected),
              },
              {
                title: "Còn chờ",
                width: 150,
                align: "right",
                render: (_value, row) => (
                  <Text className="!text-amber-700">
                    {formatCompactCurrency(row.outstanding)}
                  </Text>
                ),
              },
            ]}
          />

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <Text strong className="block text-slate-950">
              Dịch vụ dẫn đầu về lượt khám
            </Text>
            <Text type="secondary" className="mt-1 block text-sm">
              {servicePerformance[0]?.name ?? "Chưa có dữ liệu"}: {servicePerformance[0]?.visits ?? 0} lượt,
              doanh thu {formatCompactCurrency(servicePerformance[0]?.revenue ?? 0)}.
            </Text>
          </div>
        </Card>

          <Alert
            type="warning"
            showIcon
            title="05 khoản thanh toán đang chờ đối soát"
            description="Tổng giá trị 8.750.000 ₫ đang chờ xác nhận từ bộ phận thu ngân."
          />
        </div>
        <div
          className={activeTab === "overview" ? "contents" : "hidden"}
        >
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
          extra={
            <Tag color="blue">
              {PERIOD_OPTIONS.find((item) => item.value === period)?.label}
            </Tag>
          }
        >
          <AppointmentTrendChart
            data={appointmentTrend}
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
                Phân bổ lịch hẹn, tỷ lệ hoàn thành và công suất trong ngày hôm nay.
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
                {appointmentSummary.waiting}
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
              <Progress
                percent={
                  appointmentSummary.total === 0
                    ? 0
                    : Math.round(
                        (appointmentSummary.completed /
                          appointmentSummary.total) *
                          100,
                      )
                }
                showInfo={false}
                size="small"
                status="success"
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <Text>Công suất lịch khám</Text>
                <Text strong>
                  {totalBooked}/{totalCapacity}
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
                Lịch hẹn trong khoảng ngày
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Danh sách lịch hẹn phù hợp cơ sở và khoảng ngày đang chọn.
              </p>
            </div>
          }
        >
          <Input
            allowClear
            value={keyword}
            prefix={<Search className="h-4 w-4 text-slate-400" />}
            placeholder="Tìm mã lịch, thai phụ, dịch vụ, bác sĩ..."
            className="mb-4 max-w-[420px]"
            onChange={(event) => setKeyword(event.target.value)}
          />

          <Table<Appointment>
            rowKey="id"
            size="middle"
            columns={appointmentColumns}
            dataSource={visibleAppointments}
            pagination={{
              current: appointmentPage,
              pageSize: appointmentPageSize,
              total: visibleAppointments.length,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total} lịch hẹn`,
              onChange: setAppointmentPage,
            }}
            scroll={{ x: 1095 }}
            locale={{
              emptyText: (
                <Empty description="Không có lịch hẹn phù hợp bộ lọc." />
              ),
            }}
          />
        </Card>

        <Card
          className="border-slate-200 bg-white"
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Ca trực hôm nay
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Theo dõi bác sĩ, phòng khám và công suất từng ca.
              </p>
            </div>
          }
          extra={
            <Badge
              count={vacantShifts}
              showZero
              color={vacantShifts > 0 ? "#f59e0b" : "#10b981"}
            />
          }
        >
          {visibleShifts.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleShifts.map((shift) => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
          ) : (
            <Empty description="Không có ca trực tại cơ sở này." />
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
                Các cảnh báo vận hành đang cần nhân viên phụ trách.
              </p>
            </div>
          }
          extra={
            <Badge
              count={ALERTS.filter((item) => item.id !== "alert-04").length}
              color="#ef4444"
            />
          }
        >
          <div className="grid gap-3 xl:grid-cols-3">
            {ALERTS.filter((item) => item.id !== "alert-04").map((item) => {
              const visual = getAlertVisual(item.level);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 ${visual.borderClass}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${visual.iconClass}`}
                      >
                        {visual.icon}
                      </span>
                      <div className="min-w-0">
                        <Text strong className="block text-slate-950">
                          {item.title}
                        </Text>
                        <Text
                          type="secondary"
                          className="mt-1 block text-sm leading-6"
                        >
                          {item.description}
                        </Text>
                        <Text
                          type="secondary"
                          className="mt-1.5 block text-xs"
                        >
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
        </Card>

        <Card
          className="border-slate-200 bg-white"
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Hiệu suất cơ sở
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Mức sử dụng lịch khám, phòng và nhân sự trong ngày.
              </p>
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleFacilityUtilization.map((item) => {
              const facility = getFacility(item.facilityId);
              const appointmentPercent = Math.round(
                (item.appointments / item.maxAppointments) * 100,
              );
              const roomPercent = Math.round(
                (item.roomsInUse / item.totalRooms) * 100,
              );

              return (
                <div
                  key={item.facilityId}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <Text strong className="block truncate text-slate-950">
                          {facility?.name}
                        </Text>
                        <Text type="secondary" className="block text-xs">
                          {facility?.code} · {item.activeDoctors} bác sĩ đang trực
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
                      <Progress
                        percent={appointmentPercent}
                        showInfo={false}
                        size="small"
                      />
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <Text type="secondary">Phòng đang sử dụng</Text>
                        <Text strong>
                          {item.roomsInUse}/{item.totalRooms}
                        </Text>
                      </div>
                      <Progress
                        percent={roomPercent}
                        showInfo={false}
                        size="small"
                        status="success"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <Users className="mx-auto h-5 w-5 text-slate-500" />
              <div className="mt-2 text-xl font-bold text-slate-950">
                {activeStaffCount}
              </div>
              <Text type="secondary" className="text-xs">
                Nhân sự hoạt động
              </Text>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <HeartPulse className="mx-auto h-5 w-5 text-slate-500" />
              <div className="mt-2 text-xl font-bold text-slate-950">
                {onTimeRate
                  .toFixed(1)
                  .replace(".", ",")}
                %
              </div>
              <Text type="secondary" className="text-xs">
                Lịch khám đúng giờ
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
                  Thời gian chờ trung bình
                </Text>
                <Text strong className="text-lg text-slate-950">
                  12 phút
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
                  {onTimeRate
                    .toFixed(1)
                    .replace(".", ",")}
                  %
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
                  Bác sĩ có lịch hôm nay
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
                  {visibleFacilityUtilization.reduce(
                    (sum, item) =>
                      sum +
                      item.roomsInUse,
                    0,
                  )}{" "}
                  /{" "}
                  {visibleFacilityUtilization.reduce(
                    (sum, item) =>
                      sum +
                      item.totalRooms,
                    0,
                  )}{" "}
                  phòng
                </Text>
              </div>
            </div>
          </Card>
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}
