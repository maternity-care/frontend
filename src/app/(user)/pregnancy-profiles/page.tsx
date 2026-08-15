"use client";

import PregnancyProfileList from "@/fe/components/record-keeping/PregnancyProfileList";
import { Typography } from "antd";
const { Title } = Typography;

export default function PregnancyProfilesPage() {
  return (
    <div className="p-4 md:p-6">
      <Title level={3}>Hồ sơ thai kỳ của tôi</Title>
      <PregnancyProfileList />
    </div>
  );
}
