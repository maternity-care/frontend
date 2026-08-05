"use client";

import {
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Edit, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useStaffFacilityId } from "@/hooks/useStaffFacilityId";
import {
  createManagementFacilityService,
  getManagementFacilityServices,
  updateManagementFacilityService,
} from "@/management/features/services/facility-services/facility-services.api";
import type {
  ManagementFacilityService,
  ServiceStatus as FacilityServiceStatus,
} from "@/management/features/services/facility-services/facility-services.types";
import { getManagementServiceTypesLookup } from "@/management/features/services/service-types/service-types.api";
import type { ManagementServiceTypeLookupItem } from "@/management/features/services/service-types/service-types.types";
import { getManagementServices } from "@/management/features/services/services/services.api";
import type {
  ManagementService,
  ServiceSaleMode,
  ServiceStatus,
} from "@/management/features/services/services/services.types";

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

interface FacilityPriceFormValues {
  price: number;
  durationMinutes: number;
  status: FacilityServiceStatus;
}

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function isFormValidationError(error: unknown) {
  return typeof error === "object" && error !== null && "errorFields" in error;
}

export function ServicesCatalogReadonlyTab() {
  const { facilityId, ready } = useStaffFacilityId();
  const [form] = Form.useForm<FacilityPriceFormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const [services, setServices] = useState<ManagementService[]>([]);
  const [facilityServices, setFacilityServices] = useState<
    ManagementFacilityService[]
  >([]);
  const [serviceTypes, setServiceTypes] = useState<
    ManagementServiceTypeLookupItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState<string>();
  const [saleMode, setSaleMode] = useState<ServiceSaleMode>();
  const [status, setStatus] = useState<ServiceStatus>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [priceModalOpen, setPriceModalOpen] = useState(false);
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

  const openPriceModal = (service: ManagementService) => {
    const facilityService = facilityServiceMap.get(service.id);

    setSelectedService(service);
    form.setFieldsValue({
      price: Number(facilityService?.price ?? service.basePrice),
      durationMinutes:
        facilityService?.durationMinutes ?? service.defaultDurationMinutes,
      status: facilityService?.status ?? "active",
    });
    setPriceModalOpen(true);
  };

  const closePriceModal = () => {
    setPriceModalOpen(false);
    setSelectedService(null);
    form.resetFields();
  };

  const handleSaveFacilityPrice = async () => {
    if (!facilityId || !selectedService) return;

    try {
      const values = await form.validateFields();
      const input = {
        facilityId,
        serviceId: selectedService.id,
        price: Number(values.price).toFixed(2),
        durationMinutes: values.durationMinutes,
        status: values.status,
      };

      setSaving(true);

      let facilityService = facilityServiceMap.get(selectedService.id);
      if (!facilityService) {
        const latest = await getManagementFacilityServices({
          facilityId,
          serviceId: selectedService.id,
          page: 1,
          limit: 1,
        });
        facilityService = latest.items[0];
      }

      if (facilityService) {
        await updateManagementFacilityService(facilityService.id, input);
      } else {
        await createManagementFacilityService(input);
      }

      messageApi.success("Đã cập nhật cấu hình dịch vụ tại cơ sở.");
      closePriceModal();
      await loadFacilityServices();
    } catch (error) {
      if (isFormValidationError(error)) return;
      messageApi.error("Không thể cập nhật cấu hình dịch vụ tại cơ sở.");
    } finally {
      setSaving(false);
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
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Tooltip
          title={
            record.status === "active"
              ? "Chỉnh giá tại cơ sở"
              : "Dịch vụ hệ thống đang ngừng hoạt động"
          }
        >
          <Button
            type="text"
            icon={<Edit size={17} />}
            disabled={record.status !== "active"}
            onClick={() => openPriceModal(record)}
          />
        </Tooltip>
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
              Xem dịch vụ do superadmin tạo và cấu hình giá riêng cho cơ sở.
            </Text>
          </div>
        </Flex>

        <Flex wrap gap={12} style={{ marginBottom: 20 }}>
          <Input
            allowClear
            value={searchInput}
            prefix={<Search size={16} />}
            placeholder="Tìm theo ID, mã hoặc tên"
            style={{ width: 300 }}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
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
              { value: "standalone", label: "Bán lẻ" },
              { value: "package_only", label: "Chỉ trong gói" },
              { value: "both", label: "Bán lẻ và trong gói" },
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
              { value: "active", label: "Hoạt động" },
              { value: "inactive", label: "Ngừng hoạt động" },
            ]}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
          <Button
            type="primary"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            Tìm kiếm
          </Button>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setServiceTypeId(undefined);
              setSaleMode(undefined);
              setStatus(undefined);
              setPage(1);
            }}
          >
            Đặt lại
          </Button>
        </Flex>

        <Table<ManagementService>
          rowKey="id"
          loading={loading || !ready}
          columns={columns}
          dataSource={services}
          scroll={{ x: 1700 }}
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

      <Modal
        open={priceModalOpen}
        title="Cấu hình giá tại cơ sở"
        okText="Lưu"
        cancelText="Hủy"
        width={560}
        destroyOnHidden
        confirmLoading={saving}
        onCancel={closePriceModal}
        onOk={() => void handleSaveFacilityPrice()}
      >
        {selectedService ? (
          <Flex vertical gap={16}>
            <Flex vertical gap={4}>
              <Text strong>{selectedService.name}</Text>
              <Text type="secondary">
                Giá cơ bản: {formatCurrency(selectedService.basePrice)}
              </Text>
            </Flex>

            <Form<FacilityPriceFormValues>
              form={form}
              layout="vertical"
              requiredMark="optional"
            >
              <Form.Item label="Giá tại cơ sở" required>
                <Space.Compact block>
                  <Form.Item
                    name="price"
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập giá tại cơ sở.",
                      },
                      {
                        type: "number",
                        min: 0,
                        message: "Giá dịch vụ không được âm.",
                      },
                    ]}
                  >
                    <InputNumber<number>
                      min={0}
                      precision={0}
                      placeholder="Nhập giá tại cơ sở"
                      style={{ width: "100%" }}
                      formatter={(value) =>
                        `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                      }
                      parser={(value) =>
                        Number((value ?? "").replace(/\./g, ""))
                      }
                    />
                  </Form.Item>

                  <div
                    aria-hidden="true"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      minWidth: 70,
                      padding: "0 12px",
                      color: "rgba(0, 0, 0, 0.88)",
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                      border: "1px solid #d9d9d9",
                      borderLeft: 0,
                      borderRadius: "0 6px 6px 0",
                      userSelect: "none",
                    }}
                  >
                    VND
                  </div>
                </Space.Compact>
              </Form.Item>

              <Form.Item
                name="durationMinutes"
                label="Thời lượng tại cơ sở"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập thời lượng.",
                  },
                  {
                    type: "number",
                    min: 1,
                    message: "Thời lượng phải lớn hơn 0.",
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={1440}
                  precision={0}
                  addonAfter="phút"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                name="status"
                label="Trạng thái tại cơ sở"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn trạng thái.",
                  },
                ]}
              >
                <Select
                  options={[
                    { value: "active", label: "Hoạt động" },
                    { value: "inactive", label: "Ngừng hoạt động" },
                  ]}
                />
              </Form.Item>
            </Form>
          </Flex>
        ) : null}
      </Modal>
    </>
  );
}
