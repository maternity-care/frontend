"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import { useAuthStore } from "@/features/auth/auth.store";
import type { UserProfile } from "@/features/profile/profile.types";
import { getPermissions } from "@/management/features/permissions/permissions.api";
import type { Permission } from "@/management/features/permissions/permissions.types";
import { getRoles } from "@/management/features/roles/roles.api";
import type { Role } from "@/management/features/roles/roles.types";
import { getUsers } from "@/management/features/users/users.api";
import type { User } from "@/management/features/users/users.types";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";

function permissionGroup(name: string) {
  return name.split(/[.:-]/)[0] || "general";
}

export default function DashboardPage() {
  const storeUser = useAuthStore((state) => state.user);
  const [cachedUser] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const value = window.localStorage.getItem("fe:user");
      return value ? (JSON.parse(value) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([getUsers(), getRoles(), getPermissions()])
      .then(([usersData, rolesData, permissionsData]) => {
        if (!mounted) return;
        setUsers(usersData);
        setRoles(rolesData);
        setPermissions(permissionsData);
      })
      .catch((err) => {
        if (mounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const currentUser = storeUser ?? cachedUser;

  const activeUsers = users.filter((item) => item.status === 1).length;
  const inactiveUsers = Math.max(users.length - activeUsers, 0);
  const userOverrides = users.reduce((count, item) => count + (item.permissionOverrides?.length ?? 0), 0);
  const permissionModules = useMemo(
    () => [...new Set(permissions.map((permission) => permissionGroup(permission.name)))],
    [permissions],
  );

  const topRoles = useMemo(
    () => [...roles].sort((a, b) => (b.permissions?.length ?? 0) - (a.permissions?.length ?? 0)).slice(0, 5),
    [roles],
  );

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [users],
  );

  const roleCoverage = roles.length && permissions.length
    ? Math.round(
        (roles.reduce((total, role) => total + (role.permissions?.length ?? 0), 0) / (roles.length * permissions.length)) * 100,
      )
    : 0;

  const stats = [
    {
      label: "Total users",
      value: users.length,
      detail: `${activeUsers} active, ${inactiveUsers} inactive`,
      href: "/management/users",
      icon: Users,
      accent: "bg-slate-950 text-white",
      panel: "bg-white",
    },
    {
      label: "Roles",
      value: roles.length,
      detail: `${roleCoverage}% avg permission coverage`,
      href: "/management/roles",
      icon: ShieldCheck,
      accent: "bg-emerald-600 text-white",
      panel: "bg-emerald-50/60 border-emerald-100",
    },
    {
      label: "Permissions",
      value: permissions.length,
      detail: `${permissionModules.length} modules`,
      href: "/management/permissions",
      icon: KeyRound,
      accent: "bg-blue-600 text-white",
      panel: "bg-blue-50/60 border-blue-100",
    },
    {
      label: "Overrides",
      value: userOverrides,
      detail: "direct user allow/deny rules",
      href: "/management/users",
      icon: BriefcaseBusiness,
      accent: "bg-amber-500 text-white",
      panel: "bg-amber-50/70 border-amber-100",
    },
  ];

  return (
    <AdminLayout>
      <PageHeader title="Dashboard" description="Operational view for users, roles, permissions, and access coverage." />

      {loading ? <StateBlock type="loading" title="Loading dashboard" /> : null}
      {error ? <StateBlock type="error" title="Cannot load dashboard" description={error} /> : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="p-6 lg:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-cyan-400/15 text-cyan-100 ring-cyan-300/25">Live RBAC</Badge>
                  <Badge className="bg-white/10 text-slate-200 ring-white/15">NestJS API</Badge>
                </div>
                <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-normal lg:text-4xl">
                  Access control, users, and system permissions in one place.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Track who has access, how roles are configured, and where user-level permission overrides are active.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/management/users"
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-slate-100"
                  >
                    Manage users
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/management/roles"
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Review roles
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/[0.04] p-6 lg:border-l lg:border-t-0 lg:p-8">
                <p className="text-sm font-medium text-slate-300">Access health</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/10 p-4 ring-1 ring-inset ring-white/10">
                    <p className="text-3xl font-semibold">{roleCoverage}%</p>
                    <p className="mt-1 text-xs text-slate-300">role coverage</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-4 ring-1 ring-inset ring-white/10">
                    <p className="text-3xl font-semibold">{userOverrides}</p>
                    <p className="mt-1 text-xs text-slate-300">overrides</p>
                  </div>
                </div>
                <div className="mt-5 rounded-lg bg-cyan-400/10 p-4 ring-1 ring-inset ring-cyan-300/20">
                  <div className="flex items-center gap-2 text-cyan-100">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <p className="text-sm font-medium">Permission evaluation is active</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-cyan-100/75">Role permissions are merged with user allow/deny overrides.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="block">
                  <Card className={cn("min-h-40 transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(15,23,42,0.1)]", item.panel)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-600">{item.label}</p>
                        <p className="mt-3 text-4xl font-semibold text-slate-950">{item.value}</p>
                      </div>
                      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md", item.accent)}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">{item.detail}</p>
                      <ArrowUpRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <Card className="p-0">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <CardTitle>Role Coverage</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Largest permission sets by role.</p>
                </div>
                <Activity className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </div>
              <div className="space-y-4 p-5">
                {topRoles.map((role) => {
                  const count = role.permissions?.length ?? 0;
                  const width = permissions.length ? Math.round((count / permissions.length) * 100) : 0;
                  return (
                    <div key={role.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{role.name}</p>
                          <p className="text-xs text-slate-500">Guard: {role.guardName}</p>
                        </div>
                        <Badge tone={width >= 80 ? "green" : width >= 30 ? "blue" : "neutral"}>{width}%</Badge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full", width >= 80 ? "bg-emerald-600" : width >= 30 ? "bg-blue-600" : "bg-slate-400")}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(role.permissions ?? []).slice(0, 4).map((permission) => (
                          <Badge key={permission.id}>{permission.name}</Badge>
                        ))}
                        {count > 4 ? <Badge>+{count - 4}</Badge> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="space-y-5">
              <Card className="p-0">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <CardTitle>Permission Modules</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">{permissionModules.length} active modules.</p>
                  </div>
                  <Database className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <div className="flex flex-wrap gap-2 p-5">
                  {permissionModules.map((moduleName) => (
                    <Badge key={moduleName} tone="blue">
                      {moduleName}
                    </Badge>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                    <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle>Current Session</CardTitle>
                    <p className="truncate text-sm text-slate-500">{currentUser?.email ?? "Unknown user"}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase text-slate-500">Name</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">{currentUser?.name ?? "-"}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase text-slate-500">Status</p>
                    <div className="mt-1">
                      <Badge tone={currentUser?.status === 1 ? "green" : "neutral"}>
                        {currentUser?.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentUser?.roles?.length ? currentUser.roles.map((role) => <Badge key={role.id}>{role.name}</Badge>) : <span>-</span>}
                </div>
              </Card>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <CardTitle>Recent Users</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Latest user records from management API.</p>
              </div>
              <Link href="/management/users" className="text-sm font-medium text-cyan-700 hover:text-cyan-900">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Roles</th>
                    <th className="px-5 py-3 font-medium">Overrides</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentUsers.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                            {item.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-950">{item.name}</p>
                            <p className="truncate text-xs text-slate-500">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(item.roles ?? []).slice(0, 2).map((role) => (
                            <Badge key={role.id}>{role.name}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{item.permissionOverrides?.length ?? 0}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(item.createdAt)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={item.status === 1 ? "green" : "neutral"}>{item.status === 1 ? "Active" : "Inactive"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}
