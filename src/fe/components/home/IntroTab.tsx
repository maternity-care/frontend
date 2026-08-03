"use client";

import Link from "next/link";
import { ArrowRight, HeartPulse } from "lucide-react";
import {
  CalendarCheck,
  FileHeart,
  Hospital,
  ShieldCheck,
} from "lucide-react";
import { Button, Card, Col, Row, Typography } from "antd";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import useSetting from "@/hooks/useSetting";

const { Title, Paragraph, Text } = Typography;

const highlights = [
  {
    title: "Không quên mốc khám",
    description:
      "Nhắc lịch khám, tái khám và lịch uống thuốc theo hồ sơ thai sản.",
    icon: CalendarCheck,
  },
  {
    title: "Hồ sơ tập trung",
    description:
      "Lưu kết quả khám, siêu âm, xét nghiệm và đơn thuốc theo timeline.",
    icon: FileHeart,
  },
  {
    title: "Đặt lịch rõ ràng",
    description: "Chọn cơ sở trước, sau đó chọn dịch vụ, bác sĩ và khung giờ.",
    icon: Hospital,
  },
  {
    title: "Bảo mật dữ liệu",
    description:
      "Hồ sơ thai sản chỉ hiển thị với người dùng có quyền truy cập.",
    icon: ShieldCheck,
  },
];

export function IntroTab() {
  const { getOrDefault } = useSetting();

  const badge = getOrDefault(
    "home_badge",
    RESPONSE_MESSAGES.HOME?.HERO?.DEFAULT_BADGE ?? "Maternity Care System"
  );
  const title = getOrDefault(
    "hero_title",
    RESPONSE_MESSAGES.HOME?.HERO?.DEFAULT_TITLE ??
      "Chăm sóc thai kỳ dễ dàng hơn trong một nền tảng duy nhất"
  );
  const description = getOrDefault(
    "hero_description",
    RESPONSE_MESSAGES.HOME?.HERO?.DEFAULT_DESCRIPTION ??
      "Theo dõi hồ sơ thai sản, đặt lịch khám, xem kết quả siêu âm/xét nghiệm và nhận nhắc lịch quan trọng cùng MCS."
  );

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pink-50 via-rose-50 to-white px-6 py-12 shadow-sm ring-1 ring-pink-100 md:px-10 lg:px-14">
        <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-pink-700 shadow-sm ring-1 ring-pink-100">
            <HeartPulse className="h-4 w-4" />
            {badge}
          </div>

          <Title
            level={1}
            className="!mb-4 !text-4xl !font-bold !leading-tight !text-slate-950 md:!text-5xl"
          >
            {title}
          </Title>

          <Paragraph className="!mb-0 max-w-2xl !text-base !leading-7 !text-slate-600">
            {description}
          </Paragraph>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register">
              <Button
                type="primary"
                size="large"
                className="!h-12 !rounded-full !bg-pink-500 !px-7 !font-semibold !shadow-md !shadow-pink-200"
              >
                {RESPONSE_MESSAGES.AUTH?.REGISTER_NOW ?? "Đăng ký ngay"}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="large"
                className="!h-12 !rounded-full !border-pink-200 !px-7 !font-semibold !text-pink-600 hover:!border-pink-400"
              >
                {RESPONSE_MESSAGES.AUTH?.LOGIN ?? "Đăng nhập"}
              </Button>
            </Link>
          </div>

          {/* Stats nhẹ */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { value: "100+", label: "người dùng đồng thời" },
              { value: "24h", label: "nhắc lịch khám" },
              { value: "1 nơi", label: "lưu hồ sơ thai sản" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/80 p-4 ring-1 ring-pink-100"
              >
                <Text className="!text-2xl !font-bold !text-pink-600">
                  {item.value}
                </Text>
                <p className="mt-1 text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Giới thiệu ngắn */}
      <section className="mx-auto max-w-3xl text-center">
        <Title level={2} className="!mb-4 !text-slate-950">
          Hệ thống chăm sóc thai kỳ toàn diện
        </Title>
        <Paragraph className="!text-base !leading-7 !text-slate-600">
          Maternity Care System giúp mẹ bầu theo dõi hồ sơ thai sản, đặt lịch
          khám, xem kết quả siêu âm & xét nghiệm và nhận nhắc lịch quan trọng
          trên một nền tảng duy nhất. Chúng tôi đồng hành cùng bạn trong từng
          giai đoạn của hành trình làm mẹ.
        </Paragraph>
      </section>

      {/* 4 điểm mạnh */}
      <section>
        <Row gutter={[16, 16]}>
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <Col xs={24} sm={12} lg={6} key={item.title}>
                <Card className="h-full !rounded-3xl !border-pink-100 hover:!shadow-md hover:!shadow-pink-100 transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Title level={4} className="!mb-2 !text-slate-950">
                    {item.title}
                  </Title>
                  <Paragraph className="!mb-0 !text-sm !leading-6 !text-slate-600">
                    {item.description}
                  </Paragraph>
                </Card>
              </Col>
            );
          })}
        </Row>
      </section>
    </div>
  );
}