"use client";

import {
  Descriptions,
  Modal,
  Spin,
  Tag,
  Typography,
} from "antd";

import type {
  FacilityService,
} from "@/management/features/services/services.types";

import {
  formatCurrency,
  getServiceTypeLabel,
} from "../services.ui";
import { RESPONSE_MESSAGES } from "@/constants/response-message.constant";

const { Text } = Typography;

interface Props {
  open: boolean;
  loading?: boolean;
  data?: FacilityService;
  onClose: () => void;
}

export function FacilityServiceDetailModal({
  open,
  loading = false,
  data,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      centered
      width={760}
      footer={null}
      title={RESPONSE_MESSAGES.SERVICES.MODAL.details_of_facility_services}
      onCancel={onClose}
    >
      <Spin spinning={loading}>
        {data ? (
          <Descriptions
            bordered
            size="small"
            column={1}
          >
            <Descriptions.Item label={RESPONSE_MESSAGES.SERVICES.MODAL.facility}>
              <Text strong>
                {data.facilityName}
              </Text>{" "}
              ({data.facilityCode})
            </Descriptions.Item>

            <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.ADDRESS}>
              {[
                data.facilityAddress,
                data.facilityDistrict,
                data.facilityProvince,
              ]
                .filter(Boolean)
                .join(", ")}
            </Descriptions.Item>

            <Descriptions.Item label={RESPONSE_MESSAGES.HOME.SERVICES_SECTION.TAG}>
              <Text strong>
                {data.serviceName}
              </Text>{" "}
              ({data.serviceCode})
            </Descriptions.Item>

            <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.type}>
              <Tag color="blue">
                {getServiceTypeLabel(
                  data.serviceType,
                )}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.description}>
              {data.serviceDescription ||
                RESPONSE_MESSAGES.COMMON.log.no_description}
            </Descriptions.Item>

            <Descriptions.Item label={RESPONSE_MESSAGES.SERVICES.MODAL.base_price}>
              {formatCurrency(
                data.serviceBasePrice,
              )}
            </Descriptions.Item>

            <Descriptions.Item label={RESPONSE_MESSAGES.SERVICES.MODAL.facility_price}>
              <Text strong>
                {formatCurrency(
                  data.price,
                )}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label={RESPONSE_MESSAGES.SERVICES.MODAL.duration}>
              {data.durationMinutes} {RESPONSE_MESSAGES.COMMON.minute}
            </Descriptions.Item>

            <Descriptions.Item label={RESPONSE_MESSAGES.COMMON.STATUS}>
              <Tag
                color={
                  data.status ===
                  "available"
                    ? "green"
                    : "default"
                }
              >
                {data.status ===
                "available"
                  ? RESPONSE_MESSAGES.COMMON.status.available
                  : RESPONSE_MESSAGES.COMMON.status.unavailable}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div className="py-10 text-center text-slate-500">
            {RESPONSE_MESSAGES.COMMON.log.no_data}
          </div>
        )}
      </Spin>
    </Modal>
  );
}