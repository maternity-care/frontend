"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Gauge, KeyRound, ShieldCheck, Sparkles, Upload, UserCog, Users, Building2, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/management/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/management/users", label: "Users", icon: Users },
  { href: "/management/staffdoctormanagement", label: "Staff / Doctors Management", icon: Users },
  { href: "/management/facility-management", label: "Facility Management", icon: Building2 },
  { href: "/management/clinic-room-management", label: "Clinic Room Management", icon: DoorOpen },
  { href: "/management/roles", label: "Roles", icon: ShieldCheck },
  { href: "/management/permissions", label: "Permissions", icon: KeyRound },
  { href: "/management/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/management/uploads", label: "Uploads", icon: Upload },
  { href: "/management/profile", label: "Profile", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative hidden w-72 shrink-0 bg-slate-950 text-slate-300 lg:block">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="ml-3 min-w-0">
          <p className="truncate text-sm font-semibold uppercase text-slate-400">Maternity Care</p>
          <p className="truncate text-lg font-semibold text-white">Admin Console</p>
        </div>
      </div>
      <div className="px-4 py-5">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs font-medium uppercase text-slate-400">Workspace</p>
          <p className="mt-1 text-sm font-semibold text-white">Operations Team</p>
          <p className="mt-1 text-xs text-slate-400">RBAC and system data</p>
        </div>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white",
                active && "bg-white text-slate-950 shadow-sm hover:bg-white hover:text-slate-950",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-72 border-t border-white/10 p-4">
        <div className="rounded-lg bg-cyan-400/10 p-3 text-cyan-50 ring-1 ring-inset ring-cyan-300/20">
          <p className="text-sm font-semibold">Permission engine</p>
          <p className="mt-1 text-xs text-cyan-100/80">Role permissions plus user-level overrides.</p>
        </div>
      </div>
    </aside>
  );
}
