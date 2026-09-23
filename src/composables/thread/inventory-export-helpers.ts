import { inventoryService } from '@/services/inventoryService'
import type { ConeSummaryRow } from '@/types/thread/inventory'
import type { Supplier } from '@/types/thread/supplier'

type Workbook = import('exceljs').Workbook
type Worksheet = import('exceljs').Worksheet

export function styleHeaderRow(worksheet: Worksheet) {
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  }
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
}

export async function downloadWorkbook(workbook: Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
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
}

export function findSupplierId(row: ConeSummaryRow, suppliers: Supplier[]): number | null {
  if (!row.supplier_name) return null
  const match = suppliers.find((s) => s.name === row.supplier_name)
  return match?.id ?? null
}

export async function fetchSummaryRows(warehouseIds: number[] | null): Promise<ConeSummaryRow[]> {
  if (warehouseIds === null) return inventoryService.getConeSummary({})

  const results = await Promise.all(
    warehouseIds.map((id) => inventoryService.getConeSummary({ warehouse_id: id })),
  )

  const merged = new Map<string, ConeSummaryRow>()
  for (const rows of results) {
    for (const row of rows) {
      const key = `${row.thread_type_id}|${row.color_id ?? ''}|${row.supplier_name ?? ''}`
      const existing = merged.get(key)
      if (!existing) {
        merged.set(key, { ...row })
        continue
      }
      existing.full_cones += row.full_cones
      existing.partial_cones += row.partial_cones
      existing.partial_meters += row.partial_meters
      existing.partial_weight_grams += row.partial_weight_grams
      existing.total_full_cones += row.total_full_cones
      existing.total_partial_cones += row.total_partial_cones
    }
  }

  return [...merged.values()]
}
