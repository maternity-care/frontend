"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { ColumnsType } from "antd/es/table";
import {
  CalendarClock,
  Eye,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { getFacilities } from "@/management/features/facilities/facilities.api";
import type { Facility } from "@/management/features/facilities/facilities.types";
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  getDoctors,
  updateDoctor,
} from "@/management/features/doctors/doctors.api";
import type {
  CreateDoctorInput,
  Doctor,
  DoctorStatus,
  UpdateDoctorInput,
} from "@/management/features/doctors/doctors.types";

const { Text, Title } = Typography;

const DEFAULT_DOCTOR_ROLE_ID = "3";

type CreateDoctorFormValues = {
  name: string;
  personalEmail: string;
  phone: string;
  roleIds: string[];
  facilityIds: string[];
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio?: string;
};

type UpdateDoctorFormValues = {
  staffId: string;
  licenseNo: string;
  title: string;
  specialty: string;
  yearsOfExperience: number;
  bio?: string;
  status: DoctorStatus;
};

const statusOptions = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Ngừng hoạt động" },
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

  if (error instanceof Error) return error.message;

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
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

function renderStatus(status: DoctorStatus) {
  return status === "active" ? (
    <Tag color="green">Hoạt động</Tag>
  ) : (
    <Tag color="default">Ngừng hoạt động</Tag>
  );
}

export default function DoctorManagementPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  const [createForm] = Form.useForm<CreateDoctorFormValues>();
  const [updateForm] = Form.useForm<UpdateDoctorFormValues>();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DoctorStatus | undefined>();

  const [detailDoctor, setDetailDoctor] =
    useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] =
    useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] =
    useState<Doctor | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([getDoctors(), getFacilities()])
      .then(([doctorData, facilityData]) => {
        if (cancelled) return;

        setDoctors(doctorData);
        setFacilities(
          facilityData.filter((facility) => facility.status === "active"),
        );
        setError(null);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const facilityOptions = useMemo(
    () =>
      facilities.map((facility) => ({
        value: facility.id,
        label: `${facility.name} (${facility.code})`,
      })),
    [facilities],
  );

  const filteredDoctors = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesKeyword =
        !search ||
        [
          doctor.id,
          doctor.staffId,
          doctor.licenseNo,
          doctor.title,
          doctor.specialty,
          doctor.bio,
        ].some((value) => value.toLowerCase().includes(search));

      const matchesStatus =
        !statusFilter || doctor.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [doctors, keyword, statusFilter]);

  const stats = useMemo(() => {
    const active = doctors.filter(
      (doctor) => doctor.status === "active",
    ).length;

    const averageExperience =
      doctors.length === 0
        ? 0
        : doctors.reduce(
            (sum, doctor) => sum + doctor.yearsOfExperience,
            0,
          ) / doctors.length;

    return {
      total: doctors.length,
      active,
      inactive: doctors.length - active,
      averageExperience:
        Math.round(averageExperience * 10) / 10,
    };
  }, [doctors]);

  async function openDetail(doctor: Doctor) {
    setDetailDoctor(doctor);
    setDetailLoading(true);

    try {
      const data = await getDoctor(doctor.id);
      setDetailDoctor(data);
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setDetailLoading(false);
    }
  }

  function openCreate() {
    createForm.resetFields();
    createForm.setFieldsValue({
      roleIds: [DEFAULT_DOCTOR_ROLE_ID],
      facilityIds: [],
      yearsOfExperience: 0,
    });
    setCreateModalOpen(true);
  }

  function closeCreate() {
    if (createSubmitting) return;

    setCreateModalOpen(false);
    createForm.resetFields();
  }

  function openEdit(doctor: Doctor) {
    setEditingDoctor(doctor);

    updateForm.setFieldsValue({
      staffId: doctor.staffId,
      licenseNo: doctor.licenseNo,
      title: doctor.title,
      specialty: doctor.specialty,
      yearsOfExperience: doctor.yearsOfExperience,
      bio: doctor.bio,
      status: doctor.status,
    });
  }

  function closeEdit() {
    if (updateSubmitting) return;

    setEditingDoctor(null);
    updateForm.resetFields();
  }

  async function submitCreate(values: CreateDoctorFormValues) {
    setCreateSubmitting(true);
    setError(null);

    const payload: CreateDoctorInput = {
      name: values.name.trim(),
      personalEmail: values.personalEmail.trim(),
      phone: values.phone.trim(),
      roleIds: values.roleIds.map((roleId) => roleId.trim()),
      facilityAssignments: values.facilityIds.map((facilityId) => ({
        facilityId,
        roles: ["doctor"],
      })),
      licenseNo: values.licenseNo.trim(),
      title: values.title.trim(),
      specialty: values.specialty.trim(),
      yearsOfExperience: values.yearsOfExperience,
      bio: values.bio?.trim() || undefined,
      permissionOverrides: [],
    };

    try {
      const response = await createDoctor(payload);

      setDoctors((current: Doctor[]) => [
        response.data,
        ...current,
      ]);
      setCurrentPage(1);
      setCreateModalOpen(false);
      createForm.resetFields();

      modal.success({
        centered: true,
        title: "Tạo bác sĩ thành công",
        content:
          response.message ||
          "Hồ sơ bác sĩ mới đã được tạo.",
        okText: "Đóng",
      });
    } catch (createError) {
      const message = getErrorMessage(createError);

      setError(message);

      modal.error({
        centered: true,
        title: "Không thể tạo bác sĩ",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function submitUpdate(values: UpdateDoctorFormValues) {
    if (!editingDoctor) return;

    setUpdateSubmitting(true);
    setError(null);

    const payload: UpdateDoctorInput = {
      staffId: values.staffId.trim(),
      licenseNo: values.licenseNo.trim(),
      title: values.title.trim(),
      specialty: values.specialty.trim(),
      yearsOfExperience: values.yearsOfExperience,
      bio: values.bio?.trim() ?? "",
      status: values.status,
    };

    try {
      const response = await updateDoctor(editingDoctor.id, payload);

      setDoctors((current: Doctor[]) =>
        current.map((doctor: Doctor) =>
          doctor.id === response.data.id ? response.data : doctor,
        ),
      );

      setDetailDoctor((current: Doctor | null) =>
        current?.id === response.data.id ? response.data : current,
      );

      setEditingDoctor(null);
      updateForm.resetFields();

      modal.success({
        centered: true,
        title: "Cập nhật bác sĩ thành công",
        content:
          response.message ||
          "Thông tin bác sĩ đã được cập nhật.",
        okText: "Đóng",
      });
    } catch (updateError) {
      const message = getErrorMessage(updateError);

      setError(message);

      modal.error({
        centered: true,
        title: "Không thể cập nhật bác sĩ",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setUpdateSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deletingDoctor) return;

    const doctor = deletingDoctor;

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteDoctor(doctor.id);

      setDoctors((current: Doctor[]) =>
        current.filter((item: Doctor) => item.id !== doctor.id),
      );

      setDetailDoctor((current: Doctor | null) =>
        current?.id === doctor.id ? null : current,
      );

      setDeletingDoctor(null);

      modal.success({
        centered: true,
        title: "Xóa bác sĩ thành công",
        content: "Hồ sơ bác sĩ đã được xóa khỏi danh sách.",
        okText: "Đóng",
      });
    } catch (deleteError) {
      const message = getErrorMessage(deleteError);

      setError(message);

      modal.error({
        centered: true,
        title: "Không thể xóa bác sĩ",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  const columns: ColumnsType<Doctor> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Bác sĩ",
      width: 230,
      render: (_value, doctor) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
            <Stethoscope className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <Text strong className="block truncate text-slate-900">
              {doctor.title || "Bác sĩ"} ·{" "}
              {doctor.specialty || "Chưa cập nhật chuyên khoa"}
            </Text>

            <Text type="secondary" className="block truncate text-xs">
              Staff ID: {doctor.staffId}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Giấy phép",
      dataIndex: "licenseNo",
      width: 150,
      ellipsis: true,
      render: (value: string) => value || "Chưa cập nhật",
    },
    {
      title: "Chuyên khoa",
      dataIndex: "specialty",
      width: 170,
      ellipsis: true,
      render: (value: string) => value || "Chưa cập nhật",
    },
    {
      title: "Kinh nghiệm",
      dataIndex: "yearsOfExperience",
      width: 120,
      align: "center",
      sorter: (a, b) =>
        a.yearsOfExperience - b.yearsOfExperience,
      render: (value: number) => `${value} năm`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      align: "center",
      render: (status: DoctorStatus) => renderStatus(status),
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      width: 160,
      align: "center",
      responsive: ["lg"],
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_value, doctor) => (
        <Space size={6}>
          <Button
            title="Xem chi tiết"
            icon={<Eye className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              void openDetail(doctor);
            }}
          />

          <Button
            title="Cập nhật"
            icon={<Pencil className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              openEdit(doctor);
            }}
          />

          <Button
            danger
            title="Xóa bác sĩ"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              setDeletingDoctor(doctor);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout
      roles={["super_admin", "admin"]}
      permissions={["doctor.view"]}
    >
      {modalContextHolder}

      <PageHeader
        title="Doctor Management"
        description="Quản lý hồ sơ chuyên môn, giấy phép hành nghề và trạng thái bác sĩ."
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

        <Card className="order-2 border-slate-200 bg-white">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              allowClear
              value={keyword}
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Tìm theo mã bác sĩ, Staff ID, giấy phép, chức danh hoặc chuyên khoa"
              onChange={(event) => {
                setKeyword(event.target.value);
                setCurrentPage(1);
              }}
            />

            <Select
              allowClear
              className="w-full md:w-56"
              value={statusFilter}
              options={statusOptions}
              placeholder="Lọc theo trạng thái"
              onChange={(value: DoctorStatus | undefined) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            />
          </div>
        </Card>

        <div className="order-1 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200 bg-white">
            <Statistic title="Tổng bác sĩ" value={stats.total} />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic title="Đang hoạt động" value={stats.active} />
          </Card>

          <Card className="border-slate-200 bg-slate-50/70">
            <Statistic title="Ngừng hoạt động" value={stats.inactive} />
          </Card>

          <Card className="border-sky-100 bg-sky-50/60">
            <Statistic
              title="Kinh nghiệm trung bình"
              value={stats.averageExperience}
              suffix="năm"
            />
          </Card>
        </div>

        <Card
          className="order-3 overflow-hidden border-slate-200 bg-white"
          styles={{ body: { padding: 0 } }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Danh sách bác sĩ
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Theo dõi hồ sơ chuyên môn và cập nhật thông tin bác sĩ.
              </p>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={openCreate}
            >
              Thêm bác sĩ
            </Button>
          }
        >
          <Table
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading}
            columns={columns}
            dataSource={filteredDoctors}
            className="management-table [&_.ant-table-cell]:px-3"
            scroll={{ x: 1180 }}
            onRow={(doctor) => ({
              className: "cursor-pointer",
              onClick: (event) => {
                const target = event.target as HTMLElement;

                if (
                  target.closest("button") ||
                  target.closest("a")
                ) {
                  return;
                }

                void openDetail(doctor);
              },
            })}
            pagination={{
              current: currentPage,
              pageSize,
              total: filteredDoctors.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showQuickJumper: true,
              showTotal: (total, range) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} bác sĩ`,
              onChange: (page, nextPageSize) => {
                setCurrentPage(
                  nextPageSize !== pageSize ? 1 : page,
                );
                setPageSize(nextPageSize);
              },
            }}
          />
        </Card>
      </div>

      <Modal
        open={Boolean(detailDoctor)}
        width={780}
        centered
        title={null}
        confirmLoading={detailLoading}
        footer={
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            {detailDoctor ? (
              <Button
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => {
                  const doctor = detailDoctor;
                  setDetailDoctor(null);
                  openEdit(doctor);
                }}
              >
                Cập nhật
              </Button>
            ) : null}

            <Button
              type="primary"
              icon={<X className="h-4 w-4" />}
              onClick={() => setDetailDoctor(null)}
            >
              Đóng
            </Button>
          </div>
        }
        onCancel={() => setDetailDoctor(null)}
        mask={{ closable: !detailLoading }}
      >
        {detailDoctor ? (
          <div>
            <div className="mb-5 flex items-start gap-4 border-b border-slate-200 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Stethoscope className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <Title level={3} className="!mb-1 !text-slate-950">
                  {detailDoctor.title || "Bác sĩ"} ·{" "}
                  {detailDoctor.specialty ||
                    "Chưa cập nhật chuyên khoa"}
                </Title>

                <Space size={8} wrap>
                  {renderStatus(detailDoctor.status)}

                  <Tag color="blue">
                    {detailDoctor.licenseNo ||
                      "Chưa có giấy phép"}
                  </Tag>
                </Space>
              </div>
            </div>

            <Descriptions
              bordered
              column={2}
              size="middle"
              styles={{
                label: {
                  width: 170,
                  fontWeight: 600,
                },
              }}
            >
              <Descriptions.Item label="Mã bác sĩ" span={1}>
                {detailDoctor.id}
              </Descriptions.Item>

              <Descriptions.Item label="Staff ID" span={1}>
                {detailDoctor.staffId}
              </Descriptions.Item>

              <Descriptions.Item
                label="Giấy phép hành nghề"
                span={1}
              >
                {detailDoctor.licenseNo || "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Học hàm / chức danh"
                span={1}
              >
                {detailDoctor.title || "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item label="Chuyên khoa" span={1}>
                {detailDoctor.specialty || "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Số năm kinh nghiệm"
                span={1}
              >
                {detailDoctor.yearsOfExperience} năm
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái" span={1}>
                {renderStatus(detailDoctor.status)}
              </Descriptions.Item>

              <Descriptions.Item
                label="Cập nhật lần cuối"
                span={1}
              >
                <Space size={6}>
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {formatDateTime(detailDoctor.updatedAt)}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Giới thiệu chuyên môn"
                span={2}
              >
                {detailDoctor.bio || "Chưa cập nhật"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={createModalOpen}
        width={820}
        centered
        title="Thêm bác sĩ"
        okText="Tạo bác sĩ"
        cancelText="Hủy"
        confirmLoading={createSubmitting}
        onOk={() => createForm.submit()}
        onCancel={closeCreate}
        mask={{ closable: !createSubmitting }}
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values) => void submitCreate(values)}
          className="mt-4"
          initialValues={{
            roleIds: [DEFAULT_DOCTOR_ROLE_ID],
            facilityIds: [],
            yearsOfExperience: 0,
          }}
        >
          <div className="grid gap-x-4 md:grid-cols-2">
            <Form.Item
              name="name"
              label="Họ tên"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập họ tên.",
                },
                {
                  whitespace: true,
                  message: "Họ tên không hợp lệ.",
                },
              ]}
            >
              <Input placeholder="Nguyễn Văn An" />
            </Form.Item>

            <Form.Item
              name="personalEmail"
              label="Email cá nhân"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập email.",
                },
                {
                  type: "email",
                  message: "Email không hợp lệ.",
                },
              ]}
            >
              <Input placeholder="doctor@example.com" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số điện thoại.",
                },
                {
                  pattern: /^(?:\+84|0)[35789]\d{8}$/,
                  message: "Số điện thoại Việt Nam không hợp lệ.",
                },
              ]}
            >
              <Input placeholder="0901234567" inputMode="tel" />
            </Form.Item>

            <Form.Item
              name="roleIds"
              label="Role ID"
              extra="Mặc định 3 là role bác sĩ. Có thể sửa nếu backend sử dụng ID khác."
              rules={[
                {
                  required: true,
                  type: "array",
                  min: 1,
                  message: "Vui lòng nhập ít nhất một Role ID.",
                },
              ]}
            >
              <Select
                mode="tags"
                tokenSeparators={[","]}
                placeholder="Ví dụ: 3"
              />
            </Form.Item>

            <Form.Item
              name="facilityIds"
              label="Cơ sở làm việc"
              className="md:col-span-2"
              rules={[
                {
                  required: true,
                  type: "array",
                  min: 1,
                  message: "Vui lòng chọn ít nhất một cơ sở.",
                },
              ]}
            >
              <Select
                mode="multiple"
                options={facilityOptions}
                optionFilterProp="label"
                placeholder="Chọn cơ sở làm việc"
                maxTagCount="responsive"
                loading={loading}
              />
            </Form.Item>

            <Form.Item
              name="licenseNo"
              label="Số giấy phép hành nghề"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số giấy phép.",
                },
                {
                  whitespace: true,
                  message: "Số giấy phép không hợp lệ.",
                },
              ]}
            >
              <Input placeholder="Nhập số giấy phép" />
            </Form.Item>

            <Form.Item
              name="title"
              label="Học hàm / chức danh"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập chức danh.",
                },
              ]}
            >
              <Input placeholder="BS. CKI, ThS.BS..." />
            </Form.Item>

            <Form.Item
              name="specialty"
              label="Chuyên khoa"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập chuyên khoa.",
                },
              ]}
            >
              <Input placeholder="Sản phụ khoa" />
            </Form.Item>

            <Form.Item
              name="yearsOfExperience"
              label="Số năm kinh nghiệm"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số năm kinh nghiệm.",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={80}
                precision={0}
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="bio"
              label="Giới thiệu chuyên môn"
              className="md:col-span-2"
            >
              <Input.TextArea
                rows={4}
                placeholder="Mô tả kinh nghiệm và thế mạnh chuyên môn của bác sĩ"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        open={Boolean(editingDoctor)}
        width={720}
        centered
        title="Cập nhật hồ sơ bác sĩ"
        okText="Lưu thay đổi"
        cancelText="Hủy"
        confirmLoading={updateSubmitting}
        onOk={() => updateForm.submit()}
        onCancel={closeEdit}
        mask={{ closable: !updateSubmitting }}
        destroyOnHidden
      >
        <Form
          form={updateForm}
          layout="vertical"
          onFinish={(values) => void submitUpdate(values)}
          className="mt-4"
        >
          <div className="grid gap-x-4 md:grid-cols-2">
            <Form.Item
              name="staffId"
              label="Staff ID"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập Staff ID.",
                },
                {
                  whitespace: true,
                  message: "Staff ID không hợp lệ.",
                },
              ]}
            >
              <Input placeholder="Nhập Staff ID" />
            </Form.Item>

            <Form.Item
              name="licenseNo"
              label="Số giấy phép hành nghề"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số giấy phép.",
                },
                {
                  whitespace: true,
                  message: "Số giấy phép không hợp lệ.",
                },
              ]}
            >
              <Input placeholder="Nhập số giấy phép" />
            </Form.Item>

            <Form.Item
              name="title"
              label="Học hàm / chức danh"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập chức danh.",
                },
              ]}
            >
              <Input placeholder="BS. CKI, ThS.BS..." />
            </Form.Item>

            <Form.Item
              name="specialty"
              label="Chuyên khoa"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập chuyên khoa.",
                },
              ]}
            >
              <Input placeholder="Sản phụ khoa" />
            </Form.Item>

            <Form.Item
              name="yearsOfExperience"
              label="Số năm kinh nghiệm"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số năm kinh nghiệm.",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={80}
                precision={0}
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn trạng thái.",
                },
              ]}
            >
              <Select options={statusOptions} />
            </Form.Item>

            <Form.Item
              name="bio"
              label="Giới thiệu chuyên môn"
              className="md:col-span-2"
            >
              <Input.TextArea
                rows={4}
                placeholder="Mô tả kinh nghiệm và thế mạnh chuyên môn của bác sĩ"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        open={Boolean(deletingDoctor)}
        centered
        width={456}
        title={null}
        footer={null}
        closable={false}
        onCancel={() => {
          if (!deleteLoading) {
            setDeletingDoctor(null);
          }
        }}
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
            onClick={() => setDeletingDoctor(null)}
            disabled={deleteLoading}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">
            Xóa bác sĩ?
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Hồ sơ bác sĩ sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.
          </p>

          {deletingDoctor ? (
            <div className="mx-auto mt-4 max-w-[350px] rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="mb-0 font-semibold">
                {deletingDoctor.title || "Bác sĩ"} ·{" "}
                {deletingDoctor.specialty || "Chưa cập nhật chuyên khoa"}
              </p>
              <p className="mb-0 mt-1">
                Staff ID: {deletingDoctor.staffId}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={() => setDeletingDoctor(null)}
              disabled={deleteLoading}
            >
              Hủy
            </Button>

            <Button
              danger
              type="primary"
              size="large"
              loading={deleteLoading}
              onClick={() => void confirmDelete()}
            >
              Xóa bác sĩ
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}