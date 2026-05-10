# Transfer PO Attribution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghi nhận PO attribution khi chuyển kho, hiển thị số liệu chuyển thật per PO (kể cả vượt ĐM) thay vì ước tính sequential allocation.

**Architecture:** Thêm cột JSONB `po_attribution` vào `batch_transactions` để lưu metadata PO khi transfer. Backend đọc data thực từ cột này, fallback sequential allocation cho data cũ. Frontend gửi `po_id` kèm item khi submit, hiển thị label vượt ĐM.

**Tech Stack:** PostgreSQL (migration + RPC), Hono (route handler), Zod (validation), Vue 3 + Quasar (UI)

**Spec:** `docs/superpowers/specs/2026-05-10-transfer-po-attribution-design.md`

---

### Task 1: Database migration — thêm cột + sửa RPC

**Files:**
- Create: `supabase/migrations/20260510100000_add_po_attribution.sql`

- [ ] **Step 1: Tạo migration file**

```sql
-- Thêm cột po_attribution vào batch_transactions
ALTER TABLE batch_transactions
  ADD COLUMN po_attribution JSONB;

COMMENT ON COLUMN batch_transactions.po_attribution
  IS 'Ghi nhận loại chỉ được chuyển thuộc PO nào (TRANSFER tuần hàng)';

-- Sửa fn_transfer_reserved_cones: thêm param p_po_attribution
CREATE OR REPLACE FUNCTION fn_transfer_reserved_cones(
  p_week_id INTEGER,
  p_from_warehouse_id INTEGER,
  p_to_warehouse_id INTEGER,
  p_items JSONB,
  p_performed_by VARCHAR,
  p_po_attribution JSONB DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_cone_ids INTEGER[] := ARRAY[]::INTEGER[];
  v_picked INTEGER[];
  v_per_item JSONB := '[]'::JSONB;
  v_total INTEGER := 0;
  v_transaction_id INTEGER;
BEGIN
  IF p_from_warehouse_id = p_to_warehouse_id THEN
    RAISE EXCEPTION 'Kho nguồn và kho đích không được trùng nhau';
  END IF;

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
      'thread_type_id', (v_item->>'thread_type_id')::INTEGER,
      'color_id', (v_item->>'color_id')::INTEGER,
      'moved', array_length(v_picked, 1)
    );
    v_total := v_total + array_length(v_picked, 1);
  END LOOP;

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

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'total_cones', v_total,
    'per_item', v_per_item
  );
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 2: Apply migration**

Run: `cd D:\HoaThoDienBan\VueJS\project-datchi && npx supabase migration up`

Expected: Migration applied successfully.

- [ ] **Step 3: Verify cột mới tồn tại**

Run: `psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d batch_transactions" | grep po_attribution`

Expected: `po_attribution | jsonb |`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260510100000_add_po_attribution.sql
git commit -m "feat(transfer-reserved): add po_attribution column + update RPC"
```

---

### Task 2: Zod schema — thêm `po_id` vào item

**Files:**
- Modify: `server/validation/transferReservedSchema.ts:3-9`

- [ ] **Step 1: Thêm `po_id` vào transferReservedItemSchema**

Thay block `.object({...})` tại line 3-9:

```typescript
export const transferReservedItemSchema = z
  .object({
    thread_type_id: z.number().int().positive(),
    color_id: z.number().int().positive(),
    full_quantity: z.number().int().min(0),
    partial_quantity: z.number().int().min(0),
    po_id: z.number().int().positive().nullable().optional(),
  })
```

- [ ] **Step 2: Type check**

Run: `npm run type-check`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/validation/transferReservedSchema.ts
git commit -m "feat(transfer-reserved): add po_id to transfer item schema"
```

---

### Task 3: Backend route — build `po_attribution` và gửi RPC

**Files:**
- Modify: `server/routes/weekly-order/transfer-reserved.ts:426-434`

- [ ] **Step 1: Thêm build po_attribution trước RPC call**

Thay đoạn từ `const performedBy` đến cuối RPC call (line 426-434):

```typescript
    const performedBy = await getPerformerName(c)

    const poAttribution = parsed.data.items.map(item => ({
      po_id: item.po_id ?? null,
      thread_type_id: item.thread_type_id,
      color_id: item.color_id,
      cones: item.full_quantity + item.partial_quantity,
    }))

    const { data, error } = await supabaseAdmin.rpc('fn_transfer_reserved_cones', {
      p_week_id: weekId,
      p_from_warehouse_id: parsed.data.from_warehouse_id,
      p_to_warehouse_id: parsed.data.to_warehouse_id,
      p_items: parsed.data.items,
      p_performed_by: performedBy,
      p_po_attribution: poAttribution,
    })
```

- [ ] **Step 2: Type check**

Run: `npm run type-check`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/routes/weekly-order/transfer-reserved.ts
git commit -m "feat(transfer-reserved): send po_attribution to RPC on transfer"
```

---

### Task 4: Backend — `fetchPoAttributionMap` + ưu tiên data thực

**Files:**
- Modify: `server/routes/weekly-order/transfer-by-calculation.ts`

- [ ] **Step 1: Thêm hàm `fetchPoAttributionMap` sau hàm `buildSharedWithPosMap` (sau line 382)**

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

  const map = new Map<string, number>()
  for (const tx of data ?? []) {
    const items = tx.po_attribution as Array<{
      po_id: number | null
      thread_type_id: number
      color_id: number
      cones: number
    }>
    for (const item of items ?? []) {
      const key = `${item.po_id ?? 'null'}_${item.thread_type_id}_${item.color_id}`
      map.set(key, (map.get(key) ?? 0) + item.cones)
    }
  }
  return map
}
```

- [ ] **Step 2: Gọi `fetchPoAttributionMap` song song với `lastTransferMap` (line 479)**

Thay:
```typescript
      const lastTransferMap = await fetchLastTransferMap(weekId)
```

Bằng:
```typescript
      const [lastTransferMap, poAttrMap] = await Promise.all([
        fetchLastTransferMap(weekId),
        fetchPoAttributionMap(weekId),
      ])
```

- [ ] **Step 3: Sửa logic build `transferred_for_po` (line 499)**

Thay dòng:
```typescript
          const transferred_for_po = transferredByPoThread.get(`${po.po_id ?? 'null'}_${key}`) ?? 0
```

Bằng:
```typescript
          const attrKey = `${po.po_id ?? 'null'}_${key}`
          const transferred_for_po = poAttrMap.size > 0
            ? (poAttrMap.get(attrKey) ?? 0)
            : (transferredByPoThread.get(attrKey) ?? 0)
```

- [ ] **Step 4: Fix `total_pending` có thể âm (line 528)**

Thay:
```typescript
            total_pending: total_needed - total_transferred,
```

Bằng:
```typescript
            total_pending: Math.max(0, total_needed - total_transferred),
```

- [ ] **Step 5: Type check**

Run: `npm run type-check`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add server/routes/weekly-order/transfer-by-calculation.ts
git commit -m "feat(transfer-reserved): read po_attribution for accurate transferred_for_po"
```

---

### Task 5: Frontend type — thêm `po_id` vào `TransferReservedItem`

**Files:**
- Modify: `src/types/transferReserved.ts:40-45`

- [ ] **Step 1: Thêm `po_id` vào interface**

Thay block `TransferReservedItem` (line 40-45):

```typescript
export interface TransferReservedItem {
  thread_type_id: number
  color_id: number
  full_quantity: number
  partial_quantity: number
  po_id?: number | null
}
```

- [ ] **Step 2: Type check**

Run: `npm run type-check`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/transferReserved.ts
git commit -m "feat(transfer-reserved): add po_id to TransferReservedItem type"
```

---

### Task 6: Frontend composable — gửi `po_id` khi submit

**Files:**
- Modify: `src/composables/thread/useTransferReserved.ts:144-149`

- [ ] **Step 1: Thêm `po_id` vào items map trong `submit()`**

Thay block map items (line 144-149):

```typescript
      const items: TransferReservedItem[] = selectedArray.value.map(x => ({
        thread_type_id: x.thread_type_id,
        color_id: x.thread_color_id,
        full_quantity: Number(x.full_quantity) || 0,
        partial_quantity: Number(x.partial_quantity) || 0,
        po_id: x.selected_in_po_id,
      }))
```

- [ ] **Step 2: Type check**

Run: `npm run type-check`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/composables/thread/useTransferReserved.ts
git commit -m "feat(transfer-reserved): send po_id with transfer items"
```

---

### Task 7: Frontend UI — hiển thị vượt ĐM

**Files:**
- Modify: `src/components/thread/transfer-reserved/PoSection.vue`

- [ ] **Step 1: Sửa header summary (line 18-25)**

Thay block `v-if="summary"`:

```html
        <div
          v-if="summary"
          class="text-caption text-grey-8 q-mt-xs"
        >
          ĐM tổng: <b>{{ summary.total_needed }}</b> ·
          Đã chuyển: <b>{{ summary.total_transferred }}</b> ·
          <template v-if="summary.total_transferred > summary.total_needed">
            <span class="text-red">Vượt: +{{ summary.total_transferred - summary.total_needed }}</span>
          </template>
          <template v-else>
            Còn theo ĐM: <b>{{ summary.total_pending }}</b>
          </template>
        </div>
```

- [ ] **Step 2: Sửa quota cell (line 64-69)**

Thay block `#body-cell-quota`:

```html
        <template #body-cell-quota="props">
          <q-td :props="props" class="text-right">
            ĐM <b>{{ props.row.quota_cones }}</b> ·
            Đã <b>{{ props.row.transferred_for_po }}</b> ·
            <template v-if="props.row.transferred_for_po > props.row.quota_cones">
              <span class="text-red">(+{{ props.row.transferred_for_po - props.row.quota_cones }} dư)</span>
            </template>
            <template v-else>
              Còn <b>{{ props.row.pending_for_po }}</b>
            </template>
          </q-td>
        </template>
```

- [ ] **Step 3: Type check + lint**

Run: `npm run type-check && npm run lint`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/thread/transfer-reserved/PoSection.vue
git commit -m "feat(transfer-reserved): show overflow label when transferred exceeds quota"
```

---

### Task 8: Manual verification

- [ ] **Step 1: Start dev servers**

Run: `npm run dev:all`

- [ ] **Step 2: Test golden path — chuyển kho với PO**

1. Mở `/thread/transfer-reserved`
2. Chọn tuần có data + kho nguồn + kho đích
3. Tick 1 dòng chỉ ở 1 PO
4. Submit chuyển
5. Reload page → verify "Đã chuyển" hiển thị đúng con số từ `po_attribution`

- [ ] **Step 3: Test vượt ĐM**

1. Chuyển thêm cuộn vượt quá ĐM cho 1 PO
2. Reload → verify header hiển thị "Vượt: +X" (đỏ)
3. Verify thread row hiển thị "(+X dư)" (đỏ)

- [ ] **Step 4: Test backward compatibility — data cũ**

1. Kiểm tra tuần có transfer cũ (trước migration) → `po_attribution = NULL`
2. Verify vẫn hiển thị `transferred_for_po` via sequential allocation fallback

- [ ] **Step 5: Verify DB**

Run: `psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "SELECT id, po_attribution FROM batch_transactions WHERE po_attribution IS NOT NULL ORDER BY id DESC LIMIT 5;"`

Expected: Rows mới có `po_attribution` JSONB với format đúng.
