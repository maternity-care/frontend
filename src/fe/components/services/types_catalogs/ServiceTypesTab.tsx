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

import { ServiceTypeFormModal } from "./ServiceTypeFormModal";
import {
  ManagementServiceType,
  ServiceTypeStatus,
} from "@/management/features/services/service-types/service-types.types";
import {
  deleteManagementServiceType,
  getManagementServiceTypes,
} from "@/management/features/services/service-types/service-types.api";
import {
  TableFilter,
  TableFilterColumn,
  TableFilterValues,
} from "@/management/components/ui/TableFilter";

const { Text, Title } = Typography;

export function ServiceTypesTab() {
  const [messageApi, contextHolder] = message.useMessage();

  const [items, setItems] = useState<ManagementServiceType[]>([]);

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

  const [selectedItem, setSelectedItem] =
    useState<ManagementServiceType | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getManagementServiceTypes({
        search: search || undefined,
        status: filterValues.status as ServiceTypeStatus | undefined,
        page,
        limit: pageSize,
      });

      setItems(result.items);
      setTotal(result.total);
    } catch {
      setItems([]);
      setTotal(0);

      messageApi.error("Không thể tải danh sách loại dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, [messageApi, page, pageSize, search, filterValues]);

  useEffect(() => {
    const task = Promise.resolve().then(loadData);

    return () => {
      void task.catch(() => undefined);
    };
  }, [loadData]);

  const filterColumns: TableFilterColumn[] = useMemo(
    () => [
      {
        field: "search",
        label: "Tìm kiếm",
        type: "text",
        width: 320,
        contains: true,
        placeholder: "Tìm theo mã, tên hoặc mô tả",
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
    [],
  );

  const handleFilterChange = (
    nextValues: TableFilterValues,
    nextSearch?: string,
  ) => {
    setFilterValues(nextValues);
    setSearch(nextSearch || undefined);
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: ManagementServiceType) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleDelete = async (item: ManagementServiceType) => {
    setDeletingId(item.id);

    try {
      await deleteManagementServiceType(item.id);

      messageApi.success("Đã xử lý xóa loại dịch vụ thành công.");

      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadData();
      }
    } catch {
      messageApi.error(
        "Không thể xóa loại dịch vụ. Loại dịch vụ có thể đang được sử dụng.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<ManagementServiceType> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Mã loại",
      dataIndex: "code",
      width: 190,
      render: (value: string) => <Text code>{value || "—"}</Text>,
    },
    {
      title: "Tên loại dịch vụ",
      dataIndex: "name",
      width: 260,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      render: (value: string | null) =>
        value ? (
          <Text
            ellipsis={{
              tooltip: value,
            }}
          >
            {value}
          </Text>
        ) : (
          <Text type="secondary">Không có mô tả</Text>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 160,
      align: "center",
      render: (value: ServiceTypeStatus) => (
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
            title="Xóa loại dịch vụ?"
            description="Bạn có chắn chắn xóa loại dịch vụ không?"
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
              Loại dịch vụ
            </Title>

            <Text type="secondary">
              Phân nhóm các dịch vụ như siêu âm, xét nghiệm và khám thai.
            </Text>
          </div>

          <Button
            type="primary"
            icon={<Plus size={17} />}
            onClick={handleCreate}
          >
            Thêm loại dịch vụ
          </Button>
        </Flex>

        <Table<ManagementServiceType>
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
            showTotal: (value) => `Tổng ${value} loại dịch vụ`,
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

      <ServiceTypeFormModal
        open={formOpen}
        serviceType={selectedItem}
        onCancel={() => {
          setFormOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={async () => {
          setFormOpen(false);
          setSelectedItem(null);
          await loadData();
        }}
      />
    </>
  );
}
