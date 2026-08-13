'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, List, Modal, Space, Spin, Tag, Typography, message } from 'antd';
import { CalendarClock, CircleDollarSign, Clock3, MapPin, RefreshCw, Stethoscope } from 'lucide-react';
import {
  AppointmentDisruption,
  DisruptionRescheduleOption,
  getDisruptionOptions,
  getMyAppointmentDisruptions,
  requestDisruptionRefund,
  rescheduleMyDisruption,
} from './appointment-disruptions.api';

const { Title, Text } = Typography;

const statusMeta: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ bạn xử lý', color: 'warning' },
  rescheduled: { label: 'Đã đổi lịch', color: 'success' },
  refund_pending: { label: 'Chờ hoàn tiền', color: 'processing' },
  resolved: { label: 'Đã xử lý', color: 'success' },
};

const optionKeyOf = (option: DisruptionRescheduleOption) =>
  `${option.shiftId}-${option.startTime}-${option.endTime}`;

const formatDateLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatTimeRange = (option: DisruptionRescheduleOption) =>
  `${option.startTime.slice(0, 5)} - ${option.endTime.slice(0, 5)}`;

type AppointmentDisruptionsPanelProps = {
  standalone?: boolean;
  hideWhenEmpty?: boolean;
};

export function AppointmentDisruptionsPanel({
  standalone = false,
  hideWhenEmpty = false,
}: AppointmentDisruptionsPanelProps) {
  const [items, setItems] = useState<AppointmentDisruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentDisruption | null>(null);
  const [options, setOptions] = useState<DisruptionRescheduleOption[]>([]);
  const [optionKey, setOptionKey] = useState<string>();
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [refundItem, setRefundItem] = useState<AppointmentDisruption | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const visibleItems = items.filter((item) =>
    item.resolutionStatus === 'pending' || item.resolutionStatus === 'refund_pending',
  );
  const groupedOptions = useMemo(() => {
    return options.reduce<Record<string, DisruptionRescheduleOption[]>>((groups, option) => {
      groups[option.date] = [...(groups[option.date] ?? []), option];
      return groups;
    }, {});
  }, [options]);

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
    const option = options.find((current) => optionKeyOf(current) === optionKey);
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

  if (hideWhenEmpty && !loading && visibleItems.length === 0) {
    return null;
  }

  return (
    <section id="appointment-disruptions" className="space-y-4 scroll-mt-24">
      {standalone ? (
        <div>
          <Title level={2} className="!mb-1">Lịch khám cần xử lý</Title>
          <Text type="secondary">Chọn một ca khác hoặc gửi yêu cầu hoàn tiền cho lịch bị ảnh hưởng.</Text>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Title level={3} className="!mb-1">Lịch khám cần xử lý</Title>
            <Text type="secondary">Các lịch bị ảnh hưởng bởi cơ sở, phòng hoặc ca trực tạm ngưng.</Text>
          </div>
          <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Tải lại</Button>
        </div>
      )}

      <Alert
        showIcon
        type="info"
        title="Cơ sở sẽ xác nhận trước khi hoàn tiền"
        description="Yêu cầu hoàn tiền không đồng nghĩa tiền đã được chuyển ngay. Bạn sẽ nhận thông báo khi quản lý xử lý xong."
      />

      <Spin spinning={loading}>
        {visibleItems.length ? (
          <List
            grid={{ gutter: 16, xs: 1, lg: standalone ? 2 : 1, xl: 2 }}
            dataSource={visibleItems}
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
                      <p>
                        <strong>Lịch cũ:</strong> {new Date(item.oldScheduledStart).toLocaleString('vi-VN')} - {new Date(item.oldScheduledEnd).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
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
        ) : loading ? <div className="h-32" /> : <Empty description="Không có lịch khám nào cần xử lý" />}
      </Spin>

      {standalone ? (
        <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Tải lại</Button>
      ) : null}

      <Modal
        title="Chọn ca khám thay thế"
        open={Boolean(selected)}
        onCancel={() => setSelected(null)}
        onOk={() => void submitReschedule()}
        okText="Xác nhận đổi lịch"
        okButtonProps={{ disabled: !optionKey, loading: submitting }}
        width={760}
      >
        <Spin spinning={loadingOptions}>
          {options.length ? (
            <div className="space-y-4">
              <Alert
                showIcon
                type="info"
                message="Chọn một ca còn trống để đổi lịch khám bị ảnh hưởng."
                description="Ca mới sẽ giữ dịch vụ cũ; hệ thống chỉ đổi bác sĩ, phòng và thời gian theo lựa chọn bên dưới."
              />
              <div className="max-h-[56vh] space-y-4 overflow-y-auto pr-1">
                {Object.entries(groupedOptions).map(([date, dateOptions]) => (
                  <div key={date} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <CalendarClock className="h-4 w-4 text-teal-600" />
                      {formatDateLabel(date)}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {dateOptions.map((option) => {
                        const currentKey = optionKeyOf(option);
                        const active = currentKey === optionKey;
                        return (
                          <button
                            key={currentKey}
                            type="button"
                            onClick={() => setOptionKey(currentKey)}
                            className={[
                              'rounded-lg border p-3 text-left transition',
                              active
                                ? 'border-teal-600 bg-teal-50 shadow-sm'
                                : 'border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-white',
                            ].join(' ')}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                                <Clock3 className="h-4 w-4 text-teal-600" />
                                {formatTimeRange(option)}
                              </span>
                              {active ? <Tag color="success">Đang chọn</Tag> : null}
                            </div>
                            <div className="space-y-1 text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <Stethoscope className="h-3.5 w-3.5" />
                                <span>{option.doctorName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{option.roomName || 'Phòng sẽ được cơ sở sắp xếp'}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
    </section>
  );
}
