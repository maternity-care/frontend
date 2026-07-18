"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Button,
  Card,
  Modal,
  message,
} from "antd";

import {
  Plus,
} from "lucide-react";

import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { TableFilter } from "@/fe/components/ui/TableFilter";
import { FacilityService, FacilityServiceFormValues, FacilityServiceStatus, GetFacilityServicesParams } from "@/management/features/services/services.types";
import { useFacilityServices } from "@/utils/profile/services/useFacilityServices";
import { createFacilityService, deleteFacilityService, getFacilityService, updateFacilityService } from "@/management/features/services/services.api";
import { FacilityServicesTable } from "@/fe/components/services/FacilityServicesTable";
import { FacilityServiceFormModal } from "@/fe/components/services/FacilityServiceFormModal";
import { FacilityServiceDetailModal } from "@/fe/components/services/FacilityServiceDetailModal";

interface FacilityServiceFilters {
  search: string;
  facilityId?: string;
  serviceId?: string;
  serviceType?: string;
  status?: FacilityServiceStatus;
}

const initialFilters: FacilityServiceFilters = {
  search: "",
};

const statusOptions = [
  {
    value: "available",
    label: "Đang cung cấp",
  },
  {
    value: "unavailable",
    label: "Ngừng cung cấp",
  },
];

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const possibleError = error as {
      message?: string;
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    };

    const responseMessage =
      possibleError.response?.data?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage.join(", ");
    }

    if (typeof responseMessage === "string") {
      return responseMessage;
    }

    if (possibleError.message) {
      return possibleError.message;
    }
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

export default function FacilityServicesManagementPage() {
  const [filters, setFilters] =
    useState<FacilityServiceFilters>(initialFilters);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formModalOpen, setFormModalOpen] =
    useState(false);
  const [formMode, setFormMode] =
    useState<"create" | "edit">("create");
  const [submitting, setSubmitting] =
    useState(false);

  const [selectedService, setSelectedService] =
    useState<FacilityService>();

  const [detailModalOpen, setDetailModalOpen] =
    useState(false);
  const [detailLoading, setDetailLoading] =
    useState(false);

  const queryParams = useMemo<GetFacilityServicesParams>(
    () => ({
      search: filters.search || undefined,
      facilityId: filters.facilityId,
      serviceId: filters.serviceId,
      serviceType: filters.serviceType,
      status: filters.status,
      page,
      limit: pageSize,
    }),
    [
      filters.search,
      filters.facilityId,
      filters.serviceId,
      filters.serviceType,
      filters.status,
      page,
      pageSize,
    ],
  );

  const {
    items,
    total,
    loading,
    error,
    reload,
  } = useFacilityServices(queryParams);

  function openCreateModal() {
    setSelectedService(undefined);
    setFormMode("create");
    setFormModalOpen(true);
  }

  async function openEditModal(
    record: FacilityService,
  ) {
    setSubmitting(true);

    try {
      const detail = await getFacilityService(record.id);

      setSelectedService(detail);
      setFormMode("edit");
      setFormModalOpen(true);
    } catch (requestError) {
      message.error(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function openDetailModal(
    record: FacilityService,
  ) {
    setSelectedService(undefined);
    setDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const detail = await getFacilityService(record.id);

      setSelectedService(detail);
    } catch (requestError) {
      message.error(getErrorMessage(requestError));
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSubmit(
    values: FacilityServiceFormValues,
  ) {
    setSubmitting(true);

    try {
      const payload = {
        facilityId: values.facilityId.trim(),
        serviceId: values.serviceId.trim(),
        price: Number(values.price).toFixed(2),
        durationMinutes: Number(values.durationMinutes),
        status: values.status,
      };

      if (
        formMode === "edit" &&
        selectedService
      ) {
        await updateFacilityService(
          selectedService.id,
          payload,
        );

        message.success(
          "Cập nhật dịch vụ cơ sở thành công",
        );
      } else {
        await createFacilityService(payload);

        message.success(
          "Gán dịch vụ cho cơ sở thành công",
        );
      }

      setFormModalOpen(false);
      setSelectedService(undefined);

      await reload();
    } catch (requestError) {
      message.error(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(
    record: FacilityService,
  ) {
    Modal.confirm({
      centered: true,
      title: "Xóa dịch vụ khỏi cơ sở?",
      content: (
        <div>
          Bạn đang xóa dịch vụ{" "}
          <strong>{record.serviceName}</strong>{" "}
          khỏi cơ sở{" "}
          <strong>{record.facilityName}</strong>.
        </div>
      ),
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          const result =
            await deleteFacilityService(record.id);

          message.success(
            result.message ||
              "Xóa dịch vụ cơ sở thành công",
          );

          if (items.length === 1 && page > 1) {
            setPage((currentPage) => currentPage - 1);
          } else {
            await reload();
          }
        } catch (requestError) {
          message.error(getErrorMessage(requestError));
          throw requestError;
        }
      },
    });
  }

  function handlePageChange(
    nextPage: number,
    nextPageSize: number,
  ) {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }

    setPage(nextPage);
  }

  return (
    /**
     * Không đặt permissions={["user.view"]} ở đây.
     *
     * "user.view" là quyền quản lý user, không phải facility service.
     * Nếu backend có quyền chính xác, ví dụ:
     * permissions={["facility_service.view"]}
     * thì mới thêm lại.
     */
    <AdminLayout>
      <PageHeader
        title="Dịch vụ theo cơ sở"
        description="Quản lý giá, thời lượng và trạng thái dịch vụ tại từng cơ sở."
      />

      <div className="mt-6 flex flex-col gap-5">
        <TableFilter
          columns={[
            {
              field: "search",
              label: "Tìm mã, tên hoặc mô tả dịch vụ",
              type: "text",
              contains: true,
            },
            {
              field: "facilityId",
              label: "ID cơ sở",
              type: "text",
              width: 160,
            },
            {
              field: "serviceId",
              label: "ID dịch vụ",
              type: "text",
              width: 160,
            },
            {
              field: "serviceType",
              label: "Loại dịch vụ",
              type: "text",
              contains: true,
              width: 180,
            },
            {
              field: "status",
              label: "Trạng thái",
              type: "select",
              options: statusOptions,
              width: 180,
            },
          ]}
          values={{
            search: filters.search,
            facilityId: filters.facilityId,
            serviceId: filters.serviceId,
            serviceType: filters.serviceType,
            status: filters.status,
          }}
          clearLabel="Xóa bộ lọc"
          onChange={(values) => {
            setFilters({
              search: String(values.search ?? ""),
              facilityId: values.facilityId
                ? String(values.facilityId)
                : undefined,
              serviceId: values.serviceId
                ? String(values.serviceId)
                : undefined,
              serviceType: values.serviceType
                ? String(values.serviceType)
                : undefined,
              status: values.status
                ? (String(
                    values.status,
                  ) as FacilityServiceStatus)
                : undefined,
            });

            setPage(1);
          }}
        />

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(error)}
          </div>
        ) : null}

        <Card
          className="overflow-hidden border-slate-200 bg-white"
          styles={{
            body: {
              padding: 0,
            },
          }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                Danh sách dịch vụ cơ sở
              </p>

              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Tổng cộng {total} bản ghi.
              </p>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={openCreateModal}
            >
              Gán dịch vụ
            </Button>
          }
        >
          <FacilityServicesTable
            data={items}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={handlePageChange}
            onView={openDetailModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        </Card>
      </div>

      <FacilityServiceFormModal
        open={formModalOpen}
        mode={formMode}
        initialData={selectedService}
        submitting={submitting}
        onCancel={() => {
          setFormModalOpen(false);
          setSelectedService(undefined);
        }}
        onSubmit={handleSubmit}
      />

      <FacilityServiceDetailModal
        open={detailModalOpen}
        loading={detailLoading}
        data={selectedService}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedService(undefined);
        }}
      />
    </AdminLayout>
  );
}