"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  Eye,
  FilterX,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";

import { useAuthStore } from "@/features/auth/auth.store";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import {
  deleteDoctor,
  getDoctors,
} from "@/management/features/doctors/doctors.api";
import {
  getFacility,
  getFacilities,
} from "@/management/features/facilities/facilities.api";
import { getRoomTypeLookup } from "@/management/features/rooms/rooms.api";
import type {
  Doctor,
  DoctorExperienceLevel,
  DoctorExperienceSort,
  DoctorStatus,
  GetDoctorsParams,
} from "@/management/features/doctors/doctors.types";
import { DoctorCreateModal } from "./components/DoctorCreateModal";
import { DoctorDetailModal } from "./components/DoctorDetailModal";
import { DoctorEditModal } from "./components/DoctorEditModal";
import { doctorStatusOptions } from "./components/doctor-form.shared";

const { Text } = Typography;

const DEFAULT_PAGE_SIZE = 5;

type CombinedSearchField = "name" | "phone" | "employeeCode";

type AuthRoleValue =
  | string
  | {
      name?: string | null;
    }
  | null
  | undefined;

type AuthFacilityAssignment = {
  facilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
};

type DoctorAccessUser = {
  facilityId?: string | number | null;
  homeFacilityId?: string | number | null;
  roles?: AuthRoleValue[] | null;
  staffProfile?: {
    facilityId?: string | number | null;
    homeFacilityId?: string | number | null;
    facilityAssignments?: AuthFacilityAssignment[] | null;
  } | null;
};

function readRoleName(role: AuthRoleValue) {
  return typeof role === "string" ? role : role?.name;
}

function normalizeRoles(values: AuthRoleValue[]) {
  return new Set(
    values
      .map(readRoleName)
      .filter((role): role is string => Boolean(role))
      .map((role) => role.trim().toLowerCase()),
  );
}

type DoctorFilters = {
  keyword?: string;
  specialty?: string;
  status?: DoctorStatus;
  experienceLevel?: DoctorExperienceLevel;
  sortYearsOfExperience: DoctorExperienceSort;
};

const EXPERIENCE_LEVEL_OPTIONS: Array<{
  value: DoctorExperienceLevel;
  label: string;
}> = [
  {
    value: 1,
    label: "Kinh nghiệm 1 - 5 năm",
  },
  {
    value: 2,
    label: "Kinh nghiệm 6 - 10 năm",
  },
  {
    value: 3,
    label: "Kinh nghiệm 11 - 20 năm",
  },
  {
    value: 4,
    label: "Kinh nghiệm trên 20 năm",
  },
];

const EXPERIENCE_SORT_OPTIONS: Array<{
  value: DoctorExperienceSort;
  label: string;
}> = [
  {
    value: "desc",
    label: "Kinh nghiệm: cao đến thấp",
  },
  {
    value: "asc",
    label: "Kinh nghiệm: thấp đến cao",
  },
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

    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

function renderStatus(status: DoctorStatus) {
  return status === "active" ? (
    <Tag color="green">Hoạt động</Tag>
  ) : (
    <Tag>Ngừng hoạt động</Tag>
  );
}

/**
 * Tự nhận diện trường tìm kiếm:
 * - Số điện thoại Việt Nam -> phone
 * - Mã dạng DR-001, BS001... -> employeeCode
 * - Còn lại -> name
 */
function inferSearchField(keyword: string): CombinedSearchField {
  const value = keyword.trim();

  if (/^(0|\+84)\d{9,10}$/.test(value)) {
    return "phone";
  }

  if (/^[a-z]{1,12}[-_]?\d+$/i.test(value)) {
    return "employeeCode";
  }

  return "name";
}

function toApiParams(
  filters: DoctorFilters,
  page: number,
  limit: number,
  facilityId?: string,
): GetDoctorsParams {
  const keyword = filters.keyword?.trim();

  const searchField = keyword ? inferSearchField(keyword) : undefined;

  return {
    ...(keyword && searchField
      ? {
          [searchField]: keyword,
        }
      : {}),
    facilityId: facilityId?.trim() || undefined,
    specialty: filters.specialty?.trim() || undefined,
    status: filters.status,
    filterYearsOfExperienceLevel: filters.experienceLevel,
    sortYearsOfExperience: filters.sortYearsOfExperience,
    page,
    limit,
  };
}

export default function DoctorManagementPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  const roles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const activeFacilityId = useAuthStore((state) => state.activeFacilityId);

  const authUser = user as unknown as DoctorAccessUser | null;

  const doctorAccess = useMemo(() => {
    const globalRoles = normalizeRoles([
      ...(roles ?? []),
      ...(authUser?.roles ?? []),
    ]);

    if (globalRoles.has("super_admin")) {
      return {
        canViewAllFacilities: true,
        canManage: false,
        facilityId: "",
      };
    }

    const assignments = authUser?.staffProfile?.facilityAssignments ?? [];

    const firstAdminAssignment = assignments.find((assignment) =>
      normalizeRoles(assignment.roles ?? []).has("admin"),
    );

    const resolvedFacilityId = String(
      activeFacilityId ??
        authUser?.staffProfile?.facilityId ??
        authUser?.staffProfile?.homeFacilityId ??
        authUser?.facilityId ??
        authUser?.homeFacilityId ??
        firstAdminAssignment?.facilityId ??
        "",
    ).trim();

    const matchedAssignment = assignments.find(
      (assignment) =>
        String(assignment.facilityId ?? "").trim() === resolvedFacilityId,
    );

    const facilityRoles = normalizeRoles(matchedAssignment?.roles ?? []);

    const hasAdminRole = globalRoles.has("admin") || facilityRoles.has("admin");

    return {
      canViewAllFacilities: false,
      canManage: Boolean(resolvedFacilityId) && hasAdminRole,
      facilityId: hasAdminRole ? resolvedFacilityId : "",
    };
  }, [activeFacilityId, authUser, roles]);

  const canViewAllFacilities = doctorAccess.canViewAllFacilities;
  const canManageDoctors = doctorAccess.canManage;
  const scopedFacilityId = doctorAccess.facilityId;

  function doctorBelongsToFacility(doctor: Doctor, facilityId: string) {
    if (!facilityId) return false;

    if (doctor.facilityIds.length > 0) {
      return doctor.facilityIds.some((item) => String(item) === facilityId);
    }

    return String(doctor.facilityId ?? "") === facilityId;
  }

  function canViewDoctor(doctor: Doctor) {
    return (
      canViewAllFacilities || doctorBelongsToFacility(doctor, scopedFacilityId)
    );
  }

  function canManageDoctor(doctor: Doctor) {
    return (
      canManageDoctors && doctorBelongsToFacility(doctor, scopedFacilityId)
    );
  }

  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [searchValue, setSearchValue] = useState("");

  const [specialtyFilter, setSpecialtyFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState<DoctorStatus | undefined>();

  const [experienceLevel, setExperienceLevel] = useState<
    DoctorExperienceLevel | undefined
  >();

  const [experienceSort, setExperienceSort] =
    useState<DoctorExperienceSort>("desc");

  const [appliedFilters, setAppliedFilters] = useState<DoctorFilters>({
    sortYearsOfExperience: "desc",
  });

  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);

  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

  const [loading, setLoading] = useState(true);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [total, setTotal] = useState(0);

  const [facilityNameById, setFacilityNameById] = useState<
    Record<string, string>
  >({});

  const [roomTypeNameById, setRoomTypeNameById] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let cancelled = false;

    if (!canViewAllFacilities && !scopedFacilityId) {
      const timer = window.setTimeout(() => {
        setDoctors([]);
        setTotal(0);
        setLoading(false);
      }, 0);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    async function loadInitialData() {
      setLoading(true);

      try {
        const result = await getDoctors({
          facilityId: canViewAllFacilities ? undefined : scopedFacilityId,
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          sortYearsOfExperience: "desc",
        });

        if (cancelled) return;

        const visibleDoctors = canViewAllFacilities
          ? result.items
          : result.items.filter((doctor) =>
              doctorBelongsToFacility(doctor, scopedFacilityId),
            );

        setDoctors(visibleDoctors);
        setTotal(
          canViewAllFacilities || visibleDoctors.length === result.items.length
            ? result.total
            : visibleDoctors.length,
        );
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
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
  }, [canViewAllFacilities, scopedFacilityId]);

  useEffect(() => {
    let cancelled = false;

    if (!canViewAllFacilities && !scopedFacilityId) {
      return () => {
        cancelled = true;
      };
    }

    async function loadDisplayLookups() {
      const facilityRequest = canViewAllFacilities
        ? getFacilities({
            page: 1,
            limit: 100,
          })
        : getFacility(scopedFacilityId).then((facility) => [facility]);

      const [facilityResult, roomTypeResult] = await Promise.allSettled([
        facilityRequest,
        getRoomTypeLookup({
          status: "active",
          limit: 50,
        }),
      ]);

      if (cancelled) return;

      if (facilityResult.status === "fulfilled") {
        setFacilityNameById(
          Object.fromEntries(
            facilityResult.value.map((facility) => [
              facility.id,
              facility.name,
            ]),
          ),
        );
      }

      if (roomTypeResult.status === "fulfilled") {
        setRoomTypeNameById(
          Object.fromEntries(
            roomTypeResult.value.map((roomType) => [
              roomType.id,
              roomType.name,
            ]),
          ),
        );
      }
    }

    void loadDisplayLookups();

    return () => {
      cancelled = true;
    };
  }, [canViewAllFacilities, scopedFacilityId]);

  function buildFilters(overrides: Partial<DoctorFilters> = {}): DoctorFilters {
    return {
      keyword: searchValue.trim() || undefined,
      specialty: specialtyFilter.trim() || undefined,
      status: statusFilter,
      experienceLevel,
      sortYearsOfExperience: experienceSort,
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
      const result = await getDoctors(
        toApiParams(
          filters,
          page,
          limit,
          canViewAllFacilities ? undefined : scopedFacilityId,
        ),
      );

      const visibleDoctors = canViewAllFacilities
        ? result.items
        : result.items.filter((doctor) =>
            doctorBelongsToFacility(doctor, scopedFacilityId),
          );

      setDoctors(visibleDoctors);
      setTotal(
        canViewAllFacilities || visibleDoctors.length === result.items.length
          ? result.total
          : visibleDoctors.length,
      );
      setCurrentPage(result.page);
      setPageSize(result.limit);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(overrides: Partial<DoctorFilters> = {}) {
    const nextFilters = buildFilters(overrides);

    setAppliedFilters(nextFilters);
    setCurrentPage(1);

    void loadDoctors(nextFilters, 1, pageSize);
  }

  function resetFilters() {
    setSearchValue("");
    setSpecialtyFilter("");
    setStatusFilter(undefined);
    setExperienceLevel(undefined);
    setExperienceSort("desc");

    const nextFilters: DoctorFilters = {
      sortYearsOfExperience: "desc",
    };

    setAppliedFilters(nextFilters);
    setCurrentPage(1);

    void loadDoctors(nextFilters, 1, pageSize);
  }

  function openDetail(doctor: Doctor) {
    if (!canViewDoctor(doctor)) {
      return;
    }

    setDetailDoctor(doctor);
  }

  function openCreate() {
    if (!canManageDoctors) {
      return;
    }

    setEditingDoctor(null);
    setCreateModalOpen(true);
  }

  function openEdit(doctor: Doctor) {
    if (!canManageDoctor(doctor)) {
      return;
    }

    setCreateModalOpen(false);
    setDetailDoctor(null);
    setEditingDoctor(doctor);
  }

  function handleDoctorCreated() {
    setCreateModalOpen(false);
    setCurrentPage(1);

    void loadDoctors(appliedFilters, 1, pageSize);
  }

  function handleDoctorUpdated() {
    setEditingDoctor(null);
    setDetailDoctor(null);

    void loadDoctors(appliedFilters, currentPage, pageSize);
  }

  async function confirmDelete() {
    if (!deletingDoctor || !canManageDoctor(deletingDoctor)) {
      return;
    }

    const doctor = deletingDoctor;

    setDeleteLoading(true);
    setError(null);

    try {
      await deleteDoctor(doctor.id);

      setDetailDoctor((current) =>
        current?.id === doctor.id ? null : current,
      );

      setDeletingDoctor(null);

      const nextPage =
        doctors.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      await loadDoctors(appliedFilters, nextPage, pageSize);

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

  function handleTableChange(pagination: TablePaginationConfig) {
    const nextPageSize = pagination.pageSize ?? pageSize;

    const nextPage =
      nextPageSize !== pageSize ? 1 : (pagination.current ?? currentPage);

    void loadDoctors(appliedFilters, nextPage, nextPageSize);
  }

  const columns: ColumnsType<Doctor> = [
    {
      title: "STT",
      width: 56,
      align: "center",
      responsive: ["md"],
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Bác sĩ",
      width: "26%",
      render: (_value, doctor) => (
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
      responsive: ["md"],
      render: (_value, doctor) => (
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
      render: (_value, doctor) => (
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
      width: 105,
      align: "center",
      responsive: ["lg"],
      render: (value: number) => `${value} năm`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 125,
      align: "center",
      render: (status: DoctorStatus) => renderStatus(status),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: canManageDoctors ? 132 : 64,
      align: "center",
      render: (_value, doctor) => {
        const canManageCurrentDoctor = canManageDoctor(doctor);

        return (
          <Space size={4}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<Eye className="h-4 w-4" />}
                onClick={(event) => {
                  event.stopPropagation();

                  void openDetail(doctor);
                }}
              />
            </Tooltip>

            {canManageCurrentDoctor ? (
              <>
                <Tooltip title="Cập nhật">
                  <Button
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={(event) => {
                      event.stopPropagation();
                      openEdit(doctor);
                    }}
                  />
                </Tooltip>

                <Tooltip title="Xóa bác sĩ">
                  <Button
                    danger
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={(event) => {
                      event.stopPropagation();

                      setDeletingDoctor(doctor);
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
    <AdminLayout roles={["super_admin", "admin"]} permissions={["doctor.view"]}>
      {modalContextHolder}

      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-900">
          Quản lý bác sĩ
        </h1>
        <p className="mb-0 text-sm text-slate-500">
          Quản lý hồ sơ chuyên môn, giấy phép hành nghề và trạng thái bác sĩ.
        </p>
      </div>

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

        <Card className="order-1 border-slate-200 bg-white">
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
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Tìm theo họ tên, số điện thoại hoặc mã nhân viên"
              title="Tìm theo họ tên, số điện thoại hoặc mã nhân viên"
              style={{
                width: 300,
                minWidth: 300,
                maxWidth: 300,
                flex: "0 0 300px",
              }}
              onChange={(event) => {
                const value = event.target.value;

                setSearchValue(value);

                if (!value.trim()) {
                  applyFilters({
                    keyword: undefined,
                  });
                }
              }}
              onPressEnter={() => applyFilters()}
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
                const value = event.target.value;

                setSpecialtyFilter(value);

                if (!value.trim()) {
                  applyFilters({
                    specialty: undefined,
                  });
                }
              }}
              onPressEnter={() => applyFilters()}
            />

            <Select
              allowClear
              value={statusFilter}
              options={doctorStatusOptions}
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

            <Select<DoctorExperienceLevel>
              allowClear
              value={experienceLevel}
              options={EXPERIENCE_LEVEL_OPTIONS}
              placeholder="Mức kinh nghiệm"
              style={{
                width: 190,
                minWidth: 190,
                maxWidth: 190,
                flex: "0 0 190px",
              }}
              onChange={(value) => {
                setExperienceLevel(value);

                applyFilters({
                  experienceLevel: value,
                });
              }}
            />

            <Select<DoctorExperienceSort>
              value={experienceSort}
              options={EXPERIENCE_SORT_OPTIONS}
              style={{
                width: 210,
                minWidth: 210,
                maxWidth: 210,
                flex: "0 0 210px",
              }}
              onChange={(value) => {
                setExperienceSort(value);

                applyFilters({
                  sortYearsOfExperience: value,
                });
              }}
            />

            <Tooltip title="Xóa bộ lọc">
              <Button
                aria-label="Xóa bộ lọc"
                icon={<FilterX className="h-4 w-4" />}
                style={{
                  width: 40,
                  minWidth: 40,
                  maxWidth: 40,
                  flex: "0 0 40px",
                  paddingInline: 0,
                }}
                onClick={resetFilters}
              />
            </Tooltip>
          </div>
        </Card>

        <Card
          className="order-2 overflow-hidden border-slate-200 bg-white"
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
            canManageDoctors ? (
              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={openCreate}
              >
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

                if (target.closest("button") || target.closest("a")) {
                  return;
                }

                void openDetail(doctor);
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
            onChange={handleTableChange}
          />
        </Card>
      </div>

      {canManageDoctors ? (
        <>
          <DoctorCreateModal
            open={createModalOpen}
            allowedFacilityId={scopedFacilityId}
            onClose={() => setCreateModalOpen(false)}
            onCreated={handleDoctorCreated}
          />

          <DoctorEditModal
            open={Boolean(editingDoctor)}
            doctor={editingDoctor}
            allowedFacilityId={scopedFacilityId}
            onClose={() => setEditingDoctor(null)}
            onUpdated={handleDoctorUpdated}
          />
        </>
      ) : null}

      <DoctorDetailModal
        open={Boolean(detailDoctor)}
        doctor={detailDoctor}
        canManage={detailDoctor ? canManageDoctor(detailDoctor) : false}
        allowedFacilityId={canViewAllFacilities ? undefined : scopedFacilityId}
        facilityNameById={facilityNameById}
        roomTypeNameById={roomTypeNameById}
        onClose={() => setDetailDoctor(null)}
        onEdit={(doctor) => {
          setDetailDoctor(null);
          openEdit(doctor);
        }}
        onError={(message) => setError(message)}
      />

      <Modal
        open={canManageDoctors && Boolean(deletingDoctor)}
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
        mask={{
          closable: !deleteLoading,
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
            onClick={() => setDeletingDoctor(null)}
            disabled={deleteLoading}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">Xóa bác sĩ?</h3>

          <p className="mt-2 text-sm text-slate-500">
            Hồ sơ bác sĩ sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn
            tác.
          </p>

          {deletingDoctor ? (
            <div className="mx-auto mt-4 max-w-[350px] rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="mb-0 font-semibold">{deletingDoctor.name}</p>

              <p className="mb-0 mt-1">
                {deletingDoctor.title || "Bác sĩ"} ·{" "}
                {deletingDoctor.specialty || "Chưa cập nhật chuyên khoa"}
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
