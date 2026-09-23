import { Hono } from 'hono'
import { from } from '../db/sql-builder'
import { requirePermission } from '../middleware/auth'
import type { WarehouseRow, WarehouseTreeNode, ThreadApiResponse } from '../types/thread'

type Warehouse = WarehouseRow

type WarehouseTree = WarehouseTreeNode

const warehouses = new Hono()

warehouses.use('*', requirePermission('thread.inventory.view'))

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

    const warehouseList = await from('warehouses')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order({ column: 'parent_id', ascending: true, nullsFirst: true })
      .order({ column: 'sort_order', ascending: true })
      .list<Warehouse>()

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
    const data = await from('warehouses')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .eq('type', 'LOCATION')
      .order({ column: 'sort_order', ascending: true })
      .list<Warehouse>()

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

    const builder = from('warehouses')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .eq('type', 'STORAGE')

    // Filter by parent location if provided
    if (locationId) {
      builder.eq('parent_id', parseInt(locationId))
    }

    const data = await builder
      .order({ column: 'parent_id', ascending: true })
      .order({ column: 'sort_order', ascending: true })
      .list<Warehouse>()

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
