import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { broadcastNotification, getWarehouseEmployeeIds } from '../utils/notificationService'
import type {
  ThreadApiResponse,
  RecoveryRow,
  RecoveryStatus,
  ConeStatus,
  InitiateReturnDTO,
  WeighConeDTO,
  MovementType,
} from '../types/thread'

const recovery = new Hono()

// ============ CONSTANTS ============

/** Minimum weight in grams before suggesting write-off */
const WRITE_OFF_THRESHOLD_GRAMS = 50

/** Default tare weight for empty cone in grams */
const DEFAULT_TARE_WEIGHT_GRAMS = 10

// ============ TYPES ============

interface RecoveryWithCone extends RecoveryRow {
  thread_inventory?: {
    id: number
    cone_id: string
    quantity_meters: number
    weight_grams: number | null
    status: ConeStatus
    is_partial: boolean
    warehouse_id: number
    thread_type_id: number
    thread_types?: {
      id: number
      code: string
      name: string
      density_grams_per_meter: number
    }
  }
}

interface WriteOffDTO {
  reason: string
  approved_by: string
}

// ============ HELPER FUNCTIONS ============

/**
 * Generate unique movement code
 * Format: MOV-{type}-{YYYYMMDD}-{random}
 */
function generateMovementCode(type: string): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `MOV-${type}-${dateStr}-${random}`
}

/**
 * Calculate remaining meters from weight using density factor
 * Formula: (weight_grams - tare_weight) / density_grams_per_meter
 */
function calculateMetersFromWeight(
  weightGrams: number,
  tareWeight: number,
  densityGramsPerMeter: number
): number {
  const netWeight = Math.max(0, weightGrams - tareWeight)
  return netWeight / densityGramsPerMeter
}

// ============ ROUTES ============

/**
 * GET /api/recovery - List all recovery records with filters
 * Query params:
 * - status: RecoveryStatus filter
 * - cone_id: Filter by cone barcode
 */
recovery.get('/', async (c) => {
  try {
    const status = c.req.query('status') as RecoveryStatus | undefined
    const coneBarcode = c.req.query('cone_id')

    let query = supabase
      .from('thread_recovery')
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          is_partial,
          warehouse_id,
          thread_type_id,
          thread_types(id, code, name, density_grams_per_meter)
        )
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // If cone_id (barcode) is provided, first find the inventory ID
    if (coneBarcode) {
      const { data: cone } = await supabase
        .from('thread_inventory')
        .select('id')
        .eq('cone_id', coneBarcode)
        .single()

      if (cone) {
        query = query.eq('cone_id', cone.id)
      } else {
        // No cone found, return empty result
        return c.json<ThreadApiResponse<RecoveryWithCone[]>>({
          data: [],
          error: null,
        })
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách thu hồi',
      }, 500)
    }

    return c.json<ThreadApiResponse<RecoveryWithCone[]>>({
      data: data as RecoveryWithCone[],
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * GET /api/recovery/:id - Get single recovery record with cone details
 */
recovery.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Guard: skip if id matches a known static route name
    if (id === 'initiate') {
      return c.notFound()
    }

    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    const { data, error } = await supabase
      .from('thread_recovery')
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          is_partial,
          warehouse_id,
          thread_type_id,
          thread_types(id, code, name, density_grams_per_meter)
        )
      `)
      .eq('id', parsedId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy bản ghi thu hồi',
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin thu hồi',
      }, 500)
    }

    return c.json<ThreadApiResponse<RecoveryWithCone>>({
      data: data as RecoveryWithCone,
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/recovery/initiate - Initiate return from production
 * Worker scans barcode to start recovery process
 */
recovery.post('/initiate', async (c) => {
  try {
    const body = await c.req.json<InitiateReturnDTO>()

    // Validate required fields
    if (!body.cone_id) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng quét mã vạch cuộn chỉ',
      }, 400)
    }

    // Find cone by barcode
    const { data: cone, error: coneError } = await supabase
      .from('thread_inventory')
      .select(`
        id,
        cone_id,
        quantity_meters,
        weight_grams,
        status,
        is_partial,
        warehouse_id,
        thread_type_id,
        thread_types(id, code, name, density_grams_per_meter)
      `)
      .eq('cone_id', body.cone_id)
      .single()

    if (coneError || !cone) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy cuộn chỉ với mã vạch này',
      }, 404)
    }

    // Verify cone is in a returnable status
    const returnableStatuses: ConeStatus[] = ['IN_PRODUCTION', 'HARD_ALLOCATED']
    if (!returnableStatuses.includes(cone.status as ConeStatus)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Cuộn chỉ không ở trạng thái có thể hoàn trả',
      }, 400)
    }

    // Check if there's already an active recovery for this cone
    const { data: existingRecovery } = await supabase
      .from('thread_recovery')
      .select('id, status')
      .eq('cone_id', cone.id)
      .in('status', ['INITIATED', 'PENDING_WEIGH', 'WEIGHED'])
      .single()

    if (existingRecovery) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: `Cuộn chỉ này đã có yêu cầu thu hồi đang xử lý (ID: ${existingRecovery.id})`,
      }, 409)
    }

    // Create recovery record
    const insertData = {
      cone_id: cone.id,
      original_meters: cone.quantity_meters,
      status: 'INITIATED' as RecoveryStatus,
      initiated_by: body.initiated_by || null,
      notes: body.notes || null,
      tare_weight_grams: DEFAULT_TARE_WEIGHT_GRAMS,
    }

    const { data: recovery, error: insertError } = await supabase
      .from('thread_recovery')
      .insert(insertData)
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          is_partial,
          warehouse_id,
          thread_type_id,
          thread_types(id, code, name, density_grams_per_meter)
        )
      `)
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo bản ghi thu hồi',
      }, 500)
    }

    // Update cone status to PARTIAL_RETURN
    const { error: updateError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'PARTIAL_RETURN' as ConeStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cone.id)

    if (updateError) {
      console.error('Cone update error:', updateError)
    }

    getWarehouseEmployeeIds().then(ids => {
      if (ids.length > 0) {
        broadcastNotification({
          employeeIds: ids,
          type: 'RECOVERY',
          title: `Yêu cầu thu hồi cuộn ${cone.cone_id} đã được tạo`,
          actionUrl: '/thread/recovery',
        }).catch(() => {})
      }
    }).catch(() => {})

    return c.json<ThreadApiResponse<RecoveryWithCone>>({
      data: recovery as RecoveryWithCone,
      error: null,
      message: 'Khởi tạo hoàn trả thành công',
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/recovery/:id/weigh - Record weight and calculate remaining meters
 */
recovery.post('/:id/weigh', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<WeighConeDTO>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Validate weight
    if (body.weight_grams === undefined || body.weight_grams < 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng nhập khối lượng hợp lệ',
      }, 400)
    }

    // Fetch recovery with cone and thread type details
    const { data: existingRecovery, error: fetchError } = await supabase
      .from('thread_recovery')
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          thread_type_id,
          thread_types(id, density_grams_per_meter)
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingRecovery) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy bản ghi thu hồi',
      }, 404)
    }

    // Check if recovery is in correct status for weighing
    const weighableStatuses: RecoveryStatus[] = ['INITIATED', 'PENDING_WEIGH']
    if (!weighableStatuses.includes(existingRecovery.status)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Bản ghi thu hồi không ở trạng thái có thể cân',
      }, 400)
    }

    const coneData = existingRecovery.thread_inventory as RecoveryWithCone['thread_inventory']
    if (!coneData || !coneData.thread_types) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy thông tin loại chỉ',
      }, 500)
    }

    const densityGramsPerMeter = (coneData.thread_types as { density_grams_per_meter: number }).density_grams_per_meter
    const tareWeight = body.tare_weight_grams ?? existingRecovery.tare_weight_grams ?? DEFAULT_TARE_WEIGHT_GRAMS

    // Calculate remaining meters
    const calculatedMeters = calculateMetersFromWeight(
      body.weight_grams,
      tareWeight,
      densityGramsPerMeter
    )

    // Calculate consumption
    const consumptionMeters = existingRecovery.original_meters - calculatedMeters

    // Determine if write-off should be suggested
    const netWeight = body.weight_grams - tareWeight
    const suggestWriteOff = netWeight < WRITE_OFF_THRESHOLD_GRAMS

    // Update recovery record
    const updateData = {
      returned_weight_grams: body.weight_grams,
      calculated_meters: calculatedMeters,
      tare_weight_grams: tareWeight,
      consumption_meters: consumptionMeters,
      status: 'WEIGHED' as RecoveryStatus,
      weighed_by: body.weighed_by || null,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedRecovery, error: updateError } = await supabase
      .from('thread_recovery')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          is_partial,
          warehouse_id,
          thread_type_id,
          thread_types(id, code, name, density_grams_per_meter)
        )
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật bản ghi thu hồi',
      }, 500)
    }

    // Build response message
    let message = 'Đã cân và tính toán số mét còn lại'
    if (suggestWriteOff) {
      message += `. Khối lượng dưới ${WRITE_OFF_THRESHOLD_GRAMS}g - khuyến nghị loại bỏ`
    }

    return c.json<ThreadApiResponse<RecoveryWithCone & { suggest_write_off: boolean }>>({
      data: {
        ...(updatedRecovery as RecoveryWithCone),
        suggest_write_off: suggestWriteOff,
      },
      error: null,
      message,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/recovery/:id/confirm - Confirm recovery and re-enter to inventory
 */
recovery.post('/:id/confirm', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<{ confirmed_by?: string; notes?: string }>().catch(() => ({ confirmed_by: undefined, notes: undefined }))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Fetch recovery with cone details
    const { data: existingRecovery, error: fetchError } = await supabase
      .from('thread_recovery')
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          warehouse_id,
          thread_type_id
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingRecovery) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy bản ghi thu hồi',
      }, 404)
    }

    // Check if recovery is in correct status for confirmation
    if (existingRecovery.status !== 'WEIGHED') {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Bản ghi thu hồi chưa được cân hoặc đã được xử lý',
      }, 400)
    }

    const coneData = existingRecovery.thread_inventory as RecoveryWithCone['thread_inventory']
    if (!coneData) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy thông tin cuộn chỉ',
      }, 500)
    }

    const calculatedMeters = existingRecovery.calculated_meters || 0
    const returnedWeight = existingRecovery.returned_weight_grams || 0

    // Update cone: status = AVAILABLE, is_partial = true, update quantity
    const { error: coneUpdateError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'AVAILABLE' as ConeStatus,
        is_partial: true,
        quantity_meters: calculatedMeters,
        weight_grams: returnedWeight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', coneData.id)

    if (coneUpdateError) {
      console.error('Cone update error:', coneUpdateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật trạng thái cuộn chỉ',
      }, 500)
    }

    // Update recovery record
    const recoveryNotes = body.notes
      ? `${existingRecovery.notes || ''}\n[Xác nhận]: ${body.notes}`.trim()
      : existingRecovery.notes

    const { data: updatedRecovery, error: updateError } = await supabase
      .from('thread_recovery')
      .update({
        status: 'CONFIRMED' as RecoveryStatus,
        confirmed_by: body.confirmed_by || null,
        notes: recoveryNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          is_partial,
          warehouse_id,
          thread_type_id,
          thread_types(id, code, name, density_grams_per_meter)
        )
      `)
      .single()

    if (updateError) {
      console.error('Recovery update error:', updateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật bản ghi thu hồi',
      }, 500)
    }

    // Log movement
    const movementData = {
      cone_id: coneData.id,
      movement_type: 'RETURN' as MovementType,
      quantity_meters: calculatedMeters,
      weight_grams: returnedWeight,
      meters_before: existingRecovery.original_meters,
      meters_after: calculatedMeters,
      status_before: 'PARTIAL_RETURN' as ConeStatus,
      status_after: 'AVAILABLE' as ConeStatus,
      reference_type: 'RECOVERY',
      reference_id: id,
      performed_by: body.confirmed_by || null,
      notes: `Thu hồi cuộn chỉ ${coneData.cone_id}. Còn lại: ${calculatedMeters.toFixed(2)}m`,
    }

    const { error: movementError } = await supabase
      .from('thread_movements')
      .insert(movementData)

    if (movementError) {
      console.error('Movement log error:', movementError)
      // Don't fail the request, recovery was confirmed
    }

    return c.json<ThreadApiResponse<RecoveryWithCone>>({
      data: updatedRecovery as RecoveryWithCone,
      error: null,
      message: 'Xác nhận hoàn trả thành công, cuộn chỉ đã nhập lại kho',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/recovery/:id/writeoff - Write off cone if too little remaining
 * Requires supervisor approval
 */
recovery.post('/:id/writeoff', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<WriteOffDTO>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    // Validate required fields
    if (!body.reason || !body.approved_by) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng nhập lý do loại bỏ và người phê duyệt',
      }, 400)
    }

    // Fetch recovery with cone details
    const { data: existingRecovery, error: fetchError } = await supabase
      .from('thread_recovery')
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          warehouse_id,
          thread_type_id
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingRecovery) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy bản ghi thu hồi',
      }, 404)
    }

    // Check if recovery is in correct status for write-off
    const writeOffableStatuses: RecoveryStatus[] = ['INITIATED', 'PENDING_WEIGH', 'WEIGHED']
    if (!writeOffableStatuses.includes(existingRecovery.status)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Bản ghi thu hồi không ở trạng thái có thể loại bỏ',
      }, 400)
    }

    const coneData = existingRecovery.thread_inventory as RecoveryWithCone['thread_inventory']
    if (!coneData) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy thông tin cuộn chỉ',
      }, 500)
    }

    // Update cone status to WRITTEN_OFF
    const { error: coneUpdateError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'WRITTEN_OFF' as ConeStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', coneData.id)

    if (coneUpdateError) {
      console.error('Cone update error:', coneUpdateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật trạng thái cuộn chỉ',
      }, 500)
    }

    // Update recovery record
    const writeOffNotes = `${existingRecovery.notes || ''}\n[Loại bỏ]: ${body.reason}`.trim()

    const { data: updatedRecovery, error: updateError } = await supabase
      .from('thread_recovery')
      .update({
        status: 'WRITTEN_OFF' as RecoveryStatus,
        confirmed_by: body.approved_by,
        notes: writeOffNotes,
        // If not weighed yet, set consumption to original meters (all consumed/lost)
        consumption_meters: existingRecovery.consumption_meters ?? existingRecovery.original_meters,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          is_partial,
          warehouse_id,
          thread_type_id,
          thread_types(id, code, name, density_grams_per_meter)
        )
      `)
      .single()

    if (updateError) {
      console.error('Recovery update error:', updateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật bản ghi thu hồi',
      }, 500)
    }

    // Log movement for write-off
    const movementData = {
      cone_id: coneData.id,
      movement_type: 'WRITE_OFF' as MovementType,
      quantity_meters: -(existingRecovery.original_meters),
      weight_grams: existingRecovery.returned_weight_grams || 0,
      meters_before: existingRecovery.original_meters,
      meters_after: 0,
      status_before: coneData.status as ConeStatus,
      status_after: 'WRITTEN_OFF' as ConeStatus,
      reference_type: 'RECOVERY',
      reference_id: id,
      performed_by: body.approved_by,
      notes: `Loại bỏ cuộn chỉ ${coneData.cone_id}. Lý do: ${body.reason}`,
    }

    const { error: movementError } = await supabase
      .from('thread_movements')
      .insert(movementData)

    if (movementError) {
      console.error('Movement log error:', movementError)
      // Don't fail the request, write-off was recorded
    }

    return c.json<ThreadApiResponse<RecoveryWithCone>>({
      data: updatedRecovery as RecoveryWithCone,
      error: null,
      message: 'Đã loại bỏ cuộn chỉ',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

/**
 * POST /api/recovery/:id/reject - Reject recovery (quality issues, wrong cone)
 */
recovery.post('/:id/reject', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<{ reason: string; rejected_by?: string }>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ',
      }, 400)
    }

    if (!body.reason) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng nhập lý do từ chối',
      }, 400)
    }

    // Fetch recovery with cone details
    const { data: existingRecovery, error: fetchError } = await supabase
      .from('thread_recovery')
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingRecovery) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy bản ghi thu hồi',
      }, 404)
    }

    // Check if recovery can be rejected
    const rejectableStatuses: RecoveryStatus[] = ['INITIATED', 'PENDING_WEIGH', 'WEIGHED']
    if (!rejectableStatuses.includes(existingRecovery.status)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Bản ghi thu hồi không ở trạng thái có thể từ chối',
      }, 400)
    }

    const coneData = existingRecovery.thread_inventory as RecoveryWithCone['thread_inventory']

    // Revert cone status back to IN_PRODUCTION (or previous state)
    if (coneData) {
      const { error: coneUpdateError } = await supabase
        .from('thread_inventory')
        .update({
          status: 'IN_PRODUCTION' as ConeStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coneData.id)

      if (coneUpdateError) {
        console.error('Cone update error:', coneUpdateError)
        // Continue with rejection
      }
    }

    // Update recovery record
    const rejectNotes = `${existingRecovery.notes || ''}\n[Từ chối]: ${body.reason}`.trim()

    const { data: updatedRecovery, error: updateError } = await supabase
      .from('thread_recovery')
      .update({
        status: 'REJECTED' as RecoveryStatus,
        confirmed_by: body.rejected_by || null,
        notes: rejectNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        thread_inventory(
          id,
          cone_id,
          quantity_meters,
          weight_grams,
          status,
          is_partial,
          warehouse_id,
          thread_type_id,
          thread_types(id, code, name, density_grams_per_meter)
        )
      `)
      .single()

    if (updateError) {
      console.error('Recovery update error:', updateError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật bản ghi thu hồi',
      }, 500)
    }

    return c.json<ThreadApiResponse<RecoveryWithCone>>({
      data: updatedRecovery as RecoveryWithCone,
      error: null,
      message: 'Đã từ chối yêu cầu thu hồi',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

export default recovery
