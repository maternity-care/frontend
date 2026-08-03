"use client";

import { useEffect, useState } from "react";
import { Row, Col, Empty, Spin, Alert } from "antd";
import PregnancyProfileCard from "./PregnancyProfileCard";
import { ApiClientError } from "@/lib/axios";
import { getMyPregnancyProfiles } from "@/management/features/pregnancy-profile/pregnancy-profile.api";
import { PregnancyProfile } from "@/management/features/pregnancy-profile/pregnancy-profiles.types";

export default function PregnancyProfileList() {
  const [data, setData] = useState<PregnancyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getMyPregnancyProfiles();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Không thể tải hồ sơ thai. Vui lòng thử lại sau.";
          setError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Lỗi tải dữ liệu"
        description={error}
        showIcon
      />
    );
  }

  if (data.length === 0) {
    return <Empty description="Bạn chưa có hồ sơ thai kỳ nào" />;
  }

  return (
    <Row gutter={[16, 16]}>
      {data.map((item) => (
        <Col key={item.id} xs={24} sm={24} md={12} lg={12} xl={8}>
          <PregnancyProfileCard
            profile={item}
            href={`/pregnancy-profiles/${item.id}`}
          />
        </Col>
      ))}
    </Row>
  );
}