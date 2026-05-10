# Transfer PO Attribution — Ghi nhận chuyển kho theo PO

**Ngày:** 2026-05-10
**Trạng thái:** Approved (updated after Codex review R1+R2)
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
| Legacy vs new client | Phân biệt qua `po_id !== undefined` (new) vs omitted (legacy) |
| Mixed-mode fallback | Per-THREAD check: nếu thread có bất kỳ attribution → dùng cho tất cả PO của thread đó |
| Attribution query scope | Filter theo `to_warehouse_id` (destination-scoped) |
| PO validation | Lightweight warn-only: check `po_id` thuộc `thread_order_items` của week |

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

DROP old 5-param version trước, tạo 6-param version (tránh overload ambiguity). Dựa trên split version hiện tại (`full_quantity`/`partial_quantity`):

```sql
DROP FUNCTION IF EXISTS fn_transfer_reserved_cones(INTEGER, INTEGER, INTEGER, JSONB, VARCHAR);

CREATE OR REPLACE FUNCTION fn_transfer_reserved_cones(
  p_week_id INTEGER,
  p_from_warehouse_id INTEGER,
  p_to_warehouse_id INTEGER,
  p_items JSONB,
  p_performed_by VARCHAR,
  p_po_attribution JSONB DEFAULT NULL
) RETURNS JSON AS $$
-- ... logic pick/transfer giữ nguyên (split version) ...
  INSERT INTO batch_transactions (
    operation_type, from_warehouse_id, to_warehouse_id,
    cone_ids, cone_count, notes, performed_by, performed_at,
    po_attribution
  ) VALUES (
    'TRANSFER', p_from_warehouse_id, p_to_warehouse_id,
    v_cone_ids, v_total,
    'Chuyển kho cho Tuần #' || p_week_id, p_performed_by, NOW(),
    p_po_attribution
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
  po_id: z.number().int().positive().nullable().optional(),
})
```

`.optional()` → old clients omit (`undefined` after parse). `.nullable()` → new clients send `null` for non-PO.

### 4. Backend Route — Build `po_attribution`, validate, gửi RPC

```typescript
// server/routes/weekly-order/transfer-reserved.ts POST handler

// Distinguish new client (po_id present, even if null) from legacy (po_id omitted)
const hasAttribution = parsed.data.items.some(item => item.po_id !== undefined)
let poAttribution = null

if (hasAttribution) {
  poAttribution = parsed.data.items.map(item => ({
    po_id: item.po_id ?? null,
    thread_type_id: item.thread_type_id,
    color_id: item.color_id,
    cones: item.full_quantity + item.partial_quantity,
  }))

  // Lightweight validation: warn if po_id not in week
  const poIds = [...new Set(poAttribution.filter(a => a.po_id != null).map(a => a.po_id!))]
  if (poIds.length > 0) {
    const { data: validPos } = await supabaseAdmin
      .from('thread_order_items')
      .select('po_id')
      .eq('week_id', weekId)
      .in('po_id', poIds)
      .limit(poIds.length)
    const validPoIds = new Set((validPos ?? []).map(p => p.po_id))
    const invalidPoIds = poIds.filter(id => !validPoIds.has(id))
    if (invalidPoIds.length > 0) {
      console.warn(`[transfer-reserved] Invalid po_ids for week ${weekId}: ${invalidPoIds.join(', ')}`)
    }
  }
}

await supabaseAdmin.rpc('fn_transfer_reserved_cones', {
  // ... existing params ...
  p_po_attribution: poAttribution,
})
```

### 5. Backend — `fetchPoAttributionMap` trong transfer-by-calculation

```typescript
// Destination-scoped attribution query
async function fetchPoAttributionMap(weekId: number, toWarehouseId: number | null) {
  if (toWarehouseId == null) return new Map<string, number>()

  const { data, error } = await supabaseAdmin
    .from('batch_transactions')
    .select('po_attribution')
    .eq('operation_type', 'TRANSFER')
    .eq('to_warehouse_id', toWarehouseId)
    .like('notes', `%Tuần #${weekId}%`)
    .not('po_attribution', 'is', null)
    .limit(2000)
  if (error) throw error

  const map = new Map<string, number>()
  for (const tx of data ?? []) {
    for (const item of tx.po_attribution ?? []) {
      const key = `${item.po_id ?? 'null'}_${item.thread_type_id}_${item.color_id}`
      map.set(key, (map.get(key) ?? 0) + item.cones)
    }
  }
  return map
}
```

Per-thread mixed-mode fallback (tránh double-counting):

```typescript
// Check if ANY PO has attribution for this thread key
const threadKey = `${t.thread_type_id}_${t.thread_color_id}`
const threadHasAttr = hasAttributionForThread(poAttrMap, threadKey)

// If thread has any attribution → ALL POs for that thread use attribution
// If thread has zero attribution → ALL POs use sequential allocation
const transferred_for_po = threadHasAttr
  ? (poAttrMap.get(`${po.po_id ?? 'null'}_${threadKey}`) ?? 0)
  : (transferredByPoThread.get(`${po.po_id ?? 'null'}_${threadKey}`) ?? 0)
```

### 6. Frontend — Gửi `po_id` khi submit

```typescript
// src/types/transferReserved.ts
export interface TransferReservedItem {
  thread_type_id: number
  color_id: number
  full_quantity: number
  partial_quantity: number
  po_id?: number | null
}

// src/composables/thread/useTransferReserved.ts submit()
const items = selectedArray.value.map(x => ({
  thread_type_id: x.thread_type_id,
  color_id: x.thread_color_id,
  full_quantity: Number(x.full_quantity) || 0,
  partial_quantity: Number(x.partial_quantity) || 0,
  po_id: x.selected_in_po_id,
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
| `supabase/migrations/{ts}_add_po_attribution.sql` | ALTER TABLE + DROP/CREATE RPC |
| `server/validation/transferReservedSchema.ts` | Thêm `po_id` optional+nullable |
| `server/routes/weekly-order/transfer-reserved.ts` | Build `po_attribution` + validate po_ids → gửi RPC |
| `server/routes/weekly-order/transfer-by-calculation.ts` | `fetchPoAttributionMap()` (dest-scoped), per-thread mixed-mode fallback |
| `src/types/transferReserved.ts` | Thêm `po_id` vào `TransferReservedItem` |
| `src/composables/thread/useTransferReserved.ts` | Gửi `po_id` kèm item |
| `src/components/thread/transfer-reserved/PoSection.vue` | Label vượt ĐM |

## Edge Cases

| Case | Xử lý |
|------|-------|
| Data cũ (trước feature) | `po_attribution = NULL` → fallback sequential allocation |
| Mix data cũ + mới cho cùng thread | Per-thread check: nếu thread có BẤT KỲ attribution → dùng attribution cho TẤT CẢ PO của thread (PO không có entry → 0). Tránh double-count. |
| Mix data cũ + mới cho thread KHÁC nhau | Thread A có attribution → dùng attribution. Thread B không có → dùng sequential. Mỗi thread độc lập. |
| User không chọn PO (tick từ "Đặt thêm") | `po_id = null` trong attribution (explicit null, NOT omitted) |
| Legacy client (no `po_id` field) | `po_id = undefined` after Zod parse → `hasAttribution = false` → `po_attribution = null` → fallback |
| Chuyển 164 cuộn, ĐM 162 | `transferred_for_po = 164`, `pending_for_po = 0`, UI: "Đã 164 (+2 dư)" |
| Summary `total_pending` âm | `Math.max(0, ...)` + hiển thị "Vượt: +X" thay vì "Còn: -X" |
| Invalid `po_id` for week | Warn in console, store attribution anyway (non-blocking) |
| Different destination warehouse | Attribution query scoped to `to_warehouse_id` → each dest shows only its transfers |

## Backward Compatibility

- `po_id` optional trong Zod schema → API cũ vẫn hoạt động
- `po_id !== undefined` phân biệt new client vs legacy → legacy không tạo attribution
- RPC param `p_po_attribution DEFAULT NULL` → caller cũ không break
- Per-thread fallback: sequential allocation hoạt động cho threads chưa có attribution nào
