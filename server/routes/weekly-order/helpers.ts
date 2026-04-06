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
  CONFIRMED: ['CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
}

export async function validateSubArtIds(
  items: Array<{ style_id: number; sub_art_id?: number | null }>,
): Promise<string | null> {
  for (const item of items) {
    if (!item.sub_art_id) continue

    const { data: subArt } = await supabase
      .from('sub_arts')
      .select('id')
      .eq('id', item.sub_art_id)
      .eq('style_id', item.style_id)
      .single()

    if (!subArt) {
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

  const errors: string[] = []

  for (const [, group] of groups) {
    const { data: poItem } = await supabase
      .from('po_items')
      .select('quantity')
      .eq('po_id', group.po_id)
      .eq('style_id', group.style_id)
      .is('deleted_at', null)
      .single()

    if (!poItem) continue

    let existingQuery = supabase
      .from('thread_order_items')
      .select('quantity, week:thread_order_weeks!inner(id, status)')
      .eq('po_id', group.po_id)
      .eq('style_id', group.style_id)
      .neq('week.status', 'CANCELLED')

    if (excludeWeekId) {
      existingQuery = existingQuery.neq('week.id', excludeWeekId)
    }

    const { data: existingItems } = await existingQuery

    const existingTotal = (existingItems || []).reduce(
      (sum: number, row: any) => sum + (row.quantity || 0),
      0,
    )

    if (existingTotal + group.total > poItem.quantity) {
      const { data: po } = await supabase
        .from('purchase_orders')
        .select('po_number')
        .eq('id', group.po_id)
        .single()

      const { data: style } = await supabase
        .from('styles')
        .select('style_code')
        .eq('id', group.style_id)
        .single()

      const poNumber = po?.po_number || `PO#${group.po_id}`
      const styleCode = style?.style_code || `Style#${group.style_id}`
      const remaining = poItem.quantity - existingTotal

      errors.push(
        `${poNumber} - ${styleCode}: vượt quá số lượng PO (PO: ${poItem.quantity}, đã đặt: ${existingTotal}, đang đặt: ${group.total}, còn lại: ${remaining})`,
      )
    }
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
