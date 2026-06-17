"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Search } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import { getPermissions } from "@/management/features/permissions/permissions.api";
import type { Permission } from "@/management/features/permissions/permissions.types";
import { formatDate, getErrorMessage } from "@/lib/utils";

function permissionGroup(name: string) {
  return name.split(/[.:-]/)[0] || "general";
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getPermissions()
      .then((data) => {
        if (mounted) setPermissions(data);
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

  const filteredPermissions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return permissions;
    return permissions.filter((permission) =>
      [permission.name, permission.guardName].join(" ").toLowerCase().includes(keyword),
    );
  }, [permissions, query]);

  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce<Record<string, Permission[]>>((acc, permission) => {
      const group = permissionGroup(permission.name);
      acc[group] = [...(acc[group] ?? []), permission];
      return acc;
    }, {});
  }, [filteredPermissions]);

  return (
    <AdminLayout permissions={["permission.view"]}>
      <PageHeader title="Permissions" description="Danh mục quyền hệ thống dùng cho role và override riêng từng user." />

      {loading ? <StateBlock type="loading" title="Đang tải permissions" /> : null}
      {error ? <StateBlock type="error" title="Không tải được permissions" description={error} /> : null}
      {!loading && !error && permissions.length === 0 ? <StateBlock type="empty" title="Chưa có permission nào" /> : null}

      {!loading && !error && permissions.length > 0 ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Total Permissions</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{permissions.length}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Modules</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{Object.keys(groupedPermissions).length}</p>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">Guard</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...new Set(permissions.map((permission) => permission.guardName))].map((guard) => (
                  <Badge key={guard} tone="blue">
                    {guard}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Permission Catalog</CardTitle>
                <p className="mt-1 text-sm text-slate-500">{filteredPermissions.length} permissions visible</p>
              </div>
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-white px-3 lg:w-80">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search permission"
                  className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="divide-y divide-border">
              {Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
                <section key={group} className="grid gap-0 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="border-b border-border bg-slate-50 px-4 py-3 lg:border-b-0 lg:border-r">
                    <p className="text-xs font-semibold uppercase text-slate-500">{group}</p>
                    <p className="mt-1 text-sm text-slate-600">{groupPermissions.length} permissions</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead className="bg-white text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Guard</th>
                          <th className="px-4 py-3 font-medium">Created</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {groupPermissions.map((permission) => (
                          <tr key={permission.id} className="bg-white">
                            <td className="px-4 py-3 font-medium text-slate-950">{permission.name}</td>
                            <td className="px-4 py-3 text-slate-600">{permission.guardName}</td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(permission.createdAt)}</td>
                            <td className="px-4 py-3">
                              <Badge tone="green">Available</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}
