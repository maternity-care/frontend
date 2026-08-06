'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Empty, List, Popover, Spin, Typography } from 'antd';
import { Bell, CheckCheck } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/notifications.api';
import { useNotificationRealtime } from '@/features/notifications/useNotificationRealtime';

const { Text } = Typography;

export function NotificationCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const isManagement = pathname.startsWith('/management');
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const result = await getUnreadNotificationCount();
      setUnread(result.count);
    } catch {
      // Header vẫn hoạt động bình thường nếu notification API tạm thời không sẵn sàng.
    }
  }, []);

  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyNotifications();
      setItems(result);
      setUnread(result.filter((item) => !item.isRead).length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refreshCount(), 0);
    const timer = window.setInterval(() => void refreshCount(), 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refreshCount]);

  useNotificationRealtime({
    management: isManagement,
    onNotification: (notification) => {
      setUnread((current) => current + 1);
      if (open) {
        setItems((current) => [notification, ...current.filter((item) => item.id !== notification.id)]);
      }
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) void refreshList();
  };

  const openNotification = async (item: AppNotification) => {
    if (!item.isRead) await markNotificationRead(item.id);
    setOpen(false);
    if (item.referenceType === 'forum_post') {
      router.push(
        isManagement
          ? `/management/forums?view=posts&postId=${encodeURIComponent(item.referenceId)}`
          : `/forum/${encodeURIComponent(item.referenceId)}`,
      );
      return;
    }
    if (item.referenceType === 'forum_report') {
      router.push(isManagement ? '/management/forums?view=reports' : '/forum');
      return;
    }
    router.push(isManagement ? '/management/appointment-disruptions' : '/appointment-disruptions');
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnread(0);
  };

  const content = (
    <div className="w-[min(380px,calc(100vw-32px))]">
      <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-3">
        <Text strong>Thông báo</Text>
        <Button type="text" size="small" icon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>
          Đã đọc hết
        </Button>
      </div>
      <Spin spinning={loading}>
        {items.length ? (
          <List
            className="max-h-[420px] overflow-y-auto"
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                className={`cursor-pointer !items-start !px-2 hover:!bg-slate-50 ${item.isRead ? '' : '!bg-pink-50/70'}`}
                onClick={() => void openNotification(item)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!item.isRead ? <span className="h-2 w-2 shrink-0 rounded-full bg-pink-600" /> : null}
                    <Text strong={!item.isRead} className="truncate">{item.title}</Text>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.content}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </List.Item>
            )}
          />
        ) : loading ? <div className="h-24" /> : <Empty className="my-6" description="Chưa có thông báo" />}
      </Spin>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight" open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        aria-label="Thông báo"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <Badge count={unread} size="small" overflowCount={99}>
          <Bell className="h-[18px] w-[18px]" />
        </Badge>
      </button>
    </Popover>
  );
}
