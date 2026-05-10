# Transfer PO Attribution — Ghi nhận chuyển kho theo PO

**Ngày:** 2026-05-10
**Trạng thái:** Approved
**Extends:** `2026-05-09-transfer-reserved-po-quota-design.md`

## Tóm tắt

Thêm khả năng ghi nhận **PO nào được chuyển bao nhiêu cuộn** khi submit transfer. Hiện tại sequential allocation ước tính `transferred_for_po` dựa trên số cuộn ở kho đích, dẫn đến non-last PO bị cap tại `quota_cones` — không phản ánh thực tế khi chuyển vượt ĐM.

## Vấn đề

- ĐM = 162, thực tế đã chuyển 164 cuộn → UI hiển thị "Đã 162" (bị cap)
- 2 cuộn dư bị sequential allocation đẩy sang PO khác
- Người chuyển kho không nhận biết được PO nào đã chuyển vượt

## Giải pháp

Khi submit transfer, ghi `po_attribution` (JSONB) vào `batch_transactions`. Khi query, đọc data thực thay vì ước tính. Data cũ fallback sequential allocation.

## Quyết định

| Vấn đề | Quyết định |
|--------|-----------|
| Lưu ở đâu | `batch_transactions.po_attribution` (JSONB), không tạo bảng mới |
| Data cũ | Fallback sequential allocation (backward compatible) |
| Frontend source | `selected_in_po_id` đã có sẵn trong `SelectionEntry` |
| Vượt ĐM display | Label đỏ "(+X dư)" per thread line, "Vượt: +X" ở header |

## Thiết kế chi tiết

### 1. Migration — Thêm cột `po_attribution`

```sql
ALTER TABLE batch_transactions
  ADD COLUMN po_attribution JSONB;

COMMENT ON COLUMN batch_transactions.po_attribution
  IS 'Ghi nhận loại chỉ được chuyển thuộc PO nào (TRANSFER tuần hàng)';
```

Format:
```jsonc
[
  { "po_id": 101, "thread_type_id": 5, "color_id": 12, "cones": 30 },
  { "po_id": null, "thread_type_id": 9, "color_id": 7, "cones": 10 }
]
```

### 2. Migration — Sửa `fn_transfer_reserved_cones`

Thêm param `p_po_attribution JSONB DEFAULT NULL`. Chỉ thay đổi INSERT:

```sql
CREATE OR REPLACE FUNCTION fn_transfer_reserved_cones(
  p_week_id INTEGER,
  p_from_warehouse_id INTEGER,
  p_to_warehouse_id INTEGER,
  p_items JSONB,
  p_performed_by VARCHAR,
  p_po_attribution JSONB DEFAULT NULL  -- MỚI
) RETURNS JSON AS $$
-- ... logic pick/transfer giữ nguyên ...
  INSERT INTO batch_transactions (
    operation_type, from_warehouse_id, to_warehouse_id,
    cone_ids, cone_count, notes, performed_by, performed_at,
    po_attribution  -- MỚI
  ) VALUES (
    'TRANSFER', p_from_warehouse_id, p_to_warehouse_id,
    v_cone_ids, v_total,
    'Chuyển kho cho Tuần #' || p_week_id, p_performed_by, NOW(),
    p_po_attribution  -- MỚI
  ) RETURNING id INTO v_transaction_id;
-- ... return giữ nguyên ...
```

### 3. Zod Schema — Thêm `po_id` vào item

```typescript
// server/validation/transferReservedSchema.ts
export const transferReservedItemSchema = z.object({
  thread_type_id: z.number().int().positive(),
  color_id: z.number().int().positive(),
  full_quantity: z.number().int().min(0),
  partial_quantity: z.number().int().min(0),
  po_id: z.number().int().positive().nullable().optional(), // MỚI
})
```

### 4. Backend Route — Build `po_attribution` và gửi RPC

```typescript
// server/routes/weekly-order/transfer-reserved.ts POST handler
const poAttribution = parsed.data.items.map(item => ({
  po_id: item.po_id ?? null,
  thread_type_id: item.thread_type_id,
  color_id: item.color_id,
  cones: item.full_quantity + item.partial_quantity,
}))

await supabaseAdmin.rpc('fn_transfer_reserved_cones', {
  // ... existing params ...
  p_po_attribution: poAttribution,
})
```

### 5. Backend — `fetchPoAttributionMap` trong transfer-by-calculation

```typescript
async function fetchPoAttributionMap(weekId: number) {
  const { data, error } = await supabaseAdmin
    .from('batch_transactions')
    .select('po_attribution')
    .eq('operation_type', 'TRANSFER')
    .like('notes', `%Tuần #${weekId}%`)
    .not('po_attribution', 'is', null)
    .limit(2000)
  if (error) throw error

  // Cộng dồn: Map<"poId_threadTypeId_colorId", totalCones>
  const map = new Map<string, number>()
  for (const tx of data ?? []) {
    const items = tx.po_attribution as Array<{
      po_id: number | null; thread_type_id: number; color_id: number; cones: number
    }>
    for (const item of items ?? []) {
      const key = `${item.po_id ?? 'null'}_${item.thread_type_id}_${item.color_id}`
      map.set(key, (map.get(key) ?? 0) + item.cones)
    }
  }
  return map
}
```

Khi build response, ưu tiên `po_attribution`:

```typescript
const poAttrMap = await fetchPoAttributionMap(weekId)

// Per thread line per PO:
const attrKey = `${po.po_id ?? 'null'}_${t.thread_type_id}_${t.thread_color_id}`
const transferred_for_po = poAttrMap.has(attrKey)
  ? poAttrMap.get(attrKey)!
  : (transferredByPoThread.get(`${po.po_id ?? 'null'}_${key}`) ?? 0)  // fallback
```

### 6. Frontend — Gửi `po_id` khi submit

```typescript
// src/types/transferReserved.ts
export interface TransferReservedItem {
  thread_type_id: number
  color_id: number
  full_quantity: number
  partial_quantity: number
  po_id?: number | null  // MỚI
}

// src/composables/thread/useTransferReserved.ts submit()
const items = selectedArray.value.map(x => ({
  thread_type_id: x.thread_type_id,
  color_id: x.thread_color_id,
  full_quantity: Number(x.full_quantity) || 0,
  partial_quantity: Number(x.partial_quantity) || 0,
  po_id: x.selected_in_po_id,  // MỚI — đã có sẵn
}))
```

### 7. Frontend — Hiển thị vượt ĐM

**PoSection.vue header:**

```
Nếu total_transferred > total_needed:
  "ĐM tổng: {needed} · Đã chuyển: {transferred} · Vượt: +{over}"  (text đỏ)
Ngược lại:
  "ĐM tổng: {needed} · Đã chuyển: {transferred} · Còn theo ĐM: {pending}"
```

**Thread row (quota cell):**

```
Nếu transferred_for_po > quota_cones:
  "ĐM {quota} · Đã {transferred} · (+{over} dư)"  (text đỏ phần dư)
Ngược lại:
  "ĐM {quota} · Đã {transferred} · Còn {pending}"
```

## Files thay đổi

| File | Thay đổi |
|------|----------|
| `supabase/migrations/{ts}_add_po_attribution.sql` | ALTER TABLE + sửa RPC |
| `server/validation/transferReservedSchema.ts` | Thêm `po_id` optional |
| `server/routes/weekly-order/transfer-reserved.ts` | Build `po_attribution` → gửi RPC |
| `server/routes/weekly-order/transfer-by-calculation.ts` | Thêm `fetchPoAttributionMap()`, ưu tiên data thực |
| `src/types/transferReserved.ts` | Thêm `po_id` vào `TransferReservedItem` |
| `src/composables/thread/useTransferReserved.ts` | Gửi `po_id` kèm item |
| `src/components/thread/transfer-reserved/PoSection.vue` | Label vượt ĐM |

## Edge Cases

| Case | Xử lý |
|------|-------|
| Data cũ (trước feature) | `po_attribution = NULL` → fallback sequential allocation |
| Mix data cũ + mới trong 1 tuần | Nếu có bất kỳ `po_attribution` → dùng attribution cho tất cả, fallback = 0 cho phần không có log |
| User không chọn PO (tick từ "Đặt thêm") | `po_id = null` trong attribution |
| Chuyển 164 cuộn, ĐM 162 | `transferred_for_po = 164`, `pending_for_po = 0`, UI: "Đã 164 (+2 dư)" |
| Summary `total_pending` âm | Hiển thị "Vượt: +X" thay vì "Còn: -X" |

## Backward Compatibility

- `po_id` optional trong Zod schema → API cũ vẫn hoạt động
- RPC param `p_po_attribution DEFAULT NULL` → caller cũ không break
- Query fallback sequential allocation khi không có `po_attribution`
