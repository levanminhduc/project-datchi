## 1. SQL

- [x] 1.1 Chuyển `supabase/migrations/20260613084500_fn_receive_delivery_overflow_reserve_to_week.sql` sang `supabase/snippets/obsolete/`
- [x] 1.2 `20260924110000_fix_fn_manual_return_loan.sql`: bỏ `thread_inventory.deleted_at`, chặn loan từ tồn, `FOR UPDATE`
- [x] 1.3 `20260924111000_add_draft_summary_thread_order_results.sql`: cột `draft_*`
- [x] 1.4 `20260924112000_fix_re_reserve_after_remove_po_delta.sql`: chỉ nhả phần dư của cuộn lấy từ tồn ← (verify: `\df fn_receive_delivery` còn 1 overload; dry-run tuần 95 không đổi → nhả 0)

## 2. Backend

- [x] 2.1 `server/db/query.ts`: thêm `runOn`
- [x] 2.2 `server/utils/weekly-order-unlock.ts`: `logWeekAudit(entry, client?)`
- [x] 2.3 `save-results-helpers.ts`: `syncDeliveries(..., client?)`, xoá `createAllocations`
- [x] 2.4 `enrich-helper.ts`: option `frozenInventoryRows`
- [x] 2.5 `save-results.ts`:
  - Tuần CONFIRMED chỉ ghi draft.
  - Thêm `POST /:id/results/apply` và `/:id/results/discard-draft`, đặt trong router save-results (không đụng `/:id` generic).
- [x] 2.6 `core.ts`:
  - Confirm gọi RPC 1 lần.
  - Tx cho tạo/sửa/xoá tuần, kho, remove-po, huỷ.
  - `PUT /:id` chặn sửa items khi tuần không phải DRAFT.
- [x] 2.7 `deliveries.ts`: PATCH + nhập kho trong tx, lock tuần → delivery
- [x] 2.8 `stock-adjust.ts` + `weeklyOrderStockAdjust.ts`: `expected_current_cones`, tx ← (verify: `npx tsx server/routes/weekly-order/{core-unlock,stock-adjust,transfer-reserved,progress-summary,process-trace}.test.ts` pass)

## 3. Frontend

- [x] 3.1 `src/types/thread/weeklyOrder.ts`: `draft_*`
- [x] 3.2 `weeklyOrderService.ts`: `applyResults`, `discardDraftResults`
- [x] 3.3 `[id].vue`:
  - Công thức giống composable.
  - Banner bản tạm + "Áp dụng chính thức"/"Huỷ bản tạm"; nút lưu đổi nhãn "Lưu tạm".
  - Reload sau khi điều chỉnh tồn; `watch(weekId)` → `loadAll()`.
- [x] 3.4 `AdjustWeekStockDialog.vue` + `weeklyOrderStockAdjustService.ts`: gửi `expected_current_cones`, 409 → tải lại preview
- [x] 3.5 `index.vue`:
  - Khoá Lưu/Xác nhận khi `isResultsStale`/`hasOverLimitEntries`.
  - Tuần không DRAFT chỉ xem.
  - `handleSave` trả boolean.
  - Phủ tồn đóng băng khi load tuần.
  - Reset `lastCalculatedWarehouseIds`.
- [x] 3.6 `POOrderCard.vue`: prop `canRemove` (index truyền `!selectedWeek`)
- [x] 3.7 `useWeeklyOrderCalculation.ts`:
  - `reorderResults` sắp lại `orderEntries`; `index.vue` gọi `handleCalculate`.
  - Sửa finder `updateSubArt`.
- [x] 3.8 `StyleOrderCard.vue`: cảnh báo "Chưa chọn Sub-art" + chọn Sub-art, emit `update-sub-art` ← (verify: `npm run type-check`, `eslint` các file đã sửa)

## 4. Kiểm thử thủ công (chưa làm)

- [ ] 4.1 index:
  - Sửa số lượng → Lưu/Xác nhận bị khoá tới khi tính lại.
  - Kéo thả giữ thứ tự + quota/đặt thêm.
  - Tuần CONFIRMED chỉ xem, số khớp bản chính thức.
- [ ] 4.2 [id] (ROOT unlock): sửa đặt thêm → Lưu tạm → Áp dụng → số giao NCC không thừa
- [ ] 4.3 Nhập kho cùng delivery ở 2 tab; stock-adjust gửi 2 lần → lần 2 trả 409
- [ ] 4.4 Đổi tuần qua URL trên trang chi tiết
