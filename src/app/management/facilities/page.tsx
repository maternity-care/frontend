"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { Building2, Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { AdminLayout } from "@/management/components/layouts/AdminLayout";
import { PageHeader } from "@/management/components/ui/PageHeader";
import {
  createFacility,
  deleteFacilities,
  deleteFacility,
  getFacilities,
} from "@/management/features/facilities/facilities.api";
import type {
  Facility,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import {
  FacilityFormModal,
  type FacilityFormValues,
} from "./components/FacilityFormModal";
import { FacilityDetailModal } from "./components/FacilityDetailModal";
import { FacilityUpdateModal } from "./components/FacilityUpdateModal";

const { Text } = Typography;
const FACILITY_MESSAGES = RESPONSE_MESSAGES.FACILITY_MANAGEMENT;

const PAGE_SIZE = 5;

type DeleteConfirmState =
  | {
      open: false;
    }
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
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string | undefined>();
  const [serviceFilter, setServiceFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<
    FacilityStatus | undefined
  >();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);
  const [updateFacilityTarget, setUpdateFacilityTarget] =
    useState<Facility | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
  });
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFacilities() {
      setLoading(true);
      setError(null);

      try {
        const data = await getFacilities();

        if (mounted) {
          setFacilities(data);
        }
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadFacilities();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredFacilities = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return facilities.filter((facility) => {
      const matchKeyword =
        !keyword ||
        facility.name.toLowerCase().includes(keyword) ||
        facility.address.toLowerCase().includes(keyword) ||
        (facility.code ?? "").toLowerCase().includes(keyword);

      const matchCity = !cityFilter || facility.city === cityFilter;

      const matchService =
        !serviceFilter ||
        facility.featuredServices
          .toLowerCase()
          .includes(serviceFilter.toLowerCase());

      const matchStatus = !statusFilter || facility.status === statusFilter;

      return matchKeyword && matchCity && matchService && matchStatus;
    });
  }, [facilities, query, cityFilter, serviceFilter, statusFilter]);

  const activeFacilities = facilities.filter(
    (facility) => facility.status === "active",
  ).length;

  const suspendedFacilities = facilities.filter(
    (facility) => facility.status === "suspended",
  ).length;

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(facilities.map((facility) => facility.city).filter(Boolean)),
    ).map((city) => ({
      value: city,
      label: city,
    }));
  }, [facilities]);

  const serviceOptions = [
    {
      value: FACILITY_MESSAGES.SERVICES.ANTENATAL_CARE,
      label: FACILITY_MESSAGES.SERVICES.ANTENATAL_CARE,
    },
    {
      value: FACILITY_MESSAGES.SERVICES.ULTRASOUND,
      label: FACILITY_MESSAGES.SERVICES.ULTRASOUND,
    },
    {
      value: FACILITY_MESSAGES.SERVICES.TESTING,
      label: FACILITY_MESSAGES.SERVICES.TESTING,
    },
    {
      value: FACILITY_MESSAGES.SERVICES.CONSULTING,
      label: FACILITY_MESSAGES.SERVICES.CONSULTING,
    },
  ];

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

  function clearFilters() {
    setQuery("");
    setCityFilter(undefined);
    setServiceFilter(undefined);
    setStatusFilter(undefined);
    setCurrentPage(1);
  }

  async function handleCreateFacility(values: FacilityFormValues) {
    setError(null);

    try {
      const workingHours =
        values.openTime && values.closeTime
          ? `${values.openTime}-${values.closeTime}`
          : FACILITY_MESSAGES.NOT_UPDATED;

      const response = await createFacility({
        name: values.name,
        code: values.code.trim().toUpperCase(),
        hotline: values.hotline,
        email: values.email,
        address: values.address,
        city: values.city,
        district: values.district,
        ward: values.ward,
        latitude: values.latitude,
        longitude: values.longitude,
        workingDays: values.workingDays,
        openTime: values.openTime,
        closeTime: values.closeTime,
        workingHours,
        featuredServices: values.description || FACILITY_MESSAGES.NOT_UPDATED,
        description: values.description,
        internalNote: values.internalNote,
        status: values.status,
      });

      const createdFacility: Facility = {
        ...response.data,
        workingHours,
        featuredServices: values.description || FACILITY_MESSAGES.NOT_UPDATED,
      };

      setFacilities((current) => [createdFacility, ...current]);
      setCurrentPage(1);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
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

  async function handleDeleteFacility(facilityId: string) {
    setTableLoading(true);
    setError(null);

    try {
      await deleteFacility(facilityId);

      setFacilities((current) =>
        current.filter((facility) => facility.id !== facilityId),
      );

      setSelectedFacilityIds((current) =>
        current.filter((id) => id !== facilityId),
      );

      setDetailFacility((current) =>
        current?.id === facilityId ? null : current,
      );

      setUpdateFacilityTarget((current) =>
        current?.id === facilityId ? null : current,
      );

      setCurrentPage(1);

      Modal.success({
        title: FACILITY_MESSAGES.DELETE_SUCCESS_TITLE,
        content: FACILITY_MESSAGES.DELETE_SINGLE_SUCCESS_CONTENT,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      Modal.error({
        title: FACILITY_MESSAGES.DELETE_ERROR_TITLE,
        content: message,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });

      throw err;
    } finally {
      setTableLoading(false);
    }
  }

  async function handleDeleteSelected(ids: string[]) {
    if (ids.length === 0) return;

    setTableLoading(true);
    setError(null);

    try {
      await deleteFacilities(ids);

      setFacilities((current) =>
        current.filter((facility) => !ids.includes(facility.id)),
      );

      setDetailFacility((current) =>
        current && ids.includes(current.id) ? null : current,
      );

      setUpdateFacilityTarget((current) =>
        current && ids.includes(current.id) ? null : current,
      );

      setSelectedFacilityIds([]);
      setCurrentPage(1);

      Modal.success({
        title: FACILITY_MESSAGES.DELETE_SUCCESS_TITLE,
        content: FACILITY_MESSAGES.DELETE_SELECTED_SUCCESS_CONTENT,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);

      Modal.error({
        title: FACILITY_MESSAGES.DELETE_ERROR_TITLE,
        content: message,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });

      throw err;
    } finally {
      setTableLoading(false);
    }
  }

  function confirmDeleteFacility(record: Facility) {
    setDeleteConfirm({
      open: true,
      mode: "single",
      facility: record,
    });
  }

  function confirmDeleteSelected() {
    if (selectedFacilityIds.length === 0) return;

    setDeleteConfirm({
      open: true,
      mode: "selected",
      ids: selectedFacilityIds,
      count: selectedFacilityIds.length,
    });
  }

  function closeDeleteConfirm() {
    if (deleteConfirmLoading) return;

    setDeleteConfirm({
      open: false,
    });
  }

  async function handleConfirmDelete() {
    const target = deleteConfirm;

    if (!target.open) return;

    setDeleteConfirmLoading(true);

    try {
      if (target.mode === "single") {
        await handleDeleteFacility(target.facility.id);
      } else {
        await handleDeleteSelected(target.ids);
      }

      setDeleteConfirm({
        open: false,
      });
    } finally {
      setDeleteConfirmLoading(false);
    }
  }

  const columns: ColumnsType<Facility> = [
    {
      title: FACILITY_MESSAGES.STT,
      width: 64,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: FACILITY_MESSAGES.FACILITY_NAME,
      dataIndex: "name",
      width: 210,
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
      title: FACILITY_MESSAGES.ADDRESS,
      dataIndex: "address",
      render: (address: string, record) => (
        <span className="whitespace-normal break-words text-slate-600">
          {[address, record.ward, record.district, record.city]
            .filter(Boolean)
            .join(", ")}
        </span>
      ),
    },
    {
      title: FACILITY_MESSAGES.HOTLINE,
      dataIndex: "hotline",
      width: 140,
      align: "center",
      render: (hotline: string) => (
        <span className="text-slate-600">{hotline}</span>
      ),
    },
    {
      title: FACILITY_MESSAGES.WORKING_HOURS,
      dataIndex: "workingHours",
      width: 130,
      align: "center",
      render: (workingHours: string) => (
        <span className="text-slate-600">{workingHours}</span>
      ),
    },
    {
      title: FACILITY_MESSAGES.FEATURED_SERVICES,
      dataIndex: "featuredServices",
      render: (featuredServices: string) => (
        <span className="whitespace-normal break-words text-slate-600">
          {featuredServices}
        </span>
      ),
    },
    {
      title: FACILITY_MESSAGES.STATUS,
      dataIndex: "status",
      width: 140,
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

          <Button
            danger
            title={FACILITY_MESSAGES.DELETE}
            icon={<Trash2 className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              confirmDeleteFacility(record);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout roles={["super_admin", "admin"]} permissions={["user.view"]}>
      <PageHeader
        title={FACILITY_MESSAGES.PAGE_TITLE}
        description={FACILITY_MESSAGES.PAGE_DESCRIPTION}
      />

      <div className="mt-6 space-y-5">
        {error ? (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() => setError(null)}
          />
        ) : null}

        <Card className="border-slate-200 bg-white">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px_170px_auto]">
            <Input
              size="large"
              allowClear
              value={query}
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder={FACILITY_MESSAGES.SEARCH_PLACEHOLDER}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
            />

            <Select
              size="large"
              allowClear
              value={cityFilter}
              placeholder={FACILITY_MESSAGES.CITY_PLACEHOLDER}
              onChange={(value) => {
                setCityFilter(value);
                setCurrentPage(1);
              }}
              options={cityOptions}
            />

            <Select
              size="large"
              allowClear
              value={serviceFilter}
              placeholder={FACILITY_MESSAGES.SERVICE_PLACEHOLDER}
              onChange={(value) => {
                setServiceFilter(value);
                setCurrentPage(1);
              }}
              options={serviceOptions}
            />

            <Select
              size="large"
              allowClear
              value={statusFilter}
              placeholder={FACILITY_MESSAGES.STATUS_PLACEHOLDER}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              options={statusOptions}
            />

            <Button size="large" onClick={clearFilters}>
              {FACILITY_MESSAGES.CLEAR_FILTERS}
            </Button>
          </div>
        </Card>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title={
                <span className="text-slate-500">
                  {FACILITY_MESSAGES.TOTAL_FACILITIES}
                </span>
              }
              value={facilities.length}
              formatter={(value) => (
                <span className="text-slate-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title={
                <span className="text-emerald-700">
                  {FACILITY_MESSAGES.ACTIVE_FACILITIES}
                </span>
              }
              value={activeFacilities}
              formatter={(value) => (
                <span className="text-emerald-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title={
                <span className="text-red-700">
                  {FACILITY_MESSAGES.SUSPENDED_FACILITIES}
                </span>
              }
              value={suspendedFacilities}
              formatter={(value) => (
                <span className="text-red-950">{value}</span>
              )}
            />
          </Card>
        </div>

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
                {FACILITY_MESSAGES.FACILITY_LIST_TITLE}
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                {FACILITY_MESSAGES.FACILITY_LIST_DESCRIPTION}
              </p>
            </div>
          }
          extra={
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
          }
        >
          <Table
            rowKey="id"
            size="middle"
            tableLayout="fixed"
            loading={loading || tableLoading}
            columns={columns}
            dataSource={filteredFacilities}
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
            rowSelection={{
              selectedRowKeys: selectedFacilityIds,
              onChange: (selectedRowKeys) => {
                setSelectedFacilityIds(selectedRowKeys.map(String));
              },
            }}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total: filteredFacilities.length,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `${FACILITY_MESSAGES.PAGINATION_TOTAL_PREFIX} ${range[0]} - ${range[1]} ${FACILITY_MESSAGES.PAGINATION_TOTAL_MIDDLE} ${total} ${FACILITY_MESSAGES.PAGINATION_TOTAL_SUFFIX}`,
              onChange: (page) => setCurrentPage(page),
            }}
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
        width={456}
        title={null}
        footer={null}
        closable={false}
        onCancel={closeDeleteConfirm}
        mask={{ closable: !deleteConfirmLoading }}
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
            aria-label={RESPONSE_MESSAGES.COMMON.CLOSE}
            onClick={closeDeleteConfirm}
            disabled={deleteConfirmLoading}
            className="absolute right-1 top-1 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
