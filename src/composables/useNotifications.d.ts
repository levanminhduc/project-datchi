import type { NotificationListParams } from '@/types/notification';
export declare function useNotifications(): {
    notifications: any;
    unreadCount: any;
    isLoading: any;
    fetchNotifications: (params?: NotificationListParams) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    startPolling: (intervalMs?: number) => void;
    stopPolling: () => void;
};
