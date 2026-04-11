## Context

The weekly order system allows users to add POs (Purchase Orders), calculate thread requirements, and save/confirm orders. When a PO is removed from a weekly order, the current flow only removes items from the Vue component state -- no backend call deletes the corresponding `thread_order_items` rows. On page reload, items reappear because they still exist in the database.

Additionally, `syncDeliveries` in `save-results-helpers.ts` builds a `desiredDeliveryMap` from the current summary rows and creates new deliveries or updates existing ones, but never identifies deliveries that exist in the DB without a matching entry in the desired set. This means orphan PENDING deliveries persist indefinitely after thread types are removed from the order.

The route file `server/routes/weekly-order/core.ts` currently defines routes in this order: static routes (`/check-name`, `/assignment-summary`, `/ordered-quantities`, etc.) before parameterized routes (`/:id`, `/:id/status`, `/:id/leader-sign`). The new `/:id/remove-po` route follows this pattern.

## Goals / Non-Goals

**Goals:**
- Persist PO removal by deleting `thread_order_items` for a specific PO within a weekly order via a backend endpoint
- Clean up orphan PENDING deliveries (received_quantity = 0 or NULL) when they no longer appear in the desired delivery set during `syncDeliveries`
- Maintain safety: never delete DELIVERED deliveries or those with received inventory
- Support removal for both DRAFT and CONFIRMED weekly orders

**Non-Goals:**
- Automatic recalculation after PO removal (user must manually recalculate)
- Cleanup of thread_allocations (allocations are created during confirm, and existing allocation cleanup is a separate concern)
- Batch removal of multiple POs in a single call
- UI changes beyond updating `handleRemovePO` to call the backend

## Decisions

### 1. POST verb for remove-po endpoint
Use `POST /:id/remove-po` rather than `DELETE /:id/po/:poId`. The action is not a RESTful resource deletion -- it is a command that removes a subset of items based on a filter (po_id). POST better represents this command-style operation and aligns with existing patterns in the codebase (e.g., `POST /:id/results`, `POST /deliveries/:id/receive`).

### 2. Orphan cleanup inside syncDeliveries (not in the remove-po endpoint)
Orphan delivery cleanup happens in `syncDeliveries` rather than in the remove-po endpoint itself. This is because:
- `syncDeliveries` already has the complete picture of desired vs. existing deliveries
- The remove-po endpoint only removes items; the recalculation + save triggers `syncDeliveries`
- This approach handles orphans from any source (PO removal, manual style removal, recalculation changes), not just PO removal

### 3. Safety guards for orphan deletion
Only delete deliveries where ALL conditions are met:
- `status = 'PENDING'`
- `received_quantity IS NULL OR received_quantity = 0`
- The delivery's composite key (`thread_type_id_thread_color`) is NOT in the desired delivery map

This prevents any data loss for deliveries that have already been partially or fully received.

### 4. Frontend conditional behavior
`handleRemovePO` checks whether the week is persisted (`selectedWeek.value?.id` exists). If persisted, it calls the backend first and only updates client state on success. If unsaved, it keeps current client-side-only behavior. This avoids unnecessary API calls for new unsaved weeks.

## Risks / Trade-offs

- **[Risk] Race condition on concurrent PO removal** -- Two users removing POs from the same week simultaneously could interleave. Mitigation: The endpoint deletes by `week_id + po_id` filter, which is idempotent. Two identical calls produce the same result.
- **[Risk] Orphan cleanup deletes deliveries the user still wants** -- Mitigation: Only PENDING deliveries with zero received quantity are deleted. If a delivery has been partially received, it is preserved.
- **[Trade-off] No automatic recalculation after PO removal** -- The user must manually click "Tính" (Calculate) after removing a PO. This was chosen because automatic recalculation could be slow and unexpected. The UI already shows "kết qua da cu" (stale results) indicator.
- **[Trade-off] Orphan cleanup only runs on save/confirm, not immediately on PO removal** -- This means orphan deliveries persist until the next save. Acceptable because the save flow is the natural point where deliveries are synced.
