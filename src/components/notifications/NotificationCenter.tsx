'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Drawer, Empty, Grid, Popover, Spin, Typography } from 'antd';
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
  const screens = Grid.useBreakpoint();
  const pathname = usePathname();
  const router = useRouter();
  const isManagement = pathname.startsWith('/management');
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const isMobile = !screens.md;

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
    router.push(isManagement ? '/management/appointments' : '/schedule#appointment-disruptions');
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnread(0);
  };

  const notificationList = (
    <Spin spinning={loading}>
      {items.length ? (
        <div
          role="list"
          aria-label="Danh sách thông báo"
          className="max-h-[min(420px,65dvh)] divide-y divide-slate-100 overflow-y-auto overscroll-contain"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className={`block w-full px-3 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 ${
                item.isRead ? 'bg-white' : 'bg-pink-50/70'
              }`}
              onClick={() => void openNotification(item)}
            >
              <span className="flex min-w-0 items-start gap-2">
                {!item.isRead ? (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pink-600" />
                ) : null}
                <span className="min-w-0 flex-1">
                  <Text strong={!item.isRead} className="block break-words !leading-5">
                    {item.title}
                  </Text>
                  <span className="mt-1 line-clamp-3 block break-words text-sm leading-5 text-slate-600">
                    {item.content}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : loading ? (
        <div className="h-28" />
      ) : (
        <Empty className="my-8" description="Chưa có thông báo" />
      )}
    </Spin>
  );

  const desktopContent = (
    <div className="w-[380px] max-w-[calc(100vw-32px)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-1 pb-3">
        <Text strong>Thông báo</Text>
        <Button
          type="text"
          size="small"
          icon={<CheckCheck className="h-4 w-4" />}
          disabled={unread === 0}
          onClick={() => void markAllRead()}
        >
          Đã đọc hết
        </Button>
      </div>
      {notificationList}
    </div>
  );

  const renderBellButton = (onClick?: () => void) => (
    <button
      type="button"
      aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
      onClick={onClick}
    >
      <Badge count={unread} size="small" overflowCount={99}>
        <Bell className="h-[18px] w-[18px]" />
      </Badge>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {renderBellButton(() => handleOpenChange(true))}
        <Drawer
          title="Thông báo"
          placement="bottom"
          size="min(78dvh, 640px)"
          open={open}
          onClose={() => handleOpenChange(false)}
          extra={
            <Button
              type="text"
              size="small"
              icon={<CheckCheck className="h-4 w-4" />}
              disabled={unread === 0}
              onClick={() => void markAllRead()}
            >
              Đã đọc hết
            </Button>
          }
          styles={{ body: { padding: 0, overflow: 'hidden' } }}
        >
          {notificationList}
        </Drawer>
      </>
    );
  }

  return (
    <Popover
      content={desktopContent}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={handleOpenChange}
    >
      {renderBellButton()}
    </Popover>
  );
}
