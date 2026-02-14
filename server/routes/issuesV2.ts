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

import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import { getErrorMessage } from '../utils/errorHelper'
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

// ============================================================================
// Helper Functions
// ============================================================================

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join('; ')
}

/**
 * Get partial cone ratio from system_settings
 * Default: 0.3 (30%)
 */
async function getPartialConeRatio(): Promise<number> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'partial_cone_ratio')
    .single()

  if (error || !data) {
    console.log('Using default partial_cone_ratio: 0.3')
    return 0.3
  }

  return parseFloat(data.value) || 0.3
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
    .eq('status', 'AVAILABLE')

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

/**
 * Get quota_cones from thread_order_items for a specific combination
 */
async function getQuotaCones(
  poId: number | null | undefined,
  styleId: number | null | undefined,
  colorId: number | null | undefined,
  threadTypeId: number
): Promise<number | null> {
  if (!poId || !styleId || !colorId) {
    return null
  }

  // First, find the week_id for this PO/style/color combination
  const { data: orderItem, error } = await supabase
    .from('thread_order_items')
    .select('id, quantity')
    .eq('po_id', poId)
    .eq('style_id', styleId)
    .eq('color_id', colorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !orderItem) {
    return null
  }

  // Calculate quota based on BOM and quantity
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
    .eq('color_id', colorId)
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
  const totalMeters = orderItem.quantity * consumptionPerUnit
  const quotaCones = Math.ceil(totalMeters / threadType.meters_per_cone)

  return quotaCones
}

/**
 * Deduct stock using FEFO (First Expired First Out)
 */
/**
 * Deduct stock by updating thread_inventory status
 * Changes cones from AVAILABLE to HARD_ALLOCATED (FEFO order)
 */
async function deductStock(
  threadTypeId: number,
  deductFull: number,
  deductPartial: number,
  issueLineId?: number
): Promise<{ success: boolean; message?: string; allocatedConeIds?: number[] }> {
  const allocatedConeIds: number[] = []

  // Deduct full cones first (FEFO: earliest expiry/received first)
  if (deductFull > 0) {
    const { data: fullCones, error: fullError } = await supabase
      .from('thread_inventory')
      .select('id')
      .eq('thread_type_id', threadTypeId)
      .eq('status', 'AVAILABLE')
      .eq('is_partial', false)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .order('received_date', { ascending: true })
      .limit(deductFull)

    if (fullError) {
      return { success: false, message: 'Loi truy van ton kho cuon nguyen' }
    }

    if (!fullCones || fullCones.length < deductFull) {
      return {
        success: false,
        message: `Khong du cuon nguyen. Can ${deductFull}, chi co ${fullCones?.length || 0}`,
      }
    }

    // Update status to HARD_ALLOCATED
    const fullIds = fullCones.map((c) => c.id)
    const { error: updateFullError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'HARD_ALLOCATED',
        updated_at: new Date().toISOString(),
      })
      .in('id', fullIds)

    if (updateFullError) {
      console.error('Error allocating full cones:', updateFullError)
      return { success: false, message: 'Loi cap nhat trang thai cuon nguyen' }
    }

    allocatedConeIds.push(...fullIds)
  }

  // Deduct partial cones (FEFO: earliest expiry/received first)
  if (deductPartial > 0) {
    const { data: partialCones, error: partialError } = await supabase
      .from('thread_inventory')
      .select('id')
      .eq('thread_type_id', threadTypeId)
      .eq('status', 'AVAILABLE')
      .eq('is_partial', true)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .order('received_date', { ascending: true })
      .limit(deductPartial)

    if (partialError) {
      return { success: false, message: 'Loi truy van ton kho cuon le' }
    }

    if (!partialCones || partialCones.length < deductPartial) {
      return {
        success: false,
        message: `Khong du cuon le. Can ${deductPartial}, chi co ${partialCones?.length || 0}`,
      }
    }

    // Update status to HARD_ALLOCATED
    const partialIds = partialCones.map((c) => c.id)
    const { error: updatePartialError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'HARD_ALLOCATED',
        updated_at: new Date().toISOString(),
      })
      .in('id', partialIds)

    if (updatePartialError) {
      console.error('Error allocating partial cones:', updatePartialError)
      return { success: false, message: 'Loi cap nhat trang thai cuon le' }
    }

    allocatedConeIds.push(...partialIds)
  }

  return { success: true, allocatedConeIds }
}

/**
 * Add stock back (for returns)
 * Changes cones from HARD_ALLOCATED back to AVAILABLE
 */
async function addStock(
  threadTypeId: number,
  addFull: number,
  addPartial: number
): Promise<{ success: boolean; message?: string }> {
  // Return full cones to AVAILABLE status
  if (addFull > 0) {
    const { data: fullCones, error: fullError } = await supabase
      .from('thread_inventory')
      .select('id')
      .eq('thread_type_id', threadTypeId)
      .eq('status', 'HARD_ALLOCATED')
      .eq('is_partial', false)
      .order('updated_at', { ascending: false }) // Most recently allocated first (LIFO for returns)
      .limit(addFull)

    if (fullError) {
      return { success: false, message: 'Loi truy van cuon nguyen da xuat' }
    }

    if (!fullCones || fullCones.length < addFull) {
      return {
        success: false,
        message: `Khong du cuon nguyen da xuat de tra. Can tra ${addFull}, chi co ${fullCones?.length || 0} da xuat`,
      }
    }

    const fullIds = fullCones.map((c) => c.id)
    const { error: updateFullError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'AVAILABLE',
        updated_at: new Date().toISOString(),
      })
      .in('id', fullIds)

    if (updateFullError) {
      console.error('Error returning full cones:', updateFullError)
      return { success: false, message: 'Loi tra cuon nguyen ve kho' }
    }
  }

  // Return partial cones to AVAILABLE status
  if (addPartial > 0) {
    const { data: partialCones, error: partialError } = await supabase
      .from('thread_inventory')
      .select('id')
      .eq('thread_type_id', threadTypeId)
      .eq('status', 'HARD_ALLOCATED')
      .eq('is_partial', true)
      .order('updated_at', { ascending: false })
      .limit(addPartial)

    if (partialError) {
      return { success: false, message: 'Loi truy van cuon le da xuat' }
    }

    if (!partialCones || partialCones.length < addPartial) {
      return {
        success: false,
        message: `Khong du cuon le da xuat de tra. Can tra ${addPartial}, chi co ${partialCones?.length || 0} da xuat`,
      }
    }

    const partialIds = partialCones.map((c) => c.id)
    const { error: updatePartialError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'AVAILABLE',
        updated_at: new Date().toISOString(),
      })
      .in('id', partialIds)

    if (updatePartialError) {
      console.error('Error returning partial cones:', updatePartialError)
      return { success: false, message: 'Loi tra cuon le ve kho' }
    }
  }

  return { success: true }
}

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
      const { data: colors, error } = await supabase
        .from('thread_order_items')
        .select(`
          color_id,
          colors:color_id (
            id,
            name,
            hex_code
          )
        `)
        .eq('po_id', po_id)
        .eq('style_id', style_id)
        .not('color_id', 'is', null)
        .eq('thread_order_weeks.status', 'confirmed')

      if (error) {
        // Try alternative query without join filter
        const { data: weekIds } = await supabase
          .from('thread_order_weeks')
          .select('id')
          .eq('status', 'confirmed')

        if (!weekIds || weekIds.length === 0) {
          return c.json({
            data: [],
            error: null,
          })
        }

        const { data: colorItems, error: colorError } = await supabase
          .from('thread_order_items')
          .select(`
            color_id,
            colors:color_id (
              id,
              name,
              hex_code
            )
          `)
          .eq('po_id', po_id)
          .eq('style_id', style_id)
          .not('color_id', 'is', null)
          .in(
            'week_id',
            weekIds.map((w) => w.id)
          )

        if (colorError) {
          return c.json(
            {
              data: null,
              error: 'Loi truy van mau sac',
            },
            500
          )
        }

        // Extract unique colors
        const uniqueColors = new Map()
        for (const item of colorItems || []) {
          if (item.colors && !uniqueColors.has(item.color_id)) {
            uniqueColors.set(item.color_id, item.colors)
          }
        }

        return c.json({
          data: Array.from(uniqueColors.values()),
          error: null,
        })
      }

      // Extract unique colors
      const uniqueColors = new Map()
      for (const item of colors || []) {
        if (item.colors && !uniqueColors.has(item.color_id)) {
          uniqueColors.set(item.color_id, item.colors)
        }
      }

      return c.json({
        data: Array.from(uniqueColors.values()),
        error: null,
      })
    }

    // Case 2: Return Styles for specific PO
    if (po_id) {
      // Get confirmed week IDs first
      const { data: weekIds } = await supabase
        .from('thread_order_weeks')
        .select('id')
        .eq('status', 'confirmed')

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

      return c.json({
        data: Array.from(uniqueStyles.values()),
        error: null,
      })
    }

    // Case 1: Return distinct POs (no params)
    // Get confirmed week IDs first
    const { data: weekIds } = await supabase
      .from('thread_order_weeks')
      .select('id')
      .eq('status', 'confirmed')

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

    const { thread_type_id, issued_full, issued_partial, po_id, style_id, color_id } = validated

    const ratio = await getPartialConeRatio()

    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    const quotaCones = await getQuotaCones(po_id, style_id, color_id, thread_type_id)

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
      color_id,
      thread_type_id,
      issued_full,
      issued_partial,
      over_quota_notes,
    } = validated

    const ratio = await getPartialConeRatio()
    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    const quotaCones = await getQuotaCones(po_id, style_id, color_id, thread_type_id)
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
        color_id: color_id || null,
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

    const { data: colorData } = color_id
      ? await supabase.from('colors').select('id, name').eq('id', color_id).single()
      : { data: null }

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
      color_name: (colorData as any)?.name,
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

    const { po_id, style_id, color_id } = validated

    // Get thread types from BOM (style_color_thread_specs -> style_thread_specs)
    // style_color_thread_specs has: style_thread_spec_id, color_id, thread_type_id
    // style_thread_specs has: style_id, meters_per_unit (consumption)
    const { data: specs, error: specsError } = await supabase
      .from('style_color_thread_specs')
      .select(
        `
        thread_type_id,
        color_id,
        style_thread_specs:style_thread_spec_id(
          id,
          style_id,
          meters_per_unit
        ),
        thread_types:thread_type_id(id, code, name, meters_per_cone)
      `
      )
      .eq('color_id', color_id)

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

    // Get stock for each unique thread type
    const threadTypes = await Promise.all(
      uniqueThreadTypeIds.map(async (threadTypeId) => {
        const spec = filteredSpecs.find((s: any) => s.thread_type_id === threadTypeId) as any
        const threadType = spec?.thread_types as any
        const stock = await getStockAvailability(threadTypeId)
        const quotaCones = await getQuotaCones(po_id, style_id, color_id, threadTypeId)

        return {
          thread_type_id: threadTypeId,
          thread_code: threadType?.code || '',
          thread_name: threadType?.name || '',
          quota_cones: quotaCones,
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

    const { thread_type_id, issued_full, issued_partial, po_id, style_id, color_id } = validated

    // Get partial cone ratio
    const ratio = await getPartialConeRatio()

    // Calculate issued equivalent
    const issuedEquivalent = calculateIssuedEquivalent(issued_full || 0, issued_partial || 0, ratio)

    // Get quota
    const quotaCones = await getQuotaCones(po_id, style_id, color_id, thread_type_id)

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
      color_id,
      thread_type_id,
      issued_full,
      issued_partial,
      over_quota_notes,
    } = validated

    // Get quota
    const quotaCones = await getQuotaCones(po_id, style_id, color_id, thread_type_id)

    // Get partial cone ratio and calculate issued equivalent
    const ratio = await getPartialConeRatio()
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
        color_id: color_id || null,
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

    return c.json({
      data: {
        ...line,
        issued_equivalent: issuedEquivalent,
        is_over_quota: isOverQuota,
        stock_available_full: stock.full_cones,
        stock_available_partial: stock.partial_cones,
        thread_code: threadType?.code,
        thread_name: threadType?.name,
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
        color_name: line?.colors?.name || null,
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
        colors(id, name)
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
          color_name: line.colors?.name,
          // Remove nested objects
          thread_types: undefined,
          purchase_orders: undefined,
          styles: undefined,
          colors: undefined,
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

    // Optional body for confirmed_by
    let confirmedBy: string | undefined
    try {
      const body = await c.req.json()
      const validated = ConfirmIssueV2Schema.parse(body)
      confirmedBy = validated.confirmed_by
    } catch {
      // Body is optional
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

    if (issue.status !== 'DRAFT') {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Phieu da duoc xac nhan truoc do',
        },
        400
      )
    }

    // Get lines
    const { data: lines, error: linesError } = await supabase
      .from('thread_issue_lines')
      .select('*')
      .eq('issue_id', issueId)

    if (linesError) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai chi tiet phieu xuat',
        },
        500
      )
    }

    if (!lines || lines.length === 0) {
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

    // Validate each line
    for (const line of lines) {
      const issuedEquivalent = calculateIssuedEquivalent(line.issued_full, line.issued_partial, ratio)
      const isOverQuota = line.quota_cones !== null && issuedEquivalent > line.quota_cones

      // Check over-quota has notes
      if (isOverQuota && !line.over_quota_notes?.trim()) {
        const { data: threadType } = await supabase
          .from('thread_types')
          .select('name')
          .eq('id', line.thread_type_id)
          .single()
        errors.push(`${threadType?.name || 'Loai chi'}: Vuot dinh muc nhung chua co ghi chu`)
      }

      // Check stock
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
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: errors.join('. '),
        },
        400
      )
    }

    // Deduct stock for each line
    for (const line of lines) {
      const result = await deductStock(line.thread_type_id, line.issued_full, line.issued_partial)
      if (!result.success) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: result.message || 'Loi tru ton kho',
          },
          500
        )
      }
    }

    // Update issue status
    const { data: updatedIssue, error: updateError } = await supabase
      .from('thread_issues')
      .update({
        status: 'CONFIRMED',
        updated_at: new Date().toISOString(),
        notes: confirmedBy ? `${issue.notes || ''}\nXac nhan boi: ${confirmedBy}`.trim() : issue.notes,
      })
      .eq('id', issueId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating issue status:', updateError)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the cap nhat trang thai phieu xuat',
        },
        500
      )
    }

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
 * Body: { lines: [{ line_id, returned_full, returned_partial }] }
 * Validates: returned <= issued for each line
 * Adds stock back and updates line returned quantities
 * If all returned → set status=RETURNED
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

    if (issue.status !== 'CONFIRMED') {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Chi co the tra hang tu phieu da xac nhan',
        },
        400
      )
    }

    // Get all lines for this issue
    const { data: existingLines, error: linesError } = await supabase
      .from('thread_issue_lines')
      .select('*')
      .eq('issue_id', issueId)

    if (linesError) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Khong the tai chi tiet phieu xuat',
        },
        500
      )
    }

    const lineMap = new Map(existingLines?.map((l) => [l.id, l]) || [])
    const errors: string[] = []

    // Validate return quantities
    for (const returnLine of validated.lines) {
      const line = lineMap.get(returnLine.line_id)
      if (!line) {
        errors.push(`Dong ID ${returnLine.line_id} khong ton tai`)
        continue
      }

      const totalReturnedFull = line.returned_full + returnLine.returned_full
      const totalReturnedPartial = line.returned_partial + returnLine.returned_partial

      if (totalReturnedFull > line.issued_full) {
        errors.push(
          `Dong ${line.id}: Tra nguyen ${totalReturnedFull} > xuat ${line.issued_full}`
        )
      }
      if (totalReturnedPartial > line.issued_partial) {
        errors.push(
          `Dong ${line.id}: Tra le ${totalReturnedPartial} > xuat ${line.issued_partial}`
        )
      }
    }

    if (errors.length > 0) {
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: errors.join('. '),
        },
        400
      )
    }

    // Process returns
    for (const returnLine of validated.lines) {
      const line = lineMap.get(returnLine.line_id)!

      // Add stock back
      const result = await addStock(
        line.thread_type_id,
        returnLine.returned_full,
        returnLine.returned_partial
      )

      if (!result.success) {
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: result.message || 'Loi nhap lai ton kho',
          },
          500
        )
      }

      // Update line returned quantities
      const { error: updateError } = await supabase
        .from('thread_issue_lines')
        .update({
          returned_full: line.returned_full + returnLine.returned_full,
          returned_partial: line.returned_partial + returnLine.returned_partial,
        })
        .eq('id', returnLine.line_id)

      if (updateError) {
        console.error('Error updating line:', updateError)
        return c.json<ThreadApiResponse<null>>(
          {
            data: null,
            error: 'Khong the cap nhat dong tra',
          },
          500
        )
      }
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
      console.error('[issuesV2] Failed to insert return log:', logError)
    }

    const { data: updatedLines } = await supabase
      .from('thread_issue_lines')
      .select('*')
      .eq('issue_id', issueId)

    const allReturned = updatedLines?.every(
      (l) => l.returned_full >= l.issued_full && l.returned_partial >= l.issued_partial
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
