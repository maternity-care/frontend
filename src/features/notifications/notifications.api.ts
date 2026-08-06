import { apiClient, unwrapApiData } from '@/lib/axios';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

export function getMyNotifications(limit = 30) {
  return unwrapApiData<AppNotification[]>(apiClient.get('/notifications', { params: { limit } }));
}

export function getUnreadNotificationCount() {
  return unwrapApiData<{ count: number }>(apiClient.get('/notifications/unread-count'));
}

export function markNotificationRead(id: string) {
  return unwrapApiData<AppNotification>(apiClient.patch(`/notifications/${encodeURIComponent(id)}/read`));
}

export function markAllNotificationsRead() {
  return unwrapApiData<{ affected: number }>(apiClient.patch('/notifications/read-all'));
}
