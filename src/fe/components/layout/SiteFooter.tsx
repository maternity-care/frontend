"use client";

import Link from "next/link";
import {
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Col, Divider, Row, Typography } from "antd";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";


const { Title, Paragraph, Text } = Typography;

const quickLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Gói thai sản", href: "/login" },
  { label: "Dịch vụ", href: "/login" },
  { label: "Bác sĩ", href: "/login" },
  { label: "FAQ", href: "/login" },
];

const services = [
  { label: "Khám thai định kỳ", href: "/login" },
  { label: "Siêu âm thai", href: "/login" },
  { label: "Xét nghiệm thai kỳ", href: "/login" },
  { label: "Theo dõi hồ sơ thai sản", href: "/login" },
  { label: "Nhắc lịch khám", href: "/login" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-pink-100 bg-gradient-to-br from-white via-pink-50/70 to-rose-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10} lg={8}>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-md shadow-pink-200">
                <HeartPulse className="h-6 w-6" />
              </div>

              <div>
                <Title level={4} className="!mb-0 !text-slate-950">
                  {RESPONSE_MESSAGES.FOOTER.BRAND_NAME}
                </Title>
                <Text className="!text-sm !text-pink-600">
                  {RESPONSE_MESSAGES.FOOTER.SLOGAN}
                </Text>
              </div>
            </Link>

            <Paragraph className="!mt-5 !max-w-sm !text-sm !leading-6 !text-slate-600">
              {RESPONSE_MESSAGES.FOOTER.DESCRIPTION}
            </Paragraph>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#"
                aria-label={RESPONSE_MESSAGES.FOOTER.SOCIAL.FACEBOOK}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pink-600 ring-1 ring-pink-100 transition hover:bg-pink-500 hover:text-white"
              >
                {/* <Facebook className="h-5 w-5" /> */}
              </a>

              <a
                href="mailto:support@mcs.vn"
                aria-label={RESPONSE_MESSAGES.FOOTER.SOCIAL.EMAIL}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pink-600 ring-1 ring-pink-100 transition hover:bg-pink-500 hover:text-white"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </Col>

          <Col xs={24} sm={12} md={7} lg={5}>
            <Title level={5} className="!mb-4 !text-slate-950">
              {RESPONSE_MESSAGES.FOOTER.QUICK_LINKS_TITLE}
            </Title>

            <div className="grid gap-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-slate-600 transition hover:text-pink-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </Col>

          <Col xs={24} sm={12} md={7} lg={5}>
            <Title level={5} className="!mb-4 !text-slate-950">
              {RESPONSE_MESSAGES.FOOTER.SERVICES_TITLE}
            </Title>

            <div className="grid gap-3">
              {services.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-slate-600 transition hover:text-pink-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </Col>

          <Col xs={24} lg={6}>
            <Title level={5} className="!mb-4 !text-slate-950">
              {RESPONSE_MESSAGES.FOOTER.CONTACT_TITLE}
            </Title>

            <div className="grid gap-4 text-sm text-slate-600">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                <span>
                  Số 01, đường Maternity Care, Quận Ninh Kiều, TP. Cần Thơ
                </span>
              </div>

              <div className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                <span>Hotline: 1900 9999</span>
              </div>

              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                <span>Email: support@mcs.vn</span>
              </div>

              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                <span>
                  Hồ sơ thai sản và dữ liệu y tế được bảo vệ theo quyền truy cập.
                </span>
              </div>
            </div>
          </Col>
        </Row>

        <Divider className="!my-8 !border-pink-100" />

        <div className="flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p className="mb-0">
            © {new Date().getFullYear()}{" "}
            {RESPONSE_MESSAGES.FOOTER.COPYRIGHT_SUFFIX}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="text-slate-500 hover:text-pink-600">
              {RESPONSE_MESSAGES.FOOTER.BOTTOM_LINKS.PRIVACY_POLICY}
            </Link>
            <Link href="/login" className="text-slate-500 hover:text-pink-600">
              {RESPONSE_MESSAGES.FOOTER.BOTTOM_LINKS.TERMS}
            </Link>
            <Link href="/login" className="text-slate-500 hover:text-pink-600">
              {RESPONSE_MESSAGES.FOOTER.BOTTOM_LINKS.SUPPORT}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}