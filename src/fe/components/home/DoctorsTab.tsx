"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { Button, Card, Col, Row, Typography } from "antd";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Title, Paragraph, Text } = Typography;

const doctors = [
  {
    name: "BS. Nguyễn Minh Anh",
    specialty: "Sản phụ khoa",
    facility: "Cơ sở Cần Thơ",
  },
  {
    name: "BS. Trần Hoàng Nam",
    specialty: "Siêu âm thai",
    facility: "Cơ sở Ninh Kiều",
  },
  {
    name: "BS. Lê Thanh Hương",
    specialty: "Theo dõi thai kỳ",
    facility: "Cơ sở Bình Thủy",
  },
];

export function DoctorsTab() {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <Title level={2} className="!mb-3 !text-slate-950">
          Đội ngũ bác sĩ
        </Title>
        <Paragraph className="mx-auto max-w-2xl !text-base !leading-7 !text-slate-600">
          Các bác sĩ giàu kinh nghiệm đồng hành cùng mẹ bầu trong suốt hành
          trình thai kỳ.
        </Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        {doctors.map((doctor) => (
          <Col xs={24} md={8} key={doctor.name}>
            <Card className="h-full !rounded-3xl !border-pink-100 hover:!shadow-md hover:!shadow-pink-100 transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                  <UserRound className="h-7 w-7" />
                </div>
                <div>
                  <Title level={4} className="!mb-1 !text-slate-950">
                    {doctor.name}
                  </Title>
                  <Text className="!font-medium !text-pink-600">
                    {doctor.specialty}
                  </Text>
                  <p className="mt-2 text-sm text-slate-500">
                    {doctor.facility}
                  </p>
                </div>
              </div>

              <Link href="/login">
                <Button
                  className="!mt-6 !rounded-xl !border-pink-200 !text-pink-600"
                  block
                >
                  {RESPONSE_MESSAGES.HOME?.DOCTORS_SECTION?.VIEW_SCHEDULE ??
                    "Xem lịch khám"}
                </Button>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}