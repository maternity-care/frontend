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
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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

const { Text } = Typography;

const PAGE_SIZE = 5;

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
  const [deleteTarget, setDeleteTarget] = useState<Facility | null>(null);
  const [deleteSelectedModalOpen, setDeleteSelectedModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getFacilities()
      .then((data) => {
        if (!mounted) return;
        setFacilities(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Không tải được danh sách cơ sở",
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

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
        facility.address.toLowerCase().includes(keyword);

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

  function clearFilters() {
    setQuery("");
    setCityFilter(undefined);
    setServiceFilter(undefined);
    setStatusFilter(undefined);
    setCurrentPage(1);
  }

  async function handleDeleteSelected() {
    if (selectedFacilityIds.length === 0) return;

    setTableLoading(true);
    setError(null);

    try {
      await deleteFacilities(selectedFacilityIds);
      setFacilities((current) =>
        current.filter(
          (facility) => !selectedFacilityIds.includes(facility.id),
        ),
      );
      setSelectedFacilityIds([]);
      setCurrentPage(1);
      setDeleteSelectedModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể xóa các cơ sở đã chọn",
      );
    } finally {
      setTableLoading(false);
    }
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
      setCurrentPage(1);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa cơ sở");
    } finally {
      setTableLoading(false);
    }
  }

  async function handleCreateFacility(values: FacilityFormValues) {
    const workingHours =
      values.openTime && values.closeTime
        ? `${values.openTime}-${values.closeTime}`
        : "Chưa cập nhật";

    setTableLoading(true);
    setError(null);

    try {
      const response = await createFacility({
        name: values.name,
        address: values.address,
        city: values.city,
        district: values.district,
        hotline: values.hotline,
        email: values.email,
        workingDays: values.workingDays,
        openTime: values.openTime,
        closeTime: values.closeTime,
        workingHours,
        featuredServices: values.description || "Chưa cập nhật",
        description: values.description,
        internalNote: values.internalNote,
        status: values.status,
        code: values.code,
        ward: values.ward,
      });

      setFacilities((current) => [response.data, ...current]);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm cơ sở");
    } finally {
      setTableLoading(false);
    }
  }

  const columns: ColumnsType<Facility> = [
    {
      title: "STT",
      width: 64,
      align: "center",
      render: (_value, _record, index) =>
        (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: "Tên cơ sở",
      dataIndex: "name",
      width: 210,
      render: (name: string) => (
        <Space size={10}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <Text strong className="whitespace-normal break-words">
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      render: (address: string) => (
        <span className="whitespace-normal break-words text-slate-600">
          {address}
        </span>
      ),
    },
    {
      title: "Hotline",
      dataIndex: "hotline",
      width: 140,
      align: "center",
      render: (hotline: string) => (
        <span className="text-slate-600">{hotline}</span>
      ),
    },
    {
      title: "Giờ hoạt động",
      dataIndex: "workingHours",
      width: 130,
      align: "center",
      render: (workingHours: string) => (
        <span className="text-slate-600">{workingHours}</span>
      ),
    },
    {
      title: "Dịch vụ nổi bật",
      dataIndex: "featuredServices",
      render: (featuredServices: string) => (
        <span className="whitespace-normal break-words text-slate-600">
          {featuredServices}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      align: "center",
      render: (status: FacilityStatus) =>
        status === "active" ? (
          <Tag color="green">Đang hoạt động</Tag>
        ) : (
          <Tag color="default">Tạm ngưng</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_value, record) => (
        <Space size={8}>
          <Button title="Sửa" icon={<Pencil className="h-4 w-4" />} />

          <Button
            danger
            title="Xóa"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setDeleteTarget(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout permissions={["user.view"]}>
      <PageHeader
        title="Facility Management"
        description="Quản lý danh sách cơ sở khám trong hệ thống."
      />

      <div className="mt-6 space-y-5">
        {error ? <Alert type="error" title={error} showIcon /> : null}

        <Card className="border-slate-200 bg-white">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px_170px_auto]">
            <Input
              size="large"
              allowClear
              value={query}
              prefix={<Search className="h-4 w-4 text-slate-400" />}
              placeholder="Tìm theo tên/địa chỉ"
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
            />

            <Select
              size="large"
              allowClear
              value={cityFilter}
              placeholder="Tỉnh/Thành phố"
              onChange={(value) => {
                setCityFilter(value);
                setCurrentPage(1);
              }}
              options={[
                { value: "TP. Hồ Chí Minh", label: "TP. Hồ Chí Minh" },
                { value: "Cần Thơ", label: "Cần Thơ" },
                { value: "Đà Nẵng", label: "Đà Nẵng" },
                { value: "Hà Nội", label: "Hà Nội" },
              ]}
            />

            <Select
              size="large"
              allowClear
              value={serviceFilter}
              placeholder="Dịch vụ"
              onChange={(value) => {
                setServiceFilter(value);
                setCurrentPage(1);
              }}
              options={[
                { value: "Khám thai", label: "Khám thai" },
                { value: "Siêu âm", label: "Siêu âm" },
                { value: "Xét nghiệm", label: "Xét nghiệm" },
                { value: "Tư vấn", label: "Tư vấn" },
              ]}
            />

            <Select
              size="large"
              allowClear
              value={statusFilter}
              placeholder="Trạng thái"
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              options={[
                { value: "active", label: "Đang hoạt động" },
                { value: "suspended", label: "Tạm ngưng" },
              ]}
            />

            <Button size="large" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </Card>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <Statistic
              title={<span className="text-slate-500">Tổng cơ sở</span>}
              value={facilities.length}
              formatter={(value) => (
                <span className="text-slate-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <Statistic
              title={<span className="text-emerald-700">Đang hoạt động</span>}
              value={activeFacilities}
              formatter={(value) => (
                <span className="text-emerald-950">{value}</span>
              )}
            />
          </Card>

          <Card className="border-red-100 bg-red-50/60">
            <Statistic
              title={<span className="text-red-700">Tạm ngưng</span>}
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
                Danh sách cơ sở khám
              </p>
              <p className="mb-0 mt-1 text-sm font-normal text-slate-500">
                Theo dõi địa chỉ, hotline, giờ hoạt động và dịch vụ nổi bật của
                từng cơ sở.
              </p>
            </div>
          }
          extra={
            <Space wrap>
              <Button
                danger
                disabled={selectedFacilityIds.length === 0}
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => setDeleteSelectedModalOpen(true)}
              >
                Xóa đã chọn
                {selectedFacilityIds.length > 0
                  ? ` (${selectedFacilityIds.length})`
                  : ""}
              </Button>

              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateModalOpen(true)}
              >
                Thêm cơ sở
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
                `Hiển thị ${range[0]} - ${range[1]} trong tổng ${total} cơ sở`,
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

      <Modal
        title="Xác nhận xóa"
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        mask={{ closable: !tableLoading }}
        footer={[
          <Button
            key="cancel"
            disabled={tableLoading}
            onClick={() => setDeleteTarget(null)}
          >
            Hủy
          </Button>,
          <Button
            key="delete"
            danger
            type="primary"
            loading={tableLoading}
            onClick={() => {
              if (deleteTarget) void handleDeleteFacility(deleteTarget.id);
            }}
          >
            Xóa
          </Button>,
        ]}
      >
        <p className="mb-0">
          Bạn có chắc chắn muốn xóa cơ sở{" "}
          <Text strong>{deleteTarget?.name}</Text> không?
        </p>
      </Modal>

      <Modal
        title="Xác nhận xóa"
        open={deleteSelectedModalOpen}
        onCancel={() => setDeleteSelectedModalOpen(false)}
        mask={{ closable: !tableLoading }}
        footer={[
          <Button
            key="cancel"
            disabled={tableLoading}
            onClick={() => setDeleteSelectedModalOpen(false)}
          >
            Hủy
          </Button>,
          <Button
            key="delete"
            danger
            type="primary"
            loading={tableLoading}
            onClick={() => void handleDeleteSelected()}
          >
            Xóa
          </Button>,
        ]}
      >
        <p className="mb-0">
          Bạn có chắc chắn muốn xóa {selectedFacilityIds.length} cơ sở đã chọn
          không?
        </p>
      </Modal>
    </AdminLayout>
  );
}