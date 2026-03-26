# Live Data cho ThreadSummaryTable - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế dữ liệu tĩnh (JSONB snapshot) bằng live data cho bảng ThreadSummaryTable trên trang Weekly Order History, giúp theo dõi chính xác tình trạng tồn kho và giao hàng.

**Architecture:** Tạo endpoint mới `GET /api/weekly-orders/:id/thread-summary-live` query live từ `thread_inventory` + `thread_order_deliveries`, kết hợp metadata từ `summary_data` JSONB. Frontend gọi endpoint mới thay vì 2 endpoint cũ, mapping trực tiếp response → table rows.

**Tech Stack:** Hono (backend) | Supabase (PostgreSQL) | Vue 3 + Quasar 2 + TypeScript (frontend)

**Spec:** `docs/superpowers/specs/2026-03-26-history-thread-summary-live-data-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/types/thread/weeklyOrder.ts` | Update `ThreadSummaryRow` interface |
| Modify | `server/routes/weeklyOrder.ts` | Add `GET /:id/thread-summary-live` route |
| Modify | `src/services/weeklyOrderService.ts` | Add `getThreadSummaryLive()` method |
| Modify | `src/pages/thread/weekly-order/history.vue` | Update `loadThreadSummary()` to call new endpoint |
| Modify | `src/components/thread/weekly-order/ThreadSummaryTable.vue` | Rename columns + update field bindings |

---

### Task 1: Update TypeScript interface `ThreadSummaryRow`

**Files:**
- Modify: `src/types/thread/weeklyOrder.ts:351-361`

- [ ] **Step 1: Update the `ThreadSummaryRow` interface**

Replace the current interface at line 351-361:

```typescript
// BEFORE:
export interface ThreadSummaryRow {
  thread_type_id: number
  thread_type_name: string
  supplier_name: string
  tex_number: string
  thread_color?: string | null
  total_cones: number
  equivalent_cones: number
  pending_cones: number
  shortage: number
}

// AFTER:
export interface ThreadSummaryRow {
  thread_type_id: number
  thread_type_name: string
  supplier_name: string
  tex_number: string
  thread_color?: string | null
  total_cones: number
  reserved_cones: number
  pending_cones: number
  remaining: number
}
```

Changes: `equivalent_cones` -> `reserved_cones`, `shortage` -> `remaining`. Meaning shifts from "stock snapshot" to "live reserved count" and from "shortage" to "not yet in warehouse".

- [ ] **Step 2: Run type-check to identify all downstream breakages**

Run: `npm run type-check`
Expected: Type errors in `history.vue` and `ThreadSummaryTable.vue` (we'll fix in later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/types/thread/weeklyOrder.ts
git commit -m "refactor: update ThreadSummaryRow interface for live data columns"
```

---

### Task 2: Add backend endpoint `GET /:id/thread-summary-live`

**Files:**
- Modify: `server/routes/weeklyOrder.ts` (insert after line 2704, after `GET /:id/results`)

- [ ] **Step 1: Add the new route**

Insert after the existing `GET /:id/results` route (after line 2704):

```typescript
/**
 * GET /api/weekly-orders/:id/thread-summary-live
 * Live data: reserved cones + pending deliveries + JSONB metadata
 */
weeklyOrder.get('/:id/thread-summary-live', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const [summaryResult, reservedResult, pendingResult] = await Promise.all([
      supabase
        .from('thread_order_results')
        .select('summary_data')
        .eq('week_id', id)
        .single(),
      supabase
        .from('thread_inventory')
        .select('thread_type_id')
        .eq('reserved_week_id', id)
        .eq('status', 'RESERVED_FOR_ORDER')
        .limit(5000),
      supabase
        .from('thread_order_deliveries')
        .select('thread_type_id, quantity_cones')
        .eq('week_id', id)
        .eq('status', 'PENDING')
        .limit(1000),
    ])

    if (summaryResult.error) {
      if (summaryResult.error.code === 'PGRST116') {
        return c.json({ data: [], error: null })
      }
      throw summaryResult.error
    }

    const summaryData = (summaryResult.data?.summary_data || []) as Array<{
      thread_type_id: number
      thread_type_name: string
      supplier_name: string
      tex_number: string
      thread_color?: string
      total_cones: number
    }>

    if (!summaryData.length) {
      return c.json({ data: [], error: null })
    }

    const reservedMap = new Map<number, number>()
    for (const row of reservedResult.data || []) {
      reservedMap.set(row.thread_type_id, (reservedMap.get(row.thread_type_id) || 0) + 1)
    }

    const pendingMap = new Map<number, number>()
    for (const row of pendingResult.data || []) {
      pendingMap.set(row.thread_type_id, (pendingMap.get(row.thread_type_id) || 0) + (row.quantity_cones || 0))
    }

    const rows = summaryData.map((row) => {
      const totalCones = row.total_cones || 0
      const reservedCones = reservedMap.get(row.thread_type_id) || 0
      const pendingCones = pendingMap.get(row.thread_type_id) || 0
      return {
        thread_type_id: row.thread_type_id,
        thread_type_name: row.thread_type_name,
        supplier_name: row.supplier_name,
        tex_number: row.tex_number,
        thread_color: row.thread_color || null,
        total_cones: totalCones,
        reserved_cones: reservedCones,
        pending_cones: pendingCones,
        remaining: Math.max(0, totalCones - reservedCones),
      }
    })

    return c.json({ data: rows, error: null })
  } catch (err) {
    console.error('Error fetching thread summary live:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})
```

**Route placement:** After `GET /:id/results` (line 2704), before the `LOAN & RESERVATION ENDPOINTS` section (line 2706). This ensures `/:id/thread-summary-live` is matched before `/:id` generic route.

**Query logic:**
- `thread_inventory`: selects all rows with `reserved_week_id = id` and `status = 'RESERVED_FOR_ORDER'`, then counts per `thread_type_id` in JS (COUNT GROUP BY via Map)
- `thread_order_deliveries`: selects `thread_type_id, quantity_cones` for `week_id = id` and `status = 'PENDING'`, then SUMs per `thread_type_id` in JS
- `thread_order_results`: gets JSONB metadata

**Supabase limits:** `.limit(5000)` on `thread_inventory` (max reserved cones per week), `.limit(1000)` on deliveries (max pending deliveries per week). Typical weeks: 50-200 cones, 5-20 deliveries.

- [ ] **Step 2: Verify backend compiles**

Run: `npm run type-check`
Expected: PASS (no backend type errors from this route)

- [ ] **Step 3: Manual test with curl**

Run (with dev server running):
```bash
curl -s http://localhost:3000/api/weekly-orders/1/thread-summary-live -H "Authorization: Bearer <token>" | jq .
```
Expected: `{ "data": [...], "error": null }` with `reserved_cones`, `pending_cones`, `remaining` fields.

- [ ] **Step 4: Commit**

```bash
git add server/routes/weeklyOrder.ts
git commit -m "feat: add GET /:id/thread-summary-live endpoint for live inventory data"
```

---

### Task 3: Add frontend service method `getThreadSummaryLive`

**Files:**
- Modify: `src/services/weeklyOrderService.ts`

- [ ] **Step 1: Add `getThreadSummaryLive` method**

Add after the `getResults` method (after line 240):

```typescript
  async getThreadSummaryLive(weekId: number): Promise<ThreadSummaryRow[]> {
    const response = await fetchApi<ApiResponse<ThreadSummaryRow[]>>(`${BASE}/${weekId}/thread-summary-live`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },
```

- [ ] **Step 2: Verify the import of `ThreadSummaryRow`**

Check if `ThreadSummaryRow` is already imported at the top of `weeklyOrderService.ts`. If not, add it to the import from `@/types/thread`:

```typescript
import type { ..., ThreadSummaryRow } from '@/types/thread'
```

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`
Expected: Still shows errors in `history.vue` and `ThreadSummaryTable.vue` (fixed in next tasks), but no new errors in `weeklyOrderService.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/services/weeklyOrderService.ts
git commit -m "feat: add getThreadSummaryLive service method"
```

---

### Task 4: Update `ThreadSummaryTable.vue` columns

**Files:**
- Modify: `src/components/thread/weekly-order/ThreadSummaryTable.vue`

- [ ] **Step 1: Update column definitions and template slot**

Replace the entire `<script setup>` section and the `body-cell-shortage` template:

**Columns — replace line 54-60:**

```typescript
const columns: QTableColumn[] = [
  { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left', sortable: true },
  { name: 'total_cones', label: 'Cần đặt', field: 'total_cones', align: 'right', format: (v: number) => v.toLocaleString('vi-VN') },
  { name: 'reserved_cones', label: 'Đã có', field: 'reserved_cones', align: 'right', format: (v: number) => v.toLocaleString('vi-VN') },
  { name: 'pending_cones', label: 'Chờ về', field: 'pending_cones', align: 'right', format: (v: number) => v.toLocaleString('vi-VN') },
  { name: 'remaining', label: 'Chưa về kho', field: 'remaining', align: 'right', sortable: true },
]
```

**Template slot — replace `body-cell-shortage` (line 25-33):**

```html
      <template #body-cell-remaining="props">
        <q-td :props="props">
          <span
            :class="props.row.remaining > 0 ? 'text-negative text-weight-bold' : 'text-positive'"
          >
            {{ props.row.remaining.toLocaleString('vi-VN') }}
          </span>
        </q-td>
      </template>
```

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: Errors reduced — only `history.vue` remaining (it still uses old field names).

- [ ] **Step 3: Commit**

```bash
git add src/components/thread/weekly-order/ThreadSummaryTable.vue
git commit -m "refactor: rename ThreadSummaryTable columns to live data labels"
```

---

### Task 5: Update `history.vue` to use new endpoint

**Files:**
- Modify: `src/pages/thread/weekly-order/history.vue:459-508`

- [ ] **Step 1: Replace `loadThreadSummary` function**

Replace lines 459-508 with:

```typescript
async function loadThreadSummary(weekId: number) {
  if (expandedWeekId.value === weekId && threadSummary.value.length > 0) return

  expandedWeekId.value = weekId;
  threadSummaryLoading.value = true;
  threadSummary.value = [];

  try {
    const rows = await weeklyOrderService.getThreadSummaryLive(weekId)

    if (expandedWeekId.value !== weekId) return

    threadSummary.value = rows
  } catch {
    snackbar.error('Không thể tải chi tiết loại chỉ');
  } finally {
    threadSummaryLoading.value = false;
  }
}
```

Key changes:
- Replaces `Promise.all([getResults(), getByWeek()])` with single `getThreadSummaryLive(weekId)` call
- Removes all client-side computation (pendingByType Map, shortage formula)
- Backend returns data ready to display

- [ ] **Step 2: Remove unused import**

If `deliveryService` is only used in `loadThreadSummary`, check for other usages. If no other usage exists, remove the import:

```typescript
// REMOVE this line if no other usage:
import { deliveryService } from "@/services/deliveryService";
```

Check by searching the file for `deliveryService` — if it appears only in the import line, remove it.

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS — all type errors resolved.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS — no lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/thread/weekly-order/history.vue
git commit -m "feat: use live data endpoint for ThreadSummaryTable in order history"
```

---

### Task 6: Manual E2E verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev:all`

- [ ] **Step 2: Navigate to history page and verify**

1. Go to `/thread/weekly-order/history`
2. Expand a CONFIRMED week that has deliveries
3. Verify ThreadSummaryTable shows 4 columns: **Cần đặt**, **Đã có**, **Chờ về**, **Chưa về kho**
4. Verify "Đã có" reflects actual reserved cones in inventory
5. Verify "Chờ về" shows only PENDING deliveries quantity
6. Verify "Chưa về kho" = max(0, Cần đặt - Đã có)

- [ ] **Step 3: Cross-check with database**

```sql
-- Pick a week_id from the UI
-- Verify "Đã có" matches:
SELECT thread_type_id, COUNT(*) as reserved_cones
FROM thread_inventory
WHERE reserved_week_id = <week_id>
  AND status = 'RESERVED_FOR_ORDER'
GROUP BY thread_type_id;

-- Verify "Chờ về" matches:
SELECT thread_type_id, SUM(quantity_cones) as pending_cones
FROM thread_order_deliveries
WHERE week_id = <week_id>
  AND status = 'PENDING'
GROUP BY thread_type_id;
```

- [ ] **Step 4: Verify other pages unaffected**

1. Navigate to `/thread/weekly-order/deliveries` — should work as before
2. Navigate to `/thread/weekly-order` — should work as before
3. Check browser console for any 401/403/500 errors

- [ ] **Step 5: Final commit (if any adjustments)**

```bash
git add -A
git commit -m "chore: final adjustments after live data verification"
```
