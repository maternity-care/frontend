// src/app/management/staffs/components/StaffAccountFormModal.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  Mail,
  MinusCircle,
  Pencil,
  Plus,
  Phone,
  Save,
  ShieldCheck,
  ShieldPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createStaff, getPermissions, updateStaff } from "@/management/features/staffs/staffs.api";
import type { Staff as BackendStaff } from "@/management/features/staffs/staffs.types";
import type {
  Permission,
  StaffPosition,
  UserPermissionOverrideInput,
} from "@/management/features/staffs/staffs.types";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import { ApiClientError } from "@/lib/axios";

const { Text, Title } = Typography;

export type UserRole = "pregnant" | "staff" | "doctor" | "nurse" | "owner" | "admin";
export type UserStatus = "active" | "locked";
export type AccountType = "customer" | "internal" | "system";

export interface StaffAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  roleLabel: string;
  roles?: BackendStaff["roles"];
  accountType: AccountType;
  accountTypeLabel: string;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  staffProfile?: BackendStaff["staffProfile"];
  permissionOverrides?: BackendStaff["permissionOverrides"];
}

export interface StaffFormValues {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role?: UserRole;
  accountType?: AccountType;
  status?: UserStatus;
  facilityAssignments?: Array<{ facilityId: string; roles: StaffPosition[] }>;
  licenseNo?: string;
  title?: string;
  specialty?: string;
  yearsOfExperience?: number;
  bio?: string;
  allowPermissionIds?: string[];
  denyPermissionIds?: string[];
}

export const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "doctor", label: "Bác sĩ" },
  { value: "nurse", label: "Điều dưỡng" },
  { value: "staff", label: "Nhân viên" },
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

type StaffAccountFormModalProps = {
  open: boolean;
  editingStaff: StaffAccount | null;
  onClose: () => void;
  onSaved?: (staff: StaffAccount, mode: "create" | "update") => void;
};

const initialValues: Partial<StaffFormValues> = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  facilityAssignments: [{ facilityId: "", roles: ["staff"] }],
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
  if (role === "nurse") return "cyan";
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

function toBackendStatus(status: UserStatus) {
  return status === "active" ? "active" : "locked";
}

function toUiStatus(status: string): UserStatus {
  return status === "active" ? "active" : "locked";
}

function toUiRole(roleName?: string): UserRole {
  if (roleName === "super_admin" || roleName === "admin") return "admin";
  if (roleName === "doctor") return "doctor";
  if (roleName === "nurse") return "nurse";
  if (roleName === "staff") return "staff";
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
  const roleName = staffProfile?.facilityAssignments?.[0]?.roles?.[0] || firstRole?.name;
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

export function StaffAccountFormModal({
  open,
  editingStaff,
  onClose,
  onSaved,
}: StaffAccountFormModalProps) {
  const [form] = Form.useForm<StaffFormValues>();
  const { message: messageApi } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [facilityOptions, setFacilityOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const fullName = Form.useWatch("fullName", form);
  const email = Form.useWatch("email", form);
  const phone = Form.useWatch("phone", form);
  const facilityAssignments = Form.useWatch("facilityAssignments", form);
  const role = facilityAssignments?.[0]?.roles?.[0];
  const hasDoctorRole = facilityAssignments?.some(
    (assignment) => assignment?.roles?.includes("doctor"),
  );
  const accountType = Form.useWatch("accountType", form);
  const status = Form.useWatch("status", form);
  const watchedAllowPermissionIds = Form.useWatch("allowPermissionIds", form);
  const watchedDenyPermissionIds = Form.useWatch("denyPermissionIds", form);
  const allowPermissionIds = useMemo(
    () => watchedAllowPermissionIds ?? [],
    [watchedAllowPermissionIds],
  );
  const denyPermissionIds = useMemo(
    () => watchedDenyPermissionIds ?? [],
    [watchedDenyPermissionIds],
  );
  const facilitySelectOptions = useMemo(() => {
    const options = [...facilityOptions];
    const existingOptionIds = new Set(options.map((option) => option.value));

    (facilityAssignments ?? []).forEach((assignment) => {
      const facilityId = assignment?.facilityId;
      if (!facilityId || existingOptionIds.has(facilityId)) return;

      options.push({
        value: facilityId,
        label: `Cơ sở #${facilityId}`,
      });
    });

    return options;
  }, [facilityAssignments, facilityOptions]);

  const permissionModuleGroups = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    const actionOrder = [
      "view",
      "medical_view",
      "sensitive_view",
      "create",
      "update",
      "delete",
      "assign_role",
      "assign_doctor",
      "approve",
      "cancel",
      "reply",
      "close",
      "publish",
      "moderate",
      "resolve",
      "refund",
      "export",
      "share",
    ];

    permissions.forEach((permission) => {
      const moduleName = permission.name.split(".")[0] || "other";
      const modulePermissions = groups.get(moduleName) ?? [];
      modulePermissions.push(permission);
      groups.set(moduleName, modulePermissions);
    });

    return Array.from(groups.entries())
      .map(([name, items]) => ({
        name,
        label: name
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        permissions: items.sort((left, right) => {
          const leftAction = left.name.split(".")[1] ?? "";
          const rightAction = right.name.split(".")[1] ?? "";
          const leftIndex = actionOrder.indexOf(leftAction);
          const rightIndex = actionOrder.indexOf(rightAction);

          if (leftIndex !== rightIndex) {
            return (
              (leftIndex === -1 ? actionOrder.length : leftIndex) -
              (rightIndex === -1 ? actionOrder.length : rightIndex)
            );
          }

          return left.name.localeCompare(right.name);
        }),
      }))
      .map((group) => ({
        ...group,
        permissionIds: group.permissions.map((permission) => permission.id),
        options: group.permissions.map((permission) => ({
          value: permission.id,
          label: permission.name,
        })),
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [permissions]);

  const allowPermissionOptions = useMemo(
    () =>
      permissionModuleGroups
        .map((group) => ({
          label: group.label,
          options: group.options.filter(
            (option) => !denyPermissionIds.includes(option.value),
          ),
        }))
        .filter((group) => group.options.length > 0),
    [denyPermissionIds, permissionModuleGroups],
  );

  const denyPermissionOptions = useMemo(
    () =>
      permissionModuleGroups
        .map((group) => ({
          label: group.label,
          options: group.options.filter(
            (option) => !allowPermissionIds.includes(option.value),
          ),
        }))
        .filter((group) => group.options.length > 0),
    [allowPermissionIds, permissionModuleGroups],
  );

  const rolePermissionModuleGroups = useMemo(() => {
    const selectedRoles = new Set(
      (facilityAssignments ?? []).flatMap((assignment) => assignment?.roles ?? []),
    );
    const rolePermissions = (editingStaff?.roles ?? [])
      .filter((staffRole) => selectedRoles.has(staffRole.name as StaffPosition))
      .flatMap((staffRole) => staffRole.permissions ?? []);
    const uniquePermissions = Array.from(
      new Map(rolePermissions.map((permission) => [permission.id, permission])).values(),
    );
    const groups = new Map<string, Permission[]>();

    uniquePermissions.forEach((permission) => {
      const moduleName = permission.name.split(".")[0] || "other";
      const modulePermissions = groups.get(moduleName) ?? [];
      modulePermissions.push(permission);
      groups.set(moduleName, modulePermissions);
    });

    return Array.from(groups.entries())
      .map(([name, items]) => ({
        name,
        label: name
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        permissions: items.sort((left, right) => left.name.localeCompare(right.name)),
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [editingStaff?.roles, facilityAssignments]);

  function selectPermissionModule(
    effect: "allow" | "deny",
    permissionIds: string[],
  ) {
    const currentAllowIds = new Set(allowPermissionIds);
    const currentDenyIds = new Set(denyPermissionIds);

    permissionIds.forEach((permissionId) => {
      if (effect === "allow") {
        currentAllowIds.add(permissionId);
        currentDenyIds.delete(permissionId);
      } else {
        currentDenyIds.add(permissionId);
        currentAllowIds.delete(permissionId);
      }
    });

    form.setFieldsValue({
      allowPermissionIds: Array.from(currentAllowIds),
      denyPermissionIds: Array.from(currentDenyIds),
    });
  }

  function buildPermissionOverrides(
    values: StaffFormValues,
  ): UserPermissionOverrideInput[] {
    const allowIds = new Set(values.allowPermissionIds ?? []);
    const denyIds = new Set(values.denyPermissionIds ?? []);

    return [
      ...Array.from(allowIds)
        .filter((permissionId) => !denyIds.has(permissionId))
        .map((permissionId) => ({
          permissionId,
          effect: "allow" as const,
        })),
      ...Array.from(denyIds).map((permissionId) => ({
        permissionId,
        effect: "deny" as const,
      })),
    ];
  }

  useEffect(() => {
    if (!open) return;

    void getFacilities()
      .then((facilities) => {
        setFacilityOptions(
          facilities
            .map((facility) => ({
              value: facility.id,
              label: `${facility.name} (${facility.code})`,
            })),
        );
      })
      .catch((facilityError) => {
        void messageApi.error(
          facilityError instanceof Error
            ? facilityError.message
            : "Không tải được danh sách cơ sở.",
        );
      });

    setPermissionsLoading(true);
    void getPermissions()
      .then(setPermissions)
      .catch((permissionError) => {
        void messageApi.error(
          permissionError instanceof Error
            ? permissionError.message
            : "Không tải được danh sách quyền.",
        );
      })
      .finally(() => {
        setPermissionsLoading(false);
      });

    const timer = window.setTimeout(() => {
      if (editingStaff) {
        form.setFieldsValue({
          fullName: editingStaff.fullName,
          email: editingStaff.email,
          phone: editingStaff.phone,
          password: "",
          role: editingStaff.role,
          accountType: editingStaff.accountType,
          status: editingStaff.status,
          facilityAssignments:
            editingStaff.staffProfile?.facilityAssignments ?? initialValues.facilityAssignments,
          licenseNo: editingStaff.staffProfile?.doctor?.licenseNo,
          title: editingStaff.staffProfile?.doctor?.title,
          specialty: editingStaff.staffProfile?.doctor?.specialty,
          yearsOfExperience: editingStaff.staffProfile?.doctor?.yearsOfExperience,
          bio: editingStaff.staffProfile?.doctor?.bio,
          allowPermissionIds: (editingStaff.permissionOverrides ?? [])
            .filter((override) => override.effect === "allow")
            .map((override) => override.permission.id),
          denyPermissionIds: (editingStaff.permissionOverrides ?? [])
            .filter((override) => override.effect === "deny")
            .map((override) => override.permission.id),
        });

        return;
      }

      form.resetFields();
      form.setFieldsValue(initialValues);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, editingStaff, form, messageApi]);

  const modalTitle = editingStaff ? "Cập nhật tài khoản" : "Thêm tài khoản";

  const modalDescription = editingStaff
    ? "Chỉnh sửa thông tin nhân viên, vai trò, loại tài khoản và trạng thái."
    : "Tạo tài khoản mới cho nhân viên trong hệ thống.";

  const previewName = useMemo(() => {
    return fullName || editingStaff?.fullName || "Nhân viên mới";
  }, [fullName, editingStaff]);

  function handleCancel() {
    if (submitting) return;

    form.resetFields();
    onClose();
  }

  async function handleFinish(values: StaffFormValues) {
    setSubmitting(true);

    try {
      const password = values.password?.trim();

      if (editingStaff) {
        const response = await updateStaff(editingStaff.id, {
          name: values.fullName.trim(),
          email: values.email.trim(),
          password: password || undefined,
          status: values.status ? toBackendStatus(values.status) : undefined,
          permissionOverrides: buildPermissionOverrides(values),
          facilityAssignments: values.facilityAssignments,
          licenseNo: values.licenseNo,
          title: values.title,
          specialty: values.specialty,
          yearsOfExperience: values.yearsOfExperience,
          bio: values.bio,
        });

        const backendStaff = getResponseData<BackendStaff>(response);
        const updatedStaff = normalizeStaff(backendStaff);

        onSaved?.(updatedStaff, "update");

        void messageApi.success(
          response.message ?? "Cập nhật tài khoản thành công.",
        );

        form.resetFields();
        onClose();

        return;
      }

      const response = await createStaff({
        name: values.fullName.trim(),
        personalEmail: values.email.trim(),
        phone: values.phone.trim(),
        permissionOverrides: buildPermissionOverrides(values),
        facilityAssignments: values.facilityAssignments ?? [],
        licenseNo: values.licenseNo,
        title: values.title,
        specialty: values.specialty,
        yearsOfExperience: values.yearsOfExperience,
        bio: values.bio,
      });

      let backendStaff = getResponseData<BackendStaff>(response);

      if (values.status === "locked") {
        const updateResponse = await updateStaff(backendStaff.id, {
          status: "locked",
        });

        backendStaff = getResponseData<BackendStaff>(updateResponse);
      }

      const createdStaff = normalizeStaff(backendStaff);

      onSaved?.(createdStaff, "create");

      void messageApi.success(
        response.message ?? "Thêm tài khoản thành công.",
      );

      form.resetFields();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError && err.validationErrors.length > 0) {
        const fieldNames = Object.keys(
          form.getFieldsValue(true),
        ) as Array<keyof StaffFormValues>;
        const fieldErrors = fieldNames
          .map((name) => ({
            name,
            errors: err.validationErrors.filter(
              (message) =>
                message.startsWith(`${name} `) ||
                message.includes(`property ${name} `),
            ),
          }))
          .filter((field) => field.errors.length > 0);
        if (fieldErrors.length > 0) {
          form.setFields(fieldErrors);
        }
      }
      void messageApi.error(getErrorMessage(err));
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

      <Form
        key={editingStaff?.id ?? "create-staff"}
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
                    label={editingStaff ? "Email" : "Email cá nhân"}
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
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại",
                      },
                      {
                        pattern: /^(?:\+84|0)[35789]\d{8}$/,
                        message:
                          "Số điện thoại Việt Nam không hợp lệ",
                      },
                    ]}
                  >
                    <Input
                      placeholder="0901234567"
                      autoComplete="new-phone"
                      inputMode="tel"
                    />
                  </Form.Item>
                </Col>

                {editingStaff ? <Col xs={24} md={12}>
                  <Form.Item
                    name="password"
                    label="Mật khẩu mới"
                    rules={[
                      {
                        min: 6,
                        message: "Mật khẩu phải có ít nhất 6 ký tự",
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder="Bỏ trống nếu không đổi mật khẩu"
                      autoComplete="new-password"
                    />
                  </Form.Item>
                </Col> : null}
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
                      Hồ sơ nhân viên
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Chức vụ quyết định role và hồ sơ nghiệp vụ.
                    </p>
                  </span>
                </Space>
              }
            >
              <Form.List name="facilityAssignments">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => (
                      <Row gutter={12} key={field.key} align="middle">
                        <Col xs={24} md={11}>
                          <Form.Item
                            {...field}
                            name={[field.name, "facilityId"]}
                            label="Cơ sở làm việc"
                            rules={[{ required: true, message: "Vui lòng chọn cơ sở" }]}
                          >
	                            <Select
	                              placeholder="Chọn cơ sở"
	                              options={facilitySelectOptions}
	                              optionFilterProp="label"
	                            />
                          </Form.Item>
                        </Col>
                        <Col xs={20} md={11}>
                          <Form.Item
                            {...field}
                            name={[field.name, "roles"]}
                            label="Chức vụ tại cơ sở"
                            rules={[{ required: true, message: "Vui lòng chọn ít nhất một chức vụ" }]}
                          >
                            <Select mode="multiple" options={roleOptions} />
                          </Form.Item>
                        </Col>
                        <Col xs={4} md={2}>
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircle className="h-4 w-4" />}
                            onClick={() => remove(field.name)}
                            disabled={fields.length === 1}
                            title="Xóa phân công"
                          />
                        </Col>
                      </Row>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => add({ facilityId: "", roles: ["staff"] })}
                      >
                        Thêm cơ sở làm việc
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
              {hasDoctorRole ? (
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="licenseNo"
                      label="Số giấy phép hành nghề"
                      rules={[{ required: true, message: "Vui lòng nhập số giấy phép" }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="title"
                      label="Học hàm / chức danh"
                      rules={[{ required: true, message: "Vui lòng nhập chức danh" }]}
                    >
                      <Input placeholder="BS.CKI, ThS.BS..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="specialty"
                      label="Chuyên khoa"
                      rules={[{ required: true, message: "Vui lòng nhập chuyên khoa" }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="yearsOfExperience"
                      label="Số năm kinh nghiệm"
                      rules={[{ required: true, message: "Vui lòng nhập kinh nghiệm" }]}
                    >
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="bio" label="Giới thiệu chuyên môn">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}
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
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <ShieldPlus className="h-4 w-4" />
                  </span>

                  <span>
                    <p className="mb-0 text-base font-semibold text-slate-950">
                      Phân quyền riêng
                    </p>
                    <p className="mb-0 text-xs font-normal text-slate-500">
                      Tùy chỉnh quyền cộng thêm hoặc chặn riêng cho tài khoản.
                    </p>
                  </span>
                </Space>
              }
            >
              <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-3">
                <p className="mb-2 text-xs font-semibold uppercase text-sky-700">
                  Quyền theo chức vụ
                </p>
                {rolePermissionModuleGroups.length > 0 ? (
                  <div className="space-y-3">
                    {rolePermissionModuleGroups.map((group) => (
                      <div key={group.name}>
                        <div className="mb-1.5 text-xs font-semibold text-slate-600">
                          {group.label}
                        </div>
                        <Space size={[6, 6]} wrap>
                          {group.permissions.map((permission) => (
                            <Tag key={permission.id} color="blue">
                              {permission.name}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text className="text-sm text-slate-500">
                    Chưa có quyền mặc định theo chức vụ hoặc chưa chọn chức vụ.
                  </Text>
                )}
              </div>

              <Tabs
                items={[
                  {
                    key: "allow",
                    label: "Cấp thêm",
                    children: (
                      <div>
                        <div className="mb-3">
                          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                            Chọn nhanh theo module
                          </p>
                          <Space size={[6, 6]} wrap>
                            {permissionModuleGroups.map((group) => (
                              <Button
                                key={group.name}
                                size="small"
                                onClick={() =>
                                  selectPermissionModule("allow", group.permissionIds)
                                }
                              >
                                {group.label}
                              </Button>
                            ))}
                          </Space>
                        </div>
                      <Form.Item name="allowPermissionIds" label="Quyền được cấp thêm">
                        <Select
                          mode="multiple"
                          showSearch
                          options={allowPermissionOptions}
                          optionFilterProp="label"
                          loading={permissionsLoading}
                          placeholder="Chọn quyền cần cấp thêm"
                          maxTagCount="responsive"
                        />
                      </Form.Item>
                      </div>
                    ),
                  },
                  {
                    key: "deny",
                    label: "Chặn quyền",
                    children: (
                      <div>
                        <div className="mb-3">
                          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                            Chọn nhanh theo module
                          </p>
                          <Space size={[6, 6]} wrap>
                            {permissionModuleGroups.map((group) => (
                              <Button
                                key={group.name}
                                size="small"
                                danger
                                onClick={() =>
                                  selectPermissionModule("deny", group.permissionIds)
                                }
                              >
                                {group.label}
                              </Button>
                            ))}
                          </Space>
                        </div>
                      <Form.Item name="denyPermissionIds" label="Quyền bị chặn">
                        <Select
                          mode="multiple"
                          showSearch
                          options={denyPermissionOptions}
                          optionFilterProp="label"
                          loading={permissionsLoading}
                          placeholder="Chọn quyền cần chặn"
                          maxTagCount="responsive"
                        />
                      </Form.Item>
                      </div>
                    ),
                  },
                ]}
              />
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
            {editingStaff ? (
              <Pencil className="mr-1 h-4 w-4" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}

            {editingStaff ? "Cập nhật tài khoản" : "Thêm tài khoản"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
