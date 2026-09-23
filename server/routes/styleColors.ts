import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'

const styleColors = new Hono()

async function validateSubArtColorName(styleId: number, colorName: string): Promise<string | null> {
  const subArts = await from('sub_arts')
    .select('sub_art_code')
    .eq('style_id', styleId)
    .list<{ sub_art_code: string }>()

  if (!subArts || subArts.length === 0) return null

  const sepIdx = colorName.indexOf(' - ')
  if (sepIdx === -1) {
    return 'Tên màu phải có format: {Sub-Art} - {Màu}'
  }

  const subArtCode = colorName.substring(0, sepIdx)
  const validCodes = subArts.map(s => s.sub_art_code)
  if (!validCodes.includes(subArtCode)) {
    return `Mã Sub-Art "${subArtCode}" không hợp lệ. Hợp lệ: ${validCodes.join(', ')}`
  }

  return null
}

styleColors.post('/:styleId/clone', requirePermission('thread.styles.create'), async (c) => {
  try {
    const styleId = parseInt(c.req.param('styleId'))
    if (isNaN(styleId)) {
      return c.json({ data: null, error: 'Style ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()
    const { source_color_id, color_name, hex_code } = body

    if (!source_color_id || !color_name?.trim()) {
      return c.json({ data: null, error: 'source_color_id và color_name là bắt buộc' }, 400)
    }

    const sourceColor = await queryOne<{ id: number }>(
      'SELECT id FROM style_colors WHERE id = $1 AND style_id = $2',
      [source_color_id, styleId]
    )

    if (!sourceColor) {
      return c.json({ data: null, error: 'Màu hàng nguồn không tồn tại' }, 400)
    }

    const validationError = await validateSubArtColorName(styleId, color_name.trim())
    if (validationError) {
      return c.json({ data: null, error: validationError }, 400)
    }

    let newColor: { id: number } & Record<string, unknown>
    try {
      const inserted = await queryOne<{ id: number } & Record<string, unknown>>(
        `INSERT INTO style_colors (style_id, color_name, hex_code)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [styleId, color_name.trim(), hex_code || '#808080']
      )
      newColor = inserted as { id: number } & Record<string, unknown>
    } catch (insertErr) {
      if ((insertErr as { code?: string }).code === '23505') {
        return c.json({ data: null, error: 'Màu này đã tồn tại cho mã hàng' }, 400)
      }
      throw insertErr
    }

    const parentSpecs = await from('style_thread_specs')
      .select('id, thread_type_id')
      .eq('style_id', styleId)
      .limit(500)
      .list<{ id: number; thread_type_id: number | null }>()

    if (parentSpecs && parentSpecs.length > 0) {
      const sourceSpecs = await from('style_color_thread_specs')
        .select('style_thread_spec_id, thread_color_id, notes')
        .eq('style_color_id', source_color_id)
        .limit(500)
        .list<{ style_thread_spec_id: number; thread_color_id: number | null; notes: string | null }>()

      const sourceMap = new Map(
        (sourceSpecs || []).map(s => [s.style_thread_spec_id, s])
      )

      const clonedRows = parentSpecs
        .filter(parent => parent.thread_type_id !== null)
        .map(parent => {
        const source = sourceMap.get(parent.id)
        return {
          style_thread_spec_id: parent.id,
          style_color_id: newColor.id,
          thread_type_id: parent.thread_type_id,
          thread_color_id: source?.thread_color_id ?? null,
          notes: source?.notes ?? null,
        }
      })

      if (clonedRows.length > 0) {
        const valueParts: string[] = []
        const params: unknown[] = []
        for (const row of clonedRows) {
          params.push(row.style_thread_spec_id, row.style_color_id, row.thread_type_id, row.thread_color_id, row.notes)
          const base = params.length - 5
          valueParts.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`)
        }
        await query(
          `INSERT INTO style_color_thread_specs
             (style_thread_spec_id, style_color_id, thread_type_id, thread_color_id, notes)
           VALUES ${valueParts.join(', ')}`,
          params
        )
      }
    }

    return c.json({ data: newColor, error: null, message: 'Copy màu hàng thành công' })
  } catch (err) {
    console.error('Error cloning style color:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.get('/hex-palette', requirePermission('thread.styles.view'), async (c) => {
  try {
    const data = await from('style_colors')
      .select('color_name, hex_code')
      .eq('is_active', true)
      .order({ column: 'color_name', ascending: true })
      .limit(500)
      .list<{ color_name: string; hex_code: string }>()

    const seen = new Set<string>()
    const unique = (data || []).filter(row => {
      const key = `${row.color_name}|${row.hex_code}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return c.json({ data: unique, error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.get('/:styleId', requirePermission('thread.styles.view'), async (c) => {
  try {
    const styleId = parseInt(c.req.param('styleId'))
    if (isNaN(styleId)) {
      return c.json({ data: null, error: 'Style ID không hợp lệ' }, 400)
    }

    const data = await from('style_colors')
      .select('*')
      .eq('style_id', styleId)
      .eq('is_active', true)
      .order({ column: 'color_name', ascending: true })
      .list()

    return c.json({ data, error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.post('/:styleId', requirePermission('thread.styles.create'), async (c) => {
  try {
    const styleId = parseInt(c.req.param('styleId'))
    if (isNaN(styleId)) {
      return c.json({ data: null, error: 'Style ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()
    if (!body.color_name?.trim()) {
      return c.json({ data: null, error: 'Tên màu là bắt buộc' }, 400)
    }

    const validationError = await validateSubArtColorName(styleId, body.color_name.trim())
    if (validationError) {
      return c.json({ data: null, error: validationError }, 400)
    }

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `INSERT INTO style_colors (style_id, color_name, hex_code)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [styleId, body.color_name.trim(), body.hex_code || '#808080']
      )
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return c.json({ data: null, error: 'Màu này đã tồn tại cho mã hàng' }, 400)
      }
      throw err
    }

    return c.json({ data, error: null, message: 'Thêm màu hàng thành công' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.put('/:styleId/:id', requirePermission('thread.styles.edit'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    if (body.color_name) {
      const styleIdParam = parseInt(c.req.param('styleId'))
      const validationError = await validateSubArtColorName(styleIdParam, body.color_name.trim())
      if (validationError) {
        return c.json({ data: null, error: validationError }, 400)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.color_name !== undefined) updateData.color_name = body.color_name
    if (body.hex_code !== undefined) updateData.hex_code = body.hex_code
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updateData)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(id)

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `UPDATE style_colors SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      )
    } catch (err) {
      if ((err as { code?: string }).code === '23505') return c.json({ data: null, error: 'Tên màu đã tồn tại' }, 400)
      throw err
    }

    if (!data) return c.json({ data: null, error: 'Không tìm thấy' }, 404)

    return c.json({ data, error: null, message: 'Cập nhật thành công' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.delete('/:styleId/:id', requirePermission('thread.styles.delete'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const data = await queryOne<Record<string, unknown>>(
      `UPDATE style_colors SET is_active = false WHERE id = $1 RETURNING *`,
      [id]
    )

    if (!data) return c.json({ data: null, error: 'Không tìm thấy' }, 404)

    return c.json({ data, error: null, message: 'Đã xóa màu hàng' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default styleColors
