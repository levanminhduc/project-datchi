import { Hono } from 'hono'
import ExcelJS from 'exceljs'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { SubArtQuerySchema } from '../validation/subArts'

const subArts = new Hono()

subArts.use('*', requirePermission('thread.types.view'))

subArts.get('/codes', async (c) => {
  try {
    const { data, error } = await supabase
      .from('sub_arts')
      .select('sub_art_code')
      .order('sub_art_code', { ascending: true })

    if (error) throw error

    const codes = [...new Set((data || []).map(r => r.sub_art_code))]
    return c.json({ data: codes, error: null })
  } catch (err) {
    console.error('Error fetching sub_art codes:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

subArts.get('/', async (c) => {
  try {
    const query = c.req.query()
    const parsed = SubArtQuerySchema.safeParse(query)

    if (!parsed.success) {
      return c.json({ data: null, error: parsed.error.issues.map(i => i.message).join(', ') }, 400)
    }

    const { style_id } = parsed.data

    const { data, error } = await supabase
      .from('sub_arts')
      .select('id, sub_art_code')
      .eq('style_id', style_id)
      .order('sub_art_code', { ascending: true })

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching sub_arts:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

subArts.post('/import', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!(file instanceof File)) {
      return c.json({ data: null, error: 'Thiếu file Excel' }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = new ExcelJS.Workbook()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return c.json({ data: null, error: 'File Excel không có sheet nào' }, 400)
    }

    const rows: Array<{ style_code: string; sub_art_code: string }> = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const styleCode = String(row.getCell(1).value ?? '').trim()
      const subArtCode = String(row.getCell(2).value ?? '').trim()
      if (styleCode && subArtCode) {
        rows.push({ style_code: styleCode, sub_art_code: subArtCode })
      }
    })

    if (rows.length === 0) {
      return c.json({ data: null, error: 'Không có dữ liệu hợp lệ trong file' }, 400)
    }

    const { data: styles } = await supabase
      .from('styles')
      .select('id, style_code')
      .is('deleted_at', null)

    const styleMap = new Map<string, number>()
    styles?.forEach(s => styleMap.set(s.style_code.toLowerCase(), s.id))

    let imported = 0
    let skipped = 0
    const warnings: Array<{ row: number; style_code: string; sub_art_code: string; reason: string }> = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const styleCode = row.style_code.trim()
      const subArtCode = row.sub_art_code.trim()

      const styleId = styleMap.get(styleCode.toLowerCase())
      if (!styleId) {
        warnings.push({ row: i + 1, style_code: styleCode, sub_art_code: subArtCode, reason: `Không tìm thấy mã hàng "${styleCode}"` })
        continue
      }

      const { error: insertError } = await supabase
        .from('sub_arts')
        .insert({ style_id: styleId, sub_art_code: subArtCode })

      if (insertError) {
        if (insertError.code === '23505') {
          skipped++
        } else {
          warnings.push({ row: i + 1, style_code: styleCode, sub_art_code: subArtCode, reason: insertError.message })
        }
        continue
      }

      imported++
    }

    return c.json({
      data: { imported, skipped, warnings_count: warnings.length, warnings },
      error: null,
      message: `Import thành công: ${imported} dòng, bỏ qua trùng: ${skipped}, cảnh báo: ${warnings.length}`
    })
  } catch (err) {
    console.error('Error importing sub_arts:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

subArts.get('/template', async (c) => {
  try {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Import Sub-Art')

    const headers = ['Mã Hàng (style_code)', 'Mã Sub-Art (sub_art_code)']
    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      }
    })

    sheet.addRow(['KS L/S', 'SA-001'])
    sheet.addRow(['KS L/S', 'SA-002'])
    sheet.addRow(['AB S/S', 'SA-003'])

    sheet.getColumn(1).width = 25
    sheet.getColumn(2).width = 25

    const buffer = await workbook.xlsx.writeBuffer()

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    c.header('Content-Disposition', 'attachment; filename=template-import-sub-art.xlsx')
    return c.body(buffer as ArrayBuffer)
  } catch (err) {
    console.error('Error generating sub_arts template:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default subArts
