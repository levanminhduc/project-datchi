import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { query, queryOne } from '../db/query'
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
import { POImportParseRequestSchema, POImportExecuteRequestSchema } from '../validation/purchaseOrder'
import type { AppEnv } from '../types/hono-env'

const importRouter = new Hono<AppEnv>()

const CHUNK_SIZE = 500

async function fetchAllColors() {
  const colorMap = new Map<string, number>()
  let offset = 0
  const batchSize = 1000

  while (true) {
    const data = await query<{ id: number; name: string }>(
      'SELECT id, name FROM colors LIMIT $1 OFFSET $2',
      [batchSize, offset]
    )

    if (!data || data.length === 0) break

    for (const color of data) {
      colorMap.set(color.name.toLowerCase(), color.id)
    }

    if (data.length < batchSize) break
    offset += batchSize
  }

  return colorMap
}

const getPgError = (err: unknown): { code?: string; message?: string } => {
  if (err && typeof err === 'object') {
    return err as { code?: string; message?: string }
  }
  return {}
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
  if (val.includes('/')) return val
  const num = parseFloat(val)
  return Number.isNaN(num) ? val : String(num)
}

const getMappingConfig = async (key: string, fallback: ImportMappingConfig): Promise<ImportMappingConfig> => {
  const setting = await queryOne<{ value: ImportMappingConfig }>(
    'SELECT value FROM system_settings WHERE key = $1',
    [key]
  )

  return setting?.value || fallback
}

const buildSupplierAndTexCaches = async () => {
  const supplierCache = new Map<string, number>()
  const threadTypeCache = new Map<string, number>()

  const existingSuppliers = await query<{ id: number; name: string }>(
    'SELECT id, name FROM suppliers WHERE deleted_at IS NULL'
  )

  if (existingSuppliers) {
    for (const s of existingSuppliers) {
      supplierCache.set(normalizeText(s.name), s.id)
    }
  }

  const existingThreadTypes = await query<{ id: number; tex_number: string | number | null; supplier_id: number | null }>(
    'SELECT id, tex_number, supplier_id FROM thread_types WHERE tex_number IS NOT NULL AND deleted_at IS NULL'
  )

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
        let newSupplier: { id: number } | null = null
        let supplierError: { code?: string; message?: string } | null = null
        try {
          newSupplier = await queryOne<{ id: number }>(
            `INSERT INTO suppliers (code, name, is_active, lead_time_days)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [code.toUpperCase(), previewRow.supplier_name, true, 7]
          )
        } catch (err) {
          supplierError = getPgError(err)
        }

        if (supplierError || !newSupplier) {
          skipRow(`Không thể tạo NCC: ${supplierError?.message || 'Lỗi không xác định'}`)
          continue
        }

        supplierId = newSupplier.id
        supplierCache.set(normalizeText(previewRow.supplier_name), supplierId!)
        suppliers_created++
      }

      const texNorm = normalizeTexNumber(previewRow.tex_number)
      const texCacheKey = `${supplierId}-${texNorm}`
      let threadTypeId = threadTypeCache.get(texCacheKey)
      if (threadTypeId) {
        const setParts = ['meters_per_cone = $1']
        const updateParams: unknown[] = [previewRow.meters_per_cone]
        if (previewRow.tex_number !== texNorm) {
          updateParams.push(previewRow.tex_number)
          setParts.push(`tex_label = $${updateParams.length}`)
        }
        updateParams.push(threadTypeId)
        try {
          await query(
            `UPDATE thread_types SET ${setParts.join(', ')} WHERE id = $${updateParams.length}`,
            updateParams
          )
        } catch (err) {
          console.warn('Update thread_types meta error (ignored):', getPgError(err).message)
        }
      } else {
        const texNumeric = parseFloat(texNorm) || 0
        const densityGramsPerMeter = texNumeric / 1000
        const uniqueCode = `T-${supplierId}-TEX${texNorm}`
        let newThreadType: { id: number } | null = null
        let threadTypeError: { code?: string; message?: string } | null = null
        try {
          newThreadType = await queryOne<{ id: number }>(
            `INSERT INTO thread_types
               (code, name, tex_number, tex_label, density_grams_per_meter, meters_per_cone, supplier_id, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
              uniqueCode,
              `Chỉ TEX ${texNorm}`,
              texNorm,
              previewRow.tex_number,
              densityGramsPerMeter,
              previewRow.meters_per_cone,
              supplierId,
              true
            ]
          )
        } catch (err) {
          threadTypeError = getPgError(err)
        }

        if (threadTypeError || !newThreadType) {
          const existingTypes = await query<{ id: number }>(
            `SELECT id FROM thread_types
             WHERE tex_number = $1 AND supplier_id = $2 AND deleted_at IS NULL
             LIMIT 1`,
            [texNorm, supplierId]
          )

          if (!existingTypes?.length) {
            skipRow(`Không thể tạo/tìm loại chỉ TEX ${texNorm}: ${threadTypeError?.message || 'Lỗi không xác định'}`)
            continue
          }

          threadTypeId = existingTypes[0].id
          const fallbackSetParts = ['meters_per_cone = $1']
          const fallbackParams: unknown[] = [previewRow.meters_per_cone]
          if (previewRow.tex_number !== texNorm) {
            fallbackParams.push(previewRow.tex_number)
            fallbackSetParts.push(`tex_label = $${fallbackParams.length}`)
          }
          fallbackParams.push(threadTypeId)
          try {
            await query(
              `UPDATE thread_types SET ${fallbackSetParts.join(', ')} WHERE id = $${fallbackParams.length}`,
              fallbackParams
            )
          } catch (err) {
            console.warn('Update thread_types meta (fallback) error (ignored):', getPgError(err).message)
          }
        } else {
          threadTypeId = newThreadType.id
          thread_types_created++
        }

        threadTypeCache.set(texCacheKey, threadTypeId!)
      }

      const supplierItemCode = previewRow.supplier_item_code || `${previewRow.supplier_name}-TEX${texNorm}`

      const existingLinks = await query<{ id: number }>(
        `SELECT id FROM thread_type_supplier
         WHERE thread_type_id = $1 AND supplier_id = $2
         LIMIT 1`,
        [threadTypeId, supplierId]
      )

      const existingLink = existingLinks?.[0]
      if (existingLink) {
        let updateError: { code?: string; message?: string } | null = null
        try {
          await query(
            `UPDATE thread_type_supplier
             SET unit_price = $1, meters_per_cone = $2, supplier_item_code = $3, is_active = $4
             WHERE id = $5`,
            [previewRow.unit_price, previewRow.meters_per_cone, supplierItemCode, true, existingLink.id]
          )
        } catch (err) {
          updateError = getPgError(err)
        }

        if (updateError) {
          if (isSupplierItemCodeConflict(updateError)) {
            const suffixedCode = `${supplierItemCode}-${threadTypeId}`
            let retryUpdateError: { code?: string; message?: string } | null = null
            try {
              await query(
                `UPDATE thread_type_supplier
                 SET unit_price = $1, meters_per_cone = $2, supplier_item_code = $3, is_active = $4
                 WHERE id = $5`,
                [previewRow.unit_price, previewRow.meters_per_cone, suffixedCode, true, existingLink.id]
              )
            } catch (err) {
              retryUpdateError = getPgError(err)
            }

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
        let insertError: { code?: string; message?: string } | null = null
        try {
          await query(
            `INSERT INTO thread_type_supplier
               (thread_type_id, supplier_id, supplier_item_code, unit_price, meters_per_cone, is_active)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [threadTypeId, supplierId, supplierItemCode, previewRow.unit_price, previewRow.meters_per_cone, true]
          )
        } catch (err) {
          insertError = getPgError(err)
        }

        if (insertError) {
          if (isSupplierItemCodeConflict(insertError)) {
            const suffixedCode = `${supplierItemCode}-${threadTypeId}`
            let retryError: { code?: string; message?: string } | null = null
            try {
              await query(
                `INSERT INTO thread_type_supplier
                   (thread_type_id, supplier_id, supplier_item_code, unit_price, meters_per_cone, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [threadTypeId, supplierId, suffixedCode, previewRow.unit_price, previewRow.meters_per_cone, true]
              )
            } catch (err) {
              retryError = getPgError(err)
            }

            if (retryError) {
              skipRow(`Không thể tạo liên kết NCC-Tex: ${retryError.message}`)
              continue
            }
          } else if (insertError.code === '23505') {
            const raceLink = await queryOne<{ id: number }>(
              `SELECT id FROM thread_type_supplier
               WHERE thread_type_id = $1 AND supplier_id = $2`,
              [threadTypeId, supplierId]
            )

            if (raceLink) {
              let raceUpdateError: { code?: string; message?: string } | null = null
              try {
                await query(
                  `UPDATE thread_type_supplier
                   SET unit_price = $1, meters_per_cone = $2, supplier_item_code = $3, is_active = $4
                   WHERE id = $5`,
                  [previewRow.unit_price, previewRow.meters_per_cone, supplierItemCode, true, raceLink.id]
                )
              } catch (err) {
                raceUpdateError = getPgError(err)
              }

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

  const supplier = await queryOne<{ id: number }>(
    'SELECT id FROM suppliers WHERE id = $1 AND deleted_at IS NULL',
    [body.supplier_id]
  )

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
        const insertParams: unknown[] = []
        const valueGroups = chunk.map((name) => {
          insertParams.push(name, '#808080', true)
          const base = insertParams.length
          return `($${base - 2}, $${base - 1}, $${base})`
        })
        const inserted = await query<{ id: number; name: string }>(
          `INSERT INTO colors (name, hex_code, is_active)
           VALUES ${valueGroups.join(', ')}
           ON CONFLICT (name) DO NOTHING
           RETURNING id, name`,
          insertParams
        )

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
        const links = await query<{ color_id: number }>(
          `SELECT color_id FROM color_supplier
           WHERE supplier_id = $1
           LIMIT 1000 OFFSET $2`,
          [body.supplier_id, linkOffset]
        )

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
        const insertParams: unknown[] = []
        const valueGroups = chunk.map((link) => {
          insertParams.push(link.color_id, link.supplier_id, link.is_active)
          const base = insertParams.length
          return `($${base - 2}, $${base - 1}, $${base})`
        })
        let insertError: { code?: string; message?: string } | null = null
        try {
          await query(
            `INSERT INTO color_supplier (color_id, supplier_id, is_active)
             VALUES ${valueGroups.join(', ')}`,
            insertParams
          )
        } catch (err) {
          insertError = getPgError(err)
        }

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

    const supplier = await queryOne<{ id: number }>(
      'SELECT id FROM suppliers WHERE id = $1 AND deleted_at IS NULL',
      [body.supplier_id]
    )

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

    const existingColors = await query<{ id: number; name: string }>(
      'SELECT id, name FROM colors'
    )

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
        let newColor: { id: number } | null = null
        let colorError: { code?: string; message?: string } | null = null
        try {
          newColor = await queryOne<{ id: number }>(
            `INSERT INTO colors (name, hex_code, is_active)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [row.color_name, '#808080', true]
          )
        } catch (err) {
          colorError = getPgError(err)
        }

        if (colorError || !newColor) {
          skipped++
          continue
        }

        colorId = newColor.id
        colorCache.set(row.color_name.toLowerCase(), colorId!)
        colors_created++
      }

      const existingLink = await queryOne<{ id: number }>(
        'SELECT id FROM color_supplier WHERE color_id = $1 AND supplier_id = $2',
        [colorId, body.supplier_id]
      )

      if (existingLink) {
        skipped++
        continue
      }

      let linkError: { code?: string; message?: string } | null = null
      try {
        await query(
          `INSERT INTO color_supplier (color_id, supplier_id, is_active)
           VALUES ($1, $2, $3)`,
          [colorId, body.supplier_id, true]
        )
      } catch (err) {
        linkError = getPgError(err)
      }

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
  const setting = await queryOne<{ value: unknown }>(
    "SELECT value FROM system_settings WHERE key = 'import_po_items_mapping'"
  )

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

    const styles = await query<{ id: number; style_code: string; style_name: string; description: string | null }>(
      'SELECT id, style_code, style_name, description FROM styles WHERE deleted_at IS NULL'
    )

    const styleMap = new Map<string, { id: number; style_code: string; style_name: string; description: string | null }>()
    styles?.forEach(s => styleMap.set(s.style_code.toLowerCase(), s))

    const existingPOs = await query<{ id: number; po_number: string; customer_name: string | null; week: string | null }>(
      'SELECT id, po_number, customer_name, week FROM purchase_orders WHERE deleted_at IS NULL'
    )

    const poMap = new Map<string, { id: number; customer_name: string | null; week: string | null }>()

    const existingItems = await query<{ po_id: number; style_id: number; quantity: number; finished_product_code: string | null }>(
      'SELECT po_id, style_id, quantity, finished_product_code FROM po_items WHERE deleted_at IS NULL'
    )

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
    const duplicatePOsSet = new Set<string>()

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
      const isNewStyle = !style

      if (po) {
        status = 'duplicate'
        duplicatePOsSet.add(poKey)
      } else {
        status = 'new_po'
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
        status,
        is_new_style: isNewStyle || undefined,
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
        duplicate_pos: duplicatePOsSet.size,
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
    const auth = c.get('auth')

    let createdPOs = 0
    let createdItems = 0
    let skippedItems = 0
    let failedItems = 0

    const existingStyles = await query<{ id: number; style_code: string; style_name: string; description: string | null }>(
      'SELECT id, style_code, style_name, description FROM styles WHERE deleted_at IS NULL'
    )

    const styleMap = new Map<string, { id: number; style_name: string; description: string | null }>()
    existingStyles?.forEach(style => {
      styleMap.set(style.style_code.toLowerCase(), {
        id: style.id,
        style_name: style.style_name,
        description: style.description || null
      })
    })

    const poMap = new Map<string, { id: number }>()

    for (const row of rows) {
      if (row.status === 'duplicate') {
        skippedItems++
        continue
      }

      const styleKey = row.style_code.toLowerCase()
      const description = normalizeOptionalText(row.description)
      let styleEntry = row.style_id ? Array.from(styleMap.values()).find(style => style.id === row.style_id) : styleMap.get(styleKey)
      let styleId = row.style_id || styleEntry?.id

      if (!styleId) {
        let newStyle: { id: number; style_name: string; description: string | null } | null = null
        let styleError: { code?: string; message?: string } | null = null
        try {
          newStyle = await queryOne<{ id: number; style_name: string; description: string | null }>(
            `INSERT INTO styles (style_code, style_name, description)
             VALUES ($1, $2, $3)
             RETURNING id, style_name, description`,
            [row.style_code, row.style_code, description]
          )
        } catch (err) {
          styleError = getPgError(err)
        }

        if (styleError) {
          if (styleError.code === '23505') {
            const existingStyle = await queryOne<{ id: number; style_name: string; description: string | null }>(
              `SELECT id, style_name, description FROM styles
               WHERE style_code = $1 AND deleted_at IS NULL`,
              [row.style_code]
            )
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
        } else if (newStyle) {
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

      if (description !== null && description !== normalizeOptionalText(styleEntry.description)) {
        try {
          await query(
            'UPDATE styles SET description = $1, updated_at = $2 WHERE id = $3',
            [description, new Date().toISOString(), styleId]
          )
        } catch (err) {
          console.warn('Update style description error (ignored):', getPgError(err).message)
        }

        styleMap.set(styleKey, { ...styleEntry, description })
      }

      const poKey = row.po_number.toLowerCase()
      const customerName = normalizeOptionalText(row.customer_name)
      const week = normalizeOptionalText(row.week)
      let poEntry = poMap.get(poKey)

      if (!poEntry) {
        let newPO: { id: number } | null = null
        let poError: { code?: string; message?: string } | null = null
        let poThrown: unknown = null
        try {
          newPO = await queryOne<{ id: number }>(
            `INSERT INTO purchase_orders (po_number, customer_name, week, status)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [row.po_number, customerName, week, 'PENDING']
          )
        } catch (err) {
          poError = getPgError(err)
          poThrown = err
        }

        if (poError) {
          if (poError.code === '23505') {
            const existingPO = await queryOne<{ id: number }>(
              `SELECT id FROM purchase_orders
               WHERE po_number = $1 AND deleted_at IS NULL`,
              [row.po_number]
            )
            if (existingPO) {
              poEntry = { id: existingPO.id }
              poMap.set(poKey, poEntry)
            }
          } else {
            throw poThrown
          }
        } else if (newPO) {
          poEntry = { id: newPO.id }
          poMap.set(poKey, poEntry)
          createdPOs++
        }
      }

      if (!poEntry) {
        failedItems++
        continue
      }

      const finishedProductCode = normalizeOptionalText(row.finished_product_code)
      let newItem: { id: number } | null = null
      let insertError: { code?: string; message?: string } | null = null
      try {
        newItem = await queryOne<{ id: number }>(
          `INSERT INTO po_items (po_id, style_id, quantity, finished_product_code)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [poEntry.id, styleId, row.quantity, finishedProductCode]
        )
      } catch (err) {
        insertError = getPgError(err)
      }

      if (insertError || !newItem) {
        if (insertError?.code === '23505') {
          skippedItems++
        } else {
          console.error('Insert PO item error:', insertError)
          failedItems++
        }
        continue
      }

      try {
        await query(
          `INSERT INTO po_item_history
             (po_item_id, change_type, previous_quantity, new_quantity, changed_by, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newItem.id, 'CREATE', null, row.quantity, auth.employeeId, 'Import từ Excel']
        )
      } catch (err) {
        console.warn('Insert po_item_history error (ignored):', getPgError(err).message)
      }

      createdItems++
    }

    const result: POImportResult = {
      created_pos: createdPOs,
      created_items: createdItems,
      updated_items: 0,
      skipped_items: skippedItems,
      failed_items: failedItems
    }

    return c.json<ImportApiResponse<POImportResult>>({
      data: result,
      error: null,
      message: `Import thành công: ${createdPOs} PO mới, ${createdItems} mặt hàng mới, ${skippedItems} bỏ qua`
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
