"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Card } from "@/management/components/ui/Card";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import { getUsers } from "@/management/features/users/users.api";
import type { User } from "@/management/features/users/users.types";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getUsers()
      .then((data) => {
        if (mounted) setUsers(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Không tải được danh sách users");
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
      <PageHeader title="Users" description="Danh sách user từ endpoint GET /management/users." />

      {loading ? <StateBlock type="loading" title="Đang tải users" /> : null}
      {error ? <StateBlock type="error" title="Không tải được users" description={error} /> : null}
      {!loading && !error && users.length === 0 ? <StateBlock type="empty" title="Chưa có user nào" /> : null}

      {!loading && !error && users.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-950">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={user.status === 1 ? "green" : "neutral"}>{user.status === 1 ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles?.length ? user.roles.map((role) => <Badge key={role.id}>{role.name}</Badge>) : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
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
