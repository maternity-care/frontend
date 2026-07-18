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
  createMaternityPackage,
  createPackageService,
  deleteMaternityPackage,
  deletePackageService,
  getMaternityPackage,
  getPackageServicesPage,
  updateMaternityPackage,
  updatePackageService,
} from "@/management/features/services/services.api";

import type {
  AllowedFacilityScope,
  CreateMaternityPackageInput,
  CreatePackageServiceInput,
  GetMaternityPackagesParams,
  MaternityPackage,
  MaternityPackageStatus,
  PackageService,
  ServiceType,
} from "@/management/features/services/services.types";

import {
  getErrorMessage,
  maternityPackageStatusOptions,
  packageScopeOptions,
  serviceTypeOptions,
} from "./services.ui";
import { useServiceOptions } from "@/hooks/services/useServiceOptions";
import { useFilteredMaternityPackages } from "@/hooks/services/useFilteredMaternityPackages";
import { MaternityPackageFormModal, MaternityPackageFormValues } from "./maternity-packages/MaternityPackageFormModal";
import { PackageServiceFormModal, PackageServiceFormValues } from "./maternity-packages/PackageServiceFormModal";
import { MaternityPackagesTable } from "./maternity-packages/MaternityPackagesTable";
import { MaternityPackageDetailModal } from "./maternity-packages/MaternityPackageDetailModal";

interface Filters extends TableFilterValues {
  search: string;
  status?: MaternityPackageStatus;
  serviceSearch?: string;
  serviceId?: string;
  serviceType?: ServiceType;
  facilityId?: string;
  allowedFacilityScope?: AllowedFacilityScope;
}

export function MaternityPackagesTab() {
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
    useState<MaternityPackage>();

  const [submitting, setSubmitting] =
    useState(false);

  const [detailOpen, setDetailOpen] =
    useState(false);

  const [selected, setSelected] =
    useState<MaternityPackage>();

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [
    packageServices,
    setPackageServices,
  ] = useState<PackageService[]>([]);

  const [
    packageServicesLoading,
    setPackageServicesLoading,
  ] = useState(false);

  const [
    packageServiceFormOpen,
    setPackageServiceFormOpen,
  ] = useState(false);

  const [
    packageServiceFormMode,
    setPackageServiceFormMode,
  ] = useState<"create" | "edit">(
    "create",
  );

  const [
    editingPackageService,
    setEditingPackageService,
  ] = useState<PackageService>();

  const [
    packageServiceSubmitting,
    setPackageServiceSubmitting,
  ] = useState(false);

  const {
    facilities,
    services,
    loading: optionsLoading,
    error: optionsError,
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

  const serviceOptions =
    useMemo(
      () =>
        services.map(
          (service) => ({
            value: service.id,
            label: `${service.name} (${service.code})`,
          }),
        ),
      [services],
    );

  const queryParams =
    useMemo<GetMaternityPackagesParams>(
      () => ({
        search:
          filters.search.trim() ||
          undefined,
        status: filters.status,
        page,
        limit: pageSize,
      }),
      [
        filters.search,
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
  } = useFilteredMaternityPackages(
    queryParams,
    {
      serviceSearch:
        filters.serviceSearch,
      serviceId: filters.serviceId,
      serviceType:
        filters.serviceType,
      facilityId:
        filters.facilityId,
      allowedFacilityScope:
        filters.allowedFacilityScope,
    },
  );

  async function loadPackageServices(
    packageId: string,
  ) {
    setPackageServicesLoading(true);

    try {
      const result =
        await getPackageServicesPage({
          packageId,
          page: 1,
          limit: 100,
        });

      setPackageServices(
        result.packageServices,
      );
    } finally {
      setPackageServicesLoading(false);
    }
  }

  async function openDetail(
    record: MaternityPackage,
  ) {
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const [detail, relations] =
        await Promise.all([
          getMaternityPackage(record.id),
          getPackageServicesPage({
            packageId: record.id,
            page: 1,
            limit: 100,
          }),
        ]);

      setSelected(detail);
      setPackageServices(
        relations.packageServices,
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

  async function handlePackageSubmit(
    values: MaternityPackageFormValues,
  ) {
    setSubmitting(true);

    const payload: CreateMaternityPackageInput =
      {
        code: values.code.trim(),
        name: values.name.trim(),
        description:
          values.description?.trim() ||
          undefined,
        price: Number(
          values.price,
        ).toFixed(2),
        durationDays:
          values.durationDays ===
          undefined
            ? null
            : Number(
                values.durationDays,
              ),
        priorityLevel: Number(
          values.priorityLevel,
        ),
        status: values.status,
      };

    try {
      if (
        formMode === "edit" &&
        editing
      ) {
        const updated =
          await updateMaternityPackage(
            editing.id,
            payload,
          );

        if (
          selected?.id === updated.id
        ) {
          setSelected(updated);
        }

        messageApi.success(
          "Cập nhật gói thành công",
        );
      } else {
        await createMaternityPackage(
          payload,
        );

        messageApi.success(
          "Tạo gói thành công",
        );
      }

      setFormOpen(false);
      setEditing(undefined);
      await reload();
    } catch (requestError) {
      messageApi.error(
        getErrorMessage(requestError),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePackageServiceSubmit(
    values: PackageServiceFormValues,
  ) {
    if (!selected) {
      return;
    }

    setPackageServiceSubmitting(true);

    const payload: CreatePackageServiceInput =
      {
        packageId: selected.id,
        serviceId:
          values.serviceId,
        includedQuantity: Number(
          values.includedQuantity,
        ),
        isRequired:
          values.requirement ===
          "required",
        isOptional:
          values.requirement ===
          "optional",
        allowedFacilityScope:
          values.allowedFacilityScope,
        facilityIds:
          values.allowedFacilityScope ===
          "selected"
            ? values.facilityIds
            : [],
      };

    try {
      if (
        packageServiceFormMode ===
          "edit" &&
        editingPackageService
      ) {
        await updatePackageService(
          editingPackageService.id,
          payload,
        );

        messageApi.success(
          "Cập nhật dịch vụ trong gói thành công",
        );
      } else {
        await createPackageService(
          payload,
        );

        messageApi.success(
          "Thêm dịch vụ vào gói thành công",
        );
      }

      setPackageServiceFormOpen(
        false,
      );

      setEditingPackageService(
        undefined,
      );

      await loadPackageServices(
        selected.id,
      );
    } catch (requestError) {
      messageApi.error(
        getErrorMessage(requestError),
      );
    } finally {
      setPackageServiceSubmitting(false);
    }
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
                "Tìm mã, tên hoặc mô tả gói",
              type: "text",
              contains: true,
            },
            {
              field: "serviceSearch",
              label:
                "Tìm dịch vụ trong gói",
              type: "text",
              contains: true,
              width: 220,
            },
            {
              field: "serviceId",
              label:
                "Dịch vụ trong gói",
              type: "select",
              options:
                serviceOptions,
              width: 270,
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
              field: "facilityId",
              label: "Cơ sở áp dụng",
              type: "select",
              options:
                facilityOptions,
              width: 250,
            },
            {
              field:
                "allowedFacilityScope",
              label: "Phạm vi",
              type: "select",
              options:
                packageScopeOptions,
              width: 180,
            },
            {
              field: "status",
              label: "Trạng thái",
              type: "select",
              options:
                maternityPackageStatusOptions,
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
              serviceSearch:
                values.serviceSearch
                  ? String(
                      values.serviceSearch,
                    )
                  : undefined,
              serviceId:
                values.serviceId
                  ? String(
                      values.serviceId,
                    )
                  : undefined,
              serviceType:
                values.serviceType
                  ? (String(
                      values.serviceType,
                    ) as ServiceType)
                  : undefined,
              facilityId:
                values.facilityId
                  ? String(
                      values.facilityId,
                    )
                  : undefined,
              allowedFacilityScope:
                values.allowedFacilityScope
                  ? (String(
                      values.allowedFacilityScope,
                    ) as AllowedFacilityScope)
                  : undefined,
              status:
                values.status
                  ? (String(
                      values.status,
                    ) as MaternityPackageStatus)
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
                Danh sách gói dịch vụ
              </p>

              <p className="mb-0 text-sm font-normal text-slate-500">
                Tổng cộng {total} gói
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
              Tạo gói dịch vụ
            </Button>
          }
        >
          <MaternityPackagesTable
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
            onDelete={(record) => {
              modalApi.confirm({
                centered: true,
                title:
                  "Xóa gói dịch vụ?",
                okText: "Xóa",
                cancelText: "Hủy",
                okButtonProps: {
                  danger: true,
                },
                async onOk() {
                  const result =
                    await deleteMaternityPackage(
                      record.id,
                    );

                  messageApi.success(
                    result.message ||
                      "Xóa gói thành công",
                  );

                  await reload();
                },
              });
            }}
          />
        </Card>
      </div>

      <MaternityPackageFormModal
        open={formOpen}
        mode={formMode}
        initialData={editing}
        submitting={submitting}
        onCancel={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        onSubmit={
          handlePackageSubmit
        }
      />

      <MaternityPackageDetailModal
        open={detailOpen}
        loading={detailLoading}
        data={selected}
        packageServices={
          packageServices
        }
        packageServicesLoading={
          packageServicesLoading
        }
        facilities={facilities}
        onClose={() => {
          setDetailOpen(false);
          setSelected(undefined);
          setPackageServices([]);
        }}
        onAddService={() => {
          setEditingPackageService(
            undefined,
          );
          setPackageServiceFormMode(
            "create",
          );
          setPackageServiceFormOpen(
            true,
          );
        }}
        onEditService={(record) => {
          setEditingPackageService(
            record,
          );
          setPackageServiceFormMode(
            "edit",
          );
          setPackageServiceFormOpen(
            true,
          );
        }}
        onDeleteService={(record) => {
          modalApi.confirm({
            centered: true,
            title:
              "Xóa dịch vụ khỏi gói?",
            okText: "Xóa",
            cancelText: "Hủy",
            okButtonProps: {
              danger: true,
            },
            async onOk() {
              await deletePackageService(
                record.id,
              );

              messageApi.success(
                "Xóa dịch vụ khỏi gói thành công",
              );

              if (selected) {
                await loadPackageServices(
                  selected.id,
                );
              }
            },
          });
        }}
      />

      <PackageServiceFormModal
        open={
          packageServiceFormOpen
        }
        mode={
          packageServiceFormMode
        }
        initialData={
          editingPackageService
        }
        services={services}
        facilities={facilities}
        optionsLoading={
          optionsLoading
        }
        submitting={
          packageServiceSubmitting
        }
        onCancel={() => {
          setPackageServiceFormOpen(
            false,
          );
          setEditingPackageService(
            undefined,
          );
        }}
        onSubmit={
          handlePackageServiceSubmit
        }
      />
    </>
  );
}