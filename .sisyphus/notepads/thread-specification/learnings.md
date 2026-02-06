# Thread Specification Feature - Learnings & Conventions

## Project Conventions (from AGENTS.md)

### Database
- Migration format: `YYYYMMDDHHMMSS_description.sql` in `supabase/migrations/`
- Use SERIAL PRIMARY KEY, TIMESTAMPTZ for dates
- Vietnamese COMMENT on tables and columns
- FK pattern: `REFERENCES table(id) ON DELETE CASCADE/RESTRICT/SET NULL`

### API Response Format
```typescript
{ data: T | null, error: string | null, message?: string }
```
- Vietnamese error messages
- Always include both data and error fields

### Frontend Patterns
- Use composables (useSnackbar, useConfirm) instead of direct Quasar
- UI Components from `src/components/ui/` (AppButton, AppInput, DataTable, etc.)
- Services in `src/services/{domain}Service.ts` with `fetchApi` pattern
- Types in `src/types/thread/{entity}.ts`
- Pages: file-based routing with `definePage()` for meta

### Existing Tables to Reference
- `suppliers` - NCC (Nhà cung cấp)
- `colors` - Màu sắc
- `thread_types` - Loại chỉ (tex, meters_per_cone, supplier_id, color_id)

### Responsive Design (Mobile First)
- Use `col-12 col-sm-6 col-md-4` pattern
- Quasar breakpoints: xs(<600), sm(≥600), md(≥1024), lg(≥1440), xl(≥1920)

## Technical Decisions

### Hierarchy
- NCC → Tex → Màu chỉ
- 1 NCC có nhiều Tex, 1 Tex có nhiều Màu

### Database Schema
1. `purchase_orders` - Đơn hàng
2. `styles` - Mã hàng gốc
3. `po_items` - Trung gian PO ↔ Style
4. `skus` - Chi tiết: Style + Màu + Size + số lượng
5. `style_thread_specs` - Template định mức (công đoạn, NCC, Tex, mét/SP)
6. `style_color_thread_specs` - Chi tiết định mức với màu chỉ cụ thể

### UI Structure
- 2 pages: styles list + style detail (có tabs cho specs)
- Calculation: Trang tính toán riêng (PO → calculate → confirm → allocations)

## [2026-02-06] UI-2 Fixes

### Route Params Typing
For dynamic routes [id].vue, use typed useRoute with route name:
```typescript
const route = useRoute('/thread/styles/[id]')  // CORRECT: fully typed
const id = computed(() => Number(route.params.id))  // No 'as string' needed
```

### useConfirm API
useConfirm() returns { confirm, confirmWarning, confirmDelete } - NOT show():
```typescript
// WRONG: confirm.show({ title, message })
// CORRECT:
await confirm.confirm({ title, message, confirmText, cancelText })
await confirm.confirmDelete({ itemName: 'Name' })
```
