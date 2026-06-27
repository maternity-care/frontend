"use client";

import { Descriptions, Tag } from "antd";
import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";

import type { UserProfile } from "@/features/profile/profile.types";
import { formatDateTime, getRoleText, getStatusText } from "@/utils/profile/utils";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

type PersonalInfoViewProps = {
  profile: UserProfile;
};

export function PersonalInfoView({ profile }: PersonalInfoViewProps) {
  const isActive = profile.status === 1;

  return (
    <Descriptions column={1} size="middle">
      <Descriptions.Item label="Họ và tên">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-950">{profile.name}</span>
        </div>
      </Descriptions.Item>

      <Descriptions.Item label="Email">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-950">{profile.email}</span>
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

      <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.CREATED_AT}>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {formatDateTime(profile.createdAt)}
        </div>
      </Descriptions.Item>

      <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.UPDATED_AT}>
        {formatDateTime(profile.updatedAt)}
      </Descriptions.Item>
    </Descriptions>
  );
}