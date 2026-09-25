import { query } from '../../db/query'
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
  total_full_cones: number
}

export async function enrichWithInventory(
  summaryRows: SummaryRow[],
  currentWeekId?: number,
  options?: { preserveAdditionalOrder?: boolean; warehouseIds?: number[]; frozenInventoryRows?: SummaryRow[] },
): Promise<EnrichedRow[]> {
  if (!summaryRows || summaryRows.length === 0) return []

  const warehouseIdsParam =
    options?.warehouseIds && options.warehouseIds.length > 0
      ? options.warehouseIds
      : null

  const partialConeRatio = await getPartialConeRatio()
  const frozenRows = options?.frozenInventoryRows ?? null

  // Resolve thread_color (string name) → color_id for rows where thread_color_id is null
  const unresolvedColorNames = [
    ...new Set(
      [...summaryRows, ...(frozenRows ?? [])]
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
    const colorRows = await query<{ id: number; name: string }>(
      `SELECT id, name FROM colors WHERE name = ANY($1) LIMIT $2`,
      [unresolvedColorNames, unresolvedColorNames.length + 10],
    )
    for (const c of colorRows || []) {
      colorNameToId.set(c.name, c.id)
    }
  }

  const coloredTypeIds: number[] = []
  const coloredColorIds: number[] = []

  for (const row of summaryRows) {
    let colorId = row.thread_color_id as number | null | undefined
    if (colorId == null && typeof row.thread_color === 'string') {
      colorId = colorNameToId.get(row.thread_color as string) ?? null
    }
    if (colorId != null) {
      coloredTypeIds.push(row.thread_type_id)
      coloredColorIds.push(colorId)
    }
  }

  const uniqueColoredTypeIds = [...new Set(coloredTypeIds)]
  const uniqueColoredColorIds = [...new Set(coloredColorIds)]

  const inventoryMap = new Map<string, { full: number; partial: number }>()

  const frozenMap = new Map<string, SummaryRow>()
  for (const row of frozenRows ?? []) {
    let colorId = row.thread_color_id as number | null | undefined
    if (colorId == null && typeof row.thread_color === 'string') {
      colorId = colorNameToId.get(row.thread_color as string) ?? null
    }
    frozenMap.set(`${row.thread_type_id}_${colorId != null ? colorId : ''}`, row)
  }

  if (!frozenRows && uniqueColoredTypeIds.length > 0 && uniqueColoredColorIds.length > 0) {
    const coloredCounts = await query<{
      thread_type_id: number
      color_id: number
      is_partial: boolean
      cone_count: number | string
    }>(
      `SELECT * FROM fn_count_colored_cones_v2($1, $2, $3)`,
      [uniqueColoredTypeIds, uniqueColoredColorIds, warehouseIdsParam],
    )

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

  const ttColorMap = new Map<string, number>()

  if (uniqueColoredTypeIds.length > 0) {
    const ttCounts = await query<{
      thread_type_id: number
      color_id: number | null
      cone_count: number | string
    }>(
      `SELECT thread_type_id, color_id, COUNT(*) AS cone_count
       FROM thread_inventory
       WHERE thread_type_id = ANY($1)
         AND is_partial = FALSE
         AND status IN ('RECEIVED', 'INSPECTED', 'AVAILABLE', 'SOFT_ALLOCATED', 'HARD_ALLOCATED', 'RESERVED_FOR_ORDER')
         AND ($2::int[] IS NULL OR warehouse_id = ANY($2))
       GROUP BY thread_type_id, color_id`,
      [uniqueColoredTypeIds, warehouseIdsParam],
    )

    for (const row of ttCounts || []) {
      if (row.color_id != null) {
        ttColorMap.set(`${row.thread_type_id}_${row.color_id}`, Number(row.cone_count))
      }
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
    const frozen = frozenRows ? frozenMap.get(key) : undefined
    const full_cones = frozenRows ? Number(frozen?.full_cones ?? 0) : inv.full
    const partial_cones = frozenRows ? Number(frozen?.partial_cones ?? 0) : inv.partial
    const inventory_cones = full_cones + partial_cones
    const equivalent_cones = frozenRows
      ? Number(frozen?.equivalent_cones ?? 0)
      : Math.round((full_cones + partial_cones * partialConeRatio) * 10) / 10
    const effectiveCones = (row.quota_cones as number | null | undefined) != null
      ? (row.quota_cones as number)
      : row.total_cones
    const sl_can_dat = Math.max(
      0,
      Math.ceil(effectiveCones - equivalent_cones),
    )
    const additional_order = preserveAdditional
      ? ((row.additional_order as number) || 0)
      : 0
    const total_final = sl_can_dat + additional_order
    const total_full_cones = colorId != null
      ? (ttColorMap.get(`${row.thread_type_id}_${colorId}`) || 0)
      : 0

    return {
      ...row,
      full_cones,
      partial_cones,
      inventory_cones,
      equivalent_cones,
      sl_can_dat,
      additional_order,
      total_final,
      total_full_cones,
    }
  })
}
