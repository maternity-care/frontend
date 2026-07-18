"use client";

import { FacilityService } from "@/management/features/services/services.types";
import {
  Descriptions,
  Modal,
  Spin,
  Tag,
  Typography,
} from "antd";

const { Text } = Typography;

interface FacilityServiceDetailModalProps {
  open: boolean;
  loading?: boolean;
  data?: FacilityService;
  onClose: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function FacilityServiceDetailModal({
  open,
  loading = false,
  data,
  onClose,
}: FacilityServiceDetailModalProps) {
  return (
    <Modal
      open={open}
      centered
      width={700}
      title="Chi tiết dịch vụ cơ sở"
      footer={null}
      onCancel={onClose}
    >
      <Spin spinning={loading}>
        {data ? (
          <Descriptions
            bordered
            size="small"
            column={1}
          >
            <Descriptions.Item label="ID bản ghi">
              <Text copyable>{data.id}</Text>
            </Descriptions.Item>

            <Descriptions.Item label="Cơ sở">
              <div>
                <Text strong>{data.facilityName}</Text>

                <div className="mt-1 text-xs text-slate-500">
                  {data.facilityCode
                    ? `${data.facilityCode} · `
                    : ""}
                  ID: {data.facilityId}
                </div>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Dịch vụ">
              <div>
                <Text strong>{data.serviceName}</Text>

                <div className="mt-1 text-xs text-slate-500">
                  {data.serviceCode
                    ? `${data.serviceCode} · `
                    : ""}
                  ID: {data.serviceId}
                </div>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Loại dịch vụ">
              {data.serviceType || "Chưa có thông tin"}
            </Descriptions.Item>

            <Descriptions.Item label="Mô tả">
              {data.serviceDescription || "Chưa có mô tả"}
            </Descriptions.Item>

            <Descriptions.Item label="Giá">
              <Text strong>
                {formatCurrency(data.price)}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Thời lượng">
              {data.durationMinutes} phút
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <Tag
                color={
                  data.status === "available"
                    ? "green"
                    : "default"
                }
              >
                {data.status === "available"
                  ? "Đang cung cấp"
                  : "Ngừng cung cấp"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div className="py-10 text-center text-slate-500">
            Không có dữ liệu
          </div>
        )}
      </Spin>
    </Modal>
  );
}