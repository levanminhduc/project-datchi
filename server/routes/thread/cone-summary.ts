import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import { byWarehouseWeekQuerySchema } from '../../validation/coneSummary'
import type { ThreadApiResponse } from '../../types/thread'

const coneSummary = new Hono()

interface ConeAggregate {
  full_cones: number
  partial_cones: number
  partial_meters: number
}

interface ReservedWeekEntry extends ConeAggregate {
  week_id: number
  week_name: string
  status: string
}

interface WarehouseEntry {
  warehouse_id: number
  warehouse_code: string
  warehouse_name: string
  available: ConeAggregate
  weeks: ReservedWeekEntry[]
  other_reserved: ConeAggregate
}

const emptyAgg = (): ConeAggregate => ({ full_cones: 0, partial_cones: 0, partial_meters: 0 })

const hasValue = (a: ConeAggregate): boolean =>
  a.full_cones > 0 || a.partial_cones > 0 || a.partial_meters > 0

const accumulate = (
  agg: ConeAggregate,
  isPartial: boolean,
  quantityMeters: number | null
): void => {
  if (isPartial) {
    agg.partial_cones += 1
    agg.partial_meters += Number(quantityMeters) || 0
  } else {
    agg.full_cones += 1
  }
}

// GET /api/thread/cone-summary/by-warehouse-week
// Return cone inventory grouped by warehouse × week (CONFIRMED only)
coneSummary.get(
  '/by-warehouse-week',
  requirePermission('thread.allocations.view'),
  async (c) => {
    try {
      const parsed = byWarehouseWeekQuerySchema.safeParse({
        thread_type_id: c.req.query('thread_type_id'),
        color_id: c.req.query('color_id'),
        warehouse_id: c.req.query('warehouse_id'),
      })

      if (!parsed.success) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Tham số không hợp lệ' },
          400
        )
      }

      const { thread_type_id, color_id, warehouse_id } = parsed.data

      let query = supabase
        .from('thread_inventory')
        .select('warehouse_id, status, reserved_week_id, is_partial, quantity_meters, color_id')
        .eq('thread_type_id', thread_type_id)
        .in('status', ['AVAILABLE', 'RESERVED_FOR_ORDER'])

      if (color_id != null) {
        query = query.eq('color_id', color_id)
      }
      if (warehouse_id != null) {
        query = query.eq('warehouse_id', warehouse_id)
      }

      const { data: cones, error: conesError } = await query

      if (conesError) {
        console.error('[cone-summary/by-warehouse-week] query error:', conesError)
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Lỗi khi tải dữ liệu reserve' },
          500
        )
      }

      const coneRows = cones || []

      if (coneRows.length === 0) {
        return c.json<ThreadApiResponse<{ warehouses: WarehouseEntry[] }>>({
          data: { warehouses: [] },
          error: null,
        })
      }

      const warehouseIds = Array.from(
        new Set(coneRows.map((r) => r.warehouse_id).filter((v): v is number => v != null))
      )
      const weekIds = Array.from(
        new Set(
          coneRows
            .map((r) => r.reserved_week_id)
            .filter((v): v is number => v != null)
        )
      )

      const [warehousesResp, weeksResp] = await Promise.all([
        warehouseIds.length > 0
          ? supabase
              .from('warehouses')
              .select('id, code, name')
              .in('id', warehouseIds)
              .is('deleted_at', null)
          : Promise.resolve({ data: [], error: null }),
        weekIds.length > 0
          ? supabase
              .from('thread_order_weeks')
              .select('id, week_name, status')
              .in('id', weekIds)
              .eq('status', 'CONFIRMED')
          : Promise.resolve({ data: [], error: null }),
      ])

      if (warehousesResp.error || weeksResp.error) {
        console.error(
          '[cone-summary/by-warehouse-week] fetch warehouses/weeks error:',
          warehousesResp.error || weeksResp.error
        )
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Lỗi khi tải dữ liệu kho/tuần' },
          500
        )
      }

      const warehouseMap = new Map<number, { id: number; code: string; name: string }>()
      for (const w of warehousesResp.data || []) {
        warehouseMap.set(w.id, w)
      }

      const confirmedWeekMap = new Map<number, { id: number; week_name: string; status: string }>()
      for (const wk of weeksResp.data || []) {
        confirmedWeekMap.set(wk.id, wk)
      }

      const warehouseEntries = new Map<number, WarehouseEntry>()
      const ensureWarehouseEntry = (whId: number): WarehouseEntry | null => {
        const wh = warehouseMap.get(whId)
        if (!wh) return null
        let entry = warehouseEntries.get(whId)
        if (!entry) {
          entry = {
            warehouse_id: wh.id,
            warehouse_code: wh.code,
            warehouse_name: wh.name,
            available: emptyAgg(),
            weeks: [],
            other_reserved: emptyAgg(),
          }
          warehouseEntries.set(whId, entry)
        }
        return entry
      }

      const weekBuckets = new Map<string, ReservedWeekEntry>()

      for (const row of coneRows) {
        const whId = row.warehouse_id
        if (whId == null) continue
        const entry = ensureWarehouseEntry(whId)
        if (!entry) continue

        const isPartial = !!row.is_partial
        const qtyMeters = row.quantity_meters as number | null

        if (row.status === 'AVAILABLE') {
          accumulate(entry.available, isPartial, qtyMeters)
          continue
        }

        const weekRef = row.reserved_week_id as number | null
        const confirmedWeek = weekRef != null ? confirmedWeekMap.get(weekRef) : undefined

        if (confirmedWeek) {
          const key = `${whId}:${confirmedWeek.id}`
          let bucket = weekBuckets.get(key)
          if (!bucket) {
            bucket = {
              week_id: confirmedWeek.id,
              week_name: confirmedWeek.week_name,
              status: confirmedWeek.status,
              ...emptyAgg(),
            }
            weekBuckets.set(key, bucket)
            entry.weeks.push(bucket)
          }
          accumulate(bucket, isPartial, qtyMeters)
        } else {
          accumulate(entry.other_reserved, isPartial, qtyMeters)
        }
      }

      const warehouses: WarehouseEntry[] = []
      for (const entry of warehouseEntries.values()) {
        const keep =
          hasValue(entry.available) ||
          entry.weeks.length > 0 ||
          hasValue(entry.other_reserved)
        if (keep) {
          entry.weeks.sort((a, b) => a.week_name.localeCompare(b.week_name, 'vi'))
          warehouses.push(entry)
        }
      }

      warehouses.sort((a, b) => a.warehouse_code.localeCompare(b.warehouse_code, 'vi'))

      return c.json<ThreadApiResponse<{ warehouses: WarehouseEntry[] }>>({
        data: { warehouses },
        error: null,
        message: `Tìm thấy ${warehouses.length} kho`,
      })
    } catch (err) {
      console.error('[cone-summary/by-warehouse-week] unexpected error:', err)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi hệ thống' },
        500
      )
    }
  }
)

export default coneSummary
