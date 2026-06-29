import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import dotenv from 'dotenv'
import ExcelJS from 'exceljs'
import { Pool, types, type QueryResultRow } from 'pg'

const DATE_OID = 1082
const TIMESTAMP_OID = 1114
const TIMESTAMPTZ_OID = 1184
types.setTypeParser(DATE_OID, (val) => val)
types.setTypeParser(TIMESTAMP_OID, (val) => val)
types.setTypeParser(TIMESTAMPTZ_OID, (val) => val)

if (existsSync('.env')) {
  dotenv.config({ override: true })
}

type SummaryRow = QueryResultRow & {
  supplier_name: string | null
  tex_number: string | number | null
  tex_label: string | null
  color_name: string | null
  full_cones: string | number
  partial_cones: string | number
  partial_meters: string | number
  partial_weight_grams: string | number
}

type WarehouseSummaryRow = SummaryRow & {
  warehouse_id: number
  warehouse_name: string
}

type ExportRow = {
  supplierName: string
  tex: string
  colorName: string
  fullCones: number
  partialCones: number
  partialMeters: number
  partialWeightGrams: number
}

type WarehouseExport = {
  warehouseId: number
  warehouseName: string
  rows: ExportRow[]
}

const KD_STATUSES = ['RECEIVED', 'INSPECTED', 'AVAILABLE']

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatTex(texNumber: string | number | null, texLabel: string | null): string {
  const value = texLabel ?? texNumber
  if (value == null || value === '') return ''
  const text = String(value)
  return /^tex\s+/i.test(text) ? text : `Tex ${text}`
}

function timeString(): string {
  return new Date().toTimeString().slice(0, 8).replace(/:/g, '')
}

function getOutputPath(): string {
  const argIndex = process.argv.findIndex(arg => arg === '--out' || arg === '-o')
  const explicitPath = argIndex >= 0 ? process.argv[argIndex + 1] : undefined
  if (explicitPath) return path.resolve(explicitPath)

  const reportDir = path.resolve('reports')
  mkdirSync(reportDir, { recursive: true })

  const datedPath = path.join(reportDir, `ton-kho-chi-kha-dung-${todayString()}.xlsx`)
  if (!existsSync(datedPath)) return datedPath

  return path.join(reportDir, `ton-kho-chi-kha-dung-${todayString()}-${timeString()}.xlsx`)
}

function toSheetName(name: string): string {
  const sanitized = name.replace(/[\\/*?:[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  return (sanitized || 'Sheet').slice(0, 31)
}

function styleHeaderRow(worksheet: ExcelJS.Worksheet): void {
  const header = worksheet.getRow(1)
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  }
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.alignment = { vertical: 'middle', horizontal: 'center' }
}

function mapSummaryRow(row: SummaryRow): ExportRow {
  return {
    supplierName: row.supplier_name ?? 'Không rõ NCC',
    tex: formatTex(row.tex_number, row.tex_label),
    colorName: row.color_name ?? '',
    fullCones: toNumber(row.full_cones),
    partialCones: toNumber(row.partial_cones),
    partialMeters: toNumber(row.partial_meters),
    partialWeightGrams: toNumber(row.partial_weight_grams),
  }
}

async function loadRows(pool: Pool): Promise<ExportRow[]> {
  const { rows } = await pool.query<SummaryRow>(
    `
      WITH kd AS (
        SELECT *
        FROM fn_cone_summary_filtered($1::cone_status[], NULL, NULL, NULL, NULL, TRUE)
      )
      SELECT
        COALESCE(s.name, 'Không rõ NCC') AS supplier_name,
        kd.tex_number,
        tt.tex_label,
        kd.color_name,
        kd.full_cones,
        kd.partial_cones,
        kd.partial_meters,
        kd.partial_weight_grams
      FROM kd
      LEFT JOIN suppliers s ON s.id = kd.supplier_id
      LEFT JOIN thread_types tt ON tt.id = kd.thread_type_id
      WHERE kd.full_cones + kd.partial_cones > 0
      ORDER BY COALESCE(s.name, 'Không rõ NCC'), kd.tex_number, kd.color_name
    `,
    [KD_STATUSES],
  )

  return rows.map(mapSummaryRow)
}

async function loadWarehouseRows(pool: Pool): Promise<WarehouseExport[]> {
  const { rows } = await pool.query<WarehouseSummaryRow>(
    `
      WITH kd AS (
        SELECT
          ti.warehouse_id,
          ti.thread_type_id,
          tt.code AS thread_code,
          tt.name AS thread_name,
          ti.color_id,
          c.name AS color_name,
          c.hex_code AS color_hex,
          tt.material,
          tt.tex_number,
          tt.meters_per_cone,
          COALESCE(l.supplier_id, tt.supplier_id) AS supplier_id,
          COUNT(*) FILTER (
            WHERE NOT ti.is_partial
              AND ti.status <> 'RESERVED_FOR_ORDER'
              AND ti.reserved_week_id IS NULL
          ) AS full_cones,
          COUNT(*) FILTER (
            WHERE ti.is_partial
              AND ti.status <> 'RESERVED_FOR_ORDER'
              AND ti.reserved_week_id IS NULL
          ) AS partial_cones,
          COALESCE(SUM(ti.quantity_meters) FILTER (
            WHERE ti.is_partial
              AND ti.status <> 'RESERVED_FOR_ORDER'
              AND ti.reserved_week_id IS NULL
          ), 0) AS partial_meters,
          COALESCE(SUM(ti.weight_grams) FILTER (
            WHERE ti.is_partial
              AND ti.status <> 'RESERVED_FOR_ORDER'
              AND ti.reserved_week_id IS NULL
          ), 0) AS partial_weight_grams
        FROM thread_inventory ti
        JOIN thread_types tt ON tt.id = ti.thread_type_id
        LEFT JOIN colors c ON c.id = ti.color_id
        LEFT JOIN lots l ON l.id = ti.lot_id
        WHERE ti.status = ANY($1::cone_status[])
        GROUP BY ti.warehouse_id, ti.thread_type_id, tt.code, tt.name, ti.color_id, c.name, c.hex_code,
                 tt.material, tt.tex_number, tt.meters_per_cone, COALESCE(l.supplier_id, tt.supplier_id)
      )
      SELECT
        kd.warehouse_id,
        w.name AS warehouse_name,
        COALESCE(s.name, 'Không rõ NCC') AS supplier_name,
        kd.tex_number,
        tt.tex_label,
        kd.color_name,
        kd.full_cones,
        kd.partial_cones,
        kd.partial_meters,
        kd.partial_weight_grams
      FROM kd
      JOIN warehouses w ON w.id = kd.warehouse_id
      LEFT JOIN suppliers s ON s.id = kd.supplier_id
      LEFT JOIN thread_types tt ON tt.id = kd.thread_type_id
      WHERE kd.full_cones + kd.partial_cones > 0
        AND w.is_active = TRUE
        AND w.deleted_at IS NULL
      ORDER BY w.name, COALESCE(s.name, 'Không rõ NCC'), kd.tex_number, kd.color_name
    `,
    [KD_STATUSES],
  )

  const grouped = new Map<number, WarehouseExport>()
  for (const row of rows) {
    if (!grouped.has(row.warehouse_id)) {
      grouped.set(row.warehouse_id, {
        warehouseId: row.warehouse_id,
        warehouseName: row.warehouse_name,
        rows: [],
      })
    }
    grouped.get(row.warehouse_id)!.rows.push(mapSummaryRow(row))
  }

  return [...grouped.values()].sort((a, b) => a.warehouseName.localeCompare(b.warehouseName, 'vi'))
}

function addInventorySheet(workbook: ExcelJS.Workbook, sheetName: string, rows: ExportRow[]): void {
  const worksheet = workbook.addWorksheet(toSheetName(sheetName))
  worksheet.columns = [
    { header: 'Nhà cung cấp', key: 'supplierName', width: 28 },
    { header: 'Tex', key: 'tex', width: 14 },
    { header: 'Màu', key: 'colorName', width: 18 },
    { header: 'Cuộn nguyên KD', key: 'fullCones', width: 16 },
    { header: 'Cuộn lẻ KD', key: 'partialCones', width: 14 },
    { header: 'Mét lẻ KD', key: 'partialMeters', width: 16 },
    { header: 'Gram lẻ KD', key: 'partialWeightGrams', width: 16 },
  ]

  styleHeaderRow(worksheet)

  for (const row of rows) {
    worksheet.addRow(row)
  }

  const totalRow = worksheet.addRow({
    supplierName: 'TỔNG',
    tex: '',
    colorName: '',
    fullCones: rows.reduce((sum, row) => sum + row.fullCones, 0),
    partialCones: rows.reduce((sum, row) => sum + row.partialCones, 0),
    partialMeters: rows.reduce((sum, row) => sum + row.partialMeters, 0),
    partialWeightGrams: rows.reduce((sum, row) => sum + row.partialWeightGrams, 0),
  })
  totalRow.font = { bold: true }

  worksheet.getColumn('fullCones').numFmt = '#,##0'
  worksheet.getColumn('partialCones').numFmt = '#,##0'
  worksheet.getColumn('partialMeters').numFmt = '#,##0.##'
  worksheet.getColumn('partialWeightGrams').numFmt = '#,##0.##'
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: 'A1',
    to: `G${Math.max(rows.length + 1, 1)}`,
  }
}

async function writeWorkbook(summaryRows: ExportRow[], warehouseExports: WarehouseExport[], outputPath: string): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Datchi'
  workbook.created = new Date()

  addInventorySheet(workbook, 'Tổng kho tổng hợp', summaryRows)
  for (const warehouseExport of warehouseExports) {
    addInventorySheet(workbook, warehouseExport.warehouseName, warehouseExport.rows)
  }

  mkdirSync(path.dirname(outputPath), { recursive: true })
  await workbook.xlsx.writeFile(outputPath)
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Please configure .env before exporting.')
  }

  const pool = new Pool({ connectionString })
  try {
    const [summaryRows, warehouseExports] = await Promise.all([
      loadRows(pool),
      loadWarehouseRows(pool),
    ])
    if (summaryRows.length === 0) {
      console.log('Không có tồn kho khả dụng KD > 0 để xuất.')
      return
    }

    const outputPath = getOutputPath()
    await writeWorkbook(summaryRows, warehouseExports, outputPath)
    console.log(`Đã xuất ${summaryRows.length} dòng tổng hợp và ${warehouseExports.length} sheet kho: ${outputPath}`)
  } finally {
    await pool.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
