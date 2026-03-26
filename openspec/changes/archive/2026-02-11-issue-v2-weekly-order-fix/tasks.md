## 1. Route Ordering Fix

- [x] 1.1 In `server/index.ts`, move `app.route('/api/issues/v2', issuesV2Router)` to line before `app.route('/api/issues', issuesRouter)`
- [x] 1.2 Verify route order: reconciliation → v2 → issues (most specific first)

## 2. Backend - Order Options Endpoint

- [x] 2.1 Add Zod schema `OrderOptionsQuerySchema` in `server/validation/issuesV2.ts` for optional `po_id` and `style_id` params
- [x] 2.2 Create `GET /api/issues/v2/order-options` endpoint in `server/routes/issuesV2.ts`
- [x] 2.3 Implement query logic: join `thread_order_items` with `thread_order_weeks` where `status = 'confirmed'` and `po_id IS NOT NULL`
- [x] 2.4 Return distinct POs when no params provided
- [x] 2.5 Return distinct Styles filtered by `po_id` when only `po_id` provided
- [x] 2.6 Return distinct Colors filtered by `po_id` and `style_id` when both provided
- [x] 2.7 Include related data: PO (`id, po_number`), Style (`id, style_code, style_name`), Color (`id, name, hex_code`)

## 3. Frontend - Service Layer

- [x] 3.1 Add `getOrderOptions(poId?: number, styleId?: number)` method to `src/services/issueV2Service.ts`
- [x] 3.2 Add TypeScript types for order options response in `src/types/thread/issueV2.ts`

## 4. Frontend - Issue V2 Page Updates

- [x] 4.1 Replace `loadInitialOptions()` to call `getOrderOptions()` for PO list only
- [x] 4.2 Remove calls to `purchaseOrderService.getAll()` and `styleService.getAll()`
- [x] 4.3 Update `watch(selectedPoId)` to call `getOrderOptions(poId)` for Styles
- [x] 4.4 Update `watch(selectedStyleId)` to call `getOrderOptions(poId, styleId)` for Colors
- [x] 4.5 Add empty state messages for each dropdown when no options available
- [x] 4.6 Clear dependent selections when parent changes (PO change → clear Style & Color)

## 5. Weekly Order - Confirm Button

- [x] 5.1 Replace "Tạo phiếu phân bổ" button with "Xác nhận tuần" in weekly-order page
- [x] 5.2 Add `handleConfirmWeek()` function to call `weeklyOrderService.updateStatus(id, 'confirmed')`
- [x] 5.3 Remove unused allocation-related code (dialog, candidates, columns)

## 6. Testing & Verification

- [ ] 6.1 Test route fix: `GET /api/issues/v2/form-data` returns data (not 404)
- [ ] 6.2 Test order-options with no params returns POs from confirmed weeks only
- [ ] 6.3 Test cascading: PO selection loads correct Styles, Style selection loads correct Colors
- [ ] 6.4 Test empty states: no confirmed weeks shows appropriate message
- [ ] 6.5 Test confirm button: clicking "Xác nhận tuần" changes status to confirmed
