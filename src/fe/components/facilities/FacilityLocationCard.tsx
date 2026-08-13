"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
} from "antd";
import { LocateFixed, MapPin } from "lucide-react";
import type { FacilityMapLocation } from "./facility-form.shared";
import { FacilityMapPreview } from "./FacilityMapPreview";

type Props = {
  facilityName: string;
  fullAddress: string;
  mapLocation: FacilityMapLocation | null;
  locating: boolean;
  disabled?: boolean;
  onLocate: () => void;
};

export function FacilityLocationCard({
  facilityName,
  fullAddress,
  mapLocation,
  locating,
  disabled = false,
  onLocate,
}: Props) {
  return (
    <Card
      className="border-slate-200"
      title={
        <Space>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="font-semibold text-slate-950">Địa chỉ & bản đồ</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          ghost
          loading={locating}
          disabled={disabled}
          icon={<LocateFixed className="h-4 w-4" />}
          onClick={onLocate}
        >
          Lấy vị trí hiện tại
        </Button>
      }
    >
      <Form.Item name="latitude" hidden><Input /></Form.Item>
      <Form.Item name="longitude" hidden><Input /></Form.Item>

      <Row gutter={16}>
        <Col xs={24}>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ." }]}
          >
            <Input size="large" disabled={disabled} placeholder="Nhập số nhà, tên đường" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="city"
            label="Tỉnh/Thành phố"
            rules={[{ required: true, message: "Vui lòng nhập tỉnh/thành phố." }]}
          >
            <Input size="large" disabled={disabled} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="ward"
            label="Phường/Xã"
            rules={[{ required: true, message: "Vui lòng nhập phường/xã." }]}
          >
            <Input size="large" disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>

      <FacilityMapPreview
        name={facilityName || "Cơ sở khám"}
        address={fullAddress}
        location={mapLocation}
      />
    </Card>
  );
}
