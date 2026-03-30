import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'

const styleColors = new Hono()

styleColors.use('*', requirePermission('thread.types.view'))

async function validateSubArtColorName(styleId: number, colorName: string): Promise<string | null> {
  const { data: subArts } = await supabase
    .from('sub_arts')
    .select('sub_art_code')
    .eq('style_id', styleId)

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

styleColors.post('/:styleId/clone', async (c) => {
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

    const { data: sourceColor, error: sourceErr } = await supabase
      .from('style_colors')
      .select('id')
      .eq('id', source_color_id)
      .eq('style_id', styleId)
      .single()

    if (sourceErr || !sourceColor) {
      return c.json({ data: null, error: 'Màu hàng nguồn không tồn tại' }, 400)
    }

    const validationError = await validateSubArtColorName(styleId, color_name.trim())
    if (validationError) {
      return c.json({ data: null, error: validationError }, 400)
    }

    const { data: newColor, error: insertErr } = await supabase
      .from('style_colors')
      .insert([{
        style_id: styleId,
        color_name: color_name.trim(),
        hex_code: hex_code || '#808080',
      }])
      .select()
      .single()

    if (insertErr) {
      if (insertErr.code === '23505') {
        return c.json({ data: null, error: 'Màu này đã tồn tại cho mã hàng' }, 400)
      }
      throw insertErr
    }

    const { data: sourceSpecs } = await supabase
      .from('style_color_thread_specs')
      .select('style_thread_spec_id, thread_type_id, thread_color_id, notes')
      .eq('style_color_id', source_color_id)
      .limit(500)

    if (sourceSpecs && sourceSpecs.length > 0) {
      const clonedRows = sourceSpecs.map(s => ({
        style_thread_spec_id: s.style_thread_spec_id,
        style_color_id: newColor.id,
        thread_type_id: s.thread_type_id,
        thread_color_id: s.thread_color_id,
        notes: s.notes,
      }))

      const { error: cloneErr } = await supabase
        .from('style_color_thread_specs')
        .insert(clonedRows)

      if (cloneErr) throw cloneErr
    }

    return c.json({ data: newColor, error: null, message: 'Copy màu hàng thành công' })
  } catch (err) {
    console.error('Error cloning style color:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.get('/:styleId', async (c) => {
  try {
    const styleId = parseInt(c.req.param('styleId'))
    if (isNaN(styleId)) {
      return c.json({ data: null, error: 'Style ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('style_colors')
      .select('*')
      .eq('style_id', styleId)
      .eq('is_active', true)
      .order('color_name', { ascending: true })

    if (error) throw error
    return c.json({ data, error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.post('/:styleId', async (c) => {
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

    const { data, error } = await supabase
      .from('style_colors')
      .insert([{
        style_id: styleId,
        color_name: body.color_name.trim(),
        hex_code: body.hex_code || '#808080',
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return c.json({ data: null, error: 'Màu này đã tồn tại cho mã hàng' }, 400)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Thêm màu hàng thành công' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.put('/:styleId/:id', async (c) => {
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

    const { data, error } = await supabase
      .from('style_colors')
      .update({
        color_name: body.color_name,
        hex_code: body.hex_code,
        is_active: body.is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return c.json({ data: null, error: 'Tên màu đã tồn tại' }, 400)
      if (error.code === 'PGRST116') return c.json({ data: null, error: 'Không tìm thấy' }, 404)
      throw error
    }

    return c.json({ data, error: null, message: 'Cập nhật thành công' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styleColors.delete('/:styleId/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('style_colors')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return c.json({ data: null, error: 'Không tìm thấy' }, 404)
      throw error
    }

    return c.json({ data, error: null, message: 'Đã xóa màu hàng' })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default styleColors
