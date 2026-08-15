"use client";

import { Descriptions, Divider, Empty, Tag } from "antd";
import {
  Baby,
  Building2,
  CalendarDays,
  CreditCard,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

import type { PregnantProfile } from "@/features/profile/profile.types";
import {
  displayValue,
  formatDateTime,
  getRoleText,
  getStatusText,
} from "@/utils/profile/utils";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

type PersonalInfoViewProps = {
  profile: PregnantProfile;
};

const getPregnancyStatus = (status?: string | null) => {
  switch (status) {
    case "active":
      return {
        text: "Đang mang thai",
        color: "success",
      };
    case "completed":
      return {
        text: "Đã hoàn thành",
        color: "blue",
      };
    case "terminated":
      return {
        text: "Đã kết thúc",
        color: "orange",
      };
    case "deleted":
      return {
        text: "Đã xóa",
        color: "default",
      };
    default:
      return {
        text: displayValue(status),
        color: "default",
      };
  }
};

const getRiskLevel = (riskLevel?: string | null) => {
  switch (riskLevel) {
    case "low":
      return {
        text: "Thấp",
        color: "success",
      };
    case "medium":
      return {
        text: "Trung bình",
        color: "warning",
      };
    case "high":
      return {
        text: "Cao",
        color: "error",
      };
    default:
      return {
        text: displayValue(riskLevel),
        color: "default",
      };
  }
};

export function PersonalInfoView({
  profile,
}: PersonalInfoViewProps) {
  const isActive = profile.status === "active";

  const fullAddress = [
    profile.address,
    profile.ward,
    profile.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Thông tin cá nhân */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <UserRound className="h-4 w-4 text-pink-500" />
          Thông tin cá nhân
        </h3>

        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="middle"
          bordered={false}
        >
          <Descriptions.Item label="Mã người dùng">
            <span className="font-medium text-slate-950">
              {displayValue(profile.id)}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Họ và tên">
            <span className="font-medium text-slate-950">
              {displayValue(profile.name)}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="CCCD">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span>{displayValue(profile.cccd)}</span>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày sinh">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <span>{displayValue(profile.dateOfBirth)}</span>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Email">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="break-all">
                {displayValue(profile.email)}
              </span>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Số điện thoại">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{displayValue(profile.phone)}</span>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Mức ưu tiên">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />

              {profile.priorityLevel != null ? (
                <Tag color="gold">
                  Cấp {profile.priorityLevel}
                </Tag>
              ) : (
                displayValue(null)
              )}
            </div>
          </Descriptions.Item>

          <Descriptions.Item
            label={RESPONSE_MESSAGES.COMMON.STATUS}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <Tag color={isActive ? "success" : "default"}>
                {getStatusText(profile.status)}
              </Tag>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </section>

      <Divider className="my-4" />

      {/* Địa chỉ */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapPin className="h-4 w-4 text-pink-500" />
          Thông tin địa chỉ
        </h3>

        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="middle"
        >
          <Descriptions.Item label="Địa chỉ">
            {displayValue(profile.address)}
          </Descriptions.Item>

          <Descriptions.Item label="Phường/Xã">
            {displayValue(profile.ward)}
          </Descriptions.Item>

          <Descriptions.Item label="Tỉnh/Thành phố">
            {displayValue(profile.province)}
          </Descriptions.Item>

          <Descriptions.Item label="Địa chỉ đầy đủ">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{displayValue(fullAddress)}</span>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </section>

      <Divider className="my-4" />

      {/* Danh sách hồ sơ thai kỳ */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Baby className="h-4 w-4 text-pink-500" />
            Hồ sơ thai kỳ
          </h3>

          <Tag color="pink">
            {profile.pregnancyProfiles?.length ?? 0} hồ sơ
          </Tag>
        </div>

        {profile.pregnancyProfiles?.length ? (
          <div className="space-y-4">
            {profile.pregnancyProfiles.map(
              (pregnancyProfile, index) => {
                const pregnancyStatus = getPregnancyStatus(
                  pregnancyProfile.status,
                );

                const riskLevel = getRiskLevel(
                  pregnancyProfile.riskLevel,
                );

                return (
                  <div
                    key={pregnancyProfile.id}
                    className="rounded-xl border border-pink-100 bg-pink-50/50 p-4"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {pregnancyProfile.code ||
                            `Hồ sơ thai kỳ ${index + 1}`}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Mã hồ sơ:{" "}
                          {displayValue(pregnancyProfile.id)}
                        </p>
                      </div>

                      <Tag color={pregnancyStatus.color}>
                        {pregnancyStatus.text}
                      </Tag>
                    </div>

                    <Descriptions
                      column={{ xs: 1, sm: 2 }}
                      size="small"
                    >
                      <Descriptions.Item label="Ngày đầu kỳ kinh cuối">
                        {displayValue(
                          pregnancyProfile.lastMenstrualPeriod,
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Ngày dự sinh">
                        {displayValue(
                          pregnancyProfile.expectedDueDate,
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Số thai">
                        {displayValue(
                          pregnancyProfile.fetalCount,
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Mức độ nguy cơ">
                        <Tag color={riskLevel.color}>
                          {riskLevel.text}
                        </Tag>
                      </Descriptions.Item>

                      <Descriptions.Item label="Số lần mang thai">
                        {displayValue(pregnancyProfile.gravida)}
                      </Descriptions.Item>

                      <Descriptions.Item label="Số lần sinh">
                        {displayValue(pregnancyProfile.paraPremature + pregnancyProfile.paraFullTerm)}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 py-6">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có hồ sơ thai kỳ"
            />
          </div>
        )}
      </section>

      <Divider className="my-4" />

      {/* Liên hệ khẩn cấp */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <HeartHandshake className="h-4 w-4 text-pink-500" />
          Liên hệ khẩn cấp
        </h3>

        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          size="middle"
        >
          <Descriptions.Item label="Họ và tên">
            {displayValue(profile.emergencyContactName)}
          </Descriptions.Item>

          <Descriptions.Item label="Số điện thoại">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              {displayValue(profile.emergencyContactPhone)}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </section>

      <Divider className="my-4" />
    </div>
  );
}