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
import { TableFilter } from "@/management/components/ui/TableFilter";
import { CopyText } from "@/management/components/ui/CopyText";
import {
  deleteStaff,
  deleteStaffs,
  getStaff,
  getStaffsPage,
  createStaffProfile,
} from "@/management/features/staffs/staffs.api";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import type { Staff as BackendStaff } from "@/management/features/staffs/staffs.types";
import type { StaffPosition } from "@/management/features/staffs/staffs.types";
import {
  StaffAccountFormModal,
  getAccountTypeLabel,
  getRoleColor,
  roleOptions,
  statusOptions,
} from "./components/StaffAccountFormModal";
import type {
  AccountType,
  StaffAccount,
  UserRole,
  UserStatus,
} from "./components/StaffAccountFormModal";

const { Text, Title } = Typography;

type DeleteConfirmState =
  | { open: false }
  | { open: true; mode: "single"; staff: StaffAccount }
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

type StaffListUser = BackendStaff & {
  facilityId?: string | number | null;
  personalEmail?: string | null;
  employeeCode?: string | null;
};

function getStaffProfile(user: StaffListUser): BackendStaff["staffProfile"] {
  if (user.staffProfile) return user.staffProfile;

  const facilityId = user.facilityId === null || user.facilityId === undefined
    ? ""
    : String(user.facilityId);
  const roles = (user.roles ?? [])
    .map((role) => role.name)
    .filter((role): role is StaffPosition =>
      role === "admin" || role === "doctor" || role === "nurse" || role === "staff",
    );

  if (!facilityId && !user.personalEmail && !user.employeeCode && roles.length === 0) {
    return null;
  }

  return {
    id: user.id,
    staffId: user.id,
    personalEmail: user.personalEmail || user.email,
    employeeCode: user.employeeCode || "",
    status: user.status,
    facilityAssignments: facilityId
      ? [{ facilityId, roles: roles.length ? roles : ["staff"] }]
      : [],
    doctor: null,
  };
}

function normalizeStaff(user: BackendStaff): StaffAccount {
  const firstRole = user.roles?.[0];
  const staffProfile = getStaffProfile(user);
  const roleName =
    staffProfile?.facilityAssignments?.[0]?.roles?.[0] || firstRole?.name;
  const accountType = deriveAccountType(roleName);

  return {
    id: user.id,
    fullName: user.name,
    email: user.email,
    phone: user.phone || "",
    role: toUiRole(roleName),
    roleLabel: formatBackendRoleLabel(roleName),
    roles: user.roles ?? [],
    accountType,
    accountTypeLabel: getAccountTypeLabel(accountType),
    status: toUiStatus(user.status),
    createdAt: user.createdAt,
    lastLogin: undefined,
    staffProfile,
    permissionOverrides: user.permissionOverrides ?? [],
  };
}

function exportStaffsToCsv(staffs: StaffAccount[]) {
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

  const rows = staffs.map((staff, index) => [
    index + 1,
    staff.fullName,
    staff.email,
    staff.phone || "Chưa cập nhật",
    staff.roleLabel,
    staff.status === "active" ? "Hoạt động" : "Đã khóa",
    staff.accountTypeLabel,
    formatDate(staff.createdAt),
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
  const [staffs, setStaffs] = useState<StaffAccount[]>([]);
  const [totalStaffs, setTotalStaffs] = useState(0);

  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState<string>();
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>();
  const [facilityFilter, setFacilityFilter] = useState<string | undefined>();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStaffIds, setSelectedUserIds] = useState<string[]>([]);

  const [detailStaff, setDetailStaff] = useState<StaffAccount | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [staffProfileStaff, setStaffProfileStaff] =
    useState<StaffAccount | null>(null);
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
        const response = await getStaffsPage({
          search: searchQuery,
          page: currentPage,
          limit: pageSize,
        });

        if (!mounted) return;

        const backendStaffs = Array.isArray(response.users)
          ? response.users
          : [];

        setStaffs(backendStaffs.map((user) => normalizeStaff(user)));
        setTotalStaffs(response.total ?? backendStaffs.length);
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

  useEffect(() => {
    let mounted = true;

    getFacilities({ status: "active", limit: 100 })
      .then((facilities) => {
        if (!mounted) return;
        setStaffFacilityOptions(
          facilities.map((facility) => ({
            value: facility.id,
            label: `${facility.name} (${facility.code})`,
          })),
        );
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const filteredStaffs = staffs;

  const activeStaffs = staffs.filter((user) => user.status === "active").length;
  const lockedStaffs = staffs.filter((user) => user.status === "locked").length;

  const createdThisMonth = staffs.filter((user) => {
    const createdDate = new Date(user.createdAt);
    const now = new Date();

    return (
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length;

  function openCreateModal() {
    setEditingStaff(null);
    setFormModalOpen(true);
  }

  function openEditModal(user: StaffAccount) {
    setEditingStaff(user);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setEditingStaff(null);
  }

  async function openDetailStaff(user: StaffAccount) {
    setDetailStaff(user);

    try {
      const response = await getStaff(user.id);
      setDetailStaff(normalizeStaff(response));
    } catch {
      setDetailStaff(user);
    }
  }

  async function openCreateStaffProfile(user: StaffAccount) {
    setStaffProfileStaff(user);
    setDetailStaff(null);
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
    if (!staffProfileStaff) return;
    setStaffProfileSubmitting(true);
    try {
      const response = await createStaffProfile(staffProfileStaff.id, values);
      const refreshedStaff = normalizeStaff(await getStaff(staffProfileStaff.id));
      setStaffs((current) =>
        current.map((user) =>
          user.id === refreshedStaff.id ? refreshedStaff : user,
        ),
      );
      setStaffProfileStaff(null);
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

  function confirmDeleteStaff(staff: StaffAccount) {
    setDeleteConfirm({ open: true, mode: "single", staff });
  }

  function confirmDeleteSelected() {
    if (selectedStaffIds.length === 0) return;

    setDeleteConfirm({
      open: true,
      mode: "selected",
      ids: selectedStaffIds,
      count: selectedStaffIds.length,
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
        const userId = deleteConfirm.staff.id;

        await deleteStaff(userId);

        setStaffs((current) => current.filter((user) => user.id !== userId));
        setTotalStaffs((current) => Math.max(current - 1, 0));
        setSelectedUserIds((current) =>
          current.filter((id) => id !== userId),
        );
        setDetailStaff((current) => (current?.id === userId ? null : current));

        Modal.success({
          title: "Xóa tài khoản thành công",
          content: "Tài khoản đã được xóa khỏi danh sách.",
          okText: "Đóng",
          centered: true,
        });
      } else {
        const ids = deleteConfirm.ids;

        await deleteStaffs(ids);

        setStaffs((current) => current.filter((user) => !ids.includes(user.id)));
        setTotalStaffs((current) => Math.max(current - ids.length, 0));
        setSelectedUserIds([]);
        setCurrentPage(1);
        setDetailStaff((current) =>
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

  const columns: ColumnsType<StaffAccount> = [
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
              void openDetailStaff(record);
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
              confirmDeleteStaff(record);
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
              onClick={() => exportStaffsToCsv(filteredStaffs)}
            >
              Xuất danh sách
            </Button>
          </div>
        </Card>

        <div className="order-2">
        <TableFilter
          columns={[
            { field: "keyword", label: "Tìm theo tên/email/SĐT", type: "text", contains: true },
            { field: "facilityId", label: "Cơ sở", type: "select", options: staffFacilityOptions, width: 240 },
            { field: "role", label: "Vai trò", type: "select", options: roleOptions, width: 165 },
            { field: "status", label: "Trạng thái", type: "select", options: statusOptions, width: 165 },
          ]}
          values={{ keyword: query, facilityId: facilityFilter, role: roleFilter, status: statusFilter }}
          onChange={(values, search) => {
            setSearchQuery(search);
            setQuery(String(values.keyword ?? ""));
            setFacilityFilter(values.facilityId ? String(values.facilityId) : undefined);
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
              value={totalStaffs}
              formatter={(value) => (
                <span className="text-slate-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title={<span className="text-emerald-700">Đang hoạt động</span>}
              value={activeStaffs}
              formatter={(value) => (
                <span className="text-emerald-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title={<span className="text-red-700">Đã khóa</span>}
              value={lockedStaffs}
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
                disabled={selectedStaffIds.length === 0}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={confirmDeleteSelected}
              >
                Xóa đã chọn
                {selectedStaffIds.length > 0
                  ? ` (${selectedStaffIds.length})`
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
            dataSource={filteredStaffs}
            className="management-table [&_.ant-table-cell]:px-3"
            scroll={{ x: 980 }}
            rowSelection={{
              selectedRowKeys: selectedStaffIds,
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

                void openDetailStaff(record);
              },
            })}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredStaffs.length,
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

      <StaffAccountFormModal
        open={formModalOpen}
        editingStaff={editingStaff}
        onClose={closeFormModal}
        onSaved={(savedStaff, mode) => {
          if (mode === "create") {
            setStaffs((current) => [savedStaff, ...current]);
            setTotalStaffs((current) => current + 1);
            setCurrentPage(1);
            return;
          }

          setStaffs((current) =>
            current.map((user) =>
              user.id === savedStaff.id ? savedStaff : user,
            ),
          );

          setDetailStaff((current) =>
            current?.id === savedStaff.id ? savedStaff : current,
          );
        }}
      />

      <Modal
        open={Boolean(detailStaff)}
        width={760}
        centered
        title={null}
        footer={
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            {detailStaff && !detailStaff.staffProfile ? (
              <Button
                icon={<UserRoundPlus className="h-4 w-4" />}
                onClick={() => void openCreateStaffProfile(detailStaff)}
              >
                Tạo hồ sơ nhân viên
              </Button>
            ) : null}
            <Button
              type="primary"
              icon={<X className="h-4 w-4" />}
              onClick={() => setDetailStaff(null)}
            >
              Đóng
            </Button>
          </div>
        }
        onCancel={() => setDetailStaff(null)}
        mask={{ closable: true }}
      >
        {detailStaff ? (
          <div>
            <div className="mb-5 flex items-start gap-4 border-b border-slate-200 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <UserRound className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <Title level={3} className="!mb-1 !text-slate-950">
                  {detailStaff.fullName}
                </Title>

                <Space size={8} wrap>
                  <Tag color={getRoleColor(detailStaff.role)}>
                    {detailStaff.roleLabel}
                  </Tag>

                  {detailStaff.status === "active" ? (
                    <Tag color="green">Hoạt động</Tag>
                  ) : (
                    <Tag color="default">Đã khóa</Tag>
                  )}

                  <Tag>{detailStaff.accountTypeLabel}</Tag>
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
                {detailStaff.id}
              </Descriptions.Item>

              <Descriptions.Item label="Họ tên" span={1}>
                {detailStaff.fullName}
              </Descriptions.Item>

              <Descriptions.Item label="Email" span={1}>
                {detailStaff.email}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại" span={1}>
                {detailStaff.phone || "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item label="Vai trò" span={1}>
                <Tag color={getRoleColor(detailStaff.role)}>
                  {detailStaff.roleLabel}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Loại tài khoản" span={1}>
                {detailStaff.accountTypeLabel}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái" span={1}>
                {detailStaff.status === "active" ? (
                  <Tag color="green">Hoạt động</Tag>
                ) : (
                  <Tag color="default">Đã khóa</Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo" span={1}>
                <Space size={6}>
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {formatDateTime(detailStaff.createdAt)}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Đăng nhập gần nhất" span={1}>
                {formatDateTime(detailStaff.lastLogin)}
              </Descriptions.Item>

              <Descriptions.Item label="Hồ sơ nhân viên" span={2}>
                {detailStaff.staffProfile ? (
                  <Space wrap>
                    <Tag color="blue">
                      {detailStaff.staffProfile.employeeCode}
                    </Tag>
                    <span>
                      {detailStaff.staffProfile.facilityAssignments
                        .flatMap((assignment) => assignment.roles)
                        .map(formatBackendRoleLabel)
                        .join(", ")}
                    </span>
                    <span>{detailStaff.staffProfile.personalEmail}</span>
                  </Space>
                ) : (
                  <Tag>Chưa tạo</Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Bảo mật" span={1}>
                <Space size={6}>
                  {detailStaff.status === "locked" ? (
                    <Lock className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  )}

                  {detailStaff.status === "locked"
                    ? "Tài khoản đang bị khóa"
                    : "Tài khoản đang hoạt động bình thường"}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(staffProfileStaff)}
        title={`Tạo hồ sơ nhân viên${
          staffProfileStaff ? ` - ${staffProfileStaff.fullName}` : ""
        }`}
        okText="Tạo hồ sơ"
        cancelText="Hủy"
        confirmLoading={staffProfileSubmitting}
        onOk={() => staffProfileForm.submit()}
        onCancel={() => {
          if (!staffProfileSubmitting) {
            setStaffProfileStaff(null);
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
              {deleteConfirm.staff.fullName} - {deleteConfirm.staff.email}
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
