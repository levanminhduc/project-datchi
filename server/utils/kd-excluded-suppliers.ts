import { query } from '../db/query'

const KD_EXCLUDED_SUPPLIER_NAMES = ['KHÁCH HÀNG KURARAY']

export async function getKdExcludedSupplierIds(): Promise<Set<number>> {
  try {
    const rows = await query<{ id: number }>(
      `SELECT id FROM suppliers
       WHERE name = ANY($1) AND deleted_at IS NULL`,
      [KD_EXCLUDED_SUPPLIER_NAMES]
    )
    return new Set(rows.map((r) => r.id))
  } catch (error) {
    console.error('[kd-excluded-suppliers] lookup failed:', error)
    return new Set<number>()
  }
}

export function isKdExcluded(
  excludedSupplierIds: Set<number>,
  supplierId: number | null | undefined
): boolean {
  return supplierId != null && excludedSupplierIds.has(supplierId)
}
