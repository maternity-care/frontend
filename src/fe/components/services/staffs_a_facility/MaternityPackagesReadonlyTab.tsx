"use client";

import {
  Button,
  Card,
  Flex,
  Input,
  message,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Eye, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getFacilities } from "@/management/features/facilities/facilities.api";
import type { Facility } from "@/management/features/facilities/facilities.types";
import {
  getManagementMaternityPackages,
} from "@/management/features/services/maternity-packages/maternity-packages.api";
import type {
  MaternityPackage,
  MaternityPackageStatus,
  MaternityPackageType,
} from "@/management/features/services/maternity-packages/maternity-packages.types";
import { MaternityPackageDetailModal } from "./MaternityPackageDetailModal";

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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MaternityPackageStatus>();
  const [facilityId, setFacilityId] = useState<string>();
  const [packageType, setPackageType] = useState<MaternityPackageType>();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
        status,
        facilityId,
        page,
        limit: pageSize,
      });

      let filtered = result.items;

      if (packageType) {
        filtered = result.items.filter((item) => item.packageType === packageType);
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
  }, [facilityId, messageApi, page, pageSize, packageType, search, status]);

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

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleReset = () => {
    setSearchInput("");
    setSearch("");
    setStatus(undefined);
    setFacilityId(undefined);
    setPackageType(undefined);
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

        <Flex wrap gap={12} style={{ marginBottom: 20 }}>
          <Input
            allowClear
            value={searchInput}
            prefix={<Search size={16} />}
            placeholder="Tìm theo mã, tên hoặc mô tả"
            style={{ width: 300 }}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
          />

          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            value={facilityId}
            placeholder="Cơ sở"
            style={{ width: 240 }}
            loading={loadingFacilities}
            options={facilities.map((f) => ({
              value: f.id,
              label: `${f.code} - ${f.name}`,
            }))}
            onChange={(value) => {
              setFacilityId(value);
              setPage(1);
            }}
          />

          <Select
            allowClear
            value={packageType}
            placeholder="Loại gói"
            style={{ width: 180 }}
            options={[
              { value: "quantity", label: "Theo số lượng" },
              { value: "schedule", label: "Theo lịch trình" },
            ]}
            onChange={(value) => {
              setPackageType(value);
              setPage(1);
            }}
          />

          <Select
            allowClear
            value={status}
            placeholder="Trạng thái"
            style={{ width: 180 }}
            options={[
              { value: "draft", label: "Nháp" },
              { value: "active", label: "Đang bán" },
              { value: "inactive", label: "Ngừng bán" },
            ]}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />

          <Button type="primary" onClick={handleSearch}>
            Tìm kiếm
          </Button>

          <Button icon={<RefreshCw size={16} />} onClick={handleReset}>
            Đặt lại
          </Button>
        </Flex>

        <Table<MaternityPackage>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
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