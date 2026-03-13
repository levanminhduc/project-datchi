---
name: new-be
description: Create backend layer (Hono routes, TypeScript types, Zod validation schemas) for the Dat Chi Thread Inventory System. Use when adding new API endpoints or backend logic.
---

# Skill: /new-be

Tao backend (Hono routes + types + validation) cho du an Dat Chi - Thread Inventory Management System.

Khi user goi `/new-be [mo ta]`, tuan thu TOAN BO huong dan ben duoi.

---

## Workflow Steps

| Buoc | Mo ta | Reference |
|------|-------|-----------|
| 1 | Types: TenBangRow, DTOs, Filters, shared ApiResponse | Load `references/01-types-validation.md` |
| 2 | Validation: Zod schemas, safeParse pattern, validation helper | Load `references/01-types-validation.md` |
| 3a | Routes Level 1 — CRUD Read+Create (GET list, POST) | Load `references/02-routes-crud.md` |
| 3a+ | Routes Level 1 — CRUD Write (GET /:id, PUT /:id, DELETE /:id) | Load `references/02b-routes-crud-write.md` |
| 3b | Routes Level 2 — Workflow (status transitions: confirm, approve, cancel) | Load `references/03-routes-advanced.md` |
| 3c | Routes Level 3 — Batch Operations | Load `references/03-routes-advanced.md` |
| 3d | Routes Level 3 — RPC call, Cascading select, Notifications | Load `references/03-routes-advanced.md` |
| 3e | Routes — Excel Import/Export + Template download | Load `references/04-routes-excel.md` |

---

## Critical Rules

### Thu tu route (CRITICAL - Hono match theo thu tu dang ky)
```
1. Static helper endpoints: /options, /count, /template, /form-data
2. GET /           (list)
3. POST /          (create)
4. Nested static:  /conflicts, /summary
5. GET /:id        (get single)
6. PUT /:id        (update)
7. DELETE /:id     (soft delete)
8. POST /:id/action (workflow: /:id/confirm, /:id/approve, /:id/cancel)
```

### Response format
Luon tra ve:
```json
{ "data": {...}, "error": null, "message": "optional" }
{ "data": null, "error": "Thong bao loi" }
```
**KHONG dung `{ success, data, error }`.** Truong `success` chi ton tai trong stock.ts (ngoai le).

### Auth
- Du an da co global `authMiddleware` applied via `app.use('/api/*', authMiddleware)` trong `server/index.ts`
- Tat ca routes duoi `/api/*` deu protected. KHONG can them `authMiddleware` trong route files
- Chi can `requirePermission()` per-route hoac group middleware
- `fetchApi()` da tu dong gui token — KHONG can gui token thu cong trong service files

### Group Middleware (khi tat ca routes cung permission)
```typescript
const router = new Hono()
router.use('*', requirePermission('ten_tinh_nang.view'))
// Cac route ben duoi KHONG can them requirePermission() nua
```
> **Khi nao KHONG dung:** Routes co permission khac nhau → dung per-route. Tham khao: `server/routes/subArts.ts`

### Error handling
- Dung `getErrorMessage(err)` tu `'../utils/errorHelper'`
- Dung `sanitizeFilterValue(search)` tu `'../utils/sanitize'` truoc khi dung trong PostgREST `.or()` filter

### PostgreSQL error codes thuong gap
| Code | Y nghia | Xu ly |
|------|---------|-------|
| `PGRST116` | PostgREST not found (`.single()` no rows) | Return 404 |
| `23505` | Unique constraint violation (duplicate) | Skip hoac return 409 |
| `23503` | Foreign key violation | Return 400 voi message cu the |

---

## Dang ky route trong server/index.ts
```typescript
import tenTinhNangRouter from './routes/tenTinhNang'
app.route('/api/ten-tinh-nang', tenTinhNangRouter)
```

---

## CHECKLIST TRUOC KHI HOAN THANH

- [ ] Route order: static truoc dynamic, `/:id` cuoi
- [ ] Response format: `{ data, error, message? }` (KHONG phai `{ success, data, error }`)
- [ ] Zod validation dung `.safeParse()` (KHONG `.parse()`)
- [ ] PUT endpoint dung `UpdateSchema.safeParse(body)` (KHONG validate raw body)
- [ ] Duplicate check truoc insert (409)
- [ ] Exists check truoc update/delete (404)
- [ ] PGRST116 error code cho not found
- [ ] Route da dang ky trong `server/index.ts`
- [ ] Auth middleware: `requirePermission()` cho moi route (KHONG can `authMiddleware` - da co global)
- [ ] Types dung shared `ApiResponse<T>`, KHONG tao rieng
- [ ] Soft delete: `update({ deleted_at, is_active: false })` (kiem tra schema co cot `is_active` truoc khi dung)
- [ ] `sanitizeFilterValue()` cho moi search filter truoc khi dung trong `.or()`
