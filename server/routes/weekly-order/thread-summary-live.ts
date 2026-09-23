import { Hono } from 'hono'
import { queryOne, query } from '../../db/query'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import type { AppEnv } from '../../types/hono-env'

const threadSummaryLive = new Hono<AppEnv>()

threadSummaryLive.get('/:id/thread-summary-live', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const [summaryRow, reservedRows, pendingRows] = await Promise.all([
      queryOne<{ summary_data: unknown }>(
        `SELECT summary_data FROM thread_order_results WHERE week_id = $1`,
        [id],
      ),
      query<{ thread_type_id: number }>(
        `SELECT thread_type_id FROM thread_inventory
         WHERE reserved_week_id = $1 AND status = 'RESERVED_FOR_ORDER' LIMIT 500000`,
        [id],
      ),
      query<{ thread_type_id: number; quantity_cones: number | null }>(
        `SELECT thread_type_id, quantity_cones FROM thread_order_deliveries
         WHERE week_id = $1 AND status = 'PENDING' LIMIT 500000`,
        [id],
      ),
    ])

    if (!summaryRow) {
      return c.json({ data: [], error: null })
    }

    const summaryData = (summaryRow.summary_data || []) as Array<{
      thread_type_id: number
      thread_type_name: string
      supplier_name: string
      tex_number: string
      thread_color?: string
      sl_can_dat?: number
      total_final?: number
      total_cones: number
    }>

    if (!summaryData.length) {
      return c.json({ data: [], error: null })
    }

    const reservedMap = new Map<number, number>()
    for (const row of reservedRows || []) {
      reservedMap.set(row.thread_type_id, (reservedMap.get(row.thread_type_id) || 0) + 1)
    }

    const pendingMap = new Map<number, number>()
    for (const row of pendingRows || []) {
      pendingMap.set(row.thread_type_id, (pendingMap.get(row.thread_type_id) || 0) + (row.quantity_cones || 0))
    }

    const rows = summaryData.map((row) => {
      const totalCones = row.total_final ?? row.sl_can_dat ?? row.total_cones ?? 0
      const reservedCones = reservedMap.get(row.thread_type_id) || 0
      const pendingCones = pendingMap.get(row.thread_type_id) || 0
      return {
        thread_type_id: row.thread_type_id,
        thread_type_name: row.thread_type_name,
        supplier_name: row.supplier_name,
        tex_number: row.tex_number,
        thread_color: row.thread_color || null,
        total_cones: totalCones,
        reserved_cones: reservedCones,
        pending_cones: pendingCones,
        remaining: Math.max(0, totalCones - reservedCones),
      }
    })

    return c.json({ data: rows, error: null })
  } catch (err) {
    console.error('Error fetching thread summary live:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default threadSummaryLive
