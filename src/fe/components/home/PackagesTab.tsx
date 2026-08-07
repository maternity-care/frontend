"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Spin,
  Tag,
  Typography,
} from "antd";
import { CheckCircle2, Hospital, Package } from "lucide-react";

import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { getPublicFacilities } from "@/management/features/facilities/facilities.api";
import type { Facility } from "@/management/features/facilities/facilities.types";
import type { MaternityPackage } from "@/management/features/services/public-service-packages/maternity-packages.types";
import { getPublicMaternityPackages } from "@/management/features/services/public-service-packages/maternity-packages.api";

const { Title, Paragraph, Text } = Typography;

function formatPrice(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return `${num.toLocaleString("vi-VN")}đ`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function PackagesTab() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityId] = useState<string>();
  const [packages, setPackages] = useState<MaternityPackage[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cơ sở
  useEffect(() => {
    setLoadingFacilities(true);
    getPublicFacilities({ status: "active", limit: 50 })
      .then(setFacilities)
      .catch((err) =>
        setError(getErrorMessage(err, "Không tải được danh sách cơ sở.")),
      )
      .finally(() => setLoadingFacilities(false));
  }, []);

  // Chọn cơ sở xong mới load gói
  useEffect(() => {
    setPackages([]);
    setError(null);

    if (!facilityId) return;

    setLoadingPackages(true);
    getPublicMaternityPackages({
      facilityId,
      status: "active",
      limit: 50,
    })
      .then(setPackages)
      .catch((err) =>
        setError(getErrorMessage(err, "Không tải được gói thai sản.")),
      )
      .finally(() => setLoadingPackages(false));
  }, [facilityId]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <Title level={2} className="!mb-3 !text-slate-950">
          Gói thai sản
        </Title>
        <Paragraph className="mx-auto max-w-2xl !text-base !leading-7 !text-slate-600">
          Chọn cơ sở trước để xem các gói chăm sóc thai kỳ đang áp dụng tại cơ
          sở đó.
        </Paragraph>
      </div>

      {/* Chọn cơ sở */}
      <Card
        className="!rounded-3xl !border-pink-100 !shadow-sm"
        styles={{ body: { padding: 20 } }}
      >
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-pink-700">
          <Hospital className="h-4 w-4" />
          Chọn cơ sở
        </div>

        <Select
          size="large"
          showSearch
          className="w-full max-w-xl"
          loading={loadingFacilities}
          placeholder="Chọn cơ sở để xem gói thai sản"
          optionFilterProp="label"
          value={facilityId}
          onChange={setFacilityId}
          options={facilities.map((facility) => ({
            value: facility.id,
            label: `${facility.name}${
              facility.city || facility.address
                ? ` - ${facility.city || facility.address}`
                : ""
            }`,
          }))}
        />
      </Card>

      {error ? (
        <Alert
          type="warning"
          showIcon
          title={error}
          closable
          onClose={() => setError(null)}
        />
      ) : null}

      {/* Danh sách gói */}
      <div className="pt-2">
        {!facilityId ? (
          <Card className="!rounded-3xl !border-dashed !border-pink-200 bg-white/60">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Vui lòng chọn cơ sở để xem gói thai sản"
            />
          </Card>
        ) : loadingPackages ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : packages.length === 0 ? (
          <Card className="!rounded-3xl !border-dashed !border-pink-200 bg-white/60">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Cơ sở này chưa có gói thai sản khả dụng"
            />
          </Card>
        ) : (
          <Row gutter={[24, 24]} className="items-stretch">
            {packages.map((item, index) => {
              const isHighlight = index === 0;
              const benefits =
                item.services?.length > 0
                  ? item.services.map(
                      (s) =>
                        `${s.serviceName}${
                          s.includedQuantity > 1
                            ? ` (x${s.includedQuantity})`
                            : ""
                        }`,
                    )
                  : [];

              return (
                <Col xs={24} md={12} lg={8} key={item.id} className="flex">
                  <Card
                    className={[
                      "w-full !rounded-3xl transition-shadow hover:!shadow-md hover:!shadow-pink-100",
                      isHighlight
                        ? "!border-pink-400 !shadow-lg !shadow-pink-100"
                        : "!border-pink-100",
                    ].join(" ")}
                    styles={{
                      body: {
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        padding: 24,
                      },
                    }}
                  >
                    {/* Tên + tag */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Title
                          level={4}
                          className="!mb-1 !line-clamp-2 !min-h-[3.25rem] !text-slate-950"
                          title={item.name}
                        >
                          {item.name}
                        </Title>
                        {item.code ? (
                          <Text className="!text-xs !text-slate-400">
                            {item.code}
                          </Text>
                        ) : null}
                      </div>
                      <Tag
                        color={isHighlight ? "magenta" : "pink"}
                        className="!m-0 !shrink-0 !rounded-full"
                      >
                        {item.packageType === "schedule"
                          ? "Theo lịch"
                          : "Theo số lượt"}
                      </Tag>
                    </div>

                    {/* Giá */}
                    <div className="mb-3">
                      <Text className="!text-2xl !font-bold !text-pink-600">
                        {formatPrice(item.price)}
                      </Text>
                      <div className="mt-1 text-sm text-slate-500">
                        Thời hạn: {item.durationDays} ngày
                      </div>
                    </div>

                    {/* Mô tả */}
                    <Paragraph className="!mb-4 !line-clamp-3 !min-h-[4.5rem] !text-sm !leading-6 !text-slate-600">
                      {item.description || "Chưa có mô tả chi tiết cho gói này."}
                    </Paragraph>

                    {/* Danh sách dịch vụ */}
                    <div className="mb-6 grid min-h-[6.5rem] content-start gap-2">
                      {benefits.length > 0 ? (
                        benefits.slice(0, 5).map((benefit) => (
                          <div
                            key={benefit}
                            className="flex items-start gap-2 text-sm text-slate-700"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                            <span className="line-clamp-2">{benefit}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-2 text-sm text-slate-400">
                          <Package className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>Chưa có dịch vụ chi tiết</span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="mt-auto">
                      <Link href="/login">
                        <Button
                          type={isHighlight ? "primary" : "default"}
                          block
                          className={[
                            "!h-11 !rounded-xl !font-semibold",
                            isHighlight
                              ? "!bg-pink-500"
                              : "!border-pink-200 !text-pink-600",
                          ].join(" ")}
                        >
                          {RESPONSE_MESSAGES.HOME?.PACKAGES_SECTION
                            ?.REGISTER_PACKAGE ?? "Đăng ký gói"}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </div>
  );
}