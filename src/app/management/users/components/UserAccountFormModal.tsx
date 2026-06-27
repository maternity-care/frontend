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
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { createUser, updateUser } from "@/management/features/users/users.api";
import type { User as BackendUser } from "@/management/features/users/users.types";

const { Text, Title } = Typography;
const MODAL_MESSAGES = RESPONSE_MESSAGES.USER_ACCOUNT_MODAL;

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
  { value: "pregnant", label: MODAL_MESSAGES.ROLES.MEMBER },
  { value: "staff", label: MODAL_MESSAGES.ROLES.STAFF },
  { value: "doctor", label: MODAL_MESSAGES.ROLES.DOCTOR },
  { value: "owner", label: MODAL_MESSAGES.ROLES.OWNER },
  { value: "admin", label: MODAL_MESSAGES.ROLES.ADMIN },
];

export const statusOptions = [
  { value: "active", label: MODAL_MESSAGES.ACTIVE },
  { value: "locked", label: MODAL_MESSAGES.LOCKED },
];

export const accountTypeOptions = [
  { value: "customer", label: MODAL_MESSAGES.ACCOUNT_TYPES.CUSTOMER },
  { value: "internal", label: MODAL_MESSAGES.ACCOUNT_TYPES.INTERNAL },
  { value: "system", label: MODAL_MESSAGES.ACCOUNT_TYPES.SYSTEM },
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

  return MODAL_MESSAGES.DEFAULT_ERROR;
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
  if (!roleName) return MODAL_MESSAGES.NOT_ASSIGNED;

  const roleLabelMap: Record<string, string> = {
    super_admin: MODAL_MESSAGES.ROLES.SUPER_ADMIN,
    admin: MODAL_MESSAGES.ROLES.ADMIN,
    doctor: MODAL_MESSAGES.ROLES.DOCTOR,
    nurse: MODAL_MESSAGES.ROLES.NURSE,
    staff: MODAL_MESSAGES.ROLES.STAFF,
    member: MODAL_MESSAGES.ROLES.MEMBER,
    partner: MODAL_MESSAGES.ROLES.PARTNER,
    owner: MODAL_MESSAGES.ROLES.OWNER,
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
          {value || MODAL_MESSAGES.NOT_ENTERED}
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

  const modalTitle = editingUser
    ? MODAL_MESSAGES.UPDATE_ACCOUNT
    : MODAL_MESSAGES.ADD_ACCOUNT;

  const modalDescription = editingUser
    ? MODAL_MESSAGES.UPDATE_ACCOUNT_DESCRIPTION
    : MODAL_MESSAGES.CREATE_ACCOUNT_DESCRIPTION;

  const previewName = useMemo(() => {
    return fullName || editingUser?.fullName || MODAL_MESSAGES.NEW_ACCOUNT;
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
      const selectedRole = values.role;
      const selectedStatus = values.status;
      const selectedAccountType = values.accountType;

      if (!selectedRole || !selectedStatus || !selectedAccountType) {
        await form
          .validateFields(["role", "status", "accountType"])
          .catch(() => undefined);
        return;
      }

      if (editingUser) {
        const response = await updateUser(editingUser.id, {
          name: values.fullName.trim(),
          email: values.email.trim(),
          password: password || undefined,
          status: toBackendStatus(selectedStatus),
          roleIds: [toBackendRoleId(selectedRole)],
          permissionOverrides: [],
        });

        const backendUser = getResponseData<BackendUser>(response);
        const updatedUser = normalizeUser(backendUser);

        onSaved?.(updatedUser, "update");

        Modal.success({
          title: MODAL_MESSAGES.UPDATE_SUCCESS_TITLE,
          content: MODAL_MESSAGES.UPDATE_SUCCESS_CONTENT,
          okText: RESPONSE_MESSAGES.COMMON.CLOSE,
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
            errors: [MODAL_MESSAGES.PASSWORD_MIN_LENGTH],
          },
        ]);

        return;
      }

      const response = await createUser({
        name: values.fullName.trim(),
        email: values.email.trim(),
        password,
        position: undefined,
        roleIds: [toBackendRoleId(selectedRole)],
        permissionOverrides: [],
      });

      let backendUser = getResponseData<BackendUser>(response);

      if (selectedStatus === "locked") {
        const updateResponse = await updateUser(backendUser.id, {
          status: 0,
        });

        backendUser = getResponseData<BackendUser>(updateResponse);
      }

      const createdUser = normalizeUser(backendUser);

      onSaved?.(createdUser, "create");

      Modal.success({
        title: MODAL_MESSAGES.CREATE_SUCCESS_TITLE,
        content: MODAL_MESSAGES.CREATE_SUCCESS_CONTENT,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
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
                      {MODAL_MESSAGES.PERSONAL_INFO}
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      {MODAL_MESSAGES.PERSONAL_INFO_DESCRIPTION}
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={[12, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="fullName"
                    label={RESPONSE_MESSAGES.COMMON.NAME}
                    rules={[
                      {
                        required: true,
                        message:
                          RESPONSE_MESSAGES.COMMON_DESCRIPTION.NAME_REQUIRED,
                      },
                    ]}
                  >
                    <Input
                      placeholder={MODAL_MESSAGES.FULL_NAME_PLACEHOLDER}
                      autoComplete="off"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="email"
                    label={RESPONSE_MESSAGES.COMMON.EMAIL}
                    rules={[
                      {
                        required: true,
                        message: RESPONSE_MESSAGES.AUTH.emailRequired,
                      },
                      {
                        type: "email",
                        message: RESPONSE_MESSAGES.AUTH.emailInvalid,
                      },
                    ]}
                  >
                    <Input
                      placeholder={MODAL_MESSAGES.EMAIL_PLACEHOLDER}
                      autoComplete="new-email"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="phone"
                    label={RESPONSE_MESSAGES.COMMON.PHONE}
                  >
                    <Input
                      placeholder={MODAL_MESSAGES.PHONE_PLACEHOLDER}
                      autoComplete="new-phone"
                      inputMode="tel"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="password"
                    label={
                      editingUser
                        ? MODAL_MESSAGES.NEW_PASSWORD
                        : RESPONSE_MESSAGES.COMMON.PASSWORD
                    }
                    rules={[
                      {
                        required: !editingUser,
                        message: RESPONSE_MESSAGES.AUTH.passwordRequired,
                      },
                      {
                        min: 6,
                        message: MODAL_MESSAGES.PASSWORD_MIN_LENGTH,
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder={
                        editingUser
                          ? MODAL_MESSAGES.NEW_PASSWORD_PLACEHOLDER
                          : MODAL_MESSAGES.PASSWORD_PLACEHOLDER
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
                      {MODAL_MESSAGES.ACCOUNT_PERMISSION}
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      {MODAL_MESSAGES.ACCOUNT_PERMISSION_DESCRIPTION}
                    </p>
                  </span>
                </Space>
              }
            >
              <Row gutter={[12, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="role"
                    label={RESPONSE_MESSAGES.COMMON.ROLE}
                    rules={[
                      {
                        required: true,
                        message: MODAL_MESSAGES.ROLE_REQUIRED,
                      },
                    ]}
                  >
                    <Select
                      placeholder={MODAL_MESSAGES.SELECT_ROLE}
                      options={roleOptions}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="accountType"
                    label={MODAL_MESSAGES.ACCOUNT_TYPE}
                    rules={[
                      {
                        required: true,
                        message: MODAL_MESSAGES.ACCOUNT_TYPE_REQUIRED,
                      },
                    ]}
                  >
                    <Select
                      placeholder={MODAL_MESSAGES.SELECT_ACCOUNT_TYPE}
                      options={accountTypeOptions}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="status"
                    label={RESPONSE_MESSAGES.COMMON.STATUS}
                    rules={[
                      {
                        required: true,
                        message: MODAL_MESSAGES.STATUS_REQUIRED,
                      },
                    ]}
                  >
                    <Select
                      placeholder={MODAL_MESSAGES.SELECT_STATUS}
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
                  {email || MODAL_MESSAGES.NO_EMAIL}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {role ? (
                <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag>
              ) : (
                <Tag>{MODAL_MESSAGES.SELECT_ROLE}</Tag>
              )}

              {status ? (
                <Tag color={status === "locked" ? "default" : "green"}>
                  {status === "locked"
                    ? MODAL_MESSAGES.LOCKED
                    : MODAL_MESSAGES.ACTIVE}
                </Tag>
              ) : (
                <Tag>{MODAL_MESSAGES.SELECT_STATUS}</Tag>
              )}
            </div>

            <div className="mt-4 space-y-2.5">
              <PreviewLine
                icon={<UserRound className="h-4 w-4" />}
                label={RESPONSE_MESSAGES.COMMON.NAME}
                value={fullName}
              />

              <PreviewLine
                icon={<Mail className="h-4 w-4" />}
                label={RESPONSE_MESSAGES.COMMON.EMAIL}
                value={email}
              />

              <PreviewLine
                icon={<Phone className="h-4 w-4" />}
                label={RESPONSE_MESSAGES.COMMON.PHONE}
                value={phone}
              />

              <PreviewLine
                icon={<Users className="h-4 w-4" />}
                label={MODAL_MESSAGES.ACCOUNT_TYPE}
                value={
                  accountType
                    ? getAccountTypeLabel(accountType)
                    : MODAL_MESSAGES.NOT_SELECTED
                }
              />
            </div>
          </aside>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Button onClick={handleCancel} disabled={submitting}>
            <X className="mr-1 h-4 w-4" />
            {RESPONSE_MESSAGES.COMMON.CANCEL}
          </Button>

          <Button type="primary" htmlType="submit" loading={submitting}>
            {editingUser ? (
              <Pencil className="mr-1 h-4 w-4" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}

            {editingUser
              ? MODAL_MESSAGES.UPDATE_ACCOUNT
              : MODAL_MESSAGES.ADD_ACCOUNT}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}