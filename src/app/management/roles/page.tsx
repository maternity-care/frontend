"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, KeyRound, Save, Search, Settings2, ShieldCheck } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Button } from "@/management/components/ui/Button";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { Modal } from "@/management/components/ui/Modal";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import { getPermissions } from "@/management/features/permissions/permissions.api";
import type { Permission } from "@/management/features/permissions/permissions.types";
import { getRoles, updateRole } from "@/management/features/roles/roles.api";
import type { Role } from "@/management/features/roles/roles.types";
import { cn, getErrorMessage } from "@/lib/utils";

function permissionGroup(name: string) {
  return name.split(/[.:-]/)[0] || "general";
}

function toPermissionIds(role?: Role) {
  return (role?.permissions ?? []).map((permission) => permission.id);
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([getRoles(), getPermissions()])
      .then(([rolesData, permissionsData]) => {
        if (!mounted) return;
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

  const editingRole = useMemo(
    () => roles.find((role) => role.id === editingRoleId) ?? null,
    [editingRoleId, roles],
  );

  const groupedPermissions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const filtered = keyword
      ? permissions.filter((permission) => permission.name.toLowerCase().includes(keyword))
      : permissions;

    return filtered.reduce<Record<string, Permission[]>>((acc, permission) => {
      const group = permissionGroup(permission.name);
      acc[group] = [...(acc[group] ?? []), permission];
      return acc;
    }, {});
  }, [permissions, query]);

  const hasChanges = useMemo(() => {
    if (!editingRole) return false;
    const initial = toPermissionIds(editingRole).sort().join(",");
    const current = [...draftPermissionIds].sort().join(",");
    return initial !== current;
  }, [draftPermissionIds, editingRole]);

  const roleCoverage = useMemo(() => {
    if (!roles.length || !permissions.length) return 0;
    const granted = roles.reduce((count, role) => count + (role.permissions?.length ?? 0), 0);
    return Math.round((granted / (roles.length * permissions.length)) * 100);
  }, [permissions.length, roles]);

  function openEditor(role: Role) {
    setEditingRoleId(role.id);
    setDraftPermissionIds(toPermissionIds(role));
    setQuery("");
    setSaveError(null);
    setNotice(null);
  }

  function closeEditor() {
    setEditingRoleId(null);
    setSaveError(null);
    setNotice(null);
  }

  function togglePermission(permissionId: string) {
    setDraftPermissionIds((current) =>
      current.includes(permissionId) ? current.filter((id) => id !== permissionId) : [...current, permissionId],
    );
  }

  async function handleSave() {
    if (!editingRole) return;
    setSaving(true);
    setSaveError(null);
    setNotice(null);

    try {
      const response = await updateRole(editingRole.id, { permissionIds: draftPermissionIds });
      const updated = response.data;
      setRoles((current) => current.map((role) => (role.id === updated.id ? updated : role)));
      setDraftPermissionIds(toPermissionIds(updated));
      setNotice(response.message || "Saved role permissions.");
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout permissions={["role.view"]}>
      <PageHeader title="Roles" description="Gán permission cho role, sau đó user có thể override riêng ở màn Users." />

      {loading ? <StateBlock type="loading" title="Đang tải roles và permissions" /> : null}
      {error ? <StateBlock type="error" title="Không tải được roles" description={error} /> : null}
      {!loading && !error && roles.length === 0 ? <StateBlock type="empty" title="Chưa có role nào" /> : null}

      {!loading && !error && roles.length > 0 ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Roles</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{roles.length}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </Card>
            <Card className="border-blue-100 bg-blue-50/60">
              <p className="text-sm text-blue-700">Permissions</p>
              <p className="mt-2 text-3xl font-semibold text-blue-950">{permissions.length}</p>
            </Card>
            <Card className="border-emerald-100 bg-emerald-50/60">
              <p className="text-sm text-emerald-700">Average Coverage</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{roleCoverage}%</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => {
              const permissionCount = role.permissions?.length ?? 0;
              const width = permissions.length ? Math.round((permissionCount / permissions.length) * 100) : 0;

              return (
                <Card key={role.id} className="flex min-h-56 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate">{role.name}</CardTitle>
                          <p className="text-xs text-slate-500">Guard: {role.guardName}</p>
                        </div>
                      </div>
                    </div>
                    <Badge tone="blue">{permissionCount}</Badge>
                  </div>

                  <div className="mt-5">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Permission coverage</span>
                      <span className="font-medium text-slate-950">{width}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-900" style={{ width: `${width}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(role.permissions ?? []).slice(0, 5).map((permission) => (
                      <Badge key={permission.id}>{permission.name}</Badge>
                    ))}
                    {permissionCount > 5 ? <Badge>+{permissionCount - 5}</Badge> : null}
                  </div>

                  <div className="mt-auto pt-5">
                    <Button variant="secondary" className="w-full" onClick={() => openEditor(role)}>
                      <Settings2 className="h-4 w-4" aria-hidden="true" />
                      Configure Permissions
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(editingRole)}
        title={editingRole ? `Configure ${editingRole.name}` : "Configure role"}
        description={editingRole ? `${draftPermissionIds.length}/${permissions.length} permissions selected` : undefined}
        onClose={closeEditor}
        footer={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Badge tone="blue">{draftPermissionIds.length} selected</Badge>
              <Badge>{permissions.length} available</Badge>
              {notice ? <Badge tone="green">{notice}</Badge> : null}
              {saveError ? <span className="text-red-600">{saveError}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={closeEditor} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        }
      >
        {editingRole ? (
          <div className="min-h-[620px] p-5">
            <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <KeyRound className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-950">{editingRole.name}</p>
                    <p className="text-sm text-slate-500">Tick các permission role này được phép sử dụng.</p>
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-white px-3">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search permission"
                  className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
                <div key={group} className="overflow-hidden rounded-md border border-border">
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">{group}</p>
                    <Badge>{groupPermissions.length} items</Badge>
                  </div>
                  <div className="grid divide-y divide-border md:grid-cols-2 xl:grid-cols-3 md:divide-x md:divide-y-0">
                    {groupPermissions.map((permission) => {
                      const checked = draftPermissionIds.includes(permission.id);
                      return (
                        <label
                          key={permission.id}
                          className={cn(
                            "flex min-h-14 cursor-pointer items-center justify-between gap-3 px-3 py-2 transition hover:bg-slate-50",
                            checked && "bg-emerald-50 hover:bg-emerald-50",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-950">{permission.name}</span>
                            <span className="block text-xs text-slate-500">{permission.guardName}</span>
                          </span>
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                              checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-white text-transparent",
                            )}
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.id)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
