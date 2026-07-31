"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type {
  ColumnsType,
  TablePaginationConfig,
} from "antd/es/table";
import {
  CalendarClock,
  Eye,
  FilterX,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  AdminLayout,
} from "@/management/components/layouts/AdminLayout";
import {
  PageHeader,
} from "@/management/components/ui/PageHeader";
import {
  deleteDoctor,
  getDoctor,
  getDoctors,
} from "@/management/features/doctors/doctors.api";
import type {
  Doctor,
  DoctorExperienceSort,
  DoctorStatus,
  GetDoctorsParams,
} from "@/management/features/doctors/doctors.types";
import {
  DoctorFormModal,
  doctorStatusOptions,
} from "./components/DoctorFormModal";

const {
  Text,
  Title,
} = Typography;

const DEFAULT_PAGE_SIZE = 10;

type CombinedSearchField =
  | "name"
  | "phone"
  | "facilityId"
  | "employeeCode";

type DoctorFilters = {
  keyword?: string;
  specialty?: string;
  status?: DoctorStatus;
  sortYearsOfExperience:
    DoctorExperienceSort;
};

const EXPERIENCE_SORT_OPTIONS: Array<{
  value: DoctorExperienceSort;
  label: string;
}> = [
  {
    value: "desc",
    label:
      "Kinh nghiệm: cao đến thấp",
  },
  {
    value: "asc",
    label:
      "Kinh nghiệm: thấp đến cao",
  },
];

function getErrorMessage(
  error: unknown,
) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
            errors?: {
              fields?: string[];
            };
          };
        };
      }
    ).response;

    const fields =
      response?.data?.errors
        ?.fields;

    if (
      Array.isArray(fields) &&
      fields.length > 0
    ) {
      return fields.join(", ");
    }

    const message =
      response?.data?.message;

    if (
      Array.isArray(message)
    ) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function formatDateTime(
  value?: string,
) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}

function renderStatus(
  status: DoctorStatus,
) {
  return status === "active" ? (
    <Tag color="green">
      Hoạt động
    </Tag>
  ) : (
    <Tag>
      Ngừng hoạt động
    </Tag>
  );
}

function mergeDoctorDetail(
  current: Doctor,
  detail: Doctor,
): Doctor {
  const fallbackName =
    `Bác sĩ #${detail.id}`;

  return {
    ...current,
    ...detail,
    name:
      detail.name &&
      detail.name !== fallbackName
        ? detail.name
        : current.name,
    employeeCode:
      detail.employeeCode ||
      current.employeeCode,
    personalEmail:
      detail.personalEmail ||
      current.personalEmail,
    email:
      detail.email ||
      current.email,
    phone:
      detail.phone ||
      current.phone,
    address:
      detail.address ||
      current.address,
    facilityId:
      detail.facilityId ||
      current.facilityId,
    facilityIds:
      detail.facilityIds.length > 0
        ? detail.facilityIds
        : current.facilityIds,
  };
}

/**
 * Tự nhận diện trường tìm kiếm từ một thanh search:
 * - Số điện thoại Việt Nam -> phone
 * - UUID hoặc chuỗi chỉ gồm số -> facilityId
 * - Mã dạng DR-001, BS001... -> employeeCode
 * - Còn lại -> name
 */
function inferSearchField(
  keyword: string,
): CombinedSearchField {
  const value =
    keyword.trim();

  if (
    /^(0|\+84)\d{9,10}$/.test(
      value,
    )
  ) {
    return "phone";
  }

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ) ||
    /^\d+$/.test(value)
  ) {
    return "facilityId";
  }

  if (
    /^[a-z]{1,12}[-_]?\d+$/i.test(
      value,
    )
  ) {
    return "employeeCode";
  }

  return "name";
}

function toApiParams(
  filters: DoctorFilters,
  page: number,
  limit: number,
): GetDoctorsParams {
  const keyword =
    filters.keyword?.trim();

  const searchField =
    keyword
      ? inferSearchField(
          keyword,
        )
      : undefined;

  return {
    ...(keyword &&
    searchField
      ? {
          [searchField]:
            keyword,
        }
      : {}),
    specialty:
      filters.specialty?.trim() ||
      undefined,
    status: filters.status,
    sortYearsOfExperience:
      filters.sortYearsOfExperience,
    page,
    limit,
  };
}

export default function DoctorManagementPage() {
  const [
    modal,
    modalContextHolder,
  ] = Modal.useModal();

  const [doctors, setDoctors] =
    useState<Doctor[]>([]);

  const [
    searchValue,
    setSearchValue,
  ] = useState("");

  const [
    specialtyFilter,
    setSpecialtyFilter,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      DoctorStatus | undefined
    >();

  const [
    experienceSort,
    setExperienceSort,
  ] =
    useState<DoctorExperienceSort>(
      "desc",
    );

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<DoctorFilters>({
      sortYearsOfExperience:
        "desc",
    });

  const [
    detailDoctor,
    setDetailDoctor,
  ] =
    useState<Doctor | null>(
      null,
    );

  const [
    editingDoctor,
    setEditingDoctor,
  ] =
    useState<Doctor | null>(
      null,
    );

  const [
    formModalOpen,
    setFormModalOpen,
  ] = useState(false);

  const [
    deletingDoctor,
    setDeletingDoctor,
  ] =
    useState<Doctor | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(
    DEFAULT_PAGE_SIZE,
  );

  const [total, setTotal] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const result =
          await getDoctors({
            page: 1,
            limit:
              DEFAULT_PAGE_SIZE,
            sortYearsOfExperience:
              "desc",
          });

        if (cancelled) return;

        setDoctors(
          result.items,
        );
        setTotal(result.total);
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              loadError,
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const active = doctors.filter(
      (doctor) =>
        doctor.status ===
        "active",
    ).length;

    return {
      active,
      inactive:
        doctors.length - active,
    };
  }, [doctors]);

  function buildFilters(
    overrides: Partial<DoctorFilters> = {},
  ): DoctorFilters {
    return {
      keyword:
        searchValue.trim() ||
        undefined,
      specialty:
        specialtyFilter.trim() ||
        undefined,
      status: statusFilter,
      sortYearsOfExperience:
        experienceSort,
      ...overrides,
    };
  }

  async function loadDoctors(
    filters: DoctorFilters,
    page: number,
    limit: number,
  ) {
    setLoading(true);
    setError(null);

    try {
      const result =
        await getDoctors(
          toApiParams(
            filters,
            page,
            limit,
          ),
        );

      setDoctors(result.items);
      setTotal(result.total);
      setCurrentPage(
        result.page,
      );
      setPageSize(
        result.limit,
      );
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(
    overrides: Partial<DoctorFilters> = {},
  ) {
    const nextFilters =
      buildFilters(overrides);

    setAppliedFilters(
      nextFilters,
    );
    setCurrentPage(1);

    void loadDoctors(
      nextFilters,
      1,
      pageSize,
    );
  }

  function resetFilters() {
    setSearchValue("");
    setSpecialtyFilter("");
    setStatusFilter(undefined);
    setExperienceSort("desc");

    const nextFilters: DoctorFilters =
      {
        sortYearsOfExperience:
          "desc",
      };

    setAppliedFilters(
      nextFilters,
    );
    setCurrentPage(1);

    void loadDoctors(
      nextFilters,
      1,
      pageSize,
    );
  }

  async function openDetail(
    doctor: Doctor,
  ) {
    setDetailDoctor(doctor);
    setDetailLoading(true);

    try {
      const detail =
        await getDoctor(
          doctor.id,
        );

      setDetailDoctor(
        mergeDoctorDetail(
          doctor,
          detail,
        ),
      );
    } catch (detailError) {
      setError(
        getErrorMessage(
          detailError,
        ),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function openCreate() {
    setEditingDoctor(null);
    setFormModalOpen(true);
  }

  function openEdit(
    doctor: Doctor,
  ) {
    setEditingDoctor(doctor);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setEditingDoctor(null);
  }

  function handleDoctorSaved(
    savedDoctor: Doctor,
    mode:
      | "create"
      | "update",
  ) {
    setDetailDoctor(
      (current) =>
        current?.id ===
        savedDoctor.id
          ? mergeDoctorDetail(
              current,
              savedDoctor,
            )
          : current,
    );

    const targetPage =
      mode === "create"
        ? 1
        : currentPage;

    if (mode === "create") {
      setCurrentPage(1);
    }

    void loadDoctors(
      appliedFilters,
      targetPage,
      pageSize,
    );
  }

  async function confirmDelete() {
    if (!deletingDoctor) {
      return;
    }

    const doctor =
      deletingDoctor;

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteDoctor(
        doctor.id,
      );

      setDetailDoctor(
        (current) =>
          current?.id ===
          doctor.id
            ? null
            : current,
      );

      setDeletingDoctor(null);

      const nextPage =
        doctors.length === 1 &&
        currentPage > 1
          ? currentPage - 1
          : currentPage;

      await loadDoctors(
        appliedFilters,
        nextPage,
        pageSize,
      );

      modal.success({
        centered: true,
        title:
          "Xóa bác sĩ thành công",
        content:
          "Hồ sơ bác sĩ đã được xóa khỏi danh sách.",
        okText: "Đóng",
      });
    } catch (deleteError) {
      const message =
        getErrorMessage(
          deleteError,
        );

      setError(message);

      modal.error({
        centered: true,
        title:
          "Không thể xóa bác sĩ",
        content: message,
        okText: "Đóng",
      });
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleTableChange(
    pagination:
      TablePaginationConfig,
  ) {
    const nextPageSize =
      pagination.pageSize ??
      pageSize;

    const nextPage =
      nextPageSize !==
      pageSize
        ? 1
        : pagination.current ??
          currentPage;

    void loadDoctors(
      appliedFilters,
      nextPage,
      nextPageSize,
    );
  }

  const columns: ColumnsType<Doctor> =
    [
      {
        title: "STT",
        width: 64,
        align: "center",
        fixed: "left",
        render: (
          _value,
          _record,
          index,
        ) =>
          (currentPage - 1) *
            pageSize +
          index +
          1,
      },
      {
        title: "Bác sĩ",
        width: 260,
        fixed: "left",
        render: (
          _value,
          doctor,
        ) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <Stethoscope className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <Text
                strong
                className="block truncate text-slate-900"
              >
                {doctor.name}
              </Text>

              <Text
                type="secondary"
                className="block truncate text-xs"
              >
                {doctor.employeeCode
                  ? `${doctor.employeeCode} · `
                  : ""}
                {doctor.title ||
                  "Bác sĩ"}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: "Liên hệ",
        width: 230,
        render: (
          _value,
          doctor,
        ) => (
          <div className="space-y-1">
            <Text className="block truncate">
              {doctor.email ||
                doctor.personalEmail ||
                "Chưa cập nhật email"}
            </Text>

            <Text
              type="secondary"
              className="block text-xs"
            >
              {doctor.phone ||
                "Chưa cập nhật số điện thoại"}
            </Text>
          </div>
        ),
      },
      {
        title: "Mã cơ sở",
        dataIndex:
          "facilityId",
        width: 140,
        ellipsis: true,
        render: (
          value: string,
        ) =>
          value ||
          "Chưa được gán",
      },
      {
        title: "Giấy phép",
        dataIndex:
          "licenseNo",
        width: 150,
        ellipsis: true,
        render: (
          value: string,
        ) =>
          value ||
          "Chưa cập nhật",
      },
      {
        title: "Chuyên khoa",
        width: 190,
        render: (
          _value,
          doctor,
        ) => (
          <div>
            <Text className="block">
              {doctor.specialty ||
                "Chưa cập nhật"}
            </Text>

            <Text
              type="secondary"
              className="block text-xs"
            >
              {doctor.title ||
                "Chưa cập nhật chức danh"}
            </Text>
          </div>
        ),
      },
      {
        title: "Kinh nghiệm",
        dataIndex:
          "yearsOfExperience",
        width: 125,
        align: "center",
        render: (
          value: number,
        ) =>
          `${value} năm`,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        width: 140,
        align: "center",
        render: (
          status: DoctorStatus,
        ) =>
          renderStatus(status),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 150,
        align: "center",
        fixed: "right",
        render: (
          _value,
          doctor,
        ) => (
          <Space size={6}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={
                  <Eye className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();

                  void openDetail(
                    doctor,
                  );
                }}
              />
            </Tooltip>

            <Tooltip title="Cập nhật">
              <Button
                icon={
                  <Pencil className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();
                  openEdit(doctor);
                }}
              />
            </Tooltip>

            <Tooltip title="Xóa bác sĩ">
              <Button
                danger
                icon={
                  <Trash2 className="h-4 w-4" />
                }
                onClick={(event) => {
                  event.stopPropagation();

                  setDeletingDoctor(
                    doctor,
                  );
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

  return (
    <AdminLayout
      roles={[
        "super_admin",
        "admin",
      ]}
      permissions={[
        "doctor.view",
      ]}
    >
      {modalContextHolder}

      <PageHeader
        title="Quản lý bác sĩ"
        description="Quản lý hồ sơ chuyên môn, giấy phép hành nghề và trạng thái bác sĩ."
      />

      <div className="mt-6 flex flex-col gap-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() =>
              setError(null)
            }
          />
        ) : null}

        <div className="order-1 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title="Tổng bác sĩ"
              value={total}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title="Hoạt động trên trang"
              value={stats.active}
            />
          </Card>

          <Card className="border-slate-200 bg-slate-50/70">
            <Statistic
              title="Ngừng hoạt động trên trang"
              value={stats.inactive}
            />
          </Card>
        </div>

        <Card className="order-2 border-slate-200 bg-white">
          <div
            className="flex flex-wrap items-center gap-3"
            style={{
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <Input
              allowClear
              value={searchValue}
              prefix={
                <Search className="h-4 w-4 text-slate-400" />
              }
              placeholder="Tìm..."
              title="Tìm theo họ tên, số điện thoại, mã cơ sở hoặc mã nhân viên"
              style={{
                width: 100,
                minWidth: 100,
                maxWidth: 100,
                flex: "0 0 100px",
              }}
              onChange={(event) => {
                const value =
                  event.target.value;

                setSearchValue(value);

                if (!value.trim()) {
                  applyFilters({
                    keyword:
                      undefined,
                  });
                }
              }}
              onPressEnter={() =>
                applyFilters()
              }
            />

            <Input
              allowClear
              value={specialtyFilter}
              placeholder="Chuyên khoa"
              style={{
                width: 160,
                minWidth: 160,
                maxWidth: 160,
                flex: "0 0 160px",
              }}
              onChange={(event) => {
                const value =
                  event.target.value;

                setSpecialtyFilter(
                  value,
                );

                if (!value.trim()) {
                  applyFilters({
                    specialty:
                      undefined,
                  });
                }
              }}
              onPressEnter={() =>
                applyFilters()
              }
            />

            <Select
              allowClear
              value={statusFilter}
              options={
                doctorStatusOptions
              }
              placeholder="Trạng thái"
              style={{
                width: 150,
                minWidth: 150,
                maxWidth: 150,
                flex: "0 0 150px",
              }}
              onChange={(value) => {
                setStatusFilter(value);

                applyFilters({
                  status: value,
                });
              }}
            />

            <Select<DoctorExperienceSort>
              value={experienceSort}
              options={
                EXPERIENCE_SORT_OPTIONS
              }
              style={{
                width: 220,
                minWidth: 220,
                maxWidth: 220,
                flex: "0 0 220px",
              }}
              onChange={(value) => {
                setExperienceSort(
                  value,
                );

                applyFilters({
                  sortYearsOfExperience:
                    value,
                });
              }}
            />

            <Tooltip title="Xóa bộ lọc">
              <Button
                aria-label="Xóa bộ lọc"
                icon={
                  <FilterX className="h-4 w-4" />
                }
                style={{
                  width: 40,
                  minWidth: 40,
                  maxWidth: 40,
                  flex: "0 0 40px",
                  paddingInline: 0,
                }}
                onClick={
                  resetFilters
                }
              />
            </Tooltip>
          </div>

          <Text
            type="secondary"
            className="mt-2 block text-xs"
          >
            Nhấn Enter sau khi nhập từ khóa hoặc chuyên khoa. Trạng thái và sắp xếp được áp dụng ngay.
          </Text>
        </Card>

        <Card
          className="order-3 overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 0,
            },
          }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Danh sách bác sĩ
              </p>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={
                <Plus className="h-4 w-4" />
              }
              onClick={
                openCreate
              }
            >
              Thêm bác sĩ
            </Button>
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
            scroll={{
              x: 1480,
            }}
            onRow={(doctor) => ({
              className:
                "cursor-pointer",
              onClick: (event) => {
                const target =
                  event.target as HTMLElement;

                if (
                  target.closest(
                    "button",
                  ) ||
                  target.closest("a")
                ) {
                  return;
                }

                void openDetail(
                  doctor,
                );
              },
            })}
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [
                10,
                20,
                50,
              ],
              showQuickJumper: true,
              showTotal: (
                value,
                range,
              ) =>
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${value} bác sĩ`,
            }}
            onChange={
              handleTableChange
            }
          />
        </Card>
      </div>

      <DoctorFormModal
        open={formModalOpen}
        editingDoctor={
          editingDoctor
        }
        onClose={
          closeFormModal
        }
        onSaved={
          handleDoctorSaved
        }
      />

      <Modal
        open={Boolean(
          detailDoctor,
        )}
        width={900}
        centered
        title={null}
        closable={false}
        footer={
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-2">
            {detailDoctor ? (
              <Button
                icon={
                  <Pencil className="h-4 w-4" />
                }
                onClick={() => {
                  const doctor =
                    detailDoctor;

                  setDetailDoctor(
                    null,
                  );

                  openEdit(doctor);
                }}
              >
                Cập nhật
              </Button>
            ) : null}

            <Button
              type="primary"
              icon={
                <X className="h-4 w-4" />
              }
              onClick={() =>
                setDetailDoctor(
                  null,
                )
              }
            >
              Đóng
            </Button>
          </div>
        }
        onCancel={() =>
          setDetailDoctor(null)
        }
        mask={{
          closable:
            !detailLoading,
        }}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        {detailDoctor ? (
          <div className="flex max-h-[78vh] flex-col">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-[18px] py-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Stethoscope className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <Title
                    level={4}
                    className="!mb-0.5 !text-slate-950"
                  >
                    {detailDoctor.name}
                  </Title>

                  <Text
                    type="secondary"
                    className="mb-2 block"
                  >
                    {detailDoctor.title ||
                      "Bác sĩ"}{" "}
                    ·{" "}
                    {detailDoctor.specialty ||
                      "Chưa cập nhật chuyên khoa"}
                  </Text>

                  <Space size={8} wrap>
                    {renderStatus(
                      detailDoctor.status,
                    )}

                    <Tag color="blue">
                      {detailDoctor.licenseNo ||
                        "Chưa có giấy phép"}
                    </Tag>
                  </Space>
                </div>
              </div>

              <Button
                type="text"
                shape="circle"
                aria-label="Đóng"
                title="Đóng"
                icon={
                  <X className="h-5 w-5" />
                }
                className="shrink-0"
                onClick={() =>
                  setDetailDoctor(null)
                }
              />
            </div>

            <div className="min-h-0 overflow-y-auto px-[18px] py-4 pr-3">
            <Descriptions
              bordered
              column={2}
              size="small"
              styles={{
                label: {
                  width: 150,
                  fontWeight: 600,
                },
                content: {
                  minWidth: 0,
                },
              }}
            >
              <Descriptions.Item
                label="Mã bác sĩ"
                span={1}
              >
                {detailDoctor.id}
              </Descriptions.Item>

              <Descriptions.Item
                label="Staff ID"
                span={1}
              >
                {detailDoctor.staffId ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Họ và tên"
                span={1}
              >
                <Space size={6}>
                  <UserRound className="h-4 w-4 text-slate-400" />
                  {detailDoctor.name}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Mã nhân viên"
                span={1}
              >
                {detailDoctor.employeeCode ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Email công việc"
                span={1}
              >
                <Space size={6}>
                  <Mail className="h-4 w-4 text-slate-400" />
                  {detailDoctor.email ||
                    "Chưa cập nhật"}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Email cá nhân"
                span={1}
              >
                {detailDoctor.personalEmail ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Số điện thoại"
                span={1}
              >
                <Space size={6}>
                  <Phone className="h-4 w-4 text-slate-400" />
                  {detailDoctor.phone ||
                    "Chưa cập nhật"}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Mã cơ sở"
                span={1}
              >
                {detailDoctor.facilityId ||
                  "Chưa được gán"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Giấy phép hành nghề"
                span={1}
              >
                {detailDoctor.licenseNo ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Học hàm / chức danh"
                span={1}
              >
                {detailDoctor.title ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Chuyên khoa"
                span={1}
              >
                {detailDoctor.specialty ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Số năm kinh nghiệm"
                span={1}
              >
                {
                  detailDoctor
                    .yearsOfExperience
                }{" "}
                năm
              </Descriptions.Item>

              <Descriptions.Item
                label="Trạng thái bác sĩ"
                span={1}
              >
                {renderStatus(
                  detailDoctor.status,
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label="Trạng thái nhân sự"
                span={1}
              >
                {renderStatus(
                  detailDoctor.staffStatus,
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label="Địa chỉ"
                span={2}
              >
                <Space
                  size={6}
                  align="start"
                >
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                  {detailDoctor.address ||
                    "Chưa cập nhật"}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Giới thiệu chuyên môn"
                span={2}
              >
                {detailDoctor.bio ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Ngày tạo"
                span={1}
              >
                <Space size={6}>
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {formatDateTime(
                    detailDoctor.createdAt,
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Cập nhật lần cuối"
                span={1}
              >
                <Space size={6}>
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {formatDateTime(
                    detailDoctor.updatedAt,
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(
          deletingDoctor,
        )}
        centered
        width={456}
        title={null}
        footer={null}
        closable={false}
        onCancel={() => {
          if (!deleteLoading) {
            setDeletingDoctor(
              null,
            );
          }
        }}
        mask={{
          closable:
            !deleteLoading,
        }}
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
            onClick={() =>
              setDeletingDoctor(
                null,
              )
            }
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
                {
                  deletingDoctor.name
                }
              </p>

              <p className="mb-0 mt-1">
                {deletingDoctor.title ||
                  "Bác sĩ"}{" "}
                ·{" "}
                {deletingDoctor.specialty ||
                  "Chưa cập nhật chuyên khoa"}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={() =>
                setDeletingDoctor(
                  null,
                )
              }
              disabled={
                deleteLoading
              }
            >
              Hủy
            </Button>

            <Button
              danger
              type="primary"
              size="large"
              loading={
                deleteLoading
              }
              onClick={() =>
                void confirmDelete()
              }
            >
              Xóa bác sĩ
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
