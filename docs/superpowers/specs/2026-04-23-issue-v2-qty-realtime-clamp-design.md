# Validate Realtime Số Lượng Xuất (Bước 3 — Issue V2)

**Date:** 2026-04-23
**File liên quan:** `src/pages/thread/issues/v2/index.vue`

## 1. Bối cảnh

Trang "Bước 3: Nhập Số Lượng Xuất" (`src/pages/thread/issues/v2/index.vue`) có 2 ô input cho mỗi dòng chỉ: **Full** và **Lẻ**.

Hiện trạng:
- Template dùng `:model-value` (one-way bind) → khi user gõ giá trị vượt `max`, state được clamp về max qua `handleInputChange` (dòng 513-522), nhưng DOM input vẫn hiển thị giá trị thô user gõ.
- Có `:rules` hiển thị message `"Tối đa X"` nhưng không chặn giá trị.
- Validate tồn kho/quota chạy qua `debouncedValidate` (300ms).

Hệ quả: User gõ `999` khi tồn kho chỉ còn `50` — ô input vẫn hiển thị `999`, gây nhầm lẫn và cảm giác "validate lỏng".

## 2. Yêu cầu

Validate tức thì khi gõ:

- Gõ số > `max` → input tự động hiển thị `max` ngay (không chờ blur, không chờ submit).
- Gõ số âm → về `0`.
- Paste giá trị lớn → clamp về `max`.
- Nút tăng/giảm (spinner của `<input type="number">`) vẫn tuân theo `min/max` (sẵn có).
- State và DOM luôn đồng bộ.
- Số lượng chỉ **nguyên** (cone = đơn vị nguyên).

## 3. Giải pháp

### Kỹ thuật

**Pattern:** `v-model` two-way + clamp trong handler bằng `format.between()` của Quasar.

Lý do: khi dùng `v-model` two-way, giá trị clamp được gán lại vào state → Vue tự re-render DOM → input hiển thị đúng tức thì. Không cần hack DOM, không cần computed setter factory (phức tạp vì có nhiều rows).

### Thay đổi code

**File:** `src/pages/thread/issues/v2/index.vue`

**1. Import util Quasar (đầu file, script setup):**
```ts
import { format } from 'quasar'
const { between } = format
```

**2. Sửa `handleInputChange` (dòng 513-522) — chỉ cần clamp và trigger validate:**
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
  input[field] = between(Math.floor(Number(input[field]) || 0), 0, max)
  handleQuantityChange(colorId, threadTypeId, threadColorId)
}
```

- `Math.floor()` đảm bảo chỉ nhận số nguyên.
- `between(value, 0, max)` clamp về khoảng hợp lệ.

**3. Sửa template (dòng 1423-1450) — đổi `:model-value` sang `v-model.number`, bỏ `:rules`:**
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

**Thay đổi so với hiện tại:**
- `:model-value` → `v-model.number` (two-way).
- Bỏ `:rules` (không cần nữa vì giá trị không bao giờ vượt max).
- Thêm `:step="1"` để chặn thập phân ở UI.
- `@update:model-value` chỉ gọi `handleInputChange` (không cần truyền `Number(v)` vì `v-model.number` đã chuyển).
- Signature `handleInputChange` gọn lại: bỏ tham số `value` (vì đã có sẵn trong state qua v-model).

**Lưu ý khởi tạo `lineInputs`:** đảm bảo `lineInputs[key]` được init trước khi render (đã có sẵn trong code hiện tại qua `ensureLineInput`/watcher — cần verify).

### Edge cases

| Case | Expected |
|---|---|
| Gõ `999` khi max=50 | Input hiện `50` ngay |
| Gõ `-5` | Về `0` |
| Gõ `50.5` | Về `50` (floor) |
| Paste `9999` | Clamp về max |
| Max=0 (hết tồn) | Input bị khóa về 0 |
| Xóa hết (empty) | Về `0` (vì `Number('') = 0`) |
| Nút tăng/giảm | Hoạt động bình thường, tuân `min`/`max` |

## 4. Testing

**Manual test (trang `/thread/issues/v2`):**
1. Chọn phòng ban, PO, Style, Color đến khi bảng Step 3 hiện.
2. Ô Full/Lẻ:
   - Gõ số lớn hơn tồn kho → phải clamp về tồn kho ngay khi chạm ký tự cuối.
   - Gõ số âm → phải về 0.
   - Gõ số thập phân → phải về số nguyên.
   - Paste số lớn → clamp.
   - Bấm spinner tăng quá max → không lên nữa.
3. Verify `debouncedValidate` vẫn chạy (quota warning, stock warning hiển thị đúng).
4. Bấm "Thêm vào phiếu" với giá trị hợp lệ → thành công.

**E2E (nếu có test sẵn cho issue v2):** update test để cover clamp.

## 5. Không nằm trong scope

- Không đổi logic `debouncedValidate` (stock/quota check) — giữ nguyên.
- Không đổi logic nút "Thêm vào phiếu" (`handleAddLine`, `isAddButtonDisabled`) — giữ nguyên.
- Không đổi component `AppInput` — chỉ dùng.
- Không áp dụng cho các trang khác (batch transfer, recovery…) — chỉ Issue V2 Step 3.
