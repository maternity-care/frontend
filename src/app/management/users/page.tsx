"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, Modal, Space, Table, Tag, Typography } from "antd";
import { Plus, UserRound } from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { TableFilter } from "@/management/components/ui/TableFilter";
import { CopyText } from "@/management/components/ui/CopyText";
import { apiClient, unwrapApiData, unwrapApiResponse } from "@/lib/axios";
import type { User } from "@/management/features/users/users.types";

const { Text } = Typography;

interface UsersPayload {
  users: User[];
  total: number;
}

interface CreateUserValues {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState<string>();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CreateUserValues>();

  async function loadUsers(search?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await unwrapApiData<UsersPayload>(
        apiClient.get("/management/users", {
          params: { search, page: currentPage, limit: pageSize },
        }),
      );
      setUsers(data.users ?? []);
      setTotalUsers(data.total ?? 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không tải được người dùng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery, currentPage, pageSize]);

  async function createUser(values: CreateUserValues) {
    try {
      await unwrapApiResponse<User>(
        apiClient.post("/management/users", {
          ...values,
          phone: values.phone || undefined,
        }),
      );
      setOpen(false);
      form.resetFields();
      await loadUsers(searchQuery);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Không tạo được người dùng.");
    }
  }

  async function lockUser(id: string) {
    try {
      await unwrapApiResponse<null>(apiClient.delete(`/management/users/${id}`));
      await loadUsers(searchQuery);
    } catch (lockError) {
      setError(lockError instanceof Error ? lockError.message : "Không khóa được tài khoản.");
    }
  }

  return (
    <AdminLayout roles={["super_admin"]} permissions={["user.view"]}>
      <PageHeader
        title="User Management"
        description="Quản lý tài khoản khách hàng Member và Partner."
      />
      <div className="mt-6 space-y-4">
        {error ? <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} /> : null}
        <Card className="management-filter">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Space>
              <UserRound className="h-5 w-5 text-slate-500" />
              <Text strong>Quản lý người dùng</Text>
            </Space>
            <Button type="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
              Thêm người dùng
            </Button>
          </div>
        </Card>
        <TableFilter
          columns={[
            { field: "keyword", label: "Tìm theo tên hoặc email", type: "text", contains: true },
          ]}
          values={{ keyword: query }}
          onChange={(values, search) => {
            const keyword = String(values.keyword ?? "");
            setQuery(keyword);
            setSearchQuery(search);
            setCurrentPage(1);
          }}
        />
        <Card className="overflow-hidden border-slate-200 bg-white" styles={{ body: { padding: 0 } }}>
          <Table<User>
            className="management-table"
            rowKey="id"
            loading={loading}
            dataSource={users}
            scroll={{ x: 760 }}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalUsers,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} người dùng`,
              onChange: (page, size) => {
                setCurrentPage(size !== pageSize ? 1 : page);
                setPageSize(size);
              },
            }}
            columns={[
            { title: "Họ tên", dataIndex: "name" },
            {
              title: "Email",
              dataIndex: "email",
              render: (value) => <CopyText value={value} copiedMessage="Đã sao chép email" />,
            },
            {
              title: "Điện thoại",
              dataIndex: "phone",
              render: (value) => (
                <CopyText value={value} copiedMessage="Đã sao chép số điện thoại" />
              ),
            },
            {
              title: "Role",
              render: (_, user) => (
                <Space wrap>
                  {(user.roles ?? []).map((role) => <Tag key={role.id}>{role.name}</Tag>)}
                </Space>
              ),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              render: (status) => status === "active" ? <Tag color="green">Hoạt động</Tag> : <Tag>Đã khóa</Tag>,
            },
            {
              title: "",
              render: (_, user) => (
                <Button danger disabled={user.status !== "active"} onClick={() => void lockUser(user.id)}>
                  Khóa
                </Button>
              ),
            },
            ]}
          />
        </Card>
      </div>
      <Modal
        open={open}
        title="Thêm người dùng"
        okText="Tạo tài khoản"
        cancelText="Hủy"
        onOk={() => form.submit()}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical" onFinish={(values) => void createUser(values)}>
          <Form.Item name="name" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }, { min: 6 }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
