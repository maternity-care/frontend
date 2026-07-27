"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { Building2, Clock3, Mail, MapPin, Phone, Save, UserRound, X } from "lucide-react";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import {
  getFacility,
  updateFacility,
  updateFacilityOperatingHours,
} from "@/management/features/facilities/facilities.api";
import type {
  Facility,
  FacilityScheduleInput,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";
import {
  DEFAULT_FACILITY_SCHEDULES,
  FacilityScheduleEditor,
  validateFacilitySchedules,
} from "./FacilityScheduleEditor";
import {
  getFacilityOwnerOptions,
  type FacilityOwnerOption,
} from "./facility-owner.shared";

const { Text, Title } = Typography;
const FACILITY_MESSAGES = RESPONSE_MESSAGES.FACILITY_MANAGEMENT;

export type FacilityUpdateValues = {
  name: string;
  ownerId: string;
  hotline: string;
  email: string;
  status: FacilityStatus;
  address: string;
  city: string;
  ward: string;
  latitude: string;
  longitude: string;
  schedules: FacilityScheduleInput[];
};

type FacilityUpdateModalProps = {
  open: boolean;
  facility: Facility | null;
  onClose: () => void;
  onUpdated: (facility: Facility) => void;
};

function getSubmitErrorMessage(err: unknown) {
  if (err instanceof Error) {
    if (err.message.includes("Facility code already exists")) {
      return FACILITY_MESSAGES.FACILITY_CODE_EXISTS;
    }

    if (err.message.includes("Validation failed")) {
      return FACILITY_MESSAGES.VALIDATION_FAILED;
    }

    return err.message;
  }

  return FACILITY_MESSAGES.UPDATE_ERROR_DEFAULT;
}

function getFacilitySchedules(facility: Facility): FacilityScheduleInput[] {
  if (facility.operatingHourGroups.length > 0) {
    return facility.operatingHourGroups.map((group) => ({
      days: group.days,
      isClosed: group.isClosed,
      openTime: group.openTime?.slice(0, 5) ?? undefined,
      closeTime: group.closeTime?.slice(0, 5) ?? undefined,
    }));
  }

  if (facility.operatingHours.length > 0) {
    return facility.operatingHours.map((hour) => ({
      days: [hour.dayOfWeek],
      isClosed: hour.isClosed,
      openTime: hour.openTime?.slice(0, 5) ?? undefined,
      closeTime: hour.closeTime?.slice(0, 5) ?? undefined,
    }));
  }

  return DEFAULT_FACILITY_SCHEDULES;
}

function PreviewLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value || FACILITY_MESSAGES.NOT_ENTERED}
        </p>
      </div>
    </div>
  );
}

function getScheduleSummary(schedules?: FacilityScheduleInput[]) {
  if (!schedules?.length) return "Chưa thiết lập";

  return schedules
    .map((schedule) => {
      const days = schedule.days.join(", ") || "Chưa chọn ngày";
      const time = schedule.isClosed
        ? "Đóng cửa"
        : `${schedule.openTime || "--:--"} - ${schedule.closeTime || "--:--"}`;

      return `${days}: ${time}`;
    })
    .join("; ");
}

export function FacilityUpdateModal({
  open,
  facility,
  onClose,
  onUpdated,
}: FacilityUpdateModalProps) {
  const [modal, modalContextHolder] = Modal.useModal();
  const [form] = Form.useForm<FacilityUpdateValues>();
  const [submitting, setSubmitting] = useState(false);
  const [ownerOptions, setOwnerOptions] = useState<
    FacilityOwnerOption[]
  >([]);
  const [ownersLoading, setOwnersLoading] =
    useState(false);

  const name = Form.useWatch("name", form);
  const ownerId = Form.useWatch("ownerId", form);
  const hotline = Form.useWatch("hotline", form);
  const email = Form.useWatch("email", form);
  const status = Form.useWatch("status", form);
  const address = Form.useWatch("address", form);
  const city = Form.useWatch("city", form);
  const ward = Form.useWatch("ward", form);
  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);
  const schedules = Form.useWatch("schedules", form);

  const selectedOwnerName =
    ownerOptions.find(
      (owner) => owner.value === ownerId,
    )?.name ||
    (ownerId === facility?.ownerId
      ? facility.ownerName
      : undefined);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setOwnersLoading(true);

      void getFacilityOwnerOptions()
        .then((options) => {
          if (cancelled) return;

          if (
            facility?.ownerId &&
            !options.some(
              (owner) =>
                owner.value ===
                facility.ownerId,
            )
          ) {
            setOwnerOptions([
              {
                value: facility.ownerId,
                label:
                  facility.ownerEmail
                    ? `${facility.ownerName} (${facility.ownerEmail})`
                    : facility.ownerName,
                name:
                  facility.ownerName ||
                  `Chủ cơ sở #${facility.ownerId}`,
                email:
                  facility.ownerEmail ?? "",
                phone:
                  facility.ownerPhone ?? "",
                status: "active",
                disabled: false,
              },
              ...options,
            ]);
            return;
          }

          setOwnerOptions(options);
        })
        .catch((error) => {
          if (cancelled) return;

          if (facility?.ownerId) {
            setOwnerOptions([
              {
                value: facility.ownerId,
                label:
                  facility.ownerEmail
                    ? `${facility.ownerName} (${facility.ownerEmail})`
                    : facility.ownerName,
                name:
                  facility.ownerName ||
                  `Chủ cơ sở #${facility.ownerId}`,
                email:
                  facility.ownerEmail ?? "",
                phone:
                  facility.ownerPhone ?? "",
                status: "active",
                disabled: false,
              },
            ]);
          } else {
            setOwnerOptions([]);
          }

          modal.error({
            title:
              "Không tải được danh sách chủ cơ sở",
            content:
              error instanceof Error
                ? error.message
                : "Không thể tải danh sách chủ cơ sở.",
            okText:
              RESPONSE_MESSAGES.COMMON.CLOSE,
            centered: true,
          });
        })
        .finally(() => {
          if (!cancelled) {
            setOwnersLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    facility?.ownerEmail,
    facility?.ownerId,
    facility?.ownerName,
    facility?.ownerPhone,
    modal,
    open,
  ]);

  useEffect(() => {
    if (!open || !facility) return;

    form.setFieldsValue({
      name: facility.name,
      ownerId: facility.ownerId,
      hotline: facility.hotline,
      email: facility.email ?? "",
      status: facility.status,
      address: facility.address,
      city: facility.city,
      ward: facility.ward,
      latitude: facility.latitude ?? "",
      longitude: facility.longitude ?? "",
      schedules: getFacilitySchedules(facility),
    });
  }, [open, facility, form]);

  const fullAddress = useMemo(
    () => [address, ward, city].filter(Boolean).join(", "),
    [address, ward, city],
  );

  function handleCancel() {
    if (submitting) return;
    form.resetFields();
    onClose();
  }

  async function handleFinish(values: FacilityUpdateValues) {
    if (!facility) return;

    setSubmitting(true);

    try {
      await updateFacility(facility.id, {
        name: values.name,
        ownerId: values.ownerId,
        hotline: values.hotline,
        email: values.email ?? "",
        status: values.status,
        address: values.address,
        city: values.city,
        ward: values.ward,
        latitude: values.latitude ?? "",
        longitude: values.longitude ?? "",
      });

      await updateFacilityOperatingHours(facility.id, {
        schedules: values.schedules,
      });

      const refreshedFacility = await getFacility(facility.id);
      onUpdated(refreshedFacility);

      form.resetFields();
      onClose();

      modal.success({
        title: FACILITY_MESSAGES.UPDATE_SUCCESS_TITLE,
        content: FACILITY_MESSAGES.UPDATE_SUCCESS_CONTENT,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } catch (err) {
      modal.error({
        title: FACILITY_MESSAGES.UPDATE_ERROR_TITLE,
        content: getSubmitErrorMessage(err),
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {modalContextHolder}
      <Modal
        open={open}
        width={1180}
        centered
        onCancel={handleCancel}
        footer={null}
        title={null}
        mask={{ closable: !submitting }}
        destroyOnHidden
      >
        <div className="border-b border-slate-200 pb-4">
          <Title level={3} className="!mb-1 !text-slate-950">
            {FACILITY_MESSAGES.UPDATE_FACILITY_TITLE}
          </Title>
          <Text className="text-slate-500">
            Thông tin cơ sở và lịch hoạt động sẽ được cập nhật qua hai API riêng.
          </Text>
        </div>
  
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="mt-5"
        >
          <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Card
                className="border-slate-200"
                title={
                  <Space>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Thông tin cơ sở
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Mã cơ sở do backend quản lý và không thể chỉnh sửa.
                      </p>
                    </span>
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label={FACILITY_MESSAGES.FACILITY_CODE}>
                      <Input size="large" value={facility?.code} disabled />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="name"
                      label={FACILITY_MESSAGES.FACILITY_NAME}
                      rules={[{ required: true, message: "Vui lòng nhập tên cơ sở." }]}
                    >
                      <Input size="large" placeholder="Nhập tên cơ sở" />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="ownerId"
                      label="Chủ cơ sở"
                      rules={[
                        {
                          required: true,
                          message:
                            "Vui lòng chọn chủ cơ sở.",
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        showSearch
                        allowClear
                        loading={ownersLoading}
                        optionFilterProp="label"
                        placeholder="Chọn chủ cơ sở"
                        notFoundContent={
                          ownersLoading
                            ? "Đang tải danh sách..."
                            : "Không có chủ cơ sở phù hợp"
                        }
                        options={ownerOptions.map(
                          (owner) => ({
                            value: owner.value,
                            label: owner.label,
                            disabled:
                              owner.disabled &&
                              owner.value !==
                                facility?.ownerId,
                          }),
                        )}
                      />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="hotline"
                      label={FACILITY_MESSAGES.PHONE}
                      rules={[{ required: true, message: "Vui lòng nhập số điện thoại." }]}
                    >
                      <Input size="large" placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="email"
                      label={FACILITY_MESSAGES.EMAIL}
                      rules={[{ type: "email", message: "Email không đúng định dạng." }]}
                    >
                      <Input size="large" placeholder="Nhập email" />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="status"
                      label={FACILITY_MESSAGES.STATUS}
                      rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
                    >
                      <Select
                        size="large"
                        options={[
                          { value: "active", label: FACILITY_MESSAGES.ACTIVE },
                          { value: "suspended", label: FACILITY_MESSAGES.SUSPENDED },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
  
              <Card
                className="border-slate-200"
                title={
                  <Space>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Địa chỉ
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Cập nhật tỉnh/thành phố và phường/xã theo contract mới.
                      </p>
                    </span>
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item
                      name="address"
                      label={FACILITY_MESSAGES.ADDRESS}
                      rules={[{ required: true, message: "Vui lòng nhập địa chỉ." }]}
                    >
                      <Input size="large" placeholder="Nhập số nhà, tên đường" />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="city"
                      label={FACILITY_MESSAGES.CITY}
                      rules={[{ required: true, message: "Vui lòng nhập tỉnh/thành phố." }]}
                    >
                      <Input size="large" placeholder="Nhập tỉnh/thành phố" />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="ward"
                      label={FACILITY_MESSAGES.WARD}
                      rules={[{ required: true, message: "Vui lòng nhập phường/xã." }]}
                    >
                      <Input size="large" placeholder="Nhập phường/xã" />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item name="latitude" label={FACILITY_MESSAGES.LATITUDE}>
                      <Input size="large" placeholder="Ví dụ: 21.0285" />
                    </Form.Item>
                  </Col>
  
                  <Col xs={24} md={12}>
                    <Form.Item name="longitude" label={FACILITY_MESSAGES.LONGITUDE}>
                      <Input size="large" placeholder="Ví dụ: 105.8542" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
  
              <Card
                className="border-slate-200"
                title={
                  <Space>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                      <Clock3 className="h-4 w-4" />
                    </span>
                    <span>
                      <p className="mb-0 text-base font-semibold text-slate-950">
                        Lịch hoạt động
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        Lịch được cập nhật qua endpoint operating-hours riêng.
                      </p>
                    </span>
                  </Space>
                }
              >
                <Form.Item
                  name="schedules"
                  rules={[{ validator: (_rule, value) => validateFacilitySchedules(value) }]}
                >
                  <FacilityScheduleEditor disabled={submitting} />
                </Form.Item>
              </Card>
            </div>
  
            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5 xl:sticky xl:top-0 xl:self-start">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">
                    {name || facility?.name || FACILITY_MESSAGES.FACILITY}
                  </p>
                  <p className="text-sm text-slate-500">
                    {facility?.code || FACILITY_MESSAGES.NO_CODE}
                  </p>
                </div>
              </div>
  
              <div className="mt-5">
                <Tag color={status === "suspended" ? "default" : "green"}>
                  {status === "suspended"
                    ? FACILITY_MESSAGES.SUSPENDED
                    : FACILITY_MESSAGES.ACTIVE}
                </Tag>
              </div>
  
              <div className="mt-5 space-y-3">
                <PreviewLine
                  icon={<UserRound className="h-4 w-4" />}
                  label="Chủ cơ sở"
                  value={selectedOwnerName}
                />
                <PreviewLine
                  icon={<Phone className="h-4 w-4" />}
                  label={FACILITY_MESSAGES.PHONE}
                  value={hotline}
                />
                <PreviewLine
                  icon={<Mail className="h-4 w-4" />}
                  label={FACILITY_MESSAGES.EMAIL}
                  value={email}
                />
                <PreviewLine
                  icon={<MapPin className="h-4 w-4" />}
                  label={FACILITY_MESSAGES.ADDRESS}
                  value={fullAddress}
                />
                <PreviewLine
                  icon={<MapPin className="h-4 w-4" />}
                  label={FACILITY_MESSAGES.COORDINATES}
                  value={
                    latitude || longitude
                      ? `${latitude || "?"}, ${longitude || "?"}`
                      : undefined
                  }
                />
                <PreviewLine
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Lịch hoạt động"
                  value={getScheduleSummary(schedules)}
                />
              </div>
            </aside>
          </div>
  
          <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button onClick={handleCancel} disabled={submitting}>
              <X className="mr-1 h-4 w-4" />
              {RESPONSE_MESSAGES.COMMON.CANCEL}
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              <Save className="mr-1 h-4 w-4" />
              {FACILITY_MESSAGES.SAVE_FACILITY}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}