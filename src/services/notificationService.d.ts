import type { Notification, NotificationListParams } from '@/types/notification';
export declare const notificationService: {
    getNotifications(params?: NotificationListParams): Promise<Notification[]>;
    getUnreadCount(): Promise<number>;
    markAsRead(id: number): Promise<void>;
    markAllAsRead(): Promise<void>;
    deleteNotification(id: number): Promise<void>;
};
