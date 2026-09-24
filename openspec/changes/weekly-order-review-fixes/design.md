## Context

Giữ nguyên thiết kế hiện có, dùng lại cơ chế sẵn có:
- Confirm tách 4 bước theo `openspec/specs/weekly-order-reserve/spec.md`: PATCH status không sync delivery; sync qua `POST /:id/sync-deliveries`.
- `tx()` ở `server/db/query.ts`.
- `isRootUnlocked`, `logWeekAudit`, `getPerformer` ở `server/utils/weekly-order-unlock.ts`.
- Idempotency nhập kho qua `delivery_receive_logs.idempotency_key`.

## Decisions

### Lưu tạm / Áp dụng chính thức
- Cột mới (nullable) trên `thread_order_results`: `draft_summary_data JSONB`, `draft_saved_at TIMESTAMPTZ`, `draft_saved_by VARCHAR(50)`.
- `POST /:id/results`:
  - Tuần DRAFT: upsert cột chính như cũ, không sync, không tạo allocation.
  - Tuần CONFIRMED: bắt buộc `isRootUnlocked` (403). Chỉ ghi các cột draft.
  - Tuần COMPLETED/CANCELLED: 400.
- `POST /:id/results/apply`, ROOT unlock, trong `tx()`:
  1. Lock tuần `FOR UPDATE`, rồi results `FOR UPDATE`.
  2. Chép draft sang `summary_data`, xoá draft.
  3. `syncDeliveries(client)`.
  4. `logWeekAudit(client)` với các dòng thay đổi (`pickChangedSummaryRows`).
- `POST /:id/results/discard-draft`: set NULL các cột draft.
- Mọi route nằm trong `save-results.ts`, không trùng với `/:id` generic.

### Đóng băng tồn kho cho tuần CONFIRMED (mục 6)
- Công thức chuẩn ở BE `enrich-helper.ts`:
  - `sl_can_dat = max(0, ceil((quota ?? total_cones) − equivalent_cones))`
  - `total_final = sl_can_dat + additional_order`
- Tuần CONFIRMED mà đếm tồn trống thì bỏ sót cuộn đã giữ cho chính tuần đó → `sl_can_dat` phình → đặt NCC thừa.
- Sửa: `enrichWithInventory(..., { frozenInventoryRows })` lấy `full/partial/equivalent_cones` từ `summary_data` chính thức. Dòng mới thêm lấy 0.
- FE `index.vue` `handleLoadWeek` phủ các cột này cho tuần không phải DRAFT, để số hiển thị khớp số chính thức.
- FE `[id].vue` dùng cùng công thức với `updateQuotaCones`/`updateAdditionalOrder`.

### Transaction
- `runOn(client | undefined, text, params)` trong `server/db/query.ts`.
- `syncDeliveries`, `logWeekAudit`, `insertOrderItemsWithEmbed`, `countCones` nhận `client?`.
- Khi có `client`, helper **ném lỗi lại** thay vì nuốt: lỗi bị nuốt trong tx làm COMMIT âm thầm thành ROLLBACK.
- Thứ tự lock thống nhất: tuần `FOR UPDATE` trước, rồi delivery/results.

### Nhập kho / PATCH delivery
- Nhập kho, trong tx:
  1. Lock tuần + delivery.
  2. Trùng `idempotency_key` → trả duplicate trước mọi kiểm tra.
  3. Delivery phải DELIVERED, tuần phải CONFIRMED.
  4. Kiểm tra số còn thiếu **sau lock**. ROOT vẫn được nhập vượt.
  5. `fn_receive_delivery`.
- PATCH delivery:
  - Delivery CANCELLED → 400; tuần không CONFIRMED → 400.
  - DELIVERED → PENDING bị chặn khi đã nhận > 0.
  - Đồng bộ `summary_data.delivery_date` và audit trong cùng tx.

### Stock-adjust
- Trong tx:
  1. Lock tuần.
  2. Đếm lại tồn; lệch `expected_current_cones` → 409.
  3. `fn_write_off_week_cones`.
  4. Số write-off ≠ số yêu cầu → rollback.
- Không dùng `issue_operations_log` vì CHECK của bảng này chỉ cho CONFIRM/RETURN/RETURN_GROUPED.

### `fn_re_reserve_after_remove_po` (release-only)
- Mỗi nhóm (type, color): nếu tương đương từ tồn > nhu cầu thì nhả phần dư. Chỉ nhả cuộn lấy từ tồn: không phải lot `WO-`, không có `receive_log_id`, không có `original_week_id`, có màu.
- Không giữ thêm (top-up): bản thử top-up làm tuần không đổi vẫn nhả/giữ lại hàng trăm cuộn.
- Dry-run:
  - Tuần 95 không đổi → nhả 0.
  - Tuần 95 bỏ 1 mã → nhả 65, giữ 16.
  - Tuần 19 → nhả 427, vì tuần này đang giữ dư so với calc hiện tại.

### Allocation
- Ngừng tạo từ save-results; đã xoá `createAllocations`.
- Bằng chứng: 184 dòng đều PENDING, chỉ ở tuần 14–20, dòng mới nhất 2026-04-10.
