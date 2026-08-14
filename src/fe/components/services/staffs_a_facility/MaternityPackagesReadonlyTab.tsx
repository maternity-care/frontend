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
import { Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getFacilities } from "@/management/features/facilities/facilities.api";
import type { Facility } from "@/management/features/facilities/facilities.types";
import { getManagementMaternityPackages } from "@/management/features/services/maternity-packages/maternity-packages.api";
import type {
  MaternityPackage,
  MaternityPackageStatus,
  MaternityPackageType,
} from "@/management/features/services/maternity-packages/maternity-packages.types";
import { MaternityPackageDetailModal } from "./MaternityPackageDetailModal";
import {
  TableFilter,
  TableFilterColumn,
  TableFilterValues,
} from "@/management/components/ui/TableFilter";

const { Text, Title } = Typography;

const STATUS_LABELS: Record<MaternityPackageStatus, string> = {
  draft: "Nháp",
  active: "Đang bán",
  inactive: "Ngừng bán",
};

const STATUS_COLORS: Record<MaternityPackageStatus, string> = {
  draft: "default",
  active: "green",
  inactive: "orange",
};

const PACKAGE_TYPE_LABELS: Record<MaternityPackageType, string> = {
  quantity: "Theo số lượng",
  schedule: "Theo lịch trình",
};

const PACKAGE_TYPE_COLORS: Record<MaternityPackageType, string> = {
  quantity: "blue",
  schedule: "purple",
};

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MaternityPackagesReadonlyTab() {
  const [messageApi, contextHolder] = message.useMessage();

  const [items, setItems] = useState<MaternityPackage[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  const [filterValues, setFilterValues] = useState<TableFilterValues>({
    search: undefined,
    facilityId: undefined,
    packageType: undefined,
    status: undefined,
  });
  const [search, setSearch] = useState<string | undefined>();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<MaternityPackage | null>(null);

  const facilityNameMap = useMemo(
    () => new Map(facilities.map((f) => [f.id, f.name])),
    [facilities],
  );

  const loadFacilities = useCallback(async () => {
    setLoadingFacilities(true);
    try {
      const list = await getFacilities({ status: "active" });
      setFacilities(list);
    } catch {
      setFacilities([]);
      messageApi.error("Không thể tải danh sách cơ sở.");
    } finally {
      setLoadingFacilities(false);
    }
  }, [messageApi]);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getManagementMaternityPackages({
        search: search || undefined,
        status: filterValues.status as MaternityPackageStatus | undefined,
        facilityId: filterValues.facilityId as string | undefined,
        page,
        limit: pageSize,
      });

      const packageType = filterValues.packageType as
        | MaternityPackageType
        | undefined;

      let filtered = result.items;

      if (packageType) {
        filtered = result.items.filter(
          (item) => item.packageType === packageType,
        );
      }

      setItems(filtered);
      setTotal(
        packageType
          ? filtered.length
          : Number(result.total ?? result.items.length),
      );
    } catch {
      setItems([]);
      setTotal(0);
      messageApi.error("Không thể tải danh sách gói dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, [filterValues, messageApi, page, pageSize, search]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadFacilities();
    });
  }, [loadFacilities]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPackages();
    });
  }, [loadPackages]);

  const filterColumns: TableFilterColumn[] = useMemo(
    () => [
      {
        field: "search",
        label: "Tìm kiếm",
        type: "text",
        width: 300,
        contains: true,
        placeholder: "Tìm theo mã, tên hoặc mô tả",
      },
      {
        field: "facilityId",
        label: "Cơ sở",
        type: "select",
        width: 240,
        options: facilities.map((f) => ({
          value: f.id,
          label: `${f.code} - ${f.name}`,
        })),
      },
      {
        field: "packageType",
        label: "Loại gói",
        type: "select",
        width: 180,
        options: [
          { value: "quantity", label: "Theo số lượng" },
          { value: "schedule", label: "Theo lịch trình" },
        ],
      },
      {
        field: "status",
        label: "Trạng thái",
        type: "select",
        width: 180,
        options: [
          { value: "draft", label: "Nháp" },
          { value: "active", label: "Đang bán" },
          { value: "inactive", label: "Ngừng bán" },
        ],
      },
    ],
    [facilities],
  );

  const handleFilterChange = (
    nextValues: TableFilterValues,
    nextSearch?: string,
  ) => {
    setFilterValues(nextValues);
    setSearch(nextSearch || undefined);
    setPage(1);
  };

  const openDetail = (record: MaternityPackage) => {
    setSelected(record);
    setDetailOpen(true);
  };

  const columns: ColumnsType<MaternityPackage> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Mã gói",
      dataIndex: "code",
      width: 150,
      render: (value: string) => <Text code>{value || "—"}</Text>,
    },
    {
      title: "Tên gói",
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
      title: "Cơ sở",
      dataIndex: "facilityId",
      width: 200,
      render: (value: string, record) =>
        record.facility?.name ?? facilityNameMap.get(value) ?? "—",
    },
    {
      title: "Loại gói",
      dataIndex: "packageType",
      width: 150,
      align: "center",
      render: (value: MaternityPackageType) => (
        <Tag color={PACKAGE_TYPE_COLORS[value]}>
          {PACKAGE_TYPE_LABELS[value]}
        </Tag>
      ),
    },
    {
      title: "Giá gói",
      dataIndex: "price",
      width: 150,
      align: "right",
      render: formatCurrency,
    },
    {
      title: "Thời hạn",
      dataIndex: "durationDays",
      width: 120,
      align: "center",
      render: (value: number) => (value ? `${value} ngày` : "—"),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priorityLevel",
      width: 100,
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      align: "center",
      render: (value: MaternityPackageStatus) => (
        <Tag color={STATUS_COLORS[value]}>{STATUS_LABELS[value]}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 90,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<Eye size={17} />}
            onClick={() => openDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

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
              Gói dịch vụ toàn hệ thống
            </Title>
            <Text type="secondary">
              Xem danh sách gói thai sản của tất cả cơ sở.
            </Text>
          </div>
        </Flex>

        <Table<MaternityPackage>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{
            x: 900,
            y: 380, // cố định chiều cao body → có scroll dọc, không bị tràn
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50, 100],
            showTotal: (value) => `Tổng ${value} gói`,
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

      <MaternityPackageDetailModal
        open={detailOpen}
        packageItem={selected}
        onCancel={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
      />
    </>
  );
}
