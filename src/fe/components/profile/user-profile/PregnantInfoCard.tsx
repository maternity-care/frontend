import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { PregnantProfile } from "@/features/profile/profile.types";
import { displayValue } from "@/utils/profile/utils";
import { Card, Descriptions } from "antd";
import type { DescriptionsProps } from "antd";
import { CalendarDays, HeartPulse, Phone } from "lucide-react";


type PregnantInfoCardProps = {
  profile: PregnantProfile;
};

export function PregnantInfoCard({ profile }: PregnantInfoCardProps) {
  const items: DescriptionsProps["items"] = [
    {
      key: "phone",
      label: "Số điện thoại",
      children: (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" />
          {displayValue(profile.phone)}
        </div>
      ),
    },
    {
      key: "dateOfBirth",
      label: "Ngày sinh",
      children: (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {displayValue(profile.dateOfBirth)}
        </div>
      ),
    },
    {
      key: "address",
      label: "Địa chỉ",
      children: displayValue(profile.address),
    },
    {
      key: "emergencyContactName",
      label: "Liên hệ khẩn cấp",
      children: displayValue(profile.emergencyContactName),
    },
    {
      key: "emergencyContactPhone",
      label: "SĐT khẩn cấp",
      children: displayValue(profile.emergencyContactPhone),
    },
  ];

  return (
    <Card
      className="h-full border-0 shadow-sm"
      title={
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-rose-500" />
          <span>{RESPONSE_MESSAGES.PROFILE.PREGNANT_INFO}</span>
        </div>
      }
    >
      <Descriptions column={1} size="small" items={items} />
    </Card>
  );
}