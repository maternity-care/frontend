"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Descriptions,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CalendarClock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import {
  getDoctor,
} from "@/management/features/doctors/doctors.api";
import type {
  Doctor,
  DoctorExperienceLevel,
  DoctorStatus,
} from "@/management/features/doctors/doctors.types";

const {
  Text,
  Title,
} = Typography;

type DoctorDetailModalProps = {
  open: boolean;
  doctor: Doctor | null;
  canManage: boolean;
  allowedFacilityId?: string;
  facilityNameById: Record<
    string,
    string
  >;
  roomTypeNameById: Record<
    string,
    string
  >;
  onClose: () => void;
  onEdit: (
    doctor: Doctor,
  ) => void;
  onError?: (
    message: string,
  ) => void;
};

function getExperienceLabel(
  value: DoctorExperienceLevel,
) {
  const labels: Record<DoctorExperienceLevel, string> = {
    1: "1 - 5 năm",
    2: "6 - 10 năm",
    3: "11 - 20 năm",
    4: "Trên 20 năm",
  };

  return labels[value];
}

function getErrorMessage(
  error: unknown,
) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
            errors?: {
              fields?: string[];
            };
          };
        };
      }
    ).response;

    const fields =
      response?.data?.errors
        ?.fields;

    if (
      Array.isArray(fields) &&
      fields.length > 0
    ) {
      return fields.join(", ");
    }

    const message =
      response?.data?.message;

    if (
      Array.isArray(message)
    ) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Không tải được thông tin bác sĩ.";
}

function formatDateTime(
  value?: string,
) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}

function renderStatus(
  status: DoctorStatus,
) {
  return status === "active" ? (
    <Tag color="green">
      Hoạt động
    </Tag>
  ) : (
    <Tag>
      Ngừng hoạt động
    </Tag>
  );
}

function doctorBelongsToFacility(
  doctor: Doctor,
  facilityId: string,
) {
  if (!facilityId) {
    return false;
  }

  if (
    doctor.facilityIds.length >
    0
  ) {
    return doctor.facilityIds.some(
      (item) =>
        String(item) ===
        facilityId,
    );
  }

  return (
    String(
      doctor.facilityId ?? "",
    ) === facilityId
  );
}

function mergeDoctorDetail(
  current: Doctor,
  detail: Doctor,
): Doctor {
  const fallbackName =
    `Bác sĩ #${detail.id}`;

  return {
    ...current,
    ...detail,
    name:
      detail.name &&
      detail.name !== fallbackName
        ? detail.name
        : current.name,
    employeeCode:
      detail.employeeCode ||
      current.employeeCode,
    personalEmail:
      detail.personalEmail ||
      current.personalEmail,
    email:
      detail.email ||
      current.email,
    phone:
      detail.phone ||
      current.phone,
    address:
      detail.address ||
      current.address,
    facilityId:
      detail.facilityId ||
      current.facilityId,
    facilityIds:
      detail.facilityIds.length > 0
        ? detail.facilityIds
        : current.facilityIds,
    workingRoomTypeId:
      detail.workingRoomTypeId ||
      current.workingRoomTypeId,
  };
}

export function DoctorDetailModal({
  open,
  doctor,
  canManage,
  allowedFacilityId,
  facilityNameById,
  roomTypeNameById,
  onClose,
  onEdit,
  onError,
}: DoctorDetailModalProps) {
  const [
    detailDoctor,
    setDetailDoctor,
  ] =
    useState<Doctor | null>(
      doctor,
    );
  const [
    loading,
    setLoading,
  ] = useState(false);
  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );
  const onErrorRef =
    useRef(onError);

  useEffect(() => {
    onErrorRef.current =
      onError;
  }, [onError]);

  useEffect(() => {
    if (
      !open ||
      !doctor
    ) {
      const timer =
        window.setTimeout(() => {
          setDetailDoctor(null);
          setError(null);
          setLoading(false);
        }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    let cancelled = false;

    const timer =
      window.setTimeout(() => {
        setDetailDoctor(doctor);
        setError(null);
        setLoading(true);
      }, 0);

    void getDoctor(doctor.id)
      .then((loadedDoctor) => {
        if (cancelled) {
          return;
        }

        const mergedDoctor =
          mergeDoctorDetail(
            doctor,
            loadedDoctor,
          );

        if (
          allowedFacilityId &&
          !doctorBelongsToFacility(
            mergedDoctor,
            allowedFacilityId,
          )
        ) {
          throw new Error(
            "Bạn không có quyền xem bác sĩ của cơ sở này.",
          );
        }

        setDetailDoctor(
          mergedDoctor,
        );
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        const message =
          getErrorMessage(
            loadError,
          );

        setError(message);
        onErrorRef.current?.(
          message,
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    allowedFacilityId,
    doctor,
    open,
  ]);

  const facilityName =
    useMemo(() => {
      if (!detailDoctor) {
        return "";
      }

      const facilityIds =
        detailDoctor
          .facilityIds.length >
        0
          ? detailDoctor.facilityIds
          : detailDoctor.facilityId
            ? [
                detailDoctor.facilityId,
              ]
            : [];

      if (
        facilityIds.length === 0
      ) {
        return "Chưa được gán";
      }

      const names = Array.from(
        new Set(facilityIds),
      )
        .map(
          (facilityId) =>
            facilityNameById[
              facilityId
            ],
        )
        .filter(
          (
            name,
          ): name is string =>
            Boolean(name),
        );

      return names.length > 0
        ? names.join(", ")
        : "Không tìm thấy tên cơ sở";
    }, [
      detailDoctor,
      facilityNameById,
    ]);

  const roomTypeName =
    useMemo(() => {
      if (
        !detailDoctor
          ?.workingRoomTypeId
      ) {
        return "Chưa cập nhật";
      }

      return (
        roomTypeNameById[
          detailDoctor
            .workingRoomTypeId
        ] ||
        "Không tìm thấy tên loại phòng"
      );
    }, [
      detailDoctor,
      roomTypeNameById,
    ]);

  const canManageCurrentDoctor =
    Boolean(
      canManage &&
      detailDoctor &&
      (
        !allowedFacilityId ||
        doctorBelongsToFacility(
          detailDoctor,
          allowedFacilityId,
        )
      ),
    );

  return (
    <Modal
      open={
        open &&
        Boolean(doctor)
      }
      width={900}
      centered
      title={null}
      closable={false}
      confirmLoading={loading}
      footer={
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-2">
          {detailDoctor &&
          canManageCurrentDoctor ? (
            <Button
              icon={
                <Pencil className="h-4 w-4" />
              }
              onClick={() =>
                onEdit(
                  detailDoctor,
                )
              }
            >
              Cập nhật
            </Button>
          ) : null}

          <Button
            type="primary"
            icon={
              <X className="h-4 w-4" />
            }
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      }
      onCancel={onClose}
      mask={{
        closable: !loading,
      }}
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      {detailDoctor ? (
        <div className="flex max-h-[78vh] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-[18px] py-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Stethoscope className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <Title
                  level={4}
                  className="!mb-0.5 !text-slate-950"
                >
                  {detailDoctor.name}
                </Title>

                <Text
                  type="secondary"
                  className="mb-2 block"
                >
                  {detailDoctor.title ||
                    "Bác sĩ"}{" "}
                  ·{" "}
                  {detailDoctor.specialty ||
                    "Chưa cập nhật chuyên khoa"}
                </Text>

                <Space size={8} wrap>
                  {renderStatus(
                    detailDoctor.status,
                  )}

                  <Tag color="blue">
                    {detailDoctor.licenseNo ||
                      "Chưa có giấy phép"}
                  </Tag>
                </Space>
              </div>
            </div>

            <Button
              type="text"
              shape="circle"
              aria-label="Đóng"
              title="Đóng"
              icon={
                <X className="h-5 w-5" />
              }
              className="shrink-0"
              onClick={onClose}
            />
          </div>

          <div className="min-h-0 overflow-y-auto px-[18px] py-4 pr-3">
            {error ? (
              <Alert
                type="error"
                title={error}
                showIcon
                className="mb-4"
              />
            ) : null}

            <Descriptions
              bordered
              column={2}
              size="small"
              styles={{
                label: {
                  width: 145,
                  fontWeight: 600,
                },
                content: {
                  minWidth: 0,
                },
              }}
            >
              <Descriptions.Item
                label="Mã bác sĩ"
              >
                {detailDoctor.id}
              </Descriptions.Item>

              <Descriptions.Item
                label="Staff ID"
              >
                {detailDoctor.staffId ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Họ và tên"
              >
                <Space size={6}>
                  <UserRound className="h-4 w-4 text-slate-400" />
                  {detailDoctor.name}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Mã nhân viên"
              >
                {detailDoctor.employeeCode ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Email công việc"
              >
                <Space size={6}>
                  <Mail className="h-4 w-4 text-slate-400" />
                  {detailDoctor.email ||
                    "Chưa cập nhật"}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Email cá nhân"
              >
                {detailDoctor.personalEmail ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Số điện thoại"
              >
                <Space size={6}>
                  <Phone className="h-4 w-4 text-slate-400" />
                  {detailDoctor.phone ||
                    "Chưa cập nhật"}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Cơ sở làm việc"
              >
                {facilityName}
              </Descriptions.Item>

              <Descriptions.Item
                label="Giấy phép hành nghề"
              >
                {detailDoctor.licenseNo ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Học hàm / chức danh"
              >
                {detailDoctor.title ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Chuyên khoa"
              >
                {detailDoctor.specialty ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Mức kinh nghiệm"
              >
                {getExperienceLabel(
                  detailDoctor.yearsOfExperience,
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label="Loại phòng làm việc"
              >
                {roomTypeName}
              </Descriptions.Item>

              <Descriptions.Item
                label="Trạng thái bác sĩ"
              >
                {renderStatus(
                  detailDoctor.status,
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label="Trạng thái nhân sự"
                span={2}
              >
                {renderStatus(
                  detailDoctor.staffStatus,
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label="Địa chỉ"
                span={2}
              >
                <Space
                  size={6}
                  align="start"
                >
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                  {detailDoctor.address ||
                    "Chưa cập nhật"}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Giới thiệu chuyên môn"
                span={2}
              >
                {detailDoctor.bio ||
                  "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Ngày tạo"
              >
                <Space size={6}>
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {formatDateTime(
                    detailDoctor.createdAt,
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item
                label="Cập nhật lần cuối"
              >
                <Space size={6}>
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {formatDateTime(
                    detailDoctor.updatedAt,
                  )}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
