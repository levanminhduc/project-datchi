# Transfer PO Attribution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghi nhận PO attribution khi chuyển kho, hiển thị số liệu chuyển thật per PO (kể cả vượt ĐM) thay vì ước tính sequential allocation.

**Architecture:** Thêm cột JSONB `po_attribution` vào `batch_transactions` để lưu metadata PO khi transfer. Backend đọc data thực từ cột này, fallback sequential allocation cho data cũ. Frontend gửi `po_id` kèm item khi submit, hiển thị label vượt ĐM.

**Tech Stack:** PostgreSQL (migration + RPC), Hono (route handler), Zod (validation), Vue 3 + Quasar (UI)

**Spec:** `docs/superpowers/specs/2026-05-10-transfer-po-attribution-design.md`

**Codex Review:** Round 1 REVISE (7 issues), Round 2 REVISE (5 issues) — all addressed below.

---

### Task 1: Database migration — thêm cột + sửa RPC (split version)

**Files:**
- Create: `supabase/migrations/20260510100000_add_po_attribution.sql`

**Codex R1 fixes:** ISSUE-1 (base on split RPC), ISSUE-2 (DROP old signature to avoid overload)

- [ ] **Step 1: Tạo migration file**

PostgreSQL creates overloads based on param count. To avoid ambiguity, DROP the old 5-param version first, then CREATE the 6-param version with `p_po_attribution JSONB DEFAULT NULL`.

```sql
-- Thêm cột po_attribution vào batch_transactions
ALTER TABLE batch_transactions
  ADD COLUMN po_attribution JSONB;

COMMENT ON COLUMN batch_transactions.po_attribution
  IS 'Ghi nhận loại chỉ được chuyển thuộc PO nào (TRANSFER tuần hàng)';

-- DROP old 5-param version to avoid overload ambiguity
DROP FUNCTION IF EXISTS fn_transfer_reserved_cones(INTEGER, INTEGER, INTEGER, JSONB, VARCHAR);

-- Recreate with 6 params, based on SPLIT version (full_quantity/partial_quantity)
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
  v_picked_full INTEGER[];
  v_picked_partial INTEGER[];
  v_full_req INTEGER;
  v_partial_req INTEGER;
  v_per_item JSONB := '[]'::JSONB;
  v_total INTEGER := 0;
  v_transaction_id INTEGER;
BEGIN
  IF p_from_warehouse_id = p_to_warehouse_id THEN
    RAISE EXCEPTION 'Kho nguồn và kho đích không được trùng nhau';
  END IF;

  PERFORM 1 FROM thread_order_weeks WHERE id = p_week_id FOR UPDATE;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_full_req := COALESCE((v_item->>'full_quantity')::INTEGER, 0);
    v_partial_req := COALESCE((v_item->>'partial_quantity')::INTEGER, 0);

    IF v_full_req < 0 OR v_partial_req < 0 THEN
      RAISE EXCEPTION 'Số lượng âm không hợp lệ (thread_type_id=%, color_id=%)',
        v_item->>'thread_type_id', v_item->>'color_id';
    END IF;
    IF v_full_req = 0 AND v_partial_req = 0 THEN
      CONTINUE;
    END IF;

    v_picked_full := ARRAY[]::INTEGER[];
    v_picked_partial := ARRAY[]::INTEGER[];

    IF v_full_req > 0 THEN
      SELECT ARRAY(
        SELECT id FROM thread_inventory
        WHERE reserved_week_id = p_week_id
          AND warehouse_id = p_from_warehouse_id
          AND thread_type_id = (v_item->>'thread_type_id')::INTEGER
          AND color_id = (v_item->>'color_id')::INTEGER
          AND status = 'RESERVED_FOR_ORDER'
          AND is_partial = FALSE
        ORDER BY expiry_date ASC NULLS LAST, received_date ASC
        FOR UPDATE SKIP LOCKED
        LIMIT v_full_req
      ) INTO v_picked_full;

      IF COALESCE(array_length(v_picked_full, 1), 0) < v_full_req THEN
        RAISE EXCEPTION 'Không đủ cuộn nguyên cho thread_type_id=%, color_id=% (yêu cầu %, có %)',
          v_item->>'thread_type_id', v_item->>'color_id',
          v_full_req, COALESCE(array_length(v_picked_full, 1), 0);
      END IF;
    END IF;

    IF v_partial_req > 0 THEN
      SELECT ARRAY(
        SELECT id FROM thread_inventory
        WHERE reserved_week_id = p_week_id
          AND warehouse_id = p_from_warehouse_id
          AND thread_type_id = (v_item->>'thread_type_id')::INTEGER
          AND color_id = (v_item->>'color_id')::INTEGER
          AND status = 'RESERVED_FOR_ORDER'
          AND is_partial = TRUE
        ORDER BY expiry_date ASC NULLS LAST, received_date ASC
        FOR UPDATE SKIP LOCKED
        LIMIT v_partial_req
      ) INTO v_picked_partial;

      IF COALESCE(array_length(v_picked_partial, 1), 0) < v_partial_req THEN
        RAISE EXCEPTION 'Không đủ cuộn lẻ cho thread_type_id=%, color_id=% (yêu cầu %, có %)',
          v_item->>'thread_type_id', v_item->>'color_id',
          v_partial_req, COALESCE(array_length(v_picked_partial, 1), 0);
      END IF;
    END IF;

    UPDATE thread_inventory
       SET warehouse_id = p_to_warehouse_id, updated_at = NOW()
     WHERE id = ANY(v_picked_full || v_picked_partial);

    v_cone_ids := v_cone_ids || v_picked_full || v_picked_partial;
    v_per_item := v_per_item || jsonb_build_object(
      'thread_type_id', (v_item->>'thread_type_id')::INTEGER,
      'color_id', (v_item->>'color_id')::INTEGER,
      'moved_full', COALESCE(array_length(v_picked_full, 1), 0),
      'moved_partial', COALESCE(array_length(v_picked_partial, 1), 0),
      'moved', COALESCE(array_length(v_picked_full, 1), 0) + COALESCE(array_length(v_picked_partial, 1), 0)
    );
    v_total := v_total
      + COALESCE(array_length(v_picked_full, 1), 0)
      + COALESCE(array_length(v_picked_partial, 1), 0);
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'Không có cuộn nào được chọn để chuyển';
  END IF;

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

Run: `npx supabase migration up`

Expected: Migration applied successfully.

- [ ] **Step 3: Verify column + RPC**

Run (PowerShell):
```powershell
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d batch_transactions" | Select-String "po_attribution"
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "SELECT proname, pronargs FROM pg_proc WHERE proname = 'fn_transfer_reserved_cones';"
```

Expected: Column `po_attribution jsonb` present. Exactly 1 row with `pronargs = 6`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260510100000_add_po_attribution.sql
git commit -m "feat(transfer-reserved): add po_attribution column + update split RPC"
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

`po_id` is `.optional()` so old clients omit it (→ `undefined` after parse), and `.nullable()` so new clients can send `null` for non-PO items.

- [ ] **Step 2: Type check**

Run: `npm run type-check`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/validation/transferReservedSchema.ts
git commit -m "feat(transfer-reserved): add po_id to transfer item schema"
```

---

### Task 3: Backend route — build `po_attribution`, validate po_ids, gửi RPC

**Files:**
- Modify: `server/routes/weekly-order/transfer-reserved.ts:426-434`

**Codex R1 fixes:** ISSUE-3 (distinguish undefined vs null po_id)
**Codex R2 fixes:** ISSUE-2 (null-PO attribution preserved), ISSUE-3 (lightweight po_id validation)

- [ ] **Step 1: Thêm build po_attribution + validation trước RPC call**

Thay đoạn từ `const performedBy` đến cuối RPC call (line 426-434):

```typescript
    const performedBy = await getPerformerName(c)

    const hasAttribution = parsed.data.items.some(item => item.po_id !== undefined)
    let poAttribution: Array<{ po_id: number | null; thread_type_id: number; color_id: number; cones: number }> | null = null

    if (hasAttribution) {
      poAttribution = parsed.data.items.map(item => ({
        po_id: item.po_id ?? null,
        thread_type_id: item.thread_type_id,
        color_id: item.color_id,
        cones: item.full_quantity + item.partial_quantity,
      }))

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

    const { data, error } = await supabaseAdmin.rpc('fn_transfer_reserved_cones', {
      p_week_id: weekId,
      p_from_warehouse_id: parsed.data.from_warehouse_id,
      p_to_warehouse_id: parsed.data.to_warehouse_id,
      p_items: parsed.data.items,
      p_performed_by: performedBy,
      p_po_attribution: poAttribution,
    })
```

Key fixes:
- R2-ISSUE-2: `item.po_id !== undefined` distinguishes new client (`po_id: null` = explicit non-PO) from legacy client (`po_id` omitted). Transfer of only null-PO items now stores real attribution.
- R2-ISSUE-3: Lightweight validation queries `thread_order_items` to check that non-null `po_id` values belong to the week. Invalid po_ids are logged but not rejected (warn-only, non-blocking).

- [ ] **Step 2: Type check**

Run: `npm run type-check`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/routes/weekly-order/transfer-reserved.ts
git commit -m "feat(transfer-reserved): send po_attribution to RPC with validation"
```

---

### Task 4: Backend — `fetchPoAttributionMap` + per-thread mixed-mode fallback

**Files:**
- Modify: `server/routes/weekly-order/transfer-by-calculation.ts`

**Codex R1 fixes:** ISSUE-4 (scope to dest warehouse), ISSUE-5 (per-key fallback)
**Codex R2 fixes:** ISSUE-1 (per-THREAD check, not per-PO+thread, to avoid double-counting)

- [ ] **Step 1: Thêm hàm `fetchPoAttributionMap` sau hàm `buildSharedWithPosMap` (sau line 382)**

```typescript
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

function hasAttributionForThread(poAttrMap: Map<string, number>, threadKey: string): boolean {
  for (const key of poAttrMap.keys()) {
    if (key.endsWith(`_${threadKey}`)) return true
  }
  return false
}
```

R1-ISSUE-4: Filter by `to_warehouse_id` so only transfers to the selected destination are counted.

R2-ISSUE-1: `hasAttributionForThread()` checks if ANY PO has attribution for a thread key. When true, ALL POs for that thread use attribution data (defaulting to 0 for POs not in the map). This prevents double-counting when a thread has both old and new transfers — sequential allocation distributes all cones including attributed ones, so mixing per-PO would overcount.

- [ ] **Step 2: Gọi `fetchPoAttributionMap` song song với `lastTransferMap` (line 479)**

Thay:
```typescript
      const lastTransferMap = await fetchLastTransferMap(weekId)
```

Bằng:
```typescript
      const [lastTransferMap, poAttrMap] = await Promise.all([
        fetchLastTransferMap(weekId),
        fetchPoAttributionMap(weekId, to_warehouse_id ?? null),
      ])
```

- [ ] **Step 3: Sửa logic build `transferred_for_po` với per-thread mixed-mode (line 499)**

Thay dòng:
```typescript
          const transferred_for_po = transferredByPoThread.get(`${po.po_id ?? 'null'}_${key}`) ?? 0
```

Bằng:
```typescript
          const attrKey = `${po.po_id ?? 'null'}_${key}`
          const threadHasAttr = hasAttributionForThread(poAttrMap, key)
          const transferred_for_po = threadHasAttr
            ? (poAttrMap.get(attrKey) ?? 0)
            : (transferredByPoThread.get(attrKey) ?? 0)
```

When `threadHasAttr` is true: ALL POs for this thread use attribution. POs without entries in the map get 0 (they didn't receive cones for this thread via attributed transfers). This avoids double-counting because sequential allocation is completely bypassed for threads that have any attribution data.

When `threadHasAttr` is false: thread has zero attribution (all old transfers) → full sequential allocation fallback.

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
git commit -m "feat(transfer-reserved): read po_attribution with per-thread mixed-mode fallback"
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

`selected_in_po_id` is already tracked per `SelectionEntry` — it records which PO section the user interacted with. For items from "Đặt thêm" section, `selected_in_po_id = null`.

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

- [ ] **Step 5: Test per-thread mixed-mode (R2-ISSUE-1)**

1. Trong cùng 1 tuần có cả transfer cũ (null po_attribution) và transfer mới (có po_attribution) cho CÙNG thread
2. Verify: ALL POs for that thread use attribution data (POs without attribution entries show 0 for that thread)
3. Verify: threads with ZERO attribution entries still use sequential allocation

- [ ] **Step 6: Test null-PO attribution (R2-ISSUE-2)**

1. Tick chỉ từ "Đặt thêm" (no PO), submit transfer
2. Verify `po_attribution` is NOT NULL in DB — should contain entries with `po_id: null`
3. Verify display shows correct count for non-PO items

- [ ] **Step 7: Test destination scoping (R1-ISSUE-4)**

1. Chuyển cuộn tới kho A
2. Đổi kho đích sang kho B → verify "Đã chuyển" = 0 cho kho B (chưa chuyển tới đó)

- [ ] **Step 8: Test legacy client (R1-ISSUE-3)**

1. Gọi API trực tiếp không có `po_id` field trong items (legacy format)
2. Verify `po_attribution = NULL` trong batch_transactions → fallback hoạt động

- [ ] **Step 9: Verify DB**

Run (PowerShell):
```powershell
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "SELECT id, po_attribution FROM batch_transactions WHERE po_attribution IS NOT NULL ORDER BY id DESC LIMIT 5;"
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "SELECT proname, pronargs FROM pg_proc WHERE proname = 'fn_transfer_reserved_cones';"
```

Expected: Rows mới có `po_attribution` JSONB với format đúng. Exactly 1 row with `pronargs = 6`.
