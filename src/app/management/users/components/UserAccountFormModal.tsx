"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
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
  role: UserRole;
  accountType: AccountType;
  status: UserStatus;
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

type UserAccountFormModalProps = {
  open: boolean;
  editingUser: UserAccount | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void | Promise<void>;
};

const initialValues: UserFormValues = {
  fullName: "",
  email: "",
  phone: "",
  role: "pregnant",
  accountType: "customer",
  status: "active",
};

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
  onSubmit,
}: UserAccountFormModalProps) {
  const [form] = Form.useForm<UserFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const fullName = Form.useWatch("fullName", form);
  const email = Form.useWatch("email", form);
  const phone = Form.useWatch("phone", form);
  const role = Form.useWatch("role", form);
  const accountType = Form.useWatch("accountType", form);
  const status = Form.useWatch("status", form);

  useEffect(() => {
    if (!open) return;

    if (editingUser) {
      form.setFieldsValue({
        fullName: editingUser.fullName,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        accountType: editingUser.accountType,
        status: editingUser.status,
      });

      return;
    }

    form.resetFields();
    form.setFieldsValue(initialValues);
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
    onClose();
  }

  async function handleFinish(values: UserFormValues) {
    setSubmitting(true);

    try {
      await onSubmit({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        role: values.role,
        accountType: values.accountType,
        status: values.status,
      });

      form.resetFields();
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
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
        className="mt-4"
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
                    <Input placeholder="Ví dụ: Nguyễn Lan" />
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
                    <Input placeholder="lan@example.com" />
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
                    ]}
                  >
                    <Input placeholder="0901234567" />
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
              <Tag color={getRoleColor(role || "pregnant")}>
                {role ? getRoleLabel(role) : "Thai phụ"}
              </Tag>

              <Tag color={status === "locked" ? "default" : "green"}>
                {status === "locked" ? "Đã khóa" : "Hoạt động"}
              </Tag>
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
                  accountType ? getAccountTypeLabel(accountType) : "Khách hàng"
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