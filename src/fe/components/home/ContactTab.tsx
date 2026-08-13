"use client";

import Link from "next/link";
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button, Card, Collapse, Typography } from "antd";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";
import { QuickAppointmentCard } from "@/fe/components/home/QuickAppointmentCard";

const { Title, Paragraph } = Typography;

const faqItems = [
  {
    key: "1",
    label: "Tôi có thể đặt lịch khám khi chưa đăng nhập không?",
    children:
      "Bạn có thể xem thông tin dịch vụ, bác sĩ và gói thai sản. Khi đặt lịch, hệ thống sẽ yêu cầu đăng nhập hoặc đăng ký tài khoản để bảo vệ thông tin cá nhân.",
  },
  {
    key: "2",
    label: "Hệ thống có thay thế việc khám trực tiếp không?",
    children:
      "Không. MCS hỗ trợ quản lý hồ sơ, đặt lịch, nhắc lịch và xem kết quả. Việc thăm khám, chẩn đoán và kê đơn vẫn do bác sĩ thực hiện.",
  },
  {
    key: "3",
    label: "Kết quả siêu âm và xét nghiệm có được lưu trong hệ thống không?",
    children:
      "Có. Kết quả khám, file siêu âm, xét nghiệm và đơn thuốc được lưu trong hồ sơ thai sản và chỉ người có quyền mới được xem.",
  },
];

export function ContactTab() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <Title level={2} className="!mb-3 !text-slate-950">
          Liên hệ & Đặt lịch khám
        </Title>
        <Paragraph className="mx-auto max-w-2xl !text-base !leading-7 !text-slate-600">
          Chọn cơ sở trước, sau đó chọn dịch vụ, bác sĩ và khung giờ trống.
          Bạn cần đăng nhập để hoàn tất đặt lịch.
        </Paragraph>
      </div>

      {/* Form đặt lịch + Thông tin liên hệ */}
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Cột trái: Quick Appointment */}
        <div>
          <QuickAppointmentCard />
        </div>

        {/* Cột phải: Thông tin liên hệ */}
        <Card className="h-fit !rounded-3xl !border-pink-100 !bg-gradient-to-br !from-white !to-pink-50">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
            <MessageCircle className="h-7 w-7" />
          </div>

          <Title level={3} className="!mb-4 !text-slate-950">
            Thông tin liên hệ
          </Title>

          <div className="space-y-4 text-sm text-slate-600">
            {/* <div className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
              <span>
                Số 01, đường Maternity Care, Quận Ninh Kiều, TP. Cần Thơ
              </span>
            </div> */}
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
                Hồ sơ thai sản và dữ liệu y tế được bảo vệ theo quyền truy
                cập.
              </span>
            </div>
          </div>

          <Link href="/login">
            <Button
              type="primary"
              className="!mt-6 !rounded-xl !bg-pink-500"
            >
              {RESPONSE_MESSAGES.HOME?.SUPPORT_SECTION?.START_USING ??
                "Bắt đầu sử dụng"}
            </Button>
          </Link>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="!rounded-3xl !border-pink-100">
        <Title level={3} className="!mb-5 !text-slate-950">
          Câu hỏi thường gặp
        </Title>
        <Collapse
          ghost
          items={faqItems}
          className="[&_.ant-collapse-header]:!px-0 [&_.ant-collapse-content-box]:!px-0"
        />
      </Card>
    </div>
  );
}