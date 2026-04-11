## 1. Backend Validation Schema

- [x] 1.1 Add `RemovePOFromWeekSchema` to `server/validation/weeklyOrder.ts` -- define Zod schema requiring `po_id` as `z.number().int().positive()` with Vietnamese error message

## 2. Backend Remove-PO Endpoint

- [x] 2.1 Import `RemovePOFromWeekSchema` in `server/routes/weekly-order/core.ts`
- [x] 2.2 Add `POST /:id/remove-po` route in `core.ts` AFTER `POST /` (line ~678) and BEFORE `PUT /:id` (line ~779) -- must be before any generic `/:id` route. Guard with `requirePermission('thread.allocations.manage')`
- [x] 2.3 Implement route handler: parse `id` param, validate body with `RemovePOFromWeekSchema`, fetch week to verify existence and check status is DRAFT or CONFIRMED (reject COMPLETED/CANCELLED with 400), delete `thread_order_items` WHERE `week_id` AND `po_id`, return `{ data: { removed_count }, error: null }` <- (verify: route is registered before PUT /:id, status validation rejects COMPLETED/CANCELLED, deletion targets correct table with correct filters)

## 3. Orphan Delivery Cleanup in syncDeliveries

- [x] 3.1 In `server/routes/weekly-order/save-results-helpers.ts`, after the existing sync/update block (after line ~152), add orphan detection logic: iterate `existingDeliveries`, find entries whose composite key (`thread_type_id_thread_color`) is NOT in `desiredDeliveryMap`
- [x] 3.2 For each orphan with `status === 'PENDING'` AND `(received_quantity === null || received_quantity === 0)`, collect its `id` for deletion
- [x] 3.3 Batch delete orphan delivery IDs using `supabase.from('thread_order_deliveries').delete().in('id', orphanIds)`, log each deletion with `console.info` including week_id, thread_type_id, and thread_color <- (verify: only PENDING deliveries with zero/null received_quantity are deleted, DELIVERED records and partially-received PENDING records are preserved, deletions are logged)

## 4. Frontend Service Method

- [x] 4.1 Add `removePOFromWeek(weekId: number, poId: number)` method to `src/services/weeklyOrderService.ts` -- call `POST ${BASE}/${weekId}/remove-po` with `{ po_id: poId }`, throw on error, return `{ removed_count }` <- (verify: method signature matches spec, uses fetchApi pattern, error handling consistent with other service methods)

## 5. Frontend Handler Update

- [x] 5.1 Update `handleRemovePO` in `src/pages/thread/weekly-order/index.vue` -- if `selectedWeek.value?.id` exists, call `weeklyOrderService.removePOFromWeek()` first, then update client state on success. Show `snackbar.success()` on success, `snackbar.error()` on failure without removing from client state. If no persisted week, keep current client-side-only behavior <- (verify: persisted weeks trigger backend call before client state update, unsaved weeks retain client-only behavior, error path does not modify client state)
