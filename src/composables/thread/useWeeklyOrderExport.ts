import { useSnackbar } from '@/composables/useSnackbar'
import type { AggregatedRow, WeekHistoryGroup } from '@/types/thread'

type Worksheet = import('exceljs').Worksheet
type Workbook = import('exceljs').Workbook

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

export async function exportOrderResults(data: AggregatedRow[], weekName: string) {
  const snackbar = useSnackbar()

  if (data.length === 0) {
    snackbar.warning('Chưa có dữ liệu để xuất')
    return
  }

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Đặt Hàng Chỉ')

    worksheet.columns = [
      { header: 'Loại chỉ', key: 'thread_type_name', width: 25 },
      { header: 'NCC', key: 'supplier_name', width: 20 },
      { header: 'Tex', key: 'tex_number', width: 10 },
      { header: 'Màu chỉ', key: 'thread_color', width: 15 },
      { header: 'Tổng mét', key: 'total_meters', width: 15 },
      { header: 'Tổng cuộn', key: 'total_cones', width: 12 },
      { header: 'Định mức (cuộn)', key: 'quota_cones', width: 15 },
      { header: 'Mét/cuộn', key: 'meters_per_cone', width: 12 },
      { header: 'Tồn kho KD', key: 'inventory_cones', width: 12 },
      { header: 'Cuộn nguyên', key: 'full_cones', width: 12 },
      { header: 'Cuộn lẻ', key: 'partial_cones', width: 12 },
      { header: 'Tồn kho QĐ', key: 'equivalent_cones', width: 12 },
      { header: 'SL cần đặt', key: 'sl_can_dat', width: 12 },
      { header: 'Đặt thêm', key: 'additional_order', width: 12 },
      { header: 'Tổng chốt', key: 'total_final', width: 12 },
    ]

    styleHeaderRow(worksheet)

    data.forEach((r) => {
      worksheet.addRow({
        thread_type_name: r.thread_type_name,
        supplier_name: r.supplier_name,
        tex_number: r.tex_number,
        thread_color: r.thread_color || '',
        total_meters: Number(r.total_meters.toFixed(2)),
        total_cones: r.total_cones,
        quota_cones: r.quota_cones || r.total_cones || '',
        meters_per_cone: r.meters_per_cone || '',
        inventory_cones: r.inventory_cones || '',
        full_cones: r.full_cones ?? '',
        partial_cones: r.partial_cones ?? '',
        equivalent_cones: r.equivalent_cones ?? '',
        sl_can_dat: r.sl_can_dat || '',
        additional_order: r.additional_order || '',
        total_final: r.total_final || '',
      })
    })

    await downloadWorkbook(workbook, `dat-hang-chi-${weekName || 'tuan'}.xlsx`)
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
