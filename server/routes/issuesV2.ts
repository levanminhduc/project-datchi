/**
 * Issue V2 Routes
 * Thread Issue Management API - Simplified cone-based tracking
 *
 * Key features:
 * - Multi-line issues (multiple thread types per issue)
 * - Quantity-based tracking (full cones + partial cones)
 * - Quota from thread_order_items
 * - Backend handles ALL calculations
 */

import { Hono, Context } from 'hono'
import { ZodError } from 'zod'
import { createHash } from 'crypto'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { getPartialConeRatio } from '../utils/settings-helper'
import {
  CreateIssueV2Schema,
  CreateIssueWithLineSchema,
  AddIssueLineV2Schema,
  ValidateIssueLineV2Schema,
  IssueV2FiltersSchema,
  FormDataQuerySchema,
  ReturnIssueV2Schema,
  ConfirmIssueV2Schema,
  OrderOptionsQuerySchema,
} from '../validation/issuesV2'
import type { ThreadApiResponse } from '../types/thread'

const issuesV2 = new Hono()

issuesV2.use('*', requirePermission('thread.allocations.view'))

// ============================================================================
// Helper Functions
// ============================================================================

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join('; ')
}

function getPerformedBy(c: Context, confirmedByFromBody?: string): string {
  const auth = c.get('auth') as { employeeCode?: string; employeeId?: number } | undefined
  return auth?.employeeCode || (auth?.employeeId ? String(auth.employeeId) : '') || confirmedByFromBody || ''
}

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

/**
 * Get partial cone ratio from system_settings
 * Default: 0.3 (30%)
 */
/**
 * Get meters_per_cone from thread_types table
 */
async function getMetersPerCone(threadTypeId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('thread_types')
    .select('meters_per_cone')
    .eq('id', threadTypeId)
    .single()

  if (error || !data) {
    console.error(`Failed to get meters_per_cone for thread_type_id ${threadTypeId}:`, error)
    return null
  }

  return data.meters_per_cone
}

/**
 * Calculate issued equivalent cones
 * Formula: issued_full + (issued_partial × partial_cone_ratio)
 */
function calculateIssuedEquivalent(
  issuedFull: number,
  issuedPartial: number,
  ratio: number
): number {
  return issuedFull + issuedPartial * ratio
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

interface ReturnValidationResult {
  valid: boolean
  errors: string[]
}

interface IssueLine {
  id: number
  thread_type_id: number
  issued_full: number
  issued_partial: number
  returned_full: number
  returned_partial: number
}

interface ReturnLineInput {
  line_id: number
  returned_full: number
  returned_partial: number
}

interface ReturnPartialPayloadItem {
  original_cone_id: number
  return_quantity_meters: number
}

interface ReturnRpcResult {
  success?: boolean
  full_returns?: number
  partial_returns?: number
  full_returned?: number
  partial_existing_returned?: number
  partial_created_returned?: number
  line_id?: number
}

function validateReturnQuantities(
  returnLines: ReturnLineInput[],
  lineMap: Map<number, IssueLine>
): ReturnValidationResult {
  const errors: string[] = []

  for (const returnLine of returnLines) {
    const line = lineMap.get(returnLine.line_id)
    if (!line) {
      errors.push(`Dong ID ${returnLine.line_id} khong ton tai`)
      continue
    }

    const totalReturnedFull = (line.returned_full || 0) + returnLine.returned_full
    const totalReturnedPartial = (line.returned_partial || 0) + returnLine.returned_partial
    const totalReturned = totalReturnedFull + totalReturnedPartial
    const totalIssued = (line.issued_full || 0) + (line.issued_partial || 0)

    if (totalReturnedFull > (line.issued_full || 0)) {
      errors.push(
        `Dong ${line.id}: Tra nguyen ${totalReturnedFull} > xuat ${line.issued_full || 0}`
      )
    }

    if (totalReturned > totalIssued) {
      errors.push(
        `Dong ${line.id}: Tong tra (${totalReturned}) > tong xuat (${totalIssued})`
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Generate issue code in format XK-YYYYMMDD-NNN
 */
async function generateIssueCode(): Promise<string> {
  const today = new Date()
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')

  const prefix = `XK-${dateStr}-`

  // Find the latest issue code for today
  const { data, error } = await supabase
    .from('thread_issues')
    .select('issue_code')
    .like('issue_code', `${prefix}%`)
    .order('issue_code', { ascending: false })
    .limit(1)
    .single()

  let sequence = 1
  if (!error && data?.issue_code) {
    const lastSequence = parseInt(data.issue_code.slice(-3))
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1
    }
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

/**
 * Get stock availability for a thread type
 * Returns { full_cones, partial_cones }
 * Queries thread_inventory (same as Weekly Order) for consistency
 */
async function getStockAvailability(
  threadTypeId: number,
  warehouseId?: number,
  weekIds?: number[]
): Promise<{ full_cones: number; partial_cones: number }> {
  let fullCount = 0
  let partialCount = 0

  if (weekIds && weekIds.length > 0) {
    let reservedQuery = supabase
      .from('thread_inventory')
      .select('is_partial')
      .eq('thread_type_id', threadTypeId)
      .eq('status', 'RESERVED_FOR_ORDER')
      .in('reserved_week_id', weekIds)

    if (warehouseId) {
      reservedQuery = reservedQuery.eq('warehouse_id', warehouseId)
    }

    const { data: reserved } = await reservedQuery

    if (reserved) {
      fullCount += reserved.filter((r) => !r.is_partial).length
      partialCount += reserved.filter((r) => r.is_partial).length
    }
  }

  let freeQuery = supabase
    .from('thread_inventory')
    .select('is_partial')
    .eq('thread_type_id', threadTypeId)
    .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])

  if (warehouseId) {
    freeQuery = freeQuery.eq('warehouse_id', warehouseId)
  }

  const { data: free } = await freeQuery

  if (free) {
    fullCount += free.filter((r) => !r.is_partial).length
    partialCount += free.filter((r) => r.is_partial).length
  }

  return { full_cones: fullCount, partial_cones: partialCount }
}

async function validateSubArtId(
  styleId: number | null | undefined,
  subArtId: number | null | undefined
): Promise<string | null> {
  if (!styleId) {
    if (subArtId) return 'Khong the chon sub-art khi chua chon ma hang'
    return null
  }

  const { data: subArts } = await supabase
    .from('sub_arts')
    .select('id')
    .eq('style_id', styleId)
    .limit(1)

  const hasSubArts = subArts && subArts.length > 0

  if (hasSubArts && !subArtId) {
    return 'Ma hang nay yeu cau chon sub-art'
  }

  if (!hasSubArts && subArtId) {
    return 'Ma hang nay khong co sub-art'
  }

  if (subArtId) {
    const { data: subArt } = await supabase
      .from('sub_arts')
      .select('id')
      .eq('id', subArtId)
      .eq('style_id', styleId)
      .single()

    if (!subArt) {
      return 'Sub-art khong thuoc ma hang da chon'
    }
  }

  return null
}

async function getSubArtCode(subArtId: number | null | undefined): Promise<string | null> {
  if (!subArtId) return null
  const { data } = await supabase
    .from('sub_arts')
    .select('sub_art_code')
    .eq('id', subArtId)
    .single()
  return data?.sub_art_code || null
}

async function getConfirmedIssuedEquivalent(
  poId: number,
  styleId: number,
  colorId: number,
  threadTypeId: number,
  ratio: number
): Promise<number> {
  const { data: issuedLines, error } = await supabase
    .from('thread_issue_lines')
    .select(
      `
      issued_full,
      issued_partial,
      returned_full,
      returned_partial,
      thread_issues!inner(status)
    `
    )
    .eq('po_id', poId)
    .eq('style_id', styleId)
    .eq('style_color_id', colorId)
    .eq('thread_type_id', threadTypeId)
    .eq('thread_issues.status', 'CONFIRMED')

  if (error) {
    console.error('Error fetching confirmed issued lines:', error)
    return 0
  }

  return roundToTwoDecimals(
    (issuedLines || []).reduce((total, line: any) => {
      const issuedEquivalent = calculateIssuedEquivalent(
        line.issued_full || 0,
        line.issued_partial || 0,
        ratio
      )
      const returnedEquivalent = calculateIssuedEquivalent(
        line.returned_full || 0,
        line.returned_partial || 0,
        ratio
      )
      return total + Math.max(0, issuedEquivalent - returnedEquivalent)
    }, 0)
  )
}

async function getConfirmedIssuedGross(
  poId: number,
  styleId: number,
  colorId: number,
  threadTypeId: number,
  ratio: number
): Promise<number> {
  const { data: issuedLines, error } = await supabase
    .from('thread_issue_lines')
    .select(
      `
      issued_full,
      issued_partial,
      thread_issues!inner(status)
    `
    )
    .eq('po_id', poId)
    .eq('style_id', styleId)
    .eq('style_color_id', colorId)
    .eq('thread_type_id', threadTypeId)
    .eq('thread_issues.status', 'CONFIRMED')

  if (error) {
    console.error('Error fetching confirmed issued gross:', error)
    return 0
  }

  return roundToTwoDecimals(
    (issuedLines || []).reduce((total, line: any) => {
      return total + calculateIssuedEquivalent(line.issued_full || 0, line.issued_partial || 0, ratio)
    }, 0)
  )
}

async function getBaseQuotaCones(
  poId: number,
  styleId: number,
  colorId: number,
  threadTypeId: number
): Promise<number | null> {
  const { data: orderItems, error } = await supabase
    .from('thread_order_items')
    .select(`quantity, thread_order_weeks!inner(status)`)
    .eq('po_id', poId)
    .eq('style_id', styleId)
    .eq('style_color_id', colorId)
    .eq('thread_order_weeks.status', 'CONFIRMED')

  if (error) return null

  const totalOrderedQuantity = (orderItems || []).reduce(
    (sum, item: { quantity: number | null }) => sum + (item.quantity || 0),
    0
  )
  if (totalOrderedQuantity <= 0) return null

  const { data: specs } = await supabase
    .from('style_color_thread_specs')
    .select(`thread_type_id, style_thread_specs:style_thread_spec_id(style_id, meters_per_unit)`)
    .eq('style_color_id', colorId)
    .eq('thread_type_id', threadTypeId)

  const matchingSpec = (specs || []).find((s: any) => s.style_thread_specs?.style_id === styleId) as any
  if (!matchingSpec?.style_thread_specs?.meters_per_unit) return null

  const { data: threadType } = await supabase
    .from('thread_types')
    .select('meters_per_cone')
    .eq('id', threadTypeId)
    .single()

  if (!threadType?.meters_per_cone) return null

  const totalMeters = totalOrderedQuantity * (matchingSpec.style_thread_specs.meters_per_unit as number)
  return Math.ceil(totalMeters / threadType.meters_per_cone)
}

/**
 * Get remaining quota_cones for a specific PO/style/color/thread_type combination.
 * Remaining quota = confirmed weekly-order demand - net confirmed issued quantity.
 */
async function getQuotaCones(
  poId: number | null | undefined,
  styleId: number | null | undefined,
  colorId: number | null | undefined,
  threadTypeId: number,
  partialConeRatio?: number
): Promise<number | null> {
  if (!poId || !styleId || !colorId) {
    return null
  }

  const ratio = partialConeRatio ?? (await getPartialConeRatio())

  const { data: orderItems, error } = await supabase
    .from('thread_order_items')
    .select(
      `
      quantity,
      thread_order_weeks!inner(status)
    `
    )
    .eq('po_id', poId)
    .eq('style_id', styleId)
    .eq('style_color_id', colorId)
    .eq('thread_order_weeks.status', 'CONFIRMED')

  if (error) {
    console.error('Error fetching confirmed weekly-order items:', error)
    return null
  }

  const totalOrderedQuantity = (orderItems || []).reduce(
    (sum, item: { quantity: number | null }) => sum + (item.quantity || 0),
    0
  )

  if (totalOrderedQuantity <= 0) {
    return null
  }

  // Calculate base quota based on total confirmed weekly-order quantity and BOM
  // Get the spec from style_color_thread_specs joined with style_thread_specs
  // style_color_thread_specs has: style_thread_spec_id, color_id, thread_type_id
  // style_thread_specs has: style_id, meters_per_unit (consumption)
  const { data: specs, error: specError } = await supabase
    .from('style_color_thread_specs')
    .select(`
      thread_type_id,
      style_thread_specs:style_thread_spec_id(
        style_id,
        meters_per_unit
      )
    `)
    .eq('style_color_id', colorId)
    .eq('thread_type_id', threadTypeId)

  if (specError) {
    console.error('Error fetching spec:', specError)
    return null
  }

  // Find the spec matching the style_id
  const matchingSpec = (specs || []).find((s: any) => s.style_thread_specs?.style_id === styleId) as any
  if (!matchingSpec || !matchingSpec.style_thread_specs?.meters_per_unit) {
    return null
  }

  const consumptionPerUnit = matchingSpec.style_thread_specs.meters_per_unit as number

  // Get meters_per_cone from thread_types
  const { data: threadType } = await supabase
    .from('thread_types')
    .select('meters_per_cone')
    .eq('id', threadTypeId)
    .single()

  if (!threadType || !threadType.meters_per_cone) {
    return null
  }

  // Calculate: total_meters = quantity × consumption_per_unit
  // quota_cones = CEIL(total_meters / meters_per_cone)
  const totalMeters = totalOrderedQuantity * consumptionPerUnit
  const baseQuotaCones = Math.ceil(totalMeters / threadType.meters_per_cone)

  const confirmedIssuedEquivalent = await getConfirmedIssuedEquivalent(
    poId,
    styleId,
    colorId,
    threadTypeId,
    ratio
  )

  const remainingQuotaCones = Math.max(0, baseQuotaCones - confirmedIssuedEquivalent)

  return roundToTwoDecimals(remainingQuotaCones)
}

async function findConfirmedWeekIds(
  poId: number | null | undefined,
  styleId: number | null | undefined,
  styleColorId: number | null | undefined
): Promise<number[]> {
  if (!poId || !styleId || !styleColorId) return []

  const { data: items, error } = await supabase
    .from('thread_order_items')
    .select('week_id, thread_order_weeks!inner(status)')
    .eq('po_id', poId)
    .eq('style_id', styleId)
    .eq('style_color_id', styleColorId)
    .eq('thread_order_weeks.status', 'CONFIRMED')

  if (error || !items) return []

  return [...new Set(items.map((i: { week_id: number }) => i.week_id))]
}

async function detectWarehouseForThread(
  threadTypeId: number,
  weekIds: number[]
): Promise<number | undefined> {
  if (weekIds.length > 0) {
    const { data: reserved } = await supabase
      .from('thread_inventory')
      .select('warehouse_id')
      .eq('thread_type_id', threadTypeId)
      .eq('status', 'RESERVED_FOR_ORDER')
      .in('reserved_week_id', weekIds)
      .limit(1)

    if (reserved && reserved.length > 0) {
      return reserved[0].warehouse_id
    }
  }

  const { data: freeCones } = await supabase
    .from('thread_inventory')
    .select('warehouse_id')
    .eq('thread_type_id', threadTypeId)
    .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])
    .limit(100)

  if (!freeCones || freeCones.length === 0) return undefined

  const counts = new Map<number, number>()
  for (const cone of freeCones) {
    counts.set(cone.warehouse_id, (counts.get(cone.warehouse_id) || 0) + 1)
  }

  let bestWarehouseId: number | undefined
  let maxCount = 0
  for (const [whId, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      bestWarehouseId = whId
    }
  }

  return bestWarehouseId
}

/**
 * Deduct stock using FEFO (First Expired First Out)
 * Uses RPC fn_issue_cones_with_movements for atomic operation with movement logging
 */
async function deductStock(
  threadTypeId: number,
  deductFull: number,
  deductPartial: number,
  issueLineId: number,
  performedBy: string,
  weekIds: number[] = [],
  warehouseId?: number
): Promise<{ success: boolean; message?: string; allocatedConeIds?: number[] }> {
  const totalCones = deductFull + deductPartial
  if (totalCones === 0) {
    return { success: true, allocatedConeIds: [] }
  }

  const fullIds: number[] = []
  const partialIds: number[] = []

  let remainingFull = deductFull
  let remainingPartial = deductPartial

  if (weekIds.length > 0) {
    if (remainingFull > 0) {
      let reservedFullQuery = supabase
        .from('thread_inventory')
        .select('id')
        .eq('thread_type_id', threadTypeId)
        .eq('status', 'RESERVED_FOR_ORDER')
        .in('reserved_week_id', weekIds)
        .eq('is_partial', false)
        .order('expiry_date', { ascending: true, nullsFirst: false })
        .order('received_date', { ascending: true })
        .limit(remainingFull)

      if (warehouseId) {
        reservedFullQuery = reservedFullQuery.eq('warehouse_id', warehouseId)
      }

      const { data: reservedFull } = await reservedFullQuery

      if (reservedFull?.length) {
        fullIds.push(...reservedFull.map((c) => c.id))
        remainingFull -= reservedFull.length
      }
    }

    if (remainingPartial > 0) {
      let reservedPartialQuery = supabase
        .from('thread_inventory')
        .select('id')
        .eq('thread_type_id', threadTypeId)
        .eq('status', 'RESERVED_FOR_ORDER')
        .in('reserved_week_id', weekIds)
        .eq('is_partial', true)
        .order('expiry_date', { ascending: true, nullsFirst: false })
        .order('received_date', { ascending: true })
        .limit(remainingPartial)

      if (warehouseId) {
        reservedPartialQuery = reservedPartialQuery.eq('warehouse_id', warehouseId)
      }

      const { data: reservedPartial } = await reservedPartialQuery

      if (reservedPartial?.length) {
        partialIds.push(...reservedPartial.map((c) => c.id))
        remainingPartial -= reservedPartial.length
      }
    }
  }

  if (remainingFull > 0) {
    let availFullQuery = supabase
      .from('thread_inventory')
      .select('id')
      .eq('thread_type_id', threadTypeId)
      .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])
      .eq('is_partial', false)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .order('received_date', { ascending: true })
      .limit(remainingFull)

    if (fullIds.length > 0) {
      availFullQuery = availFullQuery.not('id', 'in', `(${fullIds.join(',')})`)
    }

    if (warehouseId) {
      availFullQuery = availFullQuery.eq('warehouse_id', warehouseId)
    }

    const { data: availFull, error: fullError } = await availFullQuery

    if (fullError) {
      return { success: false, message: 'Loi truy van ton kho cuon nguyen' }
    }

    if (!availFull || availFull.length < remainingFull) {
      return {
        success: false,
        message: `Khong du cuon nguyen. Can ${deductFull}, co ${fullIds.length + (availFull?.length || 0)}`,
      }
    }

    fullIds.push(...availFull.map((c) => c.id))
  }

  if (remainingPartial > 0) {
    let availPartialQuery = supabase
      .from('thread_inventory')
      .select('id')
      .eq('thread_type_id', threadTypeId)
      .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])
      .eq('is_partial', true)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .order('received_date', { ascending: true })
      .limit(remainingPartial)

    if (partialIds.length > 0) {
      availPartialQuery = availPartialQuery.not('id', 'in', `(${partialIds.join(',')})`)
    }

    if (warehouseId) {
      availPartialQuery = availPartialQuery.eq('warehouse_id', warehouseId)
    }

    const { data: availPartial, error: partialError } = await availPartialQuery

    if (partialError) {
      return { success: false, message: 'Loi truy van ton kho cuon le' }
    }

    if (!availPartial || availPartial.length < remainingPartial) {
      return {
        success: false,
        message: `Khong du cuon le. Can ${deductPartial}, co ${partialIds.length + (availPartial?.length || 0)}`,
      }
    }

    partialIds.push(...availPartial.map((c) => c.id))
  }

  const allConeIds = [...fullIds, ...partialIds]

  if (allConeIds.length === 0) {
    return { success: true, allocatedConeIds: [] }
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc('fn_issue_cones_with_movements', {
    p_cone_ids: allConeIds,
    p_line_id: issueLineId,
    p_performed_by: performedBy,
  })

  if (rpcError) {
    console.error('[deductStock] RPC error:', rpcError)
    return { success: false, message: rpcError.message || 'Loi xu ly xuat kho' }
  }

  return { success: true, allocatedConeIds: allConeIds }
}

// Note: addStock function was inlined into the return endpoint for better
// atomicity (three-phase preflight approach with cross-line ID tracking).
// The return endpoint at POST /:id/return now handles stock operations directly.

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/issues/v2/order-options - Get order options for cascading selects
 *
 * Query params:
 * - No params: Return distinct POs from confirmed weekly orders
 * - ?po_id=X: Return distinct Styles for that PO
 * - ?po_id=X&style_id=Y: Return distinct Colors for that PO+Style
 *
 * Returns: { data: [...], error: null }
 */
issuesV2.get('/order-options', async (c) => {
  try {
    const rawQuery = c.req.query()
    const validated = OrderOptionsQuerySchema.parse(rawQuery)
    const { po_id, style_id } = validated

    // Case 3: Return Colors for specific PO + Style
    if (po_id && style_id) {
      const { data: weekIds } = await supabase
        .from('thread_order_weeks')
        .select('id')
        .eq('status', 'CONFIRMED')

      if (!weekIds || weekIds.length === 0) {
        return c.json({ data: [], error: null })
      }

      const { data: colorItems, error: colorError } = await supabase
        .from('thread_order_items')
        .select(`
          style_color_id,
          style_colors:style_color_id (
            id,
            color_name,
            hex_code
          )
        `)
        .eq('po_id', po_id)
        .eq('style_id', style_id)
        .not('style_color_id', 'is', null)
        .in('week_id', weekIds.map((w) => w.id))

      if (colorError) {
        return c.json({ data: null, error: 'Loi truy van mau sac' }, 500)
      }

      const uniqueColors = new Map()
      for (const item of colorItems || []) {
        if (item.style_colors && !uniqueColors.has(item.style_color_id)) {
          const sc = item.style_colors as { id: number; color_name: string; hex_code: string | null }
          uniqueColors.set(item.style_color_id, {
            id: sc.id,
            name: sc.color_name,
            hex_code: sc.hex_code,
          })
        }
      }

      return c.json({ data: Array.from(uniqueColors.values()), error: null })
    }

    // Case 2: Return Styles for specific PO
    if (po_id) {
      // Get confirmed week IDs first
      const { data: weekIds } = await supabase
        .from('thread_order_weeks')
        .select('id')
        .eq('status', 'CONFIRMED')

      if (!weekIds || weekIds.length === 0) {
        return c.json({
          data: [],
          error: null,
        })
      }

      const { data: styleItems, error } = await supabase
        .from('thread_order_items')
        .select(`
          style_id,
          styles:style_id (
            id,
            style_code,
            style_name
          )
        `)
        .eq('po_id', po_id)
        .not('style_id', 'is', null)
        .in(
          'week_id',
          weekIds.map((w) => w.id)
        )

      if (error) {
        return c.json(
          {
            data: null,
            error: 'Loi truy van style',
          },
          500
        )
      }

      // Extract unique styles
      const uniqueStyles = new Map()
      for (const item of styleItems || []) {
        if (item.styles && !uniqueStyles.has(item.style_id)) {
          uniqueStyles.set(item.style_id, item.styles)
        }
      }

      const styleIds = Array.from(uniqueStyles.keys())
      const subArtStyleIds = new Set<number>()
      if (styleIds.length > 0) {
        const { data: subArtRows } = await supabase
          .from('sub_arts')
          .select('style_id')
          .in('style_id', styleIds)
        if (subArtRows) {
          for (const row of subArtRows) {
            subArtStyleIds.add(row.style_id)
          }
        }
      }

      return c.json({
        data: Array.from(uniqueStyles.entries()).map(([styleId, style]) => ({
          ...style,
          has_sub_arts: subArtStyleIds.has(styleId),
        })),
        error: null,
      })
    }

    // Case 1: Return distinct POs (no params)
    // Get confirmed week IDs first
    const { data: weekIds } = await supabase
      .from('thread_order_weeks')
      .select('id')
      .eq('status', 'CONFIRMED')

    if (!weekIds || weekIds.length === 0) {
      return c.json({
        data: [],
        error: null,
      })
    }

    const { data: poItems, error } = await supabase
      .from('thread_order_items')
      .select(`
        po_id,
        purchase_orders:po_id (
          id,
          po_number
        )
      `)
      .not('po_id', 'is', null)
      .in(
        'week_id',
        weekIds.map((w) => w.id)
      )

    if (error) {
      return c.json(
        {
          data: null,
          error: 'Loi truy van PO',
        },
        500
      )
    }

    // Extract unique POs
    const uniquePOs = new Map()
    for (const item of poItems || []) {
      if (item.purchase_orders && !uniquePOs.has(item.po_id)) {
        uniquePOs.set(item.po_id, item.purchase_orders)
      }
    }

    return c.json({
      data: Array.from(uniquePOs.values()),
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/order-options:', err)
    if (err instanceof ZodError) {
      return c.json(
        {
          data: null,
          error: formatZodError(err),
        },
        400
      )
    }
    return c.json(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2 - Create new issue
 *
 * Creates a new issue with status=DRAFT and auto-generated issue_code
 * Body: { department, created_by, notes? }
 * Returns: { issue_id, issue_code }
 */
issuesV2.post('/', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = CreateIssueV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    // Generate unique issue code
    const issueCode = await generateIssueCode()

    // Insert new issue
    const { data: issue, error } = await supabase
      .from('thread_issues')
      .insert({
        issue_code: issueCode,
        department: validated.department,
        created_by: validated.created_by,
        notes: validated.notes || null,
        status: 'DRAFT',
      })
      .select('id, issue_code')
      .single()

    if (error) {
      console.error('Error creating issue:', error)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tao phieu xuat: ' + error.message,
        },
        500
      )
    }

    return c.json({
      data: { issue_id: issue.id, issue_code: issue.issue_code },
      error: null,
      message: 'Tao phieu xuat thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.post('/validate-line', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = ValidateIssueLineV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { thread_type_id, issued_full, issued_partial, po_id, style_id, style_color_id, color_id, sub_art_id } = validated
    const effectiveColorId = style_color_id || color_id

    const subArtError = await validateSubArtId(style_id, sub_art_id)
    if (subArtError) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: subArtError },
        400
      )
    }

    const ratio = await getPartialConeRatio()

    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    const quotaCones = await getQuotaCones(po_id, style_id, effectiveColorId, thread_type_id, ratio)

    const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

    const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)
    const detectedWarehouseId = await detectWarehouseForThread(thread_type_id, weekIds)
    const stock = await getStockAvailability(thread_type_id, detectedWarehouseId, weekIds)

    const stockSufficient =
      (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

    let message: string | undefined
    if (isOverQuota) {
      message = `Vuot dinh muc ${(issuedEquivalent - (quotaCones || 0)).toFixed(2)} cuon`
    }
    if (!stockSufficient) {
      const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
      const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
      message = message
        ? `${message}. Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le`
        : `Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le`
    }

    return c.json({
      data: {
        issued_equivalent: issuedEquivalent,
        is_over_quota: isOverQuota,
        stock_sufficient: stockSufficient,
        quota_cones: quotaCones,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        message,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/validate-line:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.post('/create-with-lines', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = CreateIssueWithLineSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const {
      department,
      created_by,
      notes,
      po_id,
      style_id,
      style_color_id,
      color_id,
      sub_art_id,
      thread_type_id,
      issued_full,
      issued_partial,
      over_quota_notes,
    } = validated
    const effectiveColorId = style_color_id || color_id

    const subArtError = await validateSubArtId(style_id, sub_art_id)
    if (subArtError) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: subArtError },
        400
      )
    }

    const ratio = await getPartialConeRatio()
    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    const quotaCones = await getQuotaCones(po_id, style_id, effectiveColorId, thread_type_id, ratio)
    const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

    if (isOverQuota && !over_quota_notes?.trim()) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Vuot dinh muc, yeu cau ghi chu ly do',
        },
        400
      )
    }

    const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)
    const detectedWarehouseId = await detectWarehouseForThread(thread_type_id, weekIds)
    const stock = await getStockAvailability(thread_type_id, detectedWarehouseId, weekIds)
    const stockSufficient =
      (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

    if (!stockSufficient) {
      const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
      const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: `Khong du ton kho. Thieu ${shortFull > 0 ? shortFull + ' cuon nguyen' : ''}${shortFull > 0 && shortPartial > 0 ? ', ' : ''}${shortPartial > 0 ? shortPartial + ' cuon le' : ''}. Ton kho hien tai: ${stock.full_cones} nguyen, ${stock.partial_cones} le.`,
        },
        400
      )
    }

    const issueCode = await generateIssueCode()

    const { data: issue, error: issueError } = await supabase
      .from('thread_issues')
      .insert({
        issue_code: issueCode,
        department,
        created_by,
        notes: notes || null,
        status: 'DRAFT',
      })
      .select('*')
      .single()

    if (issueError || !issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tao phieu xuat: ' + (issueError?.message || 'Loi khong xac dinh'),
        },
        500
      )
    }

    const { data: line, error: lineError } = await supabase
      .from('thread_issue_lines')
      .insert({
        issue_id: issue.id,
        po_id: po_id || null,
        style_id: style_id || null,
        style_color_id: style_color_id || null,
        color_id: color_id || null,
        sub_art_id: sub_art_id || null,
        thread_type_id,
        quota_cones: quotaCones,
        issued_full: issued_full || 0,
        issued_partial: issued_partial || 0,
        returned_full: 0,
        returned_partial: 0,
        over_quota_notes: over_quota_notes || null,
      })
      .select('*')
      .single()

    if (lineError || !line) {
      await supabase.from('thread_issues').delete().eq('id', issue.id)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the them dong: ' + (lineError?.message || 'Loi khong xac dinh'),
        },
        500
      )
    }

    const { data: threadType } = await supabase
      .from('thread_types')
      .select('code, name')
      .eq('id', thread_type_id)
      .single()

    const { data: poData } = po_id
      ? await supabase.from('purchase_orders').select('id, po_number').eq('id', po_id).single()
      : { data: null }

    const { data: styleData } = style_id
      ? await supabase
          .from('styles')
          .select('id, style_code, style_name')
          .eq('id', style_id)
          .single()
      : { data: null }

    const { data: colorData } = style_color_id
      ? await supabase.from('style_colors').select('id, color_name').eq('id', style_color_id).single()
      : color_id
        ? await supabase.from('colors').select('id, name').eq('id', color_id).single()
        : { data: null }

    const subArtCode = await getSubArtCode(sub_art_id)

    const lineWithComputed = {
      ...line,
      issued_equivalent: issuedEquivalent,
      is_over_quota: isOverQuota,
      stock_available_full: stock.full_cones,
      stock_available_partial: stock.partial_cones,
      thread_code: threadType?.code,
      thread_name: threadType?.name,
      po_number: (poData as any)?.po_number,
      style_code: (styleData as any)?.style_code,
      style_name: (styleData as any)?.style_name,
      color_name: (colorData as any)?.color_name ?? (colorData as any)?.name ?? null,
      sub_art_code: subArtCode,
    }

    return c.json({
      data: {
        ...issue,
        lines: [lineWithComputed],
      },
      error: null,
      message: 'Tao phieu xuat thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/create-with-lines:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * GET /api/issues/v2/form-data - Load thread types with quota & stock for a product color
 *
 * Query: ?po_id=X&style_id=Y&color_id=Z
 * Returns: { thread_types: [{ thread_type_id, thread_name, quota_cones, stock_available_full, stock_available_partial }] }
 */
issuesV2.get('/form-data', async (c) => {
  try {
    const query = c.req.query()

    let validated
    try {
      validated = FormDataQuerySchema.parse(query)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { po_id, style_id, style_color_id, color_id } = validated
    const effectiveColorId = style_color_id || color_id

    // Get thread types from BOM (style_color_thread_specs -> style_thread_specs)
    // style_color_thread_specs has: style_thread_spec_id, color_id, thread_type_id
    // style_thread_specs has: style_id, meters_per_unit (consumption)
    const { data: specs, error: specsError } = await supabase
      .from('style_color_thread_specs')
      .select(
        `
        thread_type_id,
        style_color_id,
        thread_color:colors!thread_color_id(name),
        style_thread_specs:style_thread_spec_id(
          id,
          style_id,
          meters_per_unit
        ),
        thread_types:thread_type_id(id, code, name, meters_per_cone, tex_number, tex_label, supplier_data:suppliers!supplier_id(name))
      `
      )
      .eq('style_color_id', effectiveColorId)

    if (specsError) {
      console.error('Error fetching thread specs:', specsError)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai dinh muc chi',
        },
        500
      )
    }

    // Filter by style_id in JS since we can't filter on joined FK table
    const filteredSpecs = (specs || []).filter((spec: any) => {
      return spec.style_thread_specs?.style_id === style_id
    })

    // Deduplicate by thread_type_id (same thread may appear in multiple specs)
    const uniqueThreadTypeIds = [...new Set(filteredSpecs.map((s: any) => s.thread_type_id))]

    const ratio = await getPartialConeRatio()
    const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)

    // Get stock for each unique thread type
    const threadTypes = await Promise.all(
      uniqueThreadTypeIds.map(async (threadTypeId) => {
        const spec = filteredSpecs.find((s: any) => s.thread_type_id === threadTypeId) as any
        const threadType = spec?.thread_types as any
        const detectedWarehouseId = await detectWarehouseForThread(threadTypeId, weekIds)
        const [stock, quotaCones, baseQuota, confirmedGross] = await Promise.all([
          getStockAvailability(threadTypeId, detectedWarehouseId, weekIds),
          getQuotaCones(po_id, style_id, effectiveColorId, threadTypeId, ratio),
          getBaseQuotaCones(po_id, style_id, effectiveColorId, threadTypeId),
          getConfirmedIssuedGross(po_id, style_id, effectiveColorId, threadTypeId, ratio),
        ])

        const supplierName = (threadType?.supplier_data as any)?.name || ''
        const texPart = (threadType as any)?.tex_label || (threadType?.tex_number ? `TEX ${threadType.tex_number}` : '')
        const colorName = (spec as any)?.thread_color?.name || ''
        const displayName = [supplierName, texPart, colorName].filter(Boolean).join(' - ') || threadType?.name || ''

        return {
          thread_type_id: threadTypeId,
          thread_code: threadType?.code || '',
          thread_name: displayName,
          quota_cones: quotaCones,
          base_quota_cones: baseQuota,
          confirmed_issued_gross: confirmedGross,
          stock_available_full: stock.full_cones,
          stock_available_partial: stock.partial_cones,
        }
      })
    )

    return c.json({
      data: { thread_types: threadTypes },
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/form-data:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/lines/validate - Validate line before adding
 *
 * Body: { thread_type_id, issued_full, issued_partial, po_id?, style_id?, color_id? }
 * Returns: { issued_equivalent, is_over_quota, stock_sufficient, quota_cones, stock_available_full, stock_available_partial, message? }
 */
issuesV2.post('/:id/lines/validate', async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = ValidateIssueLineV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { thread_type_id, issued_full, issued_partial, po_id, style_id, style_color_id: validateStyleColorId, color_id: validateColorId, sub_art_id: validateSubArt } = validated
    const validateEffectiveColorId = validateStyleColorId || validateColorId

    const subArtValidateError = await validateSubArtId(style_id, validateSubArt)
    if (subArtValidateError) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: subArtValidateError },
        400
      )
    }

    // Get partial cone ratio
    const ratio = await getPartialConeRatio()

    // Calculate issued equivalent
    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    // Get quota
    const quotaCones = await getQuotaCones(po_id, style_id, validateEffectiveColorId, thread_type_id, ratio)

    // Check if over quota
    const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

    // Get stock availability
    const weekIds = await findConfirmedWeekIds(po_id, style_id, validateEffectiveColorId)
    const detectedWarehouseId = await detectWarehouseForThread(thread_type_id, weekIds)
    const stock = await getStockAvailability(thread_type_id, detectedWarehouseId, weekIds)

    // Check if stock is sufficient
    const stockSufficient =
      (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

    // Build message
    let message: string | undefined
    if (isOverQuota) {
      message = `Vuot dinh muc ${(issuedEquivalent - (quotaCones || 0)).toFixed(2)} cuon`
    }
    if (!stockSufficient) {
      const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
      const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
      message = message
        ? `${message}. Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le`
        : `Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le`
    }

    return c.json({
      data: {
        issued_equivalent: issuedEquivalent,
        is_over_quota: isOverQuota,
        stock_sufficient: stockSufficient,
        quota_cones: quotaCones,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        message,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/lines/validate:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/lines - Add line to issue
 *
 * Body: { po_id?, style_id?, color_id?, thread_type_id, issued_full, issued_partial, over_quota_notes? }
 * Returns: created line with computed fields
 */
issuesV2.post('/:id/lines', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID phieu xuat khong hop le',
        },
        400
      )
    }

    const body = await c.req.json()

    let validated
    try {
      validated = AddIssueLineV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    // Check if issue exists and is in DRAFT status
    const { data: issue, error: issueError } = await supabase
      .from('thread_issues')
      .select('id, status')
      .eq('id', issueId)
      .single()

    if (issueError || !issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chi co the them dong vao phieu nhap - Phieu da xac nhan',
        },
        400
      )
    }

    const {
      po_id,
      style_id,
      style_color_id,
      color_id,
      sub_art_id,
      thread_type_id,
      issued_full,
      issued_partial,
      over_quota_notes,
    } = validated
    const effectiveColorId = style_color_id || color_id

    const subArtError = await validateSubArtId(style_id, sub_art_id)
    if (subArtError) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: subArtError },
        400
      )
    }

    // Get quota
    // Get partial cone ratio and calculate issued equivalent
    const ratio = await getPartialConeRatio()
    const quotaCones = await getQuotaCones(po_id, style_id, effectiveColorId, thread_type_id, ratio)
    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    // Check if over quota
    const isOverQuota = quotaCones !== null && issuedEquivalent > quotaCones

    // If over quota without notes, reject
    if (isOverQuota && !over_quota_notes?.trim()) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Vuot dinh muc, yeu cau ghi chu ly do',
        },
        400
      )
    }

    // Check stock availability before adding line
    const weekIds = await findConfirmedWeekIds(po_id, style_id, effectiveColorId)
    const detectedWarehouseId = await detectWarehouseForThread(thread_type_id, weekIds)
    const stock = await getStockAvailability(thread_type_id, detectedWarehouseId, weekIds)
    const stockSufficient =
      (issued_full || 0) <= stock.full_cones && (issued_partial || 0) <= stock.partial_cones

    if (!stockSufficient) {
      const shortFull = Math.max(0, (issued_full || 0) - stock.full_cones)
      const shortPartial = Math.max(0, (issued_partial || 0) - stock.partial_cones)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: `Khong du ton kho. Thieu ${shortFull > 0 ? shortFull + ' cuon nguyen' : ''}${shortFull > 0 && shortPartial > 0 ? ', ' : ''}${shortPartial > 0 ? shortPartial + ' cuon le' : ''}. Ton kho hien tai: ${stock.full_cones} nguyen, ${stock.partial_cones} le.`,
        },
        400
      )
    }

    // Insert line
    const { data: line, error: lineError } = await supabase
      .from('thread_issue_lines')
      .insert({
        issue_id: issueId,
        po_id: po_id || null,
        style_id: style_id || null,
        style_color_id: style_color_id || null,
        color_id: color_id || null,
        sub_art_id: sub_art_id || null,
        thread_type_id,
        quota_cones: quotaCones,
        issued_full: issued_full || 0,
        issued_partial: issued_partial || 0,
        returned_full: 0,
        returned_partial: 0,
        over_quota_notes: over_quota_notes || null,
      })
      .select('*')
      .single()

    if (lineError) {
      console.error('Error adding line:', lineError)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the them dong: ' + lineError.message,
        },
        500
      )
    }

    // Stock already fetched above for validation, reuse it
    // Get thread type name
    const { data: threadType } = await supabase
      .from('thread_types')
      .select('code, name')
      .eq('id', thread_type_id)
      .single()

    const lineSubArtCode = await getSubArtCode(sub_art_id)

    return c.json({
      data: {
        ...line,
        issued_equivalent: issuedEquivalent,
        is_over_quota: isOverQuota,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        thread_code: threadType?.code,
        thread_name: threadType?.name,
        sub_art_code: lineSubArtCode,
      },
      error: null,
      message: 'Them dong thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/lines:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.get('/:id/return-logs', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    const { data: issue, error: issueError } = await supabase
      .from('thread_issues')
      .select('id')
      .eq('id', issueId)
      .single()

    if (issueError || !issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    const { data: logs, error: logsError } = await supabase
      .from('thread_issue_return_logs')
      .select('id, issue_id, line_id, returned_full, returned_partial, created_at')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching return logs:', logsError)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai lich su tra hang',
        },
        500
      )
    }

    const lineIds = [...new Set((logs || []).map((l: any) => l.line_id))]
    const linesMap: Record<number, any> = {}

    if (lineIds.length > 0) {
      const { data: lines } = await supabase
        .from('thread_issue_lines')
        .select(`
          id,
          thread_type_id,
          thread_types ( id, name, code ),
          style_color_id,
          style_colors:style_color_id ( id, color_name ),
          color_id,
          colors ( id, name )
        `)
        .in('id', lineIds)

      if (lines) {
        for (const line of lines) {
          linesMap[(line as any).id] = line
        }
      }
    }

    const formattedLogs = (logs || []).map((log: any) => {
      const line = linesMap[log.line_id]
      return {
        id: log.id,
        issue_id: log.issue_id,
        line_id: log.line_id,
        returned_full: log.returned_full,
        returned_partial: log.returned_partial,
        created_at: log.created_at,
        thread_name: line?.thread_types?.name || '',
        thread_code: line?.thread_types?.code || '',
        color_name: line?.style_colors?.color_name ?? line?.colors?.name ?? null,
      }
    })

    return c.json({
      data: formattedLogs,
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/:id/return-logs:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * GET /api/issues/v2/:id - Get issue with all lines and computed fields
 */
issuesV2.get('/:id', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    // Get issue
    const { data: issue, error: issueError } = await supabase
      .from('thread_issues')
      .select('*')
      .eq('id', issueId)
      .single()

    if (issueError || !issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    // Get lines with joined data
    const { data: lines, error: linesError } = await supabase
      .from('thread_issue_lines')
      .select(
        `
        *,
        thread_types!inner(id, code, name),
        purchase_orders(id, po_number),
        styles(id, style_code, style_name),
        style_colors:style_color_id(id, color_name),
        colors(id, name),
        sub_arts(id, sub_art_code)
      `
      )
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })

    if (linesError) {
      console.error('Error fetching lines:', linesError)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai chi tiet phieu xuat',
        },
        500
      )
    }

    // Get partial cone ratio
    const ratio = await getPartialConeRatio()

    // Compute fields for each line
    const linesWithComputed = await Promise.all(
      (lines || []).map(async (line: any) => {
        const issuedEquivalent = calculateIssuedEquivalent(
          line.issued_full,
          line.issued_partial,
          ratio
        )
        const isOverQuota = line.quota_cones !== null && issuedEquivalent > line.quota_cones
        const lineColorId = line.style_color_id || line.color_id
        const lineWeekIds = await findConfirmedWeekIds(line.po_id, line.style_id, lineColorId)
        const detectedWarehouseId = await detectWarehouseForThread(line.thread_type_id, lineWeekIds)
        const stock = await getStockAvailability(line.thread_type_id, detectedWarehouseId, lineWeekIds)

        return {
          ...line,
          issued_equivalent: issuedEquivalent,
          is_over_quota: isOverQuota,
          stock_available_full: stock.full_cones,
          stock_available_partial: stock.partial_cones,
          thread_code: line.thread_types?.code,
          thread_name: line.thread_types?.name,
          po_number: line.purchase_orders?.po_number,
          style_code: line.styles?.style_code,
          style_name: line.styles?.style_name,
          color_name: line.style_colors?.color_name ?? line.colors?.name ?? null,
          sub_art_code: line.sub_arts?.sub_art_code || null,
          // Remove nested objects
          thread_types: undefined,
          purchase_orders: undefined,
          styles: undefined,
          style_colors: undefined,
          colors: undefined,
          sub_arts: undefined,
        }
      })
    )

    return c.json({
      data: {
        ...issue,
        lines: linesWithComputed,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2/:id:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * GET /api/issues/v2 - List issues with filters
 *
 * Query: ?department=X&status=DRAFT&from=2026-02-01&to=2026-02-28&page=1&limit=20
 */
issuesV2.get('/', async (c) => {
  try {
    const query = c.req.query()

    let validated
    try {
      validated = IssueV2FiltersSchema.parse(query)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { department, status, from, to, page = 1, limit = 20 } = validated

    let dbQuery = supabase
      .from('thread_issues')
      .select('*, line_count:thread_issue_lines(count)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (department) {
      dbQuery = dbQuery.eq('department', department)
    }
    if (status) {
      dbQuery = dbQuery.eq('status', status)
    }
    if (from) {
      dbQuery = dbQuery.gte('created_at', `${from}T00:00:00`)
    }
    if (to) {
      dbQuery = dbQuery.lte('created_at', `${to}T23:59:59`)
    }

    // Pagination
    const offset = (page - 1) * limit
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    const { data, error, count } = await dbQuery

    if (error) {
      console.error('Error listing issues:', error)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai danh sach phieu xuat',
        },
        500
      )
    }

    // Flatten the count
    const result = (data || []).map((row: any) => ({
      ...row,
      line_count: row.line_count?.[0]?.count ?? 0,
    }))

    const total = count ?? 0

    return c.json({
      data: {
        data: result,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    })
  } catch (err) {
    console.error('Error in GET /api/issues/v2:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/confirm - Confirm issue and deduct stock
 *
 * Checks:
 * - All lines have sufficient stock
 * - Over-quota lines have notes
 * Then deducts stock and sets status=CONFIRMED
 */
issuesV2.post('/:id/confirm', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    const body = await c.req.json()
    let validated
    try {
      validated = ConfirmIssueV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { idempotency_key, confirmed_by } = validated
    const performedBy = getPerformedBy(c, confirmed_by)
    const requestHash = hashPayload({ issueId, ...body })

    const { data: existingOp, error: opCheckError } = await supabase
      .from('issue_operations_log')
      .select('*')
      .eq('operation_type', 'CONFIRM')
      .eq('idempotency_key', idempotency_key)
      .single()

    if (existingOp && !opCheckError) {
      if (existingOp.request_hash !== requestHash) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Idempotency key da duoc su dung voi payload khac',
          },
          409
        )
      }

      if (existingOp.status === 'COMPLETED') {
        const { data: cachedIssue } = await supabase
          .from('thread_issues')
          .select('*')
          .eq('id', issueId)
          .single()
        return c.json({
          data: cachedIssue,
          error: null,
          message: 'Xac nhan xuat kho thanh cong (cached)',
        })
      }

      if (existingOp.status === 'IN_PROGRESS') {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Operation dang xu ly, vui long doi',
          },
          409
        )
      }
    }

    const { error: insertOpError } = await supabase.from('issue_operations_log').upsert(
      {
        idempotency_key,
        operation_type: 'CONFIRM',
        request_hash: requestHash,
        request_payload: body,
        status: 'IN_PROGRESS',
        succeeded_line_ids: [],
      },
      { onConflict: 'operation_type,idempotency_key' }
    )

    if (insertOpError) {
      console.error('[confirm] Failed to create operation log:', insertOpError)
    }

    const { data: issue, error: issueError } = await supabase
      .from('thread_issues')
      .select('*')
      .eq('id', issueId)
      .single()

    if (issueError || !issue) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: 'Khong tim thay phieu xuat', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'CONFIRM')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'CONFIRM')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Phieu da duoc xac nhan truoc do',
        },
        400
      )
    }

    const { data: lines, error: linesError } = await supabase
      .from('thread_issue_lines')
      .select('*')
      .eq('issue_id', issueId)

    if (linesError) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: 'Khong the tai chi tiet phieu xuat', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'CONFIRM')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai chi tiet phieu xuat',
        },
        500
      )
    }

    if (!lines || lines.length === 0) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: 'Phieu xuat khong co dong nao', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'CONFIRM')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Phieu xuat khong co dong nao',
        },
        400
      )
    }

    const ratio = await getPartialConeRatio()
    const errors: string[] = []

    const weekIdsMap = new Map<number, number[]>()
    for (const line of lines) {
      const lineColorId = line.style_color_id || line.color_id
      const weekIds = await findConfirmedWeekIds(line.po_id, line.style_id, lineColorId)
      weekIdsMap.set(line.id, weekIds)
    }

    const warehouseCache = new Map<string, number | undefined>()

    async function getCachedWarehouse(threadTypeId: number, wIds: number[]): Promise<number | undefined> {
      const cacheKey = `${threadTypeId}:${[...wIds].sort().join(',')}`
      if (warehouseCache.has(cacheKey)) return warehouseCache.get(cacheKey)
      const whId = await detectWarehouseForThread(threadTypeId, wIds)
      warehouseCache.set(cacheKey, whId)
      return whId
    }

    for (const line of lines) {
      const issuedEquivalent = calculateIssuedEquivalent(line.issued_full, line.issued_partial, ratio)
      const isOverQuota = line.quota_cones !== null && issuedEquivalent > line.quota_cones

      if (isOverQuota && !line.over_quota_notes?.trim()) {
        const { data: threadType } = await supabase
          .from('thread_types')
          .select('name')
          .eq('id', line.thread_type_id)
          .single()
        errors.push(`${threadType?.name || 'Loai chi'}: Vuot dinh muc nhung chua co ghi chu`)
      }

      const lineWeekIds = weekIdsMap.get(line.id) || []
      const lineWarehouseId = await getCachedWarehouse(line.thread_type_id, lineWeekIds)
      const stock = await getStockAvailability(line.thread_type_id, lineWarehouseId, lineWeekIds)
      if (line.issued_full > stock.full_cones || line.issued_partial > stock.partial_cones) {
        const { data: threadType } = await supabase
          .from('thread_types')
          .select('name')
          .eq('id', line.thread_type_id)
          .single()
        const shortFull = Math.max(0, line.issued_full - stock.full_cones)
        const shortPartial = Math.max(0, line.issued_partial - stock.partial_cones)
        errors.push(
          `${threadType?.name || 'Loai chi'}: Thieu ${shortFull} cuon nguyen, ${shortPartial} cuon le`
        )
      }
    }

    if (errors.length > 0) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: errors.join('. '), completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'CONFIRM')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: errors.join('. '),
        },
        400
      )
    }

    const succeededLineIds: number[] = []
    for (const line of lines) {
      const weekIds = weekIdsMap.get(line.id) || []
      const execWarehouseId = await getCachedWarehouse(line.thread_type_id, weekIds)
      const result = await deductStock(line.thread_type_id, line.issued_full, line.issued_partial, line.id, performedBy, weekIds, execWarehouseId)
      if (!result.success) {
        await supabase
          .from('issue_operations_log')
          .update({
            status: 'FAILED',
            succeeded_line_ids: succeededLineIds,
            error_info: result.message || 'Loi tru ton kho',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotency_key)
          .eq('operation_type', 'CONFIRM')
        return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
          {
            data: { succeeded_line_ids: succeededLineIds },
            error: result.message || 'Loi tru ton kho',
          },
          500
        )
      }
      succeededLineIds.push(line.id)
    }

    const firstLine = lines[0]
    const firstLineWeekIds = weekIdsMap.get(firstLine.id) || []
    const issueWarehouseId = await getCachedWarehouse(firstLine.thread_type_id, firstLineWeekIds)

    const { data: updatedIssue, error: updateError } = await supabase
      .from('thread_issues')
      .update({
        status: 'CONFIRMED',
        source_warehouse_id: issueWarehouseId || null,
        updated_at: new Date().toISOString(),
        notes: confirmed_by ? `${issue.notes || ''}\nXac nhan boi: ${confirmed_by}`.trim() : issue.notes,
      })
      .eq('id', issueId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating issue status:', updateError)
      await supabase
        .from('issue_operations_log')
        .update({
          status: 'FAILED',
          succeeded_line_ids: succeededLineIds,
          error_info: 'Khong the cap nhat trang thai phieu xuat',
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'CONFIRM')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the cap nhat trang thai phieu xuat',
        },
        500
      )
    }

    await supabase
      .from('issue_operations_log')
      .update({
        status: 'COMPLETED',
        succeeded_line_ids: succeededLineIds,
        completed_at: new Date().toISOString(),
      })
      .eq('idempotency_key', idempotency_key)
      .eq('operation_type', 'CONFIRM')

    return c.json({
      data: updatedIssue,
      error: null,
      message: 'Xac nhan xuat kho thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/confirm:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

/**
 * POST /api/issues/v2/:id/return - Return items and add stock back
 *
 * Body: { lines: [{ line_id, returned_full, returned_partial }], idempotency_key: string }
 * Validates: returned_full <= issued_full AND (returned_full + returned_partial) <= (issued_full + issued_partial)
 * Enforces exact cone availability by line before updating counters
 * Supports partial return conversion from full cones using partial_cone_ratio
 * Uses RPC fn_return_cones_with_movements for atomic operation with movement logging
 * Updates line returned quantities based on actual processed cones
 * If all returned (total_returned >= total_issued) → set status=RETURNED
 */
issuesV2.post('/:id/return', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    if (isNaN(issueId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    const body = await c.req.json()

    let validated
    try {
      validated = ReturnIssueV2Schema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: formatZodError(err),
          },
          400
        )
      }
      throw err
    }

    const { idempotency_key } = validated
    const performedBy = getPerformedBy(c)
    const requestHash = hashPayload({ issueId, ...body })

    const { data: existingOp, error: opCheckError } = await supabase
      .from('issue_operations_log')
      .select('*')
      .eq('operation_type', 'RETURN')
      .eq('idempotency_key', idempotency_key)
      .single()

    if (existingOp && !opCheckError) {
      if (existingOp.request_hash !== requestHash) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Idempotency key da duoc su dung voi payload khac',
          },
          409
        )
      }

      if (existingOp.status === 'COMPLETED') {
        const { data: cachedIssue } = await supabase
          .from('thread_issues')
          .select('*')
          .eq('id', issueId)
          .single()
        return c.json({
          data: cachedIssue,
          error: null,
          message: 'Tra hang thanh cong (cached)',
        })
      }

      if (existingOp.status === 'IN_PROGRESS') {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Operation dang xu ly, vui long doi',
          },
          409
        )
      }
    }

    const { error: insertOpError } = await supabase.from('issue_operations_log').upsert(
      {
        idempotency_key,
        operation_type: 'RETURN',
        request_hash: requestHash,
        request_payload: body,
        status: 'IN_PROGRESS',
        succeeded_line_ids: [],
      },
      { onConflict: 'operation_type,idempotency_key' }
    )

    if (insertOpError) {
      console.error('[return] Failed to create operation log:', insertOpError)
    }

    const { data: issue, error: issueError } = await supabase
      .from('thread_issues')
      .select('*')
      .eq('id', issueId)
      .single()

    if (issueError || !issue) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: 'Khong tim thay phieu xuat', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    if (issue.status !== 'CONFIRMED') {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: 'Chi co the tra hang tu phieu da xac nhan', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chi co the tra hang tu phieu da xac nhan',
        },
        400
      )
    }

    const { data: existingLines, error: linesError } = await supabase
      .from('thread_issue_lines')
      .select('*')
      .eq('issue_id', issueId)

    if (linesError) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: 'Khong the tai chi tiet phieu xuat', completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai chi tiet phieu xuat',
        },
        500
      )
    }

    const lineMap = new Map<number, IssueLine>(
      existingLines?.map((l) => [l.id, l as IssueLine]) || []
    )

    const validation = validateReturnQuantities(validated.lines, lineMap)
    if (!validation.valid) {
      await supabase
        .from('issue_operations_log')
        .update({ status: 'FAILED', error_info: validation.errors.join('. '), completed_at: new Date().toISOString() })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: validation.errors.join('. '),
        },
        400
      )
    }

    const partialConeRatio = await getPartialConeRatio()
    if (!partialConeRatio || partialConeRatio <= 0) {
      await supabase
        .from('issue_operations_log')
        .update({
          status: 'FAILED',
          error_info: `Ty le cuon le khong hop le (${partialConeRatio})`,
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: `Ty le cuon le khong hop le (${partialConeRatio})`,
        },
        400
      )
    }

    const succeededLineIds: number[] = []
    const returnLogRows: Array<{ line_id: number; returned_full: number; returned_partial: number }> = []

    for (const returnLine of validated.lines) {
      const line = lineMap.get(returnLine.line_id)!
      const requestedFull = returnLine.returned_full || 0
      const requestedPartial = returnLine.returned_partial || 0

      if (requestedFull <= 0 && requestedPartial <= 0) {
        continue
      }

      const { data: returnableFullConesRaw, error: fullConesError } = await supabase
        .from('thread_inventory')
        .select('id, quantity_meters, status')
        .eq('issued_line_id', returnLine.line_id)
        .in('status', ['IN_PRODUCTION', 'HARD_ALLOCATED'])
        .eq('is_partial', false)
        .order('id', { ascending: true })

      if (fullConesError) {
        await supabase
          .from('issue_operations_log')
          .update({
            status: 'FAILED',
            succeeded_line_ids: succeededLineIds,
            error_info: `Khong the tai cuon nguyen dang xuat cho dong ${returnLine.line_id}`,
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotency_key)
          .eq('operation_type', 'RETURN')
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Khong the tai du lieu ton kho de tra hang' },
          500
        )
      }

      const { data: returnablePartialConesRaw, error: partialConesError } = await supabase
        .from('thread_inventory')
        .select('id, status')
        .eq('issued_line_id', returnLine.line_id)
        .in('status', ['IN_PRODUCTION', 'HARD_ALLOCATED'])
        .eq('is_partial', true)
        .order('id', { ascending: true })

      if (partialConesError) {
        await supabase
          .from('issue_operations_log')
          .update({
            status: 'FAILED',
            succeeded_line_ids: succeededLineIds,
            error_info: `Khong the tai cuon le dang xuat cho dong ${returnLine.line_id}`,
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotency_key)
          .eq('operation_type', 'RETURN')
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Khong the tai du lieu ton kho de tra hang' },
          500
        )
      }

      const statusRank = (status: string): number => {
        if (status === 'IN_PRODUCTION') return 0
        if (status === 'HARD_ALLOCATED') return 1
        return 2
      }

      const fullCones = (returnableFullConesRaw || []).sort((a, b) => {
        const rankDiff = statusRank(a.status) - statusRank(b.status)
        return rankDiff !== 0 ? rankDiff : a.id - b.id
      })
      const partialCones = (returnablePartialConesRaw || []).sort((a, b) => {
        const rankDiff = statusRank(a.status) - statusRank(b.status)
        return rankDiff !== 0 ? rankDiff : a.id - b.id
      })

      if (requestedFull > fullCones.length) {
        const errorMessage = `Dong ${line.id}: Khong du cuon nguyen de tra (${requestedFull}/${fullCones.length})`
        await supabase
          .from('issue_operations_log')
          .update({
            status: 'FAILED',
            succeeded_line_ids: succeededLineIds,
            error_info: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotency_key)
          .eq('operation_type', 'RETURN')
        return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
          {
            data: { succeeded_line_ids: succeededLineIds },
            error: errorMessage,
          },
          400
        )
      }

      const fullConesForReturn = fullCones.slice(0, requestedFull)
      const remainingFullCones = fullCones.slice(requestedFull)
      const partialFromExistingCount = Math.min(requestedPartial, partialCones.length)
      const partialConesForReturn = partialCones.slice(0, partialFromExistingCount)
      const partialNeedConvertCount = requestedPartial - partialFromExistingCount

      if (partialNeedConvertCount > remainingFullCones.length) {
        const availableEquivalentPartial = partialCones.length + remainingFullCones.length
        const errorMessage = `Dong ${line.id}: Khong du cuon le de tra (${requestedPartial}/${availableEquivalentPartial})`
        await supabase
          .from('issue_operations_log')
          .update({
            status: 'FAILED',
            succeeded_line_ids: succeededLineIds,
            error_info: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotency_key)
          .eq('operation_type', 'RETURN')
        return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
          {
            data: { succeeded_line_ids: succeededLineIds },
            error: errorMessage,
          },
          400
        )
      }

      const partialReturnsPayload: ReturnPartialPayloadItem[] = []
      if (partialNeedConvertCount > 0) {
        const metersPerCone = await getMetersPerCone(line.thread_type_id)
        if (!metersPerCone || metersPerCone <= 0) {
          const errorMessage = `Dong ${line.id}: Khong lay duoc meters_per_cone hop le`
          await supabase
            .from('issue_operations_log')
            .update({
              status: 'FAILED',
              succeeded_line_ids: succeededLineIds,
              error_info: errorMessage,
              completed_at: new Date().toISOString(),
            })
            .eq('idempotency_key', idempotency_key)
            .eq('operation_type', 'RETURN')
          return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
            {
              data: { succeeded_line_ids: succeededLineIds },
              error: errorMessage,
            },
            400
          )
        }

        const partialMeters = Number((metersPerCone * partialConeRatio).toFixed(4))
        if (partialMeters <= 0 || partialMeters >= metersPerCone) {
          const errorMessage = `Dong ${line.id}: Ty le cuon le khong hop le cho phep tach cuon (${partialConeRatio})`
          await supabase
            .from('issue_operations_log')
            .update({
              status: 'FAILED',
              succeeded_line_ids: succeededLineIds,
              error_info: errorMessage,
              completed_at: new Date().toISOString(),
            })
            .eq('idempotency_key', idempotency_key)
            .eq('operation_type', 'RETURN')
          return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
            {
              data: { succeeded_line_ids: succeededLineIds },
              error: errorMessage,
            },
            400
          )
        }

        const sourceFullCones = remainingFullCones.slice(0, partialNeedConvertCount)
        for (const sourceCone of sourceFullCones) {
          if (sourceCone.quantity_meters < partialMeters) {
            const errorMessage = `Dong ${line.id}: Cuon ${sourceCone.id} khong du met de tach cuon le`
            await supabase
              .from('issue_operations_log')
              .update({
                status: 'FAILED',
                succeeded_line_ids: succeededLineIds,
                error_info: errorMessage,
                completed_at: new Date().toISOString(),
              })
              .eq('idempotency_key', idempotency_key)
              .eq('operation_type', 'RETURN')
            return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
              {
                data: { succeeded_line_ids: succeededLineIds },
                error: errorMessage,
              },
              400
            )
          }

          partialReturnsPayload.push({
            original_cone_id: sourceCone.id,
            return_quantity_meters: partialMeters,
          })
        }
      }

      const coneIdsForDirectReturn = [
        ...fullConesForReturn.map((c) => c.id),
        ...partialConesForReturn.map((c) => c.id),
      ]

      const { data: rpcResultRaw, error: rpcError } = await supabase.rpc(
        'fn_return_cones_with_movements',
        {
          p_cone_ids: coneIdsForDirectReturn.length > 0 ? coneIdsForDirectReturn : null,
          p_line_id: returnLine.line_id,
          p_performed_by: performedBy,
          p_partial_returns: partialReturnsPayload.length > 0 ? partialReturnsPayload : null,
        }
      )

      if (rpcError) {
        console.error('[return] RPC error for line', returnLine.line_id, ':', rpcError)
        await supabase
          .from('issue_operations_log')
          .update({
            status: 'FAILED',
            succeeded_line_ids: succeededLineIds,
            error_info: rpcError.message || 'Loi xu ly tra hang',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotency_key)
          .eq('operation_type', 'RETURN')
        return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
          {
            data: { succeeded_line_ids: succeededLineIds },
            error: rpcError.message || 'Loi xu ly tra hang',
          },
          500
        )
      }

      const rpcResult = (rpcResultRaw || {}) as ReturnRpcResult
      const actualReturnedFull =
        typeof rpcResult.full_returned === 'number'
          ? rpcResult.full_returned
          : fullConesForReturn.length
      const actualReturnedPartial =
        typeof rpcResult.partial_existing_returned === 'number' ||
        typeof rpcResult.partial_created_returned === 'number'
          ? (rpcResult.partial_existing_returned || 0) + (rpcResult.partial_created_returned || 0)
          : partialConesForReturn.length + partialReturnsPayload.length

      if (actualReturnedFull !== requestedFull || actualReturnedPartial !== requestedPartial) {
        const errorMessage = `Dong ${line.id}: Ket qua tra kho khong khop yeu cau`
        await supabase
          .from('issue_operations_log')
          .update({
            status: 'FAILED',
            succeeded_line_ids: succeededLineIds,
            error_info: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotency_key)
          .eq('operation_type', 'RETURN')
        return c.json<ThreadApiResponse<{ succeeded_line_ids: number[] }>>(
          {
            data: { succeeded_line_ids: succeededLineIds },
            error: errorMessage,
          },
          500
        )
      }

      const newReturnedFull = (line.returned_full || 0) + actualReturnedFull
      const newReturnedPartial = (line.returned_partial || 0) + actualReturnedPartial

      const { error: updateError } = await supabase
        .from('thread_issue_lines')
        .update({
          returned_full: newReturnedFull,
          returned_partial: newReturnedPartial,
        })
        .eq('id', returnLine.line_id)

      if (updateError) {
        console.error('[return] Error updating line:', updateError)
        await supabase
          .from('issue_operations_log')
          .update({
            status: 'FAILED',
            succeeded_line_ids: succeededLineIds,
            error_info: 'Khong the cap nhat dong tra',
            completed_at: new Date().toISOString(),
          })
          .eq('idempotency_key', idempotency_key)
          .eq('operation_type', 'RETURN')
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Khong the cap nhat dong tra' },
          500
        )
      }

      succeededLineIds.push(returnLine.line_id)
      returnLogRows.push({
        line_id: returnLine.line_id,
        returned_full: actualReturnedFull,
        returned_partial: actualReturnedPartial,
      })
    }

    if (succeededLineIds.length === 0) {
      await supabase
        .from('issue_operations_log')
        .update({
          status: 'FAILED',
          error_info: 'Khong co so luong tra hop le',
          completed_at: new Date().toISOString(),
        })
        .eq('idempotency_key', idempotency_key)
        .eq('operation_type', 'RETURN')
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong co so luong tra hop le',
        },
        400
      )
    }

    try {
      for (const logRow of returnLogRows) {
        await supabase
          .from('thread_issue_return_logs')
          .insert({
            issue_id: issueId,
            line_id: logRow.line_id,
            returned_full: logRow.returned_full,
            returned_partial: logRow.returned_partial,
          })
      }
    } catch (logError) {
      console.error('[return] Failed to insert return log:', logError)
    }

    const { data: updatedLines } = await supabase
      .from('thread_issue_lines')
      .select('*')
      .eq('issue_id', issueId)

    const allReturned = updatedLines?.every(
      (l) => (l.returned_full + l.returned_partial) >= (l.issued_full + l.issued_partial)
    )

    if (allReturned) {
      await supabase
        .from('thread_issues')
        .update({
          status: 'RETURNED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId)
    }

    const { data: finalIssue } = await supabase
      .from('thread_issues')
      .select('*')
      .eq('id', issueId)
      .single()

    await supabase
      .from('issue_operations_log')
      .update({
        status: 'COMPLETED',
        succeeded_line_ids: succeededLineIds,
        completed_at: new Date().toISOString(),
      })
      .eq('idempotency_key', idempotency_key)
      .eq('operation_type', 'RETURN')

    return c.json({
      data: finalIssue,
      error: null,
      message: allReturned ? 'Tra hang hoan tat' : 'Tra hang thanh cong',
    })
  } catch (err) {
    console.error('Error in POST /api/issues/v2/:id/return:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    const { data: issue, error: issueError } = await supabase
      .from('thread_issues')
      .select('id, issue_code, status')
      .eq('id', id)
      .single()

    if (issueError || !issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Không tìm thấy phiếu xuất',
        },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chỉ có thể xóa phiếu xuất ở trạng thái Nháp',
        },
        400
      )
    }

    const { error: deleteLinesError } = await supabase
      .from('thread_issue_lines')
      .delete()
      .eq('issue_id', id)

    if (deleteLinesError) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Không thể xóa các dòng của phiếu xuất',
        },
        500
      )
    }

    const { error: deleteIssueError } = await supabase
      .from('thread_issues')
      .delete()
      .eq('id', id)

    if (deleteIssueError) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Không thể xóa phiếu xuất',
        },
        500
      )
    }

    return c.json({
      data: { id: issue.id, issue_code: issue.issue_code },
      error: null,
    })
  } catch (err) {
    console.error('Error in DELETE /api/issues/v2/:id:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

issuesV2.delete('/:id/lines/:lineId', async (c) => {
  try {
    const issueId = parseInt(c.req.param('id'))
    const lineId = parseInt(c.req.param('lineId'))

    if (isNaN(issueId) || isNaN(lineId)) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'ID khong hop le',
        },
        400
      )
    }

    // Check issue status
    const { data: issue, error: issueError } = await supabase
      .from('thread_issues')
      .select('status')
      .eq('id', issueId)
      .single()

    if (issueError || !issue) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong tim thay phieu xuat',
        },
        404
      )
    }

    if (issue.status !== 'DRAFT') {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chi co the xoa dong tu phieu nhap',
        },
        400
      )
    }

    // Delete line
    const { error: deleteError } = await supabase
      .from('thread_issue_lines')
      .delete()
      .eq('id', lineId)
      .eq('issue_id', issueId)

    if (deleteError) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the xoa dong',
        },
        500
      )
    }

    return c.json({
      data: null,
      error: null,
      message: 'Xoa dong thanh cong',
    })
  } catch (err) {
    console.error('Error in DELETE /api/issues/v2/:id/lines/:lineId:', err)
    return c.json<ThreadApiResponse<null>>(
      {
        data: null,
        error: getErrorMessage(err),
      },
      500
    )
  }
})

export default issuesV2
