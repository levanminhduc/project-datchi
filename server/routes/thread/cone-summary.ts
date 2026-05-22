import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import { byWarehouseWeekQuerySchema, poBreakdownQuerySchema } from '../../validation/coneSummary'
import type { ThreadApiResponse } from '../../types/thread'
import { getPartialConeRatio } from '../../utils/settings-helper'
import {
  fetchCalculationData,
  fetchOrderItems,
  fetchSpecsByStyleColors,
  fetchColorNameToIdMap,
} from '../weekly-order/transfer-by-calculation'
import {
  buildPoStyleColorQuotaMap,
  fetchIssuedByPoStyleColorMultiWeek,
  roundToTwoDecimals,
  type CalculationDataRow,
} from '../weekly-order/progress-helpers'

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

interface PoBreakdownRow {
  po_id: number | null
  po_number: string
  style_id: number
  style_code: string
  style_name: string
  style_color_id: number
  style_color_name: string
  product_quantity: number
  quota_cones: number
  issued_cones: number
  returned_cones: number
  net_issued: number
  pending_cones: number
}

interface PoBreakdownResponse {
  week: { id: number; week_name: string; status: string }
  thread_type_id: number
  thread_color_id: number
  rows: PoBreakdownRow[]
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

      let warehouseIdFilter: number[] | null = null
      if (warehouse_id != null) {
        const { data: whRow, error: whErr } = await supabase
          .from('warehouses')
          .select('id, type')
          .eq('id', warehouse_id)
          .is('deleted_at', null)
          .maybeSingle()

        if (whErr) {
          console.error('[cone-summary/by-warehouse-week] warehouse lookup error:', whErr)
          return c.json<ThreadApiResponse<null>>(
            { data: null, error: 'Lỗi khi tải thông tin kho' },
            500
          )
        }

        if (!whRow) {
          return c.json<ThreadApiResponse<{ warehouses: WarehouseEntry[] }>>({
            data: { warehouses: [] },
            error: null,
          })
        }

        if (whRow.type === 'LOCATION') {
          const { data: children, error: childErr } = await supabase
            .from('warehouses')
            .select('id')
            .eq('parent_id', warehouse_id)
            .is('deleted_at', null)
            .limit(1000)

          if (childErr) {
            console.error('[cone-summary/by-warehouse-week] child warehouse lookup error:', childErr)
            return c.json<ThreadApiResponse<null>>(
              { data: null, error: 'Lỗi khi tải kho con' },
              500
            )
          }

          warehouseIdFilter = [warehouse_id, ...(children || []).map((c) => c.id as number)]
        } else {
          warehouseIdFilter = [warehouse_id]
        }
      }

      let query = supabase
        .from('thread_inventory')
        .select('warehouse_id, status, reserved_week_id, is_partial, quantity_meters, color_id')
        .eq('thread_type_id', thread_type_id)
        .in('status', ['AVAILABLE', 'RESERVED_FOR_ORDER'])

      if (color_id != null) {
        query = query.eq('color_id', color_id)
      }
      if (warehouseIdFilter != null) {
        query = query.in('warehouse_id', warehouseIdFilter)
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

// GET /api/thread/cone-summary/po-breakdown
// Returns PO/Style/StyleColor breakdown for a given (week, thread_type, color)
coneSummary.get(
  '/po-breakdown',
  requirePermission('thread.allocations.view'),
  async (c) => {
    try {
      const parsed = poBreakdownQuerySchema.safeParse({
        week_id: c.req.query('week_id'),
        thread_type_id: c.req.query('thread_type_id'),
        color_id: c.req.query('color_id'),
      })

      if (!parsed.success) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Tham số không hợp lệ' },
          400,
        )
      }

      const { week_id: weekId, thread_type_id, color_id } = parsed.data

      const { data: weekRow, error: weekErr } = await supabase
        .from('thread_order_weeks')
        .select('id, week_name, status')
        .eq('id', weekId)
        .maybeSingle()
      if (weekErr) {
        console.error('[cone-summary/po-breakdown] week lookup error:', weekErr)
        return c.json<ThreadApiResponse<null>>({ data: null, error: 'Lỗi tải tuần' }, 500)
      }
      if (!weekRow) {
        return c.json<ThreadApiResponse<null>>({ data: null, error: 'Tuần không tồn tại' }, 404)
      }
      if (weekRow.status !== 'CONFIRMED') {
        return c.json<ThreadApiResponse<PoBreakdownResponse>>({
          data: {
            week: { id: weekRow.id, week_name: weekRow.week_name, status: weekRow.status },
            thread_type_id,
            thread_color_id: color_id,
            rows: [],
          },
          error: null,
          message: 'Tuần chưa CONFIRMED',
        })
      }

      const [{ calculation_data }, orderItems, ratio] = await Promise.all([
        fetchCalculationData(weekId),
        fetchOrderItems(weekId),
        getPartialConeRatio(),
      ])

      if (!calculation_data || calculation_data.length === 0 || orderItems.length === 0) {
        return c.json<ThreadApiResponse<PoBreakdownResponse>>({
          data: {
            week: { id: weekRow.id, week_name: weekRow.week_name, status: weekRow.status },
            thread_type_id,
            thread_color_id: color_id,
            rows: [],
          },
          error: null,
          message: 'Tuần chưa được tính chỉ',
        })
      }

      const styleColorIds = Array.from(new Set(orderItems.map(it => it.style_color_id)))
      const specs = await fetchSpecsByStyleColors(styleColorIds)
      const threadColorIds = Array.from(
        new Set(specs.map(s => s.thread_color_id).filter((v): v is number => v != null)),
      )
      const colorByName = await fetchColorNameToIdMap(threadColorIds)
      const colorById = new Map<number, string>()
      for (const [name, id] of colorByName) colorById.set(id, name)

      const { poStyleColorThreadMap } = buildPoStyleColorQuotaMap(
        orderItems,
        specs,
        calculation_data as CalculationDataRow[],
        colorByName,
        colorById,
      )

      const issuedRows = await fetchIssuedByPoStyleColorMultiWeek([weekId], ratio)
      const issuedByKey = new Map<string, { issued: number; returned: number }>()
      for (const row of issuedRows) {
        if (row.thread_type_id !== thread_type_id) continue
        if (row.thread_color_id !== color_id) continue
        const key = `${row.po_id ?? 'null'}_${row.style_id ?? 'null'}_${row.style_color_id}`
        const existing = issuedByKey.get(key)
        if (existing) {
          existing.issued += row.issued_cones
          existing.returned += row.returned_cones
        } else {
          issuedByKey.set(key, { issued: row.issued_cones, returned: row.returned_cones })
        }
      }

      const rows: PoBreakdownRow[] = []
      const poIdsToFetch = new Set<number>()
      const styleIdsToFetch = new Set<number>()
      const scIdsToFetch = new Set<number>()

      const threadKey = `${thread_type_id}_${color_id}`

      for (const [poId, styleMap] of poStyleColorThreadMap) {
        for (const [styleId, scMap] of styleMap) {
          for (const [styleColorId, threadMap] of scMap) {
            const quota = threadMap.get(threadKey)
            if (!quota) continue

            const issuedEntry = issuedByKey.get(`${poId ?? 'null'}_${styleId}_${styleColorId}`)
            const issued = issuedEntry?.issued ?? 0
            const returned = issuedEntry?.returned ?? 0
            const net = Math.max(0, issued - returned)
            const pending = Math.max(0, quota.quota_cones - net)

            rows.push({
              po_id: poId,
              po_number: '',
              style_id: styleId,
              style_code: '',
              style_name: '',
              style_color_id: styleColorId,
              style_color_name: '',
              product_quantity: quota.product_quantity,
              quota_cones: roundToTwoDecimals(quota.quota_cones),
              issued_cones: roundToTwoDecimals(issued),
              returned_cones: roundToTwoDecimals(returned),
              net_issued: roundToTwoDecimals(net),
              pending_cones: roundToTwoDecimals(pending),
            })

            if (poId != null) poIdsToFetch.add(poId)
            styleIdsToFetch.add(styleId)
            scIdsToFetch.add(styleColorId)
          }
        }
      }

      if (rows.length === 0) {
        return c.json<ThreadApiResponse<PoBreakdownResponse>>({
          data: {
            week: { id: weekRow.id, week_name: weekRow.week_name, status: weekRow.status },
            thread_type_id,
            thread_color_id: color_id,
            rows: [],
          },
          error: null,
        })
      }

      const [posResp, stylesResp, scResp] = await Promise.all([
        poIdsToFetch.size > 0
          ? supabase
              .from('purchase_orders')
              .select('id, po_number')
              .in('id', Array.from(poIdsToFetch))
              .limit(poIdsToFetch.size)
          : Promise.resolve({ data: [] as Array<{ id: number; po_number: string }>, error: null }),
        styleIdsToFetch.size > 0
          ? supabase
              .from('styles')
              .select('id, style_code, style_name')
              .in('id', Array.from(styleIdsToFetch))
              .limit(styleIdsToFetch.size)
          : Promise.resolve({ data: [] as Array<{ id: number; style_code: string; style_name: string }>, error: null }),
        scIdsToFetch.size > 0
          ? supabase
              .from('style_colors')
              .select('id, color_name')
              .in('id', Array.from(scIdsToFetch))
              .limit(scIdsToFetch.size)
          : Promise.resolve({ data: [] as Array<{ id: number; color_name: string }>, error: null }),
      ])

      if (posResp.error || stylesResp.error || scResp.error) {
        console.error(
          '[cone-summary/po-breakdown] label fetch error:',
          posResp.error || stylesResp.error || scResp.error,
        )
        return c.json<ThreadApiResponse<null>>({ data: null, error: 'Lỗi tải nhãn' }, 500)
      }

      const poMap = new Map<number, string>()
      for (const p of (posResp.data ?? []) as Array<{ id: number; po_number: string }>) {
        poMap.set(p.id, p.po_number)
      }
      const styleMapLabel = new Map<number, { style_code: string; style_name: string }>()
      for (const s of (stylesResp.data ?? []) as Array<{ id: number; style_code: string; style_name: string }>) {
        styleMapLabel.set(s.id, { style_code: s.style_code, style_name: s.style_name })
      }
      const scMapLabel = new Map<number, string>()
      for (const sc of (scResp.data ?? []) as Array<{ id: number; color_name: string }>) {
        scMapLabel.set(sc.id, sc.color_name)
      }

      for (const row of rows) {
        row.po_number = row.po_id != null ? (poMap.get(row.po_id) ?? '') : '(Không có PO)'
        const styleInfo = styleMapLabel.get(row.style_id)
        row.style_code = styleInfo?.style_code ?? ''
        row.style_name = styleInfo?.style_name ?? ''
        row.style_color_name = scMapLabel.get(row.style_color_id) ?? ''
      }

      rows.sort((a, b) => {
        const cmpPo = a.po_number.localeCompare(b.po_number, 'vi')
        if (cmpPo !== 0) return cmpPo
        const cmpStyle = a.style_code.localeCompare(b.style_code, 'vi')
        if (cmpStyle !== 0) return cmpStyle
        return a.style_color_name.localeCompare(b.style_color_name, 'vi')
      })

      return c.json<ThreadApiResponse<PoBreakdownResponse>>({
        data: {
          week: { id: weekRow.id, week_name: weekRow.week_name, status: weekRow.status },
          thread_type_id,
          thread_color_id: color_id,
          rows,
        },
        error: null,
        message: `Tìm thấy ${rows.length} dòng PO/Mã hàng`,
      })
    } catch (err) {
      console.error('[cone-summary/po-breakdown] unexpected error:', err)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi tính toán định mức PO' },
        500,
      )
    }
  },
)

export default coneSummary
