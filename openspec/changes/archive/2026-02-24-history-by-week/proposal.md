## Why

The current order history page (`/thread/weekly-order/history`) displays a flat table of individual order items. When multiple items belong to the same week, the week info is repeated across rows making it hard to scan. More critically, there is no visibility into PO progress — users cannot see how much of a PO's total quantity has been ordered across all weeks vs. how much remains. This makes it difficult to plan future orders without manually cross-referencing data.

## What Changes

- **New BE endpoint** `GET /api/weekly-orders/history-by-week` that returns order history grouped by week, with items nested under PO → Style → Color hierarchy, including PO progress data (total ordered, remaining, percentage)
- **BREAKING: Remove** `GET /api/weekly-orders/order-history` endpoint (flat item-centric) — replaced entirely by the new endpoint
- **Remove** associated BE types (`OrderHistoryQuerySchema`) and FE types (`OrderHistoryItem`, `OrderHistoryFilter`) and service method (`getOrderHistory`)
- **Rewrite** `history.vue` page from flat q-table to week-centric accordion/expandable UI with:
  - Collapsed row: week name, creator, date, status, total SP
  - Expanded view: items grouped by PO → Style with color breakdown
  - Progress bar per style showing ordered/total PO quantity with color coding (normal, warning at 80%+, complete at 100%, over at >100%)
- **Add status filter** to history page — default hides CANCELLED weeks, user can opt-in to see them

## Capabilities

### New Capabilities
- `week-history-api`: New BE endpoint returning week-grouped order history with embedded PO progress calculations
- `week-history-ui`: Rewritten FE history page with accordion layout, PO progress bars, and status filter

### Modified Capabilities
_(none — no existing spec requirements are changing)_

## Impact

- **BE**: `server/routes/weeklyOrder.ts` (add new route, remove old route), `server/validation/weeklyOrder.ts` (add new schema, remove old), `server/types/weeklyOrder.ts` (add new interfaces)
- **FE**: `src/pages/thread/weekly-order/history.vue` (full rewrite), `src/services/weeklyOrderService.ts` (add new method, remove old), `src/types/thread/weeklyOrder.ts` (add new types, remove old)
- **Breaking**: Any external consumers of `GET /api/weekly-orders/order-history` will break (verified: only `history.vue` uses it)
