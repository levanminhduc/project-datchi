## Why

Removing a PO from a weekly order is currently client-side only -- `handleRemovePO` filters the local array but never calls the backend to delete `thread_order_items`. This means items reappear on page reload. Additionally, `syncDeliveries` only creates and updates delivery records, never deleting orphaned PENDING deliveries for thread types that are no longer in the summary after PO removal. These gaps cause data inconsistency between what the user sees and what the database holds.

## What Changes

- Add a new backend endpoint `POST /:weekId/remove-po` that atomically deletes all `thread_order_items` for a given PO within a weekly order, restricted to DRAFT and CONFIRMED status
- Enhance `syncDeliveries` to detect and delete orphan PENDING deliveries (received_quantity = 0 or NULL) whose thread types no longer appear in the desired delivery set
- Add Zod validation schema for the remove-po request body
- Add `removePOFromWeek` method to the frontend service
- Update `handleRemovePO` in the weekly order page to call the backend when the week is persisted, keeping client-side-only behavior for unsaved weeks

## Capabilities

### New Capabilities
- `po-removal-from-week`: Backend endpoint and frontend integration for safely removing a PO's items from a persisted weekly order

### Modified Capabilities
- `delivery-tracking`: Enhance `syncDeliveries` to clean up orphan PENDING deliveries when thread types are removed from the summary

## Impact

- **Backend**: New route in `server/routes/weekly-order/core.ts`, enhanced helper in `save-results-helpers.ts`, new schema in `server/validation/weeklyOrder.ts`
- **Frontend**: New service method in `src/services/weeklyOrderService.ts`, updated handler in `src/pages/thread/weekly-order/index.vue`
- **Data safety**: Only PENDING deliveries with zero received quantity are deleted; DELIVERED records are never touched
- **No breaking changes**: Existing save/confirm flows are unaffected; orphan cleanup is additive
