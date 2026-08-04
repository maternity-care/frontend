"use client";

import { Card, Col, Row, Statistic } from "antd";
import { ShieldCheck, UsersRound } from "lucide-react";

interface Props {
  total: number;
  activeCount: number;
  lockedCount: number;
  inactiveCount: number;
}

export function UserStats({
  total,
  activeCount,
  lockedCount,
  inactiveCount,
}: Props) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={6}>
        <Card className="h-full border-slate-200">
          <Statistic
            title="Tổng người dùng"
            value={total}
            prefix={<UsersRound className="mr-2 h-5 w-5 text-blue-600" />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card className="h-full border-green-100 bg-green-50/60">
          <Statistic
            title="Đang hoạt động"
            value={activeCount}
            prefix={<ShieldCheck className="mr-2 h-5 w-5 text-green-600" />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card className="h-full border-red-100 bg-red-50/60">
          <Statistic
            title="Đã khóa"
            value={lockedCount}
            prefix={<ShieldCheck className="mr-2 h-5 w-5 text-red-600" />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card className="h-full border-slate-100 bg-slate-50/60">
          <Statistic
            title="Ngừng hoạt động"
            value={inactiveCount}
            prefix={<ShieldCheck className="mr-2 h-5 w-5 text-slate-500" />}
          />
        </Card>
      </Col>
    </Row>
  );
}