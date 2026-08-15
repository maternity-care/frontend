"use client";

import {
  Button,
  Card,
  Flex,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteManagementMaternityPackage,
  getManagementMaternityPackages,
} from "@/management/features/services/maternity-packages/maternity-packages.api";
import type {
  MaternityPackage,
  MaternityPackageStatus,
} from "@/management/features/services/maternity-packages/maternity-packages.types";
import { useStaffFacilityId } from "@/hooks/useStaffFacilityId";
import { SchedulePackageFormModal } from "./SchedulePackageFormModal";
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

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SchedulePackagesTab() {
  const { facilityId, ready } = useStaffFacilityId();
  const [messageApi, contextHolder] = message.useMessage();

  const [items, setItems] = useState<MaternityPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterValues, setFilterValues] = useState<TableFilterValues>({
    search: undefined,
    status: undefined,
  });
  const [search, setSearch] = useState<string | undefined>();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<MaternityPackage | null>(null);

  const loadPackages = useCallback(async () => {
    if (!facilityId) return;

    setLoading(true);
    try {
      const result = await getManagementMaternityPackages({
        facilityId,
        packageType: "schedule",
        search: search || undefined,
        status: filterValues.status as MaternityPackageStatus | undefined,
        page,
        limit: pageSize,
      });

      setItems(result.items);
      setTotal(result.total);
    } catch {
      setItems([]);
      setTotal(0);
      messageApi.error("Không thể tải danh sách gói theo lịch trình.");
    } finally {
      setLoading(false);
    }
  }, [facilityId, messageApi, page, pageSize, search, filterValues]);

  useEffect(() => {
    if (!facilityId) return;
    queueMicrotask(() => {
      void loadPackages();
    });
  }, [facilityId, loadPackages]);

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
    [],
  );

  const handleFilterChange = (nextValues: TableFilterValues) => {
    setFilterValues(nextValues);
    const rawSearch = nextValues.search;
    setSearch(typeof rawSearch === "string" ? rawSearch.trim() || undefined : undefined);
    setPage(1);
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
      title: "Số mốc",
      key: "stagesCount",
      width: 100,
      align: "center",
      render: (_, record) => record.stages?.length ?? "—",
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
      width: 110,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit size={17} />}
              onClick={() => {
                setSelected(record);
                setFormOpen(true);
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Xóa gói?"
            description="Bạn có chắn chắn xóa gói dịch vụ không?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              danger: true,
              loading: deletingId === record.id,
            }}
            onConfirm={async () => {
              setDeletingId(record.id);
              try {
                await deleteManagementMaternityPackage(record.id);
                messageApi.success("Đã xử lý xóa gói thành công.");
                if (items.length === 1 && page > 1) {
                  setPage((current) => current - 1);
                } else {
                  await loadPackages();
                }
              } catch {
                messageApi.error(
                  "Không thể xóa gói. Gói có thể đang được sử dụng.",
                );
              } finally {
                setDeletingId(null);
              }
            }}
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
              Gói theo lịch trình
            </Title>
            <Text type="secondary">
              Tạo gói theo mốc tuần thai / sau sinh và gắn dịch vụ cho từng mốc.
            </Text>
          </div>

          <Button
            type="primary"
            icon={<Plus size={17} />}
            onClick={() => {
              setSelected(null);
              setFormOpen(true);
            }}
          >
            Thêm gói
          </Button>
        </Flex>

        <Table<MaternityPackage>
          rowKey="id"
          loading={loading || !ready}
          columns={columns}
          dataSource={items}
          scroll={{
            x: 1200,
            y: 380,
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

      {facilityId ? (
        <SchedulePackageFormModal
          open={formOpen}
          facilityId={facilityId}
          packageItem={selected}
          onCancel={() => {
            setFormOpen(false);
            setSelected(null);
          }}
          onSuccess={async () => {
            setFormOpen(false);
            setSelected(null);
            await loadPackages();
          }}
        />
      ) : null}
    </>
  );
}
