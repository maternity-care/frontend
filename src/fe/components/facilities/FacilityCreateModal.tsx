"use client";

import { useState } from "react";
import { Alert, Button, Form, Modal, Typography } from "antd";
import { Save, X } from "lucide-react";
import { DEFAULT_FACILITY_SCHEDULES } from "@/management/features/facilities/facilities.constants";
import type {
  FacilityScheduleInput,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import { useFacilityLocation } from "@/hooks/facilities/useFacilityLocation";
import { useFacilityOwners } from "@/hooks/facilities/useFacilityOwners";
import { getFacilityErrorMessage } from "./facility-form.shared";
import { FacilityGeneralFields } from "./FacilityGeneralFields";
import { FacilityLocationCard } from "./FacilityLocationCard";
import { FacilityScheduleCard } from "./FacilityScheduleCard";

const { Text, Title } = Typography;

export type FacilityFormValues = {
  name: string;
  ownerId?: string;
  hotline: string;
  email: string;
  status: FacilityStatus;
  address: string;
  city: string;
  ward: string;
  floorCount: number;
  latitude: string;
  longitude: string;
  schedules: FacilityScheduleInput[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FacilityFormValues) => void | Promise<void>;
};

const initialValues: FacilityFormValues = {
  name: "",
  ownerId: "",
  hotline: "",
  email: "",
  status: "active",
  address: "",
  city: "",
  ward: "",
  floorCount: 1,
  latitude: "",
  longitude: "",
  schedules: DEFAULT_FACILITY_SCHEDULES,
};

export function FacilityCreateModal({ open, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<FacilityFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const owners = useFacilityOwners(open);
  const location = useFacilityLocation(form);

  const name = Form.useWatch("name", form);
  function handleCancel() {
    if (submitting) return;
    form.resetFields();
    onClose();
  }

  async function handleFinish(values: FacilityFormValues) {
    setSubmitting(true);

    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        ownerId: values.ownerId?.trim() || undefined,
        hotline: values.hotline.trim(),
        email: values.email?.trim() ?? "",
        address: values.address.trim(),
        city: values.city.trim(),
        ward: values.ward.trim(),
        floorCount: values.floorCount ?? 1,
        latitude: values.latitude?.trim() ?? "",
        longitude: values.longitude?.trim() ?? "",
        schedules: Array.isArray(values.schedules) ? values.schedules : [],
      });

      form.resetFields();
      onClose();
      location.modal.success({
        title: "Thêm cơ sở thành công",
        content: "Cơ sở đã được tạo và cập nhật vào danh sách.",
        centered: true,
      });
    } catch (error) {
      location.modal.error({
        title: "Không thể thêm cơ sở",
        content: getFacilityErrorMessage(error, "Không thể tạo cơ sở."),
        centered: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {location.modalContextHolder}
      <Modal
        open={open}
        width={900}
        centered
        onCancel={handleCancel}
        footer={null}
        title={null}
        mask={{ closable: !submitting }}
        destroyOnHidden
      >
        <div className="border-b border-slate-200 pb-4">
          <Title level={3} className="!mb-1 !text-slate-950">
            Thêm cơ sở khám
          </Title>
          <Text className="text-slate-500">
            Mã cơ sở sẽ được hệ thống tự động tạo sau khi lưu.
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleFinish}
          className="mt-5"
        >
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-5">
              {owners.error ? (
                <Alert type="warning" showIcon title={owners.error} />
              ) : null}

              <FacilityGeneralFields
                ownerOptions={owners.options}
                ownersLoading={owners.loading}
                disabled={submitting}
              />

              <FacilityLocationCard
                facilityName={name || "Cơ sở mới"}
                fullAddress={location.fullAddress}
                mapLocation={location.mapLocation}
                locating={location.locating}
                disabled={submitting}
                onLocate={() => void location.useCurrentLocation()}
              />

              <FacilityScheduleCard disabled={submitting} />
            </div>

          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button onClick={handleCancel} disabled={submitting}>
              <X className="mr-1 h-4 w-4" /> Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              <Save className="mr-1 h-4 w-4" /> Lưu cơ sở
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
