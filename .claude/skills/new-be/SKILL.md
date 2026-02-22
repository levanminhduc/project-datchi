# Skill: /new-be

Tao backend (Hono routes + types + validation) cho du an Dat Chi - Thread Inventory Management System.

Khi user goi `/new-be [mo ta]`, tuan thu TOAN BO huong dan ben duoi.

---

## BUOC 1: TYPES (Backend Types)

### File location
```
server/types/ten-tinh-nang.ts
```

### Template
```typescript
export interface TenBangRow {
  id: number
  code: string
  name: string
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateTenBangDTO {
  code: string
  name: string
  notes?: string
}

export interface UpdateTenBangDTO extends Partial<CreateTenBangDTO> {
  is_active?: boolean
}

export interface TenBangFilters {
  search?: string
  status?: string
  is_active?: boolean
}
```

**KHONG tao ApiResponse rieng cho moi file.** Dung shared type:
```typescript
import type { ApiResponse } from '../types/employee'
```

Shared type (`server/types/employee.ts` - da co san):
```typescript
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
```

---

## BUOC 2: VALIDATION (Zod Schemas)

### File location
```
server/validation/tenTinhNang.ts
```

### Pattern - Dung .safeParse() (KHONG phai .parse())

> **Note:** Simple CRUD routes cu co the dung inline validation. Routes moi NEN dung Zod file rieng theo pattern nay.

```typescript
import { z } from 'zod'

export const CreateTenBangSchema = z.object({
  code: z.string().trim().min(1, 'Ma khong duoc de trong'),
  name: z.string().trim().min(1, 'Ten khong duoc de trong'),
  notes: z.string().optional().nullable(),
})

export const UpdateTenBangSchema = CreateTenBangSchema.partial()

export const TenBangFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type CreateTenBangInput = z.infer<typeof CreateTenBangSchema>
export type TenBangFiltersInput = z.infer<typeof TenBangFiltersSchema>
```

### Validation helper (dung chung)
```typescript
function handleValidation<T>(schema: z.ZodSchema<T>, data: unknown, c: Context) {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map(e => e.message).join(', '),
    }
  }
  return { success: true, data: result.data }
}
```

### Zod patterns nang cao
```typescript
z.coerce.number()
z.coerce.boolean()

const FormSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Mat khau khong khop', path: ['confirmPassword'] }
)

z.string()
  .transform((val) => val.trim().toUpperCase())
  .pipe(z.string().min(1))
```

---

## BUOC 3: BACKEND ROUTES (Hono)

### File location
```
server/routes/tenTinhNang.ts
```

### Dang ky route trong `server/index.ts`
```typescript
import tenTinhNangRouter from './routes/tenTinhNang'
app.route('/api/ten-tinh-nang', tenTinhNangRouter)
```

### THU TU ROUTE (CRITICAL - Hono match theo thu tu dang ky)
```
1. Static helper endpoints: /options, /count, /form-data
2. GET /           (list)
3. POST /          (create)
4. Nested static:  /conflicts, /summary
5. GET /:id        (get single)
6. PUT /:id        (update)
7. DELETE /:id     (soft delete)
8. POST /:id/action (workflow: /:id/confirm, /:id/approve, /:id/cancel)
```

### Route template - Level 1: Simple CRUD
```typescript
import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import type { ApiResponse } from '../types/employee'
import { CreateTenBangSchema, UpdateTenBangSchema, TenBangFiltersSchema } from '../validation/tenTinhNang'

const tenTinhNang = new Hono()

tenTinhNang.get('/', requirePermission('ten_tinh_nang.view'), async (c) => {
  try {
    const query = c.req.query()
    const result = TenBangFiltersSchema.safeParse(query)
    if (!result.success) {
      return c.json<ApiResponse<null>>({
        data: null,
        error: result.error.errors.map(e => e.message).join(', '),
      }, 400)
    }
    const filters = result.data

    let queryBuilder = supabase
      .from('ten_bang')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (filters.search) {
      queryBuilder = queryBuilder.or(
        `code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`
      )
    }
    if (filters.status) {
      queryBuilder = queryBuilder.eq('status', filters.status)
    }
    if (filters.from) {
      queryBuilder = queryBuilder.gte('created_at', filters.from)
    }
    if (filters.to) {
      queryBuilder = queryBuilder.lte('created_at', filters.to)
    }

    const offset = (filters.page - 1) * filters.limit
    queryBuilder = queryBuilder.range(offset, offset + filters.limit - 1)

    const { data, error, count } = await queryBuilder

    if (error) throw error

    return c.json<ApiResponse<any>>({
      data: {
        data: data || [],
        total: count || 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil((count || 0) / filters.limit),
      },
      error: null,
    })
  } catch (err) {
    console.error('Loi lay danh sach:', err)
    return c.json<ApiResponse<null>>({ data: null, error: 'Loi he thong' }, 500)
  }
})

tenTinhNang.post('/', async (c) => {
  try {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json<ApiResponse<null>>({ data: null, error: 'Du lieu gui len khong hop le' }, 400)
    }
    const result = CreateTenBangSchema.safeParse(body)
    if (!result.success) {
      return c.json<ApiResponse<null>>({
        data: null,
        error: result.error.errors.map(e => e.message).join(', '),
      }, 400)
    }

    const { data: existing } = await supabase
      .from('ten_bang')
      .select('id')
      .eq('code', result.data.code)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return c.json<ApiResponse<null>>({ data: null, error: 'Ma da ton tai' }, 409)
    }

    const { data, error } = await supabase
      .from('ten_bang')
      .insert(result.data)
      .select()
      .single()

    if (error) throw error

    return c.json<ApiResponse<any>>({ data, error: null }, 201)
  } catch (err) {
    console.error('Loi tao moi:', err)
    return c.json<ApiResponse<null>>({ data: null, error: 'Loi he thong' }, 500)
  }
})

tenTinhNang.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json<ApiResponse<null>>({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data, error } = await supabase
      .from('ten_bang')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ApiResponse<null>>({ data: null, error: 'Khong tim thay' }, 404)
      }
      throw error
    }

    return c.json<ApiResponse<any>>({ data, error: null })
  } catch (err) {
    console.error('Loi lay chi tiet:', err)
    return c.json<ApiResponse<null>>({ data: null, error: 'Loi he thong' }, 500)
  }
})

tenTinhNang.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json<ApiResponse<null>>({ data: null, error: 'ID khong hop le' }, 400)
    }

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json<ApiResponse<null>>({ data: null, error: 'Du lieu gui len khong hop le' }, 400)
    }

    const result = UpdateTenBangSchema.safeParse(body)
    if (!result.success) {
      return c.json<ApiResponse<null>>({
        data: null,
        error: result.error.errors.map(e => e.message).join(', '),
      }, 400)
    }

    const { data: existing } = await supabase
      .from('ten_bang')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      return c.json<ApiResponse<null>>({ data: null, error: 'Khong tim thay' }, 404)
    }

    const { data, error } = await supabase
      .from('ten_bang')
      .update(result.data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return c.json<ApiResponse<any>>({ data, error: null })
  } catch (err) {
    console.error('Loi cap nhat:', err)
    return c.json<ApiResponse<null>>({ data: null, error: 'Loi he thong' }, 500)
  }
})

tenTinhNang.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json<ApiResponse<null>>({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data: existing } = await supabase
      .from('ten_bang')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      return c.json<ApiResponse<null>>({ data: null, error: 'Khong tim thay' }, 404)
    }

    const { error } = await supabase
      .from('ten_bang')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return c.json<ApiResponse<null>>({ data: null, error: null, message: 'Da xoa thanh cong' })
  } catch (err) {
    console.error('Loi xoa:', err)
    return c.json<ApiResponse<null>>({ data: null, error: 'Loi he thong' }, 500)
  }
})

export default tenTinhNang
```

### Route template - Level 2: Workflow (status transitions)
```typescript
tenTinhNang.post('/:id/confirm', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json<ApiResponse<null>>({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data: item } = await supabase
      .from('ten_bang')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!item) {
      return c.json<ApiResponse<null>>({ data: null, error: 'Khong tim thay' }, 404)
    }

    if (item.status !== 'DRAFT') {
      return c.json<ApiResponse<null>>({ data: null, error: 'Chi co the xac nhan tu trang thai Nhap' }, 400)
    }

    const { data, error } = await supabase
      .from('ten_bang')
      .update({ status: 'CONFIRMED' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return c.json<ApiResponse<any>>({ data, error: null })
  } catch (err) {
    console.error('Loi xac nhan:', err)
    return c.json<ApiResponse<null>>({ data: null, error: 'Loi he thong' }, 500)
  }
})
```

### Route template - Level 3: Batch Operations (reference)

Level 3 danh cho cac tinh nang xu ly batch items (stock, batch - xu ly array items). Pattern: ket hop Level 1 CRUD voi array-based insert/update. Xem `server/routes/stock.ts` lam reference.

### Route template - RPC call
```typescript
tenTinhNang.post('/:id/execute', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const { data: result, error: rpcError } = await supabase.rpc('fn_execute_action', {
      p_id: id,
    })

    if (rpcError) throw rpcError

    if (!result.success) {
      return c.json<ApiResponse<null>>({ data: null, error: result.message }, 400)
    }

    return c.json<ApiResponse<any>>({ data: result.data || result, error: null })
  } catch (err) {
    console.error('Loi thuc hien:', err)
    return c.json<ApiResponse<null>>({ data: null, error: 'Loi he thong' }, 500)
  }
})
```

### Route template - Cascading select options
```typescript
tenTinhNang.get('/options', async (c) => {
  try {
    const parentId = c.req.query('parent_id')

    let queryBuilder = supabase
      .from('child_table')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')

    if (parentId) {
      queryBuilder = queryBuilder.eq('parent_id', parseInt(parentId))
    }

    const { data, error } = await queryBuilder
    if (error) throw error

    return c.json<ApiResponse<any>>({ data: data || [], error: null })
  } catch (err) {
    console.error('Loi lay options:', err)
    return c.json<ApiResponse<null>>({ data: null, error: 'Loi he thong' }, 500)
  }
})
```

---

## Notification integration (khi can)

```typescript
import { createNotification, broadcastNotification, getWarehouseEmployeeIds } from '../utils/notificationService'

createNotification({
  employeeId: item.created_by,
  type: 'TEN_TYPE',
  title: `Yeu cau #${id} da duoc duyet`,
  actionUrl: '/thread/ten-tinh-nang',
}).catch(() => {})
```

---

## Response format

LUON tra ve:
```json
{ "data": {...}, "error": null, "message": "Thong bao (optional)" }
{ "data": null, "error": "Thong bao loi" }
```

**KHONG dung `{ success, data, error }`.** Truong `success` chi ton tai trong stock.ts (ngoai le).

---

## Auth & Permissions

> **QUAN TRONG:** Du an da co global `authMiddleware` via `except()` trong `server/index.ts`. KHONG can them `app.use('*', authMiddleware)` trong route files. Chi can them `requirePermission()` cho tung endpoint.

> **`fetchApi()` da tu dong gui token.** File `src/services/api.ts` tu dong doc `auth_access_token` tu localStorage va gui `Authorization: Bearer <token>`. KHONG can gui token thu cong trong service files.

```typescript
import { requirePermission } from '../middleware/auth'

app.get('/', requirePermission('ten_tinh_nang.view'), async (c) => { ... })
app.post('/', requirePermission('ten_tinh_nang.create'), async (c) => { ... })
app.put('/:id', requirePermission('ten_tinh_nang.edit'), async (c) => { ... })
app.delete('/:id', requirePermission('ten_tinh_nang.delete'), async (c) => { ... })
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
