'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Select, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/management/components/layouts/AdminLayout';
import { PageHeader } from '@/management/components/ui/PageHeader';
import {
  AppointmentDisruption,
  completeDisruptionRefund,
  getManagementAppointmentDisruptions,
} from '@/features/appointment-disruptions/appointment-disruptions.api';

const { Text } = Typography;

const statusMeta: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ bệnh nhân chọn', color: 'warning' },
  rescheduled: { label: 'Đã đổi lịch', color: 'success' },
  refund_pending: { label: 'Chờ hoàn tiền', color: 'processing' },
  resolved: { label: 'Đã xử lý', color: 'success' },
};

export default function ManagementAppointmentDisruptionsPage() {
  const [items, setItems] = useState<AppointmentDisruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>();
  const [refundItem, setRefundItem] = useState<AppointmentDisruption | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getManagementAppointmentDisruptions());
    } catch {
      message.error('Không tải được danh sách lịch hẹn bị ảnh hưởng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const data = useMemo(
    () => status ? items.filter((item) => item.resolutionStatus === status) : items,
    [items, status],
  );

  const columns: ColumnsType<AppointmentDisruption> = [
    {
      title: 'Lịch hẹn',
      render: (_, item) => (
        <div><Text strong>#{item.appointmentId}</Text><div className="text-xs text-slate-500">{item.serviceName}</div></div>
      ),
    },
    {
      title: 'Thai phụ',
      render: (_, item) => <div>{item.patientName}<div className="text-xs text-slate-500">{item.patientEmail}</div></div>,
    },
    { title: 'Cơ sở', dataIndex: 'facilityName' },
    {
      title: 'Lịch cũ',
      render: (_, item) => new Date(item.oldScheduledStart).toLocaleString('vi-VN'),
    },
    { title: 'Lý do', render: (_, item) => item.reason || 'Cơ sở/phòng tạm ngưng' },
    {
      title: 'Trạng thái',
      render: (_, item) => {
        const meta = statusMeta[item.resolutionStatus] ?? { label: item.resolutionStatus, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      fixed: 'right',
      render: (_, item) => item.resolutionStatus === 'refund_pending' ? (
        <Button size="small" type="primary" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setRefundItem(item)}>
          Xác nhận hoàn tiền
        </Button>
      ) : null,
    },
  ];

  const completeRefund = async () => {
    if (!refundItem) return;
    try {
      await completeDisruptionRefund(refundItem.id, note.trim() || undefined);
      message.success('Đã xác nhận xử lý hoàn tiền.');
      setRefundItem(null);
      setNote('');
      await load();
    } catch {
      message.error('Không thể xác nhận hoàn tiền.');
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Lịch hẹn bị ảnh hưởng" description="Theo dõi thai phụ cần đổi lịch hoặc hoàn tiền khi cơ sở, phòng hay ca trực ngừng hoạt động." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          allowClear
          className="w-60"
          placeholder="Lọc trạng thái xử lý"
          value={status}
          onChange={setStatus}
          options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))}
        />
        <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Tải lại</Button>
      </div>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={data} scroll={{ x: 1100 }} />

      <Modal
        title={`Xác nhận hoàn tiền lịch #${refundItem?.appointmentId ?? ''}`}
        open={Boolean(refundItem)}
        onCancel={() => setRefundItem(null)}
        onOk={() => void completeRefund()}
        okText="Đã xử lý hoàn tiền"
      >
        <p className="mb-3 text-sm text-slate-600">Chỉ xác nhận sau khi quy trình hoàn tiền thực tế đã hoàn tất.</p>
        <Input.TextArea rows={4} maxLength={500} showCount value={note} onChange={(event) => setNote(event.target.value)} placeholder="Mã giao dịch hoặc ghi chú xử lý" />
      </Modal>
    </AdminLayout>
  );
}
