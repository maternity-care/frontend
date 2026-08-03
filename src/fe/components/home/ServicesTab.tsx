"use client";

import Link from "next/link";
import { Baby, CalendarCheck, FileHeart, Stethoscope } from "lucide-react";
import { Button, Card, Col, Row, Typography } from "antd";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Title, Paragraph } = Typography;

const services = [
  {
    title: "Khám thai định kỳ",
    description: "Theo dõi sức khỏe mẹ và bé theo từng giai đoạn thai kỳ.",
    icon: Stethoscope,
  },
  {
    title: "Siêu âm thai",
    description: "Lưu trữ hình ảnh, kết quả siêu âm và lịch sử thăm khám.",
    icon: Baby,
  },
  {
    title: "Xét nghiệm thai kỳ",
    description: "Quản lý kết quả xét nghiệm và hồ sơ y tế tập trung.",
    icon: FileHeart,
  },
  {
    title: "Nhắc lịch chăm sóc",
    description: "Tự động nhắc lịch khám, tái khám và lịch uống thuốc.",
    icon: CalendarCheck,
  },
];

export function ServicesTab() {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <Title level={2} className="!mb-3 !text-slate-950">
          Dịch vụ chăm sóc thai kỳ
        </Title>
        <Paragraph className="mx-auto max-w-2xl !text-base !leading-7 !text-slate-600">
          Các dịch vụ được thiết kế để hỗ trợ mẹ bầu theo dõi sức khỏe toàn
          diện, từ khám định kỳ đến siêu âm, xét nghiệm và nhắc lịch.
        </Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Col xs={24} md={12} lg={6} key={service.title}>
              <Card className="h-full !rounded-3xl !border-pink-100 hover:!shadow-lg hover:!shadow-pink-100 transition-shadow">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                  <Icon className="h-7 w-7" />
                </div>
                <Title level={4} className="!mb-2 !text-slate-950">
                  {service.title}
                </Title>
                <Paragraph className="!mb-6 !text-sm !leading-6 !text-slate-600">
                  {service.description}
                </Paragraph>
                <Link href="/login">
                  <Button
                    type="link"
                    className="!px-0 !font-semibold !text-pink-600"
                  >
                    {RESPONSE_MESSAGES.HOME?.SERVICES_SECTION
                      ?.BOOK_THIS_SERVICE ?? "Đặt lịch dịch vụ này"}
                  </Button>
                </Link>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}