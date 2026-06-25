import { PregnantProfile } from "@/features/profile/profile.types";
import { EMPTY_TEXT, getRoleText } from "@/utils/profile/utils";
import { Descriptions, Tag } from "antd";
import { Mail } from "lucide-react";


type PersonalInfoViewProps = {
  profile: PregnantProfile;
};

export function PersonalInfoView({ profile }: PersonalInfoViewProps) {
  const isActive = profile.status === 1;

  return (
    <Descriptions column={1} size="middle">
      <Descriptions.Item label="Họ và tên">
        <span className="font-medium text-slate-950">
          {profile.name || EMPTY_TEXT}
        </span>
      </Descriptions.Item>

      <Descriptions.Item label="Email">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-950">{profile.email}</span>
        </div>
      </Descriptions.Item>

      <Descriptions.Item label="Vai trò">
        {getRoleText(profile.roles)}
      </Descriptions.Item>

      <Descriptions.Item label="Trạng thái">
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Đang hoạt động" : "Tạm khóa"}
        </Tag>
      </Descriptions.Item>
    </Descriptions>
  );
}