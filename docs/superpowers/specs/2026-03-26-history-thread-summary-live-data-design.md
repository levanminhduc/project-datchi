# Design: Live Data cho ThreadSummaryTable trên Weekly Order History

## Bối cảnh

Trang `thread/weekly-order/history` hiển thị "Chi tiết loại chỉ" (ThreadSummaryTable) khi expand 1 tuần. Hiện tại dữ liệu chủ yếu từ JSONB snapshot (`thread_order_results.summary_data`), không phản ánh thực tế khi tồn kho thay đổi.

## Vấn đề

| Cột | Hiện tại | Vấn đề |
|---|---|---|
| Cần đặt | `summary_data` JSONB | OK - yêu cầu không đổi |
| Sẵn Kho | `summary_data` JSONB | Snapshot cũ, không phản ánh nhập/xuất kho sau tính toán |
| Chờ về | Chỉ delivery `PENDING` | Bỏ sót DELIVERED chưa nhập kho |
| Thiếu | `Cần - Sẵn Kho - Chờ về` | Sai vì 2 input trên sai |

## Thiết kế mới — 4 cột

| Cột | Label | Nguồn | Công thức |
|---|---|---|---|
| **Cần đặt** | "Cần đặt" | `summary_data` JSONB | `total_cones` (tĩnh) |
| **Đã có** | "Đã có" | `thread_inventory` live | `COUNT(*) WHERE reserved_week_id = :week_id AND thread_type_id = :type_id AND status = 'RESERVED_FOR_ORDER'` |
| **Chờ về** | "Chờ về" | `thread_order_deliveries` live | `SUM(quantity_cones)` WHERE `week_id = :week_id AND thread_type_id = :type_id AND status = 'PENDING'` |
| **Chưa về kho** | "Chưa về kho" | Computed | `max(0, Cần đặt − Đã có)` |

### Giải thích cột

- **Cần đặt:** Giữ nguyên từ JSONB. Yêu cầu không thay đổi sau khi tính toán.
- **Đã có:** Query live số cuộn đã thực sự reserve trong kho cho tuần này. Tăng khi nhập kho từ delivery.
- **Chờ về:** Chỉ delivery PENDING (NCC chưa giao). Giảm khi NCC xác nhận giao hàng.
- **Chưa về kho:** = `Cần − Đã có`. Đơn giản, luôn chính xác. Chênh lệch giữa "Chưa về kho" và "Chờ về" cho biết bao nhiêu cuộn đã giao nhưng chưa nhập kho.

### Kịch bản verify (Cần 100, reserve ban đầu 30, đặt NCC 70)

| Giai đoạn | Cần | Đã có | Chờ về | Chưa về kho |
|---|---|---|---|---|
| Sau confirm | 100 | 30 | 70 | 70 |
| NCC giao 40, chưa nhập kho | 100 | 30 | 30 | 70 |
| Nhập kho 40 cuộn đó | 100 | 70 | 30 | 30 |
| NCC giao 30, nhập kho | 100 | 100 | 0 | 0 |

Lưu ý: NCC không bao giờ hủy giao → "Chưa về kho" tự về 0 khi mọi delivery hoàn tất.

## Scope thay đổi

### Backend — API route mới hoặc sửa route hiện tại

**Option:** Thêm endpoint mới `GET /api/weekly-orders/:id/thread-summary-live` hoặc sửa logic trong route `GET /api/weekly-orders/:id/deliveries` (đã có sẵn query 3 bảng).

Recommend: **Tạo endpoint mới** để tách biệt, không ảnh hưởng flow hiện tại.

**Query:**
```sql
-- Đã có (reserved cones per thread_type)
SELECT thread_type_id, COUNT(*) as reserved_cones
FROM thread_inventory
WHERE reserved_week_id = :week_id
  AND status = 'RESERVED_FOR_ORDER'
GROUP BY thread_type_id;

-- Chờ về (pending deliveries per thread_type)
SELECT thread_type_id, SUM(quantity_cones) as pending_cones
FROM thread_order_deliveries
WHERE week_id = :week_id
  AND status = 'PENDING'
GROUP BY thread_type_id;
```

**Response:** Kết hợp với `summary_data` JSONB để lấy `total_cones` + metadata (tên chỉ, NCC, tex, màu):
```typescript
interface ThreadSummaryLiveRow {
  thread_type_id: number
  thread_type_name: string
  supplier_name: string
  tex_number: string
  thread_color: string
  total_cones: number        // từ JSONB
  reserved_cones: number     // live từ thread_inventory
  pending_cones: number      // live từ deliveries PENDING
  remaining: number          // max(0, total_cones - reserved_cones)
}
```

### Frontend — Sửa `history.vue` + `ThreadSummaryTable`

1. **`history.vue`:** `loadThreadSummary()` gọi endpoint mới thay vì `getResults()` + `getByWeek()` riêng
2. **`ThreadSummaryTable`:** Đổi tên cột:
   - "Sẵn Kho" → "Đã có"
   - "Chờ về" → giữ nguyên
   - "Thiếu" → "Chưa về kho"
3. **Mapping data:** Dùng response mới, không cần tính toán phức tạp ở frontend

## Không thay đổi

- Bảng header (week_name, status, total_quantity, po_groups) — vẫn từ `history-by-week` API
- `thread_order_results` table — vẫn giữ snapshot, chỉ không dùng cho ThreadSummaryTable nữa
- Các trang khác (deliveries, index) — không ảnh hưởng
- Database schema — không cần migration mới

## Ràng buộc

- Chỉ áp dụng cho tuần CONFIRMED hoặc COMPLETED (DRAFT chưa có delivery/reserve)
- Performance: 2 query GROUP BY nhỏ, không cần optimize đặc biệt
- Backward compatible: endpoint mới, không sửa endpoint cũ
