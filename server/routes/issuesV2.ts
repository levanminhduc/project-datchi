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
  AddIssueLineV2Schema,
  ValidateIssueLineV2Schema,
  IssueV2FiltersSchema,
  FormDataQuerySchema,
  ReturnIssueV2Schema,
  ConfirmIssueV2Schema,
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
 */
async function getStockAvailability(
  threadTypeId: number,
  warehouseId?: number
): Promise<{ full_cones: number; partial_cones: number }> {
  let query = supabase
    .from('thread_stock')
    .select('qty_full_cones, qty_partial_cones')
    .eq('thread_type_id', threadTypeId)

  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return { full_cones: 0, partial_cones: 0 }
  }

  // Sum across all lots/warehouses
  const fullCones = data.reduce((sum, row) => sum + (row.qty_full_cones || 0), 0)
  const partialCones = data.reduce((sum, row) => sum + (row.qty_partial_cones || 0), 0)

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
  // Get the spec from style_color_thread_specs for this thread type
  const { data: spec } = await supabase
    .from('style_color_thread_specs')
    .select('thread_type_id, consumption_per_unit')
    .eq('style_id', styleId)
    .eq('color_id', colorId)
    .eq('thread_type_id', threadTypeId)
    .single()

  if (!spec || !spec.consumption_per_unit) {
    return null
  }

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
  const totalMeters = orderItem.quantity * spec.consumption_per_unit
  const quotaCones = Math.ceil(totalMeters / threadType.meters_per_cone)

  return quotaCones
}

/**
 * Deduct stock using FEFO (First Expired First Out)
 */
async function deductStock(
  threadTypeId: number,
  deductFull: number,
  deductPartial: number
): Promise<{ success: boolean; message?: string }> {
  // Get stock records ordered by received_date (FEFO)
  const { data: stocks, error } = await supabase
    .from('thread_stock')
    .select('id, qty_full_cones, qty_partial_cones')
    .eq('thread_type_id', threadTypeId)
    .gt('qty_full_cones', 0)
    .or('qty_partial_cones.gt.0')
    .order('received_date', { ascending: true })

  if (error) {
    return { success: false, message: 'Loi truy van ton kho' }
  }

  if (!stocks || stocks.length === 0) {
    return { success: false, message: 'Khong co ton kho' }
  }

  let remainingFull = deductFull
  let remainingPartial = deductPartial
  const updates: { id: number; qty_full_cones: number; qty_partial_cones: number }[] = []

  for (const stock of stocks) {
    if (remainingFull <= 0 && remainingPartial <= 0) break

    let newFull = stock.qty_full_cones
    let newPartial = stock.qty_partial_cones

    // Deduct full cones
    if (remainingFull > 0 && newFull > 0) {
      const deduct = Math.min(remainingFull, newFull)
      newFull -= deduct
      remainingFull -= deduct
    }

    // Deduct partial cones
    if (remainingPartial > 0 && newPartial > 0) {
      const deduct = Math.min(remainingPartial, newPartial)
      newPartial -= deduct
      remainingPartial -= deduct
    }

    if (newFull !== stock.qty_full_cones || newPartial !== stock.qty_partial_cones) {
      updates.push({ id: stock.id, qty_full_cones: newFull, qty_partial_cones: newPartial })
    }
  }

  // Check if we have enough
  if (remainingFull > 0 || remainingPartial > 0) {
    return {
      success: false,
      message: `Khong du ton kho. Thieu ${remainingFull} cuon nguyen, ${remainingPartial} cuon le`,
    }
  }

  // Apply updates
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('thread_stock')
      .update({
        qty_full_cones: update.qty_full_cones,
        qty_partial_cones: update.qty_partial_cones,
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id)

    if (updateError) {
      console.error('Error updating stock:', updateError)
      return { success: false, message: 'Loi cap nhat ton kho' }
    }
  }

  return { success: true }
}

/**
 * Add stock back (for returns)
 */
async function addStock(
  threadTypeId: number,
  addFull: number,
  addPartial: number
): Promise<{ success: boolean; message?: string }> {
  // Get the most recent stock record for this thread type
  const { data: stock, error } = await supabase
    .from('thread_stock')
    .select('id, qty_full_cones, qty_partial_cones')
    .eq('thread_type_id', threadTypeId)
    .order('received_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !stock) {
    // No existing stock record, create new one
    const { error: insertError } = await supabase.from('thread_stock').insert({
      thread_type_id: threadTypeId,
      qty_full_cones: addFull,
      qty_partial_cones: addPartial,
      received_date: new Date().toISOString().split('T')[0],
    })

    if (insertError) {
      console.error('Error creating stock record:', insertError)
      return { success: false, message: 'Loi tao ban ghi ton kho' }
    }

    return { success: true }
  }

  // Update existing record
  const { error: updateError } = await supabase
    .from('thread_stock')
    .update({
      qty_full_cones: stock.qty_full_cones + addFull,
      qty_partial_cones: stock.qty_partial_cones + addPartial,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stock.id)

  if (updateError) {
    console.error('Error updating stock:', updateError)
    return { success: false, message: 'Loi cap nhat ton kho' }
  }

  return { success: true }
}

// ============================================================================
// Routes
// ============================================================================

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

    // Get thread types from BOM (style_color_thread_specs)
    let threadTypesQuery = supabase
      .from('style_color_thread_specs')
      .select(
        `
        thread_type_id,
        consumption_per_unit,
        thread_types!inner(id, code, name, meters_per_cone)
      `
      )

    if (style_id) {
      threadTypesQuery = threadTypesQuery.eq('style_id', style_id)
    }
    if (color_id) {
      threadTypesQuery = threadTypesQuery.eq('color_id', color_id)
    }

    const { data: specs, error: specsError } = await threadTypesQuery

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

    // Get stock for each thread type
    const threadTypes = await Promise.all(
      (specs || []).map(async (spec: any) => {
        const threadType = spec.thread_types
        const stock = await getStockAvailability(spec.thread_type_id)
        const quotaCones = await getQuotaCones(po_id, style_id, color_id, spec.thread_type_id)

        return {
          thread_type_id: spec.thread_type_id,
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

    // Get stock for response
    const stock = await getStockAvailability(thread_type_id)

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

    // Check if all items are returned
    const { data: updatedLines } = await supabase
      .from('thread_issue_lines')
      .select('*')
      .eq('issue_id', issueId)

    const allReturned = updatedLines?.every(
      (l) => l.returned_full >= l.issued_full && l.returned_partial >= l.issued_partial
    )

    // Update issue status if all returned
    if (allReturned) {
      await supabase
        .from('thread_issues')
        .update({
          status: 'RETURNED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', issueId)
    }

    // Return updated issue
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

/**
 * DELETE /api/issues/v2/:id/lines/:lineId - Remove line from issue
 * Only allowed for DRAFT issues
 */
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
