## Why

Review module Weekly Order (2026-09-24) tìm ra các lỗi đang làm sai dữ liệu thật:
- Lưu lại tuần CONFIRMED làm phình số giao NCC.
- Allocation bị tạo trùng.
- Xác nhận tuần báo 500 dù đã thành công.
- Race khi nhập kho; stock-adjust có thể write-off 2 lần.
- `fn_re_reserve_after_remove_po` nhả cả cuộn đã nhận/mượn cho tuần.
- Chuỗi ghi nhiều bước không có transaction.

## What Changes

- **Lưu tạm / Áp dụng chính thức** cho tuần CONFIRMED: ROOT sửa ở `[id].vue` → "Lưu tạm" ghi `draft_summary_data` → "Áp dụng chính thức" mới ghi `summary_data` và sync delivery NCC trong 1 transaction.
- Tuần CONFIRMED đóng băng tồn kho (`full/partial/equivalent_cones`) theo `summary_data` chính thức khi tính lại `sl_can_dat`.
- Ngừng tạo allocation từ save-results; 184 dòng cũ giữ nguyên.
- Confirm gọi `fn_confirm_week_with_reserve` 1 lần, bỏ vòng retry.
- Nhập kho, PATCH delivery, stock-adjust, tạo/sửa/xoá tuần, kho, remove-po, huỷ tuần: bọc `tx()` + lock tuần `FOR UPDATE`.
- Stock-adjust gửi `expected_current_cones` (compare-and-set, 409 khi lệch).
- `fn_re_reserve_after_remove_po` chỉ nhả phần dư trong nhóm cuộn lấy từ tồn.
- `fn_manual_return_loan` bỏ điều kiện `deleted_at` không tồn tại.
- Migration cũ `20260613084500` chuyển sang `supabase/snippets/obsolete/`.
- FE `index.vue`:
  - Khoá Lưu/Xác nhận khi kết quả cũ hoặc vượt SL PO.
  - Tuần đã xác nhận chỉ xem.
  - Ẩn xoá PO khi tuần đã lưu.
  - Kéo thả giữ thứ tự và các chỉnh sửa.
- FE `StyleOrderCard`: cảnh báo và chọn Sub-art ngay trên thẻ.

Ngoài phạm vi (ghi ở `backlog.md`): audit `thread_movements`, `weight_grams`, mọi phần mượn, các mục Trung bình/Thấp.

## Impact

- **DB:** 3 migration mới `20260924110000`, `20260924111000`, `20260924112000` (đã apply live).
- **BE:**
  - `server/routes/weekly-order/{core,deliveries,save-results,save-results-helpers,enrich-helper,stock-adjust}.ts`
  - `server/utils/weekly-order-unlock.ts`, `server/db/query.ts` (`runOn`)
  - `server/validation/weeklyOrderStockAdjust.ts`
- **FE:**
  - `src/pages/thread/weekly-order/{index,[id]}.vue`
  - `POOrderCard.vue`, `StyleOrderCard.vue`, `AdjustWeekStockDialog.vue`
  - `useWeeklyOrderCalculation.ts`, `weeklyOrderService.ts`, `weeklyOrderStockAdjustService.ts`, `types/thread/weeklyOrder.ts`
- **API mới:** `POST /api/weekly-orders/:id/results/apply`, `POST /api/weekly-orders/:id/results/discard-draft`.
