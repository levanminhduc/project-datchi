import type {
  IssueExportHistoryMeta,
  IssueExportHistoryRow,
} from '@/types/thread/issueExportHistory'

type Workbook = import('exceljs').Workbook
type Worksheet = import('exceljs').Worksheet

const SHEET_NAME = 'Lich su xuat chi'
const TABLE_HEADER_ROW = 12

const SUMMARY_HEADERS = ['STT', 'NCC', 'Tex', 'Số cuộn']
const DETAILED_HEADERS = [
  'STT',
  'Bộ Phận',
  'Mã hàng',
  'NCC',
  'Tex',
  'Số cuộn',
]

function thinBorder() {
  return {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  }
}

function formatISODate(value: string): string {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_').trim() || 'Lich-su-xuat-chi.xlsx'
}

function renderMerged(
  ws: Worksheet,
  range: string,
  value: string,
  options: {
    bold?: boolean
    italic?: boolean
    size?: number
    align?: 'left' | 'center' | 'right'
  } = {},
) {
  ws.mergeCells(range)
  const cell = ws.getCell(range.split(':')[0] || range)
  cell.value = value
  cell.font = {
    bold: options.bold,
    italic: options.italic,
    size: options.size,
  }
  cell.alignment = {
    horizontal: options.align || 'center',
    vertical: 'middle',
  }
}

function renderDocHeader(
  ws: Worksheet,
  meta: IssueExportHistoryMeta,
  lastCol: string,
) {
  renderMerged(ws, `A1:${lastCol}1`, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
    bold: true,
    size: 12,
  })
  renderMerged(ws, `A2:${lastCol}2`, 'Độc lập – Tự do – Hạnh phúc', {
    italic: true,
    size: 11,
  })
  renderMerged(ws, `A4:${lastCol}4`, 'TỔNG CÔNG TY CỔ PHẦN DỆT MAY HÒA THỌ', {
    bold: true,
    size: 12,
  })
  renderMerged(ws, `A5:${lastCol}5`, 'CÔNG TY MAY HÒA THỌ ĐIỆN BÀN', {
    bold: true,
    size: 12,
  })
  renderMerged(ws, `A7:${lastCol}7`, 'TỔNG HỢP XUẤT KHO CHỈ MAY', {
    bold: true,
    size: 16,
  })
  renderMerged(ws, `A8:${lastCol}8`, `Số: ${meta.report_number}`, {
    italic: true,
    size: 11,
  })
  renderMerged(
    ws,
    `A9:${lastCol}9`,
    `Từ ngày: ${formatISODate(meta.from_date)}   Đến ngày: ${formatISODate(meta.to_date)}`,
    { size: 11 },
  )
  renderMerged(ws, `A10:${lastCol}10`, `Kho: ${meta.warehouse_name}`, {
    size: 11,
  })
}

function renderTableHeader(ws: Worksheet, headers: string[]) {
  const row = ws.getRow(TABLE_HEADER_ROW)

  headers.forEach((header, index) => {
    const cell = row.getCell(index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder()
  })

  row.commit()
}

function renderSummaryRows(
  ws: Worksheet,
  rows: IssueExportHistoryRow[],
): { totalRow: number; total: number } {
  let total = 0

  rows.forEach((item, index) => {
    const row = ws.getRow(TABLE_HEADER_ROW + 1 + index)

    row.getCell(1).value = index + 1
    row.getCell(1).alignment = { horizontal: 'center' }

    row.getCell(2).value = item.supplier_name
    row.getCell(2).alignment = { horizontal: 'left' }

    row.getCell(3).value = item.tex_label || item.tex_number || '-'
    row.getCell(3).alignment = { horizontal: 'center' }

    row.getCell(4).value = item.total_full_cones
    row.getCell(4).alignment = { horizontal: 'right' }
    row.getCell(4).numFmt = '#,##0'

    for (let col = 1; col <= 4; col++) {
      row.getCell(col).border = thinBorder()
    }

    total += item.total_full_cones
    row.commit()
  })

  const totalRow = TABLE_HEADER_ROW + rows.length + 1
  ws.mergeCells(`A${totalRow}:C${totalRow}`)

  const labelCell = ws.getCell(`A${totalRow}`)
  labelCell.value = 'TỔNG CỘNG'
  labelCell.font = { bold: true }
  labelCell.alignment = { horizontal: 'right', vertical: 'middle' }

  for (let col = 1; col <= 4; col++) {
    ws.getRow(totalRow).getCell(col).border = thinBorder()
  }

  const valueCell = ws.getCell(`D${totalRow}`)
  valueCell.value = total
  valueCell.font = { bold: true }
  valueCell.alignment = { horizontal: 'right' }
  valueCell.numFmt = '#,##0'

  return { totalRow, total }
}

function renderDetailedRows(
  ws: Worksheet,
  rows: IssueExportHistoryRow[],
): { totalRow: number; total: number } {
  let total = 0
  let prevDepartment: string | null = null

  rows.forEach((item, index) => {
    const row = ws.getRow(TABLE_HEADER_ROW + 1 + index)

    row.getCell(1).value = index + 1
    row.getCell(1).alignment = { horizontal: 'center' }

    const department = item.department ?? ''
    row.getCell(2).value = department === prevDepartment ? '' : department
    row.getCell(2).alignment = { horizontal: 'left' }
    prevDepartment = department

    row.getCell(3).value = item.style_code ?? ''
    row.getCell(3).alignment = { horizontal: 'left' }

    row.getCell(4).value = item.supplier_name
    row.getCell(4).alignment = { horizontal: 'left' }

    row.getCell(5).value = item.tex_label || item.tex_number || '-'
    row.getCell(5).alignment = { horizontal: 'center' }

    row.getCell(6).value = item.total_full_cones
    row.getCell(6).alignment = { horizontal: 'right' }
    row.getCell(6).numFmt = '#,##0'

    for (let col = 1; col <= 6; col++) {
      row.getCell(col).border = thinBorder()
    }

    total += item.total_full_cones
    row.commit()
  })

  const totalRow = TABLE_HEADER_ROW + rows.length + 1
  ws.mergeCells(`A${totalRow}:E${totalRow}`)

  const labelCell = ws.getCell(`A${totalRow}`)
  labelCell.value = 'TỔNG CỘNG'
  labelCell.font = { bold: true }
  labelCell.alignment = { horizontal: 'right', vertical: 'middle' }

  for (let col = 1; col <= 6; col++) {
    ws.getRow(totalRow).getCell(col).border = thinBorder()
  }

  const valueCell = ws.getCell(`F${totalRow}`)
  valueCell.value = total
  valueCell.font = { bold: true }
  valueCell.alignment = { horizontal: 'right' }
  valueCell.numFmt = '#,##0'

  return { totalRow, total }
}

function renderSignatures(ws: Worksheet, startRow: number, fullName: string) {
  const titleRow = startRow + 3
  const subtitleRow = titleRow + 1
  const nameRow = subtitleRow + 4

  renderMerged(ws, `A${titleRow}:B${titleRow}`, 'Quản Lý Kho', {
    bold: true,
    size: 11,
  })
  renderMerged(ws, `C${titleRow}:D${titleRow}`, 'Kế Toán', {
    bold: true,
    size: 11,
  })
  renderMerged(ws, `A${subtitleRow}:B${subtitleRow}`, '(Ký, ghi rõ họ tên)', {
    italic: true,
    size: 9,
  })
  renderMerged(ws, `C${subtitleRow}:D${subtitleRow}`, '(Ký, ghi rõ họ tên)', {
    italic: true,
    size: 9,
  })
  renderMerged(ws, `A${nameRow}:B${nameRow}`, fullName, {
    bold: true,
    size: 11,
  })
}

interface ColumnWidthConfig {
  /** Extract the display string for this column from a data row. */
  extract: (item: IssueExportHistoryRow, index: number) => string
  /** Minimum width so narrow columns stay readable. */
  minWidth: number
  /** Per-column maximum width cap. */
  maxWidth: number
}

/** Global cap so a single very long value cannot make a column unusably wide. */
const GLOBAL_MAX_WIDTH = 50

/** Match the '#,##0' numFmt used on the "Số cuộn" cells for width estimation. */
function formatConeCount(value: number): string {
  return value.toLocaleString('en-US')
}

/**
 * Auto-fit columns based only on the longest string that will actually appear
 * in each column's TABLE HEADER cell (row 12) and DATA cells.
 *
 * The merged document-header rows (rows 1-10), the merged "TỔNG CỘNG" total row
 * and the signatures block are intentionally NOT considered: they span the whole
 * table and would otherwise force absurdly wide columns.
 *
 * ExcelJS width units roughly equal the character count of the default font, so
 * a simple `string.length` is a robust estimator here.
 */
function autoFitColumns(
  ws: Worksheet,
  headers: string[],
  rows: IssueExportHistoryRow[],
  configs: ColumnWidthConfig[],
) {
  configs.forEach((config, colIndex) => {
    // Start from the per-column table-header label.
    let maxLen = (headers[colIndex] ?? '').length

    // Consider every data row's displayed value for this column.
    rows.forEach((item, rowIndex) => {
      maxLen = Math.max(maxLen, config.extract(item, rowIndex).length)
    })

    const cap = Math.min(config.maxWidth, GLOBAL_MAX_WIDTH)
    ws.getColumn(colIndex + 1).width = Math.min(
      Math.max(maxLen + 2, config.minWidth),
      cap,
    )
  })
}

function autoFitSummaryColumns(ws: Worksheet, rows: IssueExportHistoryRow[]) {
  autoFitColumns(ws, SUMMARY_HEADERS, rows, [
    // STT (numeric, tight cap)
    { extract: (_item, index) => String(index + 1), minWidth: 5, maxWidth: 8 },
    // NCC
    { extract: (item) => item.supplier_name ?? '', minWidth: 10, maxWidth: 50 },
    // Tex
    {
      extract: (item) => item.tex_label || item.tex_number || '-',
      minWidth: 10,
      maxWidth: 50,
    },
    // Số cuộn (numeric, tight cap)
    {
      extract: (item) => formatConeCount(item.total_full_cones),
      minWidth: 10,
      maxWidth: 14,
    },
  ])
}

function autoFitDetailedColumns(ws: Worksheet, rows: IssueExportHistoryRow[]) {
  autoFitColumns(ws, DETAILED_HEADERS, rows, [
    // STT (numeric, tight cap)
    { extract: (_item, index) => String(index + 1), minWidth: 5, maxWidth: 8 },
    // Bộ Phận (use the full department name; cells blank repeats but the column
    // must still fit the first/full occurrence)
    { extract: (item) => item.department ?? '', minWidth: 10, maxWidth: 50 },
    // Mã hàng
    { extract: (item) => item.style_code ?? '', minWidth: 10, maxWidth: 50 },
    // NCC
    { extract: (item) => item.supplier_name ?? '', minWidth: 10, maxWidth: 50 },
    // Tex
    {
      extract: (item) => item.tex_label || item.tex_number || '-',
      minWidth: 10,
      maxWidth: 50,
    },
    // Số cuộn (numeric, tight cap)
    {
      extract: (item) => formatConeCount(item.total_full_cones),
      minWidth: 10,
      maxWidth: 14,
    },
  ])
}

async function downloadWorkbook(wb: Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  await new Promise((resolve) => setTimeout(resolve, 350))
}

export function useIssueExportHistoryExport() {
  async function exportFile(
    rows: IssueExportHistoryRow[],
    meta: IssueExportHistoryMeta,
  ): Promise<void> {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(SHEET_NAME)

    const isDetailed = meta.mode === 'detailed'

    if (isDetailed) {
      renderDocHeader(worksheet, meta, 'F')
      renderTableHeader(worksheet, DETAILED_HEADERS)
      const { totalRow } = renderDetailedRows(worksheet, rows)
      renderSignatures(worksheet, totalRow, meta.full_name)
      autoFitDetailedColumns(worksheet, rows)
    } else {
      renderDocHeader(worksheet, meta, 'D')
      renderTableHeader(worksheet, SUMMARY_HEADERS)
      const { totalRow } = renderSummaryRows(worksheet, rows)
      renderSignatures(worksheet, totalRow, meta.full_name)
      autoFitSummaryColumns(worksheet, rows)
    }

    const suffix = isDetailed ? '-chi-tiet' : ''
    await downloadWorkbook(
      workbook,
      sanitizeFilename(
        `Lich-su-xuat-chi${suffix}_${meta.from_date}_${meta.to_date}.xlsx`,
      ),
    )
  }

  return { exportFile }
}
