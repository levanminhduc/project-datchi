## Context

Trang `transfer-reserved` (`src/pages/thread/transfer-reserved.vue`) hiện có flow: chọn tuần → chọn kho nguồn → tải danh sách cuộn RESERVED → chọn cuộn → chuyển kho. Toàn bộ logic chính nằm trong composable `useTransferReserved`, backend handler tại `server/routes/weekly-order/transfer-reserved.ts`.

Vấn đề: không có cơ chế tìm theo PO number — nhân viên phải dò thủ công từng tuần. Feature này thêm search PO và summary dòng chỉ mà không thay đổi flow chuyển kho hiện tại.

**Dữ liệu quan trọng:**
- `thread_inventory.reserved_week_id` → xác định cuộn thuộc tuần nào
- `thread_inventory.warehouse_id` → xác định cuộn đang ở kho nào
- `thread_order_items.po_id + week_id` → liên kết PO và tuần
- `style_color_thread_specs.thread_type_id + thread_color_id` → spec màu chỉ của PO (KHÔNG dùng `thread_types.color_id` — NULL toàn bộ)

## Goals / Non-Goals

**Goals:**
- Tìm kiếm PO number → trả về danh sách tuần có PO đó kèm số cuộn RESERVED
- Auto-fill tuần và scroll đến section PO sau khi chọn từ popup
- Hiển thị summary Gán/Đã chuyển/Còn trên mỗi dòng chỉ trong bảng
- Không thay đổi flow chuyển kho hiện tại

**Non-Goals:**
- Không thêm DB migration
- Không tìm kiếm full-text trong nội dung PO (chỉ match prefix/ilike po_number)
- Không phân trang kết quả search (số tuần chứa 1 PO thường < 20)
- Không lưu lịch sử search

## Decisions

### 1. Backend endpoint search-po: trước `:weekId/reserved-by-po`

**Quyết định:** Đặt route `GET /search-po` trước route `GET /:weekId/reserved-by-po` trong file `transfer-reserved.ts`.

**Lý do:** Hono match route theo thứ tự đăng ký, không theo độ cụ thể. Nếu đặt sau, `search-po` sẽ bị route `/:weekId/...` bắt nhầm.

**Alternatives considered:** Đặt trong file route riêng — không cần thiết vì đây cùng domain transfer-reserved.

### 2. Query logic cho search-po endpoint

**Quyết định:** Query `thread_order_items` JOIN `purchase_orders` (by po_number ILIKE), nhóm theo `(po_id, week_id)`, đếm số cuộn `RESERVED_FOR_ORDER` trong `thread_inventory` với `reserved_week_id = week_id`.

```
purchase_orders (po_number ILIKE) 
  → thread_order_items (po_id) 
  → group by week_id 
  → thread_order_weeks (week_name) 
  → count thread_inventory (reserved_week_id = week_id AND status = RESERVED_FOR_ORDER)
```

**Lý do:** Sử dụng đúng aggregation từ `thread_inventory.reserved_week_id` — không cần join phức tạp qua `style_color_thread_specs`. Count là đếm tổng cuộn RESERVED trong tuần đó, không phân biệt warehouse.

**Alternatives considered:** RPC/function PostgreSQL — không cần vì query không phức tạp, và không có DB migration requirement.

### 3. Summary fields: tính trong handler /:weekId/reserved-by-po

**Quyết định:** Bổ sung 2 query song song trong handler `/:weekId/reserved-by-po` hiện tại:
- `total_reserved_for_week`: count `thread_inventory` với `reserved_week_id = weekId AND status = RESERVED_FOR_ORDER` (mọi warehouse)
- `already_at_destination`: count `thread_inventory` với `reserved_week_id = weekId AND warehouse_id = toWarehouseId AND status = RESERVED_FOR_ORDER`

`toWarehouseId` lấy từ query param `to_warehouse_id` (optional) — nếu không truyền thì `already_at_destination = 0`.

**Lý do:** Tính tại backend tránh N+1 trên frontend. Dùng aggregation map tương tự `poolMap` hiện có.

**Alternatives considered:** Tính trên frontend từ dữ liệu đã có — không đủ vì `already_at_destination` cần biết `to_warehouse_id` và count cones ở đó, frontend không có đủ data.

### 4. PoSearchPopup: component độc lập, không phải composable

**Quyết định:** Tách thành `PoSearchPopup.vue` riêng — dùng `q-menu` hoặc `q-popup-proxy` gắn vào input search, emit event `select-week` khi user chọn tuần.

**Lý do:** Logic UI (debounce, popup state, hiển thị kết quả) gọn hơn trong SFC. Composable search PO có thể là internal (`usePoSearch`) trong component nếu cần tách logic.

**Alternatives considered:** Tích hợp trực tiếp vào page — page đã đủ phức tạp, tách component dễ test hơn.

### 5. Scroll to PO section: dùng `ref` array trên PoSection

**Quyết định:** Trong `transfer-reserved.vue`, dùng `ref<InstanceType<typeof PoSection>[]>` array cho `v-for` của PoSection. Sau khi chọn tuần từ popup và `fetchData()` xong, tìm section có `po_number` match → gọi `el.$el.scrollIntoView({ behavior: 'smooth' })`.

**Lý do:** `scrollIntoView` native, không cần thêm dependency. Cần `nextTick` sau `fetchData` để DOM cập nhật.

**Alternatives considered:** Dùng id attribute + `document.getElementById` — fragile với dynamic content, ref array type-safe hơn.

### 6. Aggregation key trong search-po endpoint: dùng `thread_color_id` (số) không dùng string

**Quyết định:** Dùng `${thread_type_id}_${thread_color_id ?? ''}` làm key khi cần aggregate theo màu. Không dùng color name string.

**Lý do:** Theo CLAUDE.md business rules — `thread_types.color_id` NULL toàn bộ, phải lấy `thread_color_id` từ `style_color_thread_specs`.

## Risks / Trade-offs

- **[Risk] search-po count không chính xác nếu cuộn chưa được gán `reserved_week_id`** → Mitigation: count từ `thread_inventory.reserved_week_id` là source of truth sau khi weekly order đã calculate. Nếu chưa calculate thì count = 0 (acceptable).
- **[Risk] `already_at_destination` cần `to_warehouse_id` nhưng user có thể chưa chọn kho đích** → Mitigation: field optional, default 0 khi không có `to_warehouse_id`.
- **[Risk] Hono route order** — nếu `search-po` đặt sau `/:weekId/reserved-by-po` sẽ bị match nhầm → Mitigation: đặt `search-po` trước trong file, thêm comment cảnh báo thứ tự.
- **[Trade-off] Thêm 2 queries vào handler `/:weekId/reserved-by-po`** → tăng latency nhẹ. Acceptable vì cả 2 query đều dùng index trên `reserved_week_id` và `warehouse_id`.

## Migration Plan

1. Deploy backend trước (endpoint mới backward-compatible, field mới optional)
2. Deploy frontend sau
3. Rollback: revert frontend → backend endpoint mới không ảnh hưởng UI cũ (field thừa ignored)

## Open Questions

_(không còn câu hỏi mở)_
