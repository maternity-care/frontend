"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import { getRoles } from "@/management/features/roles/roles.api";
import type { Role } from "@/management/features/roles/roles.types";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getRoles()
      .then((data) => {
        if (mounted) setRoles(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Không tải được roles");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <PageHeader title="Roles" description="UI sẵn sàng mở rộng CRUD cho endpoint /management/roles." />

      {loading ? <StateBlock type="loading" title="Đang tải roles" /> : null}
      {error ? <StateBlock type="error" title="Không tải được roles" description={error} /> : null}
      {!loading && !error && roles.length === 0 ? <StateBlock type="empty" title="Chưa có role nào" /> : null}

      {!loading && !error && roles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardTitle>{role.name}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Guard: {role.guardName}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {role.permissions?.length ? (
                  role.permissions.map((permission) => <Badge key={permission.id}>{permission.name}</Badge>)
                ) : (
                  <span className="text-sm text-slate-500">No permissions</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </AdminLayout>
  );
}
