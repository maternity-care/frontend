"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Gauge, KeyRound, ShieldCheck, Upload, UserCog, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/management/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/management/users", label: "Users", icon: Users },
  { href: "/management/roles", label: "Roles", icon: ShieldCheck },
  { href: "/management/permissions", label: "Permissions", icon: KeyRound },
  { href: "/management/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/management/uploads", label: "Uploads", icon: Upload },
  { href: "/management/profile", label: "Profile", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-white lg:block">
      <div className="flex h-16 items-center border-b border-border px-5">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">Maternity Care</p>
          <p className="text-lg font-semibold text-slate-950">Admin</p>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                active && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
