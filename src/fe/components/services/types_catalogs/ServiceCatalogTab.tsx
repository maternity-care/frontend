"use client";

import {
  Button,
  Card,
  Flex,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import type { ColumnsType } from "antd/es/table";

import { Edit, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ServiceFormModal } from "./ServiceFormModal";
import {
  ManagementService,
  ServiceSaleMode,
  ServiceStatus,
} from "@/management/features/services/services/services.types";
import { ManagementServiceTypeLookupItem } from "@/management/features/services/service-types/service-types.types";
import { getManagementServiceTypesLookup } from "@/management/features/services/service-types/service-types.api";
import {
  deleteManagementService,
  getManagementServices,
} from "@/management/features/services/services/services.api";

const { Text, Title } = Typography;

const SALE_MODE_LABELS: Record<ServiceSaleMode, string> = {
  standalone: "Bán lẻ",
  package_only: "Chỉ trong gói",
  both: "Bán lẻ và trong gói",
};

function formatCurrency(value: string | number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ServiceCatalogTab() {
  const [messageApi, contextHolder] = message.useMessage();

  const [services, setServices] = useState<ManagementService[]>([]);

  const [serviceTypes, setServiceTypes] = useState<
    ManagementServiceTypeLookupItem[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [serviceTypeId, setServiceTypeId] = useState<string>();

  const [saleMode, setSaleMode] = useState<ServiceSaleMode>();

  const [status, setStatus] = useState<ServiceStatus>();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);

  const [selectedService, setSelectedService] =
    useState<ManagementService | null>(null);

  const loadServiceTypes = useCallback(async () => {
    try {
      const result = await getManagementServiceTypesLookup({
        status: "active",
        page: 1,
        limit: 100,
      });

      setServiceTypes(result);
    } catch {
      setServiceTypes([]);
      messageApi.error("Không thể tải danh sách loại dịch vụ.");
    }
  }, [messageApi]);

  const loadServices = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getManagementServices({
        search: search || undefined,
        serviceTypeId,
        saleMode,
        status,
        page,
        limit: pageSize,
      });

      setServices(result.items);
      setTotal(result.total);
    } catch {
      setServices([]);
      setTotal(0);
      messageApi.error("Không thể tải danh sách dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, [messageApi, page, pageSize, saleMode, search, serviceTypeId, status]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadServiceTypes();
    });
  }, [loadServiceTypes]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadServices();
    });
  }, [loadServices]);

  const serviceTypeNameMap = useMemo(
    () => new Map(serviceTypes.map((item) => [item.id, item.name])),
    [serviceTypes],
  );

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setServiceTypeId(undefined);
    setSaleMode(undefined);
    setStatus(undefined);
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedService(null);
    setFormOpen(true);
  };

  const handleEdit = (service: ManagementService) => {
    setSelectedService(service);
    setFormOpen(true);
  };

  const handleDelete = async (service: ManagementService) => {
    setDeletingId(service.id);

    try {
      await deleteManagementService(service.id);

      messageApi.success("Đã xử lý xóa dịch vụ thành công.");

      if (services.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadServices();
      }
    } catch {
      messageApi.error(
        "Không thể xóa dịch vụ. Dịch vụ có thể đang được sử dụng.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<ManagementService> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Mã dịch vụ",
      dataIndex: "code",
      width: 180,
      render: (value: string) => <Text code>{value || "—"}</Text>,
    },
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      width: 260,
      render: (value: string, record) => (
        <Flex vertical gap={2}>
          <Text strong>{value}</Text>

          {record.description && (
            <Text
              type="secondary"
              ellipsis={{
                tooltip: record.description,
              }}
              style={{ maxWidth: 280 }}
            >
              {record.description}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      title: "Loại dịch vụ",
      dataIndex: "serviceTypeId",
      width: 190,
      render: (value: string, record) =>
        record.serviceType?.name ?? serviceTypeNameMap.get(value) ?? "—",
    },
    {
      title: "Hình thức bán",
      dataIndex: "saleMode",
      width: 190,
      render: (value: ServiceSaleMode) => {
        const color =
          value === "standalone"
            ? "blue"
            : value === "package_only"
              ? "purple"
              : "cyan";

        return <Tag color={color}>{SALE_MODE_LABELS[value]}</Tag>;
      },
    },
    {
      title: "Giá cơ bản",
      dataIndex: "basePrice",
      width: 160,
      align: "right",
      render: formatCurrency,
    },
    {
      title: "Thời lượng",
      dataIndex: "defaultDurationMinutes",
      width: 125,
      align: "center",
      render: (value: number) => (value ? `${value} phút` : "—"),
    },
    {
      title: "Yêu cầu bác sĩ",
      dataIndex: "requiresDoctorWarning",
      width: 145,
      align: "center",
      render: (value: boolean) =>
        value ? <Tag color="orange">Có</Tag> : <Tag>Không</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      align: "center",
      render: (value: ServiceStatus) => (
        <Tag color={value === "active" ? "green" : "default"}>
          {value === "active" ? "Hoạt động" : "Ngừng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 110,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit size={17} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Xóa dịch vụ?"
            description="Nếu dịch vụ đã được sử dụng, backend có thể chuyển dịch vụ sang trạng thái ngừng hoạt động."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              danger: true,
              loading: deletingId === record.id,
            }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Xóa">
              <Button
                danger
                type="text"
                disabled={deletingId === record.id}
                icon={<Trash2 size={17} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <Card>
        <Flex
          justify="space-between"
          align="center"
          wrap
          gap={16}
          style={{ marginBottom: 20 }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Danh mục dịch vụ
            </Title>

            <Text type="secondary">Quản lý các dịch vụ lẻ trong hệ thống.</Text>
          </div>

          <Button
            type="primary"
            icon={<Plus size={17} />}
            onClick={handleCreate}
          >
            Thêm dịch vụ
          </Button>
        </Flex>

        <Flex wrap gap={12} style={{ marginBottom: 20 }}>
          <Input
            allowClear
            value={searchInput}
            prefix={<Search size={16} />}
            placeholder="Tìm theo mã, tên hoặc mô tả"
            style={{ width: 300 }}
            onChange={(event) => setSearchInput(event.target.value)}
            onPressEnter={handleSearch}
          />

          <Select
            allowClear
            showSearch
            value={serviceTypeId}
            placeholder="Loại dịch vụ"
            optionFilterProp="label"
            style={{ width: 220 }}
            options={serviceTypes.map((item) => ({
              value: item.id,
              label: `${item.code} - ${item.name}`,
            }))}
            onChange={(value) => {
              setServiceTypeId(value);
              setPage(1);
            }}
          />

          <Select
            allowClear
            value={saleMode}
            placeholder="Hình thức bán"
            style={{ width: 210 }}
            options={[
              {
                value: "standalone",
                label: "Bán lẻ",
              },
              {
                value: "package_only",
                label: "Chỉ trong gói",
              },
              {
                value: "both",
                label: "Bán lẻ và trong gói",
              },
            ]}
            onChange={(value) => {
              setSaleMode(value);
              setPage(1);
            }}
          />

          <Select
            allowClear
            value={status}
            placeholder="Trạng thái"
            style={{ width: 180 }}
            options={[
              {
                value: "active",
                label: "Hoạt động",
              },
              {
                value: "inactive",
                label: "Ngừng hoạt động",
              },
            ]}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />

          <Button type="primary" onClick={handleSearch}>
            Tìm kiếm
          </Button>

          <Button icon={<RefreshCw size={16} />} onClick={handleResetFilters}>
            Đặt lại
          </Button>
        </Flex>

        <Table<ManagementService>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={services}
          scroll={{ x: 1550 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (value) => `Tổng ${value} dịch vụ`,
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPage(1);
                setPageSize(nextPageSize);
                return;
              }

              setPage(nextPage);
            },
          }}
        />
      </Card>

      <ServiceFormModal
        open={formOpen}
        service={selectedService}
        serviceTypes={serviceTypes}
        onCancel={() => {
          setFormOpen(false);
          setSelectedService(null);
        }}
        onSuccess={async () => {
          setFormOpen(false);
          setSelectedService(null);
          await loadServices();
        }}
      />
    </>
  );
}
