"use client";

import {
  Button,
  Card,
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

import {
  createScheduleMaternityPackage,
  getManagementMaternityPackageById,
  updateManagementMaternityPackage,
} from "@/management/features/services/maternity-packages/maternity-packages.api";
import type {
  MaternityPackage,
  MaternityPackageStageType,
  MaternityPackageStatus,
  PackageServiceItemInput,
  PackageStageInput,
} from "@/management/features/services/maternity-packages/maternity-packages.types";
import { getManagementFacilityServices } from "@/management/features/services/facility-services/facility-services.api";
import { ManagementFacilityService } from "@/management/features/services/facility-services/facility-services.types";
import { getManagementServices } from "@/management/features/services/services/services.api";
import { ManagementService } from "@/management/features/services/services/services.types";

const { TextArea } = Input;

interface ServiceRow {
  key: string;
  id?: string;
  facilityServiceId?: string;
  includedQuantity: number;
  isRequired: boolean;
  isOptional: boolean;
}

interface StageRow {
  key: string;
  name: string;
  stageType: MaternityPackageStageType;
  weekFrom?: number | null;
  weekTo?: number | null;
  goal?: string;
  services: ServiceRow[];
}

interface FormValues {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  priorityLevel?: number;
  status: MaternityPackageStatus;
}

interface SchedulePackageFormModalProps {
  open: boolean;
  facilityId: string;
  packageItem: MaternityPackage | null;
  facilityServices?: ManagementFacilityService[];
  onCancel: () => void;
  onSuccess: () => void | Promise<void>;
}

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function isFormValidationError(error: unknown) {
  return typeof error === "object" && error !== null && "errorFields" in error;
}

function createEmptyServiceRow(): ServiceRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    includedQuantity: 1,
    isRequired: true,
    isOptional: false,
  };
}

function createEmptyStageRow(): StageRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    name: "",
    stageType: "pregnancy_week",
    weekFrom: undefined,
    weekTo: undefined,
    goal: "",
    services: [createEmptyServiceRow()],
  };
}

export function SchedulePackageFormModal({
  open,
  facilityId,
  packageItem,
  facilityServices: facilityServicesProp,
  onCancel,
  onSuccess,
}: SchedulePackageFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [services, setServices] = useState<ManagementService[]>([]);
  const [facilityServices, setFacilityServices] = useState<
    ManagementFacilityService[]
  >(facilityServicesProp ?? []);
  const [stages, setStages] = useState<StageRow[]>([createEmptyStageRow()]);

  const serviceOptions = useMemo(() => {
    const activeFs = facilityServices.filter((fs) => fs.status === "active");

    return services
      .filter((svc) => svc.status === "active")
      .map((svc) => {
        const fs = activeFs.find((item) => item.serviceId === svc.id);
        if (!fs) return null;
        return {
          value: fs.id,
          label: `${svc.code} - ${svc.name} (${formatCurrency(fs.price)})`,
        };
      })
      .filter((opt): opt is { value: string; label: string } => opt !== null);
  }, [services, facilityServices]);

  useEffect(() => {
    if (!open || !facilityId) return;

    const load = async () => {
      setLoadingServices(true);
      try {
        const [servicesResult, fsResult] = await Promise.all([
          getManagementServices({
            status: "active",
            page: 1,
            limit: 20,
          }),
          facilityServicesProp && facilityServicesProp.length > 0
            ? Promise.resolve({ items: facilityServicesProp })
            : getManagementFacilityServices({
                facilityId,
                status: "active",
                page: 1,
                limit: 100,
              }),
        ]);

        setServices(servicesResult.items);
        setFacilityServices(fsResult.items);
      } catch {
        setServices([]);
        setFacilityServices([]);
        messageApi.error("Không thể tải danh sách dịch vụ.");
      } finally {
        setLoadingServices(false);
      }
    };

    void load();
  }, [open, facilityId, facilityServicesProp, messageApi]);

  useEffect(() => {
    if (!open) return;

    const bootstrap = async () => {
      if (!packageItem) {
        form.resetFields();
        form.setFieldsValue({
          status: "draft",
          durationDays: 280,
          priorityLevel: 0,
        });
        setStages([createEmptyStageRow()]);
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
          priorityLevel: detail.priorityLevel ?? 0,
          status: detail.status,
        });

        const stageList = detail.stages ?? [];

        setStages(
          stageList.length > 0
            ? stageList.map((stage) => {
                const stageItems = stage.services ?? [];
                return {
                  key: String(stage.id),
                  name: stage.name,
                  stageType: stage.stageType,
                  weekFrom: stage.weekFrom,
                  weekTo: stage.weekTo,
                  goal: stage.goal ?? "",
                  services:
                    stageItems.length > 0
                      ? stageItems.map((item) => ({
                          key: String(item.id),
                          id: item.id,
                          facilityServiceId: item.facilityServiceId,
                          includedQuantity: Number(item.includedQuantity) || 1,
                          isRequired: Boolean(item.isRequired),
                          isOptional: Boolean(item.isOptional),
                        }))
                      : [createEmptyServiceRow()],
                };
              })
            : [createEmptyStageRow()],
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

  const updateStage = (key: string, patch: Partial<StageRow>) => {
    setStages((list) =>
      list.map((stage) => (stage.key === key ? { ...stage, ...patch } : stage)),
    );
  };

  const updateStageService = (
    stageKey: string,
    serviceKey: string,
    patch: Partial<ServiceRow>,
  ) => {
    setStages((list) =>
      list.map((stage) => {
        if (stage.key !== stageKey) return stage;
        return {
          ...stage,
          services: stage.services.map((service) =>
            service.key === serviceKey ? { ...service, ...patch } : service,
          ),
        };
      }),
    );
  };

  const addStage = () => {
    setStages((list) => [...list, createEmptyStageRow()]);
  };

  const removeStage = (key: string) => {
    setStages((list) =>
      list.length <= 1 ? list : list.filter((s) => s.key !== key),
    );
  };

  const addServiceToStage = (stageKey: string) => {
    setStages((list) =>
      list.map((stage) =>
        stage.key === stageKey
          ? { ...stage, services: [...stage.services, createEmptyServiceRow()] }
          : stage,
      ),
    );
  };

  const removeServiceFromStage = (stageKey: string, serviceKey: string) => {
    setStages((list) =>
      list.map((stage) => {
        if (stage.key !== stageKey) return stage;
        if (stage.services.length <= 1) return stage;
        return {
          ...stage,
          services: stage.services.filter((s) => s.key !== serviceKey),
        };
      }),
    );
  };

  const buildStagesPayload = (): PackageStageInput[] | null => {
    if (stages.length === 0) {
      messageApi.error("Vui lòng thêm ít nhất một mốc.");
      return null;
    }

    const result: PackageStageInput[] = [];

    for (let i = 0; i < stages.length; i += 1) {
      const stage = stages[i];
      const name = stage.name.trim();

      if (!name) {
        messageApi.error(`Mốc #${i + 1}: vui lòng nhập tên mốc.`);
        return null;
      }

      if (stage.stageType === "pregnancy_week") {
        if (
          stage.weekFrom === null ||
          stage.weekFrom === undefined ||
          stage.weekTo === null ||
          stage.weekTo === undefined
        ) {
          messageApi.error(
            `Mốc "${name}": cần nhập tuần thai bắt đầu và kết thúc.`,
          );
          return null;
        }
        if (stage.weekFrom > stage.weekTo) {
          messageApi.error(
            `Mốc "${name}": tuần bắt đầu phải nhỏ hơn hoặc bằng tuần kết thúc.`,
          );
          return null;
        }
      }

      const selectedServices = stage.services.filter(
        (s) => s.facilityServiceId,
      );

      if (selectedServices.length === 0) {
        messageApi.error(`Mốc "${name}": cần chọn ít nhất một dịch vụ.`);
        return null;
      }

      const servicesPayload: PackageServiceItemInput[] = selectedServices.map(
        (service, index) => ({
          facilityServiceId: service.facilityServiceId as string,
          includedQuantity: service.includedQuantity,
          isRequired: Boolean(service.isRequired),
          isOptional: Boolean(service.isOptional),
          sortOrder: index + 1,
        }),
      );

      result.push({
        name,
        stageType: stage.stageType,
        weekFrom: stage.stageType === "pregnancy_week" ? stage.weekFrom : null,
        weekTo: stage.stageType === "pregnancy_week" ? stage.weekTo : null,
        goal: stage.goal?.trim() || undefined,
        sortOrder: i + 1,
        services: servicesPayload,
      });
    }

    return result;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const stagesPayload = buildStagesPayload();
      if (!stagesPayload) return;

      setSubmitting(true);

      const payload = {
        facilityId,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        price: Number(values.price).toFixed(2),
        durationDays: values.durationDays,
        priorityLevel: values.priorityLevel ?? 0,
        status: values.status,
        stages: stagesPayload,
      };

      if (packageItem) {
        await updateManagementMaternityPackage(packageItem.id, {
          ...payload,
          packageType: "schedule",
        });
        messageApi.success("Cập nhật gói thành công.");
      } else {
        await createScheduleMaternityPackage(payload);
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
          packageItem
            ? "Cập nhật gói theo lịch trình"
            : "Thêm gói theo lịch trình"
        }
        okText={packageItem ? "Cập nhật" : "Tạo gói"}
        cancelText="Hủy"
        confirmLoading={submitting}
        width={980}
        destroyOnHidden
        onCancel={onCancel}
        onOk={() => void handleSubmit()}
        styles={{ body: { maxHeight: "72vh", overflowY: "auto" } }}
      >
        <Form<FormValues>
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
            <Input placeholder="Ví dụ: Gói theo dõi thai kỳ chuẩn" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea
              rows={2}
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
              name="priorityLevel"
              label="Độ ưu tiên hiển thị"
              style={{ minWidth: 160, flex: 1 }}
            >
              <InputNumber min={0} max={999} style={{ width: "100%" }} />
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

          <div style={{ marginBottom: 12, fontWeight: 500 }}>
            Các mốc lịch trình
          </div>

          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            {stages.map((stage, stageIndex) => (
              <Card
                key={stage.key}
                size="small"
                title={`Mốc #${stageIndex + 1}`}
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    disabled={stages.length <= 1}
                    onClick={() => removeStage(stage.key)}
                  >
                    Xóa mốc
                  </Button>
                }
              >
                <Space
                  size={12}
                  style={{ display: "flex", marginBottom: 12 }}
                  wrap
                >
                  <Input
                    placeholder="Tên mốc (VD: Tuần 12 - 14)"
                    value={stage.name}
                    style={{ minWidth: 220, flex: 1 }}
                    onChange={(e) =>
                      updateStage(stage.key, { name: e.target.value })
                    }
                  />

                  <Select
                    value={stage.stageType}
                    style={{ width: 180 }}
                    options={[
                      { value: "pregnancy_week", label: "Tuần thai" },
                      { value: "postpartum", label: "Sau sinh" },
                      { value: "custom", label: "Tùy chỉnh" },
                    ]}
                    onChange={(value: MaternityPackageStageType) =>
                      updateStage(stage.key, {
                        stageType: value,
                        weekFrom:
                          value === "pregnancy_week" ? stage.weekFrom : null,
                        weekTo:
                          value === "pregnancy_week" ? stage.weekTo : null,
                      })
                    }
                  />

                  {stage.stageType === "pregnancy_week" ? (
                    <>
                      <InputNumber
                        min={1}
                        max={45}
                        placeholder="Từ tuần"
                        value={stage.weekFrom ?? undefined}
                        onChange={(value) =>
                          updateStage(stage.key, {
                            weekFrom: value === null ? null : Number(value),
                          })
                        }
                      />
                      <InputNumber
                        min={1}
                        max={45}
                        placeholder="Đến tuần"
                        value={stage.weekTo ?? undefined}
                        onChange={(value) =>
                          updateStage(stage.key, {
                            weekTo: value === null ? null : Number(value),
                          })
                        }
                      />
                    </>
                  ) : null}
                </Space>

                <Input
                  placeholder="Mục tiêu mốc (tùy chọn)"
                  value={stage.goal}
                  style={{ marginBottom: 12 }}
                  onChange={(e) =>
                    updateStage(stage.key, { goal: e.target.value })
                  }
                />

                <Table<ServiceRow>
                  size="small"
                  pagination={false}
                  rowKey="key"
                  dataSource={stage.services}
                  columns={[
                    {
                      title: "Dịch vụ tại cơ sở",
                      dataIndex: "facilityServiceId",
                      render: (_, record) => (
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Chọn dịch vụ"
                          style={{ width: "100%" }}
                          loading={loadingServices}
                          value={record.facilityServiceId}
                          options={serviceOptions}
                          onChange={(value) =>
                            updateStageService(stage.key, record.key, {
                              facilityServiceId: value,
                            })
                          }
                        />
                      ),
                    },
                    {
                      title: "Số lượt",
                      width: 100,
                      render: (_, record) => (
                        <InputNumber
                          min={1}
                          max={999}
                          value={record.includedQuantity}
                          style={{ width: "100%" }}
                          onChange={(value) =>
                            updateStageService(stage.key, record.key, {
                              includedQuantity: Number(value ?? 1),
                            })
                          }
                        />
                      ),
                    },
                    {
                      title: "Bắt buộc",
                      width: 90,
                      align: "center",
                      render: (_, record) => (
                        <Switch
                          checked={record.isRequired}
                          onChange={(checked) =>
                            updateStageService(stage.key, record.key, {
                              isRequired: checked,
                              isOptional: checked ? false : record.isOptional,
                            })
                          }
                        />
                      ),
                    },
                    {
                      title: "Tùy chọn",
                      width: 90,
                      align: "center",
                      render: (_, record) => (
                        <Switch
                          checked={record.isOptional}
                          onChange={(checked) =>
                            updateStageService(stage.key, record.key, {
                              isOptional: checked,
                              isRequired: checked ? false : record.isRequired,
                            })
                          }
                        />
                      ),
                    },
                    {
                      title: "",
                      width: 48,
                      render: (_, record) => (
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 size={15} />}
                          disabled={stage.services.length <= 1}
                          onClick={() =>
                            removeServiceFromStage(stage.key, record.key)
                          }
                        />
                      ),
                    },
                  ]}
                />

                <Button
                  type="dashed"
                  size="small"
                  icon={<Plus size={14} />}
                  onClick={() => addServiceToStage(stage.key)}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  Thêm dịch vụ vào mốc
                </Button>
              </Card>
            ))}
          </Space>

          <Button
            type="dashed"
            icon={<Plus size={16} />}
            onClick={addStage}
            style={{ width: "100%", marginTop: 16 }}
          >
            Thêm mốc
          </Button>
        </Form>
      </Modal>
    </>
  );
}