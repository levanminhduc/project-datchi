## 1. Database (db-agent)

- [x] 1.1 Create migration for `notifications` table with all columns, CHECK constraint on `type`, FK to `employees(id)`, indexes on `employee_id`, `is_read`, `created_at`, `type`
- [x] 1.2 Create trigger function `fn_notify_batch_movement()` on `thread_movements` for RECEIVE/ISSUE inserts — creates notifications for warehouse employees
- [x] 1.3 Create trigger function `fn_notify_stock_alert()` that checks available inventory vs reorder level and creates STOCK_ALERT with 1-hour deduplication
- [x] 1.4 Enable Supabase Realtime publication on `notifications` table (for potential future use)

## 2. Backend (backend-agent)

- [x] 2.1 Create notification types and Zod schemas in `server/types/notification.ts`
- [x] 2.2 Create `server/utils/notificationService.ts` with `createNotification()` and `broadcastNotification()` utility functions
- [x] 2.3 Create `server/routes/notifications.ts` with all endpoints: GET `/` (list with pagination/filter), GET `/unread-count`, PATCH `/:id/read`, PATCH `/read-all`, DELETE `/:id`
- [x] 2.4 Register notifications router in `server/index.ts` with authMiddleware
- [x] 2.5 Integrate `createNotification` calls into existing route handlers: allocations (status change), conflicts (new conflict), recovery (new request/status change)

## 3. Frontend (frontend-agent)

- [x] 3.1 Create notification types in `src/types/notification.ts`
- [x] 3.2 Create `src/services/notificationService.ts` with fetchApi wrapper for all notification endpoints
- [x] 3.3 Create `src/composables/useNotifications.ts` composable with shared state, polling (30s), and all notification methods
- [x] 3.4 Create `src/components/ui/NotificationBell.vue` component with bell icon, unread badge, dropdown menu, notification items with type icons/colors, time-ago display in Vietnamese
- [x] 3.5 Integrate `<NotificationBell />` into `App.vue` toolbar (between title and DarkModeToggle), conditional render when authenticated
