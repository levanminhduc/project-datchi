import type { Context } from 'hono'
import { ZodError } from 'zod'
import { queryOne, query } from '../../db/query'
import type { AppEnv } from '../../types/hono-env'
import type { WeeklyOrderStatus } from '../../types/weeklyOrder'

export function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join('; ')
}

export const VALID_STATUS_TRANSITIONS: Record<WeeklyOrderStatus, WeeklyOrderStatus[]> = {
  DRAFT: ['CONFIRMED'],
  CONFIRMED: ['CANCELLED', 'CONFIRMED'],
  CANCELLED: [],
  COMPLETED: [],
}

export async function validateSubArtIds(
  items: Array<{ style_id: number; sub_art_id?: number | null }>,
): Promise<string | null> {
  const itemsWithSubArt = items.filter((i) => i.sub_art_id)
  if (itemsWithSubArt.length === 0) return null

  const allSubArtIds = [...new Set(itemsWithSubArt.map((i) => i.sub_art_id!))]

  const subArts = await query<{ id: number; style_id: number }>(
    `SELECT id, style_id FROM sub_arts WHERE id = ANY($1) LIMIT 10000`,
    [allSubArtIds],
  )

  const subArtSet = new Set(
    (subArts || []).map((sa: any) => `${sa.id}-${sa.style_id}`),
  )

  for (const item of itemsWithSubArt) {
    if (!subArtSet.has(`${item.sub_art_id}-${item.style_id}`)) {
      return `Sub-art ID ${item.sub_art_id} không tồn tại hoặc không thuộc mã hàng ID ${item.style_id}`
    }
  }
  return null
}

export async function validatePOQuantityLimits(
  items: Array<{ po_id?: number | null; style_id: number; quantity: number }>,
  excludeWeekId?: number,
): Promise<{ valid: boolean; errors: string[] }> {
  const groups = new Map<string, { po_id: number; style_id: number; total: number }>()
  for (const item of items) {
    if (!item.po_id) continue
    const key = `${item.po_id}-${item.style_id}`
    const existing = groups.get(key)
    if (existing) {
      existing.total += item.quantity
    } else {
      groups.set(key, { po_id: item.po_id, style_id: item.style_id, total: item.quantity })
    }
  }

  if (groups.size === 0) return { valid: true, errors: [] }

  const poIds = [...new Set([...groups.values()].map((g) => g.po_id))]

  const [allPoItems, existingRows] = await Promise.all([
    query<{ po_id: number; style_id: number; quantity: number }>(
      `SELECT po_id, style_id, quantity FROM po_items
       WHERE po_id = ANY($1) AND deleted_at IS NULL
       LIMIT 10000`,
      [poIds],
    ),
    (() => {
      const params: unknown[] = [poIds]
      let sql = `SELECT toi.po_id, toi.style_id, toi.quantity
         FROM thread_order_items toi
         INNER JOIN thread_order_weeks w ON w.id = toi.week_id
         WHERE toi.po_id = ANY($1) AND w.status <> 'CANCELLED'`
      if (excludeWeekId) {
        params.push(excludeWeekId)
        sql += ` AND w.id <> $${params.length}`
      }
      sql += ` LIMIT 10000`
      return query<{ po_id: number; style_id: number; quantity: number }>(sql, params)
    })(),
  ])

  const poItemMap = new Map<string, number>()
  for (const pi of allPoItems || []) {
    poItemMap.set(`${pi.po_id}-${pi.style_id}`, pi.quantity)
  }

  const existingTotalMap = new Map<string, number>()
  for (const row of (existingRows || []) as any[]) {
    const key = `${row.po_id}-${row.style_id}`
    existingTotalMap.set(key, (existingTotalMap.get(key) || 0) + (row.quantity || 0))
  }

  const errorGroups: Array<{ po_id: number; style_id: number; poQty: number; existingTotal: number; groupTotal: number }> = []

  for (const [key, group] of groups) {
    const poQty = poItemMap.get(key)
    if (poQty === undefined) continue

    const existingTotal = existingTotalMap.get(key) || 0

    if (existingTotal + group.total > poQty) {
      errorGroups.push({
        po_id: group.po_id,
        style_id: group.style_id,
        poQty,
        existingTotal,
        groupTotal: group.total,
      })
    }
  }

  if (errorGroups.length === 0) return { valid: true, errors: [] }

  const errorPoIds = [...new Set(errorGroups.map((e) => e.po_id))]
  const errorStyleIds = [...new Set(errorGroups.map((e) => e.style_id))]

  const [pos, styles] = await Promise.all([
    query<{ id: number; po_number: string }>(`SELECT id, po_number FROM purchase_orders WHERE id = ANY($1)`, [errorPoIds]),
    query<{ id: number; style_code: string }>(`SELECT id, style_code FROM styles WHERE id = ANY($1)`, [errorStyleIds]),
  ])

  const poNumberMap = new Map((pos || []).map((p: any) => [p.id, p.po_number]))
  const styleCodeMap = new Map((styles || []).map((s: any) => [s.id, s.style_code]))

  const errors: string[] = []
  for (const eg of errorGroups) {
    const poNumber = poNumberMap.get(eg.po_id) || `PO#${eg.po_id}`
    const styleCode = styleCodeMap.get(eg.style_id) || `Style#${eg.style_id}`
    const remaining = eg.poQty - eg.existingTotal

    errors.push(
      `${poNumber} - ${styleCode}: vượt quá số lượng PO (PO: ${eg.poQty}, đã đặt: ${eg.existingTotal}, đang đặt: ${eg.groupTotal}, còn lại: ${remaining})`,
    )
  }

  return { valid: errors.length === 0, errors }
}

export async function getPerformerName(c: Context<AppEnv>): Promise<string> {
  const auth = c.get('auth')
  if (auth?.employeeId) {
    const emp = await queryOne<{ full_name: string }>(
      `SELECT full_name FROM employees WHERE id = $1`,
      [auth.employeeId],
    )
    return emp?.full_name || auth.employeeCode || 'unknown'
  }
  return 'unknown'
}
