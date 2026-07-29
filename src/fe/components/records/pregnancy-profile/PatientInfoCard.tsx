"use client";

import { Card, Descriptions, Tag, Typography } from "antd";
import type { PregnancyProfile } from "@/features/pregnancy-profiles/pregnancy-profiles.types";

const { Text } = Typography;

interface Props {
  profile: PregnancyProfile | null;
}

export function PatientInfoCard({ profile }: Props) {
  const user = profile?.user;

  return (
    <Card title="Thông tin thai phụ" style={{ marginBottom: 20 }}>
      <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
        <Descriptions.Item label="Mã bệnh nhân">
          {profile?.patientId || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Mã hồ sơ">
          {profile?.code || profile?.id || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Họ tên">
          {user?.name || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {user?.phone || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {user?.email || "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày sinh">
          {user?.dateOfBirth
            ? new Intl.DateTimeFormat("vi-VN").format(new Date(user.dateOfBirth))
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Địa chỉ" span={2}>
          {[user?.address, user?.ward, user?.province].filter(Boolean).join(", ") ||
            "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Liên hệ khẩn cấp" span={2}>
          {user?.emergencyContactName || "—"}
          {user?.emergencyContactPhone ? ` – ${user.emergencyContactPhone}` : ""}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái hồ sơ">
          <Tag color={profile?.status?.toLowerCase() === "active" ? "green" : "default"}>
            {profile?.status || "—"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mức nguy cơ">
          <Text>{profile?.riskLevel || "—"}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}