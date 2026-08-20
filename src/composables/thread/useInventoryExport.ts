import { ref } from 'vue'
import { format } from 'date-fns'
import { useSnackbar } from '@/composables/useSnackbar'
import type { ConeSummaryRow } from '@/types/thread/inventory'
import type { Supplier } from '@/types/thread/supplier'
import { formatTexWithLabel } from '@/utils/thread-format'
import {
  styleHeaderRow,
  downloadWorkbook,
  findSupplierId,
  fetchSummaryRows,
} from './inventory-export-helpers'

type Workbook = import('exceljs').Workbook

export function useInventoryExport() {
  const exporting = ref(false)
  const snackbar = useSnackbar()

  async function exportBySuppliers(
    suppliers: Supplier[],
    warehouseIds: number[] | null = null,
    mergeSupplierCells = true,
  ): Promise<void> {
    if (suppliers.length === 0) return
    exporting.value = true

    try {
      const ExcelJS = await import('exceljs')
      const allRows = await fetchSummaryRows(warehouseIds)

      const supplierIds = new Set(suppliers.map((s) => s.id))
      const supplierNameMap = new Map(suppliers.map((s) => [s.id, s.name]))

      const grouped = new Map<number, ConeSummaryRow[]>()
      for (const row of allRows) {
        const supplierId = findSupplierId(row, suppliers)
        if (supplierId !== null && supplierIds.has(supplierId)) {
          if (!grouped.has(supplierId)) grouped.set(supplierId, [])
          grouped.get(supplierId)!.push(row)
        }
      }

      const workbook = new ExcelJS.Workbook() as unknown as Workbook
      const worksheet = workbook.addWorksheet('Tồn kho')

      worksheet.columns = [
        { header: 'Nhà cung cấp', key: 'ncc', width: 25 },
        { header: 'Tex', key: 'tex', width: 12 },
        { header: 'Màu', key: 'mau', width: 18 },
        { header: 'Cuộn nguyên KD', key: 'full_available', width: 16 },
        { header: 'Cuộn lẻ KD', key: 'partial_available', width: 14 },
        { header: 'Cuộn nguyên TT', key: 'full_total', width: 16 },
        { header: 'Cuộn lẻ TT', key: 'partial_total', width: 14 },
        { header: 'Ngày Tồn Kho', key: 'idle_days', width: 14 },
      ]

      styleHeaderRow(worksheet)

      const sortedSupplierIds = [...supplierIds].sort((a, b) => {
        const nameA = supplierNameMap.get(a) || ''
        const nameB = supplierNameMap.get(b) || ''
        return nameA.localeCompare(nameB, 'vi')
      })

      let currentRow = 2

      for (const supplierId of sortedSupplierIds) {
        const rows = grouped.get(supplierId) || []
        const supplierName = supplierNameMap.get(supplierId) || 'Không rõ'

        if (rows.length === 0) {
          worksheet.addRow({
            ncc: supplierName,
            tex: '',
            mau: '',
            full_available: 0,
            partial_available: 0,
            full_total: 0,
            partial_total: 0,
            idle_days: '',
          })
          currentRow++
        } else {
          const sorted = [...rows].sort((a, b) => {
            const texCmp = (a.tex_number || '').localeCompare(b.tex_number || '', 'vi')
            if (texCmp !== 0) return texCmp
            const colorA = a.color_data?.name || ''
            const colorB = b.color_data?.name || ''
            return colorA.localeCompare(colorB, 'vi')
          })

          const startRow = currentRow
          for (const row of sorted) {
            worksheet.addRow({
              ncc: supplierName,
              tex: formatTexWithLabel(row.tex_number, row.tex_label) || '',
              mau: row.color_data?.name || '',
              full_available: row.full_cones,
              partial_available: row.partial_cones,
              full_total: row.total_full_cones,
              partial_total: row.total_partial_cones,
              idle_days: row.idle_days ?? '',
            })
            currentRow++
          }
          const endRow = currentRow - 1

          if (mergeSupplierCells && endRow > startRow) {
            worksheet.mergeCells(startRow, 1, endRow, 1)
          }
        }
      }

      worksheet.getColumn(1).alignment = { vertical: 'middle' }

      if (!mergeSupplierCells && currentRow > 2) {
        worksheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: currentRow - 1, column: 8 },
        }
      }

      const includedRows = [...grouped.values()].flat()
      const totalRow = worksheet.addRow({
        ncc: 'TỔNG',
        tex: '',
        mau: '',
        full_available: includedRows.reduce((s, r) => s + r.full_cones, 0),
        partial_available: includedRows.reduce((s, r) => s + r.partial_cones, 0),
        full_total: includedRows.reduce((s, r) => s + r.total_full_cones, 0),
        partial_total: includedRows.reduce((s, r) => s + r.total_partial_cones, 0),
        idle_days: '',
      })
      totalRow.font = { bold: true }

      const today = format(new Date(), 'yyyy-MM-dd')
      await downloadWorkbook(workbook, `Ton_kho_${today}.xlsx`)
      snackbar.success('Xuất Excel thành công')
    } catch (e: any) {
      snackbar.error(e?.message || 'Lỗi xuất Excel')
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportBySuppliers }
}
