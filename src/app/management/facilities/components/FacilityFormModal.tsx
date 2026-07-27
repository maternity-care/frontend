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
import {
  Building2,
  Clock3,
  ExternalLink,
  LocateFixed,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import type {
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

export type FacilityFormValues = {
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

type FacilityFormModalProps = {
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
  latitude: "",
  longitude: "",
  schedules: DEFAULT_FACILITY_SCHEDULES,
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

  return FACILITY_MESSAGES.CREATE_ERROR_DEFAULT;
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

type ReverseGeocodeAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  residential?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  ward?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  state?: string;
  province?: string;
};

type ReverseGeocodeResponse = {
  display_name?: string;
  address?: ReverseGeocodeAddress;
};

type ForwardGeocodeResult =
  ReverseGeocodeResponse & {
    lat?: string;
    lon?: string;
  };

function firstNonEmpty(
  ...values: Array<string | undefined>
) {
  return (
    values.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0,
    )?.trim() ?? ""
  );
}

function extractGeocodeFields(
  result: ReverseGeocodeResponse,
) {
  const geocodeAddress =
    result.address ?? {};

  const streetName = firstNonEmpty(
    geocodeAddress.road,
    geocodeAddress.pedestrian,
    geocodeAddress.residential,
  );

  const streetAddress = [
    geocodeAddress.house_number,
    streetName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const ward = firstNonEmpty(
    geocodeAddress.ward,
    geocodeAddress.suburb,
    geocodeAddress.quarter,
    geocodeAddress.neighbourhood,
    geocodeAddress.village,
    geocodeAddress.town,
  );

  const city = firstNonEmpty(
    geocodeAddress.city,
    geocodeAddress.municipality,
    geocodeAddress.state,
    geocodeAddress.province,
  );

  return {
    streetAddress,
    ward,
    city,
  };
}

function getGoogleMapLocation(
  latitudeValue?: string,
  longitudeValue?: string,
) {
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  const hasValidCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!hasValidCoordinates) {
    return null;
  }

  const coordinates = `${latitude},${longitude}`;
  const encodedCoordinates =
    encodeURIComponent(coordinates);

  return {
    coordinates,
    embedUrl:
      `https://www.google.com/maps?q=${encodedCoordinates}` +
      "&hl=vi&z=16&output=embed",
    externalUrl:
      "https://www.google.com/maps/search/" +
      `?api=1&query=${encodedCoordinates}`,
  };
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>(
    (resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    },
  );
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResponse> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    "accept-language": "vi",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "Không thể tra cứu địa chỉ từ tọa độ hiện tại.",
    );
  }

  return (await response.json()) as ReverseGeocodeResponse;
}

async function forwardGeocode(
  query: string,
): Promise<ForwardGeocodeResult | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    addressdetails: "1",
    limit: "1",
    countrycodes: "vn",
    "accept-language": "vi",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "Không thể tìm kiếm địa chỉ trên bản đồ.",
    );
  }

  const results =
    (await response.json()) as ForwardGeocodeResult[];

  return Array.isArray(results) && results.length > 0
    ? results[0] ?? null
    : null;
}

function getLocationErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error
  ) {
    const code = Number(
      (error as { code?: unknown }).code,
    );

    if (code === 1) {
      return "Bạn chưa cấp quyền truy cập vị trí cho trình duyệt.";
    }

    if (code === 2) {
      return "Không thể xác định vị trí hiện tại.";
    }

    if (code === 3) {
      return "Yêu cầu lấy vị trí đã hết thời gian chờ.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể lấy vị trí hiện tại.";
}

export function FacilityFormModal({
  open,
  onClose,
  onSubmit,
}: FacilityFormModalProps) {
  const [modal, modalContextHolder] = Modal.useModal();
  const [form] = Form.useForm<FacilityFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchingAddress, setSearchingAddress] =
    useState(false);
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

  const selectedOwnerName = useMemo(
    () =>
      ownerOptions.find(
        (owner) => owner.value === ownerId,
      )?.name,
    [ownerId, ownerOptions],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setOwnersLoading(true);

      void getFacilityOwnerOptions()
        .then((options) => {
          if (cancelled) return;
          setOwnerOptions(options);
        })
        .catch((error) => {
          if (cancelled) return;

          setOwnerOptions([]);

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
  }, [modal, open]);

  const fullAddress = useMemo(
    () => [address, ward, city].filter(Boolean).join(", "),
    [address, ward, city],
  );

  const googleMapLocation = useMemo(
    () =>
      getGoogleMapLocation(
        latitude,
        longitude,
      ),
    [latitude, longitude],
  );

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      modal.error({
        title: "Không hỗ trợ định vị",
        content:
          "Trình duyệt hiện tại không hỗ trợ lấy vị trí.",
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
      return;
    }

    if (!window.isSecureContext) {
      modal.error({
        title: "Không thể lấy vị trí",
        content:
          "Tính năng định vị chỉ hoạt động trên HTTPS hoặc localhost.",
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
      return;
    }

    setLocating(true);

    try {
      const position =
        await getCurrentPosition();

      const nextLatitude =
        position.coords.latitude;
      const nextLongitude =
        position.coords.longitude;

      form.setFieldsValue({
        latitude:
          nextLatitude.toFixed(7),
        longitude:
          nextLongitude.toFixed(7),
      });

      try {
        const geocodeResult =
          await reverseGeocode(
            nextLatitude,
            nextLongitude,
          );

        const {
          streetAddress,
          ward: nextWard,
          city: nextCity,
        } = extractGeocodeFields(
          geocodeResult,
        );

        form.setFieldsValue({
          address:
            streetAddress ||
            geocodeResult.display_name ||
            "",
          ward: nextWard,
          city: nextCity,
          latitude:
            nextLatitude.toFixed(7),
          longitude:
            nextLongitude.toFixed(7),
        });

        modal.success({
          title: "Đã lấy vị trí hiện tại",
          content:
            "Địa chỉ và tọa độ đã được tự động điền. Vui lòng kiểm tra lại trước khi lưu.",
          okText: RESPONSE_MESSAGES.COMMON.CLOSE,
          centered: true,
        });
      } catch (reverseError) {
        modal.warning({
          title: "Đã lấy được tọa độ",
          content:
            reverseError instanceof Error
              ? `${reverseError.message} Bạn có thể nhập địa chỉ thủ công.`
              : "Không thể tự động điền địa chỉ. Bạn có thể nhập địa chỉ thủ công.",
          okText: RESPONSE_MESSAGES.COMMON.CLOSE,
          centered: true,
        });
      }
    } catch (error) {
      modal.error({
        title: "Không thể lấy vị trí",
        content:
          getLocationErrorMessage(error),
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } finally {
      setLocating(false);
    }
  }


  async function handleSearchAddress(
    rawAddress?: string,
  ) {
    const manualAddress = String(
      rawAddress ??
        form.getFieldValue("address") ??
        "",
    ).trim();

    if (!manualAddress) {
      await form.validateFields(["address"]);
      return;
    }

    const currentWard = String(
      form.getFieldValue("ward") ?? "",
    ).trim();
    const currentCity = String(
      form.getFieldValue("city") ?? "",
    ).trim();

    const searchQuery = [
      manualAddress,
      currentWard,
      currentCity,
      "Việt Nam",
    ]
      .filter(Boolean)
      .join(", ");

    setSearchingAddress(true);

    try {
      const result =
        await forwardGeocode(searchQuery);

      if (!result) {
        throw new Error(
          "Không tìm thấy địa chỉ phù hợp trên bản đồ.",
        );
      }

      const nextLatitude = Number(result.lat);
      const nextLongitude = Number(result.lon);

      if (
        !Number.isFinite(nextLatitude) ||
        !Number.isFinite(nextLongitude)
      ) {
        throw new Error(
          "Địa chỉ tìm thấy không có tọa độ hợp lệ.",
        );
      }

      const {
        streetAddress,
        ward: nextWard,
        city: nextCity,
      } = extractGeocodeFields(result);

      form.setFieldsValue({
        address:
          streetAddress || manualAddress,
        ward: nextWard || currentWard,
        city: nextCity || currentCity,
        latitude:
          nextLatitude.toFixed(7),
        longitude:
          nextLongitude.toFixed(7),
      });

      modal.success({
        title: "Đã tìm thấy địa chỉ",
        content:
          "Tỉnh/thành phố, phường/xã và tọa độ đã được tự động điền. Vui lòng kiểm tra lại vị trí trên bản đồ.",
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } catch (error) {
      modal.error({
        title: "Không thể tìm địa chỉ",
        content:
          error instanceof Error
            ? error.message
            : "Không thể tìm kiếm địa chỉ trên bản đồ.",
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } finally {
      setSearchingAddress(false);
    }
  }

  function handleCancel() {
    if (submitting) return;
    form.resetFields();
    onClose();
  }

  async function handleFinish(values: FacilityFormValues) {
    setSubmitting(true);

    try {
      await onSubmit({
        name: values.name.trim(),
        ownerId: values.ownerId.trim(),
        hotline: values.hotline.trim(),
        email: values.email?.trim() ?? "",
        status: values.status,
        address: values.address.trim(),
        city: values.city.trim(),
        ward: values.ward.trim(),
        latitude: values.latitude?.trim() ?? "",
        longitude: values.longitude?.trim() ?? "",
        schedules: Array.isArray(values.schedules)
          ? values.schedules
          : [],
      });

      form.resetFields();
      onClose();

      modal.success({
        title: FACILITY_MESSAGES.CREATE_SUCCESS_TITLE,
        content: FACILITY_MESSAGES.CREATE_SUCCESS_CONTENT,
        okText: RESPONSE_MESSAGES.COMMON.CLOSE,
        centered: true,
      });
    } catch (err) {
      modal.error({
        title: FACILITY_MESSAGES.CREATE_ERROR_TITLE,
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
            {FACILITY_MESSAGES.ADD_FACILITY_TITLE}
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
                        Nhập thông tin chung và chủ sở hữu của cơ sở.
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
                              owner.disabled,
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
                        Có thể tự động lấy địa chỉ và tọa độ từ vị trí hiện tại.
                      </p>
                    </span>
                  </Space>
                }
                extra={
                  <Button
                    type="primary"
                    ghost
                    loading={locating}
                    disabled={submitting}
                    icon={
                      <LocateFixed className="h-4 w-4" />
                    }
                    onClick={() => {
                      void handleUseCurrentLocation();
                    }}
                  >
                    Lấy vị trí hiện tại
                  </Button>
                }
              >
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item
                      name="address"
                      label={FACILITY_MESSAGES.ADDRESS}
                      rules={[{ required: true, message: "Vui lòng nhập địa chỉ." }]}
                    >
                      <Input.Search
                        size="large"
                        placeholder="Nhập số nhà, tên đường hoặc địa chỉ đầy đủ"
                        enterButton={
                          <span className="inline-flex items-center gap-1.5">
                            <Search className="h-4 w-4" />
                            Tìm trên bản đồ
                          </span>
                        }
                        loading={searchingAddress}
                        disabled={
                          submitting || locating
                        }
                        onSearch={(value) => {
                          void handleSearchAddress(
                            value,
                          );
                        }}
                      />
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

                <div className="mt-1">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Text strong>
                      Vị trí trên Google Maps
                    </Text>

                    {googleMapLocation ? (
                      <Button
                        type="link"
                        size="small"
                        href={
                          googleMapLocation.externalUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={
                          <ExternalLink className="h-4 w-4" />
                        }
                      >
                        Mở Google Maps
                      </Button>
                    ) : null}
                  </div>

                  {googleMapLocation ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <iframe
                        title="Vị trí cơ sở mới"
                        src={
                          googleMapLocation.embedUrl
                        }
                        className="h-[300px] w-full border-0"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />

                      <a
                        href={
                          googleMapLocation.externalUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start justify-between gap-4 border-t border-slate-200 px-4 py-3 transition hover:bg-blue-50"
                      >
                        <div className="min-w-0">
                          <p className="mb-1 truncate text-sm font-semibold text-slate-950">
                            {name ||
                              FACILITY_MESSAGES.NEW_FACILITY}
                          </p>

                          <p className="mb-1 break-words text-sm text-slate-600">
                            {fullAddress ||
                              FACILITY_MESSAGES.NOT_ENTERED}
                          </p>

                          <p className="mb-0 text-xs text-slate-400">
                            Tọa độ:{" "}
                            {
                              googleMapLocation.coordinates
                            }
                          </p>
                        </div>

                        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </a>
                    </div>
                  ) : (
                    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                      <MapPin className="h-8 w-8 text-slate-300" />

                      <Text
                        strong
                        className="mt-3 block text-slate-700"
                      >
                        Chưa có vị trí trên bản đồ
                      </Text>

                      <Text
                        type="secondary"
                        className="mt-1 block"
                      >
                        Bấm “Lấy vị trí hiện tại” hoặc nhập
                        đầy đủ vĩ độ và kinh độ.
                      </Text>
                    </div>
                  )}
                </div>
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
                        Có thể thiết lập các khung giờ khác nhau theo từng nhóm ngày.
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
                    {name || FACILITY_MESSAGES.NEW_FACILITY}
                  </p>
                  <p className="text-sm text-slate-500">Mã được tạo tự động</p>
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