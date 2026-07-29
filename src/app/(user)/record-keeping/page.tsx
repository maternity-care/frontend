"use client";

import { useEffect, useState } from "react";
import { Alert, App, Spin, Typography } from "antd";

import type { PregnancyProfile } from "@/features/pregnancy-profiles/pregnancy-profiles.types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PatientInfoCard } from "@/fe/components/records/pregnancy-profile/PatientInfoCard";
import { PregnancySummaryCard } from "@/fe/components/records/pregnancy-profile/PregnancySummaryCard";
import { MedicalRecordsHistory } from "@/fe/components/records/pregnancy-profile/MedicalRecordsHistory";
import { getMyPregnancyProfileById } from "@/features/pregnancy-profiles/pregnancy-profiles.api";

const { Title, Text } = Typography;

type LoadStatus = "pending" | "success" | "error";

export default function RecordKeepingPage() {
  const { message } = App.useApp();
  const { user } = useCurrentUser();
  const userId = user?.id ? String(user.id) : null;

  const [detail, setDetail] = useState<PregnancyProfile | null>(null);
  const [status, setStatus] = useState<LoadStatus>("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    void getMyPregnancyProfileById(userId)
      .then((data) => {
        if (cancelled) return;
        console.log("Loaded pregnancy profile:", data);
        setDetail(data);
        setError(null);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("Failed to load pregnancy profile:", err);
        const msg =
          err instanceof Error
            ? err.message
            : "Không tải được hồ sơ thai kỳ";
        setDetail(null);
        setError(msg);
        setStatus("error");
        message.error(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, message]);

  if (!userId) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={3}>Hồ sơ thai phụ</Title>
        <Alert
          type="warning"
          showIcon
          title="Chưa đăng nhập"
          description="Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại."
        />
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin size="large" description="Đang tải hồ sơ..." />
      </div>
    );
  }

  if (status === "error" || !detail) {
    return (
      <div style={{ padding: 24 }}>
        <Title level={3}>Hồ sơ thai phụ</Title>
        <Alert
          type="info"
          showIcon
          title="Chưa có hồ sơ thai kỳ"
          description={
            error || "Không tìm thấy hồ sơ thai kỳ cho tài khoản này."
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Hồ sơ thai phụ
        </Title>
        <Text type="secondary">
          Xem thông tin thai kỳ và lịch sử khám (chỉ xem)
        </Text>
      </div>

      <PatientInfoCard profile={detail} />
      <PregnancySummaryCard profile={detail} />
      <MedicalRecordsHistory
        medicalRecords={detail.medicalRecords ?? []}
        loading={false}
      />
    </div>
  );
}