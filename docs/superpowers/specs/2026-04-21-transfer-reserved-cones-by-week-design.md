# Chuyển kho cho chỉ đã gán cho Tuần đặt hàng

**Ngày:** 2026-04-21
**Trạng thái:** Draft (chờ user review)
**Người đề xuất:** levanminhduc + Claude

## 1. Tổng quan

### Vấn đề
Cones (cuộn chỉ) được reserve cho **Tuần đặt hàng** thường nằm rải ở nhiều kho — đặc biệt là **Phú Tường (PT)**, kho trung gian chỉ có nhiệm vụ nhập chỉ rồi chuyển sang kho sản xuất (ví dụ Xưởng Trước — DB-XT). Hiện không có công cụ nào giúp thủ kho:
- Nhìn nhanh "Tuần X có bao nhiêu cones đã reserve còn nằm ở kho Y"
- Chuyển hàng loạt nhiều loại chỉ sang kho khác mà **giữ nguyên reservation cho Tuần**

### Mục tiêu
Tính năng cho phép thủ kho/điều phối tuần:
1. Chọn 1 Tuần + Kho nguồn + Kho đích (đều thủ công, không default)
2. Xem các PO trong tuần kèm các loại chỉ đã reserve đang ở kho nguồn
3. Tick nhiều loại chỉ + nhập số cuộn muốn chuyển (đơn vị: cones, hỗ trợ partial)
4. Bấm Chuyển → atomic transfer (giữ `status=RESERVED_FOR_ORDER` và `reserved_week_id`, chỉ đổi `warehouse_id`)

### Người dùng & quyền
Tận dụng permission `thread.batch.transfer` hiện có (không tạo permission mới).

## 2. Nguyên tắc nghiệp vụ

- **Reservation không mất:** Chỉ đổi `warehouse_id`, không động đến `status` hay `reserved_week_id`.
- **FEFO khi pick cones:** `is_partial DESC, expiry_date ASC NULLS LAST, received_date ASC`.
- **Hiển thị "theo PO" chỉ là góc nhìn UX:** Cones thực tế reserved theo Tuần (cột `reserved_week_id`), không thật sự gán PO. Số cones theo PO được suy diễn từ mapping `(thread_type_id, color_id)` ↔ thread_order_items của tuần.
- **Atomic:** 1 lần submit = 1 transaction = 1 row `batch_transactions` (gộp tất cả cones).
- **Partial OK:** User được nhập số < số có sẵn. Phần còn lại giữ nguyên ở kho nguồn.

## 3. Data Model

**Không có schema change.** Tận dụng cột hiện có:

| Bảng | Cột liên quan | Mục đích |
|---|---|---|
| `thread_inventory` | `status='RESERVED_FOR_ORDER'`, `reserved_week_id`, `warehouse_id`, `thread_type_id`, `color_id`, `is_partial`, `expiry_date`, `received_date` | Cones đang reserved + thông tin FEFO |
| `thread_order_weeks` | `id`, `week_name`, `status` | Tuần đặt hàng |
| `thread_order_items` | `week_id`, `po_id`, `style_id`, `style_color_id` | Mapping PO ↔ tuần |
| `purchase_orders` | `id`, `po_number` | Hiển thị PO |
| `warehouses` | `id`, `code`, `name`, `is_active` | Kho |
| `batch_transactions` | `operation_type='TRANSFER'`, `from_warehouse_id`, `to_warehouse_id`, `cone_ids`, `cone_count`, `notes`, `performed_by`, `performed_at` | Log |

**Cần verify trong giai đoạn writing-plans:** mapping chính xác từ `(thread_type_id, color_id)` → `po_id` trong tuần. Khả năng cao đi qua `thread_calculation` hoặc trực tiếp join `thread_order_items.style_color_id → style_colors.thread_type_id, color_id`.

## 4. API

### 4.1 GET `/api/weekly-orders/:weekId/reserved-by-po`

**Permission:** `thread.batch.transfer`
**Query:** `warehouse_id` (required)

**Response:**
```jsonc
{
  "data": {
    "week": { "id": 12, "week_name": "Tuần 15/2026", "status": "CONFIRMED" },
    "source_warehouse": { "id": 5, "code": "PT", "name": "Phú Tường" },
    "pos": [
      {
        "po_id": 201,
        "po_number": "PO-2026-A1",
        "thread_lines": [
          {
            "thread_type_id": 88,
            "color_id": 12,
            "supplier_name": "NCC X",
            "tex_number": 30,
            "color_name": "Đỏ",
            "reserved_cones_at_source": 42,
            "reserved_meters_at_source": 210000
          }
        ]
      }
    ],
    "unassigned": {
      "thread_lines": [/* cones reserved cho tuần nhưng không map được PO */]
    }
  },
  "error": null
}
```

**Logic:**
1. Validate week + warehouse tồn tại (`maybeSingle`).
2. Lấy cones: `WHERE reserved_week_id=:weekId AND warehouse_id=:warehouse_id AND status='RESERVED_FOR_ORDER'` (limit 50000).
3. Group theo `(thread_type_id, color_id)` → `{ cones, meters }`.
4. Batch fetch thread_types + colors qua `.in()` (tránh N+1).
5. Lấy `thread_order_items` của tuần kèm `purchase_orders` join.
6. Build `pos[]`: với mỗi PO, list các `(thread_type_id, color_id)` mà PO dùng + đối chiếu với pool cones ở kho nguồn.
7. Cones không map được PO nào → đẩy vào `unassigned`.

### 4.2 POST `/api/weekly-orders/:weekId/transfer-reserved-cones`

**Permission:** `thread.batch.transfer`

**Body (Zod validated):**
```jsonc
{
  "from_warehouse_id": 5,
  "to_warehouse_id": 7,
  "items": [
    { "thread_type_id": 88, "color_id": 12, "quantity": 10 },
    { "thread_type_id": 91, "color_id": 12, "quantity": 5 }
  ],
  "notes": "tuỳ chọn"
}
```

**Validation rules:**
- `from_warehouse_id` ≠ `to_warehouse_id`
- `items.length` ∈ [1, 200]
- Mỗi `quantity > 0`

**Implementation:** Wrap RPC `fn_transfer_reserved_cones` (xem 4.3). Lý do dùng RPC: JS Supabase client không hỗ trợ transaction tự nhiên; FOR UPDATE SKIP LOCKED chỉ chạy được trong PL/pgSQL.

**Response:**
```jsonc
{
  "data": {
    "transaction_id": 1234,
    "total_cones": 15,
    "per_item": [
      { "thread_type_id": 88, "color_id": 12, "moved": 10 },
      { "thread_type_id": 91, "color_id": 12, "moved": 5 }
    ]
  },
  "error": null,
  "message": "Đã chuyển 15 cuộn"
}
```

### 4.3 RPC `fn_transfer_reserved_cones`

```sql
CREATE OR REPLACE FUNCTION fn_transfer_reserved_cones(
  p_week_id INTEGER,
  p_from_warehouse_id INTEGER,
  p_to_warehouse_id INTEGER,
  p_items JSONB,
  p_performed_by VARCHAR
) RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_cone_ids INTEGER[] := ARRAY[]::INTEGER[];
  v_picked INTEGER[];
  v_per_item JSONB := '[]'::JSONB;
  v_total INTEGER := 0;
  v_transaction_id INTEGER;
BEGIN
  PERFORM 1 FROM thread_order_weeks WHERE id = p_week_id FOR UPDATE;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT ARRAY(
      SELECT id FROM thread_inventory
      WHERE reserved_week_id = p_week_id
        AND warehouse_id = p_from_warehouse_id
        AND thread_type_id = (v_item->>'thread_type_id')::INTEGER
        AND color_id = (v_item->>'color_id')::INTEGER
        AND status = 'RESERVED_FOR_ORDER'
      ORDER BY is_partial DESC, expiry_date ASC NULLS LAST, received_date ASC
      FOR UPDATE SKIP LOCKED
      LIMIT (v_item->>'quantity')::INTEGER
    ) INTO v_picked;

    IF array_length(v_picked, 1) IS NULL
       OR array_length(v_picked, 1) < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Không đủ cuộn cho thread_type_id=%, color_id=% (yêu cầu %, có %)',
        v_item->>'thread_type_id', v_item->>'color_id',
        v_item->>'quantity', COALESCE(array_length(v_picked, 1), 0);
    END IF;

    UPDATE thread_inventory
       SET warehouse_id = p_to_warehouse_id, updated_at = NOW()
     WHERE id = ANY(v_picked);

    v_cone_ids := v_cone_ids || v_picked;
    v_per_item := v_per_item || jsonb_build_object(
      'thread_type_id', v_item->'thread_type_id',
      'color_id', v_item->'color_id',
      'moved', array_length(v_picked, 1)
    );
    v_total := v_total + array_length(v_picked, 1);
  END LOOP;

  INSERT INTO batch_transactions (
    operation_type, from_warehouse_id, to_warehouse_id,
    cone_ids, cone_count, notes, performed_by, performed_at
  ) VALUES (
    'TRANSFER', p_from_warehouse_id, p_to_warehouse_id,
    v_cone_ids, v_total,
    'Chuyển kho cho Tuần #' || p_week_id, p_performed_by, NOW()
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'total_cones', v_total,
    'per_item', v_per_item
  );
END;
$$ LANGUAGE plpgsql;
```

**Migration file:** `supabase/migrations/<YYYYMMDDHHMMSS>_fn_transfer_reserved_cones.sql`

## 5. Frontend Architecture

### File mới
```
src/pages/thread/transfer-reserved.vue
src/composables/thread/useTransferReserved.ts
src/services/transferReservedService.ts
src/types/transferReserved.ts
```

### Layout (`transfer-reserved.vue`)
```
┌─────────────────────────────────────────────────────────┐
│ Tiêu đề: Chuyển kho chỉ đã gán cho Tuần                 │
├─────────────────────────────────────────────────────────┤
│ [Tuần ▾]  [Kho nguồn ▾]  [Kho đích ▾]   [Tải lại]      │
├─────────────────────────────────────────────────────────┤
│ Tổng quan: X PO · Y loại chỉ · Z cuộn ở kho nguồn       │
├─────────────────────────────────────────────────────────┤
│ ▼ PO-2026-A1                          (3 loại chỉ)      │
│   ┌──┬──────────────┬───────┬──────┬──────────────┐    │
│   │☐ │ NCC-Tex-Màu  │ Reserve│ Có  │ Số cuộn chuyển│   │
│   │☐ │ X-30-Đỏ      │  42    │ 42   │ [____]        │   │
│   └──┴──────────────┴───────┴──────┴──────────────┘    │
│ ▶ PO-2026-A2                          (1 loại chỉ)      │
│ ▶ Không thuộc PO nào                                    │
├─────────────────────────────────────────────────────────┤
│ Đã chọn: N dòng · Tổng K cuộn        [Hủy] [Chuyển ▶] │
└─────────────────────────────────────────────────────────┘
```

### Components
- `AppSelect` × 3 (Tuần, Kho nguồn, Kho đích)
- `q-expansion-item` cho mỗi PO accordion
- `DataTable` trong mỗi accordion
- `AppInput` cho ô số cuộn
- `useConfirm()` confirm dialog
- `useSnackbar()` toast

### Composable `useTransferReserved`
**State:** `weekId`, `fromWarehouseId`, `toWarehouseId`, `data`, `loading`, `selectedItems` (Map keyed `${threadTypeId}-${colorId}`), `submitting`

**Methods:** `fetchData()`, `toggleItem()`, `setQuantity()`, `submit()`

**Computed:** `totalSelectedCones`, `canSubmit`, `selectedItemsArray`

### Tương tác
- Đủ Tuần + Kho nguồn → auto fetch
- Đổi Tuần / Kho nguồn → reset selection, refetch
- Validate ô số cuộn inline (>0 và ≤ "Có") → đỏ nếu sai
- Nút Chuyển disable khi: thiếu kho đích, không tick dòng nào, có ô invalid, hoặc from=to
- Confirm dialog: `"Chuyển N cuộn của M loại chỉ từ [Phú Tường] sang [Xưởng Trước]?"`
- Sau success: refetch + clear selection + toast `"Đã chuyển N cuộn"`

### Routing
- Auto từ `unplugin-vue-router`: `/thread/transfer-reserved`
- Thêm menu item dưới group "Kho chỉ" (cùng nhóm Inventory, Batch ops)

## 6. Backend Architecture

### File mới
```
server/routes/weekly-order/transfer-reserved.ts
server/validation/transferReservedSchema.ts
supabase/migrations/<ts>_fn_transfer_reserved_cones.sql
```

### Mount router
Trong `server/routes/weekly-order/index.ts`:
```ts
import transferReserved from './transfer-reserved'
weeklyOrder.route('/', transferReserved)
```

(Tách file riêng tuân quy tắc max 200 lines/file của project — `core.ts` và `loans-reservations.ts` đã rất dài.)

## 7. Edge cases & Errors

| Tình huống | Xử lý |
|---|---|
| Tuần / kho không tồn tại | 404 + toast |
| Không có cones reserved ở kho nguồn cho tuần | GET trả `pos:[]` + empty state |
| Kho nguồn = kho đích | Zod refine reject + FE disable nút |
| Số nhập > số có sẵn (race condition) | RPC raise exception → 400 + auto refetch |
| Cone bị reset reservation giữa fetch và submit | RPC filter chặt → bỏ qua → báo thiếu |
| Tuần COMPLETED | Cho phép chuyển (vẫn là chuyển kho vật lý) |
| 1 loại chỉ map nhiều PO | Hiển thị ở nhiều accordion, ô nhập tách theo `(thread_type_id, color_id)` toàn trang |
| Cones reserve không map PO (kéo từ stock cũ) | Section "Không thuộc PO nào" cuối trang |
| Permission thiếu | 403 |
| RPC quá tải | Cap items ≤200 trong Zod |

### Error messages (Tiếng Việt)
- `"Tuần không tồn tại"`
- `"Kho nguồn / kho đích không tồn tại"`
- `"Kho nguồn và kho đích không được trùng nhau"`
- `"Không đủ N cuộn cho loại chỉ {tên} (chỉ có M)"`
- `"Không có chỉ đã gán ở kho này cho tuần này"`
- Generic: `"Lỗi khi chuyển cuộn"`

## 8. Test plan

### Manual / Playwright
1. Seed: 1 tuần CONFIRMED có 2 PO + reserve 50 cones ở PT
2. Vào trang → chọn tuần + PT → thấy 2 PO accordion với số cones đúng
3. Tick 1 dòng, nhập 10, chọn DB-XT → submit → toast success → refetch hiện 40
4. Submit số > có sẵn → error toast
5. Submit from=to → nút disable
6. Đổi tuần → bảng reset
7. Concurrent: mở 2 tab, submit cùng lúc → tab 2 nhận lỗi "không đủ"

### Backend (psql script)
- Gọi RPC trực tiếp data hợp lệ → kiểm `warehouse_id` đổi, `reserved_week_id` giữ, `status` giữ
- RPC quantity > available → exception + rollback (không update gì)
- Verify `batch_transactions` log đầy đủ `cone_ids`, `cone_count`, `from/to`, `performed_by`

## 9. Quyết định kỹ thuật quan trọng

**Pattern dùng:** Endpoint chuyên dụng (Approach B) wrap RPC (yếu tố C). Lý do:
- API surface gọn (1 POST cho UI)
- Logic atomic + FOR UPDATE SKIP LOCKED phải nằm trong PL/pgSQL (JS Supabase client không có transaction)

**Không dùng `POST /api/batch/transfer` hiện có** vì:
- Cần N HTTP calls từ FE (mỗi loại chỉ 1 call) → không atomic
- Khó rollback nếu fail giữa chừng

## 10. Out of scope

- Tự động đề xuất / tự động chuyển (user vẫn quyết thủ công)
- Lịch sử chuyển kho riêng cho tính năng này (đã có trang transfer-history dùng `batch_transactions`)
- Phân quyền theo kho cụ thể (vẫn dùng `thread.batch.transfer` global)
- Hỗ trợ multi-week trong 1 lần chuyển (1 lần = 1 tuần)
- Chuyển cones AVAILABLE (không reserved) — đã có chức năng batch transfer hiện tại
