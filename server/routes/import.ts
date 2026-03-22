import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
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

const CHUNK_SIZE = 500

async function fetchAllColors() {
  const colorMap = new Map<string, number>()
  let offset = 0
  const batchSize = 1000

  while (true) {
    const { data } = await supabase
      .from('colors')
      .select('id, name')
      .range(offset, offset + batchSize - 1)

    if (!data || data.length === 0) break

    for (const color of data) {
      colorMap.set(color.name.toLowerCase(), color.id)
    }

    if (data.length < batchSize) break
    offset += batchSize
  }

  return colorMap
}

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
    customer_name: 'A',
    po_number: 'B',
    style_code: 'C',
    week: 'D',
    description: 'E',
    finished_product_code: 'F',
    quantity: 'G'
  }
}

const normalizePOImportMappingConfig = (raw: unknown): POImportMappingConfig => {
  const fallback: POImportMappingConfig = {
    sheet_index: DEFAULT_PO_ITEMS_MAPPING.sheet_index,
    header_row: DEFAULT_PO_ITEMS_MAPPING.header_row,
    data_start_row: DEFAULT_PO_ITEMS_MAPPING.data_start_row,
    columns: { ...DEFAULT_PO_ITEMS_MAPPING.columns }
  }

  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const value = raw as Record<string, unknown>
  const columns = value.columns && typeof value.columns === 'object'
    ? value.columns as Record<string, unknown>
    : {}

  const hasLegacyShape = 'order_date' in columns || 'notes' in columns
  if (hasLegacyShape) {
    return fallback
  }

  const normalizedColumns: POImportMappingConfig['columns'] = {
    customer_name: typeof columns.customer_name === 'string' ? columns.customer_name : fallback.columns.customer_name,
    po_number: typeof columns.po_number === 'string' ? columns.po_number : fallback.columns.po_number,
    style_code: typeof columns.style_code === 'string' ? columns.style_code : fallback.columns.style_code,
    week: typeof columns.week === 'string' ? columns.week : fallback.columns.week,
    description: typeof columns.description === 'string' ? columns.description : fallback.columns.description,
    finished_product_code:
      typeof columns.finished_product_code === 'string'
        ? columns.finished_product_code
        : fallback.columns.finished_product_code,
    quantity: typeof columns.quantity === 'string' ? columns.quantity : fallback.columns.quantity,
  }

  return {
    sheet_index: typeof value.sheet_index === 'number' ? value.sheet_index : fallback.sheet_index,
    header_row: typeof value.header_row === 'number' ? value.header_row : fallback.header_row,
    data_start_row: typeof value.data_start_row === 'number' ? value.data_start_row : fallback.data_start_row,
    columns: normalizedColumns
  }
}

const normalizeText = (value: string | null | undefined): string =>
  String(value || '').trim().toLowerCase()

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const normalized = String(value || '').trim()
  return normalized ? normalized : null
}

const normalizeTexNumber = (raw: string): string => {
  let val = String(raw || '').trim()
  val = val.replace(/^tex\s*/i, '')
  val = val.replace(/\s*\(.*\)\s*$/, '')
  val = val.trim()
  const num = parseFloat(val)
  return Number.isNaN(num) ? val : String(num)
}

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
        const key = `${t.supplier_id}-${normalizeTexNumber(String(t.tex_number))}`
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
  const texNormalized = normalizeTexNumber(texNumber)
  const metersPerCone = Number(row.meters_per_cone) || 0
  const unitPrice = row.unit_price == null ? null : Number(row.unit_price)
  const supplierItemCode = row.supplier_item_code ? String(row.supplier_item_code).trim() : undefined

  const errors: string[] = []
  if (!supplierName) errors.push('Thiếu tên NCC')
  if (!texNormalized) errors.push('Thiếu Tex')
  if (metersPerCone <= 0) errors.push('Mét/cuộn phải > 0')
  if (unitPrice == null || Number.isNaN(unitPrice)) errors.push('Thiếu đơn giá')
  else if (unitPrice < 0) errors.push('Giá không được âm')

  const supplierId = supplierCache.get(normalizeText(supplierName))
  const texCacheKey = supplierId ? `${supplierId}-${texNormalized}` : ''

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

      const texNorm = normalizeTexNumber(previewRow.tex_number)
      const texCacheKey = `${supplierId}-${texNorm}`
      let threadTypeId = threadTypeCache.get(texCacheKey)
      if (threadTypeId) {
        const updateFields: Record<string, unknown> = {
          meters_per_cone: previewRow.meters_per_cone,
        }
        if (previewRow.tex_number !== texNorm) {
          updateFields.tex_label = previewRow.tex_number
        }
        await supabase.from('thread_types').update(updateFields).eq('id', threadTypeId)
      } else {
        const texNumeric = parseFloat(texNorm) || 0
        const densityGramsPerMeter = texNumeric / 1000
        const uniqueCode = `T-${supplierId}-TEX${texNorm}`
        const { data: newThreadType, error: threadTypeError } = await supabase
          .from('thread_types')
          .insert({
            code: uniqueCode,
            name: `Chỉ TEX ${texNorm}`,
            tex_number: texNorm,
            tex_label: previewRow.tex_number,
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
            .eq('tex_number', texNorm)
            .eq('supplier_id', supplierId)
            .is('deleted_at', null)
            .limit(1)

          if (!existingTypes?.length) {
            skipRow(`Không thể tạo/tìm loại chỉ TEX ${texNorm}: ${threadTypeError?.message || 'Lỗi không xác định'}`)
            continue
          }

          threadTypeId = existingTypes[0].id
          const fallbackUpdateFields: Record<string, unknown> = {
            meters_per_cone: previewRow.meters_per_cone,
          }
          if (previewRow.tex_number !== texNorm) {
            fallbackUpdateFields.tex_label = previewRow.tex_number
          }
          await supabase.from('thread_types').update(fallbackUpdateFields).eq('id', threadTypeId)
        } else {
          threadTypeId = newThreadType.id
          thread_types_created++
        }

        threadTypeCache.set(texCacheKey, threadTypeId)
      }

      const supplierItemCode = previewRow.supplier_item_code || `${previewRow.supplier_name}-TEX${texNorm}`

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

importRouter.post('/supplier-colors/stream', requirePermission('thread.suppliers.manage'), async (c) => {
  const body = await c.req.json<ImportColorRequest>()

  if (!body.supplier_id) {
    return c.json<ImportApiResponse<null>>({ data: null, error: 'Thiếu supplier_id' }, 400)
  }

  if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
    return c.json<ImportApiResponse<null>>({ data: null, error: 'Không có dữ liệu' }, 400)
  }

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('id', body.supplier_id)
    .is('deleted_at', null)
    .single()

  if (!supplier) {
    return c.json<ImportApiResponse<null>>({ data: null, error: 'Không tìm thấy nhà cung cấp' }, 404)
  }

  return streamSSE(c, async (stream) => {
    let imported = 0
    let skipped = 0
    let colors_created = 0
    let aborted = false

    stream.onAbort(() => { aborted = true })

    try {
      await stream.writeSSE({ event: 'progress', data: JSON.stringify({
        phase: 'prepare', message: 'Đang chuẩn bị dữ liệu...', processed: 0, total: body.rows.length
      })})

      const colorCache = await fetchAllColors()

      const uniqueNewColors: string[] = []
      const seenNames = new Set<string>()

      for (const row of body.rows) {
        if (!row.color_name) continue
        const lower = row.color_name.toLowerCase()
        if (!colorCache.has(lower) && !seenNames.has(lower)) {
          uniqueNewColors.push(row.color_name)
          seenNames.add(lower)
        }
      }

      const totalNewColors = uniqueNewColors.length
      for (let i = 0; i < totalNewColors; i += CHUNK_SIZE) {
        if (aborted) break
        const chunk = uniqueNewColors.slice(i, i + CHUNK_SIZE)
        const { data: inserted } = await supabase
          .from('colors')
          .upsert(
            chunk.map(name => ({ name, hex_code: '#808080', is_active: true })),
            { onConflict: 'name', ignoreDuplicates: true }
          )
          .select('id, name')

        if (inserted) {
          for (const color of inserted) {
            colorCache.set(color.name.toLowerCase(), color.id)
          }
          colors_created += inserted.length
        }

        await stream.writeSSE({ event: 'progress', data: JSON.stringify({
          phase: 'colors',
          processed: Math.min(i + CHUNK_SIZE, totalNewColors),
          total: totalNewColors,
          colors_created
        })})
      }

      if (aborted) return

      if (uniqueNewColors.length > 0) {
        const freshCache = await fetchAllColors()
        for (const [k, v] of freshCache) {
          colorCache.set(k, v)
        }
      }

      const existingLinks = new Set<number>()
      let linkOffset = 0
      while (true) {
        const { data: links } = await supabase
          .from('color_supplier')
          .select('color_id')
          .eq('supplier_id', body.supplier_id)
          .range(linkOffset, linkOffset + 999)

        if (!links || links.length === 0) break
        for (const link of links) existingLinks.add(link.color_id)
        if (links.length < 1000) break
        linkOffset += 1000
      }

      const addedColorIds = new Set<number>()
      const newLinks: { color_id: number; supplier_id: number; is_active: boolean }[] = []
      for (const row of body.rows) {
        if (!row.color_name) {
          skipped++
          continue
        }
        const colorId = colorCache.get(row.color_name.toLowerCase())
        if (!colorId) {
          skipped++
          continue
        }
        if (existingLinks.has(colorId)) {
          skipped++
          continue
        }
        if (addedColorIds.has(colorId)) {
          skipped++
          continue
        }
        addedColorIds.add(colorId)
        newLinks.push({ color_id: colorId, supplier_id: body.supplier_id, is_active: true })
      }

      const totalLinks = newLinks.length
      for (let i = 0; i < totalLinks; i += CHUNK_SIZE) {
        if (aborted) break
        const chunk = newLinks.slice(i, i + CHUNK_SIZE)
        const { error: insertError } = await supabase
          .from('color_supplier')
          .insert(chunk)

        if (insertError) {
          console.error('Batch insert links error:', insertError)
        } else {
          imported += chunk.length
        }

        await stream.writeSSE({ event: 'progress', data: JSON.stringify({
          phase: 'links',
          processed: Math.min(i + CHUNK_SIZE, totalLinks),
          total: totalLinks,
          imported,
          skipped
        })})
      }

      if (totalLinks === 0) {
        skipped = body.rows.length
      }

      await stream.writeSSE({ event: 'done', data: JSON.stringify({
        imported, skipped, colors_created
      })})
    } catch (err) {
      console.error('Import supplier-colors stream error:', err)
      await stream.writeSSE({ event: 'error', data: JSON.stringify({
        message: err instanceof Error ? err.message : 'Lỗi hệ thống khi import'
      })})
    }
  })
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

  return normalizePOImportMappingConfig(setting?.value)
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
      .select('id, style_code, style_name, description')
      .is('deleted_at', null)

    const styleMap = new Map<string, { id: number; style_code: string; style_name: string; description: string | null }>()
    styles?.forEach(s => styleMap.set(s.style_code.toLowerCase(), s))

    const { data: existingPOs } = await supabase
      .from('purchase_orders')
      .select('id, po_number, customer_name, week')
      .is('deleted_at', null)

    const poMap = new Map<string, { id: number; customer_name: string | null; week: string | null }>()

    const { data: existingItems } = await supabase
      .from('po_items')
      .select('po_id, style_id, quantity, finished_product_code')
      .is('deleted_at', null)

    const itemMap = new Map<string, { quantity: number; finished_product_code: string | null }>()
    existingItems?.forEach(item => {
      const key = `${item.po_id}-${item.style_id}`
      itemMap.set(key, {
        quantity: item.quantity,
        finished_product_code: item.finished_product_code || null
      })
    })

    existingPOs?.forEach(po => {
      poMap.set(po.po_number.toLowerCase(), {
        id: po.id,
        customer_name: po.customer_name || null,
        week: po.week || null
      })
    })

    const poCustomerValues = new Map<string, Set<string>>()
    const poWeekValues = new Map<string, Set<string>>()
    const styleDescriptionValues = new Map<string, Set<string>>()
    const duplicateRowKeys = new Map<string, number>()

    for (const row of rows) {
      const poKey = normalizeText(row.po_number)
      const styleKey = normalizeText(row.style_code)
      const customerName = normalizeOptionalText(row.customer_name)
      const week = normalizeOptionalText(row.week)
      const description = normalizeOptionalText(row.description)

      if (poKey && customerName) {
        if (!poCustomerValues.has(poKey)) poCustomerValues.set(poKey, new Set())
        poCustomerValues.get(poKey)?.add(customerName.toLowerCase())
      }

      if (poKey && week) {
        if (!poWeekValues.has(poKey)) poWeekValues.set(poKey, new Set())
        poWeekValues.get(poKey)?.add(week.toLowerCase())
      }

      if (styleKey && description) {
        if (!styleDescriptionValues.has(styleKey)) styleDescriptionValues.set(styleKey, new Set())
        styleDescriptionValues.get(styleKey)?.add(description.toLowerCase())
      }

      if (poKey && styleKey) {
        const rowKey = `${poKey}::${styleKey}`
        duplicateRowKeys.set(rowKey, (duplicateRowKeys.get(rowKey) || 0) + 1)
      }
    }

    const validRows: POImportRow[] = []
    const errorRows: POImportErrorRow[] = []
    const newPOsSet = new Set<string>()
    let updateCount = 0
    let skipCount = 0

    for (const row of rows) {
      const customerName = normalizeOptionalText(row.customer_name)
      const poNumber = String(row.po_number || '').trim()
      const styleCode = String(row.style_code || '').trim()
      const week = normalizeOptionalText(row.week)
      const description = normalizeOptionalText(row.description)
      const finishedProductCode = normalizeOptionalText(row.finished_product_code)
      const quantity = Number(row.quantity) || 0

      const errors: string[] = []
      const poKey = poNumber.toLowerCase()
      const styleKey = styleCode.toLowerCase()
      const rowKey = `${poKey}::${styleKey}`

      if (!poNumber) errors.push('Thiếu số PO')
      if (!styleCode) errors.push('Thiếu mã hàng')
      if (finishedProductCode && finishedProductCode.length > 100) errors.push('Mã TP KT tối đa 100 ký tự')
      if (poKey && (poCustomerValues.get(poKey)?.size || 0) > 1) errors.push('PO có nhiều khách hàng khác nhau trong cùng file')
      if (poKey && (poWeekValues.get(poKey)?.size || 0) > 1) errors.push('PO có nhiều week khác nhau trong cùng file')
      if (styleKey && (styleDescriptionValues.get(styleKey)?.size || 0) > 1) errors.push('Mã hàng có nhiều mô tả khác nhau trong cùng file')
      if (poKey && styleKey && (duplicateRowKeys.get(rowKey) || 0) > 1) errors.push('Trùng dòng PO + mã hàng trong cùng file')

      const style = styleMap.get(styleKey)

      if (errors.length > 0) {
        errorRows.push({
          row_number: row.row_number,
          data: row,
          error_message: errors.join(', ')
        })
        continue
      }

      const po = poMap.get(poKey)
      let status: POImportRow['status']

      if (!style) {
        status = 'new_style'
      } else if (!po) {
        status = 'new'
        newPOsSet.add(poKey)
      } else {
        const itemKey = `${po.id}-${style.id}`
        const existingItem = itemMap.get(itemKey)
        const poChanged =
          (customerName !== null && customerName !== normalizeOptionalText(po.customer_name)) ||
          (week !== null && week !== normalizeOptionalText(po.week))
        const styleChanged =
          description !== null && description !== normalizeOptionalText(style.description)
        const itemChanged =
          existingItem !== undefined && (
            existingItem.quantity !== quantity ||
            (finishedProductCode !== null &&
              finishedProductCode !== normalizeOptionalText(existingItem.finished_product_code))
          )

        if (!existingItem) {
          status = 'new'
        } else if (poChanged || styleChanged || itemChanged) {
          status = 'update'
          updateCount++
        } else {
          status = 'skip'
          skipCount++
        }
      }

      if (!po) {
        newPOsSet.add(poKey)
      }

      validRows.push({
        row_number: row.row_number,
        customer_name: customerName || undefined,
        po_number: poNumber,
        style_code: styleCode,
        week: week || undefined,
        description: description || undefined,
        style_name: style?.style_name || styleCode,
        style_id: style?.id,
        finished_product_code: finishedProductCode || undefined,
        quantity,
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

    const { data: existingStyles } = await supabase
      .from('styles')
      .select('id, style_code, style_name, description')
      .is('deleted_at', null)

    const styleMap = new Map<string, { id: number; style_name: string; description: string | null }>()
    existingStyles?.forEach(style => {
      styleMap.set(style.style_code.toLowerCase(), {
        id: style.id,
        style_name: style.style_name,
        description: style.description || null
      })
    })

    const { data: existingPOs } = await supabase
      .from('purchase_orders')
      .select('id, po_number, customer_name, week')
      .is('deleted_at', null)

    const poMap = new Map<string, { id: number; customer_name: string | null; week: string | null }>()
    existingPOs?.forEach(po => {
      poMap.set(po.po_number.toLowerCase(), {
        id: po.id,
        customer_name: po.customer_name || null,
        week: po.week || null
      })
    })

    const { data: existingItems } = await supabase
      .from('po_items')
      .select('id, po_id, style_id, quantity, finished_product_code')
      .is('deleted_at', null)

    const itemMap = new Map<string, { id: number; quantity: number; finished_product_code: string | null }>()
    existingItems?.forEach(item => {
      itemMap.set(`${item.po_id}-${item.style_id}`, {
        id: item.id,
        quantity: item.quantity,
        finished_product_code: item.finished_product_code || null
      })
    })

    for (const row of rows) {
      if (row.status === 'skip') {
        skippedItems++
        continue
      }

      const styleKey = row.style_code.toLowerCase()
      const description = normalizeOptionalText(row.description)
      let styleEntry = row.style_id ? Array.from(styleMap.values()).find(style => style.id === row.style_id) : styleMap.get(styleKey)
      let styleId = row.style_id || styleEntry?.id

      if (!styleId) {
        const { data: newStyle, error: styleError } = await supabase
          .from('styles')
          .insert({
            style_code: row.style_code,
            style_name: row.style_code,
            description
          })
          .select('id, style_name, description')
          .single()

        if (styleError) {
          if (styleError.code === '23505') {
            const { data: existingStyle } = await supabase
              .from('styles')
              .select('id, style_name, description')
              .eq('style_code', row.style_code)
              .is('deleted_at', null)
              .single()
            styleId = existingStyle?.id
            if (existingStyle) {
              styleMap.set(styleKey, {
                id: existingStyle.id,
                style_name: existingStyle.style_name,
                description: existingStyle.description || null
              })
            }
          } else {
            console.error('Create style error:', styleError)
            failedItems++
            continue
          }
        } else {
          styleId = newStyle.id
          styleMap.set(styleKey, {
            id: newStyle.id,
            style_name: newStyle.style_name,
            description: newStyle.description || null
          })
        }
      }

      styleEntry = styleMap.get(styleKey)
      if (!styleId || !styleEntry) {
        failedItems++
        continue
      }

      row.style_id = styleId

      let rowUpdated = false

      if (description !== null && description !== normalizeOptionalText(styleEntry.description)) {
        const { error: styleUpdateError } = await supabase
          .from('styles')
          .update({
            description,
            updated_at: new Date().toISOString()
          })
          .eq('id', styleId)

        if (styleUpdateError) {
          console.error('Update style description error:', styleUpdateError)
          failedItems++
          continue
        }

        styleMap.set(styleKey, {
          ...styleEntry,
          description
        })
        rowUpdated = true
      }

      const poKey = row.po_number.toLowerCase()
      const customerName = normalizeOptionalText(row.customer_name)
      const week = normalizeOptionalText(row.week)
      let poEntry = poMap.get(poKey)

      if (!poEntry) {
        const { data: newPO, error: poError } = await supabase
          .from('purchase_orders')
          .insert({
            po_number: row.po_number,
            customer_name: customerName,
            week,
            status: 'PENDING'
          })
          .select('id, customer_name, week')
          .single()

        if (poError) {
          if (poError.code === '23505') {
            const { data: existingPO } = await supabase
              .from('purchase_orders')
              .select('id, customer_name, week')
              .eq('po_number', row.po_number)
              .is('deleted_at', null)
              .single()
            if (existingPO) {
              poEntry = {
                id: existingPO.id,
                customer_name: existingPO.customer_name || null,
                week: existingPO.week || null
              }
              poMap.set(poKey, poEntry)
            }
          } else {
            throw poError
          }
        } else {
          poEntry = {
            id: newPO.id,
            customer_name: newPO.customer_name || null,
            week: newPO.week || null
          }
          poMap.set(poKey, poEntry)
          createdPOs++
        }
      }

      if (!poEntry) {
        failedItems++
        continue
      }

      if (
        (customerName !== null && customerName !== normalizeOptionalText(poEntry.customer_name)) ||
        (week !== null && week !== normalizeOptionalText(poEntry.week))
      ) {
        const updates: Record<string, string> = {}
        if (customerName !== null && customerName !== normalizeOptionalText(poEntry.customer_name)) {
          updates.customer_name = customerName
        }
        if (week !== null && week !== normalizeOptionalText(poEntry.week)) {
          updates.week = week
        }
        updates.updated_at = new Date().toISOString()

        const { error: poUpdateError } = await supabase
          .from('purchase_orders')
          .update(updates)
          .eq('id', poEntry.id)

        if (poUpdateError) {
          console.error('Update purchase order metadata error:', poUpdateError)
          failedItems++
          continue
        }

        poEntry = {
          ...poEntry,
          customer_name: updates.customer_name ?? poEntry.customer_name,
          week: updates.week ?? poEntry.week
        }
        poMap.set(poKey, poEntry)
        rowUpdated = true
      }

      const itemKey = `${poEntry.id}-${styleId}`
      let existingItem = itemMap.get(itemKey)
      const finishedProductCode = normalizeOptionalText(row.finished_product_code)

      if (!existingItem) {
        const { data: newItem, error: insertError } = await supabase
          .from('po_items')
          .insert({
            po_id: poEntry.id,
            style_id: styleId,
            quantity: row.quantity,
            finished_product_code: finishedProductCode
          })
          .select('id, quantity, finished_product_code')
          .single()

        if (insertError) {
          if (insertError.code === '23505') {
            const { data: conflictedItem, error: conflictFetchError } = await supabase
              .from('po_items')
              .select('id, quantity, finished_product_code')
              .eq('po_id', poEntry.id)
              .eq('style_id', styleId)
              .is('deleted_at', null)
              .single()

            if (conflictFetchError || !conflictedItem) {
              console.error('Insert PO item conflict fetch error:', conflictFetchError || insertError)
              failedItems++
              continue
            }

            itemMap.set(itemKey, {
              id: conflictedItem.id,
              quantity: conflictedItem.quantity,
              finished_product_code: conflictedItem.finished_product_code || null
            })
            existingItem = itemMap.get(itemKey)
          } else {
            console.error('Insert PO item error:', insertError)
            failedItems++
            continue
          }
        } else {
          itemMap.set(itemKey, {
            id: newItem.id,
            quantity: newItem.quantity,
            finished_product_code: newItem.finished_product_code || null
          })

          await supabase.from('po_item_history').insert({
            po_item_id: newItem.id,
            change_type: 'CREATE',
            previous_quantity: null,
            new_quantity: row.quantity,
            changed_by: auth.employeeId,
            notes: 'Import từ Excel'
          })

          createdItems++
          continue
        }
      }

      const shouldUpdateItem =
        existingItem.quantity !== row.quantity ||
        (finishedProductCode !== null &&
          finishedProductCode !== normalizeOptionalText(existingItem.finished_product_code))

      if (shouldUpdateItem) {
        const { error: itemUpdateError } = await supabase
          .from('po_items')
          .update({
            quantity: row.quantity,
            finished_product_code:
              finishedProductCode !== null ? finishedProductCode : existingItem.finished_product_code,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)

        if (itemUpdateError) {
          console.error('Update PO item error:', itemUpdateError)
          failedItems++
          continue
        }

        await supabase.from('po_item_history').insert({
          po_item_id: existingItem.id,
          change_type: 'UPDATE',
          previous_quantity: existingItem.quantity,
          new_quantity: row.quantity,
          changed_by: auth.employeeId,
          notes: 'Import từ Excel'
        })

        itemMap.set(itemKey, {
          id: existingItem.id,
          quantity: row.quantity,
          finished_product_code:
            finishedProductCode !== null ? finishedProductCode : existingItem.finished_product_code
        })
        updatedItems++
      } else if (rowUpdated) {
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
      customer_name: 'Khách Hàng',
      po_number: 'Số PO',
      style_code: 'Mã hàng',
      week: 'Week',
      description: 'Mô tả',
      finished_product_code: 'Mã TP KT',
      quantity: 'Số lượng SP'
    }

    const exampleData: Record<string, string | number> = {
      customer_name: 'Công ty ABC',
      po_number: 'PO-2024-001',
      style_code: 'STYLE-001',
      week: 'W12-2026',
      description: 'Áo thun nữ cổ tròn',
      finished_product_code: 'TPKT-001',
      quantity: 1000
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
