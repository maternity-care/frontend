// src/app/management/users/components/UserAccountFormModal.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createUser, updateUser } from "@/management/features/users/users.api";
import type { User as BackendUser } from "@/management/features/users/users.types";

const { Text, Title } = Typography;

export type UserRole = "pregnant" | "staff" | "doctor" | "owner" | "admin";
export type UserStatus = "active" | "locked";
export type AccountType = "customer" | "internal" | "system";

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  roleLabel: string;
  accountType: AccountType;
  accountTypeLabel: string;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
}

export interface UserFormValues {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role?: UserRole;
  accountType?: AccountType;
  status?: UserStatus;
}

export const roleOptions = [
  { value: "pregnant", label: "Thai phụ" },
  { value: "staff", label: "Staff" },
  { value: "doctor", label: "Bác sĩ" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
];

export const statusOptions = [
  { value: "active", label: "Hoạt động" },
  { value: "locked", label: "Đã khóa" },
];

export const accountTypeOptions = [
  { value: "customer", label: "Khách hàng" },
  { value: "internal", label: "Nội bộ" },
  { value: "system", label: "Hệ thống" },
];

type ApiResponseData<T> = T | { data: T };

type UserAccountFormModalProps = {
  open: boolean;
  editingUser: UserAccount | null;
  onClose: () => void;
  onSaved?: (user: UserAccount, mode: "create" | "update") => void;
};

const initialValues: Partial<UserFormValues> = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
};

export function getRoleLabel(role: UserRole) {
  return roleOptions.find((item) => item.value === role)?.label || role;
}

export function getAccountTypeLabel(accountType: AccountType) {
  return (
    accountTypeOptions.find((item) => item.value === accountType)?.label ||
    accountType
  );
}

export function getRoleColor(role: UserRole) {
  if (role === "admin") return "red";
  if (role === "owner") return "purple";
  if (role === "doctor") return "blue";
  if (role === "staff") return "cyan";

  return "green";
}

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

function getResponseData<T>(response: ApiResponseData<T>): T {
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }

  return response as T;
}

function toBackendRoleId(role: UserRole) {
  const roleIdMap: Record<UserRole, string> = {
    admin: "2",
    doctor: "3",
    staff: "5",
    pregnant: "6",
    owner: "7",
  };

  return roleIdMap[role];
}

function toBackendStatus(status: UserStatus) {
  return status === "active" ? 1 : 0;
}

function toUiStatus(status: number): UserStatus {
  return status === 1 ? "active" : "locked";
}

function toUiRole(roleName?: string): UserRole {
  if (roleName === "super_admin" || roleName === "admin") return "admin";
  if (roleName === "doctor") return "doctor";
  if (roleName === "staff" || roleName === "nurse") return "staff";
  if (roleName === "partner" || roleName === "owner") return "owner";

  return "pregnant";
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

function deriveAccountType(roleName?: string): AccountType {
  if (roleName === "super_admin" || roleName === "admin") return "system";

  if (roleName === "doctor" || roleName === "nurse" || roleName === "staff") {
    return "internal";
  }

  return "customer";
}

function normalizeUser(user: BackendUser): UserAccount {
  const firstRole = user.roles?.[0];
  const roleName = firstRole?.name;
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
  };
}

function PreviewLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="flex gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="mt-0.5 text-slate-400">{icon}</div>

      <div className="min-w-0">
        <p className="mb-0 text-[11px] font-semibold uppercase text-slate-400">
          {label}
        </p>
        <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value || "Chưa nhập"}
        </div>
      </div>
    </div>
  );
}

export function UserAccountFormModal({
  open,
  editingUser,
  onClose,
  onSaved,
}: UserAccountFormModalProps) {
  const [form] = Form.useForm<UserFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullName = Form.useWatch("fullName", form);
  const email = Form.useWatch("email", form);
  const phone = Form.useWatch("phone", form);
  const role = Form.useWatch("role", form);
  const accountType = Form.useWatch("accountType", form);
  const status = Form.useWatch("status", form);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setError(null);

      if (editingUser) {
        form.setFieldsValue({
          fullName: editingUser.fullName,
          email: editingUser.email,
          phone: editingUser.phone,
          password: "",
          role: editingUser.role,
          accountType: editingUser.accountType,
          status: editingUser.status,
        });

        return;
      }

      form.resetFields();
      form.setFieldsValue(initialValues);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, editingUser, form]);

  const modalTitle = editingUser ? "Cập nhật tài khoản" : "Thêm tài khoản";

  const modalDescription = editingUser
    ? "Chỉnh sửa thông tin người dùng, vai trò, loại tài khoản và trạng thái."
    : "Tạo tài khoản mới cho người dùng trong hệ thống.";

  const previewName = useMemo(() => {
    return fullName || editingUser?.fullName || "Tài khoản mới";
  }, [fullName, editingUser]);

  function handleCancel() {
    if (submitting) return;

    form.resetFields();
    setError(null);
    onClose();
  }

  async function handleFinish(values: UserFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const password = values.password?.trim();

      if (editingUser) {
        const response = await updateUser(editingUser.id, {
          name: values.fullName.trim(),
          email: values.email.trim(),
          password: password || undefined,
          status: values.status ? toBackendStatus(values.status) : undefined,
          roleIds: values.role ? [toBackendRoleId(values.role)] : [],
          permissionOverrides: [],
        });

        const backendUser = getResponseData<BackendUser>(response);
        const updatedUser = normalizeUser(backendUser);

        onSaved?.(updatedUser, "update");

        Modal.success({
          title: "Cập nhật tài khoản thành công",
          content: "Thông tin tài khoản đã được cập nhật.",
          okText: "Đóng",
          centered: true,
        });

        form.resetFields();
        onClose();

        return;
      }

      if (!password || password.length < 6) {
        form.setFields([
          {
            name: "password",
            errors: ["Mật khẩu phải có ít nhất 6 ký tự"],
          },
        ]);

        return;
      }

      const response = await createUser({
        name: values.fullName.trim(),
        email: values.email.trim(),
        password,
        position: undefined,
        roleIds: values.role ? [toBackendRoleId(values.role)] : [],
        permissionOverrides: [],
      });

      let backendUser = getResponseData<BackendUser>(response);

      if (values.status === "locked") {
        const updateResponse = await updateUser(backendUser.id, {
          status: 0,
        });

        backendUser = getResponseData<BackendUser>(updateResponse);
      }

      const createdUser = normalizeUser(backendUser);

      onSaved?.(createdUser, "create");

      Modal.success({
        title: "Thêm tài khoản thành công",
        content: "Tài khoản mới đã được thêm vào danh sách.",
        okText: "Đóng",
        centered: true,
      });

      form.resetFields();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      width={980}
      centered
      title={null}
      footer={null}
      onCancel={handleCancel}
      mask={{ closable: !submitting }}
      destroyOnHidden
      styles={{
        body: {
          paddingTop: 20,
          paddingBottom: 16,
        },
      }}
    >
      <div className="border-b border-slate-200 px-1 pb-3">
        <Title level={4} className="!mb-1 !text-slate-950">
          {modalTitle}
        </Title>

        <Text className="text-sm text-slate-500">{modalDescription}</Text>
      </div>

      {error ? (
        <Alert
          className="mt-4"
          type="error"
          title={error}
          showIcon
          closable
          onClose={() => setError(null)}
        />
      ) : null}

      <Form
        key={editingUser?.id ?? "create-user"}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
        className="mt-4"
        autoComplete="off"
        clearOnDestroy
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <Card
              size="small"
              className="border-slate-200"
              styles={{
                header: {
                  padding: "8px 12px",
                  minHeight: 46,
                },
                body: {
                  padding: "12px 12px 0",
                },
              }}
              title={
                <Space size={10}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <UserRound className="h-4 w-4" />
                  </span>

                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Thông tin cá nhân
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Nhập họ tên, email và số điện thoại.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={[12, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="fullName"
                    label="Họ tên"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên" },
                    ]}
                  >
                    <Input placeholder="Ví dụ: Nguyễn Lan" autoComplete="off" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email" },
                      { type: "email", message: "Email không hợp lệ" },
                    ]}
                  >
                    <Input
                      placeholder="lan@example.com"
                      autoComplete="new-email"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input
                      placeholder="0901234567"
                      autoComplete="new-phone"
                      inputMode="tel"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="password"
                    label={editingUser ? "Mật khẩu mới" : "Mật khẩu"}
                    rules={[
                      {
                        required: !editingUser,
                        message: "Vui lòng nhập mật khẩu",
                      },
                      {
                        min: 6,
                        message: "Mật khẩu phải có ít nhất 6 ký tự",
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder={
                        editingUser
                          ? "Bỏ trống nếu không đổi mật khẩu"
                          : "Nhập mật khẩu"
                      }
                      autoComplete="new-password"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              className="border-slate-200"
              styles={{
                header: {
                  padding: "8px 12px",
                  minHeight: 46,
                },
                body: {
                  padding: "12px 12px 0",
                },
              }}
              title={
                <Space size={10}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </span>

                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Phân quyền tài khoản
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Chọn vai trò, loại tài khoản và trạng thái.
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={[12, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="role"
                    label="Vai trò"
                    rules={[
                      { required: true, message: "Vui lòng chọn vai trò" },
                    ]}
                  >
                    <Select placeholder="Chọn vai trò" options={roleOptions} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="accountType"
                    label="Loại tài khoản"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn loại tài khoản",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Chọn loại tài khoản"
                      options={accountTypeOptions}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="status"
                    label="Trạng thái"
                    rules={[
                      { required: true, message: "Vui lòng chọn trạng thái" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn trạng thái"
                      options={statusOptions}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="mb-0 truncate text-base font-semibold text-slate-950">
                  {previewName}
                </p>

                <p className="mb-0 text-sm text-slate-500">
                  {email || "Chưa có email"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {role ? (
                <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag>
              ) : (
                <Tag>Chưa chọn vai trò</Tag>
              )}

              {status ? (
                <Tag color={status === "locked" ? "default" : "green"}>
                  {status === "locked" ? "Đã khóa" : "Hoạt động"}
                </Tag>
              ) : (
                <Tag>Chưa chọn trạng thái</Tag>
              )}
            </div>

            <div className="mt-4 space-y-2.5">
              <PreviewLine
                icon={<UserRound className="h-4 w-4" />}
                label="Họ tên"
                value={fullName}
              />

              <PreviewLine
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={email}
              />

              <PreviewLine
                icon={<Phone className="h-4 w-4" />}
                label="Số điện thoại"
                value={phone}
              />

              <PreviewLine
                icon={<Users className="h-4 w-4" />}
                label="Loại tài khoản"
                value={
                  accountType ? getAccountTypeLabel(accountType) : "Chưa chọn"
                }
              />
            </div>
          </aside>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={handleCancel} disabled={submitting}>
            <X className="mr-1 h-4 w-4" />
            Hủy
          </Button>

          <Button type="primary" htmlType="submit" loading={submitting}>
            {editingUser ? (
              <Pencil className="mr-1 h-4 w-4" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}

            {editingUser ? "Cập nhật tài khoản" : "Thêm tài khoản"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
