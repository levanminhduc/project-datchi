import { Hono } from 'hono'
import { supabaseAdmin } from '../../db/supabase'
import { requirePermission } from '../../middleware/auth'
import type { AppEnv } from '../../types/hono-env'
import {
  transferByCalculationQuerySchema,
  threadTransferHistoryQuerySchema,
} from '../../validation/transferByCalculationSchema'

const router = new Hono<AppEnv>()

router.get(
  '/:weekId/transfer-by-calculation',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    const weekIdRaw = c.req.param('weekId')
    if (!/^\d+$/.test(weekIdRaw)) {
      return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
    }
    const weekId = Number(weekIdRaw)

    const queryParse = transferByCalculationQuerySchema.safeParse({
      warehouse_id: c.req.query('warehouse_id'),
      to_warehouse_id: c.req.query('to_warehouse_id'),
    })
    if (!queryParse.success) {
      return c.json({ data: null, error: queryParse.error.issues[0]?.message ?? 'Tham số không hợp lệ' }, 400)
    }
    const { warehouse_id, to_warehouse_id } = queryParse.data

    if (to_warehouse_id != null && to_warehouse_id === warehouse_id) {
      return c.json({ data: null, error: 'Kho nguồn và kho đích phải khác nhau' }, 400)
    }

    void weekId
    void supabaseAdmin
    return c.json({ data: null, error: 'Not implemented' }, 501)
  },
)

router.get(
  '/:weekId/transfer-history-thread',
  requirePermission('thread.batch.transfer'),
  async (c) => {
    const weekIdRaw = c.req.param('weekId')
    if (!/^\d+$/.test(weekIdRaw)) {
      return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
    }
    const queryParse = threadTransferHistoryQuerySchema.safeParse({
      thread_type_id: c.req.query('thread_type_id'),
      thread_color_id: c.req.query('thread_color_id'),
    })
    if (!queryParse.success) {
      return c.json({ data: null, error: queryParse.error.issues[0]?.message ?? 'Tham số không hợp lệ' }, 400)
    }
    return c.json({ data: null, error: 'Not implemented' }, 501)
  },
)

export default router
