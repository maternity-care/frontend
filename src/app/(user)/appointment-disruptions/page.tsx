'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Input, List, Modal, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { CalendarClock, CircleDollarSign, RefreshCw } from 'lucide-react';
import {
  AppointmentDisruption,
  DisruptionRescheduleOption,
  getDisruptionOptions,
  getMyAppointmentDisruptions,
  requestDisruptionRefund,
  rescheduleMyDisruption,
} from '@/features/appointment-disruptions/appointment-disruptions.api';

const { Title, Text } = Typography;

const statusMeta: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ bạn xử lý', color: 'warning' },
  rescheduled: { label: 'Đã đổi lịch', color: 'success' },
  refund_pending: { label: 'Chờ hoàn tiền', color: 'processing' },
  resolved: { label: 'Đã xử lý', color: 'success' },
};

export default function AppointmentDisruptionsPage() {
  const [items, setItems] = useState<AppointmentDisruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentDisruption | null>(null);
  const [options, setOptions] = useState<DisruptionRescheduleOption[]>([]);
  const [optionKey, setOptionKey] = useState<string>();
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [refundItem, setRefundItem] = useState<AppointmentDisruption | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getMyAppointmentDisruptions());
    } catch {
      message.error('Không tải được các lịch khám bị ảnh hưởng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openReschedule = async (item: AppointmentDisruption) => {
    setSelected(item);
    setOptions([]);
    setOptionKey(undefined);
    setLoadingOptions(true);
    try {
      setOptions(await getDisruptionOptions(item.id));
    } catch {
      message.error('Không lấy được ca thay thế.');
    } finally {
      setLoadingOptions(false);
    }
  };

  const submitReschedule = async () => {
    if (!selected || !optionKey) return;
    const option = options.find((current) => current.shiftId + current.startTime === optionKey);
    if (!option) return;
    setSubmitting(true);
    try {
      await rescheduleMyDisruption(selected.id, {
        doctorId: option.doctorId,
        shiftId: option.shiftId,
        date: option.date,
        startTime: option.startTime,
        endTime: option.endTime,
        reason: 'Thai phụ chọn ca thay thế sau disruption',
      });
      message.success('Đã đổi lịch khám.');
      setSelected(null);
      await load();
    } catch {
      message.error('Không thể đổi lịch. Ca này có thể vừa được người khác chọn.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRefund = async () => {
    if (!refundItem) return;
    setSubmitting(true);
    try {
      await requestDisruptionRefund(refundItem.id, refundReason.trim() || undefined);
      message.success('Đã gửi yêu cầu hoàn tiền tới cơ sở.');
      setRefundItem(null);
      setRefundReason('');
      await load();
    } catch {
      message.error('Không thể gửi yêu cầu hoàn tiền.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Title level={2} className="!mb-1">Lịch khám cần xử lý</Title>
        <Text type="secondary">Chọn một ca khác hoặc gửi yêu cầu hoàn tiền cho lịch bị ảnh hưởng.</Text>
      </div>

      <Alert
        showIcon
        type="info"
        message="Cơ sở sẽ xác nhận trước khi hoàn tiền"
        description="Yêu cầu hoàn tiền không đồng nghĩa tiền đã được chuyển ngay. Bạn sẽ nhận thông báo khi quản lý xử lý xong."
      />

      <Spin spinning={loading}>
        {items.length ? (
          <List
            grid={{ gutter: 16, xs: 1, lg: 2 }}
            dataSource={items}
            renderItem={(item) => {
              const meta = statusMeta[item.resolutionStatus] ?? { label: item.resolutionStatus, color: 'default' };
              return (
                <List.Item>
                  <Card className="h-full" title={<span>Lịch #{item.appointmentId}</span>} extra={<Tag color={meta.color}>{meta.label}</Tag>}>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p><strong>Cơ sở:</strong> {item.facilityName}</p>
                      <p><strong>Dịch vụ:</strong> {item.serviceName}</p>
                      <p><strong>Bác sĩ:</strong> {item.doctorName || 'Chưa xác định'}</p>
                      <p><strong>Phòng:</strong> {item.roomName || 'Chưa xác định'}</p>
                      <p><strong>Lịch cũ:</strong> {new Date(item.oldScheduledStart).toLocaleString('vi-VN')} - {new Date(item.oldScheduledEnd).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p><strong>Lý do:</strong> {item.reason || 'Cơ sở hoặc phòng khám tạm ngưng hoạt động'}</p>
                    </div>
                    {item.resolutionStatus === 'pending' ? (
                      <Space wrap className="mt-4">
                        <Button type="primary" icon={<CalendarClock className="h-4 w-4" />} onClick={() => void openReschedule(item)}>
                          Chọn lịch khác
                        </Button>
                        <Button icon={<CircleDollarSign className="h-4 w-4" />} onClick={() => setRefundItem(item)}>
                          Yêu cầu hoàn tiền
                        </Button>
                      </Space>
                    ) : null}
                  </Card>
                </List.Item>
              );
            }}
          />
        ) : loading ? <div className="h-40" /> : <Empty description="Không có lịch khám nào cần xử lý" />}
      </Spin>

      <Modal
        title="Chọn ca khám thay thế"
        open={Boolean(selected)}
        onCancel={() => setSelected(null)}
        onOk={() => void submitReschedule()}
        okText="Xác nhận đổi lịch"
        okButtonProps={{ disabled: !optionKey, loading: submitting }}
      >
        <Spin spinning={loadingOptions}>
          {options.length ? (
            <Select
              className="w-full"
              showSearch
              value={optionKey}
              onChange={setOptionKey}
              optionFilterProp="label"
              placeholder="Chọn ngày, bác sĩ và giờ khám"
              options={options.map((option) => ({
                value: option.shiftId + option.startTime,
                label: `${new Date(`${option.date}T00:00:00`).toLocaleDateString('vi-VN')} · ${option.startTime.slice(0, 5)} - ${option.endTime.slice(0, 5)} · ${option.doctorName} · ${option.roomName}`,
              }))}
            />
          ) : loadingOptions ? <div className="h-16" /> : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ca thay thế trong 30 ngày tới" />
          )}
        </Spin>
      </Modal>

      <Modal
        title="Yêu cầu hoàn tiền"
        open={Boolean(refundItem)}
        onCancel={() => setRefundItem(null)}
        onOk={() => void submitRefund()}
        okText="Gửi yêu cầu"
        okButtonProps={{ loading: submitting }}
      >
        <p className="mb-3 text-sm text-slate-600">Sau khi gửi, lịch khám sẽ được hủy và cơ sở tiếp nhận yêu cầu hoàn tiền.</p>
        <Input.TextArea rows={4} maxLength={500} showCount value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Ghi chú thêm (không bắt buộc)" />
      </Modal>

      <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Tải lại</Button>
    </div>
  );
}
