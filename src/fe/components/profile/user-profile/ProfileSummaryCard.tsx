import { Avatar, Badge, Card, Divider, Tag } from "antd";
import { Baby } from "lucide-react";

import { InfoIconBox } from "./InfoIconBox";
import { PregnantProfile } from "@/features/profile/profile.types";
import { displayValue, EMPTY_TEXT, getInitials, getRoleText } from "@/utils/profile/utils";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

type ProfileSummaryCardProps = {
  profile: PregnantProfile;
};

export function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  const isActive = profile.status === 1;
  const roleText = getRoleText(profile.roles);

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className="-mx-6 -mt-6 h-28 bg-gradient-to-r from-pink-100 via-rose-50 to-teal-50" />

      <div className="-mt-12 flex flex-col items-center text-center">
        <Badge status={isActive ? "success" : "default"} offset={[-8, 78]}>
          <Avatar
            size={96}
            className="border-4 border-white bg-pink-100 text-xl font-semibold text-pink-600 shadow-sm"
          >
            {getInitials(profile.name)}
          </Avatar>
        </Badge>

        <h2 className="mt-4 text-xl font-semibold text-slate-950">
          {profile.name || EMPTY_TEXT}
        </h2>

        <p className="mt-1 text-sm text-slate-500">{profile.email}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Tag color={isActive ? "success" : "default"}>
            {isActive ? "Đang hoạt động" : "Tạm khóa"}
          </Tag>

          <Tag color="pink">{roleText}</Tag>
        </div>
      </div>

      <Divider />

      <div className="rounded-2xl bg-pink-50 p-4">
        <div className="flex items-center gap-3">
          <InfoIconBox tone="pink">
            <Baby className="h-5 w-5" />
          </InfoIconBox>

          <div>
            <p className="text-sm font-medium text-slate-950">{RESPONSE_MESSAGES.SCHEDULE.Pregnancy_records}</p>
            <p className="text-xs text-slate-500">
              {RESPONSE_MESSAGES.PROFILE.FOLLOW_MOM_AND_BABY}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-slate-500">Tuần thai</p>
            <p className="mt-1 font-semibold text-slate-950">
              {displayValue(profile.gestationalWeek)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-slate-500">Nhóm máu</p>
            <p className="mt-1 font-semibold text-slate-950">
              {displayValue(profile.bloodType)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}