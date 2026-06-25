import { PregnantProfile } from "@/features/profile/profile.types";
import { displayValue } from "@/utils/profile/utils";
import { Card, Descriptions } from "antd";
import type { DescriptionsProps } from "antd";
import { Activity, ShieldCheck } from "lucide-react";


type CareTrackingCardProps = {
  profile: PregnantProfile;
};

export function CareTrackingCard({ profile }: CareTrackingCardProps) {
  const isActive = profile.status === 1;

  const items: DescriptionsProps["items"] = [
    {
      key: "gestationalWeek",
      label: "Tuần thai hiện tại",
      children: displayValue(profile.gestationalWeek),
    },
    {
      key: "expectedDueDate",
      label: "Ngày dự sinh",
      children: displayValue(profile.expectedDueDate),
    },
    {
      key: "bloodType",
      label: "Nhóm máu",
      children: displayValue(profile.bloodType),
    },
    {
      key: "lastCheckupAt",
      label: "Lần khám gần nhất",
      children: displayValue(profile.lastCheckupAt),
    },
    {
      key: "status",
      label: "Trạng thái tài khoản",
      children: (
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          {isActive ? "Đang hoạt động" : "Tạm khóa"}
        </div>
      ),
    },
  ];

  return (
    <Card
      className="h-full border-0 shadow-sm"
      title={
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-500" />
          <span>Theo dõi chăm sóc</span>
        </div>
      }
    >
      <Descriptions column={1} size="small" items={items} />
    </Card>
  );
}