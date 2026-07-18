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

import { Plus } from "lucide-react";

import {
   TableFilter,
  type TableFilterValues,
} from "@/management/components/ui/TableFilter";

import {
  createFacilityService,
  createService,
  deleteFacilityService,
  deleteService,
  getFacilityServicesPage,
  getService,
  updateFacilityService,
  updateService,
} from "@/management/features/services/services.api";

import type {
  CreateFacilityServiceInput,
  CreateServiceInput,
  FacilityService,
  GetServicesParams,
  Service,
  ServiceStatus,
  ServiceType,
} from "@/management/features/services/services.types";

import {
  getErrorMessage,
  serviceStatusOptions,
  serviceTypeOptions,
} from "./services.ui";
import { useServiceOptions } from "@/hooks/services/useServiceOptions";
import { useFilteredServices } from "@/hooks/services/useFilteredServices";
import { ServiceFormModal, ServiceFormValues } from "./services/ServiceFormModal";
import { FacilityServiceFormModal, FacilityServiceFormValues } from "./facility-services/FacilityServiceFormModal";
import { ServicesTable } from "./services/ServicesTable";
import { ServiceDetailModal } from "./services/ServiceDetailModal";

interface Filters extends TableFilterValues {
  search: string;
  serviceType?: ServiceType;
  status?: ServiceStatus;
  facilityId?: string;
}

export function ServiceCatalogTab() {
  const [
    messageApi,
    messageContextHolder,
  ] = message.useMessage();

  const [
    modalApi,
    modalContextHolder,
  ] = Modal.useModal();

  const [filters, setFilters] =
    useState<Filters>({
      search: "",
    });

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(20);

  const [formOpen, setFormOpen] =
    useState(false);

  const [formMode, setFormMode] =
    useState<"create" | "edit">(
      "create",
    );

  const [editing, setEditing] =
    useState<Service>();

  const [submitting, setSubmitting] =
    useState(false);

  const [detailOpen, setDetailOpen] =
    useState(false);

  const [selected, setSelected] =
    useState<Service>();

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    assignments,
    setAssignments,
  ] = useState<FacilityService[]>([]);

  const [
    assignmentsLoading,
    setAssignmentsLoading,
  ] = useState(false);

  const [
    assignmentFormOpen,
    setAssignmentFormOpen,
  ] = useState(false);

  const [
    assignmentMode,
    setAssignmentMode,
  ] = useState<"create" | "edit">(
    "create",
  );

  const [
    editingAssignment,
    setEditingAssignment,
  ] = useState<FacilityService>();

  const [
    assignmentSubmitting,
    setAssignmentSubmitting,
  ] = useState(false);

  const {
    facilities,
    services: serviceOptions,
    loading: optionsLoading,
    error: optionsError,
    reload: reloadOptions,
  } = useServiceOptions();

  const facilityOptions =
    useMemo(
      () =>
        facilities.map(
          (facility) => ({
            value: facility.id,
            label: `${facility.name} (${facility.code})`,
          }),
        ),
      [facilities],
    );

  const queryParams =
    useMemo<GetServicesParams>(
      () => ({
        search:
          filters.search.trim() ||
          undefined,
        serviceType:
          filters.serviceType,
        status: filters.status,
        page,
        limit: pageSize,
      }),
      [
        filters,
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
  } = useFilteredServices(
    queryParams,
    {
      facilityId:
        filters.facilityId,
    },
  );

  async function loadAssignments(
    serviceId: string,
  ) {
    setAssignmentsLoading(true);

    try {
      const result =
        await getFacilityServicesPage({
          serviceId,
          page: 1,
          limit: 100,
        });

      setAssignments(
        result.facilityServices,
      );
    } finally {
      setAssignmentsLoading(false);
    }
  }

  async function openDetail(
    record: Service,
  ) {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelected(undefined);
    setAssignments([]);

    try {
      const [detail, assignmentResult] =
        await Promise.all([
          getService(record.id),
          getFacilityServicesPage({
            serviceId: record.id,
            page: 1,
            limit: 100,
          }),
        ]);

      setSelected(detail);

      setAssignments(
        assignmentResult.facilityServices,
      );
    } catch (requestError) {
      messageApi.error(
        getErrorMessage(requestError),
      );

      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSubmit(
    values: ServiceFormValues,
  ) {
    setSubmitting(true);

    const payload: CreateServiceInput = {
      code: values.code.trim(),
      name: values.name.trim(),
      description:
        values.description?.trim() ||
        undefined,
      serviceType:
        values.serviceType,
      defaultDurationMinutes:
        Number(
          values.defaultDurationMinutes,
        ),
      basePrice:
        Number(
          values.basePrice,
        ).toFixed(2),
      requiresDoctorWarning:
        values.requiresDoctorWarning,
      status: values.status,
    };

    try {
      if (
        formMode === "edit" &&
        editing
      ) {
        const updated =
          await updateService(
            editing.id,
            payload,
          );

        if (
          selected?.id === updated.id
        ) {
          setSelected(updated);
        }

        messageApi.success(
          "Cập nhật dịch vụ thành công",
        );
      } else {
        await createService(payload);

        messageApi.success(
          "Tạo dịch vụ thành công",
        );
      }

      setFormOpen(false);
      setEditing(undefined);

      await Promise.all([
        reload(),
        reloadOptions(),
      ]);
    } catch (requestError) {
      messageApi.error(
        getErrorMessage(requestError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(
    record: Service,
  ) {
    modalApi.confirm({
      centered: true,
      title: "Xóa dịch vụ?",
      content: (
        <>
          Xóa dịch vụ{" "}
          <strong>{record.name}</strong>
          ? Backend có thể từ chối nếu
          dịch vụ đang được sử dụng.
        </>
      ),
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          const result =
            await deleteService(
              record.id,
            );

          messageApi.success(
            result.message ||
              "Xóa dịch vụ thành công",
          );

          await Promise.all([
            reload(),
            reloadOptions(),
          ]);
        } catch (requestError) {
          messageApi.error(
            getErrorMessage(
              requestError,
            ),
          );

          throw requestError;
        }
      },
    });
  }

  async function handleAssignmentSubmit(
    values: FacilityServiceFormValues,
  ) {
    if (!selected) {
      return;
    }

    setAssignmentSubmitting(true);

    const payload: CreateFacilityServiceInput =
      {
        facilityId:
          values.facilityId,
        serviceId: selected.id,
        price: Number(
          values.price,
        ).toFixed(2),
        durationMinutes: Number(
          values.durationMinutes,
        ),
        status: values.status,
      };

    try {
      if (
        assignmentMode ===
          "edit" &&
        editingAssignment
      ) {
        await updateFacilityService(
          editingAssignment.id,
          payload,
        );

        messageApi.success(
          "Cập nhật cơ sở cung cấp thành công",
        );
      } else {
        await createFacilityService(
          payload,
        );

        messageApi.success(
          "Gán dịch vụ vào cơ sở thành công",
        );
      }

      setAssignmentFormOpen(false);
      setEditingAssignment(
        undefined,
      );

      await loadAssignments(
        selected.id,
      );
    } catch (requestError) {
      messageApi.error(
        getErrorMessage(requestError),
      );
    } finally {
      setAssignmentSubmitting(false);
    }
  }

  function deleteAssignment(
    record: FacilityService,
  ) {
    modalApi.confirm({
      centered: true,
      title:
        "Xóa dịch vụ khỏi cơ sở?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        await deleteFacilityService(
          record.id,
        );

        messageApi.success(
          "Xóa khỏi cơ sở thành công",
        );

        if (selected) {
          await loadAssignments(
            selected.id,
          );
        }
      },
    });
  }

  return (
    <>
      {messageContextHolder}
      {modalContextHolder}

      <div className="flex flex-col gap-5">
        <TableFilter
          columns={[
            {
              field: "search",
              label:
                "Tìm mã, tên hoặc mô tả",
              type: "text",
              contains: true,
            },
            {
              field: "facilityId",
              label:
                "Cơ sở đang cung cấp",
              type: "select",
              options:
                facilityOptions,
              width: 250,
            },
            {
              field: "serviceType",
              label: "Loại dịch vụ",
              type: "select",
              options:
                serviceTypeOptions,
              width: 190,
            },
            {
              field: "status",
              label: "Trạng thái",
              type: "select",
              options:
                serviceStatusOptions,
              width: 180,
            },
          ]}
          values={filters}
          clearLabel="Xóa bộ lọc"
          onChange={(values) => {
            setFilters({
              search: String(
                values.search ?? "",
              ),
              facilityId:
                values.facilityId
                  ? String(
                      values.facilityId,
                    )
                  : undefined,
              serviceType:
                values.serviceType
                  ? (String(
                      values.serviceType,
                    ) as ServiceType)
                  : undefined,
              status:
                values.status
                  ? (String(
                      values.status,
                    ) as ServiceStatus)
                  : undefined,
            });

            setPage(1);
          }}
        />

        {error || optionsError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {getErrorMessage(
              error || optionsError,
            )}
          </div>
        ) : null}

        <Card
          styles={{
            body: {
              padding: 0,
            },
          }}
          title={
            <div>
              <p className="mb-0 font-semibold">
                Danh mục dịch vụ
              </p>

              <p className="mb-0 text-sm font-normal text-slate-500">
                Tổng cộng {total} dịch vụ
              </p>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={
                <Plus className="h-4 w-4" />
              }
              onClick={() => {
                setEditing(undefined);
                setFormMode("create");
                setFormOpen(true);
              }}
            >
              Tạo dịch vụ
            </Button>
          }
        >
          <ServicesTable
            data={items}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(
              nextPage,
              nextPageSize,
            ) => {
              if (
                nextPageSize !==
                pageSize
              ) {
                setPageSize(
                  nextPageSize,
                );
                setPage(1);
                return;
              }

              setPage(nextPage);
            }}
            onView={openDetail}
            onEdit={(record) => {
              setEditing(record);
              setFormMode("edit");
              setFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        </Card>
      </div>

      <ServiceFormModal
        open={formOpen}
        mode={formMode}
        initialData={editing}
        submitting={submitting}
        onCancel={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        onSubmit={handleSubmit}
      />

      <ServiceDetailModal
        open={detailOpen}
        loading={detailLoading}
        data={selected}
        assignments={assignments}
        assignmentsLoading={
          assignmentsLoading
        }
        onClose={() => {
          setDetailOpen(false);
          setSelected(undefined);
          setAssignments([]);
        }}
        onAddFacility={() => {
          setEditingAssignment(
            undefined,
          );
          setAssignmentMode(
            "create",
          );
          setAssignmentFormOpen(
            true,
          );
        }}
        onEditFacility={(record) => {
          setEditingAssignment(
            record,
          );
          setAssignmentMode("edit");
          setAssignmentFormOpen(
            true,
          );
        }}
        onDeleteFacility={
          deleteAssignment
        }
      />

      <FacilityServiceFormModal
        open={assignmentFormOpen}
        mode={assignmentMode}
        initialData={
          editingAssignment
        }
        fixedService={selected}
        facilities={facilities}
        services={serviceOptions}
        optionsLoading={
          optionsLoading
        }
        submitting={
          assignmentSubmitting
        }
        onCancel={() => {
          setAssignmentFormOpen(
            false,
          );
          setEditingAssignment(
            undefined,
          );
        }}
        onSubmit={
          handleAssignmentSubmit
        }
      />
    </>
  );
}