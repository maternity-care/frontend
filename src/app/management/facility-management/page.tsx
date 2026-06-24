"use client";

import { useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Button,
  Card,
  Input,
  Popconfirm,
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
  FacilityFormModal,
  type FacilityFormValues,
} from "./components/FacilityFormModal";

const { Text } = Typography;

type FacilityStatus = "active" | "suspended";

type Facility = {
  id: string;
  name: string;
  address: string;
  city: string;
  hotline: string;
  workingHours: string;
  featuredServices: string;
  status: FacilityStatus;
};

const initialFacilities: Facility[] = [
  {
    id: "1",
    name: "Cơ sở Quận 1",
    address: "12 Nguyễn Huệ, Q1",
    city: "TP. Hồ Chí Minh",
    hotline: "028 1234 5678",
    workingHours: "07:30-17:00",
    featuredServices: "Khám thai, Siêu âm",
    status: "active",
  },
  {
    id: "2",
    name: "Cơ sở Quận 7",
    address: "45 Nguyễn Văn Linh",
    city: "TP. Hồ Chí Minh",
    hotline: "028 8765 4321",
    workingHours: "08:00-18:00",
    featuredServices: "Xét nghiệm, Tư vấn",
    status: "active",
  },
  {
    id: "3",
    name: "Cơ sở Thủ Đức",
    address: "88 Võ Văn Ngân",
    city: "TP. Hồ Chí Minh",
    hotline: "028 2468 1357",
    workingHours: "07:30-16:30",
    featuredServices: "Khám thai",
    status: "suspended",
  },
  {
    id: "4",
    name: "Cơ sở Cần Thơ",
    address: "22 Nguyễn Trãi, Ninh Kiều",
    city: "Cần Thơ",
    hotline: "0292 1111 222",
    workingHours: "07:00-17:00",
    featuredServices: "Siêu âm, Tư vấn",
    status: "active",
  },
  {
    id: "5",
    name: "Cơ sở Đà Nẵng",
    address: "15 Hải Phòng, Hải Châu",
    city: "Đà Nẵng",
    hotline: "0236 3333 444",
    workingHours: "08:00-17:30",
    featuredServices: "Khám thai, Xét nghiệm",
    status: "active",
  },
  {
    id: "6",
    name: "Cơ sở Hà Nội",
    address: "30 Kim Mã, Ba Đình",
    city: "Hà Nội",
    hotline: "024 5555 666",
    workingHours: "07:30-17:30",
    featuredServices: "Khám thai, Siêu âm",
    status: "suspended",
  },
];

const PAGE_SIZE = 5;

export default function FacilityManagementPage() {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string | undefined>();
  const [serviceFilter, setServiceFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<
    FacilityStatus | undefined
  >();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  function handleDeleteSelected() {
    if (selectedFacilityIds.length === 0) return;

    setFacilities((current) =>
      current.filter((facility) => !selectedFacilityIds.includes(facility.id)),
    );
    setSelectedFacilityIds([]);
    setCurrentPage(1);
  }

  function handleDeleteFacility(facilityId: string) {
    setFacilities((current) =>
      current.filter((facility) => facility.id !== facilityId),
    );
    setSelectedFacilityIds((current) =>
      current.filter((id) => id !== facilityId),
    );
    setCurrentPage(1);
  }

  function handleCreateFacility(values: FacilityFormValues) {
    const workingHours =
      values.openTime && values.closeTime
        ? `${values.openTime}-${values.closeTime}`
        : "Chưa cập nhật";

    const newFacility: Facility = {
      id: crypto.randomUUID(),
      name: values.name,
      address: values.address,
      city: values.city,
      hotline: values.hotline,
      workingHours,
      featuredServices: values.description || "Chưa cập nhật",
      status: values.status,
    };

    setFacilities((current) => [newFacility, ...current]);
    setCurrentPage(1);
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

          <Popconfirm
            title="Xóa cơ sở"
            description="Bạn có chắc muốn xóa cơ sở này không?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteFacility(record.id)}
          >
            <Button danger title="Xóa" icon={<Trash2 className="h-4 w-4" />} />
          </Popconfirm>
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
              <Popconfirm
                title="Xóa cơ sở đã chọn"
                description={`Bạn có chắc muốn xóa ${selectedFacilityIds.length} cơ sở đã chọn không?`}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                disabled={selectedFacilityIds.length === 0}
                onConfirm={handleDeleteSelected}
              >
                <Button
                  danger
                  disabled={selectedFacilityIds.length === 0}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Xóa đã chọn
                  {selectedFacilityIds.length > 0
                    ? ` (${selectedFacilityIds.length})`
                    : ""}
                </Button>
              </Popconfirm>

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
    </AdminLayout>
  );
}
