"use client";

import { Descriptions, Tag, Divider } from "antd";
import {
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  MapPin,
  Droplets,
  Baby,
  HeartHandshake,
} from "lucide-react";

import type { PregnantProfile } from "@/features/profile/profile.types";
import { formatDateTime, getRoleText, getStatusText, displayValue } from "@/utils/profile/utils";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

type PersonalInfoViewProps = {
  profile: PregnantProfile;
};

export function PersonalInfoView({ profile }: PersonalInfoViewProps) {
  const isActive = profile.status === "active";

  return (
    <div className="space-y-6">
      {/* Thông tin cá nhân */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <UserRound className="h-4 w-4 text-pink-500" />
          Thông tin cá nhân
        </h3>
        <Descriptions column={1} size="middle" bordered={false}>
          <Descriptions.Item label="Họ và tên">
            <span className="font-medium text-slate-950">{profile.name}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Email">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-950">{profile.email}</span>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Số điện thoại">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-950">
                {displayValue(profile.phone)}
              </span>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày sinh">
            {displayValue(profile.dateOfBirth)}
          </Descriptions.Item>

          <Descriptions.Item label="Địa chỉ">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <span>{displayValue(profile.address)}</span>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.ROLE}>
            {getRoleText(profile.roles)}
          </Descriptions.Item>

          <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.STATUS}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <Tag color={isActive ? "success" : "default"}>
                {getStatusText(profile.status)}
              </Tag>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider className="my-4" />

      {/* Thông tin thai kỳ */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Baby className="h-4 w-4 text-pink-500" />
          Thông tin thai kỳ
        </h3>
        <Descriptions column={1} size="middle">
          <Descriptions.Item label="Tuần thai">
            <span className="font-semibold text-pink-600">
              {displayValue(profile.gestationalWeek)}
              {profile.gestationalWeek ? " tuần" : ""}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày dự sinh">
            {displayValue(profile.expectedDueDate)}
          </Descriptions.Item>

          <Descriptions.Item label="Nhóm máu">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-red-400" />
              {displayValue(profile.bloodType)}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider className="my-4" />

      {/* Liên hệ khẩn cấp */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <HeartHandshake className="h-4 w-4 text-pink-500" />
          Liên hệ khẩn cấp
        </h3>
        <Descriptions column={1} size="middle">
          <Descriptions.Item label="Họ tên">
            {displayValue(profile.emergencyContactName)}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {displayValue(profile.emergencyContactPhone)}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Divider className="my-4" />

      {/* Hệ thống */}
      <Descriptions column={1} size="small">
        <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.CREATED_AT}>
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays className="h-4 w-4" />
            {formatDateTime(profile.createdAt)}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.UPDATED_AT}>
          {formatDateTime(profile.updatedAt)}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
}