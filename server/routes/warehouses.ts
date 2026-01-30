import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'

interface Warehouse {
  id: number
  code: string
  name: string
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const warehouses = new Hono()

// GET /api/warehouses - List all active warehouses
warehouses.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách kho'
      }, 500)
    }

    return c.json<ApiResponse<Warehouse[]>>({
      data: data as Warehouse[],
      error: null,
      message: `Đã tải ${data.length} kho`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default warehouses
