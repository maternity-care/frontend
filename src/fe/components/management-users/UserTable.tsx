"use client";

import {
  Avatar,
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { Eye, Lock, Pencil, Plus } from "lucide-react";
import type {
  User,
  UserStatus,
} from "@/management/features/management-users/management-user.types";

const { Text } = Typography;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(-2).map((p) => p[0]).join("").toUpperCase() || "U";
}

function renderStatus(status: UserStatus) {
  if (status === "active") return <Tag color="green">Đang hoạt động</Tag>;
  if (status === "locked") return <Tag color="red">Đã khóa</Tag>;
  return <Tag>Ngừng hoạt động</Tag>;
}

interface Props {
  data: User[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onLock: (user: User) => void;
  onCreate: () => void;
}

export function UserTable({
  data,
  loading,
  currentPage,
  pageSize,
  total,
  onPageChange,
  onView,
  onEdit,
  onLock,
  onCreate,
}: Props) {
  const columns: ColumnsType<User> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      fixed: "left",
      render: (_v, _r, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Người dùng",
      width: 260,
      fixed: "left",
      render: (_v, user) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="!shrink-0 !bg-pink-500 !font-semibold">
            {getInitials(user.name)}
          </Avatar>
          <div className="min-w-0">
            <Text strong className="block truncate">
              {user.name}
            </Text>
            <Text type="secondary" className="block truncate text-xs">
              {user.email}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "CCCD",
      dataIndex: "cccd",
      width: 150,
      render: (value?: string | null) => (
        <Text className="font-mono">{value || "—"}</Text>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 140,
    },
    {
      title: "Ngày sinh",
      dataIndex: "dateOfBirth",
      width: 130,
      render: (value?: string | null) =>
        value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      align: "center",
      render: (value: UserStatus) => renderStatus(value),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      align: "center",
      render: (_v, user) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<Eye className="h-4 w-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onView(user);
              }}
            />
          </Tooltip>

          <Tooltip title="Cập nhật">
            <Button
              icon={<Pencil className="h-4 w-4" />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
              }}
            />
          </Tooltip>

          {/* Chỉ hiện Khóa khi đang active */}
          {user.status === "active" && (
            <Tooltip title="Khóa tài khoản">
              <Button
                danger
                icon={<Lock className="h-4 w-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onLock(user);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      className="overflow-hidden border-slate-200 bg-white"
      styles={{ body: { padding: 0 } }}
      title={
        <div>
          <p className="mb-0 text-base font-semibold text-slate-950">
            Danh sách người dùng
          </p>
          <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
            Bấm vào một dòng để xem chi tiết.
          </p>
        </div>
      }
      extra={
        <Button
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={onCreate}
        >
          Thêm người dùng
        </Button>
      }
    >
      <Table<User>
        rowKey="id"
        size="middle"
        tableLayout="fixed"
        loading={loading}
        columns={columns}
        dataSource={data}
        scroll={{ x: 1100 }}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (t, range) =>
            `${range[0]}-${range[1]} / ${t} người dùng`,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có người dùng phù hợp."
            >
              <Button type="primary" onClick={onCreate}>
                Thêm người dùng
              </Button>
            </Empty>
          ),
        }}
        onChange={(pagination: TablePaginationConfig) => {
          onPageChange(
            pagination.current ?? 1,
            pagination.pageSize ?? pageSize
          );
        }}
        onRow={(user) => ({
          className: "cursor-pointer",
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("button") || target.closest("a")) return;
            onView(user);
          },
        })}
        className="management-table [&_.ant-table-cell]:px-3"
      />
    </Card>
  );
}