# Weekly Order Excel — Xuất theo NCC (Tách File)

**Date:** 2026-04-21
**Scope:** Trang `weekly-order/[id].vue` — cho phép user chọn NCC (group theo chữ đầu) và xuất ra nhiều file Excel riêng biệt, mỗi file 1 NCC group.

## Mục tiêu

Khi đơn tuần có nhiều NCC khác nhau (ví dụ Coats, Moririn, Takubo), user thường cần gửi từng file riêng cho từng NCC. Hiện tại chỉ xuất được 1 file gộp → user phải tự copy/paste tách thủ công. Thay đổi này:

- Mở dialog cho user tick chọn NCC muốn xuất
- Mỗi NCC được tick → 1 file Excel riêng (filter data theo NCC)
- Filename: `{NCC}-{week_name}.xlsx`
- Format Excel giữ nguyên (header công văn + bảng + footer)

## Phạm vi thay đổi

| File | Thay đổi |
|------|----------|
| `src/composables/thread/useWeeklyOrderExport.ts` | Thêm helper `getSupplierGroups`, sửa `exportOrderResults` nhận thêm param `supplierGroup?` để filter + đổi filename |
| `src/components/thread/weekly-order/SupplierExportDialog.vue` | **Tạo mới** — dialog checkbox chọn NCC |
| `src/pages/thread/weekly-order/[id].vue` | Sửa `handleExportSummary` — check số group, mở dialog hoặc xuất luôn |

Không đụng:
- `src/pages/thread/weekly-order/index.vue` (giữ nguyên hành vi cũ — xuất 1 file gộp với tên `dat-hang-chi-{week_name}.xlsx`)
- `exportOrderHistory` (giữ nguyên)

## Flow tổng quan

```
User click "Xuất Excel" ở trang [id].vue
    ↓
Tính supplierGroups = unique chữ đầu của supplier_name
    ↓
┌─ supplierGroups.length <= 1 ───────┐    ┌─ supplierGroups.length >= 2 ─────┐
│ Xuất luôn 1 file:                   │    │ Mở SupplierExportDialog          │
│ {Coats}-{week_name}.xlsx            │    │ Mặc định tick hết NCC            │
└─────────────────────────────────────┘    │ User chọn NCC → Click "Xuất N"   │
                                            │ Loop tuần tự xuất N file:        │
                                            │ {Coats}-{week_name}.xlsx         │
                                            │ {Moririn}-{week_name}.xlsx       │
                                            └──────────────────────────────────┘
```

## API thay đổi

### `useWeeklyOrderExport.ts`

```typescript
// Helper mới — extract chữ đầu của supplier_name
function getSupplierGroup(supplierName: string | null | undefined): string {
  return (supplierName || '').trim().split(/\s+/)[0] || ''
}

// Helper mới (export) — list unique groups
export function getSupplierGroups(data: AggregatedRow[]): string[] {
  const groups = data
    .map((r) => getSupplierGroup(r.supplier_name))
    .filter(Boolean)
  return [...new Set(groups)]
}

// Sửa signature — thêm param optional
export async function exportOrderResults(
  data: AggregatedRow[],
  week: ExportWeekMeta,
  supplierGroup?: string,
): Promise<void>
```

**Behavior khi `supplierGroup` truyền vào:**
- Filter `data`: chỉ giữ row có `getSupplierGroup(r.supplier_name) === supplierGroup`
- Sau filter, nếu `data.length === 0` → snackbar warning + return
- Filename: `{sanitize(supplierGroup)}-{week.week_name || 'tuan'}.xlsx`
- Dòng "Kính gửi" tự động đúng vì `buildKinhGui` chạy trên data đã filter (sẽ ra `Kính gửi: Công ty Coats`)

**Behavior khi không truyền `supplierGroup`** (backward compat cho trang index):
- Giữ nguyên 100% như hiện tại
- Filename: `dat-hang-chi-{week.week_name || 'tuan'}.xlsx`

### `SupplierExportDialog.vue`

Component mới tại `src/components/thread/weekly-order/SupplierExportDialog.vue`.

**Props:**
```typescript
defineProps<{
  modelValue: boolean        // v-model show/hide
  supplierGroups: string[]   // ['Coats', 'Moririn', 'Takubo']
}>()
```

**Emits:**
```typescript
defineEmits<{
  'update:modelValue': [boolean]
  confirm: [selectedGroups: string[]]   // List NCC user đã tick
}>()
```

**UI:**
- `q-dialog` với `q-card` (max-width 480px)
- Title: "Chọn NCC để xuất Excel"
- Description nhỏ: "Mỗi NCC sẽ được xuất thành 1 file Excel riêng"
- List `q-checkbox` — mỗi NCC 1 dòng, mặc định tick hết khi mở dialog (watch `modelValue`)
- Counter: "Đã chọn: {N}/{Total} NCC"
- Footer:
  - **AppButton "Hủy"** (flat) → emit `update:modelValue: false`
  - **AppButton "Xuất {N} file"** (primary) — disabled khi `selectedGroups.length === 0`
    - Click → emit `confirm` với `selectedGroups` → emit `update:modelValue: false`
    - Label động: "Xuất 3 file" / "Xuất 1 file"

**State internal:**
```typescript
const selectedGroups = ref<string[]>([])
watch(() => props.modelValue, (v) => {
  if (v) selectedGroups.value = [...props.supplierGroups]  // Reset tick hết
})
```

### `[id].vue` — `handleExportSummary`

```typescript
const showSupplierDialog = ref(false)

const supplierGroups = computed(() => {
  if (!calculationResults.value) return []
  return getSupplierGroups(calculationResults.value.summary_data)
})

const handleExportSummary = () => {
  if (!calculationResults.value || !week.value) return
  if (supplierGroups.value.length <= 1) {
    // 0 hoặc 1 NCC → xuất luôn (nếu 0 thì exportOrderResults sẽ warning)
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
  for (const group of groups) {
    await exportOrderResults(
      calculationResults.value.summary_data,
      weekMeta,
      group,
    )
  }
}
```

Template thêm:
```vue
<SupplierExportDialog
  v-model="showSupplierDialog"
  :supplier-groups="supplierGroups"
  @confirm="handleSupplierConfirm"
/>
```

## Filename sanitization

Tên NCC có thể chứa ký tự không hợp lệ trong filename Windows/Linux. Sanitize:

```typescript
function sanitizeFilename(name: string): string {
  return name.replace(/[\/\\:*?"<>|]/g, '_').trim() || 'NCC'
}
```

Áp dụng trong `exportOrderResults` khi build filename.

## Edge cases

| Case | Xử lý |
|------|-------|
| `supplierGroups.length === 0` (data rỗng hoặc supplier_name null hết) | `exportOrderResults` warning "Chưa có dữ liệu" + return |
| `supplierGroups.length === 1` | Bỏ qua dialog, xuất luôn 1 file `{NCC}-{week_name}.xlsx` |
| User tick 0 NCC | Nút "Xuất" disabled |
| Filter ra 0 row cho 1 group | Skip group đó (warning trong `exportOrderResults`), tiếp tục các group khác |
| NCC chứa `/`, `\`, `:` etc | Sanitize → `_` |
| Loop xuất nhiều file | Loop tuần tự `for...of await` — tránh browser block đồng thời |
| Trang `index.vue` xuất | Không truyền `supplierGroup` → filename cũ + data đầy đủ (giữ nguyên hành vi) |
| `week_name` null/empty | Fallback `'tuan'` (đã có sẵn trong code hiện tại) |

## Test plan

- [ ] Tuần chỉ có 1 NCC group (vd: chỉ "Coats Epic" + "Coats Astra") → click Xuất → tải luôn 1 file `Coats-{week_name}.xlsx`, KHÔNG mở dialog
- [ ] Tuần có 3 NCC groups (Coats / Moririn / Takubo) → click Xuất → mở dialog với 3 checkbox đã tick hết, counter "3/3"
- [ ] Bỏ tick 1 NCC → counter cập nhật "2/3", label nút "Xuất 2 file"
- [ ] Bỏ tick hết → nút "Xuất" disabled
- [ ] Tick lại → enable
- [ ] Click "Xuất 2 file" → tải 2 file riêng, đúng tên, đúng data filter
- [ ] Mỗi file: dòng "Kính gửi" chỉ ghi NCC tương ứng (không có dấu `/`)
- [ ] Mỗi file: bảng chi tiết chỉ chứa row của NCC đó
- [ ] Header công văn + footer chữ ký giữ nguyên format
- [ ] Click "Hủy" → đóng dialog không xuất gì
- [ ] Mở dialog lần 2 sau khi đã bỏ tick lần 1 → reset về tick hết
- [ ] Trang `index.vue` (chưa lưu) → vẫn xuất 1 file gộp như cũ, tên `dat-hang-chi-{week_name}.xlsx`
- [ ] Type-check + lint pass

## Out of scope

- Không làm tính năng tương tự cho `index.vue` (theo yêu cầu user — chỉ làm `[id].vue`)
- Không đổi `exportOrderHistory`
- Không thêm preview trước khi xuất
- Không nén ZIP — tải file riêng lẻ
- Không thêm option "tách theo NCC" vs "gộp 1 file" — luôn tách khi user qua dialog
- Không filter theo các tiêu chí khác (Tex, màu, etc.) — chỉ NCC
