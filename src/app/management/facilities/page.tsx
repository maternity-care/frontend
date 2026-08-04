"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { Building2, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { useAuthStore } from "@/features/auth/auth.store";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { CopyText } from "@/management/components/ui/CopyText";
import { PageHeader } from "@/management/components/ui/PageHeader";
import { TableFilter } from "@/management/components/ui/TableFilter";
import {
  createFacility,
  deleteFacilities,
  deleteFacility,
  getFacilitiesPage,
} from "@/management/features/facilities/facilities.api";
import type {
  Facility,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import { FacilityDetailModal } from "./components/FacilityDetailModal";
import {
  FacilityFormModal,
  type FacilityFormValues,
} from "./components/FacilityFormModal";
import { FacilityUpdateModal } from "./components/FacilityUpdateModal";

const { Text } = Typography;
const { TextArea } = Input;
const FACILITY_MESSAGES = RESPONSE_MESSAGES.FACILITY_MANAGEMENT;

type DeleteConfirmState =
  | { open: false }
  | {
      open: true;
      mode: "single";
      facility: Facility;
    }
  | {
      open: true;
      mode: "selected";
      ids: string[];
      count: number;
    };

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    if (err.message.includes("Facility code already exists")) {
      return FACILITY_MESSAGES.FACILITY_CODE_EXISTS;
    }

    if (err.message.includes("Validation failed")) {
      return FACILITY_MESSAGES.VALIDATION_FAILED;
    }

    return err.message;
  }

  return FACILITY_MESSAGES.DEFAULT_ERROR;
}

function getFacilityStatusText(status: FacilityStatus) {
  return status === "active"
    ? FACILITY_MESSAGES.ACTIVE_DISPLAY
    : FACILITY_MESSAGES.SUSPENDED;
}

export default function FacilityManagementPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  const isSuperAdmin = useAuthStore((state) =>
    state.roles.includes("super_admin"),
  );

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalFacilities, setTotalFacilities] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<
    FacilityStatus | undefined
  >();
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);
  const [updateFacilityTarget, setUpdateFacilityTarget] =
    useState<Facility | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteReasonTouched, setDeleteReasonTouched] = useState(false);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadFacilities = useCallback(
    async (page = currentPage, limit = pageSize) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getFacilitiesPage({
          search: query,
          city: cityFilter,
          status: statusFilter,
          page,
          limit,
        });

        setFacilities(result.items);
        setTotalFacilities(result.total);
        setTotalPages(result.totalPages);
        setCurrentPage(result.page);
        setPageSize(result.limit);
        setSelectedFacilityIds((current) =>
          current.filter((id) =>
            result.items.some((facility) => facility.id === id),
          ),
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [
      cityFilter,
      currentPage,
      pageSize,
      query,
      statusFilter,
    ],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reloadFacilities();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [reloadFacilities]);

  const activeFacilities = facilities.filter(
    (facility) => facility.status === "active",
  ).length;

  const suspendedFacilities = facilities.filter(
    (facility) => facility.status === "suspended",
  ).length;

  const openFacilities = facilities.filter(
    (facility) => facility.isOpenNow,
  ).length;

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(facilities.map((facility) => facility.city).filter(Boolean)),
    ).map((city) => ({ value: city, label: city }));
  }, [facilities]);

  const statusOptions = [
    {
      value: "active",
      label: FACILITY_MESSAGES.ACTIVE_DISPLAY,
    },
    {
      value: "suspended",
      label: FACILITY_MESSAGES.SUSPENDED,
    },
  ];

  async function handleCreateFacility(values: FacilityFormValues) {
    setError(null);

    try {
      await createFacility({
        name: values.name,
        ownerId: values.ownerId,
        hotline: values.hotline,
        email: values.email,
        schedules: values.schedules,
        address: values.address,
        city: values.city,
        ward: values.ward,
        latitude: values.latitude,
        longitude: values.longitude,
        status: values.status,
      });

      setCurrentPage(1);
      await reloadFacilities(1, pageSize);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }

  function handleFacilityUpdated(updatedFacility: Facility) {
    setFacilities((current) =>
      current.map((facility) =>
        facility.id === updatedFacility.id ? updatedFacility : facility,
      ),
    );

    setDetailFacility((current) =>
      current?.id === updatedFacility.id ? updatedFacility : current,
    );
  }

  function confirmDeleteFacility(record: Facility) {
    setDeleteReason("");
    setDeleteReasonTouched(false);
    setDeleteConfirm({
      open: true,
      mode: "single",
      facility: record,
    });
  }

  function confirmDeleteSelected() {
    if (selectedFacilityIds.length === 0) return;

    setDeleteReason("");
    setDeleteReasonTouched(false);
    setDeleteConfirm({
      open: true,
      mode: "selected",
      ids: selectedFacilityIds,
      count: selectedFacilityIds.length,
    });
  }

  function closeDeleteConfirm() {
    if (deleteConfirmLoading) return;

    setDeleteConfirm({ open: false });
    setDeleteReason("");
    setDeleteReasonTouched(false);
  }

  async function handleConfirmDelete() {
    const target = deleteConfirm;
    const reason = deleteReason.trim();

    if (!target.open) return;

    if (!reason) {
      setDeleteReasonTouched(true);
      return;
    }

    setDeleteConfirmLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const deletedCount =
        target.mode === "single" ? 1 : target.ids.length;

      if (target.mode === "single") {
        await deleteFacility(target.facility.id, reason);

        setDetailFacility((current) =>
          current?.id === target.facility.id ? null : current,
        );
        setUpdateFacilityTarget((current) =>
          current?.id === target.facility.id ? null : current,
        );
      } else {
        await deleteFacilities(target.ids, reason);

        setDetailFacility((current) =>
          current && target.ids.includes(current.id) ? null : current,
        );
        setUpdateFacilityTarget((current) =>
          current && target.ids.includes(current.id) ? null : current,
        );
      }

      const remainingTotal = Math.max(
        0,
        totalFacilities - deletedCount,
      );
      const lastAvailablePage = Math.max(
        1,
        Math.ceil(remainingTotal / pageSize),
      );
      const nextPage = Math.min(currentPage, lastAvailablePage);

      setSelectedFacilityIds([]);
      setCurrentPage(nextPage);
      setDeleteConfirm({ open: false });
      setDeleteReason("");
      setDeleteReasonTouched(false);

      await reloadFacilities(nextPage, pageSize);

      modal.success({
        title: FACILITY_MESSAGES.DELETE_SUCCESS_TITLE,
        content:
          target.mode === "single"
            ? FACILITY_MESSAGES.DELETE_SINGLE_SUCCESS_CONTENT
            : FACILITY_MESSAGES.DELETE_SELECTED_SUCCESS_CONTENT,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      modal.error({
        title: FACILITY_MESSAGES.DELETE_ERROR_TITLE,
        content: message,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } finally {
      setDeleteConfirmLoading(false);
      setTableLoading(false);
    }
  }

  const columns: ColumnsType<Facility> = [
    {
      title: FACILITY_MESSAGES.STT,
      width: 64,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: FACILITY_MESSAGES.FACILITY_NAME,
      dataIndex: "name",
      width: 220,
      render: (name: string, record) => (
        <Space size={10}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <Text strong className="block whitespace-normal break-words">
              {name}
            </Text>
            <Text type="secondary" className="text-xs">
              {record.code}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Chủ cơ sở",
      dataIndex: "ownerName",
      width: 180,
      render: (ownerName: string, record) => (
        <div>
          <div className="font-medium text-slate-900">{ownerName}</div>
          <div className="text-xs text-slate-500">ID: {record.ownerId}</div>
          {record.ownerPhone ? (
            <div className="text-xs text-slate-500">{record.ownerPhone}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: FACILITY_MESSAGES.ADDRESS,
      dataIndex: "address",
      width: 260,
      render: (address: string, record) => (
        <span className="whitespace-normal break-words text-slate-600">
          {[address, record.ward, record.city].filter(Boolean).join(", ")}
        </span>
      ),
    },
    {
      title: FACILITY_MESSAGES.HOTLINE,
      dataIndex: "hotline",
      width: 140,
      align: "center",
      render: (hotline: string) => (
        <CopyText value={hotline} copiedMessage="Đã sao chép hotline" />
      ),
    },
    {
      title: "Giờ hoạt động",
      dataIndex: "operatingHourGroups",
      width: 230,
      render: (_value, record) => (
        <div className="space-y-1">
          {record.operatingHourGroups.length > 0 ? (
            record.operatingHourGroups.map((group) => (
              <div key={group.days.join("-")} className="text-xs">
                <span className="font-medium text-slate-800">
                  {group.dayLabel}:
                </span>{" "}
                <span className="text-slate-600">{group.displayTime}</span>
              </div>
            ))
          ) : (
            <span className="text-slate-400">Chưa cập nhật</span>
          )}
        </div>
      ),
    },
    {
      title: "Hiện tại",
      dataIndex: "operatingStatus",
      width: 150,
      align: "center",
      render: (_value, record) => (
        <Tag color={record.isOpenNow ? "green" : "orange"}>
          {record.operatingStatusLabel}
        </Tag>
      ),
    },
    {
      title: FACILITY_MESSAGES.STATUS,
      dataIndex: "status",
      width: 130,
      align: "center",
      render: (status: FacilityStatus) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {getFacilityStatusText(status)}
        </Tag>
      ),
    },
    {
      title: FACILITY_MESSAGES.ACTIONS,
      key: "actions",
      width: 160,
      fixed: "right",
      align: "center",
      render: (_value, record) => (
        <Space size={8}>
          <Button
            title={FACILITY_MESSAGES.VIEW_DETAIL}
            icon={<Eye className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              setDetailFacility(record);
            }}
          />
          <Button
            title={FACILITY_MESSAGES.EDIT}
            icon={<Pencil className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              setUpdateFacilityTarget(record);
            }}
          />
          {isSuperAdmin ? (
            <Button
              danger
              title={FACILITY_MESSAGES.DELETE}
              icon={<Trash2 className="h-4 w-4" />}
              onClick={(event) => {
                event.stopPropagation();
                confirmDeleteFacility(record);
              }}
            />
          ) : null}
        </Space>
      ),
    },
  ];

  const deleteReasonError =
    deleteReasonTouched && deleteReason.trim().length === 0;

  return (
    <AdminLayout roles={["super_admin", "admin"]} permissions={["user.view"]}>
      {modalContextHolder}
      <PageHeader
        title={FACILITY_MESSAGES.PAGE_TITLE}
        description={FACILITY_MESSAGES.PAGE_DESCRIPTION}
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

        <div className="order-2">
          <TableFilter
            columns={[
              {
                field: "name",
                label: FACILITY_MESSAGES.SEARCH_PLACEHOLDER,
                type: "text",
                contains: true,
                width: 370,
              },
              {
                field: "province",
                label: FACILITY_MESSAGES.CITY_PLACEHOLDER,
                type: "select",
                options: cityOptions,
                width: 300,
              },
              {
                field: "status",
                label: FACILITY_MESSAGES.STATUS_PLACEHOLDER,
                type: "select",
                options: statusOptions,
                width: 300,
              },
            ]}
            values={{
              name: query,
              province: cityFilter,
              status: statusFilter,
            }}
            clearLabel={FACILITY_MESSAGES.CLEAR_FILTERS}
            onChange={(values) => {
              setCurrentPage(1);
              setSelectedFacilityIds([]);
              setQuery(String(values.name ?? ""));
              setCityFilter(
                values.province ? String(values.province) : undefined,
              );
              setStatusFilter(values.status as FacilityStatus | undefined);
            }}
          />
        </div>

        <div className="order-1 grid gap-4 md:grid-cols-4">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title={FACILITY_MESSAGES.TOTAL_FACILITIES}
              value={totalFacilities}
            />
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title={`${FACILITY_MESSAGES.ACTIVE_FACILITIES} (trang hiện tại)`}
              value={activeFacilities}
            />
          </Card>
          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title={`${FACILITY_MESSAGES.SUSPENDED_FACILITIES} (trang hiện tại)`}
              value={suspendedFacilities}
            />
          </Card>
          <Card className="border-blue-100 bg-blue-50/60">
            <Statistic
              title="Đang mở cửa (trang hiện tại)"
              value={openFacilities}
            />
          </Card>
        </div>

        <Card
          className="order-3 overflow-hidden border-slate-200 bg-white"
          styles={{ body: { padding: 0 } }}
          title={
            <div>
              <p className="mb-0 text-base font-semibold text-slate-950">
                {FACILITY_MESSAGES.FACILITY_LIST_TITLE}
              </p>
            </div>
          }
          extra={
            isSuperAdmin ? (
              <Space wrap>
                <Button
                  danger
                  disabled={selectedFacilityIds.length === 0}
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={confirmDeleteSelected}
                >
                  {FACILITY_MESSAGES.DELETE_SELECTED}
                  {selectedFacilityIds.length > 0
                    ? ` (${selectedFacilityIds.length})`
                    : ""}
                </Button>
                <Button
                  type="primary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  {FACILITY_MESSAGES.ADD_FACILITY}
                </Button>
              </Space>
            ) : null
          }
        >
          <Table
            className="management-table"
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading || tableLoading}
            columns={columns}
            dataSource={facilities}
            scroll={{ x: 1500 }}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalFacilities,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total} cơ sở`,
              onChange: (page, nextPageSize) => {
                setSelectedFacilityIds([]);

                if (nextPageSize !== pageSize) {
                  setPageSize(nextPageSize);
                  setCurrentPage(1);
                  return;
                }

                setCurrentPage(page);
              },
            }}
            onRow={(record) => ({
              className: "cursor-pointer",
              onClick: (event) => {
                const target = event.target as HTMLElement;

                if (
                  target.closest("button") ||
                  target.closest("a") ||
                  target.closest(".ant-checkbox") ||
                  target.closest(".ant-checkbox-wrapper")
                ) {
                  return;
                }

                setDetailFacility(record);
              },
            })}
            rowSelection={
              isSuperAdmin
                ? {
                    selectedRowKeys: selectedFacilityIds,
                    onChange: (selectedRowKeys) => {
                      setSelectedFacilityIds(selectedRowKeys.map(String));
                    },
                  }
                : undefined
            }
          />
        </Card>
      </div>

      <FacilityFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateFacility}
      />

      <FacilityDetailModal
        open={Boolean(detailFacility)}
        facility={detailFacility}
        onClose={() => setDetailFacility(null)}
      />

      <FacilityUpdateModal
        open={Boolean(updateFacilityTarget)}
        facility={updateFacilityTarget}
        onClose={() => setUpdateFacilityTarget(null)}
        onUpdated={handleFacilityUpdated}
      />

      <Modal
        open={deleteConfirm.open}
        centered
        width={480}
        title={null}
        footer={null}
        closable={false}
        onCancel={closeDeleteConfirm}
        mask={{ closable: !deleteConfirmLoading }}
      >
        <div className="relative px-2 pb-2 pt-3 text-center">
          <button
            type="button"
            aria-label={RESPONSE_MESSAGES.COMMON.CLOSE}
            onClick={closeDeleteConfirm}
            disabled={deleteConfirmLoading}
            className="absolute right-0 top-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-7 w-7 text-red-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">
            {deleteConfirm.open && deleteConfirm.mode === "selected"
              ? FACILITY_MESSAGES.DELETE_SELECTED_FACILITIES
              : FACILITY_MESSAGES.DELETE_FACILITY}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {deleteConfirm.open && deleteConfirm.mode === "selected"
              ? `${FACILITY_MESSAGES.DELETE_SELECTED_CONFIRM_PREFIX} ${deleteConfirm.count} ${FACILITY_MESSAGES.DELETE_SELECTED_CONFIRM_SUFFIX}`
              : FACILITY_MESSAGES.DELETE_SINGLE_CONFIRM}
          </p>

          {deleteConfirm.open && deleteConfirm.mode === "single" ? (
            <p className="mx-auto mt-2 max-w-[340px] truncate text-sm font-semibold text-slate-800">
              {deleteConfirm.facility.name}
            </p>
          ) : null}

          <div className="mt-5 text-left">
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Lý do xóa <span className="text-red-500">*</span>
            </label>
            <TextArea
              rows={3}
              value={deleteReason}
              status={deleteReasonError ? "error" : undefined}
              disabled={deleteConfirmLoading}
              placeholder="Nhập lý do xóa cơ sở"
              onChange={(event) => {
                setDeleteReason(event.target.value);
                if (event.target.value.trim()) setDeleteReasonTouched(false);
              }}
            />
            {deleteReasonError ? (
              <p className="mt-1 text-xs text-red-500">
                Vui lòng nhập lý do xóa cơ sở.
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={closeDeleteConfirm}
              disabled={deleteConfirmLoading}
              className="h-11 rounded-lg font-semibold"
            >
              {RESPONSE_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button
              danger
              type="primary"
              size="large"
              loading={deleteConfirmLoading}
              onClick={handleConfirmDelete}
              className="h-11 rounded-lg font-semibold"
            >
              {RESPONSE_MESSAGES.COMMON.DELETE}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}