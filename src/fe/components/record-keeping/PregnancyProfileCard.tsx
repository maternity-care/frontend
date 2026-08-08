"use client";

import { PregnancyProfile } from "@/management/features/pregnancy-profile/pregnancy-profiles.types";
import { Card, Tag, Typography, Space, Descriptions } from "antd";
import dayjs from "dayjs";
import Link from "next/link";

const { Text } = Typography;

interface PregnancyProfileCardProps {
  profile: PregnancyProfile;
  href?: string;
}

const statusColorMap: Record<string, string> = {
  active: "green",
  ACTIVE: "green",
  completed: "blue",
  terminated: "orange",
  deleted: "red",
};

const statusLabelMap: Record<string, string> = {
  active: "Đang hoạt động",
  ACTIVE: "Đang hoạt động",
  completed: "Hoàn thành",
  terminated: "Đã chấm dứt",
  deleted: "Đã xóa",
};

const riskColorMap: Record<string, string> = {
  low: "success",
  medium: "warning",
  high: "error",
};

const riskLabelMap: Record<string, string> = {
  low: "Nguy cơ thấp",
  medium: "Nguy cơ trung bình",
  high: "Nguy cơ cao",
};

export default function PregnancyProfileCard({
  profile,
  href,
}: PregnancyProfileCardProps) {
  const content = (
    <Card
      hoverable={Boolean(href)}
      title={
        <Space>
          <Text strong>{profile.code ?? "Hồ sơ thai"}</Text>
          {profile.status && (
            <Tag color={statusColorMap[profile.status] ?? "default"}>
              {statusLabelMap[profile.status] ?? profile.status}
            </Tag>
          )}
        </Space>
      }
      extra={
        profile.riskLevel ? (
          <Tag color={riskColorMap[profile.riskLevel] ?? "default"}>
            {riskLabelMap[profile.riskLevel] ?? profile.riskLevel}
          </Tag>
        ) : null
      }
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="LMP">
          {profile.lastMenstrualPeriod
            ? dayjs(profile.lastMenstrualPeriod).format("DD/MM/YYYY")
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Dự sinh">
          {profile.expectedDueDate
            ? dayjs(profile.expectedDueDate).format("DD/MM/YYYY")
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Gravida / Para">
          G{profile.gravida ?? 0} / P{profile.paraFullTerm ?? 0}
          {profile.paraPremature
            ? ` (${profile.paraPremature} premature)`
            : ""}
        </Descriptions.Item>
        {profile.notes ? (
          <Descriptions.Item label="Ghi chú">{profile.notes}</Descriptions.Item>
        ) : null}
      </Descriptions>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}