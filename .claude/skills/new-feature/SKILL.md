# Skill: /new-feature

Tao tinh nang moi cho du an Dat Chi - Thread Inventory Management System.

Khi user goi `/new-feature [mo ta tinh nang]`, tuan thu TOAN BO huong dan ben duoi.

---

## BUOC 0: PHAN TICH YEU CAU

Truoc khi code:
1. Dien giai lai yeu cau bang tieng Viet
2. Xac dinh scope: Database / Backend / Frontend / Tat ca
3. Xac dinh complexity level:
   - **Level 1: Simple CRUD** (master data: colors, suppliers, positions)
   - **Level 2: CRUD + Workflow** (allocations, issues - co status transitions)
   - **Level 3: Batch Operations** (stock, batch - xu ly array items)
4. Hoi user xac nhan truoc khi bat tay vao lam
5. Neu tinh nang co nhieu sub-features → de xuat **Tab layout**

---

## BUOC 1: DATABASE (Migration)

### File location
```
supabase/migrations/YYYYMMDD_ten_tinh_nang.sql
```

### Quy tac
- Table name: `snake_case`
- LUON co `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `deleted_at TIMESTAMPTZ DEFAULT NULL`
- View: prefix `v_` (vi du: `v_inventory_summary`)
- Function: prefix `fn_` (vi du: `fn_calculate_stock`)
- Trigger: `trigger_[table]_updated_at` cho auto-update `updated_at`
- ENUM: dung `CREATE TYPE` voi values UPPERCASE, type name lowercase
- Primary key: `SERIAL` (KHONG phai UUID)
- FK: inline `REFERENCES table(id)` voi ON DELETE phu hop
- Index: `idx_[table]_[column]`
- Comment: `COMMENT ON TABLE/COLUMN` bang tieng Viet
- Cuoi migration: `NOTIFY pgrst, 'reload schema';`

### Template migration - Basic Table
```sql
CREATE TYPE ten_status AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS ten_bang (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status ten_status NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

COMMENT ON TABLE ten_bang IS 'Mo ta bang bang tieng Viet';

CREATE TRIGGER trigger_ten_bang_updated_at
    BEFORE UPDATE ON ten_bang
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

CREATE INDEX idx_ten_bang_status ON ten_bang(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_ten_bang_code ON ten_bang(code);

ALTER PUBLICATION supabase_realtime ADD TABLE ten_bang;

NOTIFY pgrst, 'reload schema';
```

### Template - ENUM
```sql
DO $$ BEGIN
    CREATE TYPE ten_status AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

Them value sau:
```sql
ALTER TYPE ten_status ADD VALUE IF NOT EXISTS 'NEW_VALUE';
```

### Template - RPC Function
```sql
CREATE OR REPLACE FUNCTION fn_verb_noun(
    p_param1 INTEGER,
    p_param2 TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result RECORD;
    v_count INTEGER;
BEGIN
    SELECT * INTO v_result
    FROM ten_bang
    WHERE id = p_param1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Khong tim thay');
    END IF;

    UPDATE ten_bang SET status = 'CONFIRMED' WHERE id = p_param1;

    RETURN json_build_object('success', true, 'data', row_to_json(v_result), 'message', 'Thanh cong');

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Loi: ' || SQLERRM);
END;
$$;
```

### Template - View
```sql
CREATE OR REPLACE VIEW v_ten_summary AS
WITH base AS (
    SELECT t.*, tt.name AS type_name
    FROM ten_bang t
    LEFT JOIN thread_types tt ON t.thread_type_id = tt.id
    WHERE t.deleted_at IS NULL
)
SELECT * FROM base;

COMMENT ON VIEW v_ten_summary IS 'View tong hop';
```

### Template - Audit Trigger
```sql
CREATE TRIGGER trigger_ten_bang_audit
    AFTER INSERT OR UPDATE OR DELETE ON ten_bang
    FOR EACH ROW
    EXECUTE FUNCTION fn_thread_audit_trigger_func();
```

---

## BUOC 2: TYPES (Shared Types)

### Backend types
```
server/types/ten-tinh-nang.ts
```

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
import type { ApiResponse } from '../types/api'
```

Shared type (`server/types/api.ts`):
```typescript
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

### Frontend types
```
src/types/thread/tenTinhNang.ts
```

```typescript
export enum TenStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export interface TenBang {
  id: number
  code: string
  name: string
  status: TenStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateTenBangDTO {
  code: string
  name: string
  notes?: string
}

export interface TenBangFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  from?: string
  to?: string
}

export interface TenBangListResponse {
  data: TenBang[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

Export tu `src/types/thread/index.ts`:
```typescript
export * from './tenTinhNang'
```

---

## BUOC 3: VALIDATION (Zod Schemas)

### File location
```
server/validation/tenTinhNang.ts
```

### Pattern - Dung .safeParse() (KHONG phai .parse())
```typescript
import { z } from 'zod'

export const CreateTenBangSchema = z.object({
  code: z.string().min(1, 'Ma khong duoc de trong').trim(),
  name: z.string().min(1, 'Ten khong duoc de trong').trim(),
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

## BUOC 4: BACKEND (Hono Routes)

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
import type { ApiResponse } from '../types/api'
import { CreateTenBangSchema, TenBangFiltersSchema } from '../validation/tenTinhNang'

const tenTinhNang = new Hono()

tenTinhNang.get('/', async (c) => {
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
    const body = await c.req.json()
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

    const body = await c.req.json()

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
      .update(body)
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

    const { error } = await supabase
      .from('ten_bang')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .is('deleted_at', null)

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

### Notification integration (khi can)
```typescript
import { createNotification, broadcastNotification, getWarehouseEmployeeIds } from '../utils/notificationService'

createNotification({
  employeeId: item.created_by,
  type: 'TEN_TYPE',
  title: `Yeu cau #${id} da duoc duyet`,
  actionUrl: '/thread/ten-tinh-nang',
}).catch(() => {})
```

### Response format LUON la:
```json
{ "data": {...}, "error": null }
{ "data": null, "error": "Thong bao loi" }
```

**KHONG dung `{ success, data, error }`.** Truong `success` chi ton tai trong stock.ts (ngoai le).

---

## BUOC 5: SERVICE (Frontend API Client)

### File location
```
src/services/tenTinhNangService.ts
```

### Pattern
```typescript
import { fetchApi } from './api'
import type {
  TenBang,
  CreateTenBangDTO,
  TenBangFilters,
  TenBangListResponse,
} from '@/types/thread/tenTinhNang'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/ten-tinh-nang'

function buildQueryString(filters?: TenBangFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.search) params.append('search', filters.search)
  if (filters.status) params.append('status', filters.status)
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const tenTinhNangService = {
  async list(filters?: TenBangFilters): Promise<TenBangListResponse> {
    const response = await fetchApi<ApiResponse<TenBangListResponse>>(
      `${BASE}${buildQueryString(filters)}`
    )
    if (response.error) throw new Error(response.error)
    return response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  },

  async getById(id: number): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(`${BASE}/${id}`)
    if (response.error || !response.data) throw new Error(response.error || 'Khong tim thay')
    return response.data
  },

  async create(data: CreateTenBangDTO): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.error || !response.data) throw new Error(response.error || 'Khong the tao')
    return response.data
  },

  async update(id: number, data: Partial<TenBang>): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (response.error || !response.data) throw new Error(response.error || 'Khong the cap nhat')
    return response.data
  },

  async delete(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<null>>(`${BASE}/${id}`, {
      method: 'DELETE',
    })
    if (response.error) throw new Error(response.error)
  },

  async confirm(id: number): Promise<TenBang> {
    const response = await fetchApi<ApiResponse<TenBang>>(`${BASE}/${id}/confirm`, {
      method: 'POST',
    })
    if (response.error || !response.data) throw new Error(response.error || 'Khong the xac nhan')
    return response.data
  },

  async getOptions(parentId?: number): Promise<{ id: number; name: string }[]> {
    const qs = parentId ? `?parent_id=${parentId}` : ''
    const response = await fetchApi<ApiResponse<any[]>>(`${BASE}/options${qs}`)
    if (response.error) throw new Error(response.error)
    return response.data || []
  },
}
```

---

## BUOC 6: COMPOSABLE (State Management)

### File location
```
src/composables/[module]/useTenTinhNang.ts
```

### Pattern - Instance-level state (default)
```typescript
import { ref, computed } from 'vue'
import { tenTinhNangService } from '@/services/tenTinhNangService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  TenBang,
  CreateTenBangDTO,
  TenBangFilters,
} from '@/types/thread/tenTinhNang'

export function useTenTinhNang() {
  const items = ref<TenBang[]>([])
  const currentItem = ref<TenBang | null>(null)
  const total = ref(0)
  const filters = ref<TenBangFilters>({ page: 1, limit: 20 })

  const snackbar = useSnackbar()
  const loading = useLoading()

  const isLoading = computed(() => loading.isLoading.value)

  const fetchList = async (newFilters?: Partial<TenBangFilters>) => {
    try {
      if (newFilters) filters.value = { ...filters.value, ...newFilters }
      const result = await loading.withLoading(() =>
        tenTinhNangService.list(filters.value)
      )
      items.value = result.data
      total.value = result.total
    } catch (err) {
      snackbar.error(getErrorMessage(err))
    }
  }

  const fetchById = async (id: number) => {
    try {
      currentItem.value = await loading.withLoading(() =>
        tenTinhNangService.getById(id)
      )
    } catch (err) {
      snackbar.error(getErrorMessage(err))
    }
  }

  const create = async (data: CreateTenBangDTO) => {
    try {
      const result = await loading.withLoading(() =>
        tenTinhNangService.create(data)
      )
      snackbar.success('Tao thanh cong')
      return result
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  const update = async (id: number, data: Partial<TenBang>) => {
    try {
      const result = await loading.withLoading(() =>
        tenTinhNangService.update(id, data)
      )
      snackbar.success('Cap nhat thanh cong')
      return result
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  const remove = async (id: number) => {
    try {
      await loading.withLoading(() => tenTinhNangService.delete(id))
      snackbar.success('Xoa thanh cong')
      await fetchList()
    } catch (err) {
      snackbar.error(getErrorMessage(err))
    }
  }

  const confirm = async (id: number) => {
    try {
      const result = await loading.withLoading(() =>
        tenTinhNangService.confirm(id)
      )
      snackbar.success('Xac nhan thanh cong')
      return result
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  return {
    items,
    currentItem,
    total,
    filters,
    isLoading,
    fetchList,
    fetchById,
    create,
    update,
    remove,
    confirm,
  }
}
```

### Pattern - Module-level shared state (cho global state nhu auth, notifications)
```typescript
const state = ref<GlobalState>({ items: [] })
let initialized = false

export function useSharedState() {
  const init = async () => {
    if (initialized) return
    initialized = true
    // load data once
  }

  return {
    state: computed(() => state.value),
    init,
  }
}
```

---

## BUOC 7: FRONTEND PAGE

### File location (file-based routing voi unplugin-vue-router)
```
src/pages/[module]/ten-tinh-nang.vue        -> Route: /[module]/ten-tinh-nang
src/pages/[module]/ten-tinh-nang/index.vue  -> Route: /[module]/ten-tinh-nang
src/pages/[module]/ten-tinh-nang/[id].vue   -> Route: /[module]/ten-tinh-nang/:id
```

### Template - List Page (index.vue)

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useTenTinhNang } from '@/composables/[module]/useTenTinhNang'
import { useConfirm } from '@/composables/useConfirm'
import { usePermission } from '@/composables/usePermission'
import { PageHeader } from '@/components/ui/layout'
import AppInput from '@/components/ui/inputs/AppInput.vue'
import AppSelect from '@/components/ui/inputs/AppSelect.vue'
import AppButton from '@/components/ui/buttons/AppButton.vue'
import DataTable from '@/components/ui/tables/DataTable.vue'
import DatePicker from '@/components/ui/pickers/DatePicker.vue'
import type { QTableColumn, QTableProps } from 'quasar'
import { date } from 'quasar'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['ten_tinh_nang.view'],
    title: 'Tieu De Trang',
  }
})

const { confirmDelete } = useConfirm()
const { can } = usePermission()
const canCreate = can('ten_tinh_nang.create')
const canEdit = can('ten_tinh_nang.edit')
const canDelete = can('ten_tinh_nang.delete')

const {
  items,
  total,
  filters,
  isLoading,
  fetchList,
  create,
  update,
  remove,
} = useTenTinhNang()

const searchQuery = ref('')
const activeTab = ref('main')

const debouncedSearch = useDebounceFn(() => {
  fetchList({ search: searchQuery.value, page: 1 })
}, 300)

watch(searchQuery, () => debouncedSearch())

const statusOptions = [
  { value: 'DRAFT', label: 'Nhap' },
  { value: 'CONFIRMED', label: 'Da xac nhan' },
  { value: 'CANCELLED', label: 'Da huy' },
]

const statusColors: Record<string, string> = {
  DRAFT: 'grey',
  CONFIRMED: 'positive',
  CANCELLED: 'negative',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Nhap',
  CONFIRMED: 'Da xac nhan',
  CANCELLED: 'Da huy',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return date.formatDate(dateStr, 'DD/MM/YYYY')
}

const columns: QTableColumn[] = [
  { name: 'code', label: 'Ma', field: 'code', align: 'left', sortable: true },
  { name: 'name', label: 'Ten', field: 'name', align: 'left', sortable: true },
  { name: 'status', label: 'Trang thai', field: 'status', align: 'center' },
  { name: 'created_at', label: 'Ngay tao', field: 'created_at', align: 'center' },
  { name: 'actions', label: 'Thao tac', field: 'actions', align: 'center' },
]

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
})

const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formData = ref({ id: 0, code: '', name: '', notes: '' })

const openCreateDialog = () => {
  formMode.value = 'create'
  formData.value = { id: 0, code: '', name: '', notes: '' }
  showFormDialog.value = true
}

const openEditDialog = (item: any) => {
  formMode.value = 'edit'
  formData.value = { ...item }
  showFormDialog.value = true
}

const handleSubmit = async () => {
  if (formMode.value === 'create') {
    const result = await create(formData.value)
    if (result) {
      showFormDialog.value = false
      await fetchList()
    }
  } else {
    const result = await update(formData.value.id, formData.value)
    if (result) {
      showFormDialog.value = false
      await fetchList()
    }
  }
}

const handleDelete = async (item: any) => {
  const confirmed = await confirmDelete(item.name)
  if (confirmed) {
    await remove(item.id)
  }
}

const handleRequest = async (props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) => {
  const { page, rowsPerPage } = props.pagination
  await fetchList({ page, limit: rowsPerPage })
  pagination.value.page = page
  pagination.value.rowsPerPage = rowsPerPage
  pagination.value.rowsNumber = total.value
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <q-page padding>
    <PageHeader
      title="Tieu De Trang"
      subtitle="Mo ta ngan gon"
    >
      <template #actions>
        <AppButton
          v-if="canCreate.value"
          color="primary"
          icon="add"
          label="Them Moi"
          @click="openCreateDialog"
        />
      </template>
    </PageHeader>

    <q-card flat bordered>
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
      >
        <q-tab name="main" label="Danh sach" icon="list" />
        <q-tab name="history" label="Lich su" icon="history" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="main">
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-12 col-sm-4 col-md-3">
              <AppInput
                v-model="searchQuery"
                label="Tim kiem"
                dense
                clearable
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <AppSelect
                v-model="filters.status"
                label="Trang thai"
                :options="statusOptions"
                dense
                clearable
                @update:model-value="() => fetchList({ page: 1 })"
              />
            </div>
            <div class="col-12 col-sm-4 col-md-3">
              <AppInput v-model="filters.from" label="Tu ngay" dense readonly>
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <DatePicker v-model="filters.from" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </AppInput>
            </div>
          </div>

          <DataTable
            v-model:pagination="pagination"
            :rows="items"
            :columns="columns"
            row-key="id"
            :loading="isLoading"
            @request="handleRequest"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="statusColors[props.row.status] || 'grey'"
                  :label="statusLabels[props.row.status] || props.row.status"
                />
              </q-td>
            </template>

            <template #body-cell-created_at="props">
              <q-td :props="props">
                {{ formatDate(props.row.created_at) }}
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="row no-wrap justify-center q-gutter-xs">
                  <q-btn
                    v-if="canEdit.value"
                    flat round dense size="sm"
                    icon="edit" color="primary"
                    @click.stop="openEditDialog(props.row)"
                  >
                    <q-tooltip>Sua</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="canDelete.value"
                    flat round dense size="sm"
                    icon="delete" color="negative"
                    @click.stop="handleDelete(props.row)"
                  >
                    <q-tooltip>Xoa</q-tooltip>
                  </q-btn>
                </div>
              </q-td>
            </template>

            <template #empty-action>
              <AppButton
                v-if="canCreate.value"
                color="primary"
                label="Tao Moi"
                icon="add"
                @click="openCreateDialog"
              />
            </template>
          </DataTable>
        </q-tab-panel>

        <q-tab-panel name="history">
          <!-- Noi dung tab lich su -->
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-dialog v-model="showFormDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ formMode === 'create' ? 'Them Moi' : 'Chinh Sua' }}
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="handleSubmit">
            <div class="q-gutter-md">
              <AppInput
                v-model="formData.code"
                label="Ma *"
                :rules="[(v: string) => !!v || 'Khong duoc de trong']"
                :disable="formMode === 'edit'"
              />
              <AppInput
                v-model="formData.name"
                label="Ten *"
                :rules="[(v: string) => !!v || 'Khong duoc de trong']"
              />
              <AppInput
                v-model="formData.notes"
                label="Ghi chu"
                type="textarea"
                autogrow
              />
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Huy" v-close-popup />
          <AppButton
            color="primary"
            :label="formMode === 'create' ? 'Tao' : 'Cap Nhat'"
            :loading="isLoading"
            @click="handleSubmit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
```

### Template - Detail Page ([id].vue)

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTenTinhNang } from '@/composables/[module]/useTenTinhNang'
import { PageHeader } from '@/components/ui/layout'
import { date } from 'quasar'

definePage({
  meta: {
    requiresAuth: true,
    permissions: ['ten_tinh_nang.view'],
    title: 'Chi Tiet',
  }
})

const route = useRoute()
const router = useRouter()
const itemId = computed(() => Number(route.params.id))

const { currentItem, isLoading, fetchById } = useTenTinhNang()

const activeTab = ref('info')

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm')
}

onMounted(() => {
  fetchById(itemId.value)
})
</script>

<template>
  <q-page padding>
    <PageHeader
      :title="`Chi tiet: ${currentItem?.name || ''}`"
      showBack
      backTo="/[module]/ten-tinh-nang"
    >
      <template #actions>
        <q-badge
          v-if="currentItem"
          :color="statusColors[currentItem.status]"
          :label="statusLabels[currentItem.status]"
          class="text-body2 q-pa-sm"
        />
      </template>
    </PageHeader>

    <q-card flat bordered v-if="currentItem">
      <q-tabs v-model="activeTab" align="left" active-color="primary" narrow-indicator dense>
        <q-tab name="info" label="Thong tin" icon="info" />
        <q-tab name="history" label="Lich su" icon="history" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="info">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4">
              <div class="text-caption text-grey">Ma</div>
              <div class="text-body1">{{ currentItem.code }}</div>
            </div>
            <div class="col-12 col-sm-6 col-md-4">
              <div class="text-caption text-grey">Ten</div>
              <div class="text-body1">{{ currentItem.name }}</div>
            </div>
            <div class="col-12 col-sm-6 col-md-4">
              <div class="text-caption text-grey">Ngay tao</div>
              <div class="text-body1">{{ formatDate(currentItem.created_at) }}</div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="history">
          <!-- Audit log / change history -->
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-inner-loading :showing="isLoading" />
  </q-page>
</template>
```

---

## BUOC 8: REALTIME (neu can)

```typescript
import { useRealtime } from '@/composables/useRealtime'
import { onMounted, onUnmounted } from 'vue'

const { subscribe, unsubscribeAll } = useRealtime()

onMounted(() => {
  subscribe({
    table: 'ten_bang',
    event: '*',
    filter: 'deleted_at=is.null',
  }, (payload) => {
    fetchList()
  })
})

onUnmounted(() => {
  unsubscribeAll()
})
```

---

## BUOC 9: EXCEL EXPORT (neu can)

```typescript
const exportExcel = async () => {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Ten Sheet')

  sheet.columns = [
    { header: 'Ma', key: 'code', width: 15 },
    { header: 'Ten', key: 'name', width: 30 },
    { header: 'Trang thai', key: 'status', width: 15 },
    { header: 'Ngay tao', key: 'created_at', width: 15 },
  ]

  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  items.value.forEach((item) => {
    sheet.addRow({
      ...item,
      status: statusLabels[item.status] || item.status,
      created_at: formatDate(item.created_at),
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ten-file-${Date.now()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
```

Nut export trong PageHeader:
```vue
<template #actions>
  <AppButton variant="outlined" color="positive" icon="file_download" label="Xuat Excel" @click="exportExcel" />
  <AppButton color="primary" icon="add" label="Them Moi" @click="openCreateDialog" />
</template>
```

---

## QUY TAC BAT BUOC

### UI Components - PHAI dung
| Component | Thay cho | Import |
|-----------|----------|--------|
| `AppInput` | `q-input` | `@/components/ui/inputs/AppInput.vue` |
| `AppSelect` | `q-select` | `@/components/ui/inputs/AppSelect.vue` |
| `AppButton` | `q-btn` (chinh) | `@/components/ui/buttons/AppButton.vue` |
| `DataTable` | `q-table` | `@/components/ui/tables/DataTable.vue` |
| `DatePicker` | `input[type=date]` | `@/components/ui/pickers/DatePicker.vue` |
| `PageHeader` | Custom header | `@/components/ui/layout` |
| `FormDialog` | `q-dialog` (form) | `@/components/ui/dialogs/FormDialog.vue` |

> **Ngoai le**: `q-btn` flat/round/dense cho action icons trong table rows thi dung truc tiep (vi AppButton danh cho buttons chinh co label).

### AppInput props chinh
`modelValue, type, label, placeholder, outlined=true, dense, disable, readonly, required, clearable, debounce, autofocus, autogrow, maxlength, mask, loading, rules, errorMessage`
- `required=true` tu dong them rule "Truong nay la bat buoc"
- Slots: `append`, `prepend`, `before`, `after`

### AppSelect props chinh
`modelValue, options, optionValue='value', optionLabel='label', multiple, outlined=true, dense, disable, clearable, useInput, useChips, emitValue=true, mapOptions=true, loading, required, rules`
- `required=true` tu dong them rule "Vui long chon mot muc"
- Built-in filtering khi co `useInput`

### AppButton props chinh
`color='primary', size='md', variant='filled'|'flat'|'outlined'|'text', loading, disable, icon, iconRight, label, type='button', round, dense, block, noCaps=true`

### DataTable props chinh
`rows, columns, rowKey='id', loading, filter, pagination, selected, selection='none', rowsPerPageOptions=[10,25,50,100], emptyIcon='inbox', emptyTitle='Khong co du lieu'`
- Emits: `update:pagination`, `update:selected`, `request`, `rowClick`
- Slots: tat ca q-table slots + `#empty-action`

### Cascading Selects Pattern
```typescript
watch(selectedParentId, async (newId) => {
  selectedChildId.value = null
  childOptions.value = []
  if (!newId) return
  const data = await service.getOptions(newId)
  childOptions.value = data.map(d => ({ value: d.id, label: d.name }))
})
```

### Thong bao - PHAI tieng Viet
```typescript
snackbar.success('Tao thanh cong')
snackbar.error('Khong the tao. Vui long thu lai')
snackbar.warning('Vui long dien day du thong tin')
```

### Dinh dang ngay thang - LUON DD/MM/YYYY
```typescript
import { date } from 'quasar'
const formatted = date.formatDate(dateStr, 'DD/MM/YYYY')
const formattedWithTime = date.formatDate(dateStr, 'DD/MM/YYYY HH:mm')
```

### So luong format - chuan VN
```typescript
value.toLocaleString('vi-VN')
value.toLocaleString('vi-VN') + ' d'
```

### Error Handling - dung getErrorMessage()
```typescript
import { getErrorMessage } from '@/utils/errorMessages'
snackbar.error(getErrorMessage(err))
```

### Confirmation - dung useConfirm()
```typescript
const { confirmDelete, confirmWarning } = useConfirm()
const confirmed = await confirmDelete(item.name)
```

### Permissions - dung usePermission()
```typescript
const { can, canAny, isAdmin } = usePermission()
const canEdit = can('resource.edit')
```

### API - KHONG BAO GIO goi Supabase truc tiep tu Frontend
```
Frontend -> fetchApi() -> Hono API -> supabaseAdmin -> PostgreSQL
```

### File structure conventions
```
src/composables/
  useXxx.ts              # generic composables
  thread/useXxx.ts       # domain composables
  index.ts               # barrel export

src/services/
  api.ts                 # fetchApi base
  xxxService.ts          # domain services
  index.ts               # barrel export

src/types/
  ui/                    # component prop types
  thread/                # domain types
  auth/                  # auth types
  index.ts               # barrel export

src/pages/
  [module]/              # domain pages
    ten-tinh-nang/
      index.vue          # list page
      [id].vue           # detail page

src/components/
  ui/                    # reusable UI components
    inputs/              # AppInput, AppSelect, SearchInput
    buttons/             # AppButton
    tables/              # DataTable
    dialogs/             # FormDialog, ConfirmDialog
    feedback/            # EmptyState
    layout/              # PageHeader
    pickers/             # DatePicker
    navigation/          # AppTabs, AppBreadcrumbs
  thread/                # domain-specific components
```

---

## CHECKLIST TRUOC KHI HOAN THANH

### Database
- [ ] Migration co `created_at`, `updated_at`, trigger `fn_update_updated_at_column()`
- [ ] ENUM dung `CREATE TYPE` voi values UPPERCASE
- [ ] Soft delete co `deleted_at TIMESTAMPTZ`
- [ ] Index cho cac cot filter thuong dung
- [ ] `NOTIFY pgrst, 'reload schema'` cuoi migration
- [ ] `ALTER PUBLICATION supabase_realtime ADD TABLE` (neu can realtime)
- [ ] RPC functions co prefix `fn_`, params prefix `p_`, vars prefix `v_`
- [ ] COMMENT ON TABLE/COLUMN bang tieng Viet

### Backend
- [ ] Route order: static truoc dynamic, `/:id` cuoi
- [ ] Response format: `{ data, error }` (KHONG phai `{ success, data, error }`)
- [ ] Zod validation dung `.safeParse()` (KHONG `.parse()`)
- [ ] Duplicate check truoc insert (409)
- [ ] Exists check truoc update/delete (404)
- [ ] PGRST116 error code cho not found
- [ ] Route da dang ky trong `server/index.ts`
- [ ] Types dung shared `ApiResponse<T>`, KHONG tao rieng
- [ ] Soft delete: `update({ deleted_at, is_active: false })`

### Frontend - State
- [ ] Composable dung `useLoading().withLoading()` (KHONG manual loading)
- [ ] Error handling dung `getErrorMessage()` utility
- [ ] Xoa/hanh dong nguy hiem dung `useConfirm()`
- [ ] Search input co debounce (300ms) voi `useDebounceFn`
- [ ] Service dung `fetchApi()`, method `PUT` cho update
- [ ] Service dung `buildQueryString()` helper

### Frontend - UI
- [ ] `definePage` meta co permissions phu hop
- [ ] Page co `PageHeader` voi title + actions
- [ ] Dung `AppInput`, `AppSelect`, `AppButton`, `DatePicker`
- [ ] Tab layout neu co >=2 tinh nang con
- [ ] Action buttons trong table: `q-btn flat round dense size="sm"` + `q-tooltip`
- [ ] Status badge voi color mapping
- [ ] DataTable co `#empty-action` slot
- [ ] Server-side pagination voi `@request` handler + `v-model:pagination`
- [ ] Responsive grid (`col-12 col-sm-6 col-md-4`)
- [ ] DatePicker dung popup pattern (icon + q-popup-proxy)
- [ ] Form validation dung `:rules` prop
- [ ] Permission checks: `v-if="canEdit.value"` cho action buttons
- [ ] Detail page co back button (`showBack` + `backTo`)

### Quy tac chung
- [ ] Moi thong bao bang tieng Viet
- [ ] Ngay thang DD/MM/YYYY (dung `date.formatDate` tu quasar)
- [ ] So luong format `toLocaleString('vi-VN')`
- [ ] Khong co comment thua trong code
- [ ] File-based routing dung (unplugin-vue-router)
- [ ] Excel export dung ExcelJS (neu can xuat du lieu)

---

## THU TU THUC HIEN

```
1. Migration SQL        -> Database schema + enum + trigger + index
2. Types                -> Backend types + Frontend types
3. Validation           -> Zod schemas (.safeParse pattern)
4. Backend Route        -> Hono API (dung thu tu route) + dang ky trong index.ts
5. Service              -> Frontend API client (fetchApi + buildQueryString)
6. Composable           -> State management (useLoading.withLoading)
7. List Page            -> Vue page voi day du UI
8. Detail Page          -> [id].vue (neu can)
9. Realtime             -> useRealtime (neu can)
10. Excel Export        -> ExcelJS (neu can)
```

Khi dung multi-agent (task anh huong >=3 layers):
- **db-agent**: Buoc 1
- **backend-agent**: Buoc 2, 3, 4
- **frontend-agent**: Buoc 5, 6, 7, 8, 9, 10
