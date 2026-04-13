type ColorBreakdown = {
  thread_type_id: number
  thread_color?: string
  thread_color_code?: string
  total_meters: number
  meters_per_cone?: number
  tex_number?: string
  supplier_id?: number
  supplier_name?: string
  thread_type_name?: string
  lead_time_days?: number
  delivery_date?: string
  color_id?: number
  quantity?: number
  meters_per_unit?: number
  [key: string]: unknown
}

export type CalcEntry = {
  style_id: number
  calculations: Array<{
    thread_type_id?: number
    thread_color?: string
    thread_color_code?: string
    total_meters?: number
    meters_per_cone?: number | null
    tex_number?: string
    supplier_id?: number
    supplier_name?: string
    thread_type_name?: string
    lead_time_days?: number
    delivery_date?: string
    color_breakdown?: ColorBreakdown[]
    [key: string]: unknown
  }>
}

type SummaryRow = {
  thread_type_id: number
  thread_color?: string | null
  [key: string]: unknown
}

export function reaggregateSummary(
  filteredCalcData: CalcEntry[],
  oldSummary: SummaryRow[],
): SummaryRow[] {
  const groupKey = (ttId: number, color: string | null | undefined) =>
    `${ttId}_${color ?? ''}`

  const oldMeta = new Map<string, SummaryRow>()
  for (const row of oldSummary) {
    oldMeta.set(groupKey(row.thread_type_id, row.thread_color as string), row)
  }

  const agg = new Map<string, {
    thread_type_id: number
    thread_color: string | null
    thread_color_code: string | null
    total_meters: number
    meters_per_cone: number
    tex_number: string
    supplier_id: number | null
    supplier_name: string
    thread_type_name: string
    lead_time_days: number | null
    delivery_date: string | null
  }>()

  for (const style of filteredCalcData) {
    for (const calc of style.calculations) {
      const breakdowns = calc.color_breakdown
      if (breakdowns && breakdowns.length > 0) {
        for (const cb of breakdowns) {
          const key = groupKey(cb.thread_type_id, cb.thread_color)
          const existing = agg.get(key)
          if (existing) {
            existing.total_meters += cb.total_meters || 0
          } else {
            agg.set(key, {
              thread_type_id: cb.thread_type_id,
              thread_color: cb.thread_color ?? null,
              thread_color_code: cb.thread_color_code ?? calc.thread_color_code ?? null,
              total_meters: cb.total_meters || 0,
              meters_per_cone: cb.meters_per_cone ?? (calc.meters_per_cone as number) ?? 0,
              tex_number: cb.tex_number ?? calc.tex_number ?? '',
              supplier_id: cb.supplier_id ?? calc.supplier_id ?? null,
              supplier_name: cb.supplier_name ?? calc.supplier_name ?? '',
              thread_type_name: cb.thread_type_name ?? calc.thread_type_name ?? '',
              lead_time_days: calc.lead_time_days ?? null,
              delivery_date: calc.delivery_date ?? null,
            })
          }
        }
      } else if (calc.thread_type_id && calc.total_meters) {
        const key = groupKey(calc.thread_type_id, calc.thread_color)
        const existing = agg.get(key)
        if (existing) {
          existing.total_meters += calc.total_meters
        } else {
          agg.set(key, {
            thread_type_id: calc.thread_type_id,
            thread_color: calc.thread_color ?? null,
            thread_color_code: calc.thread_color_code ?? null,
            total_meters: calc.total_meters,
            meters_per_cone: (calc.meters_per_cone as number) ?? 0,
            tex_number: calc.tex_number ?? '',
            supplier_id: calc.supplier_id ?? null,
            supplier_name: calc.supplier_name ?? '',
            thread_type_name: calc.thread_type_name ?? '',
            lead_time_days: calc.lead_time_days ?? null,
            delivery_date: calc.delivery_date ?? null,
          })
        }
      }
    }
  }

  const result: SummaryRow[] = []
  for (const row of agg.values()) {
    if (row.meters_per_cone <= 0) continue

    const quota_cones = Math.ceil(row.total_meters / row.meters_per_cone)
    const key = groupKey(row.thread_type_id, row.thread_color)
    const old = oldMeta.get(key)

    result.push({
      thread_type_id: row.thread_type_id,
      thread_color: row.thread_color,
      thread_color_code: row.thread_color_code,
      total_meters: row.total_meters,
      meters_per_cone: row.meters_per_cone,
      total_cones: quota_cones,
      quota_cones: quota_cones,
      tex_number: row.tex_number,
      supplier_id: row.supplier_id,
      supplier_name: row.supplier_name,
      thread_type_name: row.thread_type_name,
      lead_time_days: old?.lead_time_days ?? row.lead_time_days ?? 7,
      delivery_date: old?.delivery_date ?? row.delivery_date,
    })
  }

  return result
}

type RemainingItem = { style_id: number; color_key: number; quantity: number }

export function adjustCalcDataForRemainingItems(
  calcData: CalcEntry[],
  remainingItems: RemainingItem[],
): CalcEntry[] {
  const qtyMap = new Map<string, number>()
  const styleIds = new Set<number>()
  for (const item of remainingItems) {
    styleIds.add(item.style_id)
    const key = `${item.style_id}_${item.color_key}`
    qtyMap.set(key, (qtyMap.get(key) || 0) + item.quantity)
  }

  const result: CalcEntry[] = []

  for (const style of calcData) {
    if (!styleIds.has(style.style_id)) continue

    const adjustedCalcs: CalcEntry['calculations'] = []

    for (const calc of style.calculations) {
      const breakdowns = calc.color_breakdown
      if (breakdowns && breakdowns.length > 0) {
        const adjustedBreakdowns: ColorBreakdown[] = []
        let calcTotalMeters = 0

        for (const cb of breakdowns) {
          const colorId = (cb as Record<string, unknown>).color_id as number | undefined
          if (colorId == null) {
            adjustedBreakdowns.push(cb)
            calcTotalMeters += cb.total_meters || 0
            continue
          }
          const key = `${style.style_id}_${colorId}`
          const newQty = qtyMap.get(key)
          if (newQty == null || newQty <= 0) continue

          const mpu = (cb as Record<string, unknown>).meters_per_unit as number | undefined
          const newMeters = mpu ? newQty * mpu : cb.total_meters
          adjustedBreakdowns.push({ ...cb, quantity: newQty, total_meters: newMeters })
          calcTotalMeters += newMeters
        }

        if (adjustedBreakdowns.length > 0) {
          adjustedCalcs.push({ ...calc, color_breakdown: adjustedBreakdowns, total_meters: calcTotalMeters })
        }
      } else {
        adjustedCalcs.push(calc)
      }
    }

    if (adjustedCalcs.length > 0) {
      let styleTotalQty = 0
      const seen = new Set<number>()
      for (const [k, v] of qtyMap) {
        if (k.startsWith(`${style.style_id}_`)) {
          const cid = parseInt(k.split('_')[1])
          if (!seen.has(cid)) { seen.add(cid); styleTotalQty += v }
        }
      }
      result.push({ ...style, calculations: adjustedCalcs, total_quantity: styleTotalQty } as CalcEntry)
    }
  }

  return result
}
