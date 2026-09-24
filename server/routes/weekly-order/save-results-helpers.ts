import type { PoolClient } from 'pg'
import { runOn } from '../../db/query'

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

export async function syncDeliveries(
  weekId: number,
  summaryRows: SummaryRow[],
  client?: PoolClient,
): Promise<void> {
  const existingDeliveries = await runOn<{
    id: number
    thread_type_id: number
    supplier_id: number | null
    delivery_date: string
    status: string
    received_quantity: number | null
    quantity_cones: number | null
    thread_color: string | null
  }>(
    client,
    `SELECT id, thread_type_id, supplier_id, delivery_date, status, received_quantity, quantity_cones, thread_color
     FROM thread_order_deliveries WHERE week_id = $1 LIMIT 500000`,
    [weekId],
  )

  type DesiredDelivery = {
    week_id: number; thread_type_id: number; supplier_id: number
    delivery_date: string; status: 'PENDING'; quantity_cones: number
    thread_color: string | null; thread_color_code: string | null
  }

  const desiredDeliveryMap = new Map<string, DesiredDelivery>()
  const buildDeliveryKey = (row: { thread_type_id: number; thread_color?: string | null; supplier_id?: number | null }) =>
    `${row.thread_type_id}_${row.thread_color ?? ''}_${row.supplier_id ?? ''}`

  for (const row of summaryRows) {
    const plannedCones = row.total_final ?? row.total_cones ?? 0
    if (!row.supplier_id || plannedCones < 1) continue

    const compositeKey = buildDeliveryKey(row)

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
      buildDeliveryKey(d))
  )

  const newDeliveryRows = desiredDeliveryRows
    .filter((row) => !existingCompositeKeys.has(buildDeliveryKey(row)))

  if (newDeliveryRows.length > 0) {
    for (const row of newDeliveryRows) {
      console.info(`[saveResults] Creating delivery for week=${weekId} thread_type=${row.thread_type_id} color=${row.thread_color}: quantity_cones=${row.quantity_cones}`)
    }

    try {
      const cols = ['week_id', 'thread_type_id', 'supplier_id', 'delivery_date', 'status', 'quantity_cones', 'thread_color', 'thread_color_code']
      const params: unknown[] = []
      const valueClauses = newDeliveryRows.map((row) => {
        const rowVals = [row.week_id, row.thread_type_id, row.supplier_id, row.delivery_date, row.status, row.quantity_cones, row.thread_color, row.thread_color_code]
        const placeholders = rowVals.map((v) => {
          params.push(v)
          return `$${params.length}`
        })
        return `(${placeholders.join(', ')})`
      })
      await runOn(
        client,
        `INSERT INTO thread_order_deliveries (${cols.join(', ')}) VALUES ${valueClauses.join(', ')}`,
        params,
      )
    } catch (deliveryError) {
      console.warn('Error creating delivery records:', deliveryError)

      if (client) throw deliveryError
    }
  }

  type ExistingDelivery = {
    id: number; thread_type_id: number; supplier_id: number | null
    delivery_date: string; status: string; received_quantity: number | null
    quantity_cones: number | null; thread_color?: string | null
  }

  const existingByCompositeKey = new Map(
    (existingDeliveries || []).map((row: ExistingDelivery) =>
      [buildDeliveryKey(row), row])
  )

  const rowsToSync = desiredDeliveryRows.filter((row) => {
    const key = buildDeliveryKey(row)
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
      const key = buildDeliveryKey(row)
      const existing = existingByCompositeKey.get(key)
      if (!existing) continue

      console.info(`[saveResults] Syncing delivery for week=${weekId} thread_type=${row.thread_type_id} color=${row.thread_color}: quantity_cones ${existing.quantity_cones ?? 0} -> ${row.quantity_cones}`)

      try {
        await runOn(
          client,
          `UPDATE thread_order_deliveries
           SET supplier_id = $1, quantity_cones = $2, thread_color = $3, thread_color_code = $4, updated_at = $5
           WHERE id = $6`,
          [row.supplier_id, row.quantity_cones, row.thread_color, row.thread_color_code, nowIso, existing.id],
        )
      } catch (syncError) {
        console.warn('Error syncing existing pending delivery row:', syncError)

        if (client) throw syncError
      }
    }
  }

  const desiredKeys = new Set(desiredDeliveryMap.keys())
  const orphanIds: number[] = []
  for (const delivery of (existingDeliveries || []) as ExistingDelivery[]) {
    const key = buildDeliveryKey(delivery)
    if (desiredKeys.has(key)) continue
    if (delivery.status !== 'PENDING') continue
    if (delivery.received_quantity != null && delivery.received_quantity > 0) continue
    orphanIds.push(delivery.id)
    console.info(`[saveResults] Orphan delivery found: week=${weekId} thread_type=${delivery.thread_type_id} color=${delivery.thread_color ?? ''} — will delete`)
  }

  if (orphanIds.length > 0) {
    try {
      await runOn(
        client,
        `DELETE FROM thread_order_deliveries WHERE id = ANY($1)`,
        [orphanIds],
      )
      console.info(`[saveResults] Deleted ${orphanIds.length} orphan PENDING deliveries for week=${weekId}`)
    } catch (orphanError) {
      console.warn('Error deleting orphan deliveries:', orphanError)

      if (client) throw orphanError
    }
  }
}

