"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Card } from "@/management/components/ui/Card";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import { getPermissions } from "@/management/features/permissions/permissions.api";
import type { Permission } from "@/management/features/permissions/permissions.types";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getPermissions()
      .then((data) => {
        if (mounted) setPermissions(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Không tải được permissions");
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
      <PageHeader title="Permissions" description="Danh sách permission từ endpoint /management/permissions." />

      {loading ? <StateBlock type="loading" title="Đang tải permissions" /> : null}
      {error ? <StateBlock type="error" title="Không tải được permissions" description={error} /> : null}
      {!loading && !error && permissions.length === 0 ? <StateBlock type="empty" title="Chưa có permission nào" /> : null}

      {!loading && !error && permissions.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Guard</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {permissions.map((permission) => (
                  <tr key={permission.id} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-950">{permission.name}</td>
                    <td className="px-4 py-3 text-slate-600">{permission.guardName}</td>
                    <td className="px-4 py-3">
                      <Badge tone="blue">Available</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </AdminLayout>
  );
}
