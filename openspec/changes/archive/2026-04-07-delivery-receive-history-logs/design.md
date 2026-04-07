## Context

The deliveries page (`thread/weekly-order/deliveries.vue`) currently has two tabs: "Theo doi giao hang" and "Nhap kho". The `fn_receive_delivery` RPC updates `received_by`, `received_at`, and `warehouse_id` directly on `thread_order_deliveries`, overwriting prior values on each partial receive. There is no audit trail of who received what and when.

Existing patterns for similar log tables: `thread_loan_return_logs` (FK to `thread_order_loans`, `created_by`, `created_at`, no `updated_at`) and `thread_issue_return_logs`. These are append-only, immutable log tables.

## Goals / Non-Goals

**Goals:**
- Persist every receive event with quantity, warehouse, operator, and timestamp
- Provide an API to query receive logs with optional filters (delivery_id, week_id)
- Add a "Lich su nhap kho" tab to the deliveries page showing chronological history
- Zero disruption to existing receive flow — log insertion is additive inside the same transaction

**Non-Goals:**
- Editing or deleting log entries (immutable audit trail)
- Migrating historical receive data (only new receives going forward)
- Changing the existing `received_by`/`received_at` columns on `thread_order_deliveries` — they continue to store the latest receive info
- Real-time/push updates for the history tab (polling or manual refresh is sufficient)

## Decisions

### 1. Separate log table vs `thread_movements`
**Choice:** New `delivery_receive_logs` table.
**Rationale:** `thread_movements` is for cone-level inventory movements. Receive logs are delivery-level events with different granularity (cones vs receive batches). A dedicated table keeps queries simple, avoids overloading `thread_movements` with a new movement type, and follows the established pattern (`thread_loan_return_logs`, `thread_issue_return_logs`).
**Alternative considered:** Adding `type = 'RECEIVE'` rows to `thread_movements` — rejected because it mixes grain levels and complicates existing movement queries.

### 2. No `updated_at` / `deleted_at` columns
**Choice:** Only `created_at`. No soft delete.
**Rationale:** Log entries are immutable facts. They are never edited or removed. Follows `thread_loan_return_logs` pattern exactly.

### 3. `received_by` as VARCHAR(100) not FK to employees
**Choice:** Store operator name as text, same as `thread_order_deliveries.received_by`.
**Rationale:** Matches existing pattern. Employee names are stable enough for audit purposes. Avoids FK complexity when employees are deactivated.

### 4. Log insertion inside `fn_receive_delivery` (not in API layer)
**Choice:** Add INSERT into the existing RPC function body.
**Rationale:** Guarantees atomicity — if the delivery update succeeds, the log is written. No risk of partial state. Follows the pattern where `fn_auto_return_loans` and `fn_manual_return_loan` write to `thread_loan_return_logs` inside their function bodies.

### 5. API endpoint as query-param filtered list (not nested under `/:deliveryId`)
**Choice:** `GET /api/weekly-orders/deliveries/receive-logs?delivery_id=X&week_id=Y`
**Rationale:** The history tab shows logs across all deliveries for a week, not just one delivery. A flat endpoint with optional filters is more flexible. Route is placed BEFORE `/:deliveryId` to avoid path conflicts.

### 6. Frontend: simple DataTable with server-side pagination
**Choice:** Use DataTable pattern with limit/offset.
**Rationale:** Log volume grows over time. Server-side pagination keeps the page responsive. Matches existing patterns throughout the app.

## Risks / Trade-offs

- **[Stale `fn_receive_delivery` reference]** The RPC function has been modified multiple times (latest migration `20260405223300`). The migration must use `CREATE OR REPLACE FUNCTION` and incorporate the full current body plus the new INSERT. **Mitigation:** Read the latest migration to get the current function body before writing the new one.
- **[No backfill of historical data]** Existing partial receives have no log entries. **Mitigation:** Accepted as non-goal. The `received_by`/`received_at` on the delivery row still reflects the last receive, which is the only data available.
- **[Index overhead on high-volume table]** Two indexes on `delivery_receive_logs`. **Mitigation:** Acceptable — receive events are low-frequency (a few per delivery, dozens per week). The table will grow slowly.
