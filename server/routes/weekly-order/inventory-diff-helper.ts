import { supabaseAdmin as supabase } from '../../db/supabase'
import { enrichWithInventory } from './enrich-helper'

export interface InventoryDiffRow {
  thread_type_id: number
  thread_color_id: number | null
  thread_type_name: string | null
  supplier_name: string | null
  tex_number: string | null
  thread_color: string | null
  old_inventory_cones: number
  new_inventory_cones: number
  old_sl_can_dat: number
  new_sl_can_dat: number
  old_total_final: number
  new_total_final: number
  quota_cones: number | null
  total_cones: number
}

export interface InventoryDiffResult {
  has_changed: boolean
  diff: InventoryDiffRow[]
}

type StoredSummaryRow = {
  thread_type_id: number
  thread_color_id?: number | null
  thread_color?: string | null
  thread_type_name?: string | null
  supplier_name?: string | null
  tex_number?: string | null
  total_cones?: number
  inventory_cones?: number
  sl_can_dat?: number
  total_final?: number
  additional_order?: number
  quota_cones?: number | null
  [key: string]: unknown
}

export async function getInventoryDiffForWeek(weekId: number): Promise<InventoryDiffResult> {
  const { data: resultsRow, error: resultsError } = await supabase
    .from('thread_order_results')
    .select('summary_data')
    .eq('week_id', weekId)
    .maybeSingle()

  if (resultsError) throw resultsError
  if (!resultsRow?.summary_data || !Array.isArray(resultsRow.summary_data)) {
    return { has_changed: false, diff: [] }
  }

  const oldSummary = resultsRow.summary_data as StoredSummaryRow[]
  if (oldSummary.length === 0) {
    return { has_changed: false, diff: [] }
  }

  const { data: warehouseRows } = await supabase
    .from('thread_order_week_warehouses')
    .select('warehouse_id')
    .eq('week_id', weekId)
    .limit(100)

  const warehouseIds = (warehouseRows || []).map((r) => r.warehouse_id)

  const rowsForEnrich = oldSummary.map((row) => ({
    ...row,
    thread_type_id: row.thread_type_id,
    total_cones: row.total_cones ?? 0,
    thread_color_id: row.thread_color_id ?? null,
    additional_order: row.additional_order ?? 0,
  }))

  const enriched = await enrichWithInventory(rowsForEnrich, weekId, {
    preserveAdditionalOrder: true,
    warehouseIds: warehouseIds.length > 0 ? warehouseIds : undefined,
  })

  const enrichedMap = new Map<string, (typeof enriched)[number]>()
  for (const row of enriched) {
    const key = `${row.thread_type_id}_${row.thread_color_id ?? ''}`
    enrichedMap.set(key, row)
  }

  const diff: InventoryDiffRow[] = []

  for (const oldRow of oldSummary) {
    const key = `${oldRow.thread_type_id}_${oldRow.thread_color_id ?? ''}`
    const newRow = enrichedMap.get(key)
    if (!newRow) continue

    const oldInv = oldRow.inventory_cones ?? 0
    const newInv = newRow.inventory_cones ?? 0

    if (oldInv === newInv) continue

    diff.push({
      thread_type_id: oldRow.thread_type_id,
      thread_color_id: oldRow.thread_color_id ?? null,
      thread_type_name: oldRow.thread_type_name ?? null,
      supplier_name: oldRow.supplier_name ?? null,
      tex_number: oldRow.tex_number ?? null,
      thread_color: oldRow.thread_color ?? null,
      old_inventory_cones: oldInv,
      new_inventory_cones: newInv,
      old_sl_can_dat: oldRow.sl_can_dat ?? 0,
      new_sl_can_dat: newRow.sl_can_dat ?? 0,
      old_total_final: oldRow.total_final ?? 0,
      new_total_final: newRow.total_final ?? 0,
      quota_cones: (oldRow.quota_cones as number | null | undefined) ?? null,
      total_cones: oldRow.total_cones ?? 0,
    })
  }

  return {
    has_changed: diff.length > 0,
    diff,
  }
}
