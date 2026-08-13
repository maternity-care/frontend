"use client";

import { Button, Card, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { Eye, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import type {
  Doctor,
  DoctorExperienceLevel,
  DoctorStatus,
} from "@/management/features/doctors/doctors.types";
import { getDoctorExperienceLabel } from "@/management/features/doctors/doctors.utils";

const { Text } = Typography;

type Props = {
  doctors: Doctor[];
  loading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  canManageDoctors: boolean;
  canManageDoctor: (doctor: Doctor) => boolean;
  onView: (doctor: Doctor) => void;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
  onCreate: () => void;
  onChange: (pagination: TablePaginationConfig) => void;
};

function renderStatus(status: DoctorStatus) {
  return status === "active" ? (
    <Tag color="green">Hoạt động</Tag>
  ) : (
    <Tag>Ngừng hoạt động</Tag>
  );
}

export function DoctorTable({
  doctors,
  loading,
  currentPage,
  pageSize,
  total,
  canManageDoctors,
  canManageDoctor,
  onView,
  onEdit,
  onDelete,
  onCreate,
  onChange,
}: Props) {
  const columns: ColumnsType<Doctor> = [
    {
      title: "STT",
      width: 56,
      align: "center" as const,
      responsive: ["md" as const],
      render: (_value: unknown, _record: Doctor, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Bác sĩ",
      width: "26%",
      render: (_value: unknown, doctor: Doctor) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
            <Stethoscope className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <Text strong className="block truncate text-slate-900">
              {doctor.name}
            </Text>
            <Text type="secondary" className="block truncate text-xs">
              {doctor.employeeCode ? `${doctor.employeeCode} · ` : ""}
              {doctor.title || "Bác sĩ"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Liên hệ",
      width: "24%",
      responsive: ["md" as const],
      render: (_value: unknown, doctor: Doctor) => (
        <div className="space-y-1">
          <Text className="block truncate">
            {doctor.email || doctor.personalEmail || "Chưa cập nhật email"}
          </Text>
          <Text type="secondary" className="block truncate text-xs">
            {doctor.phone || "Chưa cập nhật số điện thoại"}
          </Text>
        </div>
      ),
    },
    {
      title: "Chuyên khoa",
      width: "20%",
      render: (_value: unknown, doctor: Doctor) => (
        <div>
          <Text className="block truncate">
            {doctor.specialty || "Chưa cập nhật"}
          </Text>
          <Text type="secondary" className="block truncate text-xs">
            {doctor.title || "Chưa cập nhật chức danh"}
          </Text>
        </div>
      ),
    },
    {
      title: "Kinh nghiệm",
      dataIndex: "yearsOfExperience",
      width: 135,
      align: "center" as const,
      responsive: ["lg" as const],
      render: (value: DoctorExperienceLevel) => getDoctorExperienceLabel(value),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 125,
      align: "center" as const,
      render: (status: DoctorStatus) => renderStatus(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: canManageDoctors ? 132 : 64,
      align: "center" as const,
      render: (_value: unknown, doctor: Doctor) => {
        const manageable = canManageDoctor(doctor);
        return (
          <Space size={4}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<Eye className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();
                  onView(doctor);
                }}
              />
            </Tooltip>
            {manageable ? (
              <>
                <Tooltip title="Cập nhật">
                  <Button
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(doctor);
                    }}
                  />
                </Tooltip>
                <Tooltip title="Xóa bác sĩ">
                  <Button
                    danger
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(doctor);
                    }}
                  />
                </Tooltip>
              </>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      className="overflow-hidden border-slate-200 bg-white"
      styles={{ body: { padding: 0 } }}
      title={<p className="mb-0 text-base font-semibold text-slate-950">Danh sách bác sĩ</p>}
      extra={
        canManageDoctors ? (
          <Button type="primary" icon={<Plus className="h-4 w-4" />} onClick={onCreate}>
            Thêm bác sĩ
          </Button>
        ) : null
      }
    >
      <Table<Doctor>
        rowKey="id"
        size="middle"
        tableLayout="fixed"
        loading={loading}
        columns={columns}
        dataSource={doctors}
        className="management-table [&_.ant-table-cell]:px-3"
        onRow={(doctor) => ({
          className: "cursor-pointer",
          onClick: (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("button") || target.closest("a")) return;
            onView(doctor);
          },
        })}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          showQuickJumper: true,
          showTotal: (value, range) =>
            `Hiển thị ${range[0]} - ${range[1]} trong tổng ${value} bác sĩ`,
        }}
        onChange={onChange}
      />
    </Card>
  );
}