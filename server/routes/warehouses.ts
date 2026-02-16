import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type { WarehouseRow, WarehouseTreeNode, WarehouseType, ThreadApiResponse } from '../types/thread'

interface Warehouse extends WarehouseRow {}

interface WarehouseTree extends WarehouseTreeNode {}

const warehouses = new Hono()

/**
 * Build tree structure from flat warehouse list
 * Groups STORAGE warehouses under their parent LOCATION
 */
function buildWarehouseTree(flatList: Warehouse[]): WarehouseTree[] {
  const locations = flatList.filter(w => w.type === 'LOCATION')
  const storages = flatList.filter(w => w.type === 'STORAGE')

  return locations.map(location => ({
    ...location,
    children: storages
      .filter(s => s.parent_id === location.id)
      .sort((a, b) => a.sort_order - b.sort_order)
  })).sort((a, b) => a.sort_order - b.sort_order)
}

// GET /api/warehouses - List all active warehouses
// Query params:
//   format=tree - Return tree structure with LOCATION containing children STORAGE
//   format=flat (default) - Return flat list (backward compatible)
warehouses.get('/', async (c) => {
  try {
    const format = c.req.query('format') || 'flat'

    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách kho'
      }, 500)
    }

    const warehouseList = data as Warehouse[]

    if (format === 'tree') {
      const tree = buildWarehouseTree(warehouseList)
      return c.json<ThreadApiResponse<WarehouseTree[]>>({
        data: tree,
        error: null,
        message: `Đã tải ${tree.length} địa điểm`
      })
    }

    // Default: flat list (backward compatible)
    return c.json<ThreadApiResponse<Warehouse[]>>({
      data: warehouseList,
      error: null,
      message: `Đã tải ${warehouseList.length} kho`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/warehouses/locations - List only LOCATION type warehouses
warehouses.get('/locations', async (c) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .eq('type', 'LOCATION')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách địa điểm'
      }, 500)
    }

    return c.json<ThreadApiResponse<Warehouse[]>>({
      data: data as Warehouse[],
      error: null,
      message: `Đã tải ${data.length} địa điểm`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/warehouses/storage - List only STORAGE type warehouses
// Used for inventory operations where only actual storage locations are valid
warehouses.get('/storage', async (c) => {
  try {
    const locationId = c.req.query('location_id')

    let query = supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .eq('type', 'STORAGE')

    // Filter by parent location if provided
    if (locationId) {
      query = query.eq('parent_id', parseInt(locationId))
    }

    const { data, error } = await query
      .order('parent_id', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách kho'
      }, 500)
    }

    return c.json<ThreadApiResponse<Warehouse[]>>({
      data: data as Warehouse[],
      error: null,
      message: `Đã tải ${data.length} kho`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default warehouses
