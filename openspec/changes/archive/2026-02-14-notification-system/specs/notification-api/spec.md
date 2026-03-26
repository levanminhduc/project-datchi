## ADDED Requirements

### Requirement: Notification service
The frontend SHALL have a `notificationService` in `src/services/notificationService.ts` that wraps all notification API calls using `fetchApi`. Methods: `getNotifications(params?)`, `getUnreadCount()`, `markAsRead(id)`, `markAllAsRead()`, `deleteNotification(id)`.

#### Scenario: Fetch notifications
- **WHEN** `notificationService.getNotifications()` is called
- **THEN** it SHALL call `fetchApi('/api/notifications')` and return the notification array

#### Scenario: Get unread count
- **WHEN** `notificationService.getUnreadCount()` is called
- **THEN** it SHALL call `fetchApi('/api/notifications/unread-count')` and return the count number

### Requirement: useNotifications composable
The frontend SHALL have a `useNotifications` composable in `src/composables/useNotifications.ts` that manages notification state. It SHALL provide: `notifications` (ref), `unreadCount` (ref), `isLoading` (ref), `fetchNotifications()`, `fetchUnreadCount()`, `markAsRead(id)`, `markAllAsRead()`, `deleteNotification(id)`, `startPolling()`, `stopPolling()`.

#### Scenario: Polling every 30 seconds
- **WHEN** `startPolling()` is called
- **THEN** the composable SHALL call `fetchUnreadCount()` immediately and then every 30 seconds via `setInterval`

#### Scenario: Stop polling on unmount
- **WHEN** the component using `useNotifications` is unmounted
- **THEN** the polling interval SHALL be cleared

#### Scenario: Shared state across components
- **WHEN** multiple components use `useNotifications()`
- **THEN** they SHALL share the same reactive state (module-level refs, not per-instance)

### Requirement: NotificationBell component
The frontend SHALL have a `<NotificationBell />` component in `src/components/ui/NotificationBell.vue` that displays a bell icon with unread count badge in the toolbar.

#### Scenario: Show unread badge
- **WHEN** `unreadCount > 0`
- **THEN** a badge with the count SHALL be displayed on the bell icon (red/accent color)

#### Scenario: Hide badge when no unread
- **WHEN** `unreadCount === 0`
- **THEN** no badge SHALL be shown

#### Scenario: Click bell opens dropdown
- **WHEN** the user clicks the bell icon
- **THEN** a dropdown menu SHALL appear showing the latest 20 notifications with title, body preview, time ago, and read/unread indicator

#### Scenario: Click notification in dropdown
- **WHEN** the user clicks a notification item in the dropdown
- **THEN** the notification SHALL be marked as read and the user SHALL be navigated to `action_url` if present

#### Scenario: Mark all as read button
- **WHEN** the user clicks "Đánh dấu tất cả đã đọc" in the dropdown header
- **THEN** all notifications SHALL be marked as read and the badge SHALL disappear

#### Scenario: Empty state
- **WHEN** there are no notifications
- **THEN** the dropdown SHALL show "Không có thông báo mới"

### Requirement: NotificationBell placement in App.vue
The `<NotificationBell />` component SHALL be placed in `App.vue` toolbar, between `<q-toolbar-title>` and `<DarkModeToggle />`. It SHALL only render when the user is authenticated (not on login page).

#### Scenario: Visible when authenticated
- **WHEN** the user is on any page except `/login`
- **THEN** the bell icon SHALL be visible in the toolbar

#### Scenario: Hidden on login page
- **WHEN** the user is on `/login`
- **THEN** the bell icon SHALL NOT be rendered

### Requirement: Notification type icons and colors
Each notification type SHALL have a distinct icon and color for visual differentiation in the dropdown.

#### Scenario: Type visual mapping
- **WHEN** a notification of type `STOCK_ALERT` is displayed
- **THEN** it SHALL show a warning icon in orange/amber color
- **WHEN** a notification of type `CONFLICT` is displayed
- **THEN** it SHALL show an error/alert icon in red color
- **WHEN** a notification of type `BATCH_RECEIVE` is displayed
- **THEN** it SHALL show an inbox/receive icon in green color
- **WHEN** a notification of type `BATCH_ISSUE` is displayed
- **THEN** it SHALL show an outbox/send icon in blue color

### Requirement: Time ago display
Notification timestamps SHALL be displayed as relative time (e.g., "5 phút trước", "2 giờ trước", "Hôm qua"). Vietnamese language SHALL be used.

#### Scenario: Recent notification
- **WHEN** a notification was created 3 minutes ago
- **THEN** it SHALL display "3 phút trước"

#### Scenario: Old notification
- **WHEN** a notification was created 2 days ago
- **THEN** it SHALL display "2 ngày trước"
