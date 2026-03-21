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

interface FoundCones {
  ids: number[]
  requested: number
  found: number
}

async function tryFindHardAllocatedCones(
  threadTypeId: number,
  count: number,
  isPartial: boolean,
  excludeIds: Set<number>
): Promise<FoundCones> {
  if (count <= 0) {
    return { ids: [], requested: 0, found: 0 }
  }

  const excludeList = excludeIds.size > 0 ? Array.from(excludeIds).join(',') : '0'

  let query = supabase
    .from('thread_inventory')
    .select('id')
    .eq('thread_type_id', threadTypeId)
    .eq('status', 'HARD_ALLOCATED')
    .eq('is_partial', isPartial)
    .order('updated_at', { ascending: false })
    .limit(count)

  if (excludeIds.size > 0) {
    query = query.not('id', 'in', `(${excludeList})`)
  }

  const { data: cones, error } = await query

  if (error) {
    console.error(`[return] Error finding HARD_ALLOCATED cones:`, error)
    return { ids: [], requested: count, found: 0 }
  }

  return {
    ids: cones?.map((c) => c.id) || [],
    requested: count,
    found: cones?.length || 0,
  }
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
  warehouseId?: number
): Promise<{ full_cones: number; partial_cones: number }> {
  let query = supabase
    .from('thread_inventory')
    .select('is_partial')
    .eq('thread_type_id', threadTypeId)
    .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED', 'SOFT_ALLOCATED', 'HARD_ALLOCATED'])

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return { full_cones: 0, partial_cones: 0 }
  }

  // Count full cones (is_partial = false) and partial cones (is_partial = true)
  const fullCones = data.filter((row) => !row.is_partial).length
  const partialCones = data.filter((row) => row.is_partial).length

  return { full_cones: fullCones, partial_cones: partialCones }
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

/**
 * Deduct stock using FEFO (First Expired First Out)
 * Uses RPC fn_issue_cones_with_movements for atomic operation with movement logging
 */
async function deductStock(
  threadTypeId: number,
  deductFull: number,
  deductPartial: number,
  issueLineId: number,
  performedBy: string
): Promise<{ success: boolean; message?: string; allocatedConeIds?: number[] }> {
  const allocatedConeIds: number[] = []

  const totalCones = deductFull + deductPartial
  if (totalCones === 0) {
    return { success: true, allocatedConeIds: [] }
  }

  const { data: fullCones, error: fullError } = await supabase
    .from('thread_inventory')
    .select('id')
    .eq('thread_type_id', threadTypeId)
    .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])
    .eq('is_partial', false)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('received_date', { ascending: true })
    .limit(deductFull)

  if (fullError) {
    return { success: false, message: 'Loi truy van ton kho cuon nguyen' }
  }

  if (deductFull > 0 && (!fullCones || fullCones.length < deductFull)) {
    return {
      success: false,
      message: `Khong du cuon nguyen. Can ${deductFull}, chi co ${fullCones?.length || 0}`,
    }
  }

  const { data: partialCones, error: partialError } = await supabase
    .from('thread_inventory')
    .select('id')
    .eq('thread_type_id', threadTypeId)
    .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])
    .eq('is_partial', true)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('received_date', { ascending: true })
    .limit(deductPartial)

  if (partialError) {
    return { success: false, message: 'Loi truy van ton kho cuon le' }
  }

  if (deductPartial > 0 && (!partialCones || partialCones.length < deductPartial)) {
    return {
      success: false,
      message: `Khong du cuon le. Can ${deductPartial}, chi co ${partialCones?.length || 0}`,
    }
  }

  const fullIds = fullCones?.map((c) => c.id) || []
  const partialIds = partialCones?.map((c) => c.id) || []
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

  allocatedConeIds.push(...allConeIds)
  return { success: true, allocatedConeIds }
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

    const stock = await getStockAvailability(thread_type_id)

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

    const stock = await getStockAvailability(thread_type_id)
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
        style_thread_specs:style_thread_spec_id(
          id,
          style_id,
          meters_per_unit
        ),
        thread_types:thread_type_id(id, code, name, meters_per_cone)
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

    // Get stock for each unique thread type
    const threadTypes = await Promise.all(
      uniqueThreadTypeIds.map(async (threadTypeId) => {
        const spec = filteredSpecs.find((s: any) => s.thread_type_id === threadTypeId) as any
        const threadType = spec?.thread_types as any
        const [stock, quotaCones, baseQuota, confirmedGross] = await Promise.all([
          getStockAvailability(threadTypeId),
          getQuotaCones(po_id, style_id, effectiveColorId, threadTypeId, ratio),
          getBaseQuotaCones(po_id, style_id, effectiveColorId, threadTypeId),
          getConfirmedIssuedGross(po_id, style_id, effectiveColorId, threadTypeId, ratio),
        ])

        return {
          thread_type_id: threadTypeId,
          thread_code: threadType?.code || '',
          thread_name: threadType?.name || '',
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
    const stock = await getStockAvailability(thread_type_id)

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
    const stock = await getStockAvailability(thread_type_id)
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
        const stock = await getStockAvailability(line.thread_type_id)

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

      const stock = await getStockAvailability(line.thread_type_id)
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
      const result = await deductStock(line.thread_type_id, line.issued_full, line.issued_partial, line.id, performedBy)
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

    const { data: updatedIssue, error: updateError } = await supabase
      .from('thread_issues')
      .update({
        status: 'CONFIRMED',
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
 * Uses RPC fn_return_cones_with_movements for atomic operation with movement logging
 * Updates line returned quantities
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

    const succeededLineIds: number[] = []

    for (const returnLine of validated.lines) {
      const line = lineMap.get(returnLine.line_id)!

      const { data: fullCones } = await supabase
        .from('thread_inventory')
        .select('id')
        .eq('issued_line_id', returnLine.line_id)
        .eq('status', 'HARD_ALLOCATED')
        .eq('is_partial', false)
        .limit(returnLine.returned_full)

      const { data: partialCones } = await supabase
        .from('thread_inventory')
        .select('id')
        .eq('issued_line_id', returnLine.line_id)
        .eq('status', 'HARD_ALLOCATED')
        .eq('is_partial', true)
        .limit(returnLine.returned_partial)

      const fullConeIds = fullCones?.map((c) => c.id) || []
      const partialConeIds = partialCones?.map((c) => c.id) || []
      const allConeIds = [...fullConeIds, ...partialConeIds]

      if (allConeIds.length > 0) {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('fn_return_cones_with_movements', {
          p_cone_ids: allConeIds,
          p_line_id: returnLine.line_id,
          p_performed_by: performedBy,
          p_partial_returns: null,
        })

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
      }

      const newReturnedFull = (line.returned_full || 0) + returnLine.returned_full
      const newReturnedPartial = (line.returned_partial || 0) + returnLine.returned_partial

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
    }

    try {
      for (const returnLine of validated.lines) {
        await supabase
          .from('thread_issue_return_logs')
          .insert({
            issue_id: issueId,
            line_id: returnLine.line_id,
            returned_full: returnLine.returned_full,
            returned_partial: returnLine.returned_partial,
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
