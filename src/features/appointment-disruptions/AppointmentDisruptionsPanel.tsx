'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Input, Modal, Space, Spin, Tag, Typography, message } from 'antd';
import { CalendarClock, CalendarX2, Clock3, MapPin, RefreshCw, Stethoscope } from 'lucide-react';
import {
  AppointmentDisruption,
  cancelMyDisruptedAppointment,
  DisruptionRescheduleOption,
  getDisruptionOptions,
  getMyAppointmentDisruptions,
  rescheduleMyDisruption,
} from './appointment-disruptions.api';

const { Title, Text } = Typography;

const statusMeta: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ bạn xử lý', color: 'warning' },
  rescheduled: { label: 'Đã đổi lịch', color: 'success' },
  refund_pending: { label: 'Chờ hủy lịch', color: 'processing' },
  cancelled: { label: 'Đã hủy', color: 'default' },
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

export function AppointmentDisruptionsPanel({
  hideWhenEmpty = false,
}: { hideWhenEmpty?: boolean }) {
  const [items, setItems] = useState<AppointmentDisruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentDisruption | null>(null);
  const [options, setOptions] = useState<DisruptionRescheduleOption[]>([]);
  const [optionKey, setOptionKey] = useState<string>();
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [cancelItem, setCancelItem] = useState<AppointmentDisruption | null>(null);
  const [cancelReason, setCancelReason] = useState('');
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

  const submitCancellation = async () => {
    if (!cancelItem) return;
    setSubmitting(true);
    try {
      await cancelMyDisruptedAppointment(cancelItem.id, cancelReason.trim() || undefined);
      message.success('Đã hủy lịch khám.');
      setCancelItem(null);
      setCancelReason('');
      await load();
    } catch {
      message.error('Không thể hủy lịch khám.');
    } finally {
      setSubmitting(false);
    }
  };

  if (hideWhenEmpty && !loading && visibleItems.length === 0) {
    return null;
  }

  return (
    <section id="appointment-disruptions" className="mx-auto w-full max-w-4xl space-y-4 scroll-mt-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Title level={3} className="!mb-1">Lịch khám cần xử lý</Title>
          <Text type="secondary">Chọn lịch khám khác hoặc hủy lịch bị ảnh hưởng.</Text>
        </div>
        <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Tải lại</Button>
      </div>

      <Spin spinning={loading}>
        {visibleItems.length ? (
          <div className="space-y-4">
            {visibleItems.map((item) => {
              const meta = statusMeta[item.resolutionStatus] ?? { label: item.resolutionStatus, color: 'default' };
              return (
                <Card
                  key={item.id}
                  className="mx-auto w-full"
                  title={<span>Lịch #{item.appointmentId}</span>}
                  extra={<Tag color={meta.color}>{meta.label}</Tag>}
                >
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
                    {['pending', 'refund_pending'].includes(item.resolutionStatus) ? (
                      <Space wrap className="mt-4">
                        <Button type="primary" icon={<CalendarClock className="h-4 w-4" />} onClick={() => void openReschedule(item)}>
                          Chọn lịch khác
                        </Button>
                        <Button danger icon={<CalendarX2 className="h-4 w-4" />} onClick={() => setCancelItem(item)}>
                          Hủy lịch
                        </Button>
                      </Space>
                    ) : null}
                </Card>
              );
            })}
          </div>
        ) : loading ? <div className="h-32" /> : <Empty description="Không có lịch khám nào cần xử lý" />}
      </Spin>

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
        title="Hủy lịch khám"
        centered
        open={Boolean(cancelItem)}
        onCancel={() => setCancelItem(null)}
        onOk={() => void submitCancellation()}
        okText="Xác nhận hủy"
        okButtonProps={{ danger: true, loading: submitting }}
      >
        <p className="mb-3 text-sm text-slate-600">
          Lịch khám sẽ được hủy và không thể khôi phục bằng thao tác này. Bạn vẫn có thể đặt một lịch mới sau đó.
        </p>
        <Input.TextArea
          rows={4}
          maxLength={500}
          showCount
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          placeholder="Lý do hủy (không bắt buộc)"
        />
      </Modal>
    </section>
  );
}
