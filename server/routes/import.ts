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
import type {
  POImportRow,
  POImportErrorRow,
  POImportPreview,
  POImportResult,
  POImportMappingConfig,
} from '../types/purchaseOrder'
import type { AuthContext } from '../types/auth'
import { POImportParseRequestSchema, POImportExecuteRequestSchema } from '../validation/purchaseOrder'

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

const DEFAULT_PO_ITEMS_MAPPING: POImportMappingConfig = {
  sheet_index: 0,
  header_row: 1,
  data_start_row: 2,
  columns: {
    po_number: 'A',
    style_code: 'B',
    quantity: 'C',
    customer_name: 'D',
    order_date: 'E',
    notes: 'F'
  }
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
  const threadTypeCache = new Map<string, number>()

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
    .select('id, tex_number, supplier_id')
    .not('tex_number', 'is', null)
    .is('deleted_at', null)

  if (existingThreadTypes) {
    for (const t of existingThreadTypes) {
      if (t.tex_number !== null && t.supplier_id !== null) {
        const key = `${t.supplier_id}-${t.tex_number}`
        threadTypeCache.set(key, t.id)
      }
    }
  }

  return { supplierCache, threadTypeCache }
}

const toTexPreviewRow = (
  row: Partial<ImportTexPreviewRow>,
  supplierCache: Map<string, number>,
  threadTypeCache: Map<string, number>
): ImportTexPreviewRow => {
  const supplierName = String(row.supplier_name || '').trim()
  const texNumber = String(row.tex_number || '').trim()
  const metersPerCone = Number(row.meters_per_cone) || 0
  const unitPrice = row.unit_price == null ? null : Number(row.unit_price)
  const supplierItemCode = row.supplier_item_code ? String(row.supplier_item_code).trim() : undefined

  const errors: string[] = []
  if (!supplierName) errors.push('Thiếu tên NCC')
  if (!texNumber) errors.push('Thiếu Tex')
  if (metersPerCone <= 0) errors.push('Mét/cuộn phải > 0')
  if (unitPrice == null || Number.isNaN(unitPrice)) errors.push('Thiếu đơn giá')
  else if (unitPrice < 0) errors.push('Giá không được âm')

  const supplierId = supplierCache.get(normalizeText(supplierName))
  const texCacheKey = supplierId ? `${supplierId}-${texNumber}` : ''

  let status: ImportTexPreviewRow['status'] = 'valid'
  if (errors.length > 0) {
    status = 'error'
  } else if (!supplierId) {
    status = 'new_supplier'
  } else if (!threadTypeCache.has(texCacheKey)) {
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
          tex_number: previewRow.tex_number || '',
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

      const texCacheKey = `${supplierId}-${previewRow.tex_number}`
      let threadTypeId = threadTypeCache.get(texCacheKey)
      if (!threadTypeId) {
        const texNumeric = parseFloat(previewRow.tex_number) || 0
        const densityGramsPerMeter = texNumeric / 1000
        const uniqueCode = `T-${supplierId}-TEX${previewRow.tex_number}`
        const { data: newThreadType, error: threadTypeError } = await supabase
          .from('thread_types')
          .insert({
            code: uniqueCode,
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
            .eq('supplier_id', supplierId)
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

        threadTypeCache.set(texCacheKey, threadTypeId)
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
      tex_number: '20/9',
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

const getPOImportMappingConfig = async (): Promise<POImportMappingConfig> => {
  const { data: setting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'import_po_items_mapping')
    .single()

  return setting?.value || DEFAULT_PO_ITEMS_MAPPING
}

importRouter.get('/mapping/po-items', requirePermission('thread.purchase-orders.import'), async (c) => {
  try {
    const config = await getPOImportMappingConfig()
    return c.json<ImportApiResponse<POImportMappingConfig>>({
      data: config,
      error: null
    })
  } catch (err) {
    console.error('Get po-items mapping error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tải cấu hình import'
    }, 500)
  }
})

importRouter.post('/po-items/parse', requirePermission('thread.purchase-orders.import'), async (c) => {
  try {
    const body = await c.req.json()
    const parseResult = POImportParseRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: parseResult.error.issues.map(i => i.message).join(', ')
      }, 400)
    }

    const { rows } = parseResult.data

    const { data: styles } = await supabase
      .from('styles')
      .select('id, style_code, style_name')
      .is('deleted_at', null)

    const styleMap = new Map<string, { id: number; style_code: string; style_name: string }>()
    styles?.forEach(s => styleMap.set(s.style_code.toLowerCase(), s))

    const { data: existingPOs } = await supabase
      .from('purchase_orders')
      .select('id, po_number')
      .is('deleted_at', null)

    const poMap = new Map<string, number>()
    existingPOs?.forEach(po => poMap.set(po.po_number.toLowerCase(), po.id))

    const { data: existingItems } = await supabase
      .from('po_items')
      .select('po_id, style_id, quantity')
      .is('deleted_at', null)

    const itemMap = new Map<string, { quantity: number }>()
    existingItems?.forEach(item => {
      const key = `${item.po_id}-${item.style_id}`
      itemMap.set(key, { quantity: item.quantity })
    })

    const validRows: POImportRow[] = []
    const errorRows: POImportErrorRow[] = []
    const newPOsSet = new Set<string>()
    let updateCount = 0
    let skipCount = 0

    for (const row of rows) {
      const poNumber = String(row.po_number || '').trim()
      const styleCode = String(row.style_code || '').trim()
      const quantity = Number(row.quantity) || 0

      const errors: string[] = []

      if (!poNumber) errors.push('Thiếu số PO')
      if (!styleCode) errors.push('Thiếu mã hàng')
      if (quantity <= 0) errors.push('Số lượng phải lớn hơn 0')

      const style = styleMap.get(styleCode.toLowerCase())

      if (errors.length > 0) {
        errorRows.push({
          row_number: row.row_number,
          data: row,
          error_message: errors.join(', ')
        })
        continue
      }

      const poId = poMap.get(poNumber.toLowerCase())
      let status: POImportRow['status']

      if (!style) {
        status = 'new_style'
      } else if (!poId) {
        status = 'new'
        newPOsSet.add(poNumber.toLowerCase())
      } else {
        const itemKey = `${poId}-${style.id}`
        const existingItem = itemMap.get(itemKey)

        if (!existingItem) {
          status = 'new'
        } else if (existingItem.quantity !== quantity) {
          status = 'update'
          updateCount++
        } else {
          status = 'skip'
          skipCount++
        }
      }

      if (!poId) {
        newPOsSet.add(poNumber.toLowerCase())
      }

      validRows.push({
        row_number: row.row_number,
        po_number: poNumber,
        style_code: styleCode,
        style_name: style?.style_name || styleCode,
        style_id: style?.id,
        quantity,
        customer_name: row.customer_name,
        order_date: row.order_date,
        notes: row.notes,
        status
      })
    }

    const preview: POImportPreview = {
      valid_rows: validRows,
      error_rows: errorRows,
      summary: {
        total: rows.length,
        valid: validRows.length,
        errors: errorRows.length,
        new_pos: newPOsSet.size,
        update_items: updateCount,
        skip_items: skipCount
      }
    }

    return c.json<ImportApiResponse<POImportPreview>>({
      data: preview,
      error: null
    })
  } catch (err) {
    console.error('Parse PO items error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi khi phân tích file import'
    }, 500)
  }
})

importRouter.post('/po-items/execute', requirePermission('thread.purchase-orders.import'), async (c) => {
  try {
    const body = await c.req.json()
    const parseResult = POImportExecuteRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return c.json<ImportApiResponse<null>>({
        data: null,
        error: parseResult.error.issues.map(i => i.message).join(', ')
      }, 400)
    }

    const { rows } = parseResult.data
    const auth = c.get('auth') as AuthContext & { permissions: string[] }

    let createdPOs = 0
    let createdItems = 0
    let updatedItems = 0
    let skippedItems = 0
    let failedItems = 0

    const { data: existingPOs } = await supabase
      .from('purchase_orders')
      .select('id, po_number')
      .is('deleted_at', null)

    const poMap = new Map<string, number>()
    existingPOs?.forEach(po => poMap.set(po.po_number.toLowerCase(), po.id))

    const poCustomerMap = new Map<string, string>()
    const poDateMap = new Map<string, string>()
    rows.forEach(row => {
      const key = row.po_number.toLowerCase()
      if (row.customer_name) poCustomerMap.set(key, row.customer_name)
      if (row.order_date) poDateMap.set(key, row.order_date)
    })

    const createdStyleMap = new Map<string, number>()

    for (const row of rows) {
      if (row.status === 'skip') {
        skippedItems++
        continue
      }

      if (row.status === 'new_style' && !row.style_id) {
        const styleKey = row.style_code.toLowerCase()
        let newStyleId = createdStyleMap.get(styleKey)

        if (!newStyleId) {
          const { data: newStyle, error: styleError } = await supabase
            .from('styles')
            .insert({ style_code: row.style_code, style_name: row.style_code })
            .select('id')
            .single()

          if (styleError) {
            if (styleError.code === '23505') {
              const { data: existingStyle } = await supabase
                .from('styles')
                .select('id')
                .eq('style_code', row.style_code)
                .is('deleted_at', null)
                .single()
              newStyleId = existingStyle?.id
            } else {
              console.error('Create style error:', styleError)
              failedItems++
              continue
            }
          } else {
            newStyleId = newStyle.id
          }

          if (newStyleId) {
            createdStyleMap.set(styleKey, newStyleId)
          }
        }

        if (!newStyleId) {
          failedItems++
          continue
        }
        row.style_id = newStyleId
        row.status = 'new'
      }

      let poId = poMap.get(row.po_number.toLowerCase())

      if (!poId) {
        const { data: newPO, error: poError } = await supabase
          .from('purchase_orders')
          .insert({
            po_number: row.po_number,
            customer_name: poCustomerMap.get(row.po_number.toLowerCase()) || null,
            order_date: poDateMap.get(row.po_number.toLowerCase()) || null,
            status: 'PENDING'
          })
          .select('id')
          .single()

        if (poError) {
          if (poError.code === '23505') {
            const { data: existingPO } = await supabase
              .from('purchase_orders')
              .select('id')
              .eq('po_number', row.po_number)
              .is('deleted_at', null)
              .single()
            poId = existingPO?.id
          } else {
            throw poError
          }
        } else {
          poId = newPO.id
          poMap.set(row.po_number.toLowerCase(), poId)
          createdPOs++
        }
      }

      if (!poId) {
        failedItems++
        continue
      }

      const { data: existingItem } = await supabase
        .from('po_items')
        .select('id, quantity')
        .eq('po_id', poId)
        .eq('style_id', row.style_id)
        .is('deleted_at', null)
        .maybeSingle()

      if (!existingItem) {
        const { data: newItem, error: insertError } = await supabase
          .from('po_items')
          .insert({
            po_id: poId,
            style_id: row.style_id,
            quantity: row.quantity,
            notes: row.notes || null
          })
          .select('id')
          .single()

        if (insertError) {
          if (insertError.code !== '23505') {
            console.error('Insert PO item error:', insertError)
          }
          continue
        }

        await supabase.from('po_item_history').insert({
          po_item_id: newItem.id,
          change_type: 'CREATE',
          previous_quantity: null,
          new_quantity: row.quantity,
          changed_by: auth.employeeId,
          notes: 'Import từ Excel'
        })

        createdItems++
      } else if (existingItem.quantity !== row.quantity) {
        await supabase
          .from('po_items')
          .update({ quantity: row.quantity, updated_at: new Date().toISOString() })
          .eq('id', existingItem.id)

        await supabase.from('po_item_history').insert({
          po_item_id: existingItem.id,
          change_type: 'UPDATE',
          previous_quantity: existingItem.quantity,
          new_quantity: row.quantity,
          changed_by: auth.employeeId,
          notes: 'Import từ Excel'
        })

        updatedItems++
      } else {
        skippedItems++
      }
    }

    const result: POImportResult = {
      created_pos: createdPOs,
      created_items: createdItems,
      updated_items: updatedItems,
      skipped_items: skippedItems,
      failed_items: failedItems
    }

    return c.json<ImportApiResponse<POImportResult>>({
      data: result,
      error: null,
      message: `Import thành công: ${createdPOs} PO mới, ${createdItems} mặt hàng mới, ${updatedItems} cập nhật, ${skippedItems} bỏ qua`
    })
  } catch (err) {
    console.error('Execute PO import error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi khi thực hiện import'
    }, 500)
  }
})

importRouter.get('/template/po-items', requirePermission('thread.purchase-orders.import'), async (c) => {
  try {
    const config = await getPOImportMappingConfig()

    const ExcelJSModule = await import('exceljs')
    const ExcelJS = ExcelJSModule.default || ExcelJSModule
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Import Đơn Hàng PO')

    const headerLabels: Record<string, string> = {
      po_number: 'Số PO',
      style_code: 'Mã hàng',
      quantity: 'Số lượng SP',
      customer_name: 'Khách hàng',
      order_date: 'Ngày đặt',
      notes: 'Ghi chú'
    }

    const exampleData: Record<string, string | number> = {
      po_number: 'PO-2024-001',
      style_code: 'STYLE-001',
      quantity: 1000,
      customer_name: 'Công ty ABC',
      order_date: '2024-01-15',
      notes: 'Giao hàng gấp'
    }

    for (const [field, colLetter] of Object.entries(config.columns)) {
      if (!colLetter) continue
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
      if (!colLetter) continue
      const col = sheet.getColumn(colLetter.toUpperCase())
      col.width = 18
    }

    const buffer = await workbook.xlsx.writeBuffer()

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    c.header('Content-Disposition', 'attachment; filename="template-import-po-items.xlsx"')
    return c.body(buffer as ArrayBuffer)
  } catch (err) {
    console.error('Template po-items error:', err)
    return c.json<ImportApiResponse<null>>({
      data: null,
      error: 'Lỗi khi tạo file mẫu'
    }, 500)
  }
})

export default importRouter
