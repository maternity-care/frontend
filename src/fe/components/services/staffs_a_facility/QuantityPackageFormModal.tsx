"use client";

import {
  createQuantityMaternityPackage,
  getManagementMaternityPackageById,
  updateManagementMaternityPackage,
} from "@/management/features/services/maternity-packages/maternity-packages.api";
import {
  MaternityPackage,
  MaternityPackageStatus,
  PackageServiceItemInput,
} from "@/management/features/services/maternity-packages/maternity-packages.types";
import { getManagementServices } from "@/management/features/services/services/services.api";
import { ManagementService } from "@/management/features/services/services/services.types";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
} from "antd";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const { TextArea } = Input;

interface ServiceRow {
  key: string;
  id?: string;
  serviceId?: string;
  facilityServiceId?: string;
  includedQuantity: number;
  isRequired: boolean;
  isOptional: boolean;
}

interface FormValues {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  status: MaternityPackageStatus;
}

interface Props {
  open: boolean;
  facilityId: string;
  packageItem: MaternityPackage | null;
  onCancel: () => void;
  onSuccess: () => void | Promise<void>;
}

function isFormValidationError(error: unknown) {
  return typeof error === "object" && error !== null && "errorFields" in error;
}

export function QuantityPackageFormModal({
  open,
  facilityId,
  packageItem,
  onCancel,
  onSuccess,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [services, setServices] = useState<ManagementService[]>([]);
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([
    { key: "1", includedQuantity: 1, isRequired: true, isOptional: false },
  ]);

  const serviceOptions = useMemo(() => {
    return services
      .filter(
        (svc) =>
          svc.status === "active" &&
          (svc.saleMode === "both" || svc.saleMode === "package_only"),
      )
      .map((svc) => {
        return {
          value: svc.id,
          label: `${svc.code} - ${svc.name}`,
        };
      });
  }, [services]);

  // Gói nhận serviceId; backend tự tạo facility-service khi cơ sở chưa cấu hình dịch vụ.
  useEffect(() => {
    if (!open || !facilityId) return;

    const load = async () => {
      setLoadingServices(true);
      try {
        const servicesResult = await getManagementServices({
          status: "active",
          page: 1,
          limit: 200,
        });
        setServices(servicesResult.items);
      } catch {
        setServices([]);
        messageApi.error("Không thể tải danh sách dịch vụ.");
      } finally {
        setLoadingServices(false);
      }
    };

    void load();
  }, [open, facilityId, messageApi]);

  useEffect(() => {
    if (!open) return;

    const bootstrap = async () => {
      if (!packageItem) {
        form.resetFields();
        form.setFieldsValue({
          status: "draft",
          durationDays: 280,
        });
        setServiceRows([
          {
            key: "1",
            includedQuantity: 1,
            isRequired: true,
            isOptional: false,
          },
        ]);
        return;
      }

      setLoadingDetail(true);
      try {
        const detail = await getManagementMaternityPackageById(packageItem.id);

        form.setFieldsValue({
          name: detail.name,
          description: detail.description ?? undefined,
          price: Number(detail.price),
          durationDays: detail.durationDays,
          status: detail.status,
        });

        const items = detail.services ?? [];

        setServiceRows(
          items.length > 0
            ? items.map((item, index) => ({
                key: String(item.id ?? index),
                id: item.id,
                serviceId: item.serviceId ?? item.facilityService?.serviceId,
                facilityServiceId: item.facilityServiceId,
                includedQuantity: Number(item.includedQuantity) || 1,
                isRequired: Boolean(item.isRequired),
                isOptional: !Boolean(item.isRequired),
              }))
            : [
                {
                  key: "1",
                  includedQuantity: 1,
                  isRequired: true,
                  isOptional: false,
                },
              ],
        );
      } catch {
        messageApi.error("Không thể tải chi tiết gói.");
        onCancel();
      } finally {
        setLoadingDetail(false);
      }
    };

    void bootstrap();
  }, [form, messageApi, onCancel, open, packageItem]);

  const updateRow = (key: string, patch: Partial<ServiceRow>) => {
    setServiceRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const removeRow = (key: string) => {
    setServiceRows((rows) =>
      rows.length <= 1 ? rows : rows.filter((r) => r.key !== key),
    );
  };

  const buildServicesPayload = (): PackageServiceItemInput[] | null => {
    const selected = serviceRows.filter((row) => row.serviceId);

    if (selected.length === 0) {
      messageApi.error("Vui lòng chọn ít nhất một dịch vụ.");
      return null;
    }

    return selected.map((row, index) => ({
      serviceId: row.serviceId as string,
      includedQuantity: row.includedQuantity,
      isRequired: Boolean(row.isRequired),
      isOptional: Boolean(row.isOptional),
      sortOrder: index + 1,
    }));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const servicesPayload = buildServicesPayload();
      if (!servicesPayload) return;

      setSubmitting(true);

      const payload = {
        facilityId,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        price: Number(values.price).toFixed(2),
        durationDays: values.durationDays,
        status: values.status,
        services: servicesPayload,
      };

      if (packageItem) {
        await updateManagementMaternityPackage(packageItem.id, {
          ...payload,
          packageType: "quantity",
        });
        messageApi.success("Cập nhật gói thành công.");
      } else {
        await createQuantityMaternityPackage(payload);
        messageApi.success("Tạo gói thành công.");
      }

      await onSuccess();
    } catch (error) {
      if (isFormValidationError(error)) return;
      messageApi.error(
        packageItem ? "Không thể cập nhật gói." : "Không thể tạo gói.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        title={
          packageItem ? "Cập nhật gói theo số lượng" : "Thêm gói theo số lượng"
        }
        okText={packageItem ? "Cập nhật" : "Tạo gói"}
        cancelText="Hủy"
        confirmLoading={submitting}
        width={900}
        destroyOnHidden
        onCancel={onCancel}
        onOk={() => void handleSubmit()}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          disabled={loadingDetail || loadingServices}
        >
          <Form.Item
            name="name"
            label="Tên gói"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên gói.",
              },
              { max: 255, message: "Tên gói không được vượt quá 255 ký tự." },
            ]}
          >
            <Input placeholder="Ví dụ: Gói thai sản cơ bản" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea
              rows={3}
              maxLength={1000}
              showCount
              placeholder="Mô tả gói dịch vụ"
            />
          </Form.Item>

          <Space size={16} style={{ display: "flex" }} wrap>
            <Form.Item
              name="price"
              label="Giá gói (VNĐ)"
              rules={[
                { required: true, message: "Vui lòng nhập giá gói." },
                { type: "number", min: 0, message: "Giá không được âm." },
              ]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <InputNumber
                min={0}
                precision={0}
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) =>
                  Number((value ?? "").replace(/\./g, "")) as 0
                }
              />
            </Form.Item>

            <Form.Item
              name="durationDays"
              label="Thời hạn (ngày)"
              rules={[
                { required: true, message: "Vui lòng nhập thời hạn." },
                { type: "number", min: 1, message: "Thời hạn phải lớn hơn 0." },
              ]}
              style={{ minWidth: 160, flex: 1 }}
            >
              <InputNumber min={1} max={1000} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
              style={{ minWidth: 180, flex: 1 }}
            >
              <Select
                options={[
                  { value: "draft", label: "Nháp" },
                  { value: "active", label: "Đang bán" },
                  { value: "inactive", label: "Ngừng bán" },
                ]}
              />
            </Form.Item>
          </Space>

          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            Dịch vụ trong gói
          </div>

          <Table<ServiceRow>
            size="small"
            pagination={false}
            rowKey="key"
            dataSource={serviceRows}
            columns={[
              {
                title: "Dịch vụ tại cơ sở",
                render: (_, record) => (
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Chọn dịch vụ"
                    style={{ width: "100%" }}
                    loading={loadingServices}
                    value={record.serviceId}
                    options={serviceOptions}
                    onChange={(value) =>
                      updateRow(record.key, { serviceId: value })
                    }
                  />
                ),
              },
              {
                title: "Số lượt",
                width: 110,
                render: (_, record) => (
                  <InputNumber
                    min={1}
                    max={999}
                    value={record.includedQuantity}
                    style={{ width: "100%" }}
                    onChange={(value) =>
                      updateRow(record.key, {
                        includedQuantity: Number(value ?? 1),
                      })
                    }
                  />
                ),
              },
              {
                title: "Phân loại",
                width: 150,
                align: "center",
                render: (_, record) => (
                  <Switch
                    checked={record.isRequired}
                    checkedChildren="Bắt buộc"
                    unCheckedChildren="Tùy chọn"
                    onChange={(checked) =>
                      updateRow(record.key, {
                        isRequired: checked,
                        isOptional: !checked,
                      })
                    }
                  />
                ),
              },
              {
                title: "",
                width: 56,
                align: "center",
                render: (_, record) => (
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    disabled={serviceRows.length <= 1}
                    onClick={() => removeRow(record.key)}
                  />
                ),
              },
            ]}
          />

          <Button
            type="dashed"
            icon={<Plus size={16} />}
            style={{ width: "100%", marginTop: 12 }}
            onClick={() =>
              setServiceRows((rows) => [
                ...rows,
                {
                  key: `${Date.now()}`,
                  includedQuantity: 1,
                  isRequired: true,
                  isOptional: false,
                },
              ])
            }
          >
            Thêm dịch vụ
          </Button>
        </Form>
      </Modal>
    </>
  );
}
