# Cone Breakdown Dialog — Vertical Scroll Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `ConeWarehouseBreakdownDialog` layout sao cho nội dung dài (bảng "Reserve theo tuần đặt hàng" với nhiều warehouse/week) cuộn dọc đúng thay vì bị tràn ngang.

**Architecture:** Chỉ sửa CSS + template class trên `.breakdown-dialog-card`. Thêm `overflow-y: auto` + `overflow-x: hidden`, bỏ các flex class (`column`, `col`, `full-height`) đang cản trở natural block flow. Không đụng logic, không đụng data, không đụng component con.

**Tech Stack:** Vue 3 + Quasar 2 + TypeScript (component `src/components/thread/ConeWarehouseBreakdownDialog.vue`). Không có unit test framework nào chạy được trên file `.vue` component này — verification bằng Playwright E2E hoặc manual browser check.

**Spec reference:** `docs/superpowers/specs/2026-04-22-cone-breakdown-dialog-scroll-fix-design.md`

---

## File Structure

Chỉ 1 file bị sửa:

- **Modify:** `src/components/thread/ConeWarehouseBreakdownDialog.vue`
  - Template: bỏ `class="column"` trên `<q-card>`, bỏ `class="col"` + `class="full-height"` trên warehouse breakdown section/table
  - Scoped CSS: thêm `overflow-y: auto` + `overflow-x: hidden` trên `.breakdown-dialog-card`

Không tạo file mới. Không modify file khác.

---

## Task 1: Fix layout CSS và template class

**Files:**
- Modify: `src/components/thread/ConeWarehouseBreakdownDialog.vue` (3 chỗ trong template + 1 chỗ trong `<style scoped>`)

- [ ] **Step 1: Đọc file hiện tại để xác định exact strings cần sửa**

Run: đọc `src/components/thread/ConeWarehouseBreakdownDialog.vue` từ đầu đến dòng 210, và `<style scoped>` block cuối file.

Xác nhận 4 vị trí sau đang tồn tại (nếu khác → dừng, báo user):
- Dòng ~6: `<q-card class="breakdown-dialog-card column">`
- Dòng ~106: `<q-card-section class="col q-pt-none">`
- Dòng ~117: `class="full-height"` trên `<q-table>` warehouse breakdown
- Block `.breakdown-dialog-card` trong `<style scoped>`

- [ ] **Step 2: Bỏ `column` class trên q-card root**

Edit `src/components/thread/ConeWarehouseBreakdownDialog.vue`:

Tìm:
```html
<q-card class="breakdown-dialog-card column">
```

Thay bằng:
```html
<q-card class="breakdown-dialog-card">
```

- [ ] **Step 3: Bỏ `col` class trên warehouse breakdown section**

Edit `src/components/thread/ConeWarehouseBreakdownDialog.vue`:

Tìm (section chứa bảng warehouse breakdown):
```html
<!-- Warehouse breakdown table -->
      <q-card-section class="col q-pt-none">
```

Thay bằng:
```html
<!-- Warehouse breakdown table -->
      <q-card-section class="q-pt-none">
```

- [ ] **Step 4: Bỏ `full-height` class trên q-table warehouse breakdown**

Edit `src/components/thread/ConeWarehouseBreakdownDialog.vue`:

Tìm (trong section warehouse breakdown):
```html
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
          class="full-height"
        >
```

Thay bằng:
```html
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
        >
```

- [ ] **Step 5: Thêm overflow rules vào scoped CSS**

Edit `src/components/thread/ConeWarehouseBreakdownDialog.vue`:

Tìm:
```css
.breakdown-dialog-card {
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
}
```

Thay bằng:
```css
.breakdown-dialog-card {
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
}
```

- [ ] **Step 6: Type-check**

Run:
```bash
npm run type-check
```

Expected: `vue-tsc --build --force` pass, không có lỗi TS mới.

- [ ] **Step 7: Lint**

Run:
```bash
npm run lint
```

Expected: không có lỗi ESLint mới trên file `ConeWarehouseBreakdownDialog.vue`.

- [ ] **Step 8: Manual verification trong browser**

1. Start dev server: `npm run dev:all`
2. Mở `http://localhost:5173/thread/inventory`
3. Switch sang tab "Tổng hợp theo cuộn"
4. Click 1 row loại chỉ có **nhiều warehouses + nhiều tuần CONFIRMED** (ví dụ test data user cung cấp: TEX 18 — Kho Phú Tường có 6+ tuần)
5. Trong dialog, click nút "+" expand Kho Phú Tường trong bảng "Reserve theo tuần đặt hàng"

Expected:
- Không có scrollbar ngang ở đáy dialog
- Có 1 scrollbar dọc duy nhất bên phải dialog khi nội dung dài hơn 90vh
- Bảng "Reserve theo tuần đặt hàng" hiển thị **bên dưới** bảng supplier breakdown, full-width
- Header "Reserve theo tuần đặt hàng" không bị cắt
- Cuộn dọc lên xuống mượt, không giật

- [ ] **Step 9: Verify trên chiều rộng nhỏ**

Resize browser xuống 1024px chiều ngang, lặp lại step 8.

Expected: vẫn cuộn dọc đúng, không tràn ngang.

- [ ] **Step 10: Commit**

```bash
git add src/components/thread/ConeWarehouseBreakdownDialog.vue
git commit -m "fix(ui): cone breakdown dialog scroll vertically instead of overflowing horizontally"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Spec goal "toàn bộ dialog cuộn dọc" → Task 1 Step 5 (overflow-y: auto)
- ✅ Spec goal "không scrollbar ngang" → Task 1 Step 5 (overflow-x: hidden) + Step 2-4 (bỏ flex class gây tranh chấp space)
- ✅ Spec non-goal "KHÔNG sticky" → không có task nào thêm sticky
- ✅ Spec non-goal "KHÔNG đụng API/composable/types" → plan chỉ sửa 1 file Vue component
- ✅ Acceptance criteria "1 scrollbar dọc duy nhất" → Task 1 Step 8
- ✅ Acceptance criteria "màn hình nhỏ" → Task 1 Step 9
- ✅ Acceptance criteria "expand không giật" → Task 1 Step 8

**Risk notes:**
- Việc bỏ `class="column"` trên `<q-card>` có thể thay đổi intrinsic sizing của các child `q-card-section`. Vì các section hiện tại đều là block-level và không còn section nào dùng `col` sau Step 3, block flow tự nhiên sẽ stack đúng. Nếu có regression về spacing → điều chỉnh bằng `q-gutter-*` hoặc margin (không cần restore flex).
- Nếu step 1 phát hiện file đã khác vs snapshot plan (ai đó đã edit), dừng và báo user trước khi tiếp tục.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-22-cone-breakdown-dialog-scroll-fix.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks trong session hiện tại, batch với checkpoint

Plan này chỉ có 1 task nhỏ (CSS fix) — inline execution phù hợp hơn. Bạn chọn approach nào?
