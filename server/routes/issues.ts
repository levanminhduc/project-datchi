import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import { getErrorMessage } from '../utils/errorHelper'
import {
  CreateIssueRequestSchema,
  UpdateIssueRequestSchema,
  IssueRequestFiltersSchema,
  AddIssueItemSchema,
  CreateReturnSchema,
  ReturnFiltersSchema,
} from '../validation/issues'
import type { ThreadApiResponse, MovementType } from '../types/thread'

const issues = new Hono()

// ============================================================================
// Helper Functions
// ============================================================================

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join('; ')
}

// ============================================================================
// Issue Request Status Enum
// ============================================================================

type IssueRequestStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED'

// ============================================================================
// ROUTES: Issue Requests
// ============================================================================

/**
 * POST /api/issues - Create new issue request
 *
 * Creates a new thread issue request (phieu xuat kho).
 * Generates issue_code using fn_generate_issue_code()
 * Calculates quota using fn_calculate_quota()
 */
issues.post('/', async (c) => {
  try {
    const body = await c.req.json()

    // Validate request body
    let validated
    try {
      validated = CreateIssueRequestSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: formatZodError(err),
        }, 400)
      }
      throw err
    }

    // Verify referenced entities exist
    const [poCheck, styleCheck, colorCheck, threadTypeCheck] = await Promise.all([
      supabase.from('purchase_orders').select('id').eq('id', validated.po_id).single(),
      supabase.from('styles').select('id').eq('id', validated.style_id).single(),
      supabase.from('colors').select('id').eq('id', validated.color_id).single(),
      supabase.from('thread_types').select('id').eq('id', validated.thread_type_id).single(),
    ])

    if (poCheck.error) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Don hang khong ton tai',
      }, 400)
    }

    if (styleCheck.error) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Ma hang khong ton tai',
      }, 400)
    }

    if (colorCheck.error) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Mau khong ton tai',
      }, 400)
    }

    if (threadTypeCheck.error) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Loai chi khong ton tai',
      }, 400)
    }

    // Generate issue code using database function
    const { data: issueCodeResult, error: issueCodeError } = await supabase
      .rpc('fn_generate_issue_code')

    if (issueCodeError || !issueCodeResult) {
      console.error('Error generating issue code:', issueCodeError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the tao ma phieu xuat',
      }, 500)
    }

    // Calculate quota using database function
    const { data: quotaResult, error: quotaError } = await supabase
      .rpc('fn_calculate_quota', {
        p_po_id: validated.po_id,
        p_style_id: validated.style_id,
        p_color_id: validated.color_id,
        p_thread_type_id: validated.thread_type_id,
      })

    if (quotaError) {
      console.error('Error calculating quota:', quotaError)
      // Continue with quota = 0 if calculation fails
    }

    const quota_meters = quotaResult || 0

    // Insert issue request
    const { data: insertedRequest, error: insertError } = await supabase
      .from('thread_issue_requests')
      .insert({
        issue_code: issueCodeResult,
        po_id: validated.po_id,
        style_id: validated.style_id,
        color_id: validated.color_id,
        thread_type_id: validated.thread_type_id,
        department: validated.department,
        quota_meters,
        requested_meters: validated.requested_meters,
        issued_meters: 0,
        status: 'PENDING' as IssueRequestStatus,
        notes: validated.notes || null,
        created_by: validated.created_by || null,
      })
      .select(`
        *,
        purchase_orders:po_id(id, po_number),
        styles:style_id(id, style_code, style_name),
        colors:color_id(id, name, hex_code),
        thread_types:thread_type_id(id, code, name)
      `)
      .single()

    if (insertError) {
      console.error('Error inserting issue request:', insertError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the tao phieu xuat: ' + insertError.message,
      }, 500)
    }

    // Flatten joined data for response
    const response = {
      ...insertedRequest,
      po_number: insertedRequest.purchase_orders?.po_number,
      style_code: insertedRequest.styles?.style_code,
      style_name: insertedRequest.styles?.style_name,
      color_name: insertedRequest.colors?.name,
      color_hex: insertedRequest.colors?.hex_code,
      thread_type_name: insertedRequest.thread_types?.name,
    }

    return c.json<ThreadApiResponse<typeof response>>({
      data: response,
      error: null,
      message: 'Tao phieu xuat thanh cong',
    }, 201)
  } catch (err) {
    console.error('Error creating issue request:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

/**
 * GET /api/issues - List issue requests with filters
 *
 * Query params:
 *   po_id       - Filter by purchase order ID
 *   style_id    - Filter by style ID
 *   color_id    - Filter by color ID
 *   department  - Filter by department
 *   status      - Filter by status (PENDING, PARTIAL, COMPLETED, CANCELLED)
 *   date_from   - Filter from date (ISO format)
 *   date_to     - Filter to date (ISO format)
 *   page        - Page number (1-based)
 *   limit       - Items per page (default 20, max 100)
 */
issues.get('/', async (c) => {
  try {
    const queryParams = c.req.query()

    // Validate query params
    let filters
    try {
      filters = IssueRequestFiltersSchema.parse(queryParams)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: formatZodError(err),
        }, 400)
      }
      throw err
    }

    const page = filters.page || 1
    const limit = filters.limit || 20
    const isPaginated = filters.page !== undefined

    // Build query
    let query = supabase
      .from('thread_issue_requests')
      .select(`
        *,
        purchase_orders:po_id(id, po_number),
        styles:style_id(id, style_code, style_name),
        colors:color_id(id, name, hex_code),
        thread_types:thread_type_id(id, code, name)
      `, isPaginated ? { count: 'exact' } : undefined)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.po_id) {
      query = query.eq('po_id', filters.po_id)
    }
    if (filters.style_id) {
      query = query.eq('style_id', filters.style_id)
    }
    if (filters.color_id) {
      query = query.eq('color_id', filters.color_id)
    }
    if (filters.department) {
      query = query.ilike('department', `%${filters.department}%`)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    // Apply pagination
    if (isPaginated) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Flatten joined data
    const result = (data || []).map((row: any) => ({
      ...row,
      po_number: row.purchase_orders?.po_number,
      style_code: row.styles?.style_code,
      style_name: row.styles?.style_name,
      color_name: row.colors?.name,
      color_hex: row.colors?.hex_code,
      thread_type_name: row.thread_types?.name,
    }))

    if (isPaginated) {
      const total = count ?? 0
      return c.json({
        data: result,
        error: null,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    return c.json({
      data: result,
      error: null,
    })
  } catch (err) {
    console.error('Error fetching issue requests:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

/**
 * GET /api/issues/:id - Get issue request detail with items and returns
 */
issues.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID khong hop le',
      }, 400)
    }

    // Get issue request with joins
    const { data: request, error: requestError } = await supabase
      .from('thread_issue_requests')
      .select(`
        *,
        purchase_orders:po_id(id, po_number),
        styles:style_id(id, style_code, style_name),
        colors:color_id(id, name, hex_code),
        thread_types:thread_type_id(id, code, name)
      `)
      .eq('id', id)
      .single()

    if (requestError) {
      if (requestError.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Khong tim thay phieu xuat',
        }, 404)
      }
      throw requestError
    }

    // Get issue items for this request
    const { data: items, error: itemsError } = await supabase
      .from('thread_issue_items')
      .select(`
        *,
        thread_inventory:cone_id(id, cone_id, quantity_meters, status, thread_type_id)
      `)
      .eq('issue_request_id', id)
      .order('issued_at', { ascending: false })

    if (itemsError) {
      console.error('Error fetching issue items:', itemsError)
    }

    // Get item IDs to fetch returns
    const itemIds = (items || []).map((item: any) => item.id)

    // Get returns for these items
    let returns: any[] = []
    if (itemIds.length > 0) {
      const { data: returnsData, error: returnsError } = await supabase
        .from('thread_issue_returns')
        .select(`
          *,
          thread_inventory:cone_id(id, cone_id, quantity_meters, status)
        `)
        .in('issue_item_id', itemIds)
        .order('returned_at', { ascending: false })

      if (returnsError) {
        console.error('Error fetching issue returns:', returnsError)
      } else {
        returns = returnsData || []
      }
    }

    // Flatten joined data
    const response = {
      ...request,
      po_number: request.purchase_orders?.po_number,
      style_code: request.styles?.style_code,
      style_name: request.styles?.style_name,
      color_name: request.colors?.name,
      color_hex: request.colors?.hex_code,
      thread_type_name: request.thread_types?.name,
      items: (items || []).map((item: any) => ({
        ...item,
        cone_code: item.thread_inventory?.cone_id,
        cone_meters: item.thread_inventory?.quantity_meters,
        cone_status: item.thread_inventory?.status,
      })),
      returns: returns.map((ret: any) => ({
        ...ret,
        cone_code: ret.thread_inventory?.cone_id,
      })),
    }

    return c.json<ThreadApiResponse<typeof response>>({
      data: response,
      error: null,
    })
  } catch (err) {
    console.error('Error fetching issue request detail:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

/**
 * PATCH /api/issues/:id - Update issue request (notes or cancel)
 *
 * Only allows updating notes or setting status to CANCELLED
 */
issues.patch('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID khong hop le',
      }, 400)
    }

    const body = await c.req.json()

    // Validate request body
    let validated
    try {
      validated = UpdateIssueRequestSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: formatZodError(err),
        }, 400)
      }
      throw err
    }

    // Check if request exists and get current status
    const { data: existingRequest, error: existingError } = await supabase
      .from('thread_issue_requests')
      .select('id, status')
      .eq('id', id)
      .single()

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Khong tim thay phieu xuat',
        }, 404)
      }
      throw existingError
    }

    // Cannot update if already cancelled
    if (existingRequest.status === 'CANCELLED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the cap nhat phieu xuat da huy',
      }, 400)
    }

    // Cannot cancel if already completed
    if (validated.status === 'CANCELLED' && existingRequest.status === 'COMPLETED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the huy phieu xuat da hoan tat',
      }, 400)
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }
    if (validated.status === 'CANCELLED') {
      updateData.status = 'CANCELLED'
    }

    // Update request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('thread_issue_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return c.json<ThreadApiResponse<typeof updatedRequest>>({
      data: updatedRequest,
      error: null,
      message: validated.status === 'CANCELLED' ? 'Da huy phieu xuat' : 'Cap nhat thanh cong',
    })
  } catch (err) {
    console.error('Error updating issue request:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

/**
 * GET /api/issues/quota/:poId/:styleId/:colorId/:threadTypeId - Check quota
 *
 * Calls fn_check_quota() to get quota information
 */
issues.get('/quota/:poId/:styleId/:colorId/:threadTypeId', async (c) => {
  try {
    const poId = parseInt(c.req.param('poId'))
    const styleId = parseInt(c.req.param('styleId'))
    const colorId = parseInt(c.req.param('colorId'))
    const threadTypeId = parseInt(c.req.param('threadTypeId'))

    if (isNaN(poId) || isNaN(styleId) || isNaN(colorId) || isNaN(threadTypeId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Cac tham so phai la so nguyen hop le',
      }, 400)
    }

    // Call fn_check_quota RPC
    const { data: quotaResult, error: quotaError } = await supabase
      .rpc('fn_check_quota', {
        p_po_id: poId,
        p_style_id: styleId,
        p_color_id: colorId,
        p_thread_type_id: threadTypeId,
      })

    if (quotaError) {
      console.error('Error checking quota:', quotaError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the kiem tra dinh muc: ' + quotaError.message,
      }, 500)
    }

    return c.json({
      data: quotaResult,
      error: null,
    })
  } catch (err) {
    console.error('Error checking quota:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

// ============================================================================
// ROUTES: Issue Items (Cones)
// ============================================================================

/**
 * POST /api/issues/:id/items - Add cone to issue request
 *
 * Validates:
 * - Cone exists and is AVAILABLE or SOFT_ALLOCATED
 * - Thread type matches request
 * - If over quota, requires over_limit_notes
 *
 * Updates:
 * - Inserts thread_issue_items record
 * - Updates cone status to IN_PRODUCTION
 * - Creates thread_movements record
 */
issues.post('/:id/items', async (c) => {
  try {
    const requestId = parseInt(c.req.param('id'))

    if (isNaN(requestId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID phieu xuat khong hop le',
      }, 400)
    }

    const body = await c.req.json()

    // Validate request body
    let validated
    try {
      validated = AddIssueItemSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: formatZodError(err),
        }, 400)
      }
      throw err
    }

    // Check issue request exists and get details
    const { data: issueRequest, error: requestError } = await supabase
      .from('thread_issue_requests')
      .select('id, thread_type_id, status, quota_meters, issued_meters, requested_meters')
      .eq('id', requestId)
      .single()

    if (requestError) {
      if (requestError.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Khong tim thay phieu xuat',
        }, 404)
      }
      throw requestError
    }

    // Cannot add to cancelled/completed requests
    if (issueRequest.status === 'CANCELLED' || issueRequest.status === 'COMPLETED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the them cuon chi vao phieu xuat da hoan tat hoac da huy',
      }, 400)
    }

    // Check cone exists and get details
    const { data: cone, error: coneError } = await supabase
      .from('thread_inventory')
      .select('id, cone_id, thread_type_id, quantity_meters, status')
      .eq('id', validated.cone_id)
      .single()

    if (coneError) {
      if (coneError.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Khong tim thay cuon chi',
        }, 404)
      }
      throw coneError
    }

    // Validate cone status - must be AVAILABLE or SOFT_ALLOCATED
    const allowedStatuses = ['AVAILABLE', 'SOFT_ALLOCATED', 'HARD_ALLOCATED']
    if (!allowedStatuses.includes(cone.status)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: `Cuon chi khong san sang xuat. Trang thai hien tai: ${cone.status}`,
      }, 400)
    }

    // Validate thread type matches
    if (cone.thread_type_id !== issueRequest.thread_type_id) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Loai chi khong khop voi phieu xuat',
      }, 400)
    }

    // Check if adding this cone would exceed quota
    const newIssuedMeters = issueRequest.issued_meters + cone.quantity_meters
    const isOverQuota = issueRequest.quota_meters > 0 && newIssuedMeters > issueRequest.quota_meters

    // Require over_limit_notes if exceeding quota
    if (isOverQuota && !validated.over_limit_notes) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vuot dinh muc! Vui long nhap ly do xuat them (over_limit_notes)',
      }, 400)
    }

    // Get next batch number for this request
    const { data: batchResult } = await supabase
      .from('thread_issue_items')
      .select('batch_number')
      .eq('issue_request_id', requestId)
      .order('batch_number', { ascending: false })
      .limit(1)

    const nextBatchNumber = batchResult && batchResult.length > 0
      ? batchResult[0].batch_number + 1
      : 1

    // Insert issue item
    const { data: insertedItem, error: insertError } = await supabase
      .from('thread_issue_items')
      .insert({
        issue_request_id: requestId,
        cone_id: validated.cone_id,
        allocation_id: validated.allocation_id || null,
        quantity_meters: cone.quantity_meters,
        batch_number: nextBatchNumber,
        over_limit_notes: validated.over_limit_notes || null,
        issued_by: validated.issued_by || null,
        issued_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting issue item:', insertError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the them cuon chi: ' + insertError.message,
      }, 500)
    }

    // Update cone status to IN_PRODUCTION
    const previousStatus = cone.status
    const { error: updateConeError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'IN_PRODUCTION',
      })
      .eq('id', validated.cone_id)

    if (updateConeError) {
      console.error('Error updating cone status:', updateConeError)
      // Rollback: delete the inserted item
      await supabase.from('thread_issue_items').delete().eq('id', insertedItem.id)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the cap nhat trang thai cuon chi',
      }, 500)
    }

    // Create movement record
    const { error: movementError } = await supabase
      .from('thread_movements')
      .insert({
        cone_id: validated.cone_id,
        allocation_id: validated.allocation_id || null,
        movement_type: 'ISSUE' as MovementType,
        quantity_meters: cone.quantity_meters,
        from_status: previousStatus,
        to_status: 'IN_PRODUCTION',
        reference_id: issueRequest.id.toString(),
        reference_type: 'ISSUE_REQUEST',
        performed_by: validated.issued_by || null,
        notes: validated.over_limit_notes || null,
      })

    if (movementError) {
      console.error('Error creating movement record:', movementError)
      // Non-critical - log but don't fail
    }

    // Return the inserted item with cone info
    const response = {
      ...insertedItem,
      cone_code: cone.cone_id,
      cone_meters: cone.quantity_meters,
      is_over_quota: isOverQuota,
    }

    return c.json<ThreadApiResponse<typeof response>>({
      data: response,
      error: null,
      message: 'Them cuon chi thanh cong',
    }, 201)
  } catch (err) {
    console.error('Error adding issue item:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

/**
 * DELETE /api/issues/:id/items/:itemId - Remove cone from issue request
 *
 * Checks:
 * - Request status is not COMPLETED/CANCELLED
 *
 * Updates:
 * - Deletes thread_issue_items record
 * - Updates cone status back to AVAILABLE
 * - Creates thread_movements record (RETURN type)
 */
issues.delete('/:id/items/:itemId', async (c) => {
  try {
    const requestId = parseInt(c.req.param('id'))
    const itemId = parseInt(c.req.param('itemId'))

    if (isNaN(requestId) || isNaN(itemId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID khong hop le',
      }, 400)
    }

    // Check issue request status
    const { data: issueRequest, error: requestError } = await supabase
      .from('thread_issue_requests')
      .select('id, status')
      .eq('id', requestId)
      .single()

    if (requestError) {
      if (requestError.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Khong tim thay phieu xuat',
        }, 404)
      }
      throw requestError
    }

    if (issueRequest.status === 'COMPLETED' || issueRequest.status === 'CANCELLED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the xoa cuon chi tu phieu xuat da hoan tat hoac da huy',
      }, 400)
    }

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('thread_issue_items')
      .select('id, cone_id, quantity_meters, issue_request_id')
      .eq('id', itemId)
      .eq('issue_request_id', requestId)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Khong tim thay chi tiet xuat',
        }, 404)
      }
      throw itemError
    }

    // Get cone current status
    const { data: cone, error: coneError } = await supabase
      .from('thread_inventory')
      .select('id, cone_id, status, quantity_meters')
      .eq('id', item.cone_id)
      .single()

    if (coneError) {
      throw coneError
    }

    // Delete the issue item
    const { error: deleteError } = await supabase
      .from('thread_issue_items')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      throw deleteError
    }

    // Update cone status back to AVAILABLE
    const { error: updateConeError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'AVAILABLE',
      })
      .eq('id', item.cone_id)

    if (updateConeError) {
      console.error('Error updating cone status:', updateConeError)
    }

    // Create movement record for return
    const { error: movementError } = await supabase
      .from('thread_movements')
      .insert({
        cone_id: item.cone_id,
        allocation_id: null,
        movement_type: 'RETURN' as MovementType,
        quantity_meters: item.quantity_meters,
        from_status: cone.status,
        to_status: 'AVAILABLE',
        reference_id: requestId.toString(),
        reference_type: 'ISSUE_REQUEST',
        notes: 'Huy xuat cuon chi',
      })

    if (movementError) {
      console.error('Error creating movement record:', movementError)
    }

    return c.json<ThreadApiResponse<{ success: boolean }>>({
      data: { success: true },
      error: null,
      message: 'Da xoa cuon chi khoi phieu xuat',
    })
  } catch (err) {
    console.error('Error removing issue item:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

// ============================================================================
// ROUTES: Issue Returns
// ============================================================================

/**
 * POST /api/issues/returns - Create partial cone return
 *
 * Validates:
 * - Cone is IN_PRODUCTION
 * - Issue item exists
 *
 * Updates:
 * - Inserts thread_issue_returns record
 * - Updates thread_inventory: quantity_meters, is_partial, status = AVAILABLE
 * - Creates thread_movements record
 */
issues.post('/returns', async (c) => {
  try {
    const body = await c.req.json()

    // Validate request body
    let validated
    try {
      validated = CreateReturnSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: formatZodError(err),
        }, 400)
      }
      throw err
    }

    // Check issue item exists
    const { data: issueItem, error: itemError } = await supabase
      .from('thread_issue_items')
      .select('id, cone_id, quantity_meters, issue_request_id')
      .eq('id', validated.issue_item_id)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Khong tim thay chi tiet xuat',
        }, 404)
      }
      throw itemError
    }

    // Verify cone_id matches
    if (issueItem.cone_id !== validated.cone_id) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Cuon chi khong khop voi chi tiet xuat',
      }, 400)
    }

    // Check cone status - should be IN_PRODUCTION
    const { data: cone, error: coneError } = await supabase
      .from('thread_inventory')
      .select('id, cone_id, status, quantity_meters')
      .eq('id', validated.cone_id)
      .single()

    if (coneError) {
      if (coneError.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Khong tim thay cuon chi',
        }, 404)
      }
      throw coneError
    }

    if (cone.status !== 'IN_PRODUCTION') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: `Cuon chi khong dang trong san xuat. Trang thai hien tai: ${cone.status}`,
      }, 400)
    }

    // Calculate remaining meters
    const originalMeters = issueItem.quantity_meters
    const remainingPercentage = validated.remaining_percentage
    const calculatedRemainingMeters = (originalMeters * remainingPercentage) / 100

    // Insert return record
    const { data: insertedReturn, error: insertError } = await supabase
      .from('thread_issue_returns')
      .insert({
        issue_item_id: validated.issue_item_id,
        cone_id: validated.cone_id,
        original_meters: originalMeters,
        remaining_percentage: remainingPercentage,
        calculated_remaining_meters: calculatedRemainingMeters,
        notes: validated.notes || null,
        returned_by: validated.returned_by || null,
        returned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting return record:', insertError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the tao phieu tra: ' + insertError.message,
      }, 500)
    }

    // Update inventory - update quantity and set as partial
    const { error: updateInventoryError } = await supabase
      .from('thread_inventory')
      .update({
        quantity_meters: calculatedRemainingMeters,
        is_partial: true,
        status: 'AVAILABLE',
      })
      .eq('id', validated.cone_id)

    if (updateInventoryError) {
      console.error('Error updating inventory:', updateInventoryError)
      // Rollback: delete the inserted return
      await supabase.from('thread_issue_returns').delete().eq('id', insertedReturn.id)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Khong the cap nhat ton kho',
      }, 500)
    }

    // Create movement record
    const consumedMeters = originalMeters - calculatedRemainingMeters
    const { error: movementError } = await supabase
      .from('thread_movements')
      .insert({
        cone_id: validated.cone_id,
        allocation_id: null,
        movement_type: 'RETURN' as MovementType,
        quantity_meters: calculatedRemainingMeters,
        from_status: 'IN_PRODUCTION',
        to_status: 'AVAILABLE',
        reference_id: insertedReturn.id.toString(),
        reference_type: 'ISSUE_RETURN',
        performed_by: validated.returned_by || null,
        notes: `Tra cuon le. Da su dung: ${consumedMeters.toFixed(2)}m, Con lai: ${calculatedRemainingMeters.toFixed(2)}m (${remainingPercentage}%)`,
      })

    if (movementError) {
      console.error('Error creating movement record:', movementError)
    }

    // Return the inserted record with additional info
    const response = {
      ...insertedReturn,
      cone_code: cone.cone_id,
      consumed_meters: consumedMeters,
    }

    return c.json<ThreadApiResponse<typeof response>>({
      data: response,
      error: null,
      message: 'Tra cuon le thanh cong',
    }, 201)
  } catch (err) {
    console.error('Error creating issue return:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

/**
 * GET /api/issues/returns - List issue returns with filters
 *
 * Query params:
 *   issue_request_id - Filter by issue request ID
 *   cone_id          - Filter by cone ID
 *   date_from        - Filter from date
 *   date_to          - Filter to date
 *   page             - Page number
 *   limit            - Items per page
 */
issues.get('/returns', async (c) => {
  try {
    const queryParams = c.req.query()

    // Validate query params
    let filters
    try {
      filters = ReturnFiltersSchema.parse(queryParams)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: formatZodError(err),
        }, 400)
      }
      throw err
    }

    const page = filters.page || 1
    const limit = filters.limit || 20
    const isPaginated = filters.page !== undefined

    // Build query with joins
    let query = supabase
      .from('thread_issue_returns')
      .select(`
        *,
        thread_inventory:cone_id(id, cone_id, quantity_meters, status),
        thread_issue_items!inner(
          id,
          issue_request_id,
          thread_issue_requests(id, issue_code, po_id, style_id)
        )
      `, isPaginated ? { count: 'exact' } : undefined)
      .order('returned_at', { ascending: false })

    // Apply filters
    if (filters.issue_request_id) {
      query = query.eq('thread_issue_items.issue_request_id', filters.issue_request_id)
    }
    if (filters.cone_id) {
      query = query.eq('cone_id', filters.cone_id)
    }
    if (filters.date_from) {
      query = query.gte('returned_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('returned_at', filters.date_to)
    }

    // Apply pagination
    if (isPaginated) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Flatten joined data
    const result = (data || []).map((row: any) => ({
      ...row,
      cone_code: row.thread_inventory?.cone_id,
      issue_request_id: row.thread_issue_items?.issue_request_id,
      issue_code: row.thread_issue_items?.thread_issue_requests?.issue_code,
    }))

    if (isPaginated) {
      const total = count ?? 0
      return c.json({
        data: result,
        error: null,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    return c.json({
      data: result,
      error: null,
    })
  } catch (err) {
    console.error('Error fetching issue returns:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: getErrorMessage(err),
    }, 500)
  }
})

export default issues
