"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  Form,
  InputNumber,
  Modal,
  Select,
} from "antd";

import type {
  Facility,
} from "@/management/features/facilities/facilities.types";

import type {
  AllowedFacilityScope,
  PackageService,
  Service,
} from "@/management/features/services/services.types";

import {
  packageRequirementOptions,
  packageScopeOptions,
} from "../services.ui";

export type PackageRequirement =
  | "required"
  | "optional";

export interface PackageServiceFormValues {
  serviceId: string;
  includedQuantity: number;
  requirement: PackageRequirement;
  allowedFacilityScope: AllowedFacilityScope;
  facilityIds: string[];
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initialData?: PackageService;
  services: Service[];
  facilities: Facility[];
  optionsLoading?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: PackageServiceFormValues,
  ) => Promise<void> | void;
}

export function PackageServiceFormModal({
  open,
  mode,
  initialData,
  services,
  facilities,
  optionsLoading = false,
  submitting = false,
  onCancel,
  onSubmit,
}: Props) {
  const [form] =
    Form.useForm<PackageServiceFormValues>();

  const scope = Form.useWatch(
    "allowedFacilityScope",
    form,
  );

  const serviceOptions = useMemo(
    () =>
      services.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.code})`,
      })),
    [services],
  );

  const facilityOptions = useMemo(
    () =>
      facilities.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.code})`,
      })),
    [facilities],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (
      mode === "edit" &&
      initialData
    ) {
      form.setFieldsValue({
        serviceId:
          initialData.serviceId,
        includedQuantity:
          initialData.includedQuantity,
        requirement:
          initialData.isOptional
            ? "optional"
            : "required",
        allowedFacilityScope:
          initialData.allowedFacilityScope,
        facilityIds:
          initialData.facilityIds,
      });

      return;
    }

    form.resetFields();

    form.setFieldsValue({
      includedQuantity: 1,
      requirement: "required",
      allowedFacilityScope: "all",
      facilityIds: [],
    });
  }, [
    form,
    initialData,
    mode,
    open,
  ]);

  return (
    <Modal
      open={open}
      centered
      width={680}
      destroyOnHidden
      title={
        mode === "create"
          ? "Thêm dịch vụ vào gói"
          : "Cập nhật dịch vụ trong gói"
      }
      okText={
        mode === "create"
          ? "Thêm dịch vụ"
          : "Lưu thay đổi"
      }
      cancelText="Hủy"
      confirmLoading={submitting}
      onOk={() => form.submit()}
      onCancel={onCancel}
    >
      <Form<PackageServiceFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          name="serviceId"
          label="Dịch vụ"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={serviceOptions}
            loading={optionsLoading}
          />
        </Form.Item>

        <Form.Item
          name="includedQuantity"
          label="Số lần sử dụng"
          rules={[
            {
              required: true,
            },
            {
              type: "number",
              min: 1,
            },
          ]}
        >
          <InputNumber
            className="w-full"
            min={1}
            precision={0}
          />
        </Form.Item>

        <Form.Item
          name="requirement"
          label="Tính chất"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={[
              ...packageRequirementOptions,
            ]}
          />
        </Form.Item>

        <Form.Item
          name="allowedFacilityScope"
          label="Phạm vi cơ sở"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={
              packageScopeOptions
            }
            onChange={(
              value: AllowedFacilityScope,
            ) => {
              if (value === "all") {
                form.setFieldValue(
                  "facilityIds",
                  [],
                );
              }
            }}
          />
        </Form.Item>

        {scope === "selected" ? (
          <Form.Item
            name="facilityIds"
            label="Các cơ sở áp dụng"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng chọn ít nhất một cơ sở",
              },
            ]}
          >
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              options={
                facilityOptions
              }
              loading={optionsLoading}
              maxTagCount="responsive"
            />
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  );
}