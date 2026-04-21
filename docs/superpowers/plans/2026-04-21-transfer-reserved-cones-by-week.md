# Chuyển kho cho chỉ đã gán cho Tuần đặt hàng — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép thủ kho chọn 1 Tuần + Kho nguồn + Kho đích, xem cones đã reserve theo PO, tick + nhập số cuộn → atomic transfer giữ nguyên reservation.

**Architecture:** 1 RPC PL/pgSQL (`fn_transfer_reserved_cones`) đảm bảo atomic + FOR UPDATE SKIP LOCKED. 2 Hono endpoints (`GET reserved-by-po`, `POST transfer-reserved-cones`) gắn vào router `weekly-order`. 4 file frontend (page, composable, service, types) dùng AppSelect / DataTable / q-expansion-item / useConfirm / useSnackbar.

**Tech Stack:** Vue 3 + Quasar 2 + TypeScript, Hono + Zod, Supabase (PostgreSQL PL/pgSQL).

**Spec:** `docs/superpowers/specs/2026-04-21-transfer-reserved-cones-by-week-design.md`

---

## File Structure

**Tạo mới:**
- `supabase/migrations/20260421100000_fn_transfer_reserved_cones.sql` — RPC atomic transfer
- `server/validation/transferReservedSchema.ts` — Zod schema body POST
- `server/routes/weekly-order/transfer-reserved.ts` — 2 endpoints
- `src/types/transferReserved.ts` — Types FE
- `src/services/transferReservedService.ts` — fetchApi wrapper
- `src/composables/thread/useTransferReserved.ts` — state + logic
- `src/pages/thread/transfer-reserved.vue` — UI

**Sửa:**
- `server/routes/weekly-order/index.ts` — mount router mới
- Menu config (sẽ identify ở Task 12)

---

## Task 1: Migration RPC `fn_transfer_reserved_cones`

**Files:**
- Create: `supabase/migrations/20260421100000_fn_transfer_reserved_cones.sql`

- [ ] **Step 1: Tạo migration file với function**

Nội dung file:

```sql
-- Atomic transfer cones đã reserve cho 1 tuần từ kho nguồn → kho đích.
-- FEFO pick: is_partial DESC, expiry_date ASC NULLS LAST, received_date ASC.
-- Giữ nguyên status='RESERVED_FOR_ORDER' và reserved_week_id, chỉ đổi warehouse_id.
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

- [ ] **Step 2: Apply migration**

Run: `supabase migration up`
Expected: migration applied, no error.

- [ ] **Step 3: Verify function tồn tại**

Run: `psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\df fn_transfer_reserved_cones"`
Expected: row hiện function tồn tại.

- [ ] **Step 4: Smoke test RPC bằng psql (data hợp lệ — partial)**

Tìm 1 tuần có cones RESERVED_FOR_ORDER ở 1 kho nguồn:
```sql
SELECT reserved_week_id, warehouse_id, thread_type_id, color_id, COUNT(*)
FROM thread_inventory
WHERE status='RESERVED_FOR_ORDER' AND reserved_week_id IS NOT NULL
GROUP BY 1,2,3,4 ORDER BY 5 DESC LIMIT 5;
```

Sau đó gọi (thay số thật):
```sql
SELECT fn_transfer_reserved_cones(
  <week_id>, <from_wh>, <to_wh>,
  '[{"thread_type_id": <tt>, "color_id": <c>, "quantity": 1}]'::JSONB,
  'TEST'
);
```
Expected: trả JSON `{ transaction_id, total_cones:1, per_item:[...] }`. Verify cone đó có `warehouse_id` mới, `status` và `reserved_week_id` không đổi.

- [ ] **Step 5: Test RPC quantity > available → exception + rollback**

```sql
SELECT fn_transfer_reserved_cones(
  <week_id>, <from_wh>, <to_wh>,
  '[{"thread_type_id": <tt>, "color_id": <c>, "quantity": 999999}]'::JSONB,
  'TEST'
);
```
Expected: exception "Không đủ cuộn..."; check `batch_transactions` không có row mới.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260421100000_fn_transfer_reserved_cones.sql
git commit -m "feat(db): add fn_transfer_reserved_cones RPC for atomic week-reserved transfer"
```

---

## Task 2: Zod schema validation

**Files:**
- Create: `server/validation/transferReservedSchema.ts`

- [ ] **Step 1: Viết schema**

Nội dung:

```typescript
import { z } from 'zod'

export const transferReservedItemSchema = z.object({
  thread_type_id: z.number().int().positive(),
  color_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
})

export const transferReservedBodySchema = z
  .object({
    from_warehouse_id: z.number().int().positive(),
    to_warehouse_id: z.number().int().positive(),
    items: z.array(transferReservedItemSchema).min(1).max(200),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.from_warehouse_id !== d.to_warehouse_id, {
    message: 'Kho nguồn và kho đích không được trùng nhau',
    path: ['to_warehouse_id'],
  })

export type TransferReservedBody = z.infer<typeof transferReservedBodySchema>
export type TransferReservedItem = z.infer<typeof transferReservedItemSchema>
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: no error.

- [ ] **Step 3: Commit**

```bash
git add server/validation/transferReservedSchema.ts
git commit -m "feat(api): add Zod schema for transfer-reserved-cones"
```

---

## Task 3: Backend route file — GET reserved-by-po

**Files:**
- Create: `server/routes/weekly-order/transfer-reserved.ts`

- [ ] **Step 1: Đọc reference file để follow pattern**

Read: `server/routes/weekly-order/loans-reservations.ts` (top 80 lines: imports, Hono setup, supabaseAdmin, requirePermission). Đảm bảo follow đúng pattern: response `{ data, error, message? }`, dùng `supabaseAdmin`, `.maybeSingle()` cho lookup, `.in()` để batch fetch, `.limit()` cho list.

- [ ] **Step 2: Khám phá mapping (thread_type_id, color_id) → po_id**

Run: `psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d thread_order_items"`
Run: `psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d style_colors"`
Mục tiêu: xác nhận cách suy diễn `(thread_type_id, color_id)` của tuần ↔ PO.

Strategy: nối `thread_order_items.style_color_id → style_colors (thread_type_id, color_id)` lọc theo `week_id`. Mỗi PO sẽ liệt kê các `(thread_type_id, color_id)` mà nó dùng.

- [ ] **Step 3: Viết file route — phần khung + GET endpoint**

Nội dung:

```typescript
import { Hono } from 'hono'
import { supabaseAdmin } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import type { AppEnv } from '../../types/hono-env'

const router = new Hono<AppEnv>()

router.get(
  '/:weekId/reserved-by-po',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    const weekId = Number(c.req.param('weekId'))
    const warehouseId = Number(c.req.query('warehouse_id'))

    if (!Number.isFinite(weekId) || !Number.isFinite(warehouseId)) {
      return c.json({ data: null, error: 'Tham số không hợp lệ' }, 400)
    }

    const { data: week, error: weekErr } = await supabaseAdmin
      .from('thread_order_weeks')
      .select('id, week_name, status')
      .eq('id', weekId)
      .maybeSingle()
    if (weekErr) return c.json({ data: null, error: weekErr.message }, 500)
    if (!week) return c.json({ data: null, error: 'Tuần không tồn tại' }, 404)

    const { data: warehouse, error: whErr } = await supabaseAdmin
      .from('warehouses')
      .select('id, code, name')
      .eq('id', warehouseId)
      .maybeSingle()
    if (whErr) return c.json({ data: null, error: whErr.message }, 500)
    if (!warehouse) return c.json({ data: null, error: 'Kho không tồn tại' }, 404)

    const { data: cones, error: coneErr } = await supabaseAdmin
      .from('thread_inventory')
      .select('thread_type_id, color_id, quantity_meters')
      .eq('reserved_week_id', weekId)
      .eq('warehouse_id', warehouseId)
      .eq('status', 'RESERVED_FOR_ORDER')
      .limit(50000)
    if (coneErr) return c.json({ data: null, error: coneErr.message }, 500)

    const poolMap = new Map<string, { cones: number; meters: number }>()
    for (const c of cones || []) {
      const key = `${c.thread_type_id}-${c.color_id}`
      const cur = poolMap.get(key) || { cones: 0, meters: 0 }
      cur.cones += 1
      cur.meters += Number(c.quantity_meters || 0)
      poolMap.set(key, cur)
    }

    const threadTypeIds = Array.from(
      new Set((cones || []).map((c) => c.thread_type_id).filter(Boolean))
    )
    const colorIds = Array.from(
      new Set((cones || []).map((c) => c.color_id).filter(Boolean))
    )

    const [ttRes, colorRes] = await Promise.all([
      threadTypeIds.length
        ? supabaseAdmin
            .from('thread_types')
            .select('id, tex_number, supplier_id, suppliers(name)')
            .in('id', threadTypeIds)
        : Promise.resolve({ data: [], error: null }),
      colorIds.length
        ? supabaseAdmin.from('colors').select('id, name').in('id', colorIds)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (ttRes.error) return c.json({ data: null, error: ttRes.error.message }, 500)
    if (colorRes.error)
      return c.json({ data: null, error: colorRes.error.message }, 500)

    const ttMap = new Map<number, { tex_number: number; supplier_name: string }>()
    for (const t of (ttRes.data || []) as any[]) {
      ttMap.set(t.id, {
        tex_number: t.tex_number,
        supplier_name: t.suppliers?.name || '',
      })
    }
    const colorMap = new Map<number, string>()
    for (const c of colorRes.data || []) colorMap.set(c.id, c.name)

    const { data: orderItems, error: oiErr } = await supabaseAdmin
      .from('thread_order_items')
      .select(
        'po_id, style_color_id, purchase_orders(po_number), style_colors(thread_type_id, color_id)'
      )
      .eq('week_id', weekId)
      .limit(50000)
    if (oiErr) return c.json({ data: null, error: oiErr.message }, 500)

    type Line = {
      thread_type_id: number
      color_id: number
      supplier_name: string
      tex_number: number
      color_name: string
      reserved_cones_at_source: number
      reserved_meters_at_source: number
    }
    const poBuckets = new Map<
      number,
      { po_number: string; thread_lines: Line[]; seen: Set<string> }
    >()
    const usedKeys = new Set<string>()

    for (const oi of (orderItems || []) as any[]) {
      const sc = oi.style_colors
      if (!sc?.thread_type_id || !sc?.color_id) continue
      const key = `${sc.thread_type_id}-${sc.color_id}`
      const pool = poolMap.get(key)
      if (!pool) continue

      let bucket = poBuckets.get(oi.po_id)
      if (!bucket) {
        bucket = {
          po_number: oi.purchase_orders?.po_number || '',
          thread_lines: [],
          seen: new Set(),
        }
        poBuckets.set(oi.po_id, bucket)
      }
      if (bucket.seen.has(key)) continue
      bucket.seen.add(key)
      usedKeys.add(key)

      const tt = ttMap.get(sc.thread_type_id)
      bucket.thread_lines.push({
        thread_type_id: sc.thread_type_id,
        color_id: sc.color_id,
        supplier_name: tt?.supplier_name || '',
        tex_number: tt?.tex_number || 0,
        color_name: colorMap.get(sc.color_id) || '',
        reserved_cones_at_source: pool.cones,
        reserved_meters_at_source: pool.meters,
      })
    }

    const pos = Array.from(poBuckets.entries())
      .map(([po_id, b]) => ({
        po_id,
        po_number: b.po_number,
        thread_lines: b.thread_lines,
      }))
      .sort((a, b) => a.po_number.localeCompare(b.po_number))

    const unassignedLines: Line[] = []
    for (const [key, pool] of poolMap.entries()) {
      if (usedKeys.has(key)) continue
      const [tt, co] = key.split('-').map(Number)
      const ttInfo = ttMap.get(tt)
      unassignedLines.push({
        thread_type_id: tt,
        color_id: co,
        supplier_name: ttInfo?.supplier_name || '',
        tex_number: ttInfo?.tex_number || 0,
        color_name: colorMap.get(co) || '',
        reserved_cones_at_source: pool.cones,
        reserved_meters_at_source: pool.meters,
      })
    }

    return c.json({
      data: {
        week,
        source_warehouse: warehouse,
        pos,
        unassigned: { thread_lines: unassignedLines },
      },
      error: null,
    })
  }
)

export default router
```

- [ ] **Step 2.1: Verify schema columns trước khi commit**

Run các lệnh:
```
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d thread_inventory"
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d thread_types"
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d colors"
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d thread_order_items"
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d style_colors"
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d purchase_orders"
psql -h 127.0.0.1 -p 55422 -U postgres -d postgres -c "\d suppliers"
```
Expected: confirm tên cột trong code match. Nếu khác (vd `quantity_meters` thực tế là `meters_quantity`, `colors` thực tế là `thread_colors`, supplier name field…), edit code lại cho đúng.

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: no error.

- [ ] **Step 4: Commit**

```bash
git add server/routes/weekly-order/transfer-reserved.ts
git commit -m "feat(api): GET /weekly-orders/:weekId/reserved-by-po"
```

---

## Task 4: Backend — POST transfer-reserved-cones (RPC wrapper)

**Files:**
- Modify: `server/routes/weekly-order/transfer-reserved.ts`

- [ ] **Step 1: Append POST handler**

Thêm vào file (trước `export default router`):

```typescript
import { transferReservedBodySchema } from '../../validation/transferReservedSchema'

router.post(
  '/:weekId/transfer-reserved-cones',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    const weekId = Number(c.req.param('weekId'))
    if (!Number.isFinite(weekId)) {
      return c.json({ data: null, error: 'Tuần không hợp lệ' }, 400)
    }

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ data: null, error: 'Body JSON không hợp lệ' }, 400)
    }

    const parsed = transferReservedBodySchema.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { data: null, error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        400
      )
    }

    const employeeCode = c.get('employee_code') || 'SYSTEM'

    const { data, error } = await supabaseAdmin.rpc('fn_transfer_reserved_cones', {
      p_week_id: weekId,
      p_from_warehouse_id: parsed.data.from_warehouse_id,
      p_to_warehouse_id: parsed.data.to_warehouse_id,
      p_items: parsed.data.items,
      p_performed_by: employeeCode,
    })

    if (error) {
      return c.json({ data: null, error: error.message }, 400)
    }

    const result = data as { transaction_id: number; total_cones: number; per_item: any[] }
    return c.json({
      data: result,
      error: null,
      message: `Đã chuyển ${result.total_cones} cuộn`,
    })
  }
)
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: no error.

- [ ] **Step 3: Commit**

```bash
git add server/routes/weekly-order/transfer-reserved.ts
git commit -m "feat(api): POST /weekly-orders/:weekId/transfer-reserved-cones via RPC"
```

---

## Task 5: Mount router

**Files:**
- Modify: `server/routes/weekly-order/index.ts`

- [ ] **Step 1: Đọc file hiện tại**

Read: `server/routes/weekly-order/index.ts`. Xác nhận thứ tự mount (core → calculation → deliveries → loans-reservations).

- [ ] **Step 2: Thêm import + route**

Edit file thành:

```typescript
import { Hono } from 'hono'
import type { AppEnv } from '../../types/hono-env'
import coreRoutes from './core'
import calculationRoutes from './calculation'
import deliveryRoutes from './deliveries'
import loansReservationsRoutes from './loans-reservations'
import transferReservedRoutes from './transfer-reserved'

// Mount order matters: specific paths before parameterized /:id paths
const weeklyOrder = new Hono<AppEnv>()

weeklyOrder.route('/', coreRoutes)
weeklyOrder.route('/', calculationRoutes)
weeklyOrder.route('/', deliveryRoutes)
weeklyOrder.route('/', loansReservationsRoutes)
weeklyOrder.route('/', transferReservedRoutes)

export default weeklyOrder
```

(Routes mới đều có path con `/:weekId/reserved-by-po` và `/:weekId/transfer-reserved-cones` — không xung đột với route `/:id` generic của core.)

- [ ] **Step 3: Khởi động backend + smoke test**

Run: `npm run server` (background)
Test (có Bearer token):
```
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/weekly-orders/<weekId>/reserved-by-po?warehouse_id=<id>"
```
Expected: `{ data: { week, source_warehouse, pos, unassigned }, error: null }`.

- [ ] **Step 4: Commit**

```bash
git add server/routes/weekly-order/index.ts
git commit -m "feat(api): mount transfer-reserved router"
```

---

## Task 6: Frontend types

**Files:**
- Create: `src/types/transferReserved.ts`

- [ ] **Step 1: Viết file**

```typescript
export interface ReservedThreadLine {
  thread_type_id: number
  color_id: number
  supplier_name: string
  tex_number: number
  color_name: string
  reserved_cones_at_source: number
  reserved_meters_at_source: number
}

export interface ReservedPoGroup {
  po_id: number
  po_number: string
  thread_lines: ReservedThreadLine[]
}

export interface ReservedByPoResponse {
  week: { id: number; week_name: string; status: string }
  source_warehouse: { id: number; code: string; name: string }
  pos: ReservedPoGroup[]
  unassigned: { thread_lines: ReservedThreadLine[] }
}

export interface TransferReservedItem {
  thread_type_id: number
  color_id: number
  quantity: number
}

export interface TransferReservedBody {
  from_warehouse_id: number
  to_warehouse_id: number
  items: TransferReservedItem[]
  notes?: string
}

export interface TransferReservedResult {
  transaction_id: number
  total_cones: number
  per_item: Array<{ thread_type_id: number; color_id: number; moved: number }>
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npm run type-check`
```bash
git add src/types/transferReserved.ts
git commit -m "feat(types): add transfer-reserved types"
```

---

## Task 7: Frontend service

**Files:**
- Create: `src/services/transferReservedService.ts`

- [ ] **Step 1: Đọc 1 service hiện có để follow pattern fetchApi**

Read first 40 lines: `src/services/threadService.ts` — confirm `fetchApi` import path và URL prefix.

- [ ] **Step 2: Viết service**

```typescript
import { fetchApi } from './api'
import type {
  ReservedByPoResponse,
  TransferReservedBody,
  TransferReservedResult,
} from '@/types/transferReserved'

export const transferReservedService = {
  async getReservedByPo(weekId: number, warehouseId: number) {
    return fetchApi<ReservedByPoResponse>(
      `/api/weekly-orders/${weekId}/reserved-by-po?warehouse_id=${warehouseId}`
    )
  },

  async submit(weekId: number, body: TransferReservedBody) {
    return fetchApi<TransferReservedResult>(
      `/api/weekly-orders/${weekId}/transfer-reserved-cones`,
      { method: 'POST', body: JSON.stringify(body) }
    )
  },
}
```

- [ ] **Step 3: Type-check + commit**

Run: `npm run type-check`
```bash
git add src/services/transferReservedService.ts
git commit -m "feat(services): add transferReservedService"
```

---

## Task 8: Composable `useTransferReserved`

**Files:**
- Create: `src/composables/thread/useTransferReserved.ts`

- [ ] **Step 1: Viết composable**

```typescript
import { ref, computed } from 'vue'
import { transferReservedService } from '@/services/transferReservedService'
import { useSnackbar } from '@/composables/useSnackbar'
import type {
  ReservedByPoResponse,
  TransferReservedItem,
} from '@/types/transferReserved'

interface SelectionEntry {
  thread_type_id: number
  color_id: number
  available: number
  quantity: number
  label: string
}

export function useTransferReserved() {
  const snackbar = useSnackbar()

  const weekId = ref<number | null>(null)
  const fromWarehouseId = ref<number | null>(null)
  const toWarehouseId = ref<number | null>(null)
  const data = ref<ReservedByPoResponse | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const selected = ref<Map<string, SelectionEntry>>(new Map())

  const keyOf = (tt: number, c: number) => `${tt}-${c}`

  async function fetchData() {
    if (!weekId.value || !fromWarehouseId.value) return
    loading.value = true
    try {
      const res = await transferReservedService.getReservedByPo(
        weekId.value,
        fromWarehouseId.value
      )
      if (res.error) {
        snackbar.error(res.error)
        data.value = null
      } else {
        data.value = res.data
        selected.value = new Map()
      }
    } catch (e: any) {
      snackbar.error(e?.message || 'Lỗi tải dữ liệu')
    } finally {
      loading.value = false
    }
  }

  function toggle(tt: number, c: number, available: number, label: string) {
    const k = keyOf(tt, c)
    if (selected.value.has(k)) {
      selected.value.delete(k)
    } else {
      selected.value.set(k, {
        thread_type_id: tt,
        color_id: c,
        available,
        quantity: available,
        label,
      })
    }
    selected.value = new Map(selected.value)
  }

  function setQuantity(tt: number, c: number, q: number) {
    const k = keyOf(tt, c)
    const entry = selected.value.get(k)
    if (!entry) return
    entry.quantity = q
    selected.value = new Map(selected.value)
  }

  const selectedArray = computed(() => Array.from(selected.value.values()))
  const totalSelectedCones = computed(() =>
    selectedArray.value.reduce((s, x) => s + (Number(x.quantity) || 0), 0)
  )
  const hasInvalid = computed(() =>
    selectedArray.value.some(
      (x) => !Number.isFinite(x.quantity) || x.quantity <= 0 || x.quantity > x.available
    )
  )
  const canSubmit = computed(
    () =>
      !!weekId.value &&
      !!fromWarehouseId.value &&
      !!toWarehouseId.value &&
      fromWarehouseId.value !== toWarehouseId.value &&
      selectedArray.value.length > 0 &&
      !hasInvalid.value &&
      !submitting.value
  )

  async function submit(): Promise<boolean> {
    if (!canSubmit.value || !weekId.value) return false
    submitting.value = true
    try {
      const items: TransferReservedItem[] = selectedArray.value.map((x) => ({
        thread_type_id: x.thread_type_id,
        color_id: x.color_id,
        quantity: x.quantity,
      }))
      const res = await transferReservedService.submit(weekId.value, {
        from_warehouse_id: fromWarehouseId.value!,
        to_warehouse_id: toWarehouseId.value!,
        items,
      })
      if (res.error) {
        snackbar.error(res.error)
        return false
      }
      snackbar.success(res.message || `Đã chuyển ${res.data?.total_cones} cuộn`)
      await fetchData()
      return true
    } catch (e: any) {
      snackbar.error(e?.message || 'Lỗi khi chuyển cuộn')
      return false
    } finally {
      submitting.value = false
    }
  }

  function isSelected(tt: number, c: number) {
    return selected.value.has(keyOf(tt, c))
  }

  function getSelection(tt: number, c: number) {
    return selected.value.get(keyOf(tt, c))
  }

  return {
    weekId,
    fromWarehouseId,
    toWarehouseId,
    data,
    loading,
    submitting,
    selected,
    selectedArray,
    totalSelectedCones,
    canSubmit,
    hasInvalid,
    fetchData,
    toggle,
    setQuantity,
    submit,
    isSelected,
    getSelection,
  }
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npm run type-check`
```bash
git add src/composables/thread/useTransferReserved.ts
git commit -m "feat(composables): add useTransferReserved"
```

---

## Task 9: Page `transfer-reserved.vue` — filter bar + framework

**Files:**
- Create: `src/pages/thread/transfer-reserved.vue`

- [ ] **Step 1: Đọc 1 page hiện có để xác định API list tuần & list kho**

Read: `src/services/weeklyOrderService.ts` (hoặc `src/composables/useWeeklyOrder*.ts`) → tìm method list weeks. Read: `src/services/warehouseService.ts` hoặc `src/composables/useWarehouses.ts` → tìm method list warehouses. Note tên đúng để dùng ở step 2.

- [ ] **Step 2: Viết file page (skeleton + filter bar)**

```vue
<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Chuyển kho cho chỉ đã gán theo Tuần</div>

    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-md-3">
          <AppSelect
            v-model="weekId"
            :options="weekOptions"
            label="Tuần đặt hàng"
            emit-value
            map-options
            @update:model-value="onWeekChange"
          />
        </div>
        <div class="col-12 col-md-3">
          <AppSelect
            v-model="fromWarehouseId"
            :options="warehouseOptions"
            label="Kho nguồn"
            emit-value
            map-options
            @update:model-value="onSourceChange"
          />
        </div>
        <div class="col-12 col-md-3">
          <AppSelect
            v-model="toWarehouseId"
            :options="warehouseOptions"
            label="Kho đích"
            emit-value
            map-options
          />
        </div>
        <div class="col-12 col-md-3 text-right">
          <AppButton
            :loading="loading"
            :disable="!weekId || !fromWarehouseId"
            label="Tải lại"
            @click="fetchData"
          />
        </div>
      </div>
    </q-card>

    <q-card v-if="data" flat bordered class="q-mb-md q-pa-sm">
      Tổng quan: {{ data.pos.length }} PO ·
      {{ totalLines }} loại chỉ ·
      {{ totalAvailableCones }} cuộn ở {{ data.source_warehouse.name }}
    </q-card>

    <PoSection
      v-for="po in data?.pos || []"
      :key="po.po_id"
      :title="po.po_number"
      :lines="po.thread_lines"
      :is-selected="isSelected"
      :get-selection="getSelection"
      @toggle="toggle"
      @set-quantity="setQuantity"
    />
    <PoSection
      v-if="data && data.unassigned.thread_lines.length"
      title="Không thuộc PO nào"
      :lines="data.unassigned.thread_lines"
      :is-selected="isSelected"
      :get-selection="getSelection"
      @toggle="toggle"
      @set-quantity="setQuantity"
    />

    <q-card
      v-if="selectedArray.length"
      flat
      bordered
      class="q-pa-md row items-center justify-between sticky-footer"
    >
      <div>
        Đã chọn: {{ selectedArray.length }} dòng · Tổng
        <b>{{ totalSelectedCones }}</b> cuộn
      </div>
      <div class="q-gutter-sm">
        <AppButton flat label="Hủy" @click="clearSelection" />
        <AppButton
          color="primary"
          :loading="submitting"
          :disable="!canSubmit"
          label="Chuyển"
          @click="onSubmit"
        />
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import { useTransferReserved } from '@/composables/thread/useTransferReserved'
import { useConfirm } from '@/composables/useConfirm'
import PoSection from '@/components/thread/transfer-reserved/PoSection.vue'

const {
  weekId,
  fromWarehouseId,
  toWarehouseId,
  data,
  loading,
  submitting,
  selectedArray,
  totalSelectedCones,
  canSubmit,
  fetchData,
  toggle,
  setQuantity,
  submit,
  isSelected,
  getSelection,
  selected,
} = useTransferReserved()

const confirm = useConfirm()

const weekOptions = ref<Array<{ label: string; value: number }>>([])
const warehouseOptions = ref<Array<{ label: string; value: number; name: string }>>([])

async function loadWeeks() {
  // TODO Step 3: gọi service list weeks (xác định ở Step 1)
}
async function loadWarehouses() {
  // TODO Step 3: gọi service list warehouses (xác định ở Step 1)
}

const totalLines = computed(
  () =>
    (data.value?.pos.reduce((s, p) => s + p.thread_lines.length, 0) || 0) +
    (data.value?.unassigned.thread_lines.length || 0)
)
const totalAvailableCones = computed(() => {
  const all = [
    ...(data.value?.pos.flatMap((p) => p.thread_lines) || []),
    ...(data.value?.unassigned.thread_lines || []),
  ]
  const seen = new Set<string>()
  let sum = 0
  for (const l of all) {
    const k = `${l.thread_type_id}-${l.color_id}`
    if (seen.has(k)) continue
    seen.add(k)
    sum += l.reserved_cones_at_source
  }
  return sum
})

function onWeekChange() {
  selected.value = new Map()
  if (weekId.value && fromWarehouseId.value) fetchData()
}
function onSourceChange() {
  selected.value = new Map()
  if (weekId.value && fromWarehouseId.value) fetchData()
}

function clearSelection() {
  selected.value = new Map()
}

async function onSubmit() {
  const fromName =
    warehouseOptions.value.find((w) => w.value === fromWarehouseId.value)?.label || ''
  const toName =
    warehouseOptions.value.find((w) => w.value === toWarehouseId.value)?.label || ''
  const ok = await confirm({
    title: 'Xác nhận chuyển kho',
    message: `Chuyển ${totalSelectedCones.value} cuộn của ${selectedArray.value.length} loại chỉ từ [${fromName}] sang [${toName}]?`,
    okLabel: 'Chuyển',
    cancelLabel: 'Hủy',
  })
  if (!ok) return
  await submit()
}

onMounted(() => {
  loadWeeks()
  loadWarehouses()
})
</script>

<style scoped>
.sticky-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: white;
}
</style>
```

- [ ] **Step 3: Hoàn thiện `loadWeeks` + `loadWarehouses`**

Dùng đúng tên service đã note ở Step 1. Map kết quả thành `{ label: 'Tuần ...', value: id }` và `{ label: 'PT - Phú Tường', value: id, name }`. Nếu service trả error, gọi `snackbar.error()`.

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: error duy nhất `PoSection.vue` không tồn tại — sẽ tạo ở Task 10.

- [ ] **Step 5: Commit**

```bash
git add src/pages/thread/transfer-reserved.vue
git commit -m "feat(ui): scaffold transfer-reserved page (filter + skeleton)"
```

---

## Task 10: Component `PoSection.vue` (accordion + table)

**Files:**
- Create: `src/components/thread/transfer-reserved/PoSection.vue`

- [ ] **Step 1: Viết component**

```vue
<template>
  <q-expansion-item
    default-opened
    expand-separator
    :label="`${title} (${lines.length} loại chỉ)`"
    class="q-mb-sm bordered"
  >
    <q-card flat bordered>
      <q-table
        :rows="lines"
        :columns="columns"
        row-key="key"
        flat
        hide-pagination
        :rows-per-page-options="[0]"
      >
        <template #body-cell-pick="props">
          <q-td :props="props">
            <q-checkbox
              :model-value="isSelected(props.row.thread_type_id, props.row.color_id)"
              @update:model-value="
                emit(
                  'toggle',
                  props.row.thread_type_id,
                  props.row.color_id,
                  props.row.reserved_cones_at_source,
                  rowLabel(props.row)
                )
              "
            />
          </q-td>
        </template>
        <template #body-cell-thread="props">
          <q-td :props="props">
            {{ rowLabel(props.row) }}
          </q-td>
        </template>
        <template #body-cell-quantity="props">
          <q-td :props="props">
            <AppInput
              v-if="isSelected(props.row.thread_type_id, props.row.color_id)"
              :model-value="getSelection(props.row.thread_type_id, props.row.color_id)?.quantity"
              type="number"
              dense
              :error="
                isInvalid(
                  getSelection(props.row.thread_type_id, props.row.color_id)?.quantity,
                  props.row.reserved_cones_at_source
                )
              "
              @update:model-value="
                emit('set-quantity', props.row.thread_type_id, props.row.color_id, Number($event) || 0)
              "
            />
            <span v-else class="text-grey">—</span>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-expansion-item>
</template>

<script setup lang="ts">
import AppInput from '@/components/ui/inputs/AppInput.vue'
import type { ReservedThreadLine } from '@/types/transferReserved'

const props = defineProps<{
  title: string
  lines: ReservedThreadLine[]
  isSelected: (tt: number, c: number) => boolean
  getSelection: (tt: number, c: number) => { quantity: number } | undefined
}>()

const emit = defineEmits<{
  (e: 'toggle', tt: number, c: number, available: number, label: string): void
  (e: 'set-quantity', tt: number, c: number, q: number): void
}>()

const columns = [
  { name: 'pick', label: '', field: 'pick', align: 'center' as const },
  { name: 'thread', label: 'Loại chỉ (NCC - Tex - Màu)', field: 'thread', align: 'left' as const },
  {
    name: 'available',
    label: 'Có sẵn',
    field: 'reserved_cones_at_source',
    align: 'right' as const,
  },
  {
    name: 'meters',
    label: 'Mét',
    field: 'reserved_meters_at_source',
    align: 'right' as const,
    format: (v: number) => v.toLocaleString('vi-VN'),
  },
  { name: 'quantity', label: 'Số cuộn chuyển', field: 'quantity', align: 'right' as const },
]

function rowLabel(row: ReservedThreadLine) {
  return `${row.supplier_name} - Tex ${row.tex_number} - ${row.color_name}`
}

function isInvalid(q: number | undefined, max: number) {
  if (q === undefined || q === null) return false
  return !Number.isFinite(q) || q <= 0 || q > max
}
</script>
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: no error.

- [ ] **Step 3: Commit**

```bash
git add src/components/thread/transfer-reserved/PoSection.vue
git commit -m "feat(ui): PoSection accordion table for transfer-reserved"
```

---

## Task 11: Menu + routing

**Files:**
- Modify: menu config (xác định ở Step 1)

- [ ] **Step 1: Tìm menu config**

Run: `Grep "thread/inventory" src/` để tìm file định nghĩa menu (thường là `src/layouts/MainLayout.vue` hoặc `src/composables/useMenu.ts`).

- [ ] **Step 2: Thêm menu item**

Trong group "Kho chỉ" (cùng nhóm với Inventory, Batch ops), thêm:
```
{ label: 'Chuyển kho theo Tuần', icon: 'swap_horiz', to: '/thread/transfer-reserved', permission: 'thread.batch.transfer' }
```
Đặt trước/sau item Batch transfer hiện có. Field `permission` theo đúng pattern menu hiện có (đọc item liền kề để copy đúng key).

- [ ] **Step 3: Verify route auto-generated**

Run: `npm run dev` → mở `http://localhost:5173/thread/transfer-reserved`
Expected: page mở, filter bar hiển thị; selectors load options.

- [ ] **Step 4: Commit**

```bash
git add <menu-file>
git commit -m "feat(ui): add transfer-reserved menu item"
```

---

## Task 12: Manual end-to-end test

**Files:** none (test only)

- [ ] **Step 1: Seed data nếu chưa có**

Đảm bảo có ít nhất 1 tuần CONFIRMED với cones reserved ở 1 kho nguồn (vd PT). Nếu không có, dùng feature reserve tuần hiện có để tạo.

- [ ] **Step 2: Test golden path**

1. Vào `/thread/transfer-reserved`
2. Chọn Tuần + Kho nguồn → bảng load đúng PO + số cones
3. Chọn Kho đích
4. Tick 1 dòng → AppInput hiện với số default = available
5. Đổi quantity = 2 → confirm dialog hiện đúng tên kho
6. OK → snackbar "Đã chuyển 2 cuộn" → bảng refetch, số giảm 2
7. Verify DB: `SELECT warehouse_id, status, reserved_week_id FROM thread_inventory WHERE id IN (...)` → `warehouse_id` mới, `status` và `reserved_week_id` không đổi
8. Verify `batch_transactions` có 1 row mới với `cone_count=2`, `from/to` đúng

- [ ] **Step 3: Test edge cases**

| Case | Expected |
|---|---|
| from = to | nút Chuyển disable |
| Nhập quantity > available | ô input đỏ, nút disable |
| Nhập quantity = 0 | ô input đỏ |
| Chọn tuần không có cones ở kho | empty state, không có PO |
| Submit khi đã có ai đó move trước (mở 2 tab) | snackbar lỗi "Không đủ cuộn..."; bảng auto refetch |
| User không có permission `thread.batch.transfer` | menu ẩn / 403 khi gọi API |

- [ ] **Step 4: Commit checklist (nếu có fix nhỏ trong quá trình test)**

Run: `npm run lint && npm run type-check`

---

## Task 13: Final pass — lint, type-check, docs note

**Files:** none (verification)

- [ ] **Step 1: Lint + type-check toàn dự án**

Run: `npm run lint && npm run type-check`
Expected: no error.

- [ ] **Step 2: Cập nhật docs**

Theo `documentation-management.md`:
- `docs/project-roadmap.md` — thêm bullet "Feature: Chuyển kho cho chỉ đã gán theo Tuần đặt hàng"
- `docs/codebase-summary.md` — thêm path mới (route + page + RPC) vào danh sách relevant

- [ ] **Step 3: Commit docs**

```bash
git add docs/project-roadmap.md docs/codebase-summary.md
git commit -m "docs: note transfer-reserved feature"
```

---

## Self-Review Notes

- Coverage: spec sections 3 (data model — no schema change) ✓, 4.1 GET ✓ (Task 3), 4.2 POST ✓ (Task 4), 4.3 RPC ✓ (Task 1), 5 FE ✓ (Tasks 6-10), 6 BE ✓ (Tasks 2-5), 7 edge cases ✓ (Tasks 4 + 12), 8 test plan ✓ (Tasks 1.4-1.5 + Task 12).
- Schema verification gate ở Task 3 Step 2.1 — bắt buộc xác nhận tên cột thực tế trước khi commit (đặc biệt `quantity_meters`, `colors` vs `thread_colors`, `suppliers.name`, `style_colors.thread_type_id/color_id`).
- RPC migration `<ts>` cố định = `20260421100000` (sau migration mới nhất `20260419112000`).
- Menu file path để placeholder cho Task 11 vì sẽ tìm bằng grep — tránh đoán file sai.
