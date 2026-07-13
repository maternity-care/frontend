// src/app/management/facilities/components/FacilityUpdateModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
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
  TimePicker,
  Typography,
} from "antd";
import { Building2, Clock3, Mail, MapPin, Phone, Save, X } from "lucide-react";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { updateFacility } from "@/management/features/facilities/facilities.api";
import type {
  Facility,
  FacilityStatus,
} from "@/management/features/facilities/facilities.types";

const { Text, Title } = Typography;
const { TextArea } = Input;
const FACILITY_MESSAGES = RESPONSE_MESSAGES.FACILITY_MANAGEMENT;

export type FacilityUpdateValues = {
  name: string;
  code: string;
  hotline: string;
  email: string;
  status: FacilityStatus;
  address: string;
  city: string;
  district: string;
  ward: string;
  latitude: string;
  longitude: string;
  workingDays: string;
  openTime: string;
  closeTime: string;
  description: string;
  internalNote: string;
};

type FacilityUpdateFields = Omit<
  FacilityUpdateValues,
  "openTime" | "closeTime"
> & {
  openTime?: Dayjs;
  closeTime?: Dayjs;
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

function parseWorkingHours(value?: string) {
  if (!value || value === FACILITY_MESSAGES.NOT_UPDATED) {
    return {
      openTime: undefined,
      closeTime: undefined,
    };
  }

  const [openText, closeText] = value.split("-").map((item) => item.trim());

  return {
    openTime: openText ? dayjs(`2000-01-01T${openText}:00`) : undefined,
    closeTime: closeText ? dayjs(`2000-01-01T${closeText}:00`) : undefined,
  };
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
        <p className="text-xs font-semibold uppercase text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {value || FACILITY_MESSAGES.NOT_ENTERED}
        </p>
      </div>
    </div>
  );
}

export function FacilityUpdateModal({
  open,
  facility,
  onClose,
  onUpdated,
}: FacilityUpdateModalProps) {
  const [form] = Form.useForm<FacilityUpdateFields>();
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<FacilityUpdateFields | null>(null);
  const [updateReason, setUpdateReason] = useState("");
  const [reasonTouched, setReasonTouched] = useState(false);

  const name = Form.useWatch("name", form);
  const code = Form.useWatch("code", form);
  const hotline = Form.useWatch("hotline", form);
  const email = Form.useWatch("email", form);
  const status = Form.useWatch("status", form);
  const address = Form.useWatch("address", form);
  const city = Form.useWatch("city", form);
  const district = Form.useWatch("district", form);
  const ward = Form.useWatch("ward", form);
  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);
  const workingDays = Form.useWatch("workingDays", form);
  const openTime = Form.useWatch("openTime", form);
  const closeTime = Form.useWatch("closeTime", form);
  const description = Form.useWatch("description", form);

  useEffect(() => {
    if (!open || !facility) return;

    const { openTime: parsedOpenTime, closeTime: parsedCloseTime } =
      parseWorkingHours(facility.workingHours);

    form.setFieldsValue({
      name: facility.name,
      code: facility.code,
      hotline: facility.hotline,
      email: facility.email ?? "",
      status: facility.status,
      address: facility.address,
      city: facility.city,
      district: facility.district,
      ward: facility.ward,
      latitude: facility.latitude ?? "",
      longitude: facility.longitude ?? "",
      workingDays: "",
      openTime: parsedOpenTime,
      closeTime: parsedCloseTime,
      description:
        facility.featuredServices === FACILITY_MESSAGES.NOT_UPDATED
          ? ""
          : facility.featuredServices,
      internalNote: "",
    });
  }, [open, facility, form]);

  const fullAddress = useMemo(
    () => [address, ward, district, city].filter(Boolean).join(", "),
    [address, ward, district, city],
  );

  const workingTime = useMemo(() => {
    const openText = openTime?.format("HH:mm");
    const closeText = closeTime?.format("HH:mm");

    if (openText && closeText) return `${openText}-${closeText}`;
    return "";
  }, [openTime, closeTime]);

  function handleCancel() {
    if (submitting) return;

    form.resetFields();
    setConfirmOpen(false);
    setPendingValues(null);
    setUpdateReason("");
    setReasonTouched(false);
    onClose();
  }

  function handleCloseConfirm() {
    if (submitting) return;

    setConfirmOpen(false);
    setPendingValues(null);
    setUpdateReason("");
    setReasonTouched(false);
  }

  function handleFinish(values: FacilityUpdateFields) {
    setPendingValues(values);
    setUpdateReason("");
    setReasonTouched(false);
    setConfirmOpen(true);
  }

  async function handleConfirmUpdate() {
    if (!facility || !pendingValues) return;

    const reason = updateReason.trim();

    if (!reason) {
      setReasonTouched(true);
      return;
    }

    setSubmitting(true);

    try {
      const formattedOpenTime = pendingValues.openTime?.format("HH:mm") ?? "";
      const formattedCloseTime = pendingValues.closeTime?.format("HH:mm") ?? "";
      const workingHours =
        formattedOpenTime && formattedCloseTime
          ? `${formattedOpenTime}-${formattedCloseTime}`
          : FACILITY_MESSAGES.NOT_UPDATED;

      const response = await updateFacility(facility.id, {
        name: pendingValues.name,
        code: pendingValues.code.trim().toUpperCase(),
        hotline: pendingValues.hotline,
        email: pendingValues.email ?? "",
        status: pendingValues.status,
        address: pendingValues.address,
        city: pendingValues.city,
        district: pendingValues.district,
        ward: pendingValues.ward,
        latitude: pendingValues.latitude ?? "",
        longitude: pendingValues.longitude ?? "",
        workingDays: pendingValues.workingDays ?? "",
        openTime: formattedOpenTime,
        closeTime: formattedCloseTime,
        workingHours,
        featuredServices: pendingValues.description || FACILITY_MESSAGES.NOT_UPDATED,
        description: pendingValues.description ?? "",
        internalNote: reason,
      });

      onUpdated({
        ...response.data,
        workingHours,
        featuredServices: pendingValues.description || FACILITY_MESSAGES.NOT_UPDATED,
      });

      form.resetFields();
      setConfirmOpen(false);
      setPendingValues(null);
      setUpdateReason("");
      setReasonTouched(false);
      onClose();

      Modal.success({
        title: FACILITY_MESSAGES.UPDATE_SUCCESS_TITLE,
        content: FACILITY_MESSAGES.UPDATE_SUCCESS_CONTENT,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } catch (err) {
      setConfirmOpen(false);

      Modal.error({
        title: FACILITY_MESSAGES.UPDATE_ERROR_TITLE,
        content: getSubmitErrorMessage(err),
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const reasonError = reasonTouched && updateReason.trim().length === 0;

  return (
    <>
      <Modal
        open={open}
        width={1180}
        centered
        onCancel={handleCancel}
        footer={null}
        title={null}
        className="facility-update-modal"
        mask={{ closable: !submitting && !confirmOpen }}
      >
        <div className="border-b border-slate-200 px-1 pb-4">
          <Title level={3} className="!mb-1 !text-slate-950">
            {FACILITY_MESSAGES.UPDATE_FACILITY_TITLE}
          </Title>

          <Text className="text-slate-500">
            {FACILITY_MESSAGES.UPDATE_FACILITY_DESCRIPTION}
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="mt-5"
        >
          <div className="grid max-h-[68vh] gap-5 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                        {FACILITY_MESSAGES.FACILITY_INFO}
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        {FACILITY_MESSAGES.FACILITY_INFO_UPDATE_DESCRIPTION}
                      </p>
                    </span>
                  </Space>
                }
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="name"
                      label={FACILITY_MESSAGES.FACILITY_NAME}
                      rules={[
                        {
                          required: true,
                          message: FACILITY_MESSAGES.VALIDATION.NAME_REQUIRED,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.NAME}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="code"
                      label={FACILITY_MESSAGES.FACILITY_CODE}
                      rules={[
                        {
                          required: true,
                          message: FACILITY_MESSAGES.VALIDATION.CODE_REQUIRED,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.CODE}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="hotline"
                      label={FACILITY_MESSAGES.PHONE}
                      rules={[
                        {
                          required: true,
                          message: FACILITY_MESSAGES.VALIDATION.PHONE_REQUIRED,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.PHONE}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="email"
                      label={FACILITY_MESSAGES.EMAIL}
                      rules={[
                        {
                          type: "email",
                          message: FACILITY_MESSAGES.VALIDATION.EMAIL_INVALID,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.EMAIL}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="status"
                      label={FACILITY_MESSAGES.STATUS}
                      rules={[
                        {
                          required: true,
                          message: FACILITY_MESSAGES.VALIDATION.STATUS_REQUIRED,
                        },
                      ]}
                    >
                      <Select
                        size="large"
                        options={[
                          {
                            value: "active",
                            label: FACILITY_MESSAGES.ACTIVE,
                          },
                          {
                            value: "suspended",
                            label: FACILITY_MESSAGES.SUSPENDED,
                          },
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
                        {FACILITY_MESSAGES.LOCATION_TIME}
                      </p>
                      <p className="mb-0 text-xs font-normal text-slate-500">
                        {FACILITY_MESSAGES.LOCATION_TIME_UPDATE_DESCRIPTION}
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
                      rules={[
                        {
                          required: true,
                          message: FACILITY_MESSAGES.VALIDATION.ADDRESS_REQUIRED,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.ADDRESS}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="city"
                      label={FACILITY_MESSAGES.CITY}
                      rules={[
                        {
                          required: true,
                          message: FACILITY_MESSAGES.VALIDATION.CITY_REQUIRED,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.CITY}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="district"
                      label={FACILITY_MESSAGES.DISTRICT}
                      rules={[
                        {
                          required: true,
                          message: FACILITY_MESSAGES.VALIDATION.DISTRICT_REQUIRED,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.DISTRICT}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="ward"
                      label={FACILITY_MESSAGES.WARD}
                      rules={[
                        {
                          required: true,
                          message: FACILITY_MESSAGES.VALIDATION.WARD_REQUIRED,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.WARD}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="latitude"
                      label={FACILITY_MESSAGES.LATITUDE}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.LATITUDE}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="longitude"
                      label={FACILITY_MESSAGES.LONGITUDE}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.LONGITUDE}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="workingDays"
                      label={FACILITY_MESSAGES.WORKING_DAYS}
                    >
                      <Input
                        size="large"
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.WORKING_DAYS}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item name="openTime" label={FACILITY_MESSAGES.OPEN_TIME}>
                      <TimePicker
                        size="large"
                        format="HH:mm"
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      name="closeTime"
                      label={FACILITY_MESSAGES.CLOSE_TIME}
                    >
                      <TimePicker
                        size="large"
                        format="HH:mm"
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card
                className="border-slate-200"
                title={FACILITY_MESSAGES.SERVICES_NOTE}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="description"
                      label={FACILITY_MESSAGES.FEATURED_SERVICES}
                    >
                      <TextArea
                        rows={4}
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.SERVICES}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="internalNote"
                      label={FACILITY_MESSAGES.INTERNAL_NOTE}
                    >
                      <TextArea
                        rows={4}
                        placeholder={FACILITY_MESSAGES.PLACEHOLDERS.INTERNAL_NOTE}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5 xl:sticky xl:top-0 xl:self-start">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Building2 className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">
                    {name || FACILITY_MESSAGES.FACILITY}
                  </p>

                  <p className="text-sm text-slate-500">
                    {code || FACILITY_MESSAGES.FACILITY_CODE_NOT_ENTERED}
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
                      ? `${latitude || FACILITY_MESSAGES.UNKNOWN_VALUE}, ${
                          longitude || FACILITY_MESSAGES.UNKNOWN_VALUE
                        }`
                      : ""
                  }
                />

                <PreviewLine
                  icon={<Clock3 className="h-4 w-4" />}
                  label={FACILITY_MESSAGES.TIME}
                  value={
                    workingDays || workingTime
                      ? `${workingDays || FACILITY_MESSAGES.DAY_NOT_ENTERED}${
                          FACILITY_MESSAGES.TIME_SEPARATOR
                        }${workingTime || FACILITY_MESSAGES.TIME_NOT_ENTERED}`
                      : ""
                  }
                />
              </div>

              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  {FACILITY_MESSAGES.FEATURED_SERVICES}
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {description || FACILITY_MESSAGES.FEATURED_SERVICES_NOT_ENTERED}
                </p>
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
              {FACILITY_MESSAGES.UPDATE_FACILITY}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        open={confirmOpen}
        centered
        width={456}
        title={null}
        footer={null}
        closable={false}
        onCancel={handleCloseConfirm}
        mask={{ closable: !submitting }}
        className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[14px] [&_.ant-modal-content]:p-0"
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div className="relative px-6 pb-6 pt-7 text-center">
          <button
            type="button"
            aria-label={RESPONSE_MESSAGES.COMMON.CLOSE}
            onClick={handleCloseConfirm}
            disabled={submitting}
            className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Save className="h-7 w-7 text-blue-600" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-950">
            {FACILITY_MESSAGES.CONFIRM_UPDATE_TITLE}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {FACILITY_MESSAGES.CONFIRM_UPDATE_DESCRIPTION}
          </p>

          {facility ? (
            <p className="mx-auto mt-2 max-w-[340px] truncate text-sm font-semibold text-slate-800">
              {facility.name}
            </p>
          ) : null}

          <div className="mt-5 text-left">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {FACILITY_MESSAGES.UPDATE_REASON}{" "}
              <span className="text-red-500">*</span>
            </label>

            <TextArea
              value={updateReason}
              rows={4}
              maxLength={255}
              showCount
              status={reasonError ? "error" : undefined}
              placeholder={FACILITY_MESSAGES.UPDATE_REASON_PLACEHOLDER}
              onChange={(event) => {
                setUpdateReason(event.target.value);

                if (reasonTouched && event.target.value.trim()) {
                  setReasonTouched(false);
                }
              }}
            />

            {reasonError ? (
              <p className="mb-0 mt-1 text-xs text-red-500">
                {FACILITY_MESSAGES.UPDATE_REASON_REQUIRED}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="large"
              onClick={handleCloseConfirm}
              disabled={submitting}
              className="h-11 rounded-lg font-semibold"
            >
              {RESPONSE_MESSAGES.COMMON.CANCEL}
            </Button>

            <Button
              type="primary"
              size="large"
              loading={submitting}
              onClick={handleConfirmUpdate}
              className="h-11 rounded-lg font-semibold"
            >
              {RESPONSE_MESSAGES.COMMON.UPDATE}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
