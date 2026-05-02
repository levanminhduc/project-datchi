import { Hono } from 'hono'
import { supabaseAdmin } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { cleanupOrphans } from '../utils/guide-image-cleanup'
import type { AppEnv } from '../types/hono-env'

const adminGuides = new Hono<AppEnv>()

adminGuides.post('/cleanup-orphans', requirePermission('guides.edit'), async (c) => {
  try {
    const result = await cleanupOrphans(supabaseAdmin)
    return c.json({
      data: { deleted: result.deleted },
      error: null,
      message: `Đã dọn dẹp ${result.deleted} ảnh không sử dụng`,
    })
  } catch (err) {
    console.error('cleanup-orphans error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống khi dọn dẹp ảnh' }, 500)
  }
})

export default adminGuides
