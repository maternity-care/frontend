"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { App, Input, Modal } from "antd";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import {
  CreateUserDto,
  UpdateUserDto,
  User,
  UserStatus,
} from "@/management/features/management-users/management-user.types";
import {
  createUser,
  getUsers,
  lockUser,
  updateUser,
} from "@/management/features/management-users/management-user.api";
import { ApiClientError } from "@/lib/axios";
import { UserTable } from "@/fe/components/management-users/UserTable";
import { UserFormModal } from "@/fe/components/management-users/UserFormModal";
import { UserDetailModal } from "@/fe/components/management-users/UserDetailModal";
import { TableFilter, TableFilterColumn, TableFilterValues } from "@/management/components/ui/TableFilter";

const USER_FILTER_COLUMNS: TableFilterColumn[] = [
  {
    field: "search",
    label: "Tìm kiếm",
    type: "text",
    width: 320,
    contains: true,
  },
  {
    field: "status",
    label: "Trạng thái",
    type: "select",
    width: 200,
    options: [
      { value: "active", label: "Đang hoạt động" },
      { value: "inactive", label: "Ngừng hoạt động" },
      { value: "locked", label: "Đã khóa" },
    ],
  },
];

export default function UserManagementPage() {
  const { message: messageApi } = App.useApp();
  const [modal, modalContextHolder] = Modal.useModal();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter state dùng chung với TableFilter
  const [filterValues, setFilterValues] = useState<TableFilterValues>({
    search: undefined,
    status: undefined,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);

  const [lockReason, setLockReason] = useState("");
  const lockReasonRef = useRef("");

  // Lấy giá trị filter
  const search = (filterValues.search as string) || undefined;
  const status = filterValues.status as UserStatus | undefined;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        search,
        status,
        page: currentPage,
        limit: pageSize,
      });
      setUsers(res.users ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      const error = err as ApiClientError;
      messageApi.error(error.message || "Không thể tải danh sách người dùng.");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, status, currentPage, pageSize, messageApi]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const res = await getUsers({
          search,
          status,
          page: currentPage,
          limit: pageSize,
        });
        if (cancelled) return;
        setUsers(res.users ?? []);
        setTotal(res.total ?? 0);
      } catch (err) {
        if (cancelled) return;
        const error = err as ApiClientError;
        messageApi.error(
          error.message || "Không thể tải danh sách người dùng."
        );
        setUsers([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [search, status, currentPage, pageSize, messageApi]);

  function openCreate() {
    setEditingUser(null);
    setFormModalOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setFormModalOpen(true);
  }

  async function handleSave(values: CreateUserDto | UpdateUserDto) {
    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values as UpdateUserDto);
        messageApi.success("Cập nhật người dùng thành công.");
      } else {
        await createUser(values as CreateUserDto);
        messageApi.success("Tạo người dùng thành công.");
        setCurrentPage(1);
      }
      setFormModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      const error = err as ApiClientError;
      messageApi.error(error.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleLock(user: User) {
    if (user.status !== "active") return;

    setLockReason("");
    lockReasonRef.current = "";
    modal.confirm({
      centered: true,
      title: "Khóa tài khoản?",
      content: (
        <div className="space-y-3 pt-1">
          <p className="mb-0 text-sm text-slate-600">
            Tài khoản của <strong>{user.name}</strong> sẽ bị khóa và không thể
            đăng nhập cho đến khi được mở khóa.
          </p>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">
              Lý do khóa <span className="text-red-500">*</span>
            </p>
            <Input.TextArea
              rows={3}
              placeholder="Nhập lý do khóa tài khoản..."
              maxLength={300}
              showCount
              onChange={(e) => {
                lockReasonRef.current = e.target.value;
                setLockReason(e.target.value);
              }}
            />
          </div>
        </div>
      ),
      okText: "Khóa tài khoản",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        const reason = lockReasonRef.current.trim();
        if (!reason) {
          messageApi.error("Vui lòng nhập lý do khóa tài khoản.");
          return Promise.reject();
        }

        try {
          await lockUser(user.id, { reason });
          messageApi.success("Đã khóa tài khoản người dùng.");
          setUsers((prev) =>
            prev.map((u) =>
              u.id === user.id
                ? { ...u, status: "locked", deletedReason: reason }
                : u
            )
          );
          setSelectedUser((prev) =>
            prev?.id === user.id
              ? { ...prev, status: "locked", deletedReason: reason }
              : prev
          );
        } catch (err) {
          const error = err as ApiClientError;
          messageApi.error(error.message || "Khóa tài khoản thất bại.");
          return Promise.reject();
        }
      },
    });
  }

  return (
    <AdminLayout roles={["super_admin", "admin"]}>
      {modalContextHolder}

      <PageHeader
        title="Quản lý người dùng"
        description="Quản lý tài khoản người dùng trong hệ thống."
      />

      <div className="mt-6 flex flex-col gap-5">
        <TableFilter
          columns={USER_FILTER_COLUMNS}
          values={filterValues}
          clearLabel="Xóa bộ lọc"
          onChange={(values) => {
            setFilterValues(values);
            setCurrentPage(1);
          }}
        />

        <UserTable
          data={users}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          total={total}
          onPageChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
          onView={setSelectedUser}
          onEdit={openEdit}
          onLock={handleLock}
          onCreate={openCreate}
        />
      </div>

      <UserFormModal
        open={formModalOpen}
        user={editingUser}
        loading={submitting}
        onClose={() => {
          setFormModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSave}
      />

      <UserDetailModal
        open={Boolean(selectedUser)}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onEdit={(user) => {
          setSelectedUser(null);
          openEdit(user);
        }}
      />
    </AdminLayout>
  );
}