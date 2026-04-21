import { format } from 'date-fns'
import { useSnackbar } from '@/composables/useSnackbar'
import type { AggregatedRow, WeekHistoryGroup } from '@/types/thread'

type Worksheet = import('exceljs').Worksheet
type Workbook = import('exceljs').Workbook

export interface ExportWeekMeta {
  id: number
  week_name: string
  created_by?: string | null
  leader_signed_by_name?: string | null
}

function styleHeaderRow(worksheet: Worksheet) {
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  }
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
}

async function downloadWorkbook(workbook: Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function getSupplierGroup(supplierName: string | null | undefined): string {
  return (supplierName || '').trim().split(/\s+/)[0] || ''
}

export function getSupplierGroups(data: AggregatedRow[]): string[] {
  const groups = data
    .map((r) => getSupplierGroup(r.supplier_name))
    .filter(Boolean)
  return [...new Set(groups)]
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\/\\:*?"<>|]/g, '_').trim() || 'NCC'
}

function buildKinhGui(data: AggregatedRow[]): string {
  const firstWords = data.map((r) => getSupplierGroup(r.supplier_name)).filter(Boolean)
  const unique = [...new Set(firstWords)]
  return unique.length > 0
    ? `Kính gửi: Công ty ${unique.join(' / ')}`
    : 'Kính gửi: Quý công ty'
}

const COLUMN_DEFS: Array<{ header: string; key: string; width: number }> = [
  { header: 'Loại chỉ', key: 'thread_type_name', width: 25 },
  { header: 'NCC', key: 'supplier_name', width: 20 },
  { header: 'Tex', key: 'tex_number', width: 10 },
  { header: 'Màu chỉ', key: 'thread_color', width: 15 },
  { header: 'Tổng mét', key: 'total_meters', width: 15 },
  { header: 'Mét/cuộn', key: 'meters_per_cone', width: 12 },
  { header: 'Nhu Cầu', key: 'total_cones', width: 12 },
  { header: 'Tồn kho KD', key: 'inventory_cones', width: 12 },
  { header: 'Cuộn nguyên', key: 'full_cones', width: 12 },
  { header: 'Cuộn lẻ', key: 'partial_cones', width: 12 },
  { header: 'Tồn kho QĐ', key: 'equivalent_cones', width: 12 },
  { header: 'SL cần đặt', key: 'sl_can_dat', width: 12 },
  { header: 'Đặt thêm', key: 'additional_order', width: 12 },
  { header: 'Tổng chốt', key: 'total_final', width: 12 },
  { header: 'Ngày giao', key: 'delivery_date', width: 14 },
]

const LAST_COL_LETTER = String.fromCharCode(64 + COLUMN_DEFS.length)
const TABLE_HEADER_ROW = 10

function renderDocHeader(
  worksheet: Worksheet,
  week: ExportWeekMeta,
  data: AggregatedRow[],
) {
  const orderNumber = String(week.id).padStart(5, '0')
  const today = format(new Date(), 'dd/MM/yyyy')

  worksheet.mergeCells(`A1:${LAST_COL_LETTER}1`)
  const r1 = worksheet.getCell('A1')
  r1.value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'
  r1.font = { bold: true, size: 12 }
  r1.alignment = { horizontal: 'center' }

  worksheet.mergeCells(`A2:${LAST_COL_LETTER}2`)
  const r2 = worksheet.getCell('A2')
  r2.value = 'Độc lập – Tự do – Hạnh phúc'
  r2.font = { size: 11 }
  r2.alignment = { horizontal: 'center' }

  worksheet.mergeCells(`A4:${LAST_COL_LETTER}4`)
  const r4 = worksheet.getCell('A4')
  r4.value = 'ĐƠN ĐẶT HÀNG'
  r4.font = { bold: true, size: 16 }
  r4.alignment = { horizontal: 'center' }

  worksheet.mergeCells(`A5:${LAST_COL_LETTER}5`)
  const r5 = worksheet.getCell('A5')
  r5.value = `Số: ${orderNumber}`
  r5.font = { italic: true, size: 11 }
  r5.alignment = { horizontal: 'center' }

  worksheet.mergeCells(`A6:${LAST_COL_LETTER}6`)
  const r6 = worksheet.getCell('A6')
  r6.value = buildKinhGui(data)
  r6.font = { size: 11 }
  r6.alignment = { horizontal: 'left' }

  worksheet.mergeCells(`A7:${LAST_COL_LETTER}7`)
  const r7 = worksheet.getCell('A7')
  r7.value =
    'Công ty May Hòa Thọ Điện Bàn có nhu cầu đặt hàng tại Quý công ty theo mẫu yêu cầu.'
  r7.font = { size: 11 }
  r7.alignment = { horizontal: 'left' }

  const r8a = worksheet.getCell('A8')
  r8a.value = 'CHI TIẾT ĐƠN HÀNG:'
  r8a.font = { bold: true, size: 11 }
  const r8d = worksheet.getCell('D8')
  r8d.value = 'Ngày đặt hàng:'
  r8d.font = { size: 11 }
  const r8e = worksheet.getCell('E8')
  r8e.value = today
  r8e.font = { size: 11 }
}

function renderTableHeader(worksheet: Worksheet) {
  const row = worksheet.getRow(TABLE_HEADER_ROW)
  COLUMN_DEFS.forEach((col, idx) => {
    const cell = row.getCell(idx + 1)
    cell.value = col.header
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  })
  row.commit()
}

function renderSignatureFooter(
  worksheet: Worksheet,
  week: ExportWeekMeta,
  lastDataRow: number,
) {
  const titleRow = lastDataRow + 3
  const nameRow = lastDataRow + 7

  worksheet.mergeCells(`A${titleRow}:G${titleRow}`)
  const leftTitle = worksheet.getCell(`A${titleRow}`)
  leftTitle.value = 'Đại diện Công ty may Hòa Thọ Điện Bàn'
  leftTitle.font = { bold: true }
  leftTitle.alignment = { horizontal: 'center' }

  worksheet.mergeCells(`H${titleRow}:${LAST_COL_LETTER}${titleRow}`)
  const rightTitle = worksheet.getCell(`H${titleRow}`)
  rightTitle.value = 'Đại Diện Đặt Hàng'
  rightTitle.font = { bold: true }
  rightTitle.alignment = { horizontal: 'center' }

  worksheet.mergeCells(`A${nameRow}:G${nameRow}`)
  const leftName = worksheet.getCell(`A${nameRow}`)
  leftName.value = week.leader_signed_by_name || ''
  leftName.alignment = { horizontal: 'center' }

  worksheet.mergeCells(`H${nameRow}:${LAST_COL_LETTER}${nameRow}`)
  const rightName = worksheet.getCell(`H${nameRow}`)
  rightName.value = week.created_by || ''
  rightName.alignment = { horizontal: 'center' }
}

export async function exportOrderResults(
  data: AggregatedRow[],
  week: ExportWeekMeta,
  supplierGroup?: string,
) {
  const snackbar = useSnackbar()

  const filteredData = supplierGroup
    ? data.filter((r) => getSupplierGroup(r.supplier_name) === supplierGroup)
    : data

  if (filteredData.length === 0) {
    snackbar.warning(
      supplierGroup
        ? `Không có dữ liệu cho NCC ${supplierGroup}`
        : 'Chưa có dữ liệu để xuất',
    )
    return
  }

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Đặt Hàng Chỉ')

    worksheet.columns = COLUMN_DEFS.map((c) => ({ key: c.key, width: c.width }))

    renderDocHeader(worksheet, week, filteredData)
    renderTableHeader(worksheet)

    const numFmt = '#,##0'
    const numFmt2 = '#,##0.00'
    worksheet.getColumn('total_meters').numFmt = numFmt2
    worksheet.getColumn('meters_per_cone').numFmt = numFmt
    worksheet.getColumn('total_cones').numFmt = numFmt
    worksheet.getColumn('inventory_cones').numFmt = numFmt
    worksheet.getColumn('full_cones').numFmt = numFmt
    worksheet.getColumn('partial_cones').numFmt = numFmt
    worksheet.getColumn('equivalent_cones').numFmt = numFmt
    worksheet.getColumn('sl_can_dat').numFmt = numFmt
    worksheet.getColumn('additional_order').numFmt = numFmt
    worksheet.getColumn('total_final').numFmt = numFmt

    filteredData.forEach((r) => {
      worksheet.addRow({
        thread_type_name: r.thread_type_name,
        supplier_name: r.supplier_name,
        tex_number: r.tex_number,
        thread_color: r.thread_color || '',
        total_meters: Number(r.total_meters.toFixed(2)),
        meters_per_cone: r.meters_per_cone || '',
        total_cones: r.total_cones > 0 ? r.total_cones : '',
        inventory_cones: r.inventory_cones || '',
        full_cones: r.full_cones ?? '',
        partial_cones: r.partial_cones ?? '',
        equivalent_cones: r.equivalent_cones ?? '',
        sl_can_dat: r.sl_can_dat || '',
        additional_order: r.additional_order || '',
        total_final: r.total_final || '',
        delivery_date:
          r.total_final && r.delivery_date
            ? format(new Date(r.delivery_date), 'dd/MM/yyyy')
            : '',
      })
    })

    const lastDataRow = TABLE_HEADER_ROW + filteredData.length
    renderSignatureFooter(worksheet, week, lastDataRow)

    const baseName = week.week_name || 'tuan'
    const filename = supplierGroup
      ? `${sanitizeFilename(supplierGroup)}-${baseName}.xlsx`
      : `dat-hang-chi-${baseName}.xlsx`
    await downloadWorkbook(workbook, filename)
    snackbar.success('Đã xuất file Excel')
  } catch (err) {
    console.error('[weekly-order] export error:', err)
    snackbar.error('Không thể xuất file Excel')
  }
}

export async function exportOrderHistory(
  weekGroups: WeekHistoryGroup[],
  formatDate: (dateStr: string) => string,
  getStatusLabel: (status?: string) => string,
) {
  const snackbar = useSnackbar()

  if (weekGroups.length === 0) return

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Lịch Sử Đặt Hàng')

    worksheet.columns = [
      { header: 'Tuần', key: 'week_name', width: 20 },
      { header: 'PO', key: 'po_number', width: 18 },
      { header: 'Mã hàng', key: 'style_code', width: 15 },
      { header: 'Tên mã hàng', key: 'style_name', width: 25 },
      { header: 'Màu', key: 'color_name', width: 15 },
      { header: 'SL (SP)', key: 'quantity', width: 12 },
      { header: 'SL PO', key: 'po_quantity', width: 12 },
      { header: 'Đã đặt', key: 'total_ordered', width: 12 },
      { header: 'Còn lại', key: 'remaining', width: 12 },
      { header: 'Tiến độ %', key: 'progress_pct', width: 12 },
      { header: 'Người tạo', key: 'created_by', width: 18 },
      { header: 'Ngày tạo', key: 'created_at', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 },
    ]

    styleHeaderRow(worksheet)

    weekGroups.forEach((week) => {
      week.po_groups.forEach((poGroup) => {
        poGroup.styles.forEach((style) => {
          style.colors.forEach((color) => {
            worksheet.addRow({
              week_name: week.week_name,
              po_number: poGroup.po_number,
              style_code: style.style_code,
              style_name: style.style_name,
              color_name: color.color_name,
              quantity: color.quantity,
              po_quantity: style.po_quantity,
              total_ordered: style.total_ordered,
              remaining: style.remaining,
              progress_pct: style.progress_pct,
              created_by: week.created_by || '',
              created_at: formatDate(week.created_at),
              status: getStatusLabel(week.status),
            })
          })
        })
      })
    })

    const dateStr = new Date().toISOString().slice(0, 10)
    await downloadWorkbook(workbook, `lich-su-dat-hang-chi-${dateStr}.xlsx`)
    snackbar.success('Đã xuất file Excel')
  } catch (err) {
    console.error('[history-by-week] export error:', err)
    snackbar.error('Không thể xuất file Excel')
  }
}
