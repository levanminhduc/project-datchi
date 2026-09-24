import { ref } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { deliveryService } from '@/services/deliveryService'
import type { ReceiveStatsGroup } from '@/types/thread'
import { formatTexWithLabel } from '@/utils/thread-format'
import { styleHeaderRow, downloadWorkbook } from './inventory-export-helpers'

type Workbook = import('exceljs').Workbook
type Worksheet = import('exceljs').Worksheet

const MONEY_FORMAT = '#,##0'

export function formatIsoDate(value: string | null | undefined): string {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function addTotalRow(ws: Worksheet, values: Record<string, string | number>) {
  const row = ws.addRow(values)
  row.font = { bold: true }
}

function finishSheet(ws: Worksheet, moneyKeys: string[]) {
  styleHeaderRow(ws)
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } }
  for (const key of moneyKeys) ws.getColumn(key).numFmt = MONEY_FORMAT
}

function addGroupSheet(workbook: Workbook, name: string, header: string, groups: ReceiveStatsGroup[], labelOf = (g: ReceiveStatsGroup) => g.label) {
  const ws = workbook.addWorksheet(name)
  ws.columns = [
    { header, key: 'label', width: 30 },
    { header: 'Số lần nhập', key: 'receive_count', width: 14 },
    { header: 'Số cuộn nhập', key: 'received_cones', width: 14 },
    { header: 'Cuộn chưa có giá', key: 'unpriced_cones', width: 16 },
    { header: 'Thành tiền (VND)', key: 'amount', width: 18 },
  ]
  for (const g of groups) ws.addRow({ ...g, label: labelOf(g) })
  addTotalRow(ws, {
    label: 'TỔNG',
    receive_count: groups.reduce((s, g) => s + g.receive_count, 0),
    received_cones: groups.reduce((s, g) => s + g.received_cones, 0),
    unpriced_cones: groups.reduce((s, g) => s + g.unpriced_cones, 0),
    amount: groups.reduce((s, g) => s + g.amount, 0),
  })
  finishSheet(ws, ['amount'])
}

export function useReceiveStatsExport() {
  const exporting = ref(false)
  const snackbar = useSnackbar()

  async function exportStats(dateFrom: string, dateTo: string): Promise<void> {
    exporting.value = true
    try {
      const stats = await deliveryService.getReceiveStats({ date_from: dateFrom, date_to: dateTo, include_details: true })
      const details = stats.details ?? []
      if (details.length === 0) {
        snackbar.warning('Không có lần nhập kho nào trong khoảng thời gian này')
        return
      }

      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook() as unknown as Workbook

      const threadSheet = workbook.addWorksheet('Theo loại chỉ')
      threadSheet.columns = [
        { header: 'NCC', key: 'supplier_name', width: 22 },
        { header: 'Tex', key: 'tex', width: 14 },
        { header: 'Màu', key: 'color_name', width: 20 },
        { header: 'Số lần nhập', key: 'receive_count', width: 12 },
        { header: 'Nhập trong kỳ', key: 'received_cones', width: 14 },
        { header: 'Đơn giá (VND/cuộn)', key: 'unit_price', width: 18 },
        { header: 'Thành tiền (VND)', key: 'amount', width: 18 },
        { header: 'Số đặt', key: 'ordered_cones', width: 12 },
        { header: 'Tổng đã nhập', key: 'total_received', width: 14 },
        { header: 'Còn thiếu', key: 'remaining_cones', width: 12 },
      ]
      for (const g of stats.by_thread) {
        threadSheet.addRow({
          ...g,
          tex: formatTexWithLabel(g.tex_number, g.tex_label),
          unit_price: g.unit_price ?? 'Chưa có giá',
          amount: g.unit_price === null ? '' : g.amount,
        })
      }
      addTotalRow(threadSheet, {
        supplier_name: 'TỔNG',
        receive_count: stats.summary.receive_count,
        received_cones: stats.summary.total_cones,
        amount: stats.summary.total_amount,
        ordered_cones: stats.by_thread.reduce((s, g) => s + g.ordered_cones, 0),
        total_received: stats.by_thread.reduce((s, g) => s + g.total_received, 0),
        remaining_cones: stats.by_thread.reduce((s, g) => s + g.remaining_cones, 0),
      })
      finishSheet(threadSheet, ['unit_price', 'amount'])

      addGroupSheet(workbook, 'Theo NCC', 'NCC', stats.by_supplier)
      addGroupSheet(workbook, 'Theo kho', 'Kho nhập', stats.by_warehouse)
      addGroupSheet(workbook, 'Theo ngày', 'Ngày nhập', stats.by_date, g => formatIsoDate(g.label))
      addGroupSheet(workbook, 'Theo tuần', 'Tuần đặt hàng', stats.by_week)

      const detailSheet = workbook.addWorksheet('Chi tiết')
      detailSheet.columns = [
        { header: 'Ngày nhập', key: 'receive_date', width: 12 },
        { header: 'Ngày NCC giao', key: 'actual_delivery_date', width: 14 },
        { header: 'Tuần', key: 'week_name', width: 24 },
        { header: 'NCC', key: 'supplier_name', width: 22 },
        { header: 'Tex', key: 'tex', width: 14 },
        { header: 'Màu', key: 'color_name', width: 20 },
        { header: 'Kho nhập', key: 'warehouse_name', width: 18 },
        { header: 'Số cuộn', key: 'quantity', width: 10 },
        { header: 'Đơn giá (VND/cuộn)', key: 'unit_price', width: 18 },
        { header: 'Thành tiền (VND)', key: 'amount', width: 18 },
        { header: 'Người nhập', key: 'received_by', width: 22 },
      ]
      for (const d of details) {
        detailSheet.addRow({
          ...d,
          receive_date: formatIsoDate(d.receive_date),
          actual_delivery_date: formatIsoDate(d.actual_delivery_date),
          tex: formatTexWithLabel(d.tex_number, d.tex_label),
          unit_price: d.unit_price ?? 'Chưa có giá',
          amount: d.amount ?? '',
        })
      }
      addTotalRow(detailSheet, {
        receive_date: 'TỔNG',
        quantity: stats.summary.total_cones,
        amount: stats.summary.total_amount,
      })
      finishSheet(detailSheet, ['unit_price', 'amount'])

      const fileRange = `${formatIsoDate(dateFrom).replace(/\//g, '')}-${formatIsoDate(dateTo).replace(/\//g, '')}`
      await downloadWorkbook(workbook, `Nhap_kho_${fileRange}.xlsx`)
      snackbar.success('Xuất Excel thành công')
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : 'Lỗi xuất Excel')
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportStats }
}
