import { SupabaseClient } from '@supabase/supabase-js'

type SummaryRow = {
  thread_type_id: number
  supplier_id?: number | null
  delivery_date?: string | null
  lead_time_days?: number | null
  total_final?: number | null
  total_cones?: number | null
  thread_color?: string | null
  thread_color_code?: string | null
  [key: string]: unknown
}

type CalculationResult = {
  style_id: number
  style_code: string
  style_name: string
  calculations: Array<{
    spec_id: number
    process_name: string
    shortage_cones?: number
    is_fully_stocked?: boolean
    meters_per_cone?: number | null
    color_breakdown?: Array<{
      thread_type_id: number
      color_name: string
      total_meters: number
    }>
  }>
}

export async function syncDeliveries(
  supabase: SupabaseClient,
  weekId: number,
  summaryRows: SummaryRow[],
): Promise<void> {
  const { data: existingDeliveries } = await supabase
    .from('thread_order_deliveries')
    .select('id, thread_type_id, supplier_id, delivery_date, status, received_quantity, quantity_cones, thread_color')
    .eq('week_id', weekId)
    .limit(500000)

  type DesiredDelivery = {
    week_id: number; thread_type_id: number; supplier_id: number
    delivery_date: string; status: 'PENDING'; quantity_cones: number
    thread_color: string | null; thread_color_code: string | null
  }

  const desiredDeliveryMap = new Map<string, DesiredDelivery>()

  for (const row of summaryRows) {
    const plannedCones = row.total_final ?? row.total_cones ?? 0
    if (!row.supplier_id || plannedCones < 1) continue

    const compositeKey = `${row.thread_type_id}_${row.thread_color ?? ''}`

    if (!desiredDeliveryMap.has(compositeKey)) {
      const leadTime = (row.lead_time_days && row.lead_time_days > 0) ? row.lead_time_days : 7
      const deliveryDate = row.delivery_date || (() => {
        const d = new Date()
        d.setDate(d.getDate() + leadTime)
        return d.toISOString().split('T')[0]
      })()

      desiredDeliveryMap.set(compositeKey, {
        week_id: weekId,
        thread_type_id: row.thread_type_id,
        supplier_id: row.supplier_id!,
        delivery_date: deliveryDate,
        status: 'PENDING',
        quantity_cones: plannedCones,
        thread_color: row.thread_color ?? null,
        thread_color_code: row.thread_color_code ?? null,
      })
    } else {
      const existing = desiredDeliveryMap.get(compositeKey)!
      existing.quantity_cones += plannedCones
    }
  }

  const desiredDeliveryRows = Array.from(desiredDeliveryMap.values())
  const existingCompositeKeys = new Set(
    (existingDeliveries || []).map((d: { thread_type_id: number; thread_color?: string | null }) =>
      `${d.thread_type_id}_${d.thread_color ?? ''}`)
  )

  const newDeliveryRows = desiredDeliveryRows
    .filter((row) => !existingCompositeKeys.has(`${row.thread_type_id}_${row.thread_color ?? ''}`))

  if (newDeliveryRows.length > 0) {
    for (const row of newDeliveryRows) {
      console.info(`[saveResults] Creating delivery for week=${weekId} thread_type=${row.thread_type_id} color=${row.thread_color}: quantity_cones=${row.quantity_cones}`)
    }

    const { error: deliveryError } = await supabase
      .from('thread_order_deliveries')
      .insert(newDeliveryRows)

    if (deliveryError) {
      console.warn('Error creating delivery records:', deliveryError)
    }
  }

  type ExistingDelivery = {
    id: number; thread_type_id: number; supplier_id: number | null
    delivery_date: string; status: string; received_quantity: number | null
    quantity_cones: number | null; thread_color?: string | null
  }

  const existingByCompositeKey = new Map(
    (existingDeliveries || []).map((row: ExistingDelivery) =>
      [`${row.thread_type_id}_${row.thread_color ?? ''}`, row])
  )

  const rowsToSync = desiredDeliveryRows.filter((row) => {
    const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
    const existing = existingByCompositeKey.get(key)
    if (!existing) return false
    if (existing.status !== 'PENDING') return false
    if ((existing.received_quantity || 0) > 0) return false

    const sameSupplier = (existing.supplier_id ?? null) === (row.supplier_id ?? null)
    const sameQuantity = (existing.quantity_cones ?? 0) === row.quantity_cones
    return !(sameSupplier && sameQuantity)
  })

  if (rowsToSync.length > 0) {
    const nowIso = new Date().toISOString()
    for (const row of rowsToSync) {
      const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
      const existing = existingByCompositeKey.get(key)
      if (!existing) continue

      console.info(`[saveResults] Syncing delivery for week=${weekId} thread_type=${row.thread_type_id} color=${row.thread_color}: quantity_cones ${existing.quantity_cones ?? 0} -> ${row.quantity_cones}`)

      const { error: syncError } = await supabase
        .from('thread_order_deliveries')
        .update({
          supplier_id: row.supplier_id,
          quantity_cones: row.quantity_cones,
          thread_color: row.thread_color,
          thread_color_code: row.thread_color_code,
          updated_at: nowIso,
        })
        .eq('id', existing.id)

      if (syncError) {
        console.warn('Error syncing existing pending delivery row:', syncError)
      }
    }
  }
}

export async function createAllocations(
  supabase: SupabaseClient,
  weekId: number,
  calculationData: CalculationResult[],
): Promise<void> {
  const allocationRows: Array<{
    order_id: string; order_reference: string; thread_type_id: number
    requested_meters: number; priority: string; status: string
  }> = []

  for (const result of calculationData) {
    for (const calc of result.calculations) {
      if (calc.is_fully_stocked === true) continue

      const shortageCones = calc.shortage_cones || 0
      if (shortageCones <= 0) continue

      const metersPerCone = calc.meters_per_cone || 0
      if (metersPerCone <= 0) continue

      if (calc.color_breakdown && calc.color_breakdown.length > 0) {
        const threadTypeMap = new Map<number, number>()
        for (const cb of calc.color_breakdown) {
          const cbNeededCones = Math.ceil(cb.total_meters / metersPerCone)
          const current = threadTypeMap.get(cb.thread_type_id) || 0
          threadTypeMap.set(cb.thread_type_id, current + cbNeededCones)
        }

        for (const [threadTypeId, neededCones] of threadTypeMap) {
          const totalCones = [...threadTypeMap.values()].reduce((a, b) => a + b, 0)
          const shortageForThisType = Math.ceil((shortageCones / totalCones) * neededCones)

          if (shortageForThisType > 0) {
            allocationRows.push({
              order_id: `WO-${weekId}-${result.style_code}-${calc.spec_id}`,
              order_reference: `Tuần ${weekId} - ${result.style_name} - ${calc.process_name}`,
              thread_type_id: threadTypeId,
              requested_meters: shortageForThisType * metersPerCone,
              priority: 'NORMAL',
              status: 'PENDING',
              week_id: weekId,
            } as any)
          }
        }
      }
    }
  }

  if (allocationRows.length > 0) {
    const { error: allocError } = await supabase
      .from('thread_allocations')
      .insert(allocationRows)

    if (allocError) {
      console.warn('Error creating allocation records:', allocError)
    }
  }
}
