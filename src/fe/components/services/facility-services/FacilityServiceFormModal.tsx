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
  FacilityService,
  FacilityServiceStatus,
  Service,
} from "@/management/features/services/services.types";

import {
  facilityServiceStatusOptions,
} from "../services.ui";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

export interface FacilityServiceFormValues {
  facilityId: string;
  serviceId: string;
  price: number;
  durationMinutes: number;
  status: FacilityServiceStatus;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initialData?: FacilityService;
  fixedService?: Service;
  facilities: Facility[];
  services: Service[];
  optionsLoading?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: FacilityServiceFormValues,
  ) => Promise<void> | void;
}

export function FacilityServiceFormModal({
  open,
  mode,
  initialData,
  fixedService,
  facilities,
  services,
  optionsLoading = false,
  submitting = false,
  onCancel,
  onSubmit,
}: Props) {
  const [form] =
    Form.useForm<FacilityServiceFormValues>();

  const facilityOptions = useMemo(
    () =>
      facilities.map((facility) => ({
        value: facility.id,
        label: `${facility.name} (${facility.code})`,
      })),
    [facilities],
  );

  const serviceOptions = useMemo(
    () =>
      services.map((service) => ({
        value: service.id,
        label: `${service.name} (${service.code})`,
      })),
    [services],
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
        facilityId:
          initialData.facilityId,
        serviceId:
          initialData.serviceId,
        price: Number(
          initialData.price,
        ),
        durationMinutes:
          initialData.durationMinutes,
        status: initialData.status,
      });

      return;
    }

    form.resetFields();

    form.setFieldsValue({
      serviceId: fixedService?.id,
      price: fixedService
        ? Number(
            fixedService.basePrice,
          )
        : undefined,
      durationMinutes:
        fixedService
          ?.defaultDurationMinutes ??
        30,
      status: "available",
    });
  }, [
    fixedService,
    form,
    initialData,
    mode,
    open,
  ]);

  function handleServiceChange(
    serviceId: string,
  ) {
    if (mode !== "create") {
      return;
    }

    const service = services.find(
      (item) => item.id === serviceId,
    );

    if (!service) {
      return;
    }

    form.setFieldsValue({
      price: Number(
        service.basePrice,
      ),
      durationMinutes:
        service.defaultDurationMinutes,
    });
  }

  return (
    <Modal
      open={open}
      centered
      width={680}
      destroyOnHidden
      title={
        mode === "create"
          ? RESPONSE_MESSAGES.SERVICES.MODAL.assign_services_to_facility
          : RESPONSE_MESSAGES.SERVICES.MODAL.update_facility_services
      }
      okText={
        mode === "create"
          ? RESPONSE_MESSAGES.SERVICES.MODAL.assign_services
          : RESPONSE_MESSAGES.COMMON.SAVE_CHANGES
      }
      cancelText={RESPONSE_MESSAGES.COMMON.CANCEL}
      confirmLoading={submitting}
      onOk={() => form.submit()}
      onCancel={onCancel}
    >
      <Form<FacilityServiceFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="facilityId"
            label={RESPONSE_MESSAGES.SERVICES.MODAL.facility}
            rules={[
              {
                required: true,
                message:
                  RESPONSE_MESSAGES.SERVICES.MODAL.please_select_facility,
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={
                facilityOptions
              }
              loading={optionsLoading}
              placeholder={RESPONSE_MESSAGES.SERVICES.MODAL.select_facility}
            />
          </Form.Item>

          <Form.Item
            name="serviceId"
            label={RESPONSE_MESSAGES.HOME.SERVICES_SECTION.TAG}
            rules={[
              {
                required: true,
                message:
                  RESPONSE_MESSAGES.SERVICES.MODAL.please_select_services,
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={
                serviceOptions
              }
              loading={optionsLoading}
              disabled={
                Boolean(
                  fixedService,
                )
              }
              placeholder={RESPONSE_MESSAGES.HOME.QUICK_APPOINTMENT.SERVICE_PLACEHOLDER}
              onChange={
                handleServiceChange
              }
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="price"
            label={RESPONSE_MESSAGES.SERVICES.MODAL.facility_price}
            rules={[
              {
                required: true,
              },
              {
                type: "number",
                min: 0,
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              precision={0}
              addonAfter="VNĐ"
            />
          </Form.Item>

          <Form.Item
            name="durationMinutes"
            label={RESPONSE_MESSAGES.SERVICES.MODAL.duration}
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
              addonAfter={RESPONSE_MESSAGES.COMMON.minute}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="status"
          label={RESPONSE_MESSAGES.COMMON.STATUS}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={
              facilityServiceStatusOptions
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}