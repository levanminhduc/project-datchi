# Weekly Order Excel — Xuất theo NCC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép user chọn NCC qua dialog ở trang `weekly-order/[id].vue` và xuất mỗi NCC thành 1 file Excel riêng (filename `{NCC}-{week_name}.xlsx`), data đã filter theo NCC.

**Architecture:** Thêm helper `getSupplierGroups` + param optional `supplierGroup` vào `exportOrderResults` (filter data + đổi filename). Tạo mới `SupplierExportDialog.vue` dùng pattern `AppDialog` + `AppCheckbox`. Trang `[id].vue` tính số NCC groups: ≤1 xuất luôn, ≥2 mở dialog rồi loop tuần tự xuất từng file.

**Tech Stack:** Vue 3 Composition API + TypeScript, Quasar 2 (`q-dialog` via `AppDialog`), ExcelJS (dynamic import đã có), `date-fns` (đã import).

**Spec reference:** `docs/superpowers/specs/2026-04-21-weekly-order-excel-export-by-supplier-design.md`

---

## File Structure

| File | Loại | Trách nhiệm |
|------|------|-------------|
| `src/composables/thread/useWeeklyOrderExport.ts` | Modify | Thêm `getSupplierGroup` (internal), `getSupplierGroups` (export), `sanitizeFilename`; sửa `exportOrderResults` nhận param `supplierGroup?` |
| `src/components/thread/weekly-order/SupplierExportDialog.vue` | Create | Dialog checkbox chọn NCC, reset tick hết khi mở, disabled nút Xuất nếu 0 tick |
| `src/pages/thread/weekly-order/[id].vue` | Modify | Import dialog + `getSupplierGroups`; `supplierGroups` computed; `handleExportSummary` rẽ nhánh 1 NCC vs ≥2 NCC; `exportFilteredOrders` loop tuần tự |

**Không đụng:** `src/pages/thread/weekly-order/index.vue`, `exportOrderHistory`, các Excel export khác.

---

## Task 1: Helpers `getSupplierGroup`, `getSupplierGroups`, `sanitizeFilename` trong `useWeeklyOrderExport.ts`

**Files:**
- Modify: `src/composables/thread/useWeeklyOrderExport.ts` (thêm helpers trước `COLUMN_DEFS`)

**Mục tiêu:** Tách logic "lấy chữ đầu NCC" khỏi `buildKinhGui` thành helper riêng dùng được từ ngoài; thêm helper sanitize filename.

- [ ] **Step 1: Đọc file hiện tại trước khi sửa**

Run: đọc `src/composables/thread/useWeeklyOrderExport.ts` để xác nhận vị trí `buildKinhGui` (hiện tại đang nằm trước `COLUMN_DEFS`) và structure file.

- [ ] **Step 2: Thêm 3 helpers sau `downloadWorkbook` và trước `buildKinhGui`**

Edit file `src/composables/thread/useWeeklyOrderExport.ts` — chèn vào vị trí sau function `downloadWorkbook`:

```typescript
function getSupplierGroup(supplierName: string | null | undefined): string {
  return (supplierName || '').trim().split(/\s+/)[0] || ''
}

export function getSupplierGroups(data: AggregatedRow[]): string[] {
  const groups = data
    .map((r) => getSupplierGroup(r.supplier_name))
    .filter(Boolean)
  return [...new Set(groups)]
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\/\\:*?"<>|]/g, '_').trim() || 'NCC'
}
```

- [ ] **Step 3: Refactor `buildKinhGui` để dùng `getSupplierGroup`**

Thay thế hàm `buildKinhGui` hiện có bằng:

```typescript
function buildKinhGui(data: AggregatedRow[]): string {
  const firstWords = data.map((r) => getSupplierGroup(r.supplier_name)).filter(Boolean)
  const unique = [...new Set(firstWords)]
  return unique.length > 0
    ? `Kính gửi: Công ty ${unique.join(' / ')}`
    : 'Kính gửi: Quý công ty'
}
```

- [ ] **Step 4: Chạy type-check**

Run: `npm run type-check`
Expected: PASS (không có TS error mới).

- [ ] **Step 5: Commit**

```bash
git add src/composables/thread/useWeeklyOrderExport.ts
git commit -m "refactor(weekly-order): tách getSupplierGroup + thêm getSupplierGroups/sanitizeFilename"
```

---

## Task 2: Sửa `exportOrderResults` nhận param `supplierGroup?`

**Files:**
- Modify: `src/composables/thread/useWeeklyOrderExport.ts` (sửa signature + thân hàm `exportOrderResults`)

**Mục tiêu:** Khi truyền `supplierGroup`, filter data + đổi filename. Không truyền → giữ nguyên 100% hành vi cũ.

- [ ] **Step 1: Đổi signature `exportOrderResults`**

Tại `src/composables/thread/useWeeklyOrderExport.ts`, đổi dòng:

```typescript
export async function exportOrderResults(
  data: AggregatedRow[],
  week: ExportWeekMeta,
) {
```

Thành:

```typescript
export async function exportOrderResults(
  data: AggregatedRow[],
  week: ExportWeekMeta,
  supplierGroup?: string,
) {
```

- [ ] **Step 2: Filter data theo `supplierGroup` ngay đầu hàm (trước check length)**

Thay khối đầu hàm:

```typescript
  const snackbar = useSnackbar()

  if (data.length === 0) {
    snackbar.warning('Chưa có dữ liệu để xuất')
    return
  }
```

Thành:

```typescript
  const snackbar = useSnackbar()

  const filteredData = supplierGroup
    ? data.filter((r) => getSupplierGroup(r.supplier_name) === supplierGroup)
    : data

  if (filteredData.length === 0) {
    snackbar.warning(
      supplierGroup
        ? `Không có dữ liệu cho NCC ${supplierGroup}`
        : 'Chưa có dữ liệu để xuất',
    )
    return
  }
```

- [ ] **Step 3: Dùng `filteredData` thay `data` trong phần còn lại của hàm**

Thay tất cả tham chiếu `data` bên trong `exportOrderResults` thành `filteredData`:
- `renderDocHeader(worksheet, week, data)` → `renderDocHeader(worksheet, week, filteredData)`
- `data.forEach((r) => {` → `filteredData.forEach((r) => {`
- `const lastDataRow = TABLE_HEADER_ROW + data.length` → `const lastDataRow = TABLE_HEADER_ROW + filteredData.length`

**Không đụng** các tham chiếu `data` nằm ngoài hàm `exportOrderResults`.

- [ ] **Step 4: Đổi filename theo `supplierGroup`**

Thay dòng:

```typescript
    await downloadWorkbook(
      workbook,
      `dat-hang-chi-${week.week_name || 'tuan'}.xlsx`,
    )
```

Thành:

```typescript
    const baseName = week.week_name || 'tuan'
    const filename = supplierGroup
      ? `${sanitizeFilename(supplierGroup)}-${baseName}.xlsx`
      : `dat-hang-chi-${baseName}.xlsx`
    await downloadWorkbook(workbook, filename)
```

- [ ] **Step 5: Chạy type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/composables/thread/useWeeklyOrderExport.ts
git commit -m "feat(weekly-order): exportOrderResults hỗ trợ filter theo NCC + đổi filename"
```

---

## Task 3: Tạo component `SupplierExportDialog.vue`

**Files:**
- Create: `src/components/thread/weekly-order/SupplierExportDialog.vue`

**Mục tiêu:** Dialog cho user tick NCC muốn xuất. Mặc định tick hết. Nút "Xuất {N} file" disabled khi 0 tick.

- [ ] **Step 1: Tạo file dialog**

Tạo mới file `src/components/thread/weekly-order/SupplierExportDialog.vue` với nội dung:

```vue
<template>
  <AppDialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      Chọn NCC để xuất Excel
    </template>

    <div style="min-width: min(420px, 80vw)">
      <div class="text-caption text-grey-7 q-mb-md">
        Mỗi NCC sẽ được xuất thành 1 file Excel riêng
      </div>

      <div class="column q-gutter-xs">
        <AppCheckbox
          v-for="group in supplierGroups"
          :key="group"
          :model-value="selected.includes(group)"
          :label="group"
          dense
          @update:model-value="toggle(group, $event)"
        />
      </div>

      <div class="text-caption text-grey-7 q-mt-md">
        Đã chọn: {{ selected.length }}/{{ supplierGroups.length }} NCC
      </div>
    </div>

    <template #actions>
      <AppButton
        flat
        label="Hủy"
        @click="emit('update:modelValue', false)"
      />
      <AppButton
        color="primary"
        :label="`Xuất ${selected.length} file`"
        :disable="selected.length === 0"
        @click="handleConfirm"
      />
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppDialog from '@/components/ui/dialogs/AppDialog.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import AppCheckbox from '@/components/ui/inputs/AppCheckbox.vue'

const props = defineProps<{
  modelValue: boolean
  supplierGroups: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [selectedGroups: string[]]
}>()

const selected = ref<string[]>([])

watch(
  () => props.modelValue,
  (v) => {
    if (v) selected.value = [...props.supplierGroups]
  },
)

function toggle(group: string, checked: boolean | any[] | null) {
  if (checked) {
    if (!selected.value.includes(group)) selected.value = [...selected.value, group]
  } else {
    selected.value = selected.value.filter((g) => g !== group)
  }
}

function handleConfirm() {
  if (selected.value.length === 0) return
  emit('confirm', [...selected.value])
  emit('update:modelValue', false)
}
</script>
```

- [ ] **Step 2: Chạy type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Chạy lint**

Run: `npm run lint`
Expected: PASS (không lỗi mới).

- [ ] **Step 4: Commit**

```bash
git add src/components/thread/weekly-order/SupplierExportDialog.vue
git commit -m "feat(weekly-order): thêm SupplierExportDialog chọn NCC xuất Excel"
```

---

## Task 4: Tích hợp dialog vào trang `[id].vue`

**Files:**
- Modify: `src/pages/thread/weekly-order/[id].vue`

**Mục tiêu:** `handleExportSummary` rẽ nhánh theo số supplier groups: ≤1 xuất luôn, ≥2 mở dialog. Sau khi user confirm, loop tuần tự xuất từng file.

- [ ] **Step 1: Thêm imports**

Tìm dòng `import { exportOrderResults } from '@/composables/thread/useWeeklyOrderExport'` (dòng ~668) và đổi thành:

```typescript
import { exportOrderResults, getSupplierGroups } from '@/composables/thread/useWeeklyOrderExport'
import SupplierExportDialog from '@/components/thread/weekly-order/SupplierExportDialog.vue'
```

- [ ] **Step 2: Thêm state + computed cho dialog**

Tìm khối `const handleExportSummary = () => {` (dòng ~921). Thêm NGAY TRƯỚC khối này:

```typescript
const showSupplierDialog = ref(false)

const supplierGroups = computed(() => {
  if (!calculationResults.value) return []
  return getSupplierGroups(calculationResults.value.summary_data)
})
```

- [ ] **Step 3: Rewrite `handleExportSummary` + thêm helpers mới**

Thay thế toàn bộ khối:

```typescript
const handleExportSummary = () => {
  if (!calculationResults.value || !week.value) return
  exportOrderResults(calculationResults.value.summary_data, {
    id: week.value.id,
    week_name: week.value.week_name,
    created_by: week.value.created_by,
    leader_signed_by_name: week.value.leader_signed_by_name,
  })
}
```

Bằng:

```typescript
const handleExportSummary = () => {
  if (!calculationResults.value || !week.value) return
  if (supplierGroups.value.length <= 1) {
    exportFilteredOrders(supplierGroups.value)
  } else {
    showSupplierDialog.value = true
  }
}

const handleSupplierConfirm = (selected: string[]) => {
  exportFilteredOrders(selected)
}

const exportFilteredOrders = async (groups: string[]) => {
  if (!calculationResults.value || !week.value) return
  const weekMeta = {
    id: week.value.id,
    week_name: week.value.week_name,
    created_by: week.value.created_by,
    leader_signed_by_name: week.value.leader_signed_by_name,
  }
  if (groups.length === 0) {
    await exportOrderResults(calculationResults.value.summary_data, weekMeta)
    return
  }
  for (const group of groups) {
    await exportOrderResults(
      calculationResults.value.summary_data,
      weekMeta,
      group,
    )
  }
}
```

- [ ] **Step 4: Thêm dialog vào template**

Tìm dòng `@click="handleExportSummary"` (dòng ~476) để xác định section template. Ở cuối template (ngay trước `</template>` đóng file), thêm:

```vue
    <SupplierExportDialog
      v-model="showSupplierDialog"
      :supplier-groups="supplierGroups"
      @confirm="handleSupplierConfirm"
    />
```

**Chú ý:** Tìm vị trí đặt dialog theo pattern các dialog khác đang có trong file (ví dụ `LoanDialog`, `ManualReturnDialog`). Đặt `SupplierExportDialog` cùng nhóm với chúng.

- [ ] **Step 5: Chạy type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 6: Chạy lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Chạy build**

Run: `npm run build`
Expected: PASS (build success, không có new error).

- [ ] **Step 8: Commit**

```bash
git add src/pages/thread/weekly-order/[id].vue
git commit -m "feat(weekly-order): tích hợp SupplierExportDialog vào trang chi tiết"
```

---

## Task 5: Manual testing & final verification

**Files:** Không sửa code. Chỉ verify.

- [ ] **Step 1: Start dev server**

Run: `npm run dev:all`

- [ ] **Step 2: Test case 1 — Tuần có 1 NCC group duy nhất**

Thao tác:
1. Vào `/thread/weekly-order/<id>` của tuần mà mọi row chỉ thuộc 1 NCC (ví dụ chỉ có "Coats Epic" và "Coats Astra")
2. Mở tab "Kết quả tính toán"
3. Click nút "Xuất Excel"

Expected:
- KHÔNG mở dialog
- Tải về 1 file tên `Coats-{week_name}.xlsx`
- Mở file: dòng "Kính gửi: Công ty Coats", bảng chỉ có row của Coats

- [ ] **Step 3: Test case 2 — Tuần có ≥2 NCC groups**

Thao tác:
1. Vào tuần có ≥2 NCC (ví dụ Coats + Moririn + Takubo)
2. Click "Xuất Excel"

Expected:
- Dialog mở ra với title "Chọn NCC để xuất Excel"
- 3 checkbox (Coats, Moririn, Takubo) — tất cả đã tick
- Counter hiển thị "Đã chọn: 3/3 NCC"
- Nút label "Xuất 3 file"

- [ ] **Step 4: Test case 3 — Bỏ tick 1 NCC**

Thao tác: Bỏ tick Takubo.

Expected:
- Counter cập nhật "Đã chọn: 2/3 NCC"
- Nút đổi label "Xuất 2 file"

- [ ] **Step 5: Test case 4 — Bỏ tick hết**

Thao tác: Bỏ tick cả Coats + Moririn.

Expected:
- Counter "0/3 NCC"
- Nút "Xuất 0 file" bị disabled (không click được)

- [ ] **Step 6: Test case 5 — Xuất 2 file**

Thao tác: Tick lại Coats + Moririn, click "Xuất 2 file".

Expected:
- Tải về 2 file: `Coats-{week_name}.xlsx` và `Moririn-{week_name}.xlsx`
- File Coats: "Kính gửi: Công ty Coats", bảng chỉ row Coats
- File Moririn: "Kính gửi: Công ty Moririn", bảng chỉ row Moririn
- Header công văn (CỘNG HÒA, ĐƠN ĐẶT HÀNG, Số đơn) + footer chữ ký đúng format

- [ ] **Step 7: Test case 6 — Hủy dialog**

Thao tác: Mở dialog, click "Hủy".

Expected: Dialog đóng, không tải file nào.

- [ ] **Step 8: Test case 7 — Reset state khi mở dialog lần 2**

Thao tác: Mở dialog, bỏ tick 2 NCC, click Hủy. Sau đó click "Xuất Excel" lại.

Expected: Dialog mở lại với tất cả NCC đều tick (reset về mặc định).

- [ ] **Step 9: Test case 8 — Trang `index.vue` (regression)**

Thao tác: Vào trang `/thread/weekly-order` (tạo đơn), tính toán xong, click "Xuất Excel".

Expected:
- KHÔNG mở dialog (vì trang index không đổi)
- Tải 1 file tên `dat-hang-chi-{week_name}.xlsx` (tên cũ)
- File chứa toàn bộ NCC (như cũ)

- [ ] **Step 10: Cleanup & final status**

Run: `git status`
Expected: clean (tất cả đã commit).

Run: `git log --oneline -5`
Expected: thấy 4 commit từ Task 1-4.

---

## Self-Review Checklist (đã verify khi viết plan)

- **Spec coverage:**
  - Dialog checkbox NCC → Task 3 + Task 4
  - Filter data theo NCC → Task 2
  - Filename `{NCC}-{week_name}.xlsx` → Task 2
  - Sanitize filename → Task 1 (`sanitizeFilename`)
  - 1 NCC → xuất luôn, ≥2 NCC → dialog → Task 4
  - Reset tick hết khi mở dialog → Task 3 (watch `modelValue`)
  - Disabled nút khi 0 tick → Task 3
  - Loop tuần tự → Task 4 (`for...of await`)
  - Edge case data rỗng sau filter → Task 2 (snackbar warning)
  - Trang `index.vue` giữ nguyên → Không đụng file (verified ở Task 5 step 9)

- **Placeholder scan:** Không có TBD/TODO/vague text.
- **Type consistency:**
  - `getSupplierGroups(data: AggregatedRow[]): string[]` — dùng nhất quán ở Task 1 và Task 4
  - `exportOrderResults(data, week, supplierGroup?)` — signature mới consistent Task 2 ↔ Task 4
  - Props `SupplierExportDialog`: `modelValue: boolean`, `supplierGroups: string[]`, emit `confirm: [string[]]` — consistent Task 3 ↔ Task 4
