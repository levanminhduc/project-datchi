# Giữ đăng nhập bền vững — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa cơ chế session để nhân viên giữ đăng nhập vô thời hạn khi dùng đều (sliding refresh 90 ngày), không bị đá ra do race ở `/refresh`, sống sót qua restart/reboot, và có thu hồi phiên đúng lúc.

**Architecture:** Giữ access JWT (HS256, 1h) + refresh token (hash SHA-256 trong `auth_refresh_tokens`). Viết lại `POST /api/auth/refresh` để xoay token nguyên tử trong transaction (atomic compare-and-swap) kèm grace cache in-memory 30s xử lý request đồng thời. Thêm revoke-on-password-change, endpoint logout-all-devices, và nút frontend.

**Tech Stack:** Hono (Node/tsx), PostgreSQL (`pg`), jose (JWT HS256), Zod, Vue 3 + Quasar, test bằng `node:assert/strict` self-executing chạy qua `npx tsx`.

## Global Constraints

- **Ngôn ngữ:** mọi text người dùng bằng Tiếng Việt (success/error/validation/toast/label/button).
- **Không comment trong code** (code tự giải thích).
- **Không xóa data:** chỉ UPDATE/INSERT; revoke = set `revoked_at`, không DELETE/TRUNCATE.
- **Frontend CRUD qua Hono API** dùng `fetchApi()` / `authService.authenticatedFetch()` — không gọi DB trực tiếp.
- **Dùng App* wrappers + `useConfirm()`** (không `$q.dialog()` trực tiếp) ở frontend.
- **JWT_SIGNING_SECRET cố định**, đọc từ `.env`, fail-fast nếu thiếu — không random lúc boot.
- **Schema không đổi:** bảng `auth_refresh_tokens` đã đủ cột (`id, token_hash, employee_id, expires_at, revoked_at, rotated_from, created_at`).
- Access TTL giữ `JWT_ACCESS_TTL_SECONDS=3600`. Refresh TTL đổi thành `JWT_REFRESH_TTL_SECONDS=7776000` (90 ngày).
- Test chạy: `npx tsx <path>.test.ts`, in dòng "... passed" cuối file. Mock `pool.query` theo pattern hiện có (`server/routes/weekly-order/transfer-reserved.test.ts`).

---

## File Structure

- **Create** `server/auth/refresh-grace-cache.ts` — cache in-memory token con vừa xoay (TTL 30s) để phục vụ request đồng thời. Một trách nhiệm: lưu/đọc/dọn token thô theo key = hash token cũ.
- **Create** `server/auth/refresh-grace-cache.test.ts` — test cache set/get/expiry.
- **Modify** `server/auth/jwt.ts` — refresh TTL 90 ngày (qua env default).
- **Modify** `server/routes/auth.ts` — viết lại handler `/refresh`; revoke trong `change-password`; thêm route `logout-all-devices`. Tách logic refresh thành helper trong cùng file để test được.
- **Create** `server/routes/auth.refresh.test.ts` — test race/grace/replay/sliding của `/refresh`.
- **Modify** `.env`, `.env.example` — `JWT_REFRESH_TTL_SECONDS=7776000`.
- **Modify** `src/services/api.ts` — xử lý response 409 từ `/refresh` (đọc lại token local, retry 1 lần).
- **Modify** `src/services/authService.ts` — thêm `logoutAllDevices()`.
- **Modify** `src/components/UserMenu.vue` — nút "Đăng xuất mọi thiết bị" + `useConfirm()`.

---

## Task 1: Refresh grace cache (in-memory)

**Files:**
- Create: `server/auth/refresh-grace-cache.ts`
- Test: `server/auth/refresh-grace-cache.test.ts`

**Interfaces:**
- Consumes: (none)
- Produces:
  - `recordRotation(oldTokenHash: string, child: { token: string; refreshToken: string; expiresAt: number }): void`
  - `getGraceChild(oldTokenHash: string): { token: string; refreshToken: string; expiresAt: number } | null`
  - `GRACE_WINDOW_MS = 30_000` (exported const)
  - `token` = access JWT thô; `refreshToken` = refresh token con thô; `expiresAt` = access token exp (giây)

- [ ] **Step 1: Write the failing test**

Create `server/auth/refresh-grace-cache.test.ts`:

```typescript
import assert from 'node:assert/strict'
import { recordRotation, getGraceChild, GRACE_WINDOW_MS } from './refresh-grace-cache'

function testReturnsRecordedChildWithinWindow() {
  recordRotation('oldhash-1', { token: 'access-1', refreshToken: 'refresh-1', expiresAt: 123 })
  const got = getGraceChild('oldhash-1')
  assert.ok(got)
  assert.equal(got.token, 'access-1')
  assert.equal(got.refreshToken, 'refresh-1')
  assert.equal(got.expiresAt, 123)
}

function testReturnsNullForUnknownHash() {
  assert.equal(getGraceChild('never-seen'), null)
}

function testExpiresAfterWindow() {
  const realNow = Date.now
  let now = 1_000_000
  Date.now = () => now
  try {
    recordRotation('oldhash-2', { token: 'a', refreshToken: 'r', expiresAt: 1 })
    now += GRACE_WINDOW_MS + 1
    assert.equal(getGraceChild('oldhash-2'), null)
  } finally {
    Date.now = realNow
  }
}

testReturnsRecordedChildWithinWindow()
testReturnsNullForUnknownHash()
testExpiresAfterWindow()
console.log('refresh-grace-cache tests passed')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx server/auth/refresh-grace-cache.test.ts`
Expected: FAIL — `Cannot find module './refresh-grace-cache'`

- [ ] **Step 3: Write minimal implementation**

Create `server/auth/refresh-grace-cache.ts`:

```typescript
export const GRACE_WINDOW_MS = 30_000

interface GraceChild {
  token: string
  refreshToken: string
  expiresAt: number
}

interface GraceEntry extends GraceChild {
  recordedAt: number
}

const cache = new Map<string, GraceEntry>()

function purgeExpired(now: number): void {
  for (const [key, entry] of cache) {
    if (now - entry.recordedAt > GRACE_WINDOW_MS) {
      cache.delete(key)
    }
  }
}

export function recordRotation(oldTokenHash: string, child: GraceChild): void {
  const now = Date.now()
  purgeExpired(now)
  cache.set(oldTokenHash, { ...child, recordedAt: now })
}

export function getGraceChild(oldTokenHash: string): GraceChild | null {
  const now = Date.now()
  const entry = cache.get(oldTokenHash)
  if (!entry) return null
  if (now - entry.recordedAt > GRACE_WINDOW_MS) {
    cache.delete(oldTokenHash)
    return null
  }
  return { token: entry.token, refreshToken: entry.refreshToken, expiresAt: entry.expiresAt }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx server/auth/refresh-grace-cache.test.ts`
Expected: PASS — in "refresh-grace-cache tests passed"

- [ ] **Step 5: Commit**

```bash
git add server/auth/refresh-grace-cache.ts server/auth/refresh-grace-cache.test.ts
git commit -m "feat(auth): grace cache in-memory cho refresh token đồng thời"
```

---

## Task 2: Refresh TTL 90 ngày (sliding)

**Files:**
- Modify: `server/auth/jwt.ts:8`
- Modify: `.env`, `.env.example`

**Interfaces:**
- Consumes: (none)
- Produces: `generateRefreshToken()` trả `expiresAt = now + 90 ngày` khi env không set; `REFRESH_TTL_SECONDS` default = 7776000.

- [ ] **Step 1: Đổi default TTL trong jwt.ts**

Trong `server/auth/jwt.ts`, dòng 8 hiện tại:

```typescript
const REFRESH_TTL_SECONDS = parseInt(process.env.JWT_REFRESH_TTL_SECONDS || '604800', 10)
```

Đổi `'604800'` thành `'7776000'`:

```typescript
const REFRESH_TTL_SECONDS = parseInt(process.env.JWT_REFRESH_TTL_SECONDS || '7776000', 10)
```

- [ ] **Step 2: Cập nhật .env**

Trong `.env`, đổi dòng:

```
# Workstream 2 (auth): app-signed JWT secret (HS256). Replaces Supabase GoTrue.
JWT_SIGNING_SECRET=dev-local-migration-secret-change-me-min-32-chars-long-xyz
```

thành (thêm dòng TTL ngay dưới secret):

```
# Workstream 2 (auth): app-signed JWT secret (HS256). Replaces Supabase GoTrue.
JWT_SIGNING_SECRET=dev-local-migration-secret-change-me-min-32-chars-long-xyz
JWT_ACCESS_TTL_SECONDS=3600
JWT_REFRESH_TTL_SECONDS=7776000
```

- [ ] **Step 3: Cập nhật .env.example**

Trong `.env.example`, thêm (hoặc cập nhật nếu đã có) hai dòng cạnh khai báo `JWT_SIGNING_SECRET`:

```
JWT_ACCESS_TTL_SECONDS=3600
JWT_REFRESH_TTL_SECONDS=7776000
```

> Nếu `.env.example` chưa có khối JWT, thêm khối:
> ```
> # Auth JWT (HS256). JWT_SIGNING_SECRET BẮT BUỘC — server fail-fast nếu thiếu.
> JWT_SIGNING_SECRET=change-me-min-32-chars-long
> JWT_ACCESS_TTL_SECONDS=3600
> JWT_REFRESH_TTL_SECONDS=7776000
> ```

- [ ] **Step 4: Verify type-check không vỡ**

Run: `npm run type-check`
Expected: PASS (không lỗi mới ở `server/auth/jwt.ts`)

- [ ] **Step 5: Commit**

```bash
git add server/auth/jwt.ts .env .env.example
git commit -m "feat(auth): refresh token TTL 90 ngày (sliding session)"
```

---

## Task 3: Viết lại /refresh — atomic CAS + transaction + grace

**Files:**
- Modify: `server/routes/auth.ts` (handler `auth.post('/refresh', ...)` dòng ~165-261; imports dòng 1-23)
- Test: `server/routes/auth.refresh.test.ts`

**Interfaces:**
- Consumes:
  - `tx(fn)` từ `../db/query` (BEGIN/COMMIT/ROLLBACK, truyền `PoolClient`)
  - `signAccessToken`, `generateRefreshToken`, `hashRefreshToken` từ `../auth/jwt`
  - `recordRotation`, `getGraceChild` từ `../auth/refresh-grace-cache`
  - `getRoleCodesAndRoot(employeeId)` (đã có sẵn trong file)
- Produces: `POST /api/auth/refresh`
  - 200 `{ data: { accessToken, refreshToken, expiresAt }, error: false }` — refresh thành công (thắng race HOẶC trúng grace)
  - 409 `{ error: true, message: 'Đang làm mới phiên, vui lòng thử lại' }` — token con vừa xoay nhưng không lấy được token thô (grace miss)
  - 401 `{ error: true, message: '...' }` — token không hợp lệ / hết hạn / replay thật (đã mass-revoke)

- [ ] **Step 1: Write the failing test**

Create `server/routes/auth.refresh.test.ts`:

```typescript
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { pool } from '../db/pool'
import { generateRefreshToken, hashRefreshToken } from '../auth/jwt'
import authRoutes from './auth'

process.env.JWT_SIGNING_SECRET = process.env.JWT_SIGNING_SECRET || 'test-secret-min-32-characters-long-aaaaaa'

interface FakeRow { [k: string]: unknown }

function makeApp() {
  const app = new Hono()
  app.route('/api/auth', authRoutes)
  return app
}

function callRefresh(app: Hono, refreshToken: string) {
  return app.request('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

async function testConcurrentRefreshDoesNotKillSession() {
  const original = pool.query
  const originalConnect = pool.connect

  const raw = 'concurrent-raw-token'
  const hash = hashRefreshToken(raw)
  let claimed = false
  const revokedAll: number[] = []

  const fakeClient = {
    query: (async (text: string, params?: unknown[]) => {
      if (text.includes('BEGIN') || text.includes('COMMIT') || text.includes('ROLLBACK')) {
        return { rows: [] }
      }
      if (/UPDATE auth_refresh_tokens[\s\S]*revoked_at = now\(\)[\s\S]*token_hash = \$1[\s\S]*RETURNING/i.test(text)) {
        if (claimed) return { rows: [] as FakeRow[] }
        claimed = true
        return { rows: [{ id: 'tok-1', employee_id: 17 }] }
      }
      if (text.includes('INSERT INTO auth_refresh_tokens')) {
        return { rows: [] }
      }
      return { rows: [] }
    }),
    release: () => {},
  }

  pool.connect = (async () => fakeClient) as unknown as typeof pool.connect
  pool.query = (async (text: string, params?: unknown[]) => {
    if (/SELECT[\s\S]*FROM employees WHERE id/i.test(text)) {
      return { rows: [{ id: 17, employee_id: 'NV017', is_active: true, deleted_at: null }] }
    }
    if (/FROM employee_roles/i.test(text)) {
      return { rows: [{ code: 'admin' }] }
    }
    if (/rotated_from/i.test(text)) {
      return revokedAll.length ? { rows: [] } : { rows: [] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    const app = makeApp()
    const [r1, r2] = await Promise.all([callRefresh(app, raw), callRefresh(app, raw)])
    const statuses = [r1.status, r2.status].sort()
    assert.ok(statuses.includes(200), 'ít nhất 1 request phải 200')
    assert.ok(!statuses.includes(500), 'không request nào được 500')
    for (const s of statuses) {
      assert.ok(s === 200 || s === 409, `status hợp lệ phải là 200/409, nhận ${s}`)
    }
  } finally {
    pool.query = original
    pool.connect = originalConnect
  }
}

await testConcurrentRefreshDoesNotKillSession()
console.log('auth.refresh concurrent test passed')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx server/routes/auth.refresh.test.ts`
Expected: FAIL — handler hiện tại không dùng atomic CAS (UPDATE...RETURNING), nên mock không khớp; hoặc cả 2 request cùng 200 do không có claim atomic → assert về 409/grace sẽ lệch. (Mục tiêu: đỏ trước khi sửa.)

- [ ] **Step 3: Cập nhật imports trong auth.ts**

Trong `server/routes/auth.ts`, khối import đầu file (dòng 1-23), thêm `tx` và grace cache. Sửa dòng `import { query, queryOne } from '../db/query'` thành:

```typescript
import { query, queryOne, tx } from '../db/query'
```

Thêm sau khối import jwt (sau dòng `} from '../auth/jwt'`):

```typescript
import { recordRotation, getGraceChild } from '../auth/refresh-grace-cache'
```

- [ ] **Step 4: Thay toàn bộ handler /refresh**

Thay nguyên khối `auth.post('/refresh', async (c) => { ... })` (dòng ~165-261) bằng:

```typescript
auth.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = refreshSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: true, message: 'Thiếu refresh token' }, 400)
  }

  const tokenHash = hashRefreshToken(parsed.data.refreshToken)

  try {
    const claimed = await tx(async (client) => {
      const claimRes = await client.query<{ id: string; employee_id: number }>(
        `UPDATE auth_refresh_tokens
         SET revoked_at = now()
         WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
         RETURNING id, employee_id`,
        [tokenHash]
      )

      if (claimRes.rows.length === 0) {
        return null
      }

      const stored = claimRes.rows[0]

      const employee = await queryOne<{
        id: number
        employee_id: string
        is_active: boolean
        deleted_at: string | null
      }>(
        `SELECT id, employee_id, is_active, deleted_at FROM employees WHERE id = $1 LIMIT 1`,
        [stored.employee_id]
      )

      if (!employee || employee.deleted_at) {
        return { kind: 'account_gone' as const }
      }
      if (!employee.is_active) {
        return { kind: 'account_inactive' as const }
      }

      const { roles, isRoot } = await getRoleCodesAndRoot(employee.id)
      const access = await signAccessToken({
        employeeId: employee.id,
        employeeCode: employee.employee_id,
        roles,
        isRoot,
      })
      const newRefresh = generateRefreshToken()

      await client.query(
        `INSERT INTO auth_refresh_tokens (token_hash, employee_id, expires_at, rotated_from)
         VALUES ($1, $2, $3, $4)`,
        [newRefresh.tokenHash, employee.id, newRefresh.expiresAt.toISOString(), stored.id]
      )

      return {
        kind: 'rotated' as const,
        accessToken: access.token,
        refreshToken: newRefresh.token,
        expiresAt: access.expiresAt,
      }
    })

    if (claimed && claimed.kind === 'rotated') {
      recordRotation(tokenHash, {
        token: claimed.accessToken,
        refreshToken: claimed.refreshToken,
        expiresAt: claimed.expiresAt,
      })
      return c.json({
        data: {
          accessToken: claimed.accessToken,
          refreshToken: claimed.refreshToken,
          expiresAt: claimed.expiresAt,
        },
        error: false,
      })
    }

    if (claimed && claimed.kind === 'account_gone') {
      return c.json({ error: true, message: 'Tài khoản không tồn tại hoặc đã bị xóa' }, 403)
    }
    if (claimed && claimed.kind === 'account_inactive') {
      return c.json({ error: true, message: 'Tài khoản đã bị vô hiệu hóa' }, 403)
    }

    const grace = getGraceChild(tokenHash)
    if (grace) {
      return c.json({
        data: {
          accessToken: grace.token,
          refreshToken: grace.refreshToken,
          expiresAt: grace.expiresAt,
        },
        error: false,
      })
    }

    const stored = await queryOne<{ id: string; employee_id: number; expires_at: string; revoked_at: string | null }>(
      `SELECT id, employee_id, expires_at, revoked_at
       FROM auth_refresh_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash]
    )

    if (!stored) {
      return c.json({ error: true, message: 'Phiên đăng nhập đã hết hạn' }, 401)
    }

    if (new Date(stored.expires_at) <= new Date()) {
      return c.json({ error: true, message: 'Phiên đăng nhập đã hết hạn' }, 401)
    }

    const recentChild = await queryOne<{ id: string }>(
      `SELECT id FROM auth_refresh_tokens
       WHERE rotated_from = $1 AND revoked_at IS NULL
         AND created_at > now() - interval '30 seconds'
       ORDER BY created_at DESC
       LIMIT 1`,
      [stored.id]
    )

    if (recentChild) {
      return c.json({ error: true, message: 'Đang làm mới phiên, vui lòng thử lại' }, 409)
    }

    await query(
      `UPDATE auth_refresh_tokens SET revoked_at = now()
       WHERE employee_id = $1 AND revoked_at IS NULL`,
      [stored.employee_id]
    )
    return c.json({ error: true, message: 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại' }, 401)
  } catch (err) {
    console.error('Refresh error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})
```

- [ ] **Step 5: Run the new test to verify it passes**

Run: `npx tsx server/routes/auth.refresh.test.ts`
Expected: PASS — in "auth.refresh concurrent test passed". Hai request đồng thời: 1 trả 200, request kia trả 200 (grace) hoặc 409; không có 500; không mass-revoke (nhánh recentChild chặn trước).

- [ ] **Step 6: Verify type-check**

Run: `npm run type-check`
Expected: PASS (không lỗi mới ở `server/routes/auth.ts`)

- [ ] **Step 7: Commit**

```bash
git add server/routes/auth.ts server/routes/auth.refresh.test.ts
git commit -m "fix(auth): /refresh atomic CAS + transaction + grace 30s chống race giết phiên"
```

---

## Task 4: Revoke token khi tự đổi mật khẩu

**Files:**
- Modify: `server/routes/auth.ts` (handler `change-password`, sau khi UPDATE password thành công, dòng ~419-427)

**Interfaces:**
- Consumes: `query` từ `../db/query` (đã import)
- Produces: sau đổi mật khẩu thành công, toàn bộ refresh token chưa revoke của nhân viên bị set `revoked_at = now()`.

- [ ] **Step 1: Write the failing test**

Create `server/routes/auth.change-password.test.ts`:

```typescript
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool'
import type { AppEnv } from '../types/hono-env'
import authRoutes from './auth'

process.env.JWT_SIGNING_SECRET = process.env.JWT_SIGNING_SECRET || 'test-secret-min-32-characters-long-aaaaaa'

async function testRevokesRefreshTokensOnPasswordChange() {
  const original = pool.query
  const hash = await bcrypt.hash('OldPass123', 10)
  let revokeCalled = false
  let revokeEmployeeId: unknown = null

  pool.query = (async (text: string, params?: unknown[]) => {
    if (/SELECT password_hash, employee_id FROM employees/i.test(text)) {
      return { rows: [{ password_hash: hash, employee_id: 'NV017' }] }
    }
    if (/UPDATE employees SET password_hash/i.test(text)) {
      return { rows: [] }
    }
    if (/UPDATE auth_refresh_tokens SET revoked_at = now\(\)\s+WHERE employee_id/i.test(text)) {
      revokeCalled = true
      revokeEmployeeId = params?.[0]
      return { rows: [] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('auth', {
        employeeId: 17,
        employeeCode: 'NV017',
        roles: [],
        isRoot: false,
        isAdmin: false,
        permissions: [],
      })
      await next()
    })
    app.route('/api/auth', authRoutes)

    const res = await app.request('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'OldPass123', newPassword: 'NewPass456' }),
    })

    assert.equal(res.status, 200)
    assert.ok(revokeCalled, 'phải revoke refresh token sau đổi mật khẩu')
    assert.equal(revokeEmployeeId, 17)
  } finally {
    pool.query = original
  }
}

await testRevokesRefreshTokensOnPasswordChange()
console.log('auth.change-password revoke test passed')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx server/routes/auth.change-password.test.ts`
Expected: FAIL — `revokeCalled` false vì handler chưa revoke token.

- [ ] **Step 3: Thêm revoke vào handler change-password**

Trong `server/routes/auth.ts`, handler `change-password`, sau khối UPDATE password thành công (ngay trước `return c.json({ message: 'Đổi mật khẩu thành công', error: false })`), thêm:

```typescript
    try {
      await query(
        `UPDATE auth_refresh_tokens SET revoked_at = now()
         WHERE employee_id = $1 AND revoked_at IS NULL`,
        [employeeId]
      )
    } catch (revokeErr) {
      console.warn('Change password: failed to revoke refresh tokens:', revokeErr)
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx server/routes/auth.change-password.test.ts`
Expected: PASS — in "auth.change-password revoke test passed"

- [ ] **Step 5: Commit**

```bash
git add server/routes/auth.ts server/routes/auth.change-password.test.ts
git commit -m "feat(auth): thu hồi refresh token khi nhân viên tự đổi mật khẩu"
```

---

## Task 5: Endpoint logout-all-devices (backend)

**Files:**
- Modify: `server/routes/auth.ts` (thêm route mới, đặt cạnh `auth.post('/logout', ...)`)
- Test: `server/routes/auth.logout-all.test.ts`

**Interfaces:**
- Consumes: `query` từ `../db/query`; `c.get('auth').employeeId` từ authMiddleware (route này KHÔNG nằm trong `PUBLIC_AUTH_PATHS` nên đã qua authMiddleware).
- Produces: `POST /api/auth/logout-all-devices` → 200 `{ error: false, message: 'Đã đăng xuất khỏi tất cả thiết bị' }`; revoke mọi refresh token chưa revoke của nhân viên gọi.

- [ ] **Step 1: Write the failing test**

Create `server/routes/auth.logout-all.test.ts`:

```typescript
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { pool } from '../db/pool'
import type { AppEnv } from '../types/hono-env'
import authRoutes from './auth'

process.env.JWT_SIGNING_SECRET = process.env.JWT_SIGNING_SECRET || 'test-secret-min-32-characters-long-aaaaaa'

async function testRevokesAllForCallingEmployee() {
  const original = pool.query
  let revokedEmployeeId: unknown = null

  pool.query = (async (text: string, params?: unknown[]) => {
    if (/UPDATE auth_refresh_tokens SET revoked_at = now\(\)\s+WHERE employee_id/i.test(text)) {
      revokedEmployeeId = params?.[0]
      return { rows: [] }
    }
    return { rows: [] }
  }) as unknown as typeof pool.query

  try {
    const app = new Hono<AppEnv>()
    app.use('*', async (c, next) => {
      c.set('auth', {
        employeeId: 42,
        employeeCode: 'NV042',
        roles: [],
        isRoot: false,
        isAdmin: false,
        permissions: [],
      })
      await next()
    })
    app.route('/api/auth', authRoutes)

    const res = await app.request('/api/auth/logout-all-devices', { method: 'POST' })
    assert.equal(res.status, 200)
    assert.equal(revokedEmployeeId, 42)
  } finally {
    pool.query = original
  }
}

await testRevokesAllForCallingEmployee()
console.log('auth.logout-all test passed')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx server/routes/auth.logout-all.test.ts`
Expected: FAIL — route chưa tồn tại, `app.request` trả 404, assert 200 fail.

- [ ] **Step 3: Thêm route logout-all-devices**

Trong `server/routes/auth.ts`, ngay sau khối `auth.post('/logout', ...)` (kết thúc dòng ~279), thêm:

```typescript
auth.post('/logout-all-devices', async (c) => {
  const { employeeId } = c.get('auth')

  try {
    await query(
      `UPDATE auth_refresh_tokens SET revoked_at = now()
       WHERE employee_id = $1 AND revoked_at IS NULL`,
      [employeeId]
    )
  } catch (revokeErr) {
    console.warn('Logout all devices: failed to revoke refresh tokens:', revokeErr)
    return c.json({ error: true, message: 'Không thể đăng xuất khỏi các thiết bị' }, 500)
  }

  return c.json({ error: false, message: 'Đã đăng xuất khỏi tất cả thiết bị' })
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx server/routes/auth.logout-all.test.ts`
Expected: PASS — in "auth.logout-all test passed"

- [ ] **Step 5: Verify type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/routes/auth.ts server/routes/auth.logout-all.test.ts
git commit -m "feat(auth): endpoint logout-all-devices thu hồi mọi phiên của nhân viên"
```

---

## Task 6: Frontend — xử lý 409 ở /refresh client

**Files:**
- Modify: `src/services/api.ts` (hàm `requestTokenRefresh` dòng ~140-177, và `getRefreshedAccessToken` dòng ~179-232)

**Interfaces:**
- Consumes: response 409 từ `POST /api/auth/refresh` (body `{ error: true, message }`)
- Produces: khi gặp 409, đợi ngắn rồi đọc lại access token từ localStorage (do tab/thắng-race đã `setTokens`); nếu có token còn hạn thì trả về, ngược lại retry refresh 1 lần.

- [ ] **Step 1: Thêm nhánh xử lý 409 trong requestTokenRefresh**

Trong `src/services/api.ts`, hàm `requestTokenRefresh`, sau khối `if (!response.ok) { ... }` hiện tại — cụ thể TRƯỚC dòng `if (response.status === 401 || response.status === 403)`, thêm nhánh 409. Khối hiện tại:

```typescript
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new SessionExpiredError()
    }
    throw new Error(getErrorMessageFromPayload(payload) || 'Lỗi khi làm mới phiên')
  }
```

Đổi thành:

```typescript
  if (!response.ok) {
    if (response.status === 409) {
      throw new RefreshInProgressError()
    }
    if (response.status === 401 || response.status === 403) {
      throw new SessionExpiredError()
    }
    throw new Error(getErrorMessageFromPayload(payload) || 'Lỗi khi làm mới phiên')
  }
```

- [ ] **Step 2: Khai báo RefreshInProgressError**

Trong `src/services/api.ts`, sau class `NetworkError` (dòng ~34-39), thêm:

```typescript
export class RefreshInProgressError extends Error {
  constructor() {
    super('Đang làm mới phiên, vui lòng thử lại')
    this.name = 'RefreshInProgressError'
  }
}
```

- [ ] **Step 3: Bắt RefreshInProgressError trong doRefresh**

Trong `getRefreshedAccessToken`, khối `try { const data = await requestTokenRefresh(refreshToken) ... } catch (error) { ... }` (dòng ~204-223). Thêm xử lý ở đầu `catch (error)` — ngay sau dòng `} catch (error) {`:

```typescript
        if (error instanceof RefreshInProgressError) {
          await new Promise(r => setTimeout(r, CROSS_TAB_WAIT_MS))
          const synced = getAccessToken()
          if (synced && !isTokenExpiringSoon(synced)) {
            return synced
          }
          const retryRefreshToken = getRefreshToken()
          if (!retryRefreshToken) {
            throw new SessionExpiredError()
          }
          const retryData = await requestTokenRefresh(retryRefreshToken)
          setTokens({ accessToken: retryData.accessToken, refreshToken: retryData.refreshToken })
          scheduleRefresh(retryData.expiresAt)
          return retryData.accessToken
        }
```

- [ ] **Step 4: Verify type-check**

Run: `npm run type-check`
Expected: PASS (không lỗi mới ở `src/services/api.ts`)

- [ ] **Step 5: Commit**

```bash
git add src/services/api.ts
git commit -m "feat(auth): client xử lý 409 refresh (đợi sync token rồi retry)"
```

---

## Task 7: Frontend — authService.logoutAllDevices()

**Files:**
- Modify: `src/services/authService.ts` (thêm method trong class `AuthService`)

**Interfaces:**
- Consumes: `fetchApi` từ `./api` (đã import dòng 1)
- Produces: `authService.logoutAllDevices(): Promise<{ error: string | null }>`

- [ ] **Step 1: Thêm method logoutAllDevices**

Trong `src/services/authService.ts`, trong class `AuthService`, ngay sau method `signOut()` (dòng ~85-87), thêm:

```typescript
  async logoutAllDevices(): Promise<{ error: string | null }> {
    try {
      const response = await fetchApi<AuthActionResponse>('/api/auth/logout-all-devices', {
        method: 'POST',
      })
      if (response.error === true || typeof response.error === 'string') {
        return {
          error:
            response.message ||
            (typeof response.error === 'string' ? response.error : 'Không thể đăng xuất khỏi các thiết bị'),
        }
      }
      return { error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ'
      return { error: message }
    }
  }
```

- [ ] **Step 2: Verify type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/services/authService.ts
git commit -m "feat(auth): authService.logoutAllDevices gọi endpoint thu hồi mọi phiên"
```

---

## Task 8: Frontend — nút "Đăng xuất mọi thiết bị" trong UserMenu

**Files:**
- Modify: `src/components/UserMenu.vue`

**Interfaces:**
- Consumes: `authService.logoutAllDevices()`, `useConfirm()`, `useSnackbar()`, `signOut` từ `useAuth()`
- Produces: nút trong menu; sau khi thu hồi mọi thiết bị thành công → gọi `signOut()` để chính thiết bị hiện tại cũng về `/login`.

- [ ] **Step 1: Thêm import và handler trong `<script setup>`**

Trong `src/components/UserMenu.vue`, khối `<script setup lang="ts">`. Sau dòng `import { useAuth } from '@/composables/useAuth'` thêm:

```typescript
import { authService } from '@/services/authService'
import { useConfirm } from '@/composables/useConfirm'
import { useSnackbar } from '@/composables/useSnackbar'
```

Sau dòng `const { employee, isAuthenticated, signOut } = useAuth()` thêm:

```typescript
const { confirm } = useConfirm()
const snackbar = useSnackbar()
```

Sau hàm `handleLogout` (dòng ~128-130) thêm:

```typescript
async function handleLogoutAllDevices() {
  const ok = await confirm({
    title: 'Đăng xuất mọi thiết bị',
    message: 'Bạn sẽ bị đăng xuất khỏi tất cả thiết bị đang đăng nhập, kể cả thiết bị này. Tiếp tục?',
    type: 'warning',
    confirmText: 'Đăng xuất tất cả',
  })
  if (!ok) return

  const { error } = await authService.logoutAllDevices()
  if (error) {
    snackbar.error(error)
    return
  }
  await signOut()
}
```

- [ ] **Step 2: Thêm mục menu trong template**

Trong `src/components/UserMenu.vue`, trong `<q-list>`, NGAY TRƯỚC mục "Đăng xuất" (`<q-item ... @click="handleLogout">`), thêm:

```vue
        <q-item
          v-close-popup
          clickable
          @click="handleLogoutAllDevices"
        >
          <q-item-section avatar>
            <q-icon
              name="devices"
              color="warning"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>Đăng xuất mọi thiết bị</q-item-label>
          </q-item-section>
        </q-item>
```

- [ ] **Step 3: Verify type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Verify lint**

Run: `npm run lint`
Expected: PASS (không lỗi mới ở `UserMenu.vue`)

- [ ] **Step 5: Commit**

```bash
git add src/components/UserMenu.vue
git commit -m "feat(auth): nút Đăng xuất mọi thiết bị trong UserMenu"
```

---

## Task 9: Verify tích hợp & build

**Files:** (không sửa code — kiểm tra tổng thể)

- [ ] **Step 1: Chạy lại toàn bộ test backend mới**

Run:
```bash
npx tsx server/auth/refresh-grace-cache.test.ts
npx tsx server/routes/auth.refresh.test.ts
npx tsx server/routes/auth.change-password.test.ts
npx tsx server/routes/auth.logout-all.test.ts
```
Expected: cả 4 in dòng "... passed", exit code 0.

- [ ] **Step 2: Type-check + build frontend**

Run: `npm run build`
Expected: PASS (type-check + vite build không lỗi)

- [ ] **Step 3: Verify thủ công sliding + reboot (smoke test thật, DB local)**

Thực hiện tay (ghi lại kết quả):
1. `npm run dev:all`, đăng nhập bằng tài khoản test.
2. Kiểm DB: `PGPASSWORD=postgres psql -h 127.0.0.1 -p 5432 -U postgres -d datchi -c "SELECT id, employee_id, expires_at FROM auth_refresh_tokens WHERE revoked_at IS NULL ORDER BY created_at DESC LIMIT 1;"` → `expires_at` cách hiện tại ~90 ngày.
3. Dừng server (Ctrl+C) rồi `npm run server` lại; reload trang → vẫn đăng nhập (không về /login).
4. Mở 2 tab cùng lúc, để access token gần hết hạn (hoặc đợi scheduler) → cả 2 tab vẫn hoạt động, DB không bị revoke hàng loạt cùng timestamp.

Expected: vẫn đăng nhập sau restart; không bị đá ra khi đa-tab refresh.

- [ ] **Step 4: Commit (nếu có điều chỉnh nhỏ phát sinh)**

```bash
git add -A
git commit -m "test(auth): verify tích hợp session persistence (sliding + race + reboot)"
```

---

## Self-Review

**Spec coverage:**
- R1 sliding vô thời hạn → Task 2 (TTL 90d) + Task 3 (rotate cấp `expires_at = now+90d` mỗi lần refresh). ✔
- R2 sống qua reboot → Task 2 (`.env` secret + TTL cố định) + Task 9 step 3 (smoke test restart). Secret fail-fast đã có sẵn trong `jwt.ts` (`getSigningKey` throw) — ghi rõ ở Global Constraints. ✔
- R3a đổi/reset mật khẩu → Task 4 (tự đổi); reset admin đã có sẵn trong code. ✔
- R3b khóa/xóa tài khoản → đã có trong handler `/refresh` mới (nhánh `account_gone`/`account_inactive`, Task 3). ✔
- R3c idle 90 ngày → Task 2 (refresh token hết hạn tự nhiên; nhánh `expires_at <= now` trả 401 trong Task 3). ✔
- R3d logout-all-devices → Task 5 (backend) + Task 7/8 (frontend). ✔
- R4 đa thiết bị → mô hình token theo dòng + logout-all theo `employee_id` (Task 5). ✔
- 5.2 chống race (atomic CAS + transaction + grace 30s) → Task 1 + Task 3. ✔
- 5.5 phân loại lỗi 401-vs-network giữ nguyên ở client; thêm 409 → Task 6. ✔

**Placeholder scan:** không có TBD/TODO; mọi step code đều có code thật. ✔

**Type consistency:**
- `recordRotation`/`getGraceChild` chữ ký nhất quán Task 1 ↔ Task 3 (`{ token, refreshToken, expiresAt }`). ✔
- `RefreshInProgressError` khai báo (Task 6 step 2) trước khi dùng (step 1/3). ✔
- `useConfirm()` trả `{ confirm }` (xác nhận từ `src/composables/useConfirm.ts`), Task 8 dùng `confirm({...})` đúng `ConfirmOptions`. ✔
- `tx(fn)` truyền `PoolClient` có `.query` — Task 3 dùng `client.query(...)` đúng. ✔
- Test mock `pool.query`/`pool.connect` theo pattern `transfer-reserved.test.ts`. ✔

**Lưu ý người thực thi:**
- Grace cache là in-memory (per-process): restart server xóa cache — chấp nhận được vì cửa sổ 30s rất ngắn; nếu đúng lúc đó có request thua thì cùng lắm 1 lần thử lại/đăng nhập, không ảnh hưởng token đã lưu DB.
- Task 6 step 3: đặt nhánh `RefreshInProgressError` Ở ĐẦU `catch (error)` trong `doRefresh`, trước các nhánh `SessionExpiredError`/`NetworkError` hiện có, để không bị nuốt nhầm.
