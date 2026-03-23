## 1. Types

- [x] 1.1 Add `AssignmentSummaryRow` interface to `src/types/thread/weekly-order.ts`
- [x] 1.2 Export the new type from `src/types/thread/index.ts`

## 2. Backend API

- [x] 2.1 Add `GET /api/weekly-orders/assignment-summary` route to `server/routes/weeklyOrder.ts`
- [x] 2.2 Implement query to extract planned cones from `thread_order_results.summary_data` JSONB
- [x] 2.3 Implement query to count reserved cones from `thread_inventory` by `reserved_week_id`
- [x] 2.4 Implement query to sum allocated cones from `thread_allocations` by `week_id`
- [x] 2.5 Aggregate results and compute gap (reserved - planned) ← (verify: response format matches spec, gap calculation correct)

## 3. Frontend Service

- [x] 3.1 Add `getAssignmentSummary(status?: string)` method to `src/services/weeklyOrderService.ts`

## 4. Dialog Component

- [x] 4.1 Create `src/components/thread/weekly-order/AssignmentControlDialog.vue` with basic structure
- [x] 4.2 Implement QDialog with responsive sizing (800px desktop, full-width mobile)
- [x] 4.3 Add header with title "Kiểm Soát Chỉ Đã Gán Theo Tuần" and close button
- [x] 4.4 Add week status filter dropdown (DRAFT, CONFIRMED, COMPLETED, CANCELLED)
- [x] 4.5 Implement QTable with columns: Tuần, Loại chỉ, Planned, Reserved, Allocated, Gap
- [x] 4.6 Add red text styling for negative gap values
- [x] 4.7 Implement loading state using QTable built-in loading
- [x] 4.8 Implement empty state with message "Chưa có tuần đặt hàng nào được xác nhận"
- [x] 4.9 Add refresh button functionality
- [x] 4.10 Wire filter change to re-fetch data ← (verify: all UI states work - loading, empty, data, negative gap styling)

## 5. Integration

- [x] 5.1 Add "Kiểm soát chỉ đã gán" button to `src/pages/thread/weekly-order/index.vue` header actions
- [x] 5.2 Import and add AssignmentControlDialog to template
- [x] 5.3 Add `showAssignmentControl` ref and wire to button/dialog ← (verify: button opens dialog, dialog closes properly, full flow works)
