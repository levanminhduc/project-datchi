---
name: new-fe
description: Create frontend layer (Vue types, service, composable, list/detail pages, realtime, Excel export) for the Dat Chi Thread Inventory System. Use when adding new pages or frontend features.
---

# Skill: /new-fe

Tạo frontend (types + service + composable + pages) cho dự án Dat Chi - Thread Inventory Management System.

Khi user gọi `/new-fe [mô tả]`, tuân thủ TOÀN BỘ hướng dẫn bên dưới.

---

## Workflow Steps

| Bước | Mô tả | Reference |
|------|-------|-----------|
| 1 | Types — Enum, interfaces, DTOs, ListResponse, barrel export | Load `references/01-types-service.md` |
| 2 | Service — fetchApi pattern, buildQueryString, CRUD methods | Load `references/01-types-service.md` |
| 3 | Composable — State, loading, error handling, CRUD actions | Load `references/02-composable.md` |
| 4 | List Page — index.vue với DataTable, filters, dialogs | Load `references/03-list-page.md` |
| 5 | Detail Page — [id].vue với tabs, info display, back button | Load `references/04-detail-page.md` |
| 6 | Realtime — useRealtime subscribe/unsubscribe (nếu cần) | Load `references/05-realtime-excel.md` |
| 7 | Excel Export — ExcelJS dynamic import, blob download (nếu cần) | Load `references/05-realtime-excel.md` |
| 7b | File Upload/Download — fetchApiRaw FormData + blob (nếu cần) | Load `references/06-file-operations.md` |

---

## UI Components - PHẢI dùng

| Component | Thay cho | Import |
|-----------|----------|--------|
| `AppInput` | `q-input` | `@/components/ui/inputs/AppInput.vue` |
| `AppSelect` | `q-select` | `@/components/ui/inputs/AppSelect.vue` |
| `AppButton` | `q-btn` (chính) | `@/components/ui/buttons/AppButton.vue` |
| `DataTable` | `q-table` | `@/components/ui/tables/DataTable.vue` |
| `DatePicker` | `input[type=date]` | `@/components/ui/pickers/DatePicker.vue` |
| `PageHeader` | Custom header | `@/components/ui/layout` |
| `FormDialog` | `q-dialog` (form) | `@/components/ui/dialogs/FormDialog.vue` |
| `DeleteDialog` | `q-dialog` (xóa) | `@/components/ui/dialogs/DeleteDialog.vue` |
| `SearchInput` | `AppInput` (tìm kiếm) | `@/components/ui/inputs/SearchInput.vue` |
| `IconButton` | `q-btn` (icon only) | `@/components/ui/buttons/IconButton.vue` |

> **Ngoại lệ**: `q-btn` flat/round/dense cho action icons trong table rows thì dùng trực tiếp.

---

## Critical Rules

| Rule | Chi tiết |
|------|---------|
| **fetchApi vs fetchApiRaw** | `fetchApi()` auto-parse JSON — dùng cho CRUD. `fetchApiRaw()` raw Response — CHỈ dùng cho file upload/download |
| **Thông báo** | PHẢI tiếng Việt CÓ DẤU: `snackbar.success('Tạo thành công')` |
| **Ngày tháng** | LUÔN `date.formatDate(dateStr, 'DD/MM/YYYY')` từ quasar (có giờ: `'DD/MM/YYYY HH:mm'`) |
| **Số lượng** | `value.toLocaleString('vi-VN')` |
| **Error handling** | `createErrorHandler()` → `snackbar.error(getErrorMessage(err))` |
| **Loading** | `useLoading().withLoading(() => service.call())` — KHÔNG manual set loading |
| **Destructive** | `useConfirm()` → `await confirmDelete(item.name)` |
| **Permissions** | `can('resource.edit')` → template `v-if="canEdit.value"` |
| **API flow** | Frontend → `fetchApi()` → Hono API → `supabaseAdmin` → PostgreSQL. KHÔNG gọi Supabase trực tiếp |
| **File structure** | `src/types/thread/` · `src/services/` · `src/composables/[module]/` · `src/pages/[module]/feature/{index,\[id\]}.vue` |

---

## Multi-Agent FE Parallelization

Khi task FE phức tạp (≥3 pages hoặc ≥5 subtasks), chia 2 agent:

| Agent | Nhiệm vụ | Files |
|-------|----------|-------|
| `fe-core` | Types + Service + Composable | `src/types/`, `src/services/`, `src/composables/` |
| `fe-page` | Pages + Realtime + Excel | `src/pages/`, components |

**Dependency:** `fe-core` → HOÀN THÀNH TRƯỚC → `fe-page` bắt đầu sau (pages import từ composable).

---

## CHECKLIST TRƯỚC KHI HOÀN THÀNH

### State
- [ ] Composable dùng `useLoading().withLoading()` (KHÔNG manual loading)
- [ ] Error handling dùng `getErrorMessage()` utility
- [ ] Xóa/hành động nguy hiểm dùng `useConfirm()`
- [ ] Service dùng `fetchApi()`, method `PUT` cho update
- [ ] Service dùng `buildQueryString()` helper

### UI
- [ ] `definePage` meta có permissions phù hợp
- [ ] Page có `PageHeader` với title + actions
- [ ] Dùng `AppInput`, `AppSelect`, `AppButton`, `DatePicker`
- [ ] `SearchInput` cho tìm kiếm (built-in debounce 300ms)
- [ ] Tab layout nếu có ≥2 tính năng con
- [ ] Action buttons trong table: `q-btn flat round dense size="sm"` + `q-tooltip`
- [ ] Status badge với color mapping
- [ ] DataTable có `#empty-action` slot
- [ ] Server-side pagination với `@request` handler + `v-model:pagination`
- [ ] Responsive grid (`col-12 col-sm-6 col-md-4`)
- [ ] DatePicker dùng popup pattern (icon + `q-popup-proxy`)
- [ ] Form validation dùng `:rules` prop
- [ ] Permission checks: `v-if="canEdit.value"` cho action buttons
- [ ] Detail page có back button (`showBack` + `backTo`)

### Quy tắc chung
- [ ] Mọi thông báo (success, error, toast) bằng tiếng Việt CÓ DẤU
- [ ] Ngày tháng format `DD/MM/YYYY` (dùng `date.formatDate` từ quasar)
- [ ] Số lượng format `toLocaleString('vi-VN')`
- [ ] Không có comment thừa trong code
- [ ] Excel export dùng ExcelJS dynamic import (nếu cần xuất dữ liệu)
