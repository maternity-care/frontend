"use client";

import {
  Card,
  Descriptions,
  Flex,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";

import { getManagementMaternityPackageById } from "@/management/features/services/maternity-packages/maternity-packages.api";
import type {
  MaternityPackage,
  MaternityPackageStageType,
  MaternityPackageStatus,
  MaternityPackageType,
} from "@/management/features/services/maternity-packages/maternity-packages.types";

const { Text, Title } = Typography;

const STATUS_LABELS: Record<MaternityPackageStatus, string> = {
  draft: "Nháp",
  active: "Đang bán",
  inactive: "Ngừng bán",
};

const STATUS_COLORS: Record<MaternityPackageStatus, string> = {
  draft: "default",
  active: "green",
  inactive: "orange",
};

const PACKAGE_TYPE_LABELS: Record<MaternityPackageType, string> = {
  quantity: "Theo số lượng",
  schedule: "Theo lịch trình",
};

const STAGE_TYPE_LABELS: Record<MaternityPackageStageType, string> = {
  pregnancy_week: "Tuần thai",
  postpartum: "Sau sinh",
  custom: "Tùy chỉnh",
};

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  open: boolean;
  packageItem: MaternityPackage | null;
  onCancel: () => void;
}

export function MaternityPackageDetailModal({
  open,
  packageItem,
  onCancel,
}: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MaternityPackage | null>(null);

  useEffect(() => {
    if (!open || !packageItem) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      void (async () => {
        setLoading(true);

        try {
          const data = await getManagementMaternityPackageById(packageItem.id);

          if (!cancelled) {
            setDetail(data);
          }
        } catch {
          if (!cancelled) {
            messageApi.error("Không thể tải chi tiết gói.");
            onCancel();
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [open, packageItem, messageApi, onCancel]);

  const isShowingOldData =
    !!packageItem && !!detail && detail.id !== packageItem.id;

  return (
    <>
      {contextHolder}

      <Modal
        open={open}
        title="Chi tiết gói dịch vụ"
        footer={null}
        width={960}
        destroyOnHidden
        onCancel={onCancel}
        styles={{ body: { maxHeight: "75vh", overflowY: "auto" } }}
      >
        {loading || !detail || isShowingOldData ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Text type="secondary">Đang tải chi tiết…</Text>
          </div>
        ) : (
          <Space orientation="vertical" size={20} style={{ width: "100%" }}>
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2, md: 2 }}
            >
              <Descriptions.Item label="Mã gói">
                <Text code>{detail.code || "—"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Loại gói">
                <Tag
                  color={detail.packageType === "quantity" ? "blue" : "purple"}
                >
                  {PACKAGE_TYPE_LABELS[detail.packageType]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tên gói" span={2}>
                <Text strong>{detail.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Cơ sở" span={2}>
                {detail.facility?.name ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả" span={2}>
                {detail.description || (
                  <Text type="secondary">Không có mô tả</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Giá gói">
                {formatCurrency(detail.price)}
              </Descriptions.Item>
              <Descriptions.Item label="Thời hạn">
                {detail.durationDays ? `${detail.durationDays} ngày` : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={STATUS_COLORS[detail.status]}>
                  {STATUS_LABELS[detail.status]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* Gói theo số lượng */}
            {detail.packageType === "quantity" && (
              <>
                <Title level={5} style={{ margin: 0 }}>
                  Dịch vụ trong gói
                </Title>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="id"
                  dataSource={detail.services ?? []}
                  columns={[
                    {
                      title: "STT",
                      width: 60,
                      align: "center",
                      render: (_, __, index) => index + 1,
                    },
                    {
                      title: "Dịch vụ",
                      render: (_, record) => {
                        const svc = record.facilityService?.service;
                        return (
                          <Flex vertical gap={2}>
                            <Text strong>
                              {svc?.name ?? record.serviceId ?? "—"}
                            </Text>
                            {svc?.code ? (
                              <Text type="secondary" code>
                                {svc.code}
                              </Text>
                            ) : null}
                          </Flex>
                        );
                      },
                    },
                    {
                      title: "Số lượt",
                      dataIndex: "includedQuantity",
                      width: 100,
                      align: "center",
                    },
                    {
                      title: "Bắt buộc",
                      width: 100,
                      align: "center",
                      render: (_, record) =>
                        record.isRequired ? (
                          <Tag color="green">Có</Tag>
                        ) : (
                          <Tag>Không</Tag>
                        ),
                    },
                    {
                      title: "Tùy chọn",
                      width: 100,
                      align: "center",
                      render: (_, record) =>
                        record.isOptional ? (
                          <Tag color="blue">Có</Tag>
                        ) : (
                          <Tag>Không</Tag>
                        ),
                    },
                  ]}
                />
              </>
            )}

            {/* Gói theo lịch trình */}
            {detail.packageType === "schedule" && (
              <>
                <Title level={5} style={{ margin: 0 }}>
                  Các mốc lịch trình
                </Title>

                <Space
                  orientation="vertical"
                  size={16}
                  style={{ width: "100%" }}
                >
                  {(detail.stages ?? []).map((stage, stageIndex) => (
                    <Card
                      key={stage.id}
                      size="small"
                      title={
                        <Flex align="center" gap={8} wrap>
                          <Text strong>
                            Mốc #{stageIndex + 1}: {stage.name}
                          </Text>
                          <Tag>
                            {STAGE_TYPE_LABELS[stage.stageType] ??
                              stage.stageType}
                          </Tag>
                          {stage.stageType === "pregnancy_week" &&
                            stage.weekFrom != null &&
                            stage.weekTo != null && (
                              <Tag color="cyan">
                                Tuần {stage.weekFrom} – {stage.weekTo}
                              </Tag>
                            )}
                        </Flex>
                      }
                    >
                      {stage.goal ? (
                        <Text
                          type="secondary"
                          style={{ display: "block", marginBottom: 12 }}
                        >
                          Mục tiêu: {stage.goal}
                        </Text>
                      ) : null}

                      <Table
                        size="small"
                        pagination={false}
                        rowKey="id"
                        dataSource={stage.services ?? []}
                        columns={[
                          {
                            title: "STT",
                            width: 60,
                            align: "center",
                            render: (_, __, index) => index + 1,
                          },
                          {
                            title: "Dịch vụ",
                            render: (_, record) => {
                              const svc = record.facilityService?.service;
                              return (
                                <Flex vertical gap={2}>
                                  <Text strong>
                                    {svc?.name ?? record.serviceId ?? "—"}
                                  </Text>
                                  {svc?.code ? (
                                    <Text type="secondary" code>
                                      {svc.code}
                                    </Text>
                                  ) : null}
                                </Flex>
                              );
                            },
                          },
                          {
                            title: "Số lượt",
                            dataIndex: "includedQuantity",
                            width: 90,
                            align: "center",
                          },
                          {
                            title: "Bắt buộc",
                            width: 90,
                            align: "center",
                            render: (_, record) =>
                              record.isRequired ? (
                                <Tag color="green">Có</Tag>
                              ) : (
                                <Tag>Không</Tag>
                              ),
                          },
                          {
                            title: "Tùy chọn",
                            width: 90,
                            align: "center",
                            render: (_, record) =>
                              record.isOptional ? (
                                <Tag color="blue">Có</Tag>
                              ) : (
                                <Tag>Không</Tag>
                              ),
                          },
                        ]}
                      />
                    </Card>
                  ))}
                </Space>
              </>
            )}
          </Space>
        )}
      </Modal>
    </>
  );
}
