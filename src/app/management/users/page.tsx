"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Check, RotateCcw, Save, Search, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { Badge } from "@/management/components/ui/Badge";
import { Button } from "@/management/components/ui/Button";
import { Card, CardTitle } from "@/management/components/ui/Card";
import { Modal } from "@/management/components/ui/Modal";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { StateBlock } from "@/management/components/ui/StateBlock";
import { getPermissions } from "@/management/features/permissions/permissions.api";
import type { Permission } from "@/management/features/permissions/permissions.types";
import { getRoles } from "@/management/features/roles/roles.api";
import type { Role } from "@/management/features/roles/roles.types";
import { getUsers, updateUser } from "@/management/features/users/users.api";
import type { User, UserPermissionEffect } from "@/management/features/users/users.types";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";

type OverrideMode = "inherit" | UserPermissionEffect;

function permissionGroup(name: string) {
  return name.split(/[.:-]/)[0] || "general";
}

function toOverrideDraft(user?: User) {
  return (user?.permissionOverrides ?? []).reduce<Record<string, OverrideMode>>((acc, override) => {
    acc[override.permission.id] = override.effect;
    return acc;
  }, {});
}

function toRoleIds(user?: User) {
  return (user?.roles ?? []).map((role) => role.id);
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draftRoleIds, setDraftRoleIds] = useState<string[]>([]);
  const [draftOverrides, setDraftOverrides] = useState<Record<string, OverrideMode>>({});
  const [draftStatus, setDraftStatus] = useState(1);
  const [query, setQuery] = useState("");
  const [permissionQuery, setPermissionQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingUserId) ?? null,
    [editingUserId, users],
  );

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [user.name, user.email, ...(user.roles ?? []).map((role) => role.name)]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, users]);

  const activeUsers = users.filter((user) => user.status === 1).length;
  const userOverrides = users.reduce((total, user) => total + (user.permissionOverrides?.length ?? 0), 0);

  const selectedRoles = useMemo(
    () => roles.filter((role) => draftRoleIds.includes(role.id)),
    [draftRoleIds, roles],
  );

  const inheritedPermissionIds = useMemo(() => {
    return new Set(selectedRoles.flatMap((role) => (role.permissions ?? []).map((permission) => permission.id)));
  }, [selectedRoles]);

  const effectivePermissionIds = useMemo(() => {
    const ids = new Set(inheritedPermissionIds);
    Object.entries(draftOverrides).forEach(([permissionId, effect]) => {
      if (effect === "allow") ids.add(permissionId);
      if (effect === "deny") ids.delete(permissionId);
    });
    return ids;
  }, [draftOverrides, inheritedPermissionIds]);

  const groupedPermissions = useMemo(() => {
    const keyword = permissionQuery.trim().toLowerCase();
    const filtered = keyword
      ? permissions.filter((permission) => permission.name.toLowerCase().includes(keyword))
      : permissions;

    return filtered.reduce<Record<string, Permission[]>>((acc, permission) => {
      const group = permissionGroup(permission.name);
      acc[group] = [...(acc[group] ?? []), permission];
      return acc;
    }, {});
  }, [permissionQuery, permissions]);

  const hasChanges = useMemo(() => {
    if (!editingUser) return false;
    const initialRoleIds = toRoleIds(editingUser).sort().join(",");
    const currentRoleIds = [...draftRoleIds].sort().join(",");
    const initialOverrides = JSON.stringify(toOverrideDraft(editingUser));
    const currentOverrides = JSON.stringify(draftOverrides);
    return initialRoleIds !== currentRoleIds || initialOverrides !== currentOverrides || editingUser.status !== draftStatus;
  }, [draftOverrides, draftRoleIds, draftStatus, editingUser]);

  function openEditor(user: User) {
    setEditingUserId(user.id);
    setDraftRoleIds(toRoleIds(user));
    setDraftOverrides(toOverrideDraft(user));
    setDraftStatus(user.status);
    setPermissionQuery("");
    setSaveError(null);
    setNotice(null);
  }

  function closeEditor() {
    setEditingUserId(null);
    setSaveError(null);
    setNotice(null);
  }

  function toggleRole(roleId: string) {
    setDraftRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  function setPermissionMode(permissionId: string, mode: OverrideMode) {
    setDraftOverrides((current) => {
      const next = { ...current };
      if (mode === "inherit") {
        delete next[permissionId];
      } else {
        next[permissionId] = mode;
      }
      return next;
    });
  }

  async function handleSave() {
    if (!editingUser) return;
    setSaving(true);
    setSaveError(null);
    setNotice(null);

    try {
      const updated = await updateUser(editingUser.id, {
        status: draftStatus,
        roleIds: draftRoleIds,
        permissionOverrides: Object.entries(draftOverrides)
          .filter(([, effect]) => effect !== "inherit")
          .map(([permissionId, effect]) => ({ permissionId, effect: effect as UserPermissionEffect })),
      });

      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      setDraftRoleIds(toRoleIds(updated));
      setDraftOverrides(toOverrideDraft(updated));
      setDraftStatus(updated.status);
      setNotice("Saved user permissions.");
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!editingUser) return;
    setDraftRoleIds(toRoleIds(editingUser));
    setDraftOverrides(toOverrideDraft(editingUser));
    setDraftStatus(editingUser.status);
    setSaveError(null);
    setNotice(null);
  }

  return (
    <AdminLayout permissions={["user.view"]}>
      <PageHeader title="Users" description="Quản lý role và override permission riêng cho từng user." />

      {loading ? <StateBlock type="loading" title="Đang tải dữ liệu phân quyền" /> : null}
      {error ? <StateBlock type="error" title="Không tải được users" description={error} /> : null}
      {!loading && !error && users.length === 0 ? <StateBlock type="empty" title="Chưa có user nào" /> : null}

      {!loading && !error && users.length > 0 ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Total Users</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{users.length}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </Card>
            <Card className="border-emerald-100 bg-emerald-50/60">
              <p className="text-sm text-emerald-700">Active Accounts</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{activeUsers}</p>
            </Card>
            <Card className="border-blue-100 bg-blue-50/60">
              <p className="text-sm text-blue-700">User Overrides</p>
              <p className="mt-2 text-3xl font-semibold text-blue-950">{userOverrides}</p>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>User Directory</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Bấm Configure để mở modal phân quyền.</p>
              </div>
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-white px-3 lg:w-96">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search user, email, role"
                  className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Roles</th>
                    <th className="px-4 py-3 font-medium">Overrides</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="bg-white transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                            {user.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-950">{user.name}</p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={user.status === 1 ? "green" : "neutral"}>{user.status === 1 ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(user.roles ?? []).slice(0, 3).map((role) => (
                            <Badge key={role.id}>{role.name}</Badge>
                          ))}
                          {(user.roles?.length ?? 0) > 3 ? <Badge>+{user.roles.length - 3}</Badge> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.permissionOverrides?.length ?? 0}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button variant="secondary" onClick={() => openEditor(user)}>
                            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                            Configure
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      <Modal
        open={Boolean(editingUser)}
        title={editingUser ? `Configure ${editingUser.name}` : "Configure user"}
        description={editingUser?.email}
        onClose={closeEditor}
        footer={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Badge tone="green">{effectivePermissionIds.size} effective</Badge>
              <Badge>{inheritedPermissionIds.size} inherited</Badge>
              <Badge tone="blue">{Object.keys(draftOverrides).length} overrides</Badge>
              {notice ? <Badge tone="green">{notice}</Badge> : null}
              {saveError ? <span className="text-red-600">{saveError}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={closeEditor} disabled={saving}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleReset} disabled={!hasChanges || saving}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        }
      >
        {editingUser ? (
          <div className="grid min-h-[620px] lg:grid-cols-[310px_minmax(0,1fr)]">
            <aside className="border-b border-border bg-slate-50 p-5 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-base font-semibold text-white">
                  {editingUser.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{editingUser.name}</p>
                  <p className="truncate text-sm text-slate-500">{editingUser.email}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-950">Account Status</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[1, 0].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDraftStatus(status)}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-md border text-sm font-medium transition",
                        draftStatus === status
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-border bg-white text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {status === 1 ? "Active" : "Inactive"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  <p className="text-sm font-semibold text-slate-950">Roles</p>
                </div>
                <div className="space-y-2">
                  {roles.map((role) => {
                    const checked = draftRoleIds.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition",
                          checked ? "border-slate-900 bg-slate-900 text-white" : "border-border bg-white text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        <span className="min-w-0 truncate">{role.name}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(role.id)}
                          className="h-4 w-4 accent-slate-900"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 rounded-md border border-border bg-white p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Effective Access</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{effectivePermissionIds.size}</p>
                <p className="text-sm text-slate-500">permissions after role + user overrides</p>
              </div>
            </aside>

            <section className="min-w-0 p-5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Permission Overrides</p>
                  <p className="text-sm text-slate-500">Inherit theo role, allow để thêm quyền, deny để tắt quyền riêng.</p>
                </div>
                <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-white px-3 lg:w-80">
                  <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    value={permissionQuery}
                    onChange={(event) => setPermissionQuery(event.target.value)}
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
                    <div className="divide-y divide-border">
                      {groupPermissions.map((permission) => {
                        const inherited = inheritedPermissionIds.has(permission.id);
                        const mode = draftOverrides[permission.id] ?? "inherit";
                        const effective = effectivePermissionIds.has(permission.id);

                        return (
                          <div
                            key={permission.id}
                            className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-950">{permission.name}</p>
                              <p className="text-xs text-slate-500">
                                {permission.guardName}
                                {inherited ? " · inherited" : ""}
                              </p>
                            </div>
                            <Badge tone={effective ? "green" : "neutral"}>{effective ? "Enabled" : "Disabled"}</Badge>
                            <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border text-xs font-medium">
                              {(["inherit", "allow", "deny"] as OverrideMode[]).map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  title={item === "inherit" && inherited ? "Inherited from selected roles" : item}
                                  onClick={() => setPermissionMode(permission.id, item)}
                                  className={cn(
                                    "flex h-8 min-w-16 items-center justify-center gap-1 px-2 capitalize transition",
                                    mode === item
                                      ? item === "deny"
                                        ? "bg-red-600 text-white"
                                        : item === "allow"
                                          ? "bg-emerald-600 text-white"
                                          : "bg-slate-900 text-white"
                                      : "bg-white text-slate-600 hover:bg-slate-50",
                                  )}
                                >
                                  {item === "allow" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                                  {item === "deny" ? <Ban className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
