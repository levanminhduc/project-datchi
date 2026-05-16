# BUG: Race condition khi reserve cuộn chỉ từ tồn kho cho weekly order

## Mức độ: High — gây thiếu chỉ sản xuất

## Mô tả

Khi confirm tuần đặt hàng, hệ thống reserve cuộn chỉ từ tồn kho theo thứ tự confirm. Nếu nhiều tuần cùng dùng chung một loại chỉ (cùng thread_type + color), tuần confirm trước "giành" hết cuộn → tuần confirm sau bị thiếu, dù lúc tạo tuần hệ thống tính `inventory_cones` đủ.

## Case thực tế: Tex 30 C9760 — Tuần 45 (TSA265021-1 DK)

### Dữ liệu summary_data lúc tạo tuần 45

| Field | Giá trị |
|-------|---------|
| quota_cones | 141 |
| inventory_cones | 256 |
| sl_can_dat | 0 (tồn kho > nhu cầu → không cần đặt) |
| total_final | 0 |

### Thực tế sau khi confirm

| Tuần | Confirm time | Cuộn reserve được | Ghi chú |
|------|-------------|-------------------|---------|
| 39 (TSA255101-DK) | 24/04 03:21 | 120 (xuất luôn XK-0424-012) | PO 218 |
| **46** (TSA265021-DK-ĐỢT 1) | **05/05 06:35** | **82** | Confirm **trước** tuần 45 |
| **45** (TSA265021-1 DK) | **05/05 08:36** | **14** | Chỉ còn 14 cuộn |
| 62 (TSA265021/2DK/ĐỢT 2) | 16/05 01:28 | 142 | Lấy nốt + lot mới |

### Kết quả tuần 45

| Chỉ tiêu | Số cuộn |
|-----------|--------|
| Nhu cầu | 141 |
| Reserved từ tồn kho | 14 |
| Đã xuất kho (XK-0509-004, PO 265) | 50 |
| **Tổng phục vụ được** | **64** |
| **Thiếu** | **77** |

### Nguồn dữ liệu (lot breakdown)

**Lot MC-LOT-20260402-081319** (338 cuộn, nhập 02/04):

| Phân bổ | Cuộn |
|---------|------|
| Xuất XK-0424-012 → tuần 39 (PO 218) | 120 |
| Reserved → tuần 45 | 14 |
| Reserved → tuần 46 | 82 |
| Reserved → tuần 62 | 122 |

**Lot MC-LOT-20260424-021248** (70 cuộn, nhập 24/04):

| Phân bổ | Cuộn |
|---------|------|
| Xuất XK-0509-004 → tuần 45 (PO 265) | 50 |
| Reserved → tuần 62 | 20 |

## Root cause

1. **Snapshot stale**: `inventory_cones = 256` được tính lúc tạo/tính toán tuần (28/04), nhưng không re-check lúc confirm (05/05).
2. **No locking/fairness**: Confirm tuần không lock inventory pool → tuần confirm trước lấy hết, tuần sau thiếu.
3. **No warning**: Hệ thống không cảnh báo khi số cuộn reserve được < quota_cones.

## Nơi cần điều tra trong backend

### 1. Logic tính toán summary_data (snapshot inventory)

Tìm nơi build `summary_data` cho `thread_order_results` — cụ thể field `inventory_cones`. Đây là snapshot tại thời điểm tính, không phải real-time.

```
Keyword tìm: inventory_cones, summary_data, quota_cones, thread_order_results
```

### 2. Logic confirm tuần hàng (reservation)

Tìm endpoint/function xử lý confirm weekly order — nơi chuyển status sang CONFIRMED và reserve cuộn từ inventory (`RESERVED_FOR_ORDER`).

```
Keyword tìm: CONFIRMED, RESERVED_FOR_ORDER, reserved_week_id, confirmWeek, confirm
```

### 3. Logic reserve cuộn (core issue)

Tìm function reserve cuộn chỉ từ `thread_inventory` — nơi set `reserved_week_id` và `status = 'RESERVED_FOR_ORDER'`. Kiểm tra:
- Có check đủ cuộn trước khi reserve không?
- Có trừ cuộn đã reserved cho tuần khác không?
- Có transaction lock không?

```
Keyword tìm: reserved_week_id, RESERVED_FOR_ORDER, reserve, fn_confirm, fn_reserve
```

### 4. Stored procedures (PostgreSQL)

Backend delegate business-critical mutations to `fn_*` RPCs. Check:

```sql
-- List all relevant functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'fn_%'
  AND (routine_name LIKE '%confirm%' OR routine_name LIKE '%reserve%' OR routine_name LIKE '%order%');
```

## Đề xuất fix

### Option A: Re-calculate lúc confirm (recommended)

Khi confirm tuần, re-query tồn kho **available** (exclude đã reserved cho tuần khác) thay vì dùng snapshot cũ. Nếu không đủ → cảnh báo user trước khi confirm.

### Option B: Lock + atomic reservation

Dùng `SELECT ... FOR UPDATE` trong transaction khi reserve cuộn → đảm bảo không race condition giữa các tuần confirm cùng lúc.

### Option C: Soft reservation khi tạo tuần

Reserve cuộn ngay khi tạo/tính toán tuần (status `SOFT_RESERVED`), convert sang `RESERVED_FOR_ORDER` khi confirm. Nếu tuần khác tạo sau thấy cuộn đã soft-reserved → tính `inventory_cones` chính xác hơn.

### Option D: Warning system (quick win)

Sau khi confirm, so sánh số cuộn thực tế reserved vs quota. Nếu thiếu → alert user + log warning.
