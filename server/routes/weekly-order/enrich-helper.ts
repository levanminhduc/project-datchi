import { supabaseAdmin as supabase } from '../../db/supabase'
import { getPartialConeRatio } from '../../utils/settings-helper'

type SummaryRow = {
  thread_type_id: number
  total_cones: number
  thread_color_id?: number | null
  [key: string]: unknown
}

type EnrichedRow = SummaryRow & {
  full_cones: number
  partial_cones: number
  inventory_cones: number
  equivalent_cones: number
  sl_can_dat: number
  additional_order: number
  total_final: number
}

export async function enrichWithInventory(
  summaryRows: SummaryRow[],
  currentWeekId?: number,
  options?: { preserveAdditionalOrder?: boolean; warehouseIds?: number[] },
): Promise<EnrichedRow[]> {
  if (!summaryRows || summaryRows.length === 0) return []

  const warehouseIdsParam =
    options?.warehouseIds && options.warehouseIds.length > 0
      ? options.warehouseIds
      : null

  const partialConeRatio = await getPartialConeRatio()

  // Resolve thread_color (string name) → color_id for rows where thread_color_id is null
  const unresolvedColorNames = [
    ...new Set(
      summaryRows
        .filter(
          (r) =>
            (r.thread_color_id as number | null | undefined) == null &&
            typeof r.thread_color === 'string' &&
            (r.thread_color as string).length > 0,
        )
        .map((r) => r.thread_color as string),
    ),
  ]

  const colorNameToId = new Map<string, number>()
  if (unresolvedColorNames.length > 0) {
    const { data: colorRows } = await supabase
      .from('colors')
      .select('id, name')
      .in('name', unresolvedColorNames)
      .limit(unresolvedColorNames.length + 10)
    for (const c of colorRows || []) {
      colorNameToId.set(c.name, c.id)
    }
  }

  const coloredTypeIds: number[] = []
  const coloredColorIds: number[] = []
  const nonColoredTypeIds: number[] = []

  for (const row of summaryRows) {
    let colorId = row.thread_color_id as number | null | undefined
    if (colorId == null && typeof row.thread_color === 'string') {
      colorId = colorNameToId.get(row.thread_color as string) ?? null
    }
    if (colorId != null) {
      coloredTypeIds.push(row.thread_type_id)
      coloredColorIds.push(colorId)
    } else {
      nonColoredTypeIds.push(row.thread_type_id)
    }
  }

  const uniqueColoredTypeIds = [...new Set(coloredTypeIds)]
  const uniqueColoredColorIds = [...new Set(coloredColorIds)]
  const uniqueNonColoredTypeIds = [...new Set(nonColoredTypeIds)]

  const inventoryMap = new Map<string, { full: number; partial: number }>()

  if (uniqueColoredTypeIds.length > 0 && uniqueColoredColorIds.length > 0) {
    const { data: coloredCounts, error: coloredError } = await supabase.rpc(
      'fn_count_colored_cones_v2',
      {
        p_thread_type_ids: uniqueColoredTypeIds,
        p_color_ids: uniqueColoredColorIds,
        p_warehouse_ids: warehouseIdsParam,
      },
    )

    if (coloredError) throw coloredError

    for (const inv of coloredCounts || []) {
      const key = `${inv.thread_type_id}_${inv.color_id}`
      const entry = inventoryMap.get(key) || { full: 0, partial: 0 }
      if (inv.is_partial) {
        entry.partial += Number(inv.cone_count)
      } else {
        entry.full += Number(inv.cone_count)
      }
      inventoryMap.set(key, entry)
    }
  }

  if (uniqueNonColoredTypeIds.length > 0) {
    const { data: inventoryCounts, error: invError } = await supabase.rpc(
      'fn_count_available_cones_v2',
      {
        p_thread_type_ids: uniqueNonColoredTypeIds,
        p_warehouse_ids: warehouseIdsParam,
      },
    )

    if (invError) throw invError

    for (const row of inventoryCounts || []) {
      const key = `${row.thread_type_id}_`
      const entry = inventoryMap.get(key) || { full: 0, partial: 0 }
      if (row.is_partial) {
        entry.partial = Number(row.cone_count)
      } else {
        entry.full = Number(row.cone_count)
      }
      inventoryMap.set(key, entry)
    }
  }

  const preserveAdditional = options?.preserveAdditionalOrder === true

  return summaryRows.map((row) => {
    let colorId = row.thread_color_id as number | null | undefined
    if (colorId == null && typeof row.thread_color === 'string') {
      colorId = colorNameToId.get(row.thread_color as string) ?? null
    }
    const key = `${row.thread_type_id}_${colorId != null ? colorId : ''}`
    const inv = inventoryMap.get(key) || { full: 0, partial: 0 }
    const full_cones = inv.full
    const partial_cones = inv.partial
    const inventory_cones = full_cones + partial_cones
    const equivalent_cones =
      Math.round((full_cones + partial_cones * partialConeRatio) * 10) / 10
    const sl_can_dat = Math.max(
      0,
      Math.ceil(row.total_cones - equivalent_cones),
    )
    const additional_order = preserveAdditional
      ? ((row.additional_order as number) || 0)
      : 0
    const total_final = sl_can_dat + additional_order

    return {
      ...row,
      full_cones,
      partial_cones,
      inventory_cones,
      equivalent_cones,
      sl_can_dat,
      additional_order,
      total_final,
    }
  })
}
