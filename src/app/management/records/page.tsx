"use client";

import { useCallback, useEffect, useState } from "react";

import { App, Button, Card, Space, Typography } from "antd";

import { Plus, RefreshCcw } from "lucide-react";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";

import {
  createManagementPregnancyProfile,
  deleteManagementPregnancyProfile,
  getManagementPregnancyProfiles,
  updateManagementPregnancyProfile,
} from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.api";

import type {
  CreateManagementPregnancyProfileInput,
  GetManagementPregnancyProfilesParams,
  ManagementPregnancyProfile,
  UpdateManagementPregnancyProfileInput,
} from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";
import { PregnancyProfilesTable } from "@/fe/components/records/management/PregnancyProfilesTable";
import { PregnancyProfileDetailModal } from "@/fe/components/records/management/PregnancyProfileDetailModal";
import { CreatePregnancyProfileModal } from "@/fe/components/records/management/CreatePregnancyProfileModal";
import { UpdatePregnancyProfileModal } from "@/fe/components/records/management/UpdatePregnancyProfileModal";
import {
  TableFilter,
  TableFilterColumn,
  TableFilterValues,
} from "@/management/components/ui/TableFilter";
import { CreateMedicalRecordModal } from "@/fe/components/records/management-medical-records/CreateMedicalRecordModal";
import { UpdateMedicalRecordModal } from "@/fe/components/records/management/UpdateMedicalRecordModal";

const { Title, Text } = Typography;

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            error?: string;
          };
        };
      }
    ).response;

    const serverMessage = response?.data?.message;

    if (Array.isArray(serverMessage)) {
      return serverMessage.join(", ");
    }

    if (typeof serverMessage === "string") {
      return serverMessage;
    }

    if (response?.data?.error) {
      return response.data.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi không xác định.";
}

const PREGNANCY_PROFILE_FILTER_COLUMNS: TableFilterColumn[] = [
  {
    field: "search",
    label: "Tìm kiếm hồ sơ",
    type: "text",
    width: 280,
    contains: true,
  },
  {
    field: "riskLevel",
    label: "Mức nguy cơ",
    type: "select",
    width: 200,
    options: [
      {
        value: "low",
        label: "Nguy cơ thấp",
      },
      {
        value: "medium",
        label: "Nguy cơ trung bình",
      },
      {
        value: "high",
        label: "Nguy cơ cao",
      },
    ],
  },
  {
    field: "status",
    label: "Trạng thái",
    type: "select",
    width: 200,
    options: [
      {
        value: "active",
        label: "Đang theo dõi",
      },
      {
        value: "completed",
        label: "Đã hoàn thành",
      },
      {
        value: "terminated",
        label: "Đã kết thúc",
      },
      {
        value: "deleted",
        label: "Đã xóa",
      },
    ],
  },
];

export default function ManagementPregnancyProfilesPage() {
  const { message, modal } = App.useApp();

  const [profiles, setProfiles] = useState<ManagementPregnancyProfile[]>([]);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<GetManagementPregnancyProfilesParams>(
    {},
  );

  const [editingMedicalRecordId, setEditingMedicalRecordId] = useState<
    string | null
  >(null);

  const [creatingMedicalRecordFor, setCreatingMedicalRecordFor] =
    useState<ManagementPregnancyProfile | null>(null);

  const [createProfileOpen, setCreateProfileOpen] = useState(false);

  const [detailProfile, setDetailProfile] =
    useState<ManagementPregnancyProfile | null>(null);

  const [editingProfile, setEditingProfile] =
    useState<ManagementPregnancyProfile | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getManagementPregnancyProfiles({
        ...filters,
        page,
        limit: pageSize,
      });

      setProfiles(result.items);
      setTotal(result.total);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters, message, page, pageSize]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfiles();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadProfiles]);

  // const handleSearch = (values: GetManagementPregnancyProfilesParams) => {
  //   setPage(1);
  //   setFilters(values);
  // };

  // const handleReset = () => {
  //   setPage(1);
  //   setFilters({});
  // };

  const handleFilterChange = (values: TableFilterValues) => {
    const nextFilters: GetManagementPregnancyProfilesParams = {
      search:
        typeof values.search === "string"
          ? values.search.trim() || undefined
          : undefined,

      riskLevel:
        values.riskLevel === "low" ||
        values.riskLevel === "medium" ||
        values.riskLevel === "high"
          ? values.riskLevel
          : undefined,

      status:
        values.status === "active" ||
        values.status === "completed" ||
        values.status === "terminated" ||
        values.status === "deleted"
          ? values.status
          : undefined,
    };

    setPage(1);
    setFilters(nextFilters);
  };

  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPage(1);
      setPageSize(nextPageSize);
      return;
    }

    setPage(nextPage);
  };

  const handleCreate = async (input: CreateManagementPregnancyProfileInput) => {
    setCreating(true);

    try {
      await createManagementPregnancyProfile(input);
      message.success("Tạo hồ sơ thai kỳ thành công.");
      setCreateProfileOpen(false);
      setPage(1);
      await loadProfiles();
    } catch (error) {
      message.error(getErrorMessage(error));
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (
    id: string,
    input: UpdateManagementPregnancyProfileInput,
  ) => {
    setUpdating(true);

    try {
      const updatedProfile = await updateManagementPregnancyProfile(id, input);

      setProfiles((currentProfiles) =>
        currentProfiles.map((profile) =>
          profile.id === updatedProfile.id ? updatedProfile : profile,
        ),
      );

      if (detailProfile?.id === updatedProfile.id) {
        setDetailProfile(updatedProfile);
      }

      setEditingProfile(null);

      message.success("Cập nhật hồ sơ thai kỳ thành công.");
    } catch (error) {
      message.error(getErrorMessage(error));
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = (profile: ManagementPregnancyProfile) => {
    modal.confirm({
      title: "Xóa hồ sơ thai kỳ?",

      content: (
        <div>
          Hồ sơ <strong>{profile.code || profile.id}</strong> của thai phụ{" "}
          <strong>{profile.user?.name || "Chưa có tên"}</strong> sẽ bị xóa.
        </div>
      ),

      okText: "Xóa hồ sơ",
      cancelText: "Hủy",

      okButtonProps: {
        danger: true,
      },

      async onOk() {
        try {
          await deleteManagementPregnancyProfile(profile.id);

          message.success("Đã xóa hồ sơ thai kỳ.");

          if (detailProfile?.id === profile.id) {
            setDetailProfile(null);
          }

          if (editingProfile?.id === profile.id) {
            setEditingProfile(null);
          }

          if (profiles.length === 1 && page > 1) {
            setPage((currentPage) => currentPage - 1);
          } else {
            await loadProfiles();
          }
        } catch (error) {
          message.error(getErrorMessage(error));
          throw error;
        }
      },
    });
  };

  return (
    <AdminLayout>
      <Space orientation="vertical" size={20} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Quản lý hồ sơ thai kỳ
            </Title>

            <Text type="secondary">
              Tra cứu và quản lý hồ sơ thai kỳ của thai phụ.
            </Text>
          </div>

          <Space wrap>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setCreateProfileOpen(true)}
            >
              Thêm hồ sơ
            </Button>

            <Button
              icon={<RefreshCcw size={16} />}
              loading={loading}
              onClick={() => void loadProfiles()}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        <TableFilter
          columns={PREGNANCY_PROFILE_FILTER_COLUMNS}
          values={{
            search: filters.search,
            riskLevel: filters.riskLevel,
            status: filters.status,
          }}
          clearLabel="Xóa bộ lọc"
          onChange={handleFilterChange}
        />

        <Card styles={{ body: { padding: 0 } }}>
          <PregnancyProfilesTable
            data={profiles}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={handlePageChange}
            onView={setDetailProfile}
            onEdit={setEditingProfile}
            onDelete={handleDelete}
            onAddMedicalRecord={setCreatingMedicalRecordFor}
          />
        </Card>
      </Space>

      <PregnancyProfileDetailModal
        open={detailProfile !== null}
        profile={detailProfile}
        onClose={() => setDetailProfile(null)}
        onEdit={(profile) => {
          setDetailProfile(null);
          setEditingProfile(profile);
        }}
        onEditMedicalRecord={(id) => setEditingMedicalRecordId(id)}
      />

      <CreatePregnancyProfileModal
        open={createProfileOpen}
        loading={creating}
        onCancel={() => {
          if (!creating) {
            setCreateProfileOpen(false);
          }
        }}
        onSubmit={handleCreate}
      />

      <UpdatePregnancyProfileModal
        open={editingProfile !== null}
        profile={editingProfile}
        loading={updating}
        onCancel={() => {
          if (!updating) {
            setEditingProfile(null);
          }
        }}
        onSubmit={handleUpdate}
      />

      <CreateMedicalRecordModal
        open={creatingMedicalRecordFor !== null}
        profile={creatingMedicalRecordFor}
        onCancel={() => setCreatingMedicalRecordFor(null)}
        onSuccess={() => {
          setCreatingMedicalRecordFor(null);
          void loadProfiles(); // reload danh sách để thấy medicalRecords mới
        }}
      />

      <UpdateMedicalRecordModal
        open={editingMedicalRecordId !== null}
        medicalRecordId={editingMedicalRecordId}
        onCancel={() => setEditingMedicalRecordId(null)}
        onSuccess={() => {
          setEditingMedicalRecordId(null);
          void loadProfiles();
        }}
      />
    </AdminLayout>
  );
}
