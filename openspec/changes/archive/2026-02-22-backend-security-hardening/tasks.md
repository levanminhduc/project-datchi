## 1. Global Authentication + Security Headers

- [x] 1.1 Add `secureHeaders()` middleware from `hono/secure-headers` as first middleware in `server/index.ts` (before CORS)
- [x] 1.2 Add `except()` from `hono/combine` with `authMiddleware` applied to `/api/*`, whitelisting `/api/auth/login` and `/api/auth/refresh`; place BEFORE all `app.route()` calls
- [x] 1.3 Pin JWT algorithm to HS256 in `server/middleware/auth.ts` — pass `{ algorithms: ['HS256'] }` as third arg to `jwt.verify()` ← (verify: global auth blocks unauthenticated requests, login/refresh still work without token, JWT alg pinning rejects tampered tokens)

## 2. Remove Redundant Per-Route Auth

- [x] 2.1 Remove per-endpoint `authMiddleware` from `server/routes/auth.ts` — keep `requireAdmin` and `requireRoot` on admin endpoints; `login` and `refresh` handlers stay untouched
- [x] 2.2 Remove per-endpoint `authMiddleware` from `server/routes/settings.ts` — keep `requireRoot`
- [x] 2.3 Remove `use('*', authMiddleware)` and `authMiddleware` import from `server/routes/notifications.ts` ← (verify: no double JWT verification, requireAdmin/requireRoot still enforced on admin routes, notifications accessible to all authenticated users)

## 3. Per-Route Authorization — Thread Core Routes

- [x] 3.1 Add `requirePermission` to `server/routes/threads.ts` — GET: `thread.types.view`, POST: `thread.types.create`, PUT: `thread.types.edit`, DELETE: `thread.types.delete`
- [x] 3.2 Add `requirePermission` to `server/routes/colors.ts` — GET: `thread.colors.view`, POST/PUT/DELETE: `thread.colors.manage`
- [x] 3.3 Add `requirePermission` to `server/routes/suppliers.ts` — GET: `thread.suppliers.view`, POST/PUT/DELETE: `thread.suppliers.manage`
- [x] 3.4 Add `requirePermission` to `server/routes/inventory.ts` — GET: `thread.inventory.view`, PUT: `thread.inventory.edit`
- [x] 3.5 Add `requirePermission` to `server/routes/lots.ts` — GET: `thread.lots.view`, POST/PUT: `thread.lots.manage`
- [x] 3.6 Add `requirePermission` to `server/routes/allocations.ts` — GET: `thread.allocations.view`, POST/PUT/DELETE: `thread.allocations.manage` ← (verify: each route file imports requirePermission, correct permission code per HTTP method, GET vs mutate permissions are distinct)

## 4. Per-Route Authorization — Batch & Stock Routes

- [x] 4.1 Add `requirePermission` to `server/routes/batch.ts` — receive: `thread.batch.receive`, issue: `thread.batch.issue`, transfer: `thread.batch.transfer`, GET history: `thread.inventory.view`
- [x] 4.2 Add `requirePermission` to `server/routes/stock.ts` — GET: `thread.inventory.view`, POST add: `thread.batch.receive`, POST deduct/return: `thread.batch.issue`
- [x] 4.3 Add `requirePermission` to `server/routes/recovery.ts` — GET: `thread.recovery.view`, POST/PUT: `thread.recovery.manage` ← (verify: batch operations map to correct permission codes, stock.ts POST routes distinguish between add vs deduct)

## 5. Per-Route Authorization — Support & Reference Routes

- [x] 5.1 Add `requirePermission` to `server/routes/dashboard.ts` — all: `dashboard.view`
- [x] 5.2 Add `requirePermission` to `server/routes/reports.ts` — all: `reports.view`
- [x] 5.3 Add `requirePermission` to `server/routes/employees.ts` — GET: `employees.view`, POST: `employees.create`, PUT: `employees.edit`, DELETE: `employees.delete`
- [x] 5.4 Add `requirePermission` to `server/routes/positions.ts` — all: `employees.view`
- [x] 5.5 Add `requirePermission` to `server/routes/warehouses.ts` — all: `thread.inventory.view`
- [x] 5.6 Add `requirePermission` to `server/routes/weeklyOrder.ts` — GET: `thread.allocations.view`, POST/PUT: `thread.allocations.manage` ← (verify: support routes use view-level permissions, employees.ts has 4 distinct permissions for CRUD)

## 6. Per-Route Authorization — Remaining Reference Routes

- [x] 6.1 Add `requirePermission` to `server/routes/styles.ts` — all: `thread.types.view`
- [x] 6.2 Add `requirePermission` to `server/routes/styleThreadSpecs.ts` — all: `thread.types.view`
- [x] 6.3 Add `requirePermission` to `server/routes/purchaseOrders.ts` — all: `thread.lots.view`
- [x] 6.4 Add `requirePermission` to `server/routes/threadCalculation.ts` — all: `thread.inventory.view`
- [x] 6.5 Add `requirePermission` to `server/routes/thread-type-supplier.ts` — all: `thread.suppliers.view`
- [x] 6.6 Add `requirePermission` to `server/routes/reconciliation.ts` — all: `thread.inventory.view`
- [x] 6.7 Add `requirePermission` to `server/routes/issuesV2.ts` — all: `thread.allocations.view` ← (verify: all 22 route files now have requirePermission, no route file left without authorization)

## 7. Input Sanitization & Hardening

- [x] 7.1 Create `server/utils/sanitize.ts` with `sanitizeFilterValue()` — allowlist regex `[a-zA-Z0-9À-ỹ\s._%-]`, strip everything else
- [x] 7.2 Apply `sanitizeFilterValue()` to `.or()` in `server/routes/employees.ts` (2 locations) and `server/routes/auth.ts` (1 location)
- [x] 7.3 Apply `sanitizeFilterValue()` to `.or()` in `server/routes/inventory.ts` (2 locations) and `server/routes/threads.ts` (1 location)
- [x] 7.4 Apply `sanitizeFilterValue()` to `.or()` in `server/routes/suppliers.ts` (1 location), `server/routes/lots.ts` (1 location), and `server/routes/batch.ts` (1 location)
- [x] 7.5 Remove default password fallback from `POST /api/auth/reset-password/:id` in `server/routes/auth.ts` — make `newPassword` required, return 400 if missing ← (verify: all 9 .or() locations use sanitizeFilterValue, filter injection attempt "test,status.eq.deleted" is neutralized, password reset without newPassword returns 400)

## 8. Post-Implementation Bug Fix

- [x] 8.1 Fix `src/services/api.ts` — `fetchApi()` was NOT sending `Authorization: Bearer <token>` header. After adding global `authMiddleware` via `except()`, all API calls from services (except `authService.authenticatedFetch()`) returned 401 Unauthorized. Fix: read token from `localStorage.getItem('auth_access_token')` and attach to every request.

### Bài học (Lessons Learned)

- **Root cause:** `fetchApi()` trong `src/services/api.ts` không gửi Authorization header. Chỉ `authService.authenticatedFetch()` mới gửi token. Khi thêm global auth middleware, tất cả API calls từ các service khác (employeeService, threadService, etc.) đều bị 401.
- **Triệu chứng:** Đăng nhập root user thành công, nhưng mọi trang đều hiện "Bạn không có quyền" (thực ra là 401, không phải 403).
- **Cách phát hiện:** Check browser console → thấy 401 (không phải 403) → trace ngược về fetchApi thiếu token.
- **Quy tắc mới:** Khi thêm/thay đổi auth middleware ở backend → PHẢI kiểm tra frontend API client có gửi token hay không.
