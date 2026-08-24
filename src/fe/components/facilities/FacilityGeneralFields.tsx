"use client";

import type { ReactNode } from "react";
import {
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
} from "antd";
import { Building2 } from "lucide-react";
import { FACILITY_STATUS_OPTIONS } from "@/management/features/facilities/facilities.constants";
import type { FacilityOwnerOption } from "./facility-owner.shared";

type Props = {
  code?: string;
  ownerOptions: FacilityOwnerOption[];
  ownersLoading: boolean;
  currentOwnerId?: string;
  disabled?: boolean;
  statusExtra?: ReactNode;
};

/** Các field chung của Create/Update để không copy form hai lần. */
export function FacilityGeneralFields({
  code,
  ownerOptions,
  ownersLoading,
  currentOwnerId,
  disabled = false,
  statusExtra,
}: Props) {
  return (
    <Card
      className="border-slate-200"
      title={
        <Space>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="font-semibold text-slate-950">Thông tin cơ sở</span>
        </Space>
      }
    >
      <Row gutter={16}>
        {code ? (
          <Col xs={24} md={12}>
            <Form.Item label="Mã cơ sở">
              <Input size="large" value={code} disabled />
            </Form.Item>
          </Col>
        ) : null}

        <Col xs={24} md={12}>
          <Form.Item
            name="name"
            label="Tên cơ sở"
            rules={[{ required: true, message: "Vui lòng nhập tên cơ sở." }]}
          >
            <Input size="large" disabled={disabled} placeholder="Nhập tên cơ sở" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="ownerId"
            label="Chủ cơ sở"
          >
            <Select
              size="large"
              showSearch
              allowClear
              disabled={disabled}
              loading={ownersLoading}
              optionFilterProp="label"
              placeholder="Chọn chủ cơ sở"
              options={ownerOptions.map((owner) => ({
                value: owner.value,
                label: owner.label,
                disabled: owner.disabled && owner.value !== currentOwnerId,
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="hotline"
            label="Số điện thoại"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại." }]}
          >
            <Input size="large" disabled={disabled} placeholder="Nhập số điện thoại" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", message: "Email không đúng định dạng." }]}
          >
            <Input size="large" disabled={disabled} placeholder="Nhập email" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="floorCount"
            label="Số tầng"
            rules={[{ required: true, message: "Vui lòng nhập số tầng." }]}
          >
            <InputNumber
              size="large"
              min={1}
              max={200}
              precision={0}
              disabled={disabled}
              className="w-full"
              placeholder="Nhập số tầng"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="status"
            label="Trạng thái hoạt động"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
          >
            <Select
              size="large"
              disabled={disabled}
              options={FACILITY_STATUS_OPTIONS}
            />
          </Form.Item>
        </Col>
      </Row>

      {statusExtra}
    </Card>
  );
}
