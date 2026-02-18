import { Hono } from 'hono'
import { z } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import type { ThreadApiResponse } from '../types/thread'

const reconciliation = new Hono()

// ============ ZOD SCHEMAS ============

const reconciliationFiltersSchema = z.object({
  po_id: z.coerce.number().optional(),
  style_id: z.coerce.number().optional(),
  color_id: z.coerce.number().optional(),
  department: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

// ============ TYPES ============

interface ReconciliationRow {
  po_id: number | null
  po_number: string | null
  style_id: number | null
  style_code: string | null
  color_id: number | null
  color_name: string | null
  thread_type_id: number | null
  thread_name: string | null
  quota_meters: number
  total_issued_meters: number
  total_returned_meters: number
  consumed_meters: number
  consumption_percentage: number
  over_limit_count: number
}

interface ReconciliationSummary {
  total_quota: number
  total_issued: number
  total_returned: number
  total_consumed: number
  overall_consumption_percentage: number
  total_over_limit_count: number
}

interface ReconciliationData {
  filters: z.infer<typeof reconciliationFiltersSchema>
  summary: ReconciliationSummary
  rows: ReconciliationRow[]
  generated_at: string
}

interface OverQuotaItem {
  po_number: string | null
  style_code: string | null
  color_name: string | null
  thread_name: string | null
  quota_meters: number
  total_issued_meters: number
  consumed_meters: number
  consumption_percentage: number
}

// ============ HELPER FUNCTIONS ============

/**
 * Calculate summary totals from reconciliation rows
 */
function toNumber(value: unknown, fallback = 0): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Normalize rows from different reconciliation view versions.
 * Supports both:
 * - V1 (meter-based): quota_meters, total_issued_meters, total_returned_meters, consumed_meters, over_limit_count
 * - V2 (cone-based): quota_cones, issued_full/partial, returned_full/partial, consumed_equivalent_cones, is_over_quota
 */
function normalizeRow(raw: Record<string, unknown>): ReconciliationRow {
  const ratio = toNumber(raw.partial_cone_ratio, 0.3)

  const quota = raw.quota_meters !== undefined
    ? toNumber(raw.quota_meters)
    : toNumber(raw.quota_cones)

  const issued = raw.total_issued_meters !== undefined
    ? toNumber(raw.total_issued_meters)
    : toNumber(raw.issued_full) + toNumber(raw.issued_partial) * ratio

  const returned = raw.total_returned_meters !== undefined
    ? toNumber(raw.total_returned_meters)
    : toNumber(raw.returned_full) + toNumber(raw.returned_partial) * ratio

  const consumed = raw.consumed_meters !== undefined
    ? toNumber(raw.consumed_meters)
    : raw.consumed_equivalent_cones !== undefined
      ? toNumber(raw.consumed_equivalent_cones)
      : issued - returned

  const consumptionPercentage = raw.consumption_percentage !== undefined
    ? toNumber(raw.consumption_percentage)
    : quota > 0
      ? (consumed / quota) * 100
      : 0

  const overLimitCount = raw.over_limit_count !== undefined
    ? toNumber(raw.over_limit_count)
    : raw.is_over_quota
      ? 1
      : 0

  return {
    po_id: (raw.po_id as number | null) ?? null,
    po_number: (raw.po_number as string | null) ?? null,
    style_id: (raw.style_id as number | null) ?? null,
    style_code: (raw.style_code as string | null) ?? null,
    color_id: (raw.color_id as number | null) ?? null,
    color_name: (raw.color_name as string | null) ?? null,
    thread_type_id: (raw.thread_type_id as number | null) ?? null,
    thread_name: (raw.thread_name as string | null) ?? null,
    quota_meters: round2(quota),
    total_issued_meters: round2(issued),
    total_returned_meters: round2(returned),
    consumed_meters: round2(consumed),
    consumption_percentage: round2(consumptionPercentage),
    over_limit_count: Math.max(0, Math.floor(overLimitCount)),
  }
}

function calculateSummary(rows: ReconciliationRow[]): ReconciliationSummary {
  let totalQuota = 0
  let totalIssued = 0
  let totalReturned = 0
  let totalConsumed = 0
  let totalOverLimit = 0

  rows.forEach((row) => {
    totalQuota += Number(row.quota_meters) || 0
    totalIssued += Number(row.total_issued_meters) || 0
    totalReturned += Number(row.total_returned_meters) || 0
    totalConsumed += Number(row.consumed_meters) || 0
    totalOverLimit += Number(row.over_limit_count) || 0
  })

  const overallPercentage = totalQuota > 0
    ? Math.round((totalConsumed / totalQuota) * 10000) / 100
    : 0

  return {
    total_quota: round2(totalQuota),
    total_issued: round2(totalIssued),
    total_returned: round2(totalReturned),
    total_consumed: round2(totalConsumed),
    overall_consumption_percentage: overallPercentage,
    total_over_limit_count: totalOverLimit,
  }
}

/**
 * Create Excel workbook for reconciliation export
 */
async function createReconciliationExcel(
  rows: ReconciliationRow[],
  summary: ReconciliationSummary
): Promise<Buffer> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Đối chiếu tiêu hao')

  // Header row
  sheet.columns = [
    { header: 'PO', key: 'po_number', width: 15 },
    { header: 'Mã Hàng', key: 'style_code', width: 15 },
    { header: 'Màu', key: 'color_name', width: 15 },
    { header: 'Loại Chỉ', key: 'thread_name', width: 20 },
    { header: 'Định Mức (m)', key: 'quota_meters', width: 15 },
    { header: 'Đã Xuất (m)', key: 'total_issued_meters', width: 15 },
    { header: 'Đã Nhập (m)', key: 'total_returned_meters', width: 15 },
    { header: 'Tiêu Thụ (m)', key: 'consumed_meters', width: 15 },
    { header: 'Tỷ Lệ (%)', key: 'consumption_percentage', width: 12 },
    { header: 'Vượt ĐM', key: 'over_limit_count', width: 10 },
  ]

  // Style header row
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

  // Data rows
  rows.forEach((row) => {
    sheet.addRow({
      po_number: row.po_number || '',
      style_code: row.style_code || '',
      color_name: row.color_name || '',
      thread_name: row.thread_name || '',
      quota_meters: Number(row.quota_meters) || 0,
      total_issued_meters: Number(row.total_issued_meters) || 0,
      total_returned_meters: Number(row.total_returned_meters) || 0,
      consumed_meters: Number(row.consumed_meters) || 0,
      consumption_percentage: Number(row.consumption_percentage) || 0,
      over_limit_count: Number(row.over_limit_count) || 0,
    })
  })

  // Empty row before summary
  sheet.addRow({})

  // Summary row
    const summaryRow = sheet.addRow({
      po_number: 'TỔNG CỘNG',
      style_code: '',
      color_name: '',
      thread_name: `${rows.length} dòng`,
      quota_meters: summary.total_quota,
      total_issued_meters: summary.total_issued,
      total_returned_meters: summary.total_returned,
      consumed_meters: summary.total_consumed,
      consumption_percentage: summary.overall_consumption_percentage,
      over_limit_count: summary.total_over_limit_count,
    })
  summaryRow.font = { bold: true }
  summaryRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F5' },
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// ============ ROUTES ============

/**
 * GET /api/issues/reconciliation - Get reconciliation data
 * Query params: po_id, style_id, color_id, department, date_from, date_to
 */
reconciliation.get('/', async (c) => {
  try {
    // Parse query filters
    const queryParams = {
      po_id: c.req.query('po_id'),
      style_id: c.req.query('style_id'),
      color_id: c.req.query('color_id'),
      department: c.req.query('department'),
      date_from: c.req.query('date_from'),
      date_to: c.req.query('date_to'),
    }

    const filters = reconciliationFiltersSchema.parse(queryParams)

    // Build query from view
    let query = supabase
      .from('v_issue_reconciliation')
      .select('*')

    // Apply filters
    if (filters.po_id) {
      query = query.eq('po_id', filters.po_id)
    }
    if (filters.style_id) {
      query = query.eq('style_id', filters.style_id)
    }
    if (filters.color_id) {
      query = query.eq('color_id', filters.color_id)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error('Reconciliation query error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải dữ liệu đối chiếu',
      }, 500)
    }

    const reconciliationRows = (rows || []).map((row) =>
      normalizeRow(row as Record<string, unknown>)
    )
    const summary = calculateSummary(reconciliationRows)

    const result: ReconciliationData = {
      filters,
      summary,
      rows: reconciliationRows,
      generated_at: new Date().toISOString(),
    }

    return c.json<ThreadApiResponse<ReconciliationData>>({
      data: result,
      error: null,
      message: `Đã tải ${reconciliationRows.length} dòng đối chiếu`,
    })
  } catch (err) {
    console.error('Reconciliation error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống khi tải dữ liệu đối chiếu',
    }, 500)
  }
})

/**
 * GET /api/issues/reconciliation/export - Export to Excel
 * Query params: po_id, style_id, color_id, department, date_from, date_to
 */
reconciliation.get('/export', async (c) => {
  try {
    // Parse query filters
    const queryParams = {
      po_id: c.req.query('po_id'),
      style_id: c.req.query('style_id'),
      color_id: c.req.query('color_id'),
      department: c.req.query('department'),
      date_from: c.req.query('date_from'),
      date_to: c.req.query('date_to'),
    }

    const filters = reconciliationFiltersSchema.parse(queryParams)

    // Build query from view
    let query = supabase
      .from('v_issue_reconciliation')
      .select('*')

    // Apply filters
    if (filters.po_id) {
      query = query.eq('po_id', filters.po_id)
    }
    if (filters.style_id) {
      query = query.eq('style_id', filters.style_id)
    }
    if (filters.color_id) {
      query = query.eq('color_id', filters.color_id)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error('Reconciliation export query error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải dữ liệu xuất file',
      }, 500)
    }

    const reconciliationRows = (rows || []).map((row) =>
      normalizeRow(row as Record<string, unknown>)
    )

    if (reconciliationRows.length === 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không có dữ liệu để xuất',
      }, 400)
    }

    const summary = calculateSummary(reconciliationRows)

    // Create Excel file
    const buffer = await createReconciliationExcel(reconciliationRows, summary)

    // Generate filename with timestamp
    const today = new Date().toISOString().split('T')[0]
    const filename = `doi-chieu-tieu-hao-${today}.xlsx`

    // Return Excel file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Reconciliation export error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống khi xuất file',
    }, 500)
  }
})

/**
 * GET /api/issues/reconciliation/over-limit - Over limit summary
 * Returns list of items that exceeded quota with notes
 */
reconciliation.get('/over-limit', async (c) => {
  try {
    const { data: items, error } = await supabase
      .from('v_issue_reconciliation')
      .select('*')

    if (error) {
      console.error('Over limit query error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải dữ liệu vượt định mức',
      }, 500)
    }

    const overQuotaItems: OverQuotaItem[] = (items || [])
      .map((item) => normalizeRow(item as Record<string, unknown>))
      .filter((row) => row.over_limit_count > 0)
      .map((row) => ({
        po_number: row.po_number || null,
        style_code: row.style_code || null,
        color_name: row.color_name || null,
        thread_name: row.thread_name || null,
        quota_meters: row.quota_meters,
        total_issued_meters: row.total_issued_meters,
        consumed_meters: row.consumed_meters,
        consumption_percentage: row.consumption_percentage,
      }))

    return c.json<ThreadApiResponse<OverQuotaItem[]>>({
      data: overQuotaItems,
      error: null,
      message: `Tìm thấy ${overQuotaItems.length} mục vượt định mức`,
    })
  } catch (err) {
    console.error('Over limit error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống khi tải dữ liệu vượt định mức',
    }, 500)
  }
})

export default reconciliation
