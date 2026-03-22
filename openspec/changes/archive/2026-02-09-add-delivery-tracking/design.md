## Context

The weekly thread ordering workflow (`/thread/weekly-order`) calculates thread requirements for multiple PO/Style/Color combinations and aggregates them into a summary table. Currently, the system shows supplier names (read-only from `style_thread_specs`) but has no delivery timeline information.

Key existing data points:
- `suppliers.lead_time_days` (default 7) — standard delivery time per supplier
- `style_thread_specs.supplier_id` — links each thread spec row to a supplier
- `thread_order_results.summary_data` (JSONB) — stores aggregated calculation snapshots
- The calculation API (`/api/thread-calculation/calculate-batch`) already joins `suppliers:supplier_id (id, name)` but only returns `supplier_name` as a string

## Goals / Non-Goals

**Goals:**
- Backend computes `delivery_date = NOW() + supplier.lead_time_days` during thread calculation
- Detail table (`ResultsDetailView.vue`) displays a read-only "Ngày giao" column
- Delivery records are persisted in a dedicated table when weekly order results are saved
- A delivery management page allows viewing and editing delivery dates, tracking actual delivery, and monitoring status
- Days remaining auto-decrements as time passes (computed field, not stored)

**Non-Goals:**
- No supplier order creation workflow (PO to supplier) — this is tracking only
- No notifications/alerts for overdue deliveries (future enhancement)
- No changes to the summary/aggregation table (`ResultsSummaryTable.vue`) — delivery dates only in detail view
- No real-time subscription for delivery updates

## Decisions

### 1. Dedicated `thread_order_deliveries` table vs JSONB in `thread_order_results`

**Decision**: Dedicated table.

**Rationale**: Delivery records need independent lifecycle — they are created when results are saved, but then updated over time (delivery_date changes, actual_delivery_date recorded, status transitions). JSONB would make querying by delivery_date, filtering by status, and cross-week reporting difficult. A relational table supports proper FK constraints, indexes, and clean CRUD operations.

**Alternative considered**: Storing `delivery_date` in `summary_data` JSONB — simpler but cannot be queried efficiently and doesn't support independent status tracking.

### 2. Compute `delivery_date` at calculation time vs at save time

**Decision**: Compute at calculation time (in the `/api/thread-calculation/calculate-batch` response), then persist at save time.

**Rationale**: Users need to see expected delivery dates immediately after calculation, before deciding whether to save. The calculation endpoint already joins the `suppliers` table and has `supplier_id` available. Adding `lead_time_days` to the join and computing the date is trivial. When results are saved, the backend creates/updates delivery records using the computed dates.

### 3. `delivery_date` computation: DB-level vs application-level

**Decision**: Application-level in the Hono route handler.

**Rationale**: `NOW() + lead_time_days * INTERVAL '1 day'` could be done in SQL, but since the calculation is already assembled in JavaScript (the `buildCalculation` function), it's cleaner to compute it there. This keeps the logic visible and testable.

### 4. Delivery management page location

**Decision**: New page at `/thread/weekly-order/deliveries` showing all deliveries grouped by week, with filter/sort by status and date.

**Rationale**: Delivery tracking is tightly coupled with weekly ordering, so it belongs under that route namespace. A separate page (not a tab on the existing page) keeps the weekly order page focused on calculation and the delivery page focused on tracking.

### 5. Delivery status model

**Decision**: Simple status enum: `pending` → `delivered` → `overdue` (computed). Only `pending` and `delivered` are stored; `overdue` is computed when `delivery_date < NOW() AND status = 'pending'`.

**Rationale**: Minimal state machine — the business process is simple. A delivery is either waiting or completed. Overdue is a derived state, not a user action.

## Risks / Trade-offs

- **[Risk]** Changing the `CalculationItem` response shape could break existing consumers → **Mitigation**: New fields (`supplier_id`, `delivery_date`, `lead_time_days`) are additive and optional. No existing fields are removed or renamed.

- **[Risk]** Delivery records could become orphaned if weekly order is deleted → **Mitigation**: `ON DELETE CASCADE` on `week_id` FK in `thread_order_deliveries`.

- **[Risk]** `lead_time_days` could be NULL or 0 for some suppliers → **Mitigation**: Default to 7 days when `lead_time_days` is NULL or ≤ 0. This matches the existing `suppliers` table default.

- **[Trade-off]** Delivery records are created per-aggregated-row (by `thread_type_id`), not per-detail-row (by `spec_id`). This means one delivery record per unique thread type per week, which matches the summary table granularity. Detail rows for the same thread type share the same delivery date.
