import type { Ref } from 'vue'
import { overQuotaService } from '@/services/overQuotaService'
import { useSnackbar } from '../useSnackbar'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  OverQuotaFilters,
  OverQuotaSummary,
  StyleOverQuotaItem,
  OverQuotaDetailRow,
} from '@/types/thread/overQuota'

function styleHeaderRow(ws: import('exceljs').Worksheet) {
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  }
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
}

function buildSummarySheet(
  workbook: InstanceType<typeof import('exceljs').Workbook>,
  summary: OverQuotaSummary | null,
) {
  const ws = workbook.addWorksheet('Tong hop')
  ws.columns = [
    { header: 'Chi so', key: 'metric', width: 30 },
    { header: 'Gia tri', key: 'value', width: 20 },
  ]
  styleHeaderRow(ws)
  if (!summary) return
  ws.addRow({ metric: 'Tong luot vuot DM', value: summary.total_over_events })
  ws.addRow({ metric: 'Tong cones vuot', value: summary.total_excess_cones })
  ws.addRow({ metric: 'Ty le vuot DM (%)', value: summary.over_rate_pct })
  ws.addRow({ metric: 'Ma hang vuot nhieu nhat', value: summary.top_style?.code || '---' })
  ws.addRow({ metric: 'Phong ban nhieu nhat', value: summary.top_dept?.name || '---' })
}

function buildByStyleSheet(
  workbook: InstanceType<typeof import('exceljs').Workbook>,
  byStyleData: StyleOverQuotaItem[],
) {
  const ws = workbook.addWorksheet('Theo ma hang')
  ws.columns = [
    { header: 'Ma hang', key: 'style_code', width: 15 },
    { header: 'Ten', key: 'style_name', width: 25 },
    { header: 'Quota (cuon)', key: 'total_quota', width: 14 },
    { header: 'Thuc cap (cuon)', key: 'total_issued', width: 14 },
    { header: 'Vuot (cuon)', key: 'total_excess', width: 14 },
    { header: 'So luot vuot', key: 'over_count', width: 12 },
    { header: 'Ty le vuot (%)', key: 'over_rate_pct', width: 14 },
  ]
  styleHeaderRow(ws)
  byStyleData.forEach((row) => ws.addRow(row))
}

async function buildDetailSheet(
  workbook: InstanceType<typeof import('exceljs').Workbook>,
  filters: OverQuotaFilters,
) {
  const ws = workbook.addWorksheet('Chi tiet')
  ws.columns = [
    { header: 'Ma phieu', key: 'issue_code', width: 14 },
    { header: 'Phong ban', key: 'department', width: 12 },
    { header: 'Ngay', key: 'issue_date', width: 12 },
    { header: 'PO', key: 'po_number', width: 14 },
    { header: 'Ma hang', key: 'style_code', width: 14 },
    { header: 'Mau', key: 'color_name', width: 14 },
    { header: 'Loai chi', key: 'thread_name', width: 20 },
    { header: 'Quota (cuon)', key: 'quota_cones', width: 12 },
    { header: 'Thuc cap (cuon)', key: 'consumed_equivalent_cones', width: 14 },
    { header: 'Vuot (cuon)', key: 'excess_cones', width: 12 },
    { header: 'Vuot (%)', key: 'consumption_pct', width: 10 },
    { header: 'Ghi chu', key: 'over_quota_notes', width: 25 },
  ]
  styleHeaderRow(ws)

  let page = 1
  const PAGE_SIZE = 100
  let hasMore = true
  while (hasMore) {
    const result = await overQuotaService.getDetail(filters, {
      page,
      page_size: PAGE_SIZE,
    })
    result.rows.forEach((row: OverQuotaDetailRow) => ws.addRow(row))
    hasMore = page * PAGE_SIZE < result.total
    page++
  }
}

export function useOverQuotaExport(
  summary: Ref<OverQuotaSummary | null>,
  byStyleData: Ref<StyleOverQuotaItem[]>,
  filtersSnapshot: () => OverQuotaFilters,
) {
  const snackbar = useSnackbar()

  async function exportToXlsx() {
    const dismiss = snackbar.loading('Đang xuất Excel...')
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()

      buildSummarySheet(workbook, summary.value)
      buildByStyleSheet(workbook, byStyleData.value)
      await buildDetailSheet(workbook, filtersSnapshot())

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const datePart = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `phan-tich-vuot-dinh-muc-${datePart}.xlsx`
      link.click()
      URL.revokeObjectURL(url)

      snackbar.success('Đã xuất báo cáo thành công')
    } catch (err) {
      snackbar.error(getErrorMessage(err, 'Xuất báo cáo thất bại'))
    } finally {
      dismiss()
    }
  }

  return { exportToXlsx }
}
