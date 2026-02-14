## Why

Users currently have no way to receive notifications about important business events (new allocations, inventory conflicts, stock alerts, recovery requests, weekly order approvals) without manually checking each page. This leads to delayed responses and missed critical events. A notification system will keep users informed in real-time about events relevant to their role.

## What Changes

- New `notifications` database table to store per-user notifications with type, title, body, read status, and action URL
- DB trigger functions to auto-generate notifications for simple events (batch receive/issue, stock alerts)
- Backend notification service + Hono API routes (`/api/notifications`) for CRUD operations
- Frontend `useNotifications()` composable with 30-second polling
- `<NotificationBell />` component in the main toolbar header (App.vue) showing unread count badge and dropdown list
- Notification types: `stock_alert`, `allocation`, `conflict`, `recovery`, `batch`, `weekly_order`

## Capabilities

### New Capabilities
- `notification-storage`: Database table, types, and trigger functions for persisting notifications per employee
- `notification-api`: Hono API routes for listing, counting unread, marking read, and deleting notifications
- `notification-ui`: Bell icon component with badge count and dropdown, integrated into App.vue toolbar; useNotifications composable with polling

### Modified Capabilities

(none)

## Impact

- **Database**: New `notifications` table + trigger functions on `thread_movements`, `thread_allocations`, `thread_conflicts`, `thread_recovery`
- **Backend**: New route file `server/routes/notifications.ts`, new service, registration in `server/index.ts`
- **Frontend**: New composable `src/composables/useNotifications.ts`, new component `src/components/ui/NotificationBell.vue`, modified `src/App.vue` (add bell to toolbar)
- **Types**: New notification types in `src/types/`
- **Dependencies**: No new external dependencies required
