import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import type {
  ImportTexRequest,
  ImportTexResponse,
  ImportColorRequest,
  ImportColorResponse,
  ImportMappingConfig,
  ImportApiResponse,
} from '../types/import'

const importRouter = new Hono()

importRouter.post('/supplier-tex', requirePermission('thread.suppliers.manage'), async (c) => {
  try {
    const body = await c.req.json<ImportTexRequest>()

    if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: 'Không có dữ liệu để import'
      }, 400)
    }

    let imported = 0
    let skipped = 0
    let suppliers_created = 0
    let thread_types_created = 0

    const supplierCache = new Map<string, number>()
    const threadTypeCache = new Map<number, number>()

    const { data: existingSuppliers } = await supabase
      .from('suppliers')
      .select('id, name')
      .is('deleted_at', null)

    if (existingSuppliers) {
      for (const s of existingSuppliers) {
        supplierCache.set(s.name.toLowerCase(), s.id)
      }
    }

    const { data: existingThreadTypes } = await supabase
      .from('thread_types')
      .select('id, tex_number')
      .not('tex_number', 'is', null)

    if (existingThreadTypes) {
      for (const t of existingThreadTypes) {
        if (t.tex_number !== null) {
          threadTypeCache.set(Number(t.tex_number), t.id)
        }
      }
    }

    for (const row of body.rows) {
      if (!row.supplier_name || !row.tex_number || !row.meters_per_cone || !row.unit_price) {
        skipped++
        continue
      }

      let supplierId = supplierCache.get(row.supplier_name.toLowerCase())
      if (!supplierId) {
        const code = `NCC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            code: code.toUpperCase(),
            name: row.supplier_name,
            is_active: true,
            lead_time_days: 7
          })
          .select('id')
          .single()

        if (supplierError || !newSupplier) {
          skipped++
          continue
        }

        supplierId = newSupplier.id
        supplierCache.set(row.supplier_name.toLowerCase(), supplierId)
        suppliers_created++
      }

      let threadTypeId = threadTypeCache.get(row.tex_number)
      if (!threadTypeId) {
        const densityGramsPerMeter = row.tex_number / 1000
        const { data: newThreadType, error: threadTypeError } = await supabase
          .from('thread_types')
          .insert({
            code: `T-TEX${row.tex_number}`,
            name: `Chỉ TEX ${row.tex_number}`,
            tex_number: row.tex_number,
            density_grams_per_meter: densityGramsPerMeter,
            meters_per_cone: row.meters_per_cone,
            is_active: true
          })
          .select('id')
          .single()

        if (threadTypeError || !newThreadType) {
          skipped++
          continue
        }

        threadTypeId = newThreadType.id
        threadTypeCache.set(row.tex_number, threadTypeId)
        thread_types_created++
      }

      const { error: upsertError } = await supabase
        .from('thread_type_supplier')
        .upsert({
          thread_type_id: threadTypeId,
          supplier_id: supplierId,
          supplier_item_code: row.supplier_item_code || `${row.supplier_name}-TEX${row.tex_number}`,
          unit_price: row.unit_price,
          meters_per_cone: row.meters_per_cone,
          is_active: true
        }, {
          onConflict: 'thread_type_id,supplier_id'
        })

      if (upsertError) {
        skipped++
        continue
      }

      imported++
    }

    const result: ImportTexResponse = {
      imported,
      skipped,
      suppliers_created,
      thread_types_created
    }

    return c.json<ImportApiResponse<ImportTexResponse>>({
      data: result,
      error: null,
      message: `Import thành công: ${imported} dòng, bỏ qua: ${skipped}, NCC mới: ${suppliers_created}, loại chỉ mới: ${thread_types_created}`
    })
  } catch (err) {
    console.error('Import supplier-tex error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống khi import'
    }, 500)
  }
})

importRouter.post('/supplier-colors', requirePermission('thread.suppliers.manage'), async (c) => {
  try {
    const body = await c.req.json<ImportColorRequest>()

    if (!body.supplier_id) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: supplier_id'
      }, 400)
    }

    if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: 'Không có dữ liệu để import'
      }, 400)
    }

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', body.supplier_id)
      .is('deleted_at', null)
      .single()

    if (!supplier) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy nhà cung cấp'
      }, 404)
    }

    let imported = 0
    let skipped = 0
    let colors_created = 0

    const colorCache = new Map<string, number>()

    const { data: existingColors } = await supabase
      .from('colors')
      .select('id, name')

    if (existingColors) {
      for (const color of existingColors) {
        colorCache.set(color.name.toLowerCase(), color.id)
      }
    }

    for (const row of body.rows) {
      if (!row.color_name) {
        skipped++
        continue
      }

      let colorId = colorCache.get(row.color_name.toLowerCase())
      if (!colorId) {
        const { data: newColor, error: colorError } = await supabase
          .from('colors')
          .insert({
            name: row.color_name,
            hex_code: '#808080',
            is_active: true
          })
          .select('id')
          .single()

        if (colorError || !newColor) {
          skipped++
          continue
        }

        colorId = newColor.id
        colorCache.set(row.color_name.toLowerCase(), colorId)
        colors_created++
      }

      const { data: existingLink } = await supabase
        .from('color_supplier')
        .select('id')
        .eq('color_id', colorId)
        .eq('supplier_id', body.supplier_id)
        .single()

      if (existingLink) {
        skipped++
        continue
      }

      const { error: linkError } = await supabase
        .from('color_supplier')
        .insert({
          color_id: colorId,
          supplier_id: body.supplier_id,
          is_active: true
        })

      if (linkError) {
        skipped++
        continue
      }

      imported++
    }

    const result: ImportColorResponse = {
      imported,
      skipped,
      colors_created
    }

    return c.json<ImportApiResponse<ImportColorResponse>>({
      data: result,
      error: null,
      message: `Import thành công: ${imported} màu, bỏ qua: ${skipped}, màu mới: ${colors_created}`
    })
  } catch (err) {
    console.error('Import supplier-colors error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống khi import'
    }, 500)
  }
})

importRouter.get('/template/supplier-tex', requirePermission('thread.suppliers.view'), async (c) => {
  try {
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'import_supplier_tex_mapping')
      .single()

    const config: ImportMappingConfig = setting?.value || {
      sheet_index: 0,
      header_row: 1,
      data_start_row: 2,
      columns: { supplier_name: 'A', tex_number: 'B', meters_per_cone: 'C', unit_price: 'D', supplier_item_code: 'E' }
    }

    const ExcelJSModule = await import('exceljs')
    const ExcelJS = ExcelJSModule.default || ExcelJSModule
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Import NCC-Tex')

    const headerLabels: Record<string, string> = {
      supplier_name: 'Tên NCC',
      tex_number: 'Số TEX',
      meters_per_cone: 'Mét/Cone',
      unit_price: 'Đơn giá',
      supplier_item_code: 'Mã hàng NCC'
    }

    const exampleData: Record<string, string | number> = {
      supplier_name: 'Công ty ABC',
      tex_number: 40,
      meters_per_cone: 5000,
      unit_price: 25000,
      supplier_item_code: 'ABC-TEX40'
    }

    for (const [field, colLetter] of Object.entries(config.columns)) {
      const col = colLetter.toUpperCase()
      const headerCell = sheet.getCell(`${col}${config.header_row}`)
      headerCell.value = headerLabels[field] || field
      headerCell.font = { bold: true }
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      }

      const dataCell = sheet.getCell(`${col}${config.data_start_row}`)
      dataCell.value = exampleData[field] ?? ''
    }

    for (const colLetter of Object.values(config.columns)) {
      const col = sheet.getColumn(colLetter.toUpperCase())
      col.width = 18
    }

    const buffer = await workbook.xlsx.writeBuffer()

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    c.header('Content-Disposition', 'attachment; filename="template-import-ncc-tex.xlsx"')
    return c.body(buffer as ArrayBuffer)
  } catch (err) {
    console.error('Template supplier-tex error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tạo file mẫu'
    }, 500)
  }
})

importRouter.get('/template/supplier-colors', requirePermission('thread.suppliers.view'), async (c) => {
  try {
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'import_supplier_color_mapping')
      .single()

    const config: ImportMappingConfig = setting?.value || {
      sheet_index: 0,
      header_row: 1,
      data_start_row: 2,
      columns: { color_name: 'A', supplier_color_code: 'B' }
    }

    const ExcelJSModule = await import('exceljs')
    const ExcelJS = ExcelJSModule.default || ExcelJSModule
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Import Màu NCC')

    const headerLabels: Record<string, string> = {
      color_name: 'Tên màu',
      supplier_color_code: 'Mã màu NCC'
    }

    const exampleData: Record<string, string> = {
      color_name: 'Đỏ',
      supplier_color_code: 'RED-001'
    }

    for (const [field, colLetter] of Object.entries(config.columns)) {
      const col = colLetter.toUpperCase()
      const headerCell = sheet.getCell(`${col}${config.header_row}`)
      headerCell.value = headerLabels[field] || field
      headerCell.font = { bold: true }
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      }

      const dataCell = sheet.getCell(`${col}${config.data_start_row}`)
      dataCell.value = exampleData[field] ?? ''
    }

    for (const colLetter of Object.values(config.columns)) {
      const col = sheet.getColumn(colLetter.toUpperCase())
      col.width = 18
    }

    const buffer = await workbook.xlsx.writeBuffer()

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    c.header('Content-Disposition', 'attachment; filename="template-import-mau-ncc.xlsx"')
    return c.body(buffer as ArrayBuffer)
  } catch (err) {
    console.error('Template supplier-colors error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tạo file mẫu'
    }, 500)
  }
})

export default importRouter
