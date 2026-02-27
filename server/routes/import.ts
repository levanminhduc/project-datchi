import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import type {
  ImportTexRequest,
  ImportTexPreviewRequest,
  ImportTexPreviewResponse,
  ImportTexPreviewRow,
  ImportTexResponse,
  ImportTexSkipDetail,
  ImportColorRequest,
  ImportColorResponse,
  ImportMappingConfig,
  ImportApiResponse,
} from '../types/import'

const importRouter = new Hono()

const isSupplierItemCodeConflict = (error: { code?: string; message?: string }) =>
  error.code === '23505' && error.message?.includes('uq_thread_type_supplier_supplier_item')

const DEFAULT_TEX_MAPPING: ImportMappingConfig = {
  sheet_index: 0,
  header_row: 1,
  data_start_row: 2,
  columns: { supplier_name: 'A', tex_number: 'B', meters_per_cone: 'C', unit_price: 'D', supplier_item_code: 'E' }
}

const DEFAULT_COLOR_MAPPING: ImportMappingConfig = {
  sheet_index: 0,
  header_row: 1,
  data_start_row: 2,
  columns: { color_name: 'A', supplier_color_code: 'B' }
}

const normalizeText = (value: string | null | undefined): string =>
  String(value || '').trim().toLowerCase()

const getMappingConfig = async (key: string, fallback: ImportMappingConfig): Promise<ImportMappingConfig> => {
  const { data: setting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single()

  return setting?.value || fallback
}

const buildSupplierAndTexCaches = async () => {
  const supplierCache = new Map<string, number>()
  const threadTypeCache = new Map<number, number>()

  const { data: existingSuppliers } = await supabase
    .from('suppliers')
    .select('id, name')
    .is('deleted_at', null)

  if (existingSuppliers) {
    for (const s of existingSuppliers) {
      supplierCache.set(normalizeText(s.name), s.id)
    }
  }

  const { data: existingThreadTypes } = await supabase
    .from('thread_types')
    .select('id, tex_number')
    .not('tex_number', 'is', null)
    .is('deleted_at', null)

  if (existingThreadTypes) {
    for (const t of existingThreadTypes) {
      if (t.tex_number !== null) {
        threadTypeCache.set(Number(t.tex_number), t.id)
      }
    }
  }

  return { supplierCache, threadTypeCache }
}

const toTexPreviewRow = (
  row: Partial<ImportTexPreviewRow>,
  supplierCache: Map<string, number>,
  threadTypeCache: Map<number, number>
): ImportTexPreviewRow => {
  const supplierName = String(row.supplier_name || '').trim()
  const texNumber = Number(row.tex_number) || 0
  const metersPerCone = Number(row.meters_per_cone) || 0
  const unitPrice = row.unit_price == null ? null : Number(row.unit_price)
  const supplierItemCode = row.supplier_item_code ? String(row.supplier_item_code).trim() : undefined

  const errors: string[] = []
  if (!supplierName) errors.push('Thiếu tên NCC')
  if (texNumber <= 0) errors.push('Tex phải > 0')
  if (metersPerCone <= 0) errors.push('Mét/cuộn phải > 0')
  if (unitPrice == null || Number.isNaN(unitPrice)) errors.push('Thiếu đơn giá')
  else if (unitPrice < 0) errors.push('Giá không được âm')

  let status: ImportTexPreviewRow['status'] = 'valid'
  if (errors.length > 0) {
    status = 'error'
  } else if (!supplierCache.has(normalizeText(supplierName))) {
    status = 'new_supplier'
  } else if (!threadTypeCache.has(texNumber)) {
    status = 'new_tex'
  }

  return {
    row_number: Number(row.row_number) || 0,
    supplier_name: supplierName,
    tex_number: texNumber,
    meters_per_cone: metersPerCone,
    unit_price: unitPrice ?? 0,
    supplier_item_code: supplierItemCode || undefined,
    status,
    errors
  }
}

importRouter.get('/mapping/supplier-tex', requirePermission('thread.suppliers.manage'), async (c) => {
  try {
    const config = await getMappingConfig('import_supplier_tex_mapping', DEFAULT_TEX_MAPPING)

    return c.json<ImportApiResponse<ImportMappingConfig>>({
      data: config,
      error: null
    })
  } catch (err) {
    console.error('Get supplier-tex mapping error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tải cấu hình import'
    }, 500)
  }
})

importRouter.get('/mapping/supplier-colors', requirePermission('thread.suppliers.manage'), async (c) => {
  try {
    const config = await getMappingConfig('import_supplier_color_mapping', DEFAULT_COLOR_MAPPING)

    return c.json<ImportApiResponse<ImportMappingConfig>>({
      data: config,
      error: null
    })
  } catch (err) {
    console.error('Get supplier-colors mapping error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tải cấu hình import'
    }, 500)
  }
})

importRouter.post('/supplier-tex/preview', requirePermission('thread.suppliers.manage'), async (c) => {
  try {
    const body = await c.req.json<ImportTexPreviewRequest>()

    if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: 'Không có dữ liệu để xem trước'
      }, 400)
    }

    const { supplierCache, threadTypeCache } = await buildSupplierAndTexCaches()
    const rows = body.rows.map((row) => toTexPreviewRow(row, supplierCache, threadTypeCache))

    return c.json<ImportApiResponse<ImportTexPreviewResponse>>({
      data: { rows },
      error: null
    })
  } catch (err) {
    console.error('Preview supplier-tex error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống khi xem trước dữ liệu import'
    }, 500)
  }
})

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
    const skipped_details: ImportTexSkipDetail[] = []

    const { supplierCache, threadTypeCache } = await buildSupplierAndTexCaches()

    for (const row of body.rows) {
      const previewRow = toTexPreviewRow(row, supplierCache, threadTypeCache)
      const rowNum = previewRow.row_number || 0
      const skipRow = (reason: string) => {
        skipped++
        skipped_details.push({
          row_number: rowNum,
          supplier_name: previewRow.supplier_name || '',
          tex_number: previewRow.tex_number || 0,
          reason
        })
      }

      if (previewRow.status === 'error') {
        skipRow(`Dữ liệu không hợp lệ: ${previewRow.errors.join(', ')}`)
        continue
      }

      let supplierId = supplierCache.get(normalizeText(previewRow.supplier_name))
      if (!supplierId) {
        const code = `NCC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            code: code.toUpperCase(),
            name: previewRow.supplier_name,
            is_active: true,
            lead_time_days: 7
          })
          .select('id')
          .single()

        if (supplierError || !newSupplier) {
          skipRow(`Không thể tạo NCC: ${supplierError?.message || 'Lỗi không xác định'}`)
          continue
        }

        supplierId = newSupplier.id
        supplierCache.set(normalizeText(previewRow.supplier_name), supplierId)
        suppliers_created++
      }

      let threadTypeId = threadTypeCache.get(previewRow.tex_number)
      if (!threadTypeId) {
        const densityGramsPerMeter = previewRow.tex_number / 1000
        const { data: newThreadType, error: threadTypeError } = await supabase
          .from('thread_types')
          .insert({
            code: `T-TEX${previewRow.tex_number}`,
            name: `Chỉ TEX ${previewRow.tex_number}`,
            tex_number: previewRow.tex_number,
            density_grams_per_meter: densityGramsPerMeter,
            meters_per_cone: previewRow.meters_per_cone,
            supplier_id: supplierId,
            is_active: true
          })
          .select('id')
          .single()

        if (threadTypeError || !newThreadType) {
          const { data: existingTypes } = await supabase
            .from('thread_types')
            .select('id')
            .eq('tex_number', previewRow.tex_number)
            .is('deleted_at', null)
            .limit(1)

          if (!existingTypes?.length) {
            skipRow(`Không thể tạo/tìm loại chỉ TEX ${previewRow.tex_number}: ${threadTypeError?.message || 'Lỗi không xác định'}`)
            continue
          }

          threadTypeId = existingTypes[0].id
        } else {
          threadTypeId = newThreadType.id
          thread_types_created++
        }

        threadTypeCache.set(previewRow.tex_number, threadTypeId)
      }

      const supplierItemCode = previewRow.supplier_item_code || `${previewRow.supplier_name}-TEX${previewRow.tex_number}`

      const { data: existingLinks } = await supabase
        .from('thread_type_supplier')
        .select('id')
        .eq('thread_type_id', threadTypeId)
        .eq('supplier_id', supplierId)
        .limit(1)

      const existingLink = existingLinks?.[0]
      if (existingLink) {
        const { error: updateError } = await supabase
          .from('thread_type_supplier')
          .update({
            unit_price: previewRow.unit_price,
            meters_per_cone: previewRow.meters_per_cone,
            supplier_item_code: supplierItemCode,
            is_active: true
          })
          .eq('id', existingLink.id)

        if (updateError) {
          if (isSupplierItemCodeConflict(updateError)) {
            const suffixedCode = `${supplierItemCode}-${threadTypeId}`
            const { error: retryUpdateError } = await supabase
              .from('thread_type_supplier')
              .update({
                unit_price: previewRow.unit_price,
                meters_per_cone: previewRow.meters_per_cone,
                supplier_item_code: suffixedCode,
                is_active: true
              })
              .eq('id', existingLink.id)

            if (retryUpdateError) {
              skipRow(`Không thể cập nhật liên kết NCC-Tex: ${retryUpdateError.message}`)
              continue
            }
          } else {
            skipRow(`Không thể cập nhật liên kết NCC-Tex: ${updateError.message}`)
            continue
          }
        }
      } else {
        const { error: insertError } = await supabase
          .from('thread_type_supplier')
          .insert({
            thread_type_id: threadTypeId,
            supplier_id: supplierId,
            supplier_item_code: supplierItemCode,
            unit_price: previewRow.unit_price,
            meters_per_cone: previewRow.meters_per_cone,
            is_active: true
          })

        if (insertError) {
          if (isSupplierItemCodeConflict(insertError)) {
            const suffixedCode = `${supplierItemCode}-${threadTypeId}`
            const { error: retryError } = await supabase
              .from('thread_type_supplier')
              .insert({
                thread_type_id: threadTypeId,
                supplier_id: supplierId,
                supplier_item_code: suffixedCode,
                unit_price: previewRow.unit_price,
                meters_per_cone: previewRow.meters_per_cone,
                is_active: true
              })

            if (retryError) {
              skipRow(`Không thể tạo liên kết NCC-Tex: ${retryError.message}`)
              continue
            }
          } else if (insertError.code === '23505') {
            const { data: raceLink } = await supabase
              .from('thread_type_supplier')
              .select('id')
              .eq('thread_type_id', threadTypeId)
              .eq('supplier_id', supplierId)
              .single()

            if (raceLink) {
              const { error: raceUpdateError } = await supabase
                .from('thread_type_supplier')
                .update({
                  unit_price: previewRow.unit_price,
                  meters_per_cone: previewRow.meters_per_cone,
                  supplier_item_code: supplierItemCode,
                  is_active: true
                })
                .eq('id', raceLink.id)

              if (raceUpdateError) {
                skipRow(`Không thể cập nhật liên kết NCC-Tex: ${raceUpdateError.message}`)
                continue
              }
            } else {
              skipRow(`Không thể tạo liên kết NCC-Tex: ${insertError.message}`)
              continue
            }
          } else {
            skipRow(`Không thể tạo liên kết NCC-Tex: ${insertError.message}`)
            continue
          }
        }
      }

      imported++
    }

    const result: ImportTexResponse = {
      imported,
      skipped,
      suppliers_created,
      thread_types_created,
      skipped_details
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

importRouter.get('/template/supplier-tex', requirePermission('thread.suppliers.view', 'thread.suppliers.manage'), async (c) => {
  try {
    const config = await getMappingConfig('import_supplier_tex_mapping', DEFAULT_TEX_MAPPING)

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

importRouter.get('/template/supplier-colors', requirePermission('thread.suppliers.view', 'thread.suppliers.manage'), async (c) => {
  try {
    const config = await getMappingConfig('import_supplier_color_mapping', DEFAULT_COLOR_MAPPING)

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
