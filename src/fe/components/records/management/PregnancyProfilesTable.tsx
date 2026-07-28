"use client";

import {
  Button,
  Dropdown,
  Empty,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import type { MenuProps, TableColumnsType } from "antd";

import {
  CalendarDays,
  Ellipsis,
  Eye,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";

import type { ManagementPregnancyProfile } from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";

const { Text } = Typography;

interface Props {
  data: ManagementPregnancyProfile[];
  loading?: boolean;

  page: number;
  pageSize: number;
  total: number;

  onPageChange: (page: number, pageSize: number) => void;

  onView: (profile: ManagementPregnancyProfile) => void;

  onEdit: (profile: ManagementPregnancyProfile) => void;

  onDelete: (profile: ManagementPregnancyProfile) => void;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function getRiskTag(riskLevel: ManagementPregnancyProfile["riskLevel"]) {
  switch (riskLevel) {
    case "high":
      return <Tag color="red">Nguy cơ cao</Tag>;

    case "medium":
      return <Tag color="orange">Nguy cơ trung bình</Tag>;

    default:
      return <Tag color="green">Nguy cơ thấp</Tag>;
  }
}

function getStatusTag(status: ManagementPregnancyProfile["status"]) {
  switch (status) {
    case "completed":
      return <Tag color="blue">Đã hoàn thành</Tag>;

    case "terminated":
      return <Tag color="orange">Đã kết thúc</Tag>;

    case "deleted":
      return <Tag>Đã xóa</Tag>;

    default:
      return <Tag color="green">Đang theo dõi</Tag>;
  }
}

export function PregnancyProfilesTable({
  data,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const getActionItems = (
    profile: ManagementPregnancyProfile,
  ): MenuProps["items"] => [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: <Eye size={16} />,
      onClick: () => onView(profile),
    },
    {
      key: "edit",
      label: "Cập nhật hồ sơ",
      icon: <Pencil size={16} />,
      disabled: profile.status === "deleted",
      onClick: () => onEdit(profile),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      label: "Xóa hồ sơ",
      danger: true,
      icon: <Trash2 size={16} />,
      disabled: profile.status === "deleted",
      onClick: () => onDelete(profile),
    },
  ];

  const columns: TableColumnsType<ManagementPregnancyProfile> = [
    {
      title: "Mã hồ sơ",
      dataIndex: "code",
      key: "code",
      width: 150,
      fixed: "left",
      render: (code: string | null, profile) => (
        <Button
          type="link"
          style={{
            padding: 0,
            height: "auto",
            fontWeight: 600,
          }}
          onClick={() => onView(profile)}
        >
          {code || profile.id}
        </Button>
      ),
    },
    {
      title: "Thai phụ",
      key: "patient",
      width: 220,
      render: (_, profile) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{profile.user?.name || "Chưa cập nhật tên"}</Text>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Mã bệnh nhân: {profile.patientId || "—"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      width: 220,
      render: (_, profile) => (
        <Space orientation="vertical" size={0}>
          <Text>{profile.user?.phone || "—"}</Text>

          <Text
            type="secondary"
            ellipsis={{
              tooltip: profile.user?.email,
            }}
            style={{
              maxWidth: 190,
              fontSize: 12,
            }}
          >
            {profile.user?.email || "—"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Ngày dự sinh",
      dataIndex: "expectedDueDate",
      key: "expectedDueDate",
      width: 150,
      render: (value: string | null) => (
        <Space size={6}>
          <CalendarDays size={15} />
          <Text>{formatDate(value)}</Text>
        </Space>
      ),
    },
    {
      title: "Mức nguy cơ",
      dataIndex: "riskLevel",
      key: "riskLevel",
      width: 170,
      render: getRiskTag,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: getStatusTag,
    },
    {
      title: "Hồ sơ khám",
      key: "records",
      width: 130,
      align: "center",
      render: (_, profile) => {
        const count =
          profile.medicalRecords.length + profile.consultations.length;

        return (
          <Tooltip title="Xem hồ sơ và kết quả khám">
            <Button
              type="text"
              icon={<FileText size={17} />}
              onClick={() => onView(profile)}
            >
              {count}
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 130,
      render: (value: string) => formatDate(value),
    },
    {
      title: "",
      key: "actions",
      width: 64,
      fixed: "right",
      align: "center",
      render: (_, profile) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: getActionItems(profile),
          }}
          placement="bottomRight"
        >
          <Button
            type="text"
            aria-label="Mở danh sách thao tác"
            icon={<Ellipsis size={20} />}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <Table<ManagementPregnancyProfile>
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      scroll={{ x: 1450 }}
      locale={{
        emptyText: <Empty description="Không tìm thấy hồ sơ thai kỳ" />,
      }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50],
        showTotal: (value) => `Tổng cộng ${value} hồ sơ`,
        onChange: onPageChange,
      }}
    />
  );
}
