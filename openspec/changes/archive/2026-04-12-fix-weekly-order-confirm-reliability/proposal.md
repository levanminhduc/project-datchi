## Why

The weekly order confirmation flow silently fails in three ways: (1) an RPC error 42883 falls through without returning an error, marking the order as CONFIRMED with no thread cones actually reserved; (2) saveResults failure does not block confirmWeek, so confirmation proceeds with unsaved data; (3) the frontend's 10-second timeout is shorter than the backend RPC processing time, causing the UI to show an error while the database has already committed the confirmation. These bugs result in orders being "missed" — marked as confirmed but with no reservations or with inconsistent data.

## What Changes

- **Fix silent fallthrough on RPC error 42883** in the PATCH /:id/status endpoint — return a 500 error instead of setting lastError=null and breaking out of the retry loop
- **Remove side effects from PATCH /:id/status** — extract broadcastNotification, dispatchExternalNotification, and syncDeliveries into dedicated endpoints so the status endpoint only performs the atomic confirm + reserve operation
- **Add idempotent check** to PATCH /:id/status — if status is already CONFIRMED, return success with current data (enables safe frontend retries)
- **Add POST /:id/sync-deliveries endpoint** — dedicated endpoint for syncing delivery data after confirmation
- **Add POST /:id/notify endpoint** — dedicated endpoint for sending in-app and external notifications after confirmation
- **Fix error propagation in useWeeklyOrder.ts** — ensure saveResults failure is detected by handleConfirmWeek so it stops the flow
- **Add timeout configuration** to weeklyOrderService.updateStatus — support 60s timeout for the confirmation RPC call
- **Create ConfirmProgressDialog.vue** — new component showing step-by-step confirmation progress with per-step status indicators
- **Rewrite handleConfirmWeek in index.vue** — replace monolithic fire-and-forget flow with 4 sequential steps (save, confirm+reserve, sync deliveries, notify), each gated on the previous step's success

## Capabilities

### New Capabilities
- `confirm-progress-ui`: Step-by-step confirmation progress dialog showing 4 sequential phases with real-time status feedback per step

### Modified Capabilities
- `weekly-order-reserve`: The confirmation endpoint changes from a monolithic operation (confirm + reserve + sync + notify) to an atomic confirm+reserve-only operation, with sync and notify split into separate endpoints. Adds idempotent retry support and fixes the RPC error 42883 silent fallthrough.

## Impact

- **Backend routes**: `server/routes/weekly-order/core.ts` — modified PATCH /:id/status, two new POST endpoints
- **Frontend service**: `src/services/weeklyOrderService.ts` — new service methods, timeout config
- **Composable**: `src/composables/thread/useWeeklyOrder.ts` — error propagation fix
- **New component**: `src/components/thread/weekly-order/ConfirmProgressDialog.vue`
- **Page**: `src/pages/thread/weekly-order/index.vue` — rewritten confirmation flow
- **No database migrations required** — all changes are at the application layer
- **No breaking API changes for other consumers** — the PATCH endpoint still confirms orders; removed side effects are now available via new dedicated endpoints
