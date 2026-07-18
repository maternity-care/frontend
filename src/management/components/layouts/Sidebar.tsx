"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Gauge, KeyRound, ShieldCheck, Sparkles, Upload, UserCog, Users, Building2, DoorOpen } from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/management/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/management/users", label: "Users", icon: Users, roles: ["super_admin"] },
  { href: "/management/staffs", label: "Staffs", icon: UserCog, roles: ["super_admin", "admin"] },
  { href: "/management/facilities", label: "Cơ sở", icon: Building2, roles: ["super_admin", "admin"] },
  { href: "/management/rooms", label: "Phòng khám", icon: DoorOpen, roles: ["super_admin", "admin"] },
  { href: "/management/services", label: "Dịch vụ", icon: BriefcaseBusiness, roles: ["super_admin", "admin"] },
  { href: "/management/roles", label: "Roles", icon: ShieldCheck, roles: ["super_admin"] },
  { href: "/management/permissions", label: "Permissions", icon: KeyRound, roles: ["super_admin"] },
  { href: "/management/jobs", label: "Jobs", icon: BriefcaseBusiness, roles: ["super_admin"] },
  { href: "/management/uploads", label: "Uploads", icon: Upload, roles: ["super_admin"] },
  // { href: "/management/profile", label: "Hồ sơ cá nhân", icon: UserCog },
    {
    href: "/management/doctor-shifts",
    label: "Ca trực",
    icon: BriefcaseBusiness,
    roles: ["super_admin", "admin", "staff", "doctor", "nurse"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const roles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);
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
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-hidden bg-slate-950 text-slate-300 lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="ml-3 min-w-0">
          <p className="truncate text-sm font-semibold uppercase text-slate-400">Maternity Care</p>
          <p className="truncate text-lg font-semibold text-white">Admin Console</p>
        </div>
      </div>
      <div className="shrink-0 px-4 py-5">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs font-medium uppercase text-slate-400">Workspace</p>
          <p className="mt-1 text-sm font-semibold text-white">Operations Team</p>
          <p className="mt-1 text-xs text-slate-400">RBAC and system data</p>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {visibleNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#94a3b8] transition hover:bg-white/10 hover:text-white",
                active &&
                  "bg-cyan-400/10 !text-white ring-1 ring-inset ring-cyan-300/20 hover:bg-cyan-400/15",
              )}
            >
              {active ? (
                <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-cyan-300" />
              ) : null}
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-cyan-200" : "text-slate-500",
                )}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="rounded-lg bg-cyan-400/10 p-3 text-cyan-50 ring-1 ring-inset ring-cyan-300/20">
          <p className="text-sm font-semibold">Permission engine</p>
          <p className="mt-1 text-xs text-cyan-100/80">Role permissions plus user-level overrides.</p>
        </div>
      </div>
    </aside>
  );
}
