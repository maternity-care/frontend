"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Gauge,
  MessageSquare,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  UserCog,
  Users,
  HardDrive,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "management-sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "management-sidebar-collapsed-change";

function subscribeSidebarCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, callback);
  };
}

function getSidebarCollapsedSnapshot() {
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

const navItems = [
  { href: "/management/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/management/users", label: "Users", icon: Users, roles: ["super_admin"] },
  { href: "/management/staffs", label: "Staffs", icon: UserCog, roles: ["super_admin", "admin"] },
  { href: "/management/doctors", label: "Doctors", icon: Stethoscope, roles: ["super_admin", "admin"] },
  { href: "/management/facilities", label: "Cơ sở", icon: Building2, roles: ["super_admin"] },
  { href: "/management/rooms", label: "Phòng khám", icon: DoorOpen, roles: ["super_admin", "admin"] },
  // { href: "/management/roles", label: "Roles", icon: ShieldCheck, roles: ["super_admin"] },
  // { href: "/management/records", label: "Records", icon: HardDrive, roles: ["super_admin", "doctor"] },
  // { href: "/management/permissions", label: "Permissions", icon: KeyRound, roles: ["super_admin"] },
  // { href: "/management/jobs", label: "Jobs", icon: BriefcaseBusiness, roles: ["super_admin"] },
  // { href: "/management/uploads", label: "Uploads", icon: Upload, roles: ["super_admin"] },
  { href: "/management/records", label: "Hồ sơ thai phụ", icon: HardDrive, roles: ["doctor"] },
  { href: "/management/services/super", label: "Dịch vụ", icon: BriefcaseBusiness, roles: ["super_admin"] },
  { href: "/management/services/facility", label: "Dịch vụ cơ sở", icon: BriefcaseBusiness, roles: ["admin"] },
  // { href: "/management/roles", label: "Roles", icon: ShieldCheck, roles: ["super_admin"] },
  // { href: "/management/records", label: "Records", icon: HardDrive, roles: ["super_admin", "doctor"] },
  // { href: "/management/permissions", label: "Permissions", icon: KeyRound, roles: ["super_admin"] },
  // { href: "/management/jobs", label: "Jobs", icon: BriefcaseBusiness, roles: ["super_admin"] },
  // { href: "/management/uploads", label: "Uploads", icon: Upload, roles: ["super_admin"] },
  // { href: "/management/profile", label: "Hồ sơ cá nhân", icon: UserCog },
  { href: "/management/forums", label: "Quản lý diễn đàn", icon: MessageSquare, roles: ["super_admin", "admin", "staff", "doctor"] },
  { href: "/management/doctor-shifts", label: "Ca trực", icon: BriefcaseBusiness, roles: ["super_admin", "admin", "staff", "doctor", "nurse"] },
  { href: "/management/appointments", label: "Lịch đặt khám", icon: CalendarCheck, roles: ["super_admin", "admin", "staff", "doctor", "nurse"] },
  { href: "/management/appointment-disruptions", label: "Lịch bị ảnh hưởng", icon: CalendarX2, roles: ["super_admin", "admin"] },
  { href: "/management/shift-slots", label: "Khung ca", icon: BriefcaseBusiness, roles: ["super_admin", "admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const roles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
  const collapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );

  function toggleCollapsed() {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_KEY,
      String(!collapsed),
    );

    window.dispatchEvent(
      new Event(SIDEBAR_COLLAPSED_EVENT),
    );
  }

  const activeFacility =
    user?.facilities?.find(
      (facility) => String(facility.id) === String(activeFacilityId),
    ) ??
    user?.facilities?.find((facility) => facility.status === "active");

  const facilityRoles = activeFacility?.roles?.length
    ? activeFacility.roles
    : activeFacility?.role
      ? [activeFacility.role]
      : [];

  const roleName = (role: string | { name?: string } | null | undefined) =>
    typeof role === "string" ? role : role?.name;

  const effectiveRoles = new Set(
    [
      ...roles,
      ...(user?.roles?.map(roleName) ?? []),
      ...facilityRoles.map(roleName),
    ]
      .filter((role): role is string => Boolean(role))
      .map((role) => role.toLowerCase()),
  );

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.some((role) => effectiveRoles.has(role)),
  );

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-slate-950 text-slate-300 transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/10 transition-all duration-300",
          collapsed ? "justify-center gap-1 px-1" : "justify-between px-5",
        )}
      >
        <div className="flex min-w-0 items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950">
            <HeartPulse
              className="h-5 w-5 !text-pink-700"
              aria-hidden="true"
            />
          </div>

          {!collapsed ? (
            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-semibold uppercase text-slate-400">Maternity Care</p>
              <p className="truncate text-lg font-semibold text-white">Admin Console</p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          aria-expanded={!collapsed}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          onClick={toggleCollapsed}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {!collapsed ? (
        <div className="shrink-0 px-4 py-5">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-medium uppercase text-slate-400">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-white">Operations Team</p>
            <p className="mt-1 text-xs text-slate-400">RBAC and system data</p>
          </div>
        </div>
      ) : null}

      <nav
        className={cn(
          "min-h-0 flex-1 space-y-1 overflow-y-auto pb-4 transition-all duration-300",
          "[scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,0.35)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-slate-700/80",
          "hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/50",
          collapsed ? "px-2 pt-4" : "px-3",
        )}
      >
        {visibleNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex h-11 items-center rounded-md text-sm font-medium text-[#94a3b8] transition hover:bg-white/10 hover:text-white",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                active &&
                  "bg-cyan-400/10 !text-white ring-1 ring-inset ring-cyan-300/20 hover:bg-cyan-400/15",
              )}
            >
              {active ? (
                <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-cyan-300" />
              ) : null}

              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-cyan-200" : "text-slate-500",
                )}
                aria-hidden="true"
              />

              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className={cn("shrink-0 border-t border-white/10", collapsed ? "p-2" : "p-4")}>
        {collapsed ? (
          <div
            title="Permission engine"
            className="flex h-11 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-100 ring-1 ring-inset ring-cyan-300/20"
          >
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : (
          <div className="rounded-lg bg-cyan-400/10 p-3 text-cyan-50 ring-1 ring-inset ring-cyan-300/20">
            <p className="text-sm font-semibold">Permission engine</p>
            <p className="mt-1 text-xs text-cyan-100/80">Role permissions plus user-level overrides.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
