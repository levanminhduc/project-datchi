import { Hono } from 'hono'
import { query, queryOne, tx } from '../db/query'
import { requirePermission } from '../middleware/auth'
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

// ============ SHARED SQL FRAGMENTS ============

// Embed: thread_recovery → thread_inventory (to-one via cone_id) → thread_types (to-one)
const RECOVERY_EMBED_SELECT = `
  tr.*,
  CASE WHEN ti.id IS NULL THEN NULL
    ELSE json_build_object(
      'id', ti.id,
      'cone_id', ti.cone_id,
      'quantity_meters', ti.quantity_meters,
      'weight_grams', ti.weight_grams,
      'status', ti.status,
      'is_partial', ti.is_partial,
      'warehouse_id', ti.warehouse_id,
      'thread_type_id', ti.thread_type_id,
      'thread_types', CASE WHEN tt.id IS NULL THEN NULL
        ELSE json_build_object('id', tt.id, 'code', tt.code, 'name', tt.name, 'density_grams_per_meter', tt.density_grams_per_meter) END
    ) END AS thread_inventory`

const RECOVERY_EMBED_JOINS = `
  LEFT JOIN thread_inventory ti ON ti.id = tr.cone_id
  LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id`

const RECOVERY_EMBED_FROM = `
  FROM thread_recovery tr${RECOVERY_EMBED_JOINS}`

// ============ ROUTES ============

/**
 * GET /api/recovery - List all recovery records with filters
 * Query params:
 * - status: RecoveryStatus filter
 * - cone_id: Filter by cone barcode
 */
recovery.get('/', requirePermission('thread.recovery.view'), async (c) => {
  try {
    const status = c.req.query('status') as RecoveryStatus | undefined
    const coneBarcode = c.req.query('cone_id')

    const conditions: string[] = []
    const params: unknown[] = []

    if (status) {
      params.push(status)
      conditions.push(`tr.status = $${params.length}`)
    }

    // If cone_id (barcode) is provided, first find the inventory ID
    if (coneBarcode) {
      const cone = await queryOne<{ id: number }>(
        'SELECT id FROM thread_inventory WHERE cone_id = $1',
        [coneBarcode]
      )

      if (cone) {
        params.push(cone.id)
        conditions.push(`tr.cone_id = $${params.length}`)
      } else {
        // No cone found, return empty result
        return c.json<ThreadApiResponse<RecoveryWithCone[]>>({
          data: [],
          error: null,
        })
      }
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''

    let data: RecoveryWithCone[]
    try {
      data = await query<Record<string, unknown>>(
        `SELECT ${RECOVERY_EMBED_SELECT} ${RECOVERY_EMBED_FROM}${whereClause}
         ORDER BY tr.created_at DESC`,
        params
      ) as unknown as RecoveryWithCone[]
    } catch (error) {
      console.error('Database error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách thu hồi',
      }, 500)
    }

    return c.json<ThreadApiResponse<RecoveryWithCone[]>>({
      data,
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
recovery.get('/:id', requirePermission('thread.recovery.view'), async (c) => {
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

    let data: RecoveryWithCone | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `SELECT ${RECOVERY_EMBED_SELECT} ${RECOVERY_EMBED_FROM}
         WHERE tr.id = $1`,
        [parsedId]
      ) as unknown as RecoveryWithCone | null
    } catch (error) {
      console.error('Database error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin thu hồi',
      }, 500)
    }

    if (!data) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy bản ghi thu hồi',
      }, 404)
    }

    return c.json<ThreadApiResponse<RecoveryWithCone>>({
      data,
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
recovery.post('/initiate', requirePermission('thread.recovery.manage'), async (c) => {
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
    const cone = await queryOne<{
      id: number
      cone_id: string
      quantity_meters: number
      weight_grams: number | null
      status: ConeStatus
      is_partial: boolean
      warehouse_id: number
      thread_type_id: number
      thread_types: { id: number; code: string; name: string; density_grams_per_meter: number } | null
    }>(
      `SELECT ti.id, ti.cone_id, ti.quantity_meters, ti.weight_grams, ti.status,
         ti.is_partial, ti.warehouse_id, ti.thread_type_id,
         CASE WHEN tt.id IS NULL THEN NULL
           ELSE json_build_object('id', tt.id, 'code', tt.code, 'name', tt.name, 'density_grams_per_meter', tt.density_grams_per_meter) END AS thread_types
       FROM thread_inventory ti
       LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id
       WHERE ti.cone_id = $1`,
      [body.cone_id]
    )

    if (!cone) {
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
    const existingRecovery = await queryOne<{ id: number; status: RecoveryStatus }>(
      `SELECT id, status FROM thread_recovery
       WHERE cone_id = $1 AND status = ANY($2)`,
      [cone.id, ['INITIATED', 'PENDING_WEIGH', 'WEIGHED']]
    )

    if (existingRecovery) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: `Cuộn chỉ này đã có yêu cầu thu hồi đang xử lý (ID: ${existingRecovery.id})`,
      }, 409)
    }

    // Create recovery record + fetch with embed
    let recovery: RecoveryWithCone | null
    try {
      recovery = await queryOne<Record<string, unknown>>(
        `WITH ins AS (
           INSERT INTO thread_recovery (cone_id, original_meters, status, initiated_by, notes, tare_weight_grams)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *
         )
         SELECT ${RECOVERY_EMBED_SELECT}
         FROM ins tr${RECOVERY_EMBED_JOINS}`,
        [
          cone.id,
          cone.quantity_meters,
          'INITIATED' as RecoveryStatus,
          body.initiated_by || null,
          body.notes || null,
          DEFAULT_TARE_WEIGHT_GRAMS,
        ]
      ) as unknown as RecoveryWithCone | null
    } catch (insertError) {
      console.error('Insert error:', insertError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo bản ghi thu hồi',
      }, 500)
    }

    // Update cone status to PARTIAL_RETURN
    try {
      await query(
        `UPDATE thread_inventory SET status = $1, updated_at = $2 WHERE id = $3`,
        ['PARTIAL_RETURN' as ConeStatus, new Date().toISOString(), cone.id]
      )
    } catch (updateError) {
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
recovery.post('/:id/weigh', requirePermission('thread.recovery.manage'), async (c) => {
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
    const existingRecovery = await queryOne<RecoveryWithCone & {
      status: RecoveryStatus
      original_meters: number
      tare_weight_grams: number | null
    }>(
      `SELECT ${RECOVERY_EMBED_SELECT} ${RECOVERY_EMBED_FROM}
       WHERE tr.id = $1`,
      [id]
    ) as unknown as (RecoveryWithCone & { status: RecoveryStatus; original_meters: number; tare_weight_grams: number | null }) | null

    if (!existingRecovery) {
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
    let updatedRecovery: RecoveryWithCone | null
    try {
      updatedRecovery = await queryOne<Record<string, unknown>>(
        `WITH upd AS (
           UPDATE thread_recovery
           SET returned_weight_grams = $1, calculated_meters = $2, tare_weight_grams = $3,
               consumption_meters = $4, status = $5, weighed_by = $6, updated_at = $7
           WHERE id = $8
           RETURNING *
         )
         SELECT ${RECOVERY_EMBED_SELECT}
         FROM upd tr${RECOVERY_EMBED_JOINS}`,
        [
          body.weight_grams,
          calculatedMeters,
          tareWeight,
          consumptionMeters,
          'WEIGHED' as RecoveryStatus,
          body.weighed_by || null,
          new Date().toISOString(),
          id,
        ]
      ) as unknown as RecoveryWithCone | null
    } catch (updateError) {
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
recovery.post('/:id/confirm', requirePermission('thread.recovery.manage'), async (c) => {
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
    const existingRecovery = await queryOne<RecoveryWithCone & {
      status: RecoveryStatus
      original_meters: number
      calculated_meters: number | null
      returned_weight_grams: number | null
      notes: string | null
    }>(
      `SELECT ${RECOVERY_EMBED_SELECT} ${RECOVERY_EMBED_FROM}
       WHERE tr.id = $1`,
      [id]
    ) as unknown as (RecoveryWithCone & { status: RecoveryStatus; original_meters: number; calculated_meters: number | null; returned_weight_grams: number | null; notes: string | null }) | null

    if (!existingRecovery) {
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

    const recoveryNotes = body.notes
      ? `${existingRecovery.notes || ''}\n[Xác nhận]: ${body.notes}`.trim()
      : existingRecovery.notes

    // Atomic: cone → AVAILABLE + recovery → CONFIRMED + movement audit, one logical op
    let updatedRecovery: RecoveryWithCone | null
    try {
      updatedRecovery = await tx(async (client) => {
        await client.query(
          `UPDATE thread_inventory
           SET status = $1, is_partial = true, quantity_meters = $2, weight_grams = $3, updated_at = $4
           WHERE id = $5`,
          ['AVAILABLE' as ConeStatus, calculatedMeters, returnedWeight, new Date().toISOString(), coneData.id]
        )

        const updRes = await client.query(
          `WITH upd AS (
             UPDATE thread_recovery
             SET status = $1, confirmed_by = $2, notes = $3, updated_at = $4
             WHERE id = $5
             RETURNING *
           )
           SELECT ${RECOVERY_EMBED_SELECT}
           FROM upd tr${RECOVERY_EMBED_JOINS}`,
          ['CONFIRMED' as RecoveryStatus, body.confirmed_by || null, recoveryNotes, new Date().toISOString(), id]
        )

        // Log movement (best-effort: failure must not abort the recovery confirmation)
        try {
          await client.query('SAVEPOINT mv')
          await client.query(
            `INSERT INTO thread_movements
               (cone_id, movement_type, quantity_meters, weight_grams, meters_before, meters_after,
                status_before, status_after, reference_type, reference_id, performed_by, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              coneData.id,
              'RETURN' as MovementType,
              calculatedMeters,
              returnedWeight,
              existingRecovery.original_meters,
              calculatedMeters,
              'PARTIAL_RETURN' as ConeStatus,
              'AVAILABLE' as ConeStatus,
              'RECOVERY',
              id,
              body.confirmed_by || null,
              `Thu hồi cuộn chỉ ${coneData.cone_id}. Còn lại: ${calculatedMeters.toFixed(2)}m`,
            ]
          )
          await client.query('RELEASE SAVEPOINT mv')
        } catch (movementError) {
          await client.query('ROLLBACK TO SAVEPOINT mv')
          console.error('Movement log error:', movementError)
          // Don't fail the request, recovery was confirmed
        }

        return (updRes.rows[0] ?? null) as unknown as RecoveryWithCone | null
      })
    } catch (confirmError) {
      console.error('Recovery confirm error:', confirmError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật trạng thái cuộn chỉ',
      }, 500)
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
recovery.post('/:id/writeoff', requirePermission('thread.recovery.manage'), async (c) => {
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
    const existingRecovery = await queryOne<RecoveryWithCone & {
      status: RecoveryStatus
      original_meters: number
      consumption_meters: number | null
      returned_weight_grams: number | null
      notes: string | null
    }>(
      `SELECT ${RECOVERY_EMBED_SELECT} ${RECOVERY_EMBED_FROM}
       WHERE tr.id = $1`,
      [id]
    ) as unknown as (RecoveryWithCone & { status: RecoveryStatus; original_meters: number; consumption_meters: number | null; returned_weight_grams: number | null; notes: string | null }) | null

    if (!existingRecovery) {
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

    const writeOffNotes = `${existingRecovery.notes || ''}\n[Loại bỏ]: ${body.reason}`.trim()
    const writeOffConsumption = existingRecovery.consumption_meters ?? existingRecovery.original_meters

    // Atomic: cone → WRITTEN_OFF + recovery → WRITTEN_OFF + movement audit, one logical op
    let updatedRecovery: RecoveryWithCone | null
    try {
      updatedRecovery = await tx(async (client) => {
        await client.query(
          `UPDATE thread_inventory SET status = $1, updated_at = $2 WHERE id = $3`,
          ['WRITTEN_OFF' as ConeStatus, new Date().toISOString(), coneData.id]
        )

        const updRes = await client.query(
          `WITH upd AS (
             UPDATE thread_recovery
             SET status = $1, confirmed_by = $2, notes = $3, consumption_meters = $4, updated_at = $5
             WHERE id = $6
             RETURNING *
           )
           SELECT ${RECOVERY_EMBED_SELECT}
           FROM upd tr${RECOVERY_EMBED_JOINS}`,
          ['WRITTEN_OFF' as RecoveryStatus, body.approved_by, writeOffNotes, writeOffConsumption, new Date().toISOString(), id]
        )

        // Log movement for write-off (best-effort: failure must not abort the write-off)
        try {
          await client.query('SAVEPOINT mv')
          await client.query(
            `INSERT INTO thread_movements
               (cone_id, movement_type, quantity_meters, weight_grams, meters_before, meters_after,
                status_before, status_after, reference_type, reference_id, performed_by, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              coneData.id,
              'WRITE_OFF' as MovementType,
              -(existingRecovery.original_meters),
              existingRecovery.returned_weight_grams || 0,
              existingRecovery.original_meters,
              0,
              coneData.status as ConeStatus,
              'WRITTEN_OFF' as ConeStatus,
              'RECOVERY',
              id,
              body.approved_by,
              `Loại bỏ cuộn chỉ ${coneData.cone_id}. Lý do: ${body.reason}`,
            ]
          )
          await client.query('RELEASE SAVEPOINT mv')
        } catch (movementError) {
          await client.query('ROLLBACK TO SAVEPOINT mv')
          console.error('Movement log error:', movementError)
          // Don't fail the request, write-off was recorded
        }

        return (updRes.rows[0] ?? null) as unknown as RecoveryWithCone | null
      })
    } catch (writeOffError) {
      console.error('Recovery write-off error:', writeOffError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật bản ghi thu hồi',
      }, 500)
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
recovery.post('/:id/reject', requirePermission('thread.recovery.manage'), async (c) => {
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
    const existingRecovery = await queryOne<RecoveryRow & {
      status: RecoveryStatus
      notes: string | null
      thread_inventory: { id: number; cone_id: string; status: ConeStatus } | null
    }>(
      `SELECT tr.*,
         CASE WHEN ti.id IS NULL THEN NULL
           ELSE json_build_object('id', ti.id, 'cone_id', ti.cone_id, 'status', ti.status) END AS thread_inventory
       FROM thread_recovery tr
       LEFT JOIN thread_inventory ti ON ti.id = tr.cone_id
       WHERE tr.id = $1`,
      [id]
    )

    if (!existingRecovery) {
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

    const coneData = existingRecovery.thread_inventory

    // Revert cone status back to IN_PRODUCTION (or previous state)
    if (coneData) {
      try {
        await query(
          `UPDATE thread_inventory SET status = $1, updated_at = $2 WHERE id = $3`,
          ['IN_PRODUCTION' as ConeStatus, new Date().toISOString(), coneData.id]
        )
      } catch (coneUpdateError) {
        console.error('Cone update error:', coneUpdateError)
        // Continue with rejection
      }
    }

    // Update recovery record
    const rejectNotes = `${existingRecovery.notes || ''}\n[Từ chối]: ${body.reason}`.trim()

    let updatedRecovery: RecoveryWithCone | null
    try {
      updatedRecovery = await queryOne<Record<string, unknown>>(
        `WITH upd AS (
           UPDATE thread_recovery
           SET status = $1, confirmed_by = $2, notes = $3, updated_at = $4
           WHERE id = $5
           RETURNING *
         )
         SELECT ${RECOVERY_EMBED_SELECT}
         FROM upd tr${RECOVERY_EMBED_JOINS}`,
        ['REJECTED' as RecoveryStatus, body.rejected_by || null, rejectNotes, new Date().toISOString(), id]
      ) as unknown as RecoveryWithCone | null
    } catch (updateError) {
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
