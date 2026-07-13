"use client";

import { useEffect, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CalendarClock,
  Download,
  Eye,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { TableFilter } from "@/fe/components/ui/TableFilter";
import { CopyText } from "@/management/components/ui/CopyText";
import {
  deleteUser,
  deleteUsers,
  getUser,
  getUsersPage,
  createStaffProfile,
} from "@/management/features/users/users.api";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import type { User as BackendUser } from "@/management/features/users/users.types";
import type { StaffPosition } from "@/management/features/users/users.types";
import {
  UserAccountFormModal,
  getAccountTypeLabel,
  getRoleColor,
  roleOptions,
  statusOptions,
} from "./components/UserAccountFormModal";
import type {
  AccountType,
  UserAccount,
  UserRole,
  UserStatus,
} from "./components/UserAccountFormModal";

const { Text, Title } = Typography;

type DeleteConfirmState =
  | { open: false }
  | { open: true; mode: "single"; user: UserAccount }
  | { open: true; mode: "selected"; ids: string[]; count: number };

interface StaffProfileFormValues {
  personalEmail: string;
  position: StaffPosition;
  facilityIds: string[];
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: number;
  bio?: string;
}

const staffPositionOptions = [
  { value: "admin", label: "Quản trị cơ sở" },
  { value: "doctor", label: "Bác sĩ" },
  { value: "nurse", label: "Điều dưỡng" },
  { value: "staff", label: "Nhân viên" },
];


function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            errors?: {
              fields?: string[];
            };
          };
        };
      }
    ).response;

    const fields = response?.data?.errors?.fields;

    if (Array.isArray(fields) && fields.length > 0) {
      return fields.join(", ");
    }

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function formatDate(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatBackendRoleLabel(roleName?: string) {
  if (!roleName) return "Chưa phân quyền";

  const roleLabelMap: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    doctor: "Bác sĩ",
    nurse: "Điều dưỡng",
    staff: "Staff",
    member: "Thai phụ",
    partner: "Partner",
    owner: "Owner",
  };

  return (
    roleLabelMap[roleName] ||
    roleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function toUiRole(roleName?: string): UserRole {
  if (roleName === "super_admin" || roleName === "admin") return "admin";
  if (roleName === "doctor") return "doctor";
  if (roleName === "nurse") return "nurse";
  if (roleName === "staff") return "staff";
  if (roleName === "partner" || roleName === "owner") return "owner";

  return "pregnant";
}

function toUiStatus(status: string): UserStatus {
  return status === "active" ? "active" : "locked";
}

function deriveAccountType(roleName?: string): AccountType {
  if (roleName === "super_admin" || roleName === "admin") return "system";

  if (roleName === "doctor" || roleName === "nurse" || roleName === "staff") {
    return "internal";
  }

  return "customer";
}

function normalizeUser(user: BackendUser): UserAccount {
  const firstRole = user.roles?.[0];
  const roleName =
    user.staffProfile?.facilityAssignments?.[0]?.roles?.[0] || firstRole?.name;
  const accountType = deriveAccountType(roleName);

  return {
    id: user.id,
    fullName: user.name,
    email: user.email,
    phone: user.phone || "",
    role: toUiRole(roleName),
    roleLabel: formatBackendRoleLabel(roleName),
    accountType,
    accountTypeLabel: getAccountTypeLabel(accountType),
    status: toUiStatus(user.status),
    createdAt: user.createdAt,
    lastLogin: undefined,
    staffProfile: user.staffProfile,
  };
}

function exportUsersToCsv(users: UserAccount[]) {
  const headers = [
    "STT",
    "Họ tên",
    "Email",
    "Số điện thoại",
    "Vai trò",
    "Trạng thái",
    "Loại tài khoản",
    "Ngày tạo",
  ];

  const rows = users.map((user, index) => [
    index + 1,
    user.fullName,
    user.email,
    user.phone || "Chưa cập nhật",
    user.roleLabel,
    user.status === "active" ? "Hoạt động" : "Đã khóa",
    user.accountTypeLabel,
    formatDate(user.createdAt),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "danh-sach-tai-khoan.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function StaffsManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState<string>();
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [detailUser, setDetailUser] = useState<UserAccount | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [staffProfileUser, setStaffProfileUser] =
    useState<UserAccount | null>(null);
  const [staffProfileSubmitting, setStaffProfileSubmitting] = useState(false);
  const [staffFacilityOptions, setStaffFacilityOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [staffProfileForm] = Form.useForm<StaffProfileFormValues>();
  const selectedStaffPosition = Form.useWatch(
    "position",
    staffProfileForm,
  );

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
  });

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getUsersPage({
          search: searchQuery,
          page: currentPage,
          limit: pageSize,
        });

        if (!mounted) return;

        const backendUsers = Array.isArray(response.users)
          ? response.users
          : [];

        setUsers(backendUsers.map((user) => normalizeUser(user)));
        setTotalUsers(response.total ?? backendUsers.length);
        setSelectedUserIds([]);
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery, currentPage, pageSize]);

  const filteredUsers = users;

  const activeUsers = users.filter((user) => user.status === "active").length;
  const lockedUsers = users.filter((user) => user.status === "locked").length;

  const createdThisMonth = users.filter((user) => {
    const createdDate = new Date(user.createdAt);
    const now = new Date();

    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length;

  function openCreateModal() {
    setEditingUser(null);
    setFormModalOpen(true);
  }

  function openEditModal(user: UserAccount) {
    setEditingUser(user);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setEditingUser(null);
  }

  async function openDetailUser(user: UserAccount) {
    setDetailUser(user);

    try {
      const response = await getUser(user.id);
      setDetailUser(normalizeUser(response));
    } catch {
      setDetailUser(user);
    }
  }

  async function openCreateStaffProfile(user: UserAccount) {
    setStaffProfileUser(user);
    setDetailUser(null);
    staffProfileForm.setFieldsValue({
      personalEmail: "",
      position: "staff",
      facilityIds: [],
    });

    try {
      const facilities = await getFacilities();
      setStaffFacilityOptions(
        facilities.map((facility) => ({
          value: facility.id,
          label: `${facility.name} (${facility.code})`,
        })),
      );
    } catch (facilityError) {
      setError(getErrorMessage(facilityError));
    }
  }

  async function submitStaffProfile(values: StaffProfileFormValues) {
    if (!staffProfileUser) return;
    setStaffProfileSubmitting(true);
    try {
      const response = await createStaffProfile(staffProfileUser.id, values);
      const refreshedUser = normalizeUser(await getUser(staffProfileUser.id));
      setUsers((current) =>
        current.map((user) =>
          user.id === refreshedUser.id ? refreshedUser : user,
        ),
      );
      setStaffProfileUser(null);
      staffProfileForm.resetFields();
      Modal.success({
        title: response.message || "Tạo hồ sơ nhân viên thành công",
        content: `Mã nhân viên: ${response.data.employeeCode}`,
        centered: true,
      });
    } catch (staffError) {
      setError(getErrorMessage(staffError));
    } finally {
      setStaffProfileSubmitting(false);
    }
  }

  function confirmDeleteUser(user: UserAccount) {
    setDeleteConfirm({ open: true, mode: "single", user });
  }

  function confirmDeleteSelected() {
    if (selectedUserIds.length === 0) return;

    setDeleteConfirm({
      open: true,
      mode: "selected",
      ids: selectedUserIds,
      count: selectedUserIds.length,
    });
  }

  function closeDeleteConfirm() {
    if (deleteLoading) return;

    setDeleteConfirm({ open: false });
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm.open) return;

    setDeleteLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      if (deleteConfirm.mode === "single") {
        const userId = deleteConfirm.user.id;

        await deleteUser(userId);

        setUsers((current) => current.filter((user) => user.id !== userId));
        setTotalUsers((current) => Math.max(current - 1, 0));
        setSelectedUserIds((current) =>
          current.filter((id) => id !== userId),
        );
        setDetailUser((current) => (current?.id === userId ? null : current));

        Modal.success({
          title: "Xóa tài khoản thành công",
          content: "Tài khoản đã được xóa khỏi danh sách.",
          okText: "Đóng",
          centered: true,
        });
      } else {
        const ids = deleteConfirm.ids;

        await deleteUsers(ids);

        setUsers((current) => current.filter((user) => !ids.includes(user.id)));
        setTotalUsers((current) => Math.max(current - ids.length, 0));
        setSelectedUserIds([]);
        setCurrentPage(1);
        setDetailUser((current) =>
          current && ids.includes(current.id) ? null : current,
        );

        Modal.success({
          title: "Xóa tài khoản thành công",
          content: "Các tài khoản đã chọn đã được xóa khỏi danh sách.",
          okText: "Đóng",
          centered: true,
        });
      }

      setDeleteConfirm({ open: false });
    } catch (err) {
      const message = getErrorMessage(err);

      setError(message);

      Modal.error({
        title: "Xóa tài khoản thất bại",
        content: message,
        okText: "Đóng",
        centered: true,
      });
    } finally {
      setDeleteLoading(false);
      setTableLoading(false);
    }
  }

  const columns: ColumnsType<UserAccount> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      render: (fullName: string) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
            <UserRound className="h-4 w-4" />
          </span>

          <Text strong className="block truncate text-slate-900">
            {fullName}
          </Text>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      ellipsis: true,
      render: (email: string) => (
        <CopyText value={email} copiedMessage="Đã sao chép email" className="max-w-full" />
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 128,
      align: "center",
      responsive: ["xl"],
      render: (phone: string) => (
        <CopyText
          value={phone}
          emptyText="Chưa cập nhật"
          copiedMessage="Đã sao chép số điện thoại"
        />
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "roleLabel",
      width: 130,
      align: "center",
      render: (roleLabel: string, record) => (
        <Tag color={getRoleColor(record.role)}>{roleLabel}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 126,
      align: "center",
      render: (status: UserStatus) =>
        status === "active" ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="default">Đã khóa</Tag>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 118,
      align: "center",
      responsive: ["lg"],
      render: (createdAt: string) => formatDate(createdAt),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 146,
      align: "center",
      render: (_value, record) => (
        <Space size={6}>
          <Button
            title="Xem chi tiết"
            icon={<Eye className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              void openDetailUser(record);
            }}
          />

          <Button
            title="Sửa"
            icon={<Pencil className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              openEditModal(record);
            }}
          />

          <Button
            danger
            title="Xóa"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              confirmDeleteUser(record);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout roles={["super_admin", "admin"]} permissions={["user.view"]}>
      <PageHeader
        title="Staff Management"
        description="Quản lý tài khoản nhân viên nội bộ theo cơ sở."
      />

      <div className="mt-6 flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() => setError(null)}
          />
        ) : null}

        <Card className="management-filter">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase text-sky-700">
                Management
              </p>

              <Title level={3} className="!mb-0 !text-slate-950">
                Quản lý tài khoản nhân viên
              </Title>

              <Text className="text-slate-500">
                Theo dõi chức vụ, cơ sở làm việc và trạng thái tài khoản nhân viên.
              </Text>
            </div>

            <Button
              size="large"
              icon={<Download className="h-4 w-4" />}
              onClick={() => exportUsersToCsv(filteredUsers)}
            >
              Xuất danh sách
            </Button>
          </div>
        </Card>

        <div className="order-2">
        <TableFilter
          columns={[
            { field: "keyword", label: "Tìm theo tên/email/SĐT", type: "text", contains: true },
            { field: "role", label: "Vai trò", type: "select", options: roleOptions, width: 165 },
            { field: "status", label: "Trạng thái", type: "select", options: statusOptions, width: 165 },
          ]}
          values={{ keyword: query, role: roleFilter, status: statusFilter }}
          onChange={(values, search) => {
            setSearchQuery(search);
            setQuery(String(values.keyword ?? ""));
            setRoleFilter(values.role as UserRole | undefined);
            setStatusFilter(values.status as UserStatus | undefined);
            setCurrentPage(1);
          }}
        />
        </div>

        <div className="order-1 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title={<span className="text-slate-500">Tổng tài khoản</span>}
              value={totalUsers}
              formatter={(value) => (
                <span className="text-slate-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title={<span className="text-emerald-700">Đang hoạt động</span>}
              value={activeUsers}
              formatter={(value) => (
                <span className="text-emerald-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title={<span className="text-red-700">Đã khóa</span>}
              value={lockedUsers}
              formatter={(value) => (
                <span className="text-red-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-sky-100 bg-sky-50/60">
            <Statistic
              title={<span className="text-sky-700">Tạo mới tháng này</span>}
              value={createdThisMonth}
              formatter={(value) => (
                <span className="text-sky-950">{value}</span>
              )}
            />
          </Card>
        </div>

        <Card
          className="order-3 overflow-hidden border-slate-200 bg-white"
          styles={{ body: { padding: 0 } }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Danh sách tài khoản
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Chọn nhiều tài khoản để xóa hoặc thao tác từng tài khoản.
              </p>
            </div>
          }
          extra={
            <Space wrap>
              <Button
                danger
                disabled={selectedUserIds.length === 0}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={confirmDeleteSelected}
              >
                Xóa đã chọn
                {selectedUserIds.length > 0
                  ? ` (${selectedUserIds.length})`
                  : ""}
              </Button>

              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={openCreateModal}
              >
                Thêm tài khoản
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading || tableLoading}
            columns={columns}
            dataSource={filteredUsers}
            className="management-table [&_.ant-table-cell]:px-3"
            scroll={{ x: 980 }}
            rowSelection={{
              selectedRowKeys: selectedUserIds,
              onChange: (selectedRowKeys) => {
                setSelectedUserIds(selectedRowKeys.map(String));
              },
            }}
            onRow={(record) => ({
              className: "cursor-pointer",
              onClick: (event) => {
                const target = event.target as HTMLElement;

                if (
                  target.closest("button") ||
                  target.closest("a") ||
                  target.closest(".ant-checkbox") ||
                  target.closest(".ant-checkbox-wrapper")
                ) {
                  return;
                }

                void openDetailUser(record);
              },
            })}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredUsers.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} tài khoản`,
              onChange: (page, nextPageSize) => {
                setCurrentPage(nextPageSize !== pageSize ? 1 : page);
                setPageSize(nextPageSize);
              },
            }}
          />
        </Card>
      </div>

      <UserAccountFormModal
        open={formModalOpen}
        editingUser={editingUser}
        onClose={closeFormModal}
        onSaved={(savedUser, mode) => {
          if (mode === "create") {
            setUsers((current) => [savedUser, ...current]);
            setTotalUsers((current) => current + 1);
            setCurrentPage(1);
            return;
          }

          setUsers((current) =>
            current.map((user) =>
              user.id === savedUser.id ? savedUser : user,
            ),
          );

          setDetailUser((current) =>
            current?.id === savedUser.id ? savedUser : current,
          );
        }}
      />

      <Modal
        open={Boolean(detailUser)}
        width={760}
        centered
        title={null}
        footer={
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            {detailUser && !detailUser.staffProfile ? (
              <Button
                icon={<UserRoundPlus className="h-4 w-4" />}
                onClick={() => void openCreateStaffProfile(detailUser)}
              >
                Tạo hồ sơ nhân viên
              </Button>
            ) : null}
            <Button
              type="primary"
              icon={<X className="h-4 w-4" />}
              onClick={() => setDetailUser(null)}
            >
              Đóng
            </Button>
          </div>
        }
        onCancel={() => setDetailUser(null)}
        mask={{ closable: true }}
      >
        {detailUser ? (
          <div>
            <div className="mb-5 flex items-start gap-4 border-b border-slate-200 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <UserRound className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <Title level={3} className="!mb-1 !text-slate-950">
                  {detailUser.fullName}
                </Title>

                <Space size={8} wrap>
                  <Tag color={getRoleColor(detailUser.role)}>
                    {detailUser.roleLabel}
                  </Tag>

                  {detailUser.status === "active" ? (
                    <Tag color="green">Hoạt động</Tag>
                  ) : (
                    <Tag color="default">Đã khóa</Tag>
                  )}

                  <Tag>{detailUser.accountTypeLabel}</Tag>
                </Space>
              </div>
            </div>

            <Descriptions
              bordered
              column={2}
              size="middle"
              styles={{
                label: {
                  width: 160,
                  fontWeight: 600,
                },
              }}
            >
              <Descriptions.Item label="Mã tài khoản" span={1}>
                {detailUser.id}
              </Descriptions.Item>

              <Descriptions.Item label="Họ tên" span={1}>
                {detailUser.fullName}
              </Descriptions.Item>

              <Descriptions.Item label="Email" span={1}>
                {detailUser.email}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại" span={1}>
                {detailUser.phone || "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item label="Vai trò" span={1}>
                <Tag color={getRoleColor(detailUser.role)}>
                  {detailUser.roleLabel}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Loại tài khoản" span={1}>
                {detailUser.accountTypeLabel}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái" span={1}>
                {detailUser.status === "active" ? (
                  <Tag color="green">Hoạt động</Tag>
                ) : (
                  <Tag color="default">Đã khóa</Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo" span={1}>
                <Space size={6}>
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {formatDateTime(detailUser.createdAt)}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Đăng nhập gần nhất" span={1}>
                {formatDateTime(detailUser.lastLogin)}
              </Descriptions.Item>

              <Descriptions.Item label="Hồ sơ nhân viên" span={2}>
                {detailUser.staffProfile ? (
                  <Space wrap>
                    <Tag color="blue">
                      {detailUser.staffProfile.employeeCode}
                    </Tag>
                    <span>
                      {detailUser.staffProfile.facilityAssignments
                        .flatMap((assignment) => assignment.roles)
                        .map(formatBackendRoleLabel)
                        .join(", ")}
                    </span>
                    <span>{detailUser.staffProfile.personalEmail}</span>
                  </Space>
                ) : (
                  <Tag>Chưa tạo</Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Bảo mật" span={1}>
                <Space size={6}>
                  {detailUser.status === "locked" ? (
                    <Lock className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  )}

                  {detailUser.status === "locked"
                    ? "Tài khoản đang bị khóa"
                    : "Tài khoản đang hoạt động bình thường"}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(staffProfileUser)}
        title={`Tạo hồ sơ nhân viên${
          staffProfileUser ? ` - ${staffProfileUser.fullName}` : ""
        }`}
        okText="Tạo hồ sơ"
        cancelText="Hủy"
        confirmLoading={staffProfileSubmitting}
        onOk={() => staffProfileForm.submit()}
        onCancel={() => {
          if (!staffProfileSubmitting) {
            setStaffProfileUser(null);
            staffProfileForm.resetFields();
          }
        }}
      >
        <Form
          form={staffProfileForm}
          layout="vertical"
          onFinish={(values) => void submitStaffProfile(values)}
        >
          <Form.Item
            name="personalEmail"
            label="Email cá nhân"
            rules={[
              { required: true, message: "Vui lòng nhập email cá nhân" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="name@example.com" />
          </Form.Item>
          <Form.Item
            name="position"
            label="Chức vụ"
            rules={[{ required: true, message: "Vui lòng chọn chức vụ" }]}
          >
            <Select options={staffPositionOptions} placeholder="Chọn chức vụ" />
          </Form.Item>
          {selectedStaffPosition === "doctor" ? (
            <>
              <Form.Item
                name="licenseNo"
                label="Số giấy phép hành nghề"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số giấy phép hành nghề",
                  },
                ]}
              >
                <Input placeholder="Nhập số giấy phép" />
              </Form.Item>
              <Form.Item
                name="title"
                label="Học hàm / chức danh"
                rules={[
                  { required: true, message: "Vui lòng nhập chức danh" },
                ]}
              >
                <Input placeholder="BS.CKI, ThS.BS..." />
              </Form.Item>
              <Form.Item
                name="specialty"
                label="Chuyên khoa"
                rules={[
                  { required: true, message: "Vui lòng nhập chuyên khoa" },
                ]}
              >
                <Input placeholder="Sản khoa, siêu âm..." />
              </Form.Item>
              <Form.Item
                name="yearsOfExperience"
                label="Số năm kinh nghiệm"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số năm kinh nghiệm",
                  },
                ]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
              <Form.Item name="bio" label="Giới thiệu chuyên môn">
                <Input.TextArea rows={3} placeholder="Thông tin chuyên môn" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item
            name="facilityIds"
            label="Cơ sở làm việc"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn ít nhất một cơ sở",
              },
            ]}
          >
            <Select
              mode="multiple"
              options={staffFacilityOptions}
              optionFilterProp="label"
              placeholder="Chọn cơ sở"
              maxTagCount="responsive"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={deleteConfirm.open}
        centered
        width={456}
        title={null}
        footer={null}
        closable={false}
        onCancel={closeDeleteConfirm}
        mask={{ closable: !deleteLoading }}
        className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div className="relative px-6 pb-6 pt-7 text-center">
          <button
            type="button"
            aria-label="Đóng"
            onClick={closeDeleteConfirm}
            disabled={deleteLoading}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">
            {deleteConfirm.open && deleteConfirm.mode === "selected"
              ? "Xóa tài khoản đã chọn"
              : "Xóa tài khoản"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {deleteConfirm.open && deleteConfirm.mode === "selected"
              ? `Bạn có chắc chắn muốn xóa ${deleteConfirm.count} tài khoản đã chọn không?`
              : "Bạn có chắc chắn muốn xóa tài khoản này không?"}
          </p>

          {deleteConfirm.open && deleteConfirm.mode === "single" ? (
            <p className="mx-auto mt-2 max-w-[340px] truncate text-sm font-semibold text-slate-800">
              {deleteConfirm.user.fullName} - {deleteConfirm.user.email}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={closeDeleteConfirm}
              disabled={deleteLoading}
              className="h-11 rounded-lg font-semibold"
            >
              Hủy
            </Button>

            <Button
              danger
              type="primary"
              size="large"
              loading={deleteLoading}
              onClick={handleConfirmDelete}
              className="h-11 rounded-lg font-semibold"
            >
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
