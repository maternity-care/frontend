"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Typography,
} from "antd";
import { Save, X } from "lucide-react";
import { FACILITY_STATUS_OPTIONS } from "@/management/features/facilities/facilities.constants";
import {
  applyFacilityOperatingHours,
  getFacility,
  previewFacilityOperatingHours,
  reactivateFacility,
  suspendFacility,
  updateFacility,
} from "@/management/features/facilities/facilities.api";
import type {
  Facility,
  FacilityScheduleInput,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import { useFacilityLocation } from "@/hooks/facilities/useFacilityLocation";
import { useFacilityOwners } from "@/hooks/facilities/useFacilityOwners";
import {
  getFacilityErrorMessage,
  getFacilitySchedules,
  getOperatingHoursImpactCounts,
  getShiftSlotImpactLabel,
  toIsoDateTime,
} from "./facility-form.shared";
import { FacilityGeneralFields } from "./FacilityGeneralFields";
import { FacilityLocationCard } from "./FacilityLocationCard";
import { FacilityScheduleCard } from "./FacilityScheduleCard";

const { Text, Title } = Typography;
const { TextArea } = Input;

export type FacilityUpdateValues = {
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
  suspendReason?: string;
  suspendUntil?: string;
};

type Props = {
  open: boolean;
  facility: Facility | null;
  onClose: () => void;
  onUpdated: (facility: Facility) => void;
  limitedToStatusAndSchedule?: boolean;
};

export function FacilityUpdateModal({
  open,
  facility,
  onClose,
  onUpdated,
  limitedToStatusAndSchedule = false,
}: Props) {
  const [form] = Form.useForm<FacilityUpdateValues>();
  const [submitting, setSubmitting] = useState(false);
  const owners = useFacilityOwners(
    open &&
      !limitedToStatusAndSchedule,
    facility,
  );
  const location = useFacilityLocation(form);

  const name =
    Form.useWatch(
      "name",
      form,
    );
  const status =
    Form.useWatch(
      "status",
      form,
    );

  useEffect(() => {
    if (!open || !facility) return;

    const timer = window.setTimeout(() => {
      form.setFieldsValue({
        name: facility.name,
        ownerId: facility.ownerId ?? undefined,
        hotline: facility.hotline,
        email: facility.email ?? "",
        status: facility.status,
        address: facility.address,
        city: facility.city,
        ward: facility.ward,
        floorCount: facility.floorCount ?? 1,
        latitude: facility.latitude ?? "",
        longitude: facility.longitude ?? "",
        schedules: getFacilitySchedules(facility),
        suspendReason: "",
        suspendUntil: "",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [facility, form, open]);

  function handleCancel() {
    if (submitting) return;
    form.resetFields();
    onClose();
  }

  async function confirmOperatingHourImpact(
    preview: Awaited<ReturnType<typeof previewFacilityOperatingHours>>,
  ) {
    const {
      impactedShiftCount,
      impactedShiftSlotCount,
    } = getOperatingHoursImpactCounts(preview);

    if (impactedShiftCount > 0) {
      location.modal.error({
        title: "Không thể lưu giờ hoạt động",
        content:
          `Có ${impactedShiftCount} ca trực thật bị nằm ngoài giờ hoạt động mới. ` +
          "Vui lòng xử lý ca trực trước khi đổi giờ của cơ sở.",
        centered: true,
      });
      return null;
    }

    if (impactedShiftSlotCount === 0) return false;

    return new Promise<boolean | null>((resolve) => {
      location.modal.confirm({
        title: "Khung ca sẽ bị tạm tắt",
        content: (
          <div className="space-y-3">
            <p>
              Có {impactedShiftSlotCount} khung ca không còn phù hợp với giờ
              mới. Nếu tiếp tục, các khung ca này sẽ được tạm tắt.
            </p>
            {preview.impactedShiftSlots?.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {preview.impactedShiftSlots.slice(0, 3).map((slot) => (
                  <p key={slot.id}>{getShiftSlotImpactLabel(slot)}</p>
                ))}
              </div>
            ) : null}
          </div>
        ),
        okText: "Tắt khung ca và lưu",
        cancelText: "Hủy",
        centered: true,
        onOk: () => resolve(true),
        onCancel: () => resolve(null),
      });
    });
  }

  async function handleFinish(values: FacilityUpdateValues) {
    if (!facility) return;

    setSubmitting(true);

    try {
      const preview = await previewFacilityOperatingHours(facility.id, {
        schedules: values.schedules,
      });
      const deactivateInvalidSlots = await confirmOperatingHourImpact(preview);

      if (deactivateInvalidSlots === null) return;

      if (
        !limitedToStatusAndSchedule
      ) {
        await updateFacility(
          facility.id,
          {
            name: values.name,
            ownerId:
              values.ownerId,
            hotline:
              values.hotline,
            email:
              values.email ??
              "",
            address:
              values.address,
            city: values.city,
            ward: values.ward,
            floorCount:
              values.floorCount ??
              1,
            latitude:
              values.latitude ??
              "",
            longitude:
              values.longitude ??
              "",
          },
        );
      }

      await applyFacilityOperatingHours(facility.id, {
        schedules: values.schedules,
        slotStrategy: deactivateInvalidSlots
          ? "deactivate_invalid_slots"
          : "strict",
      });

      let statusMessage = "";

      if (values.status !== facility.status) {
        if (values.status === "suspended") {
          const response = await suspendFacility(facility.id, {
            inactiveUntil: toIsoDateTime(values.suspendUntil),
            reason: values.suspendReason,
          });

          statusMessage =
            ` Đã tạm ngưng cơ sở; phòng bị tạm ngưng: ${response.data.impact.suspendedRooms ?? 0}, ` +
            `ca trực bị hủy: ${response.data.impact.cancelledShifts ?? 0}.`;
        } else {
          const response = await reactivateFacility(facility.id);
          statusMessage =
            ` Đã mở lại cơ sở; phòng được mở lại: ${response.data.impact?.reactivatedRooms ?? 0}.`;
        }
      }

      const refreshed = await getFacility(facility.id);
      onUpdated(refreshed);
      form.resetFields();
      onClose();

      location.modal.success({
        title: "Cập nhật cơ sở thành công",
        content: `Thông tin cơ sở đã được cập nhật.${statusMessage}`,
        centered: true,
      });
    } catch (error) {
      location.modal.error({
        title: "Không thể cập nhật cơ sở",
        content: getFacilityErrorMessage(error, "Không thể cập nhật cơ sở."),
        centered: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const statusExtra =
    facility && status !== facility.status ? (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        {status === "suspended" ? (
          <div className="space-y-3">
            <div>
              <Text strong>Tạm ngưng cơ sở</Text>
              <Text type="secondary" className="mt-1 block text-xs">
                Trạng thái sẽ được cập nhật khi bấm Lưu cơ sở.
              </Text>
            </div>
            <Form.Item
              name="suspendReason"
              label="Lý do tạm ngưng"
              className="!mb-3"
              rules={[
                {
                  min: 3,
                  message: "Lý do tạm ngưng cần ít nhất 3 ký tự.",
                },
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Ví dụ: Bảo trì cơ sở. Để trống sẽ dùng lý do mặc định."
                disabled={submitting}
              />
            </Form.Item>
            <Form.Item
              name="suspendUntil"
              label="Tạm ngưng đến"
              className="!mb-0"
            >
              <Input type="datetime-local" disabled={submitting} />
            </Form.Item>
          </div>
        ) : (
          <div>
            <Text strong>Mở lại cơ sở</Text>
            <Text type="secondary" className="mt-1 block">
              Khi lưu, cơ sở sẽ được mở lại.
            </Text>
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      {location.modalContextHolder}
      <Modal
        open={open}
        width={
          limitedToStatusAndSchedule
            ? 760
            : 900
        }
        centered
        onCancel={handleCancel}
        footer={null}
        title={null}
        mask={{ closable: !submitting }}
        destroyOnHidden
      >
        <div className="border-b border-slate-200 pb-4">
          <Title level={3} className="!mb-1 !text-slate-950">
            Cập nhật cơ sở khám
          </Title>
          <Text className="text-slate-500">
            {limitedToStatusAndSchedule
              ? "Bạn chỉ có thể cập nhật trạng thái và lịch hoạt động của cơ sở."
              : "Cập nhật thông tin, bản đồ, lịch hoạt động và trạng thái cơ sở."}
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="mt-5"
        >
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-5">
              {limitedToStatusAndSchedule ? (
                <>
                  <Card
                    className="border-slate-200"
                    title="Trạng thái hoạt động"
                  >
                    <Form.Item
                      name="status"
                      label="Trạng thái"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng chọn trạng thái.",
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        disabled={
                          submitting
                        }
                        options={
                          FACILITY_STATUS_OPTIONS
                        }
                      />
                    </Form.Item>

                    {statusExtra}
                  </Card>

                  <FacilityScheduleCard
                    disabled={
                      submitting
                    }
                  />
                </>
              ) : (
                <>
                  {owners.error ? (
                    <Alert
                      type="warning"
                      showIcon
                      title={
                        owners.error
                      }
                    />
                  ) : null}

                  <FacilityGeneralFields
                    code={
                      facility?.code
                    }
                    ownerOptions={
                      owners.options
                    }
                    ownersLoading={
                      owners.loading
                    }
                    currentOwnerId={
                      facility?.ownerId ?? undefined
                    }
                    disabled={
                      submitting
                    }
                    statusExtra={
                      statusExtra
                    }
                  />

                  <FacilityLocationCard
                    facilityName={
                      name ||
                      facility?.name ||
                      "Cơ sở khám"
                    }
                    fullAddress={
                      location.fullAddress
                    }
                    mapLocation={
                      location.mapLocation
                    }
                    locating={
                      location.locating
                    }
                    disabled={
                      submitting
                    }
                    onLocate={() =>
                      void location.useCurrentLocation()
                    }
                  />

                  <FacilityScheduleCard
                    disabled={
                      submitting
                    }
                  />
                </>
              )}
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
