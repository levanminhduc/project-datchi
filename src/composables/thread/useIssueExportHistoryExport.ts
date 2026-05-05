import type {
  IssueExportHistoryMeta,
  IssueExportHistoryRow,
} from '@/types/thread/issueExportHistory'

type Workbook = import('exceljs').Workbook
type Worksheet = import('exceljs').Worksheet

const SHEET_NAME = 'Lich su xuat chi'
const TABLE_HEADER_ROW = 12

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

function renderDocHeader(ws: Worksheet, meta: IssueExportHistoryMeta) {
  renderMerged(ws, 'A1:D1', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
    bold: true,
    size: 12,
  })
  renderMerged(ws, 'A2:D2', 'Độc lập – Tự do – Hạnh phúc', {
    italic: true,
    size: 11,
  })
  renderMerged(ws, 'A4:D4', 'CÔNG TY CP DỆT MAY HÒA THỌ', {
    bold: true,
    size: 12,
  })
  renderMerged(ws, 'A5:D5', 'CÔNG TY MAY HÒA THỌ ĐIỆN BÀN', {
    bold: true,
    size: 12,
  })
  renderMerged(ws, 'A7:D7', 'BÁO CÁO LỊCH SỬ XUẤT CHỈ', {
    bold: true,
    size: 16,
  })
  renderMerged(ws, 'A8:D8', `Số: ${meta.report_number}`, {
    italic: true,
    size: 11,
  })
  renderMerged(
    ws,
    'A9:D9',
    `Từ ngày: ${formatISODate(meta.from_date)}   Đến ngày: ${formatISODate(meta.to_date)}`,
    { size: 11 },
  )
  renderMerged(ws, 'A10:D10', `Kho: ${meta.warehouse_name}`, { size: 11 })
}

function renderTableHeader(ws: Worksheet) {
  const headers = ['STT', 'NCC', 'Tex', 'Số cuộn']
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

function renderTableRows(
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

    row.getCell(3).value = item.tex_number
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

function renderSignatures(ws: Worksheet, startRow: number, fullName: string) {
  const titleRow = startRow + 3
  const subtitleRow = titleRow + 1
  const nameRow = subtitleRow + 4

  renderMerged(ws, `A${titleRow}:B${titleRow}`, 'Người lập báo cáo', {
    bold: true,
    size: 11,
  })
  renderMerged(ws, `C${titleRow}:D${titleRow}`, 'Trưởng bộ phận', {
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

function setColumnWidths(ws: Worksheet) {
  ws.getColumn(1).width = 6
  ws.getColumn(2).width = 28
  ws.getColumn(3).width = 12
  ws.getColumn(4).width = 14
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

    renderDocHeader(worksheet, meta)
    renderTableHeader(worksheet)
    const { totalRow } = renderTableRows(worksheet, rows)
    renderSignatures(worksheet, totalRow, meta.full_name)
    setColumnWidths(worksheet)

    await downloadWorkbook(
      workbook,
      sanitizeFilename(
        `Lich-su-xuat-chi_${meta.from_date}_${meta.to_date}.xlsx`,
      ),
    )
  }

  return { exportFile }
}
