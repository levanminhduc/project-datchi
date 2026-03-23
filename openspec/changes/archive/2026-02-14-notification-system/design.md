## Context

Thread Inventory Management System currently has no notification mechanism. Users must manually check pages for updates. The system already has:
- Supabase Realtime (`useRealtime` composable) for WebSocket subscriptions
- `useSnackbar` for ephemeral toasts
- Dashboard activity feed (`/api/dashboard/activity`) tracking movements, allocations, conflicts
- JWT-based auth with `employees` table (id SERIAL PK, employee_id VARCHAR), roles, permissions
- All API routes go through `authMiddleware` which attaches `auth.employeeId` (numeric id)

The notification system will persist notifications per employee, support hybrid creation (DB triggers for simple events + backend logic for complex ones), and use polling (not WebSocket) for delivery.

## Goals / Non-Goals

**Goals:**
- Persist per-employee notifications for important business events
- Show unread count badge and dropdown list on the toolbar bell icon
- Auto-create notifications via DB triggers for batch receive/issue and stock alerts
- Programmatically create notifications from backend for allocations, conflicts, recovery, weekly orders
- Support mark-as-read (single + all) and soft delete
- Poll every 30 seconds for new notifications

**Non-Goals:**
- Dedicated notifications page (dropdown only)
- Push notifications (browser/mobile)
- Notification preferences/settings per user
- Email/SMS notification channels
- WebSocket/Realtime delivery (polling only)
- Notification for login/logout or system-level events

## Decisions

### 1. Notification Storage

**Decision:** Single `notifications` table with `employee_id` FK, `type` enum, `is_read` boolean, `action_url` for navigation, `metadata` JSONB for event-specific data. Soft delete via `deleted_at`.

**Why:** Simple flat table covers all notification types. JSONB metadata avoids needing separate tables per notification type. Matches existing soft-delete pattern across the codebase.

**Alternative considered:** Separate tables per notification type — rejected because it fragments queries and complicates the bell component.

### 2. Notification Creation: Hybrid Approach

**Decision:**
- **DB triggers** for: batch movements (RECEIVE/ISSUE inserts on `thread_movements`), stock alerts (when inventory drops below reorder level)
- **Backend logic** for: allocation changes, conflict detection, recovery updates, weekly order status changes

**Why:** Batch movements and stock level checks are data-driven events easily captured at the DB level. Allocation/conflict/recovery/weekly order notifications need business context (who to notify, what message) that's easier to handle in application code.

**Alternative considered:** All DB triggers — rejected because targeting the right employee requires application-level role/permission logic. All backend — rejected because movements happen frequently and triggers ensure no event is missed.

### 3. Notification Targeting

**Decision:** Notifications target individual employees by `employee_id`. For broadcast events (e.g., stock alerts), the backend will insert one row per relevant employee (warehouse managers and warehouse staff).

**Why:** Per-employee rows allow individual read/delete state. The employee count is small (< 50) so broadcast duplication is not a concern.

**Alternative considered:** Broadcast table with per-user read tracking — adds complexity for minimal benefit at this scale.

### 4. Polling Strategy

**Decision:** Frontend polls `GET /api/notifications/unread-count` every 30 seconds. Full notification list is fetched on bell click (not pre-loaded).

**Why:** Minimizes bandwidth. Unread count is a single integer. Full list only loaded on demand. 30s interval balances freshness vs server load.

### 5. UI Component

**Decision:** `<NotificationBell />` component placed in `App.vue` toolbar between `<q-toolbar-title>` and `<DarkModeToggle />`. Uses Quasar `q-btn` with badge + `q-menu` dropdown. Shows last 20 notifications.

**Why:** Toolbar placement matches standard UX patterns. Quasar menu provides built-in click-outside-to-close and positioning.

### 6. Notification Types

**Decision:** Six notification types as string enum:
- `STOCK_ALERT` — inventory below reorder level
- `BATCH_RECEIVE` — new batch received
- `BATCH_ISSUE` — batch issued
- `ALLOCATION` — allocation created/approved/rejected
- `CONFLICT` — allocation conflict detected
- `RECOVERY` — recovery request created/updated
- `WEEKLY_ORDER` — weekly order status change

**Why:** Matches the existing business domains. Each type can have its own icon and color in the UI.

## Risks / Trade-offs

- **[DB trigger complexity]** → Triggers for stock alerts need to query `thread_types.reorder_level_meters` and compare with aggregated inventory. Keep trigger logic minimal — only check the affected thread type, not all types.
- **[Notification volume]** → High-frequency batch operations could generate many notifications. Mitigate with deduplication in triggers (don't create duplicate stock alerts within 1 hour) and periodic cleanup of old notifications (> 30 days).
- **[Polling vs Realtime]** → 30s polling means up to 30s delay. Acceptable for this use case. Can upgrade to Realtime subscription later if needed.
- **[No cleanup mechanism yet]** → Old notifications will accumulate. Non-goal for now; add a scheduled cleanup task in a future iteration.
