"use client";

import { useCallback, useEffect, useState } from "react";

import { App, Button, Card, Space, Typography } from "antd";

import { RefreshCcw } from "lucide-react";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";

import {
  deleteManagementPregnancyProfile,
  getManagementPregnancyProfiles,
  updateManagementPregnancyProfile,
} from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.api";

import type {
  GetManagementPregnancyProfilesParams,
  ManagementPregnancyProfile,
  UpdateManagementPregnancyProfileInput,
} from "@/management/features/management-pregnancy-profiles/management-pregnancy-profiles.types";
import { PregnancyProfilesTable } from "@/fe/components/records/management/PregnancyProfilesTable";
import { PregnancyProfileDetailModal } from "@/fe/components/records/management/PregnancyProfileDetailModal";
import { UpdatePregnancyProfileModal } from "@/fe/components/records/management/UpdatePregnancyProfileModal";
import {
  TableFilter,
  TableFilterColumn,
  TableFilterValues,
} from "@/management/components/ui/TableFilter";
import { CreateMedicalRecordModal } from "@/fe/components/records/management-medical-records/CreateMedicalRecordModal";

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
  const [updating, setUpdating] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<GetManagementPregnancyProfilesParams>(
    {},
  );

  const [creatingMedicalRecordFor, setCreatingMedicalRecordFor] =
    useState<ManagementPregnancyProfile | null>(null);

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

          <Button
            icon={<RefreshCcw size={16} />}
            loading={loading}
            onClick={() => void loadProfiles()}
          >
            Làm mới
          </Button>
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
    </AdminLayout>
  );
}
