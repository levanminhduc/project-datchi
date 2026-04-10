import { supabaseAdmin as supabase } from '../../db/supabase'
import { getPartialConeRatio } from '../../utils/settings-helper'

type SummaryRow = {
  thread_type_id: number
  total_cones: number
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
  options?: { preserveAdditionalOrder?: boolean },
): Promise<EnrichedRow[]> {
  if (!summaryRows || summaryRows.length === 0) return []

  const partialConeRatio = await getPartialConeRatio()

  const colorNames = [
    ...new Set(
      summaryRows
        .map((r) => r.thread_color as string | null | undefined)
        .filter((c): c is string => !!c && c.trim() !== ''),
    ),
  ]

  const colorNameToId = new Map<string, number>()
  if (colorNames.length > 0) {
    const { data: colorRows } = await supabase
      .from('colors')
      .select('id, name')
      .in('name', colorNames)
      .limit(colorNames.length)

    for (const c of colorRows || []) {
      colorNameToId.set(c.name, c.id)
    }
  }

  const coloredTypeIds: number[] = []
  const coloredColorIds: number[] = []
  const nonColoredTypeIds: number[] = []

  for (const row of summaryRows) {
    const tc = row.thread_color as string | null | undefined
    if (tc && tc.trim() !== '' && colorNameToId.has(tc)) {
      coloredTypeIds.push(row.thread_type_id)
      coloredColorIds.push(colorNameToId.get(tc)!)
    } else if (!tc || tc.trim() === '') {
      nonColoredTypeIds.push(row.thread_type_id)
    }
  }

  const uniqueColoredTypeIds = [...new Set(coloredTypeIds)]
  const uniqueColoredColorIds = [...new Set(coloredColorIds)]
  const uniqueNonColoredTypeIds = [...new Set(nonColoredTypeIds)]

  const inventoryMap = new Map<string, { full: number; partial: number }>()

  if (uniqueColoredTypeIds.length > 0 && uniqueColoredColorIds.length > 0) {
    const { data: coloredCounts, error: coloredError } = await supabase.rpc(
      'fn_count_colored_cones',
      {
        p_thread_type_ids: uniqueColoredTypeIds,
        p_color_ids: uniqueColoredColorIds,
      },
    )

    if (coloredError) throw coloredError

    const colorIdToName = new Map<number, string>()
    for (const [name, id] of colorNameToId) {
      colorIdToName.set(id, name)
    }

    for (const inv of coloredCounts || []) {
      const cName = colorIdToName.get(inv.color_id)
      if (!cName) continue
      const key = `${inv.thread_type_id}_${cName}`
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
      'fn_count_available_cones',
      { p_thread_type_ids: uniqueNonColoredTypeIds },
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
    const tc = row.thread_color as string | null | undefined
    const key = `${row.thread_type_id}_${tc && tc.trim() !== '' ? tc : ''}`
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
