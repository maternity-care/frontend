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
  deleteFacilityService,
  getFacilityService,
  updateFacilityService,
} from "@/management/features/services/services.api";

import type {
  CreateFacilityServiceInput,
  FacilityService,
  FacilityServiceStatus,
  GetFacilityServicesParams,
  ServiceType,
} from "@/management/features/services/services.types";

import {
  facilityServiceStatusOptions,
  getErrorMessage,
  serviceTypeOptions,
} from "./services.ui";
import { useServiceOptions } from "@/hooks/services/useServiceOptions";
import { useFacilityServices } from "@/hooks/services/useFacilityServices";
import { FacilityServiceFormModal, FacilityServiceFormValues } from "./facility-services/FacilityServiceFormModal";
import { FacilityServicesTable } from "./facility-services/FacilityServicesTable";
import { FacilityServiceDetailModal } from "./facility-services/FacilityServiceDetailModal";

interface Filters extends TableFilterValues {
  search: string;
  facilityId?: string;
  serviceId?: string;
  serviceType?: ServiceType;
  status?: FacilityServiceStatus;
}

export function FacilityServicesTab() {
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
    useState<FacilityService>();

  const [submitting, setSubmitting] =
    useState(false);

  const [detailOpen, setDetailOpen] =
    useState(false);

  const [detail, setDetail] =
    useState<FacilityService>();

  const [
    detailLoading,
    setDetailLoading,
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
    useMemo<GetFacilityServicesParams>(
      () => ({
        search:
          filters.search.trim() ||
          undefined,
        facilityId:
          filters.facilityId,
        serviceId:
          filters.serviceId,
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
  } = useFacilityServices(queryParams);

  async function handleSubmit(
    values: FacilityServiceFormValues,
  ) {
    setSubmitting(true);

    const payload: CreateFacilityServiceInput =
      {
        facilityId:
          values.facilityId,
        serviceId:
          values.serviceId,
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
        formMode === "edit" &&
        editing
      ) {
        await updateFacilityService(
          editing.id,
          payload,
        );

        messageApi.success(
          "Cập nhật thành công",
        );
      } else {
        await createFacilityService(
          payload,
        );

        messageApi.success(
          "Gán dịch vụ thành công",
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
              label: "Cơ sở",
              type: "select",
              options:
                facilityOptions,
              width: 250,
            },
            {
              field: "serviceId",
              label: "Dịch vụ",
              type: "select",
              options:
                serviceOptions,
              width: 260,
            },
            {
              field: "serviceType",
              label: "Loại",
              type: "select",
              options:
                serviceTypeOptions,
              width: 180,
            },
            {
              field: "status",
              label: "Trạng thái",
              type: "select",
              options:
                facilityServiceStatusOptions,
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
              status:
                values.status
                  ? (String(
                      values.status,
                    ) as FacilityServiceStatus)
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
                Dịch vụ theo cơ sở
              </p>

              <p className="mb-0 text-sm font-normal text-slate-500">
                Tổng cộng {total} bản ghi
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
            onView={async (record) => {
              setDetailOpen(true);
              setDetailLoading(true);

              try {
                setDetail(
                  await getFacilityService(
                    record.id,
                  ),
                );
              } finally {
                setDetailLoading(
                  false,
                );
              }
            }}
            onEdit={async (record) => {
              setEditing(
                await getFacilityService(
                  record.id,
                ),
              );
              setFormMode("edit");
              setFormOpen(true);
            }}
            onDelete={(record) => {
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
                    "Xóa thành công",
                  );

                  await reload();
                },
              });
            }}
          />
        </Card>
      </div>

      <FacilityServiceFormModal
        open={formOpen}
        mode={formMode}
        initialData={editing}
        facilities={facilities}
        services={services}
        optionsLoading={
          optionsLoading
        }
        submitting={submitting}
        onCancel={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        onSubmit={handleSubmit}
      />

      <FacilityServiceDetailModal
        open={detailOpen}
        loading={detailLoading}
        data={detail}
        onClose={() => {
          setDetailOpen(false);
          setDetail(undefined);
        }}
      />
    </>
  );
}