"use client";

import {
  Button,
  Card,
  Flex,
  message,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Edit, Eye} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useStaffFacilityId } from "@/hooks/useStaffFacilityId";
import { getManagementFacilityServices } from "@/management/features/services/facility-services/facility-services.api";
import type { ManagementFacilityService } from "@/management/features/services/facility-services/facility-services.types";
import { getManagementServiceTypesLookup } from "@/management/features/services/service-types/service-types.api";
import type { ManagementServiceTypeLookupItem } from "@/management/features/services/service-types/service-types.types";
import { getManagementServices } from "@/management/features/services/services/services.api";
import type {
  ManagementService,
  ServiceSaleMode,
  ServiceStatus,
} from "@/management/features/services/services/services.types";
import {
  TableFilter,
  TableFilterColumn,
  TableFilterValues,
} from "@/management/components/ui/TableFilter";
import { ServiceDetailModal } from "../types_catalogs/ServiceDetailModal";
import { FacilityServiceEditModal } from "../types_catalogs/FacilityServiceEditModal";

const { Text, Title } = Typography;

const SALE_MODE_LABELS: Record<ServiceSaleMode, string> = {
  standalone: "Bán lẻ",
  package_only: "Chỉ trong gói",
  both: "Bán lẻ và trong gói",
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  active: "Hoạt động",
  inactive: "Ngừng hoạt động",
};

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ServicesCatalogReadonlyTab() {
  const { facilityId, ready } = useStaffFacilityId();
  const [messageApi, contextHolder] = message.useMessage();

  const [services, setServices] = useState<ManagementService[]>([]);
  const [facilityServices, setFacilityServices] = useState<
    ManagementFacilityService[]
  >([]);
  const [serviceTypes, setServiceTypes] = useState<
    ManagementServiceTypeLookupItem[]
  >([]);
  const [loading, setLoading] = useState(false);

  const [filterValues, setFilterValues] = useState<TableFilterValues>({
    search: undefined,
    serviceTypeId: undefined,
    saleMode: undefined,
    status: undefined,
  });
  const [search, setSearch] = useState<string | undefined>();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<ManagementService | null>(null);

  const facilityServiceMap = useMemo(
    () => new Map(facilityServices.map((item) => [item.serviceId, item])),
    [facilityServices],
  );

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
    }
  }, []);

  const loadFacilityServices = useCallback(async () => {
    if (!facilityId) return;

    try {
      const firstPage = await getManagementFacilityServices({
        facilityId,
        page: 1,
        limit: 100,
      });

      if (firstPage.totalPages <= 1) {
        setFacilityServices(firstPage.items);
        return;
      }

      const restPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
          getManagementFacilityServices({
            facilityId,
            page: index + 2,
            limit: 100,
          }),
        ),
      );

      setFacilityServices([
        ...firstPage.items,
        ...restPages.flatMap((pageData) => pageData.items),
      ]);
    } catch {
      setFacilityServices([]);
    }
  }, [facilityId]);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getManagementServices({
        search: search || undefined,
        serviceTypeId: filterValues.serviceTypeId as string | undefined,
        saleMode: filterValues.saleMode as ServiceSaleMode | undefined,
        status: filterValues.status as ServiceStatus | undefined,
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
  }, [messageApi, page, pageSize, search, filterValues]);

  useEffect(() => {
    queueMicrotask(() => void loadServiceTypes());
  }, [loadServiceTypes]);

  useEffect(() => {
    queueMicrotask(() => void loadServices());
  }, [loadServices]);

  useEffect(() => {
    queueMicrotask(() => void loadFacilityServices());
  }, [loadFacilityServices]);

  const serviceTypeNameMap = useMemo(
    () => new Map(serviceTypes.map((item) => [item.id, item.name])),
    [serviceTypes],
  );

  const filterColumns: TableFilterColumn[] = useMemo(
    () => [
      {
        field: "search",
        label: "Tìm kiếm",
        type: "text",
        width: 300,
        contains: true,
        placeholder: "Tìm theo ID, mã hoặc tên",
      },
      {
        field: "serviceTypeId",
        label: "Loại dịch vụ",
        type: "select",
        width: 220,
        options: serviceTypes.map((item) => ({
          value: item.id,
          label: `${item.code} - ${item.name}`,
        })),
      },
      {
        field: "saleMode",
        label: "Hình thức bán",
        type: "select",
        width: 210,
        options: [
          { value: "standalone", label: "Bán lẻ" },
          { value: "package_only", label: "Chỉ trong gói" },
          { value: "both", label: "Bán lẻ và trong gói" },
        ],
      },
      {
        field: "status",
        label: "Trạng thái",
        type: "select",
        width: 180,
        options: [
          { value: "active", label: "Hoạt động" },
          { value: "inactive", label: "Ngừng hoạt động" },
        ],
      },
    ],
    [serviceTypes],
  );

  const handleFilterChange = (
    nextValues: TableFilterValues,
    nextSearch?: string,
  ) => {
    setFilterValues(nextValues);
    setSearch(nextSearch || undefined);
    setPage(1);
  };

  const openDetail = (service: ManagementService) => {
    setSelectedService(service);
    setDetailOpen(true);
  };

  const openEdit = (service: ManagementService) => {
    setSelectedService(service);
    setEditOpen(true);
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
      width: 150,
      render: (value: string) => <Text code>{value || "-"}</Text>,
    },
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      width: 260,
      render: (value: string, record) => (
        <Flex vertical gap={2}>
          <Text strong>{value}</Text>
          {record.description ? (
            <Text
              type="secondary"
              ellipsis={{ tooltip: record.description }}
              style={{ maxWidth: 280 }}
            >
              {record.description}
            </Text>
          ) : null}
        </Flex>
      ),
    },
    {
      title: "Loại dịch vụ",
      dataIndex: "serviceTypeId",
      width: 180,
      render: (value: string, record) =>
        record.serviceType?.name ?? serviceTypeNameMap.get(value) ?? "-",
    },
    {
      title: "Hình thức bán",
      dataIndex: "saleMode",
      width: 180,
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
      width: 150,
      align: "right",
      render: formatCurrency,
    },
    {
      title: "Giá tại cơ sở",
      key: "facilityPrice",
      width: 170,
      align: "right",
      render: (_, record) => {
        const facilityService = facilityServiceMap.get(record.id);
        return (
          <Flex vertical gap={2} align="flex-end">
            <Text strong>
              {formatCurrency(facilityService?.price ?? record.basePrice)}
            </Text>
            <Tag color={facilityService ? "green" : "default"}>
              {facilityService ? "Đã cấu hình" : "Theo giá cơ bản"}
            </Tag>
          </Flex>
        );
      },
    },
    {
      title: "Thời lượng cơ bản",
      dataIndex: "defaultDurationMinutes",
      width: 150,
      align: "center",
      render: (value: number) => (value ? `${value} phút` : "-"),
    },
    {
      title: "Thời lượng tại cơ sở",
      key: "facilityDuration",
      width: 170,
      align: "center",
      render: (_, record) => {
        const facilityService = facilityServiceMap.get(record.id);
        const duration =
          facilityService?.durationMinutes ?? record.defaultDurationMinutes;
        return (
          <Flex vertical gap={2} align="center">
            <Text>{duration ? `${duration} phút` : "-"}</Text>
            <Tag color={facilityService ? "green" : "default"}>
              {facilityService ? "Đã cấu hình" : "Theo mặc định"}
            </Tag>
          </Flex>
        );
      },
    },
    {
      title: "Trạng thái hệ thống",
      dataIndex: "status",
      width: 150,
      align: "center",
      render: (value: ServiceStatus) => (
        <Tag color={value === "active" ? "green" : "default"}>
          {STATUS_LABELS[value]}
        </Tag>
      ),
    },
    {
      title: "Trạng thái cơ sở",
      key: "facilityStatus",
      width: 150,
      align: "center",
      render: (_, record) => {
        const facilityService = facilityServiceMap.get(record.id);
        if (!facilityService) {
          return (
            <Flex vertical gap={2} align="center">
              <Tag color={record.status === "active" ? "green" : "default"}>
                {STATUS_LABELS[record.status]}
              </Tag>
              <Tag>Theo hệ thống</Tag>
            </Flex>
          );
        }

        return (
          <Tag color={facilityService.status === "active" ? "green" : "default"}>
            {STATUS_LABELS[facilityService.status]}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 110,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Flex gap={4} justify="center">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<Eye size={17} />}
              onClick={() => openDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Cấu hình tại cơ sở">
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
        </Flex>
      ),
    },
  ];

  if (ready && !facilityId) {
    return (
      <Card>
        <Text type="danger">
          Không tìm thấy facilityId của staff. Vui lòng đăng nhập lại.
        </Text>
      </Card>
    );
  }

  return (
    <>
      {contextHolder}

      <div style={{ marginBottom: 20 }}>
        <TableFilter
          columns={filterColumns}
          values={filterValues}
          clearLabel="Đặt lại"
          onChange={handleFilterChange}
        />
      </div>

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
              Danh mục dịch vụ hệ thống
            </Title>
            <Text type="secondary">
              Xem dịch vụ hệ thống và cấu hình giá / thời lượng tại cơ sở.
            </Text>
          </div>
        </Flex>

        <Table<ManagementService>
          rowKey="id"
          loading={loading || !ready}
          columns={columns}
          dataSource={services}
          scroll={{ x: 1700, y: 380 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50, 100],
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

      <ServiceDetailModal
        open={detailOpen}
        service={selectedService}
        serviceTypeName={
          selectedService
            ? serviceTypeNameMap.get(selectedService.serviceTypeId)
            : undefined
        }
        facilityService={
          selectedService
            ? facilityServiceMap.get(selectedService.id)
            : undefined
        }
        showFacilityConfig
        onCancel={() => {
          setDetailOpen(false);
          setSelectedService(null);
        }}
      />

      <FacilityServiceEditModal
        open={editOpen}
        facilityId={facilityId!}
        service={selectedService}
        facilityService={
          selectedService
            ? facilityServiceMap.get(selectedService.id)
            : undefined
        }
        onCancel={() => {
          setEditOpen(false);
          setSelectedService(null);
        }}
        onSuccess={async () => {
          await loadFacilityServices();
        }}
      />
    </>
  );
}