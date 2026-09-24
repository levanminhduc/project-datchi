import { Hono } from 'hono'
import { ZodError } from 'zod'
import type { PoolClient } from 'pg'
import { query, queryOne, runOn, tx } from '../../db/query'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import {
  StockAdjustPreviewSchema,
  StockAdjustSchema,
  RevertReceiveSchema,
} from '../../validation/weeklyOrderStockAdjust'
import type { AppEnv } from '../../types/hono-env'
import { formatZodError } from './helpers'
import { isRootUnlocked, logWeekAudit, getPerformer } from '../../utils/weekly-order-unlock'

const stockAdjust = new Hono<AppEnv>()

const ELIGIBLE_STATUSES = ['RESERVED_FOR_ORDER', 'AVAILABLE', 'RECEIVED', 'INSPECTED']

interface ConeCounts {
  eligible_cones: number
  locked_cones: number
}

interface ConeRow {
  id: number
  cone_id: string
  status: string
  warehouse_name: string | null
  received_date: string | null
  lot_number: string | null
}

interface ReceiveLogRow {
  id: number
  delivery_id: number
  week_id: number
  quantity: number
  reverted_at: string | null
}

async function countCones(
  weekId: number,
  threadTypeId: number,
  colorId: number | null,
  client?: PoolClient,
): Promise<ConeCounts> {
  const rows = await runOn<ConeCounts>(
    client,
    `SELECT
       COUNT(*) FILTER (WHERE status = ANY($4))::int AS eligible_cones,
       COUNT(*) FILTER (WHERE NOT (status = ANY($4)))::int AS locked_cones
     FROM thread_inventory
     WHERE reserved_week_id = $1
       AND thread_type_id = $2
       AND (($3::int IS NULL AND color_id IS NULL) OR color_id = $3)`,
    [weekId, threadTypeId, colorId, ELIGIBLE_STATUSES],
  )
  return rows[0] ?? { eligible_cones: 0, locked_cones: 0 }
}

class StockAdjustRuleError extends Error {
  constructor(message: string, public readonly status: 400 | 409) {
    super(message)
  }
}

function parseId(raw: string | undefined): number | null {
  if (!raw) return null
  const parsed = parseInt(raw)
  return isNaN(parsed) || parsed <= 0 ? null : parsed
}

stockAdjust.post(
  '/deliveries/receive-logs/:logId/revert',
  requirePermission('thread.allocations.manage'),
  async (c) => {
    try {
      const logId = parseId(c.req.param('logId'))
      if (logId === null) {
        return c.json({ data: null, error: 'ID lần nhập kho không hợp lệ' }, 400)
      }

      let validated
      try {
        validated = RevertReceiveSchema.parse(await c.req.json())
      } catch (err) {
        if (err instanceof ZodError) {
          return c.json({ data: null, error: formatZodError(err) }, 400)
        }
        throw err
      }

      const log = await queryOne<ReceiveLogRow>(
        `SELECT l.id, l.delivery_id, l.quantity, l.reverted_at, d.week_id
           FROM delivery_receive_logs l
           JOIN thread_order_deliveries d ON d.id = l.delivery_id
          WHERE l.id = $1
          LIMIT 1`,
        [logId],
      )

      if (!log) {
        return c.json({ data: null, error: 'Không tìm thấy lần nhập kho' }, 404)
      }

      if (!(await isRootUnlocked(c, log.week_id))) {
        return c.json(
          { data: null, error: 'Chỉ tài khoản root mới hoàn tác được, và tuần hàng phải đang mở khóa chỉnh sửa' },
          403,
        )
      }

      if (log.reverted_at) {
        return c.json({ data: null, error: 'Lần nhập kho này đã được hoàn tác trước đó' }, 400)
      }

      const performer = getPerformer(c)
      const result = await tx(async (client) => {
        const rows = await runOn<{ result: Record<string, unknown> }>(
          client,
          `SELECT fn_revert_delivery_receive($1, $2, $3) AS result`,
          [logId, performer, validated.reason],
        )

        await logWeekAudit({
          weekId: log.week_id,
          tableName: 'delivery_receive_logs',
          recordId: logId,
          action: 'UPDATE',
          oldValues: { reverted_at: null, delivery_id: log.delivery_id, quantity: log.quantity },
          newValues: { reverted_at: new Date().toISOString(), reason: validated.reason },
          performedBy: performer,
        }, client)

        return rows.length > 0 ? rows[0].result : null
      })

      return c.json({
        data: result,
        error: null,
        message: `Đã hoàn tác lần nhập ${log.quantity} cuộn`,
      })
    } catch (err) {
      console.error('[stock-adjust] revert receive failed:', err)
      return c.json({ data: null, error: getErrorMessage(err) }, 500)
    }
  },
)

stockAdjust.post('/:id/stock-adjust/preview', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseId(c.req.param('id'))
    if (weekId === null) {
      return c.json({ data: null, error: 'ID tuần không hợp lệ' }, 400)
    }

    let validated
    try {
      validated = StockAdjustPreviewSchema.parse(await c.req.json())
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    if (!(await isRootUnlocked(c, weekId))) {
      return c.json(
        { data: null, error: 'Chỉ tài khoản root mới điều chỉnh được, và tuần hàng phải đang mở khóa chỉnh sửa' },
        403,
      )
    }

    const colorId = validated.thread_color_id ?? null
    const counts = await countCones(weekId, validated.thread_type_id, colorId)
    const writeOffCones = counts.eligible_cones - validated.actual_cones

    const cones =
      writeOffCones > 0
        ? await query<ConeRow>(
            `SELECT ti.id, ti.cone_id, ti.status, w.name AS warehouse_name,
                    ti.received_date, ti.lot_number
               FROM thread_inventory ti
               LEFT JOIN warehouses w ON w.id = ti.warehouse_id
              WHERE ti.reserved_week_id = $1
                AND ti.thread_type_id = $2
                AND (($3::int IS NULL AND ti.color_id IS NULL) OR ti.color_id = $3)
                AND ti.status = ANY($4)
              ORDER BY ti.received_date DESC, ti.id DESC
              LIMIT $5`,
            [weekId, validated.thread_type_id, colorId, ELIGIBLE_STATUSES, writeOffCones],
          )
        : []

    return c.json({
      data: {
        current_cones: counts.eligible_cones,
        locked_cones: counts.locked_cones,
        actual_cones: validated.actual_cones,
        write_off_cones: writeOffCones,
        cones,
      },
      error: null,
    })
  } catch (err) {
    console.error('[stock-adjust] preview failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

stockAdjust.post('/:id/stock-adjust', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseId(c.req.param('id'))
    if (weekId === null) {
      return c.json({ data: null, error: 'ID tuần không hợp lệ' }, 400)
    }

    let validated
    try {
      validated = StockAdjustSchema.parse(await c.req.json())
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    if (!(await isRootUnlocked(c, weekId))) {
      return c.json(
        { data: null, error: 'Chỉ tài khoản root mới điều chỉnh được, và tuần hàng phải đang mở khóa chỉnh sửa' },
        403,
      )
    }

    const colorId = validated.thread_color_id ?? null
    const performer = getPerformer(c)

    let writeOffCones: number
    let result: Record<string, unknown> | null
    try {
      ;({ writeOffCones, result } = await tx(async (client) => {
        await client.query(`SELECT id FROM thread_order_weeks WHERE id = $1 FOR UPDATE`, [weekId])

        const counts = await countCones(weekId, validated.thread_type_id, colorId, client)

        if (counts.eligible_cones !== validated.expected_current_cones) {
          throw new StockAdjustRuleError(
            `Tồn kho đã thay đổi (hiện có ${counts.eligible_cones} cuộn, lúc xem trước là ${validated.expected_current_cones} cuộn). Vui lòng tải lại`,
            409,
          )
        }

        const toWriteOff = counts.eligible_cones - validated.actual_cones

        if (toWriteOff < 0) {
          throw new StockAdjustRuleError(
            `Số đếm thực tế (${validated.actual_cones}) lớn hơn tồn kho hiện có (${counts.eligible_cones}). Muốn thêm cuộn phải nhập kho theo đơn giao hàng`,
            400,
          )
        }

        if (toWriteOff === 0) {
          throw new StockAdjustRuleError('Số đếm thực tế trùng với tồn kho hiện có, không cần điều chỉnh', 400)
        }

        const rows = await runOn<{ result: Record<string, unknown> }>(
          client,
          `SELECT fn_write_off_week_cones($1, $2, $3, $4, $5, $6, $7) AS result`,
          [weekId, validated.thread_type_id, colorId, toWriteOff, null, validated.reason, performer],
        )
        const rpcResult = rows.length > 0 ? rows[0].result : null

        if (Number(rpcResult?.written_off ?? 0) !== toWriteOff) {
          throw new Error(`Chỉ loại bỏ được ${Number(rpcResult?.written_off ?? 0)}/${toWriteOff} cuộn, đã huỷ thao tác. Vui lòng thử lại`)
        }

        await logWeekAudit({
          weekId,
          tableName: 'thread_inventory',
          recordId: validated.thread_type_id,
          action: 'UPDATE',
          oldValues: { inventory_cones: counts.eligible_cones, thread_color_id: colorId },
          newValues: {
            inventory_cones: validated.actual_cones,
            thread_color_id: colorId,
            written_off: toWriteOff,
            reason: validated.reason,
          },
          performedBy: performer,
        }, client)

        return { writeOffCones: toWriteOff, result: rpcResult }
      }))
    } catch (ruleErr) {
      if (ruleErr instanceof StockAdjustRuleError) {
        return c.json({ data: null, error: ruleErr.message }, ruleErr.status)
      }
      throw ruleErr
    }

    return c.json({
      data: result,
      error: null,
      message: `Đã loại bỏ ${writeOffCones} cuộn, tồn kho của tuần còn ${validated.actual_cones} cuộn`,
    })
  } catch (err) {
    console.error('[stock-adjust] adjust failed:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default stockAdjust
