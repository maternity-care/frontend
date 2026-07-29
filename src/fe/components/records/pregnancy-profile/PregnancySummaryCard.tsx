"use client";

import { Card, Descriptions, Typography } from "antd";
import type { PregnancyProfile } from "@/features/pregnancy-profiles/pregnancy-profiles.types";

const { Paragraph } = Typography;

interface Props {
  profile: PregnancyProfile | null;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN").format(d);
}

export function PregnancySummaryCard({ profile }: Props) {
  if (!profile) return null;

  return (
    <Card title="Thông tin thai kỳ" style={{ marginBottom: 20 }}>
      <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
        <Descriptions.Item label="Ngày đầu kỳ kinh cuối">
          {formatDate(profile.lastMenstrualPeriod)}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày dự sinh">
          {formatDate(profile.expectedDueDate)}
        </Descriptions.Item>
        <Descriptions.Item label="Số thai">
          {profile.fetalCount ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Số lần mang thai (G)">
          {profile.gravida}
        </Descriptions.Item>
        <Descriptions.Item label="Sinh đủ tháng (P)">
          {profile.paraFullTerm}
        </Descriptions.Item>
        <Descriptions.Item label="Sinh non">
          {profile.paraPremature}
        </Descriptions.Item>
        <Descriptions.Item label="Sảy/phá thai">
          {profile.paraAbortion}
        </Descriptions.Item>
        <Descriptions.Item label="Con đang sống">
          {profile.paraLivingChildren}
        </Descriptions.Item>
      </Descriptions>

      {profile.notes ? (
        <div style={{ marginTop: 16 }}>
          <Paragraph strong style={{ marginBottom: 4 }}>
            Ghi chú chuyên môn
          </Paragraph>
          <Paragraph
            style={{
              margin: 0,
              padding: 12,
              background: "#fafafa",
              borderRadius: 8,
              whiteSpace: "pre-wrap",
            }}
          >
            {profile.notes}
          </Paragraph>
        </div>
      ) : null}
    </Card>
  );
}