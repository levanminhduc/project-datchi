import type { Context } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../../db/supabase'
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

  const { data: subArts } = await supabase
    .from('sub_arts')
    .select('id, style_id')
    .in('id', allSubArtIds)
    .limit(10000)

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

  const [{ data: allPoItems }, existingResult] = await Promise.all([
    supabase
      .from('po_items')
      .select('po_id, style_id, quantity')
      .in('po_id', poIds)
      .is('deleted_at', null)
      .limit(10000),
    (() => {
      let q = supabase
        .from('thread_order_items')
        .select('po_id, style_id, quantity, week:thread_order_weeks!inner(id, status)')
        .in('po_id', poIds)
        .neq('week.status', 'CANCELLED')
      if (excludeWeekId) {
        q = q.neq('week.id', excludeWeekId)
      }
      return q.limit(10000)
    })(),
  ])

  const poItemMap = new Map<string, number>()
  for (const pi of allPoItems || []) {
    poItemMap.set(`${pi.po_id}-${pi.style_id}`, pi.quantity)
  }

  const existingTotalMap = new Map<string, number>()
  for (const row of (existingResult.data || []) as any[]) {
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

  const [{ data: pos }, { data: styles }] = await Promise.all([
    supabase.from('purchase_orders').select('id, po_number').in('id', errorPoIds),
    supabase.from('styles').select('id, style_code').in('id', errorStyleIds),
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
    const { data: emp } = await supabase
      .from('employees')
      .select('full_name')
      .eq('id', auth.employeeId)
      .single()
    return emp?.full_name || auth.employeeCode || 'unknown'
  }
  return 'unknown'
}
