"use client";

import { BriefcaseBusiness, KeyRound, ShieldCheck, Users } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { useAuthStore } from "@/features/auth/auth.store";

const stats = [
  { label: "Users", value: "128", icon: Users },
  { label: "Roles", value: "4", icon: ShieldCheck },
  { label: "Permissions", value: "18", icon: KeyRound },
  { label: "Jobs queued", value: "6", icon: BriefcaseBusiness },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <AdminLayout>
      <PageHeader title="Dashboard" description="Tổng quan nhanh và thông tin user đang đăng nhập." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{item.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardTitle>Current User</CardTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="font-medium text-slate-950">{user?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="font-medium text-slate-950">{user?.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <Badge tone={user?.status === 1 ? "green" : "neutral"}>{user?.status === 1 ? "Active" : "Inactive"}</Badge>
          </div>
          <div>
            <p className="text-sm text-slate-500">Roles</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {user?.roles?.length ? user.roles.map((role) => <Badge key={role.id}>{role.name}</Badge>) : <span>-</span>}
            </div>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}
