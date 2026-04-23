# Issue V2 Step 3 — Realtime Quantity Clamp Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ô nhập số lượng Full/Lẻ ở Bước 3 (trang `/thread/issues/v2`) clamp giá trị tức thì khi user gõ — không cho phép vượt `max` (tồn kho), không cho số âm, không cho số thập phân.

**Architecture:** Đổi `:model-value` (one-way) → `v-model.number` (two-way) trên 2 ô `AppInput` Full/Lẻ. Clamp giá trị trong `handleInputChange` bằng `format.between()` của Quasar + `Math.floor()`. Vue reactivity tự đồng bộ DOM với state đã clamp.

**Tech Stack:** Vue 3 + Quasar 2 + TypeScript. Tận dụng util `format.between` của Quasar (đã có sẵn, không cần install).

**Spec reference:** `docs/superpowers/specs/2026-04-23-issue-v2-qty-realtime-clamp-design.md`

---

## File Structure

- **Modify:** `src/pages/thread/issues/v2/index.vue`
  - Thêm import `format` từ `quasar`.
  - Sửa signature + body của `handleInputChange` (dòng 513-522).
  - Sửa template 2 ô input Full/Lẻ (dòng 1423-1450).

Không tạo file mới. Không đụng backend/DB/composables.

---

## Task 1: Import `format.between` từ Quasar

**Files:**
- Modify: `src/pages/thread/issues/v2/index.vue` (đầu `<script setup>`, gần các import khác)

- [ ] **Step 1: Thêm import `format` từ quasar**

Hiện tại file đã có `import type { QTableColumn, QTableProps } from 'quasar'` ở dòng 25. Thêm một dòng import value mới (không gộp vào `import type` vì đây là value import).

Tìm đoạn sau ở đầu `<script setup>` (khoảng dòng 25):
```ts
import type { QTableColumn, QTableProps } from 'quasar'
```

Thêm ngay bên dưới:
```ts
import { format as quasarFormat } from 'quasar'

const { between } = quasarFormat
```

**Lý do đặt alias `quasarFormat`:** tránh nguy cơ trùng tên với biến `format` khác nếu có. `between` được destructure ra scope module.

- [ ] **Step 2: Verify type-check**

Run: `npm run type-check`
Expected: không có lỗi TS mới.

- [ ] **Step 3: Commit**

```bash
git add src/pages/thread/issues/v2/index.vue
git commit -m "refactor(issue-v2): import quasar format.between for qty clamp"
```

---

## Task 2: Sửa `handleInputChange` — clamp dùng `between` + `Math.floor`

**Files:**
- Modify: `src/pages/thread/issues/v2/index.vue:513-522`

- [ ] **Step 1: Thay thế function `handleInputChange`**

Tìm đoạn code hiện tại (dòng 513-522):
```ts
function handleInputChange(colorId: number, threadTypeId: number, field: 'full' | 'partial', value: number, max: number, threadColorId?: number | null) {
  const key = ttKey(colorId, threadTypeId, threadColorId)
  const input = lineInputs.value[key]
  if (!input) return

  const clampedValue = Math.min(Math.max(0, value), max)
  input[field] = clampedValue

  handleQuantityChange(colorId, threadTypeId, threadColorId)
}
```

Thay bằng:
```ts
function handleInputChange(
  colorId: number,
  threadTypeId: number,
  field: 'full' | 'partial',
  max: number,
  threadColorId?: number | null,
) {
  const key = ttKey(colorId, threadTypeId, threadColorId)
  const input = lineInputs.value[key]
  if (!input) return

  const raw = Math.floor(Number(input[field]) || 0)
  input[field] = between(raw, 0, max)

  handleQuantityChange(colorId, threadTypeId, threadColorId)
}
```

**Khác biệt so với bản cũ:**
- Bỏ tham số `value: number` (vì dùng `v-model` two-way, giá trị đã trong `input[field]`).
- `Math.floor()` để chặn số thập phân.
- `between(raw, 0, max)` thay cho `Math.min(Math.max(0, value), max)` — tương đương về mặt logic, ngắn gọn và dùng util chính thức của Quasar.

- [ ] **Step 2: Verify type-check báo lỗi ở nơi gọi `handleInputChange`**

Run: `npm run type-check`
Expected: **LỖI** tại 2 chỗ gọi `handleInputChange` trong template (dòng ~1433 và ~1448) vì signature thay đổi (bỏ param `value`). Đây là dấu hiệu đúng — Task 3 sẽ sửa.

- [ ] **Step 3: (Chưa commit) — đợi Task 3 sửa template xong mới commit cùng**

---

## Task 3: Sửa template 2 ô input Full/Lẻ — đổi sang `v-model.number`

**Files:**
- Modify: `src/pages/thread/issues/v2/index.vue:1423-1450`

- [ ] **Step 1: Thay thế template cell Full (dòng 1423-1436)**

Tìm đoạn hiện tại:
```vue
<template #body-cell-issue_full="props">
  <q-td :props="props">
    <AppInput
      :model-value="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.full || null"
      type="number"
      dense
      :min="0"
      :max="props.row.stock_available_full"
      style="width: 90px"
      :rules="[(v: any) => !v || Number(v) <= props.row.stock_available_full || `Tối đa ${props.row.stock_available_full}`]"
      @update:model-value="(v) => handleInputChange(props.row.color_id, props.row.thread_type_id, 'full', Number(v) || 0, props.row.stock_available_full, props.row.thread_color_id)"
    />
  </q-td>
</template>
```

Thay bằng:
```vue
<template #body-cell-issue_full="props">
  <q-td :props="props">
    <AppInput
      v-model.number="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)].full"
      type="number"
      dense
      :min="0"
      :max="props.row.stock_available_full"
      :step="1"
      style="width: 90px"
      @update:model-value="() => handleInputChange(props.row.color_id, props.row.thread_type_id, 'full', props.row.stock_available_full, props.row.thread_color_id)"
    />
  </q-td>
</template>
```

- [ ] **Step 2: Thay thế template cell Lẻ (dòng 1438-1451)**

Tìm đoạn hiện tại:
```vue
<template #body-cell-issue_partial="props">
  <q-td :props="props">
    <AppInput
      :model-value="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)]?.partial || null"
      type="number"
      dense
      :min="0"
      :max="props.row.stock_available_partial"
      style="width: 90px"
      :rules="[(v: any) => !v || Number(v) <= props.row.stock_available_partial || `Tối đa ${props.row.stock_available_partial}`]"
      @update:model-value="(v) => handleInputChange(props.row.color_id, props.row.thread_type_id, 'partial', Number(v) || 0, props.row.stock_available_partial, props.row.thread_color_id)"
    />
  </q-td>
</template>
```

Thay bằng:
```vue
<template #body-cell-issue_partial="props">
  <q-td :props="props">
    <AppInput
      v-model.number="lineInputs[ttKey(props.row.color_id, props.row.thread_type_id, props.row.thread_color_id)].partial"
      type="number"
      dense
      :min="0"
      :max="props.row.stock_available_partial"
      :step="1"
      style="width: 90px"
      @update:model-value="() => handleInputChange(props.row.color_id, props.row.thread_type_id, 'partial', props.row.stock_available_partial, props.row.thread_color_id)"
    />
  </q-td>
</template>
```

**Tóm tắt thay đổi:**
- `:model-value="...?.full || null"` → `v-model.number="....full"` (two-way, bỏ optional chaining vì `lineInputs[key]` luôn tồn tại khi row render — đã được init ở dòng 419-421).
- Thêm `:step="1"` (UI spinner nhảy 1 đơn vị, chặn thập phân ở nút tăng/giảm).
- Bỏ `:rules=[...]` (giá trị không bao giờ vượt max nữa).
- `@update:model-value` không còn truyền `Number(v)` (v-model.number đã xử lý); không truyền `value` vào `handleInputChange` (đã lấy từ state).

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`
Expected: **PASS** (không còn lỗi — Task 2 + Task 3 hoàn chỉnh).

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS (hoặc auto-fix).

- [ ] **Step 5: Commit Task 2 + Task 3 cùng nhau**

```bash
git add src/pages/thread/issues/v2/index.vue
git commit -m "feat(issue-v2): clamp qty input realtime in Step 3"
```

---

## Task 4: Manual test

**Files:** (test browser thủ công — không có automated test)

- [ ] **Step 1: Chạy dev server**

Run: `npm run dev:all`
Expected: frontend `http://localhost:5173`, backend `http://localhost:3000`.

- [ ] **Step 2: Truy cập trang Issue V2**

Mở browser → `/thread/issues/v2`. Đăng nhập nếu cần.

- [ ] **Step 3: Setup để Step 3 hiện bảng**

Chọn đủ: Phòng ban → Kho → PO → Style → Sub-Art (nếu có) → Màu. Đợi bảng "Bước 3" xuất hiện với các dòng chỉ.

- [ ] **Step 4: Test clamp max (Full column)**

Chọn 1 dòng có `stock_available_full = 50` (hoặc bất kỳ số nào bạn thấy).
- Click ô Full, gõ `999`.
- Expected: **Ngay khi gõ xong, ô input tự hiển thị `50`** (không phải `999`).

- [ ] **Step 5: Test clamp max (Lẻ column)**

Tương tự Step 4 nhưng ở ô "Lẻ". Gõ số lớn hơn `stock_available_partial`.
- Expected: Clamp về `stock_available_partial`.

- [ ] **Step 6: Test số âm**

Ô Full gõ `-5`.
- Expected: Hiển thị `0`.

- [ ] **Step 7: Test số thập phân**

Ô Full gõ `50.5`.
- Expected: Hiển thị `50` (floor).

- [ ] **Step 8: Test paste giá trị lớn**

Copy chuỗi `9999` từ clipboard → paste vào ô Full.
- Expected: Clamp về `max`.

- [ ] **Step 9: Test nút spinner tăng/giảm**

Click nút mũi tên lên của ô số (native spinner) liên tục cho tới khi vượt max.
- Expected: Dừng lại ở `max`, không vượt.

- [ ] **Step 10: Verify validate stock/quota vẫn chạy**

Gõ giá trị hợp lệ (ví dụ `1`). Đợi 300ms.
- Expected: Cột "Trạng thái" hiển thị cảnh báo quota/borrow nếu áp dụng. Debounced validate vẫn hoạt động.

- [ ] **Step 11: Verify nút "Thêm vào phiếu" vẫn hoạt động**

Với giá trị hợp lệ, bấm "Thêm".
- Expected: Dòng được thêm vào phiếu xuất thành công.

- [ ] **Step 12: Edge — Max = 0**

Tìm dòng có `stock_available_full = 0` (nếu có). Thử gõ bất kỳ số nào.
- Expected: Ô luôn hiển thị `0`.

- [ ] **Step 13: Nếu có bug, quay lại Task 2/3 để sửa**

Nếu không có bug → tiếp Task 5.

---

## Task 5: Final verification + commit

**Files:** n/a

- [ ] **Step 1: Run full checks**

```bash
npm run lint
npm run type-check
```

Expected: Cả 2 pass.

- [ ] **Step 2: Review diff cuối**

```bash
git log --oneline -5
git diff HEAD~2 -- src/pages/thread/issues/v2/index.vue
```

Expected thấy 2 commits:
1. `refactor(issue-v2): import quasar format.between for qty clamp`
2. `feat(issue-v2): clamp qty input realtime in Step 3`

- [ ] **Step 3: Nếu đang ở worktree, sẵn sàng merge**

Kiểm tra branch hiện tại bằng `git status`. Quyết định strategy merge theo flow thông thường (PR hoặc merge vào main).

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Validate realtime (không chờ blur/submit): Task 3 (v-model two-way).
- ✅ Clamp max: Task 2 (`between(raw, 0, max)`).
- ✅ Chặn số âm: Task 2 (`between(..., 0, max)`).
- ✅ Chặn thập phân: Task 2 (`Math.floor`) + Task 3 (`:step="1"`).
- ✅ Nút spinner tuân max: Task 3 giữ `:min` `:max`.
- ✅ State-DOM đồng bộ: Task 3 (v-model two-way).
- ✅ Test các edge case: Task 4.

**Placeholder scan:** Không có "TBD", "TODO", "add appropriate...", "handle edge cases". Tất cả code steps có code block đầy đủ.

**Type consistency:** Signature `handleInputChange` ở Task 2 (`colorId, threadTypeId, field, max, threadColorId?`) khớp với call site ở Task 3.
