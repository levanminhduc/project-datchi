/**
 * Weekly Order Calculation Composable
 *
 * Manages multi-style selection, parallel calculation, and aggregation
 * for weekly thread ordering. Supports PO → Style → Color flow.
 */

import { ref, computed, reactive } from 'vue'
import { threadCalculationService } from '@/services/threadCalculationService'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import type {
  StyleOrderEntry,
  AggregatedRow,
  ThreadOrderItem,
  CalculationResult,
  CalculationInput,
} from '@/types/thread'

/**
 * Generate a unique key for an order entry (po_id + style_id)
 */
function entryKey(poId: number | null, styleId: number): string {
  return `${poId ?? 'null'}_${styleId}`
}

export function useWeeklyOrderCalculation() {
  // State
  const orderEntries = ref<StyleOrderEntry[]>([])
  const perStyleResults = ref<CalculationResult[]>([])
  const aggregatedResults = ref<AggregatedRow[]>([])
  const isCalculating = ref(false)
  const calculationProgress = ref({ current: 0, total: 0 })
  const calculationErrors = ref<
    Array<{ style_id: number; style_code: string; error: string }>
  >([])
  const lastCalculatedAt = ref<number | null>(null)
  const lastModifiedAt = ref<number | null>(null)

  // Delivery date overrides: spec_id → YYYY-MM-DD string
  const deliveryDateOverrides = reactive(new Map<number, string>())

  // Computed
  const canCalculate = computed(() => {
    return orderEntries.value.some((entry) =>
      entry.colors.some((c) => c.quantity > 0)
    )
  })

  const hasResults = computed(() => perStyleResults.value.length > 0)

  const isResultsStale = computed(() => {
    return (
      lastModifiedAt.value !== null &&
      lastCalculatedAt.value !== null &&
      lastModifiedAt.value > lastCalculatedAt.value
    )
  })

  /**
   * Add a style to orderEntries (with PO context)
   */
  const addStyle = (style: {
    id: number
    style_code: string
    style_name: string
    po_id?: number | null
    po_number?: string
  }) => {
    const poId = style.po_id ?? null
    const key = entryKey(poId, style.id)
    const exists = orderEntries.value.some(
      (e) => entryKey(e.po_id, e.style_id) === key
    )
    if (exists) return

    orderEntries.value.push({
      po_id: poId,
      po_number: style.po_number || '',
      style_id: style.id,
      style_code: style.style_code,
      style_name: style.style_name,
      colors: [],
    })
    lastModifiedAt.value = Date.now()
  }

  /**
   * Remove a style from orderEntries by po_id + style_id
   */
  const removeStyle = (styleId: number, poId?: number | null) => {
    const targetPoId = poId ?? null
    orderEntries.value = orderEntries.value.filter(
      (e) => !(e.style_id === styleId && e.po_id === targetPoId)
    )
    lastModifiedAt.value = Date.now()
  }

  /**
   * Remove all entries for a specific PO
   */
  const removePO = (poId: number) => {
    orderEntries.value = orderEntries.value.filter((e) => e.po_id !== poId)
    lastModifiedAt.value = Date.now()
  }

  /**
   * Add a color to a style entry with default quantity 1
   */
  const addColorToStyle = (
    styleId: number,
    color: { color_id: number; color_name: string; hex_code: string },
    poId?: number | null,
  ) => {
    const targetPoId = poId ?? null
    const entry = orderEntries.value.find(
      (e) => e.style_id === styleId && e.po_id === targetPoId
    )
    if (!entry) return

    const colorExists = entry.colors.some((c) => c.color_id === color.color_id)
    if (colorExists) return

    entry.colors.push({
      color_id: color.color_id,
      color_name: color.color_name,
      hex_code: color.hex_code,
      quantity: 1,
    })
    lastModifiedAt.value = Date.now()
  }

  /**
   * Remove a color from a style entry
   */
  const removeColorFromStyle = (styleId: number, colorId: number, poId?: number | null) => {
    const targetPoId = poId ?? null
    const entry = orderEntries.value.find(
      (e) => e.style_id === styleId && e.po_id === targetPoId
    )
    if (!entry) return

    entry.colors = entry.colors.filter((c) => c.color_id !== colorId)
    lastModifiedAt.value = Date.now()
  }

  /**
   * Update the quantity for a specific color in a style entry
   */
  const updateColorQuantity = (
    styleId: number,
    colorId: number,
    qty: number,
    poId?: number | null,
  ) => {
    const targetPoId = poId ?? null
    const entry = orderEntries.value.find(
      (e) => e.style_id === styleId && e.po_id === targetPoId
    )
    if (!entry) return

    const color = entry.colors.find((c) => c.color_id === colorId)
    if (!color) return

    color.quantity = qty
    lastModifiedAt.value = Date.now()
  }

  /**
   * Aggregate per-style calculation results into a combined summary keyed by thread_type_id
   */
  const aggregateResults = (results: CalculationResult[]) => {
    const map = new Map<number, AggregatedRow>()

    for (const result of results) {
      for (const calc of result.calculations) {
        if (calc.color_breakdown) {
          for (const cb of calc.color_breakdown) {
            const existing = map.get(cb.thread_type_id)

            if (existing) {
              existing.total_meters += cb.total_meters
            } else {
              map.set(cb.thread_type_id, {
                thread_type_id: cb.thread_type_id,
                thread_type_name: cb.thread_type_name,
                supplier_name: calc.supplier_name,
                tex_number: calc.tex_number,
                total_meters: cb.total_meters,
                total_cones: 0,
                meters_per_cone: calc.meters_per_cone ?? null,
                thread_color: calc.thread_color ?? null,
                thread_color_code: calc.thread_color_code ?? null,
                supplier_id: calc.supplier_id ?? null,
                delivery_date: calc.delivery_date ?? null,
                lead_time_days: calc.lead_time_days ?? null,
              })
            }
          }
        } else {
          // No color_breakdown -- aggregate by spec-level data
          const key = calc.spec_id
          const existing = map.get(key)

          if (existing) {
            existing.total_meters += calc.total_meters
          } else {
            map.set(key, {
              thread_type_id: key,
              thread_type_name: calc.process_name,
              supplier_name: calc.supplier_name,
              tex_number: calc.tex_number,
              total_meters: calc.total_meters,
              total_cones: 0,
              meters_per_cone: calc.meters_per_cone ?? null,
              thread_color: calc.thread_color ?? null,
              thread_color_code: calc.thread_color_code ?? null,
              supplier_id: calc.supplier_id ?? null,
              delivery_date: calc.delivery_date ?? null,
              lead_time_days: calc.lead_time_days ?? null,
            })
          }
        }
      }
    }

    // Recalculate total_cones for each aggregated row
    for (const row of map.values()) {
      if (row.meters_per_cone && row.meters_per_cone > 0) {
        row.total_cones = Math.ceil(row.total_meters / row.meters_per_cone)
      } else {
        row.total_cones = 0
      }
    }

    aggregatedResults.value = Array.from(map.values())
  }

  /**
   * Build CalculationInput array from valid order entries
   * Deduplicates by style_id (same style across multiple POs combines quantities)
   */
  const buildBatchInputs = (entries: StyleOrderEntry[]) => {
    // Group by style_id to combine colors from same style across POs
    const styleMap = new Map<number, { entry: StyleOrderEntry; colors: Map<number, number> }>()

    for (const entry of entries) {
      if (!styleMap.has(entry.style_id)) {
        styleMap.set(entry.style_id, { entry, colors: new Map() })
      }
      const group = styleMap.get(entry.style_id)!
      for (const c of entry.colors) {
        if (c.quantity > 0) {
          group.colors.set(c.color_id, (group.colors.get(c.color_id) || 0) + c.quantity)
        }
      }
    }

    return Array.from(styleMap.values()).map(({ entry, colors }) => {
      const totalQty = Array.from(colors.values()).reduce((sum, q) => sum + q, 0)
      return {
        input: {
          style_id: entry.style_id,
          quantity: totalQty,
          color_breakdown: Array.from(colors.entries()).map(([color_id, quantity]) => ({
            color_id,
            quantity,
          })),
        } as CalculationInput,
        entry,
      }
    })
  }

  /**
   * Fallback: Run calculations using N parallel individual requests
   */
  const calculateAllFallback = async (
    batchItems: { input: CalculationInput; entry: StyleOrderEntry }[]
  ) => {
    const promises = batchItems.map(({ input, entry }) =>
      threadCalculationService
        .calculate(input)
        .then((result) => {
          calculationProgress.value = {
            ...calculationProgress.value,
            current: calculationProgress.value.current + 1,
          }
          return { status: 'fulfilled' as const, value: result, entry }
        })
        .catch((err: unknown) => {
          calculationProgress.value = {
            ...calculationProgress.value,
            current: calculationProgress.value.current + 1,
          }
          return {
            status: 'rejected' as const,
            reason: err instanceof Error ? err.message : 'Lỗi không xác định',
            entry,
          }
        })
    )

    const settled = await Promise.all(promises)

    const successResults: CalculationResult[] = []
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        successResults.push(result.value)
      } else {
        calculationErrors.value.push({
          style_id: result.entry.style_id,
          style_code: result.entry.style_code,
          error: result.reason,
        })
      }
    }

    return successResults
  }

  /**
   * Run calculations for all style entries using batch endpoint (1 request)
   * Falls back to N parallel requests if batch fails
   */
  const calculateAll = async () => {
    isCalculating.value = true
    calculationErrors.value = []
    perStyleResults.value = []
    deliveryDateOverrides.clear()

    // Filter entries that have at least one color with qty > 0
    const validEntries = orderEntries.value.filter((entry) =>
      entry.colors.some((c) => c.quantity > 0)
    )

    const batchItems = buildBatchInputs(validEntries)
    calculationProgress.value = { current: 0, total: batchItems.length }

    let successResults: CalculationResult[]

    try {
      // Try batch endpoint (1 request instead of N)
      const batchInputs = batchItems.map(({ input }) => input)
      const results = await threadCalculationService.calculateBatch(batchInputs)

      // Match results back to entries for error reporting on missing styles
      const resultStyleIds = new Set(results.map((r) => r.style_id))
      for (const { entry } of batchItems) {
        if (!resultStyleIds.has(entry.style_id)) {
          calculationErrors.value.push({
            style_id: entry.style_id,
            style_code: entry.style_code,
            error: 'Mã hàng chưa có định mức chỉ',
          })
        }
      }

      calculationProgress.value = {
        current: batchItems.length,
        total: batchItems.length,
      }
      successResults = results
    } catch {
      // Batch endpoint failed — fallback to N parallel requests
      calculationProgress.value = { current: 0, total: batchItems.length }
      successResults = await calculateAllFallback(batchItems)
    }

    perStyleResults.value = successResults
    aggregateResults(successResults)

    // Enrich with inventory data
    try {
      const enriched = await weeklyOrderService.enrichInventory(aggregatedResults.value)
      aggregatedResults.value = enriched
    } catch (err) {
      console.warn('[weekly-order] enrich inventory failed, using unenriched data:', err)
    }

    lastCalculatedAt.value = Date.now()
    isCalculating.value = false
  }

  /**
   * Reset all state to initial values
   */
  const clearAll = () => {
    orderEntries.value = []
    perStyleResults.value = []
    aggregatedResults.value = []
    isCalculating.value = false
    calculationProgress.value = { current: 0, total: 0 }
    calculationErrors.value = []
    lastCalculatedAt.value = null
    lastModifiedAt.value = null
    deliveryDateOverrides.clear()
  }

  /**
   * Populate orderEntries from saved ThreadOrderItems (for loading from history)
   */
  const setFromWeekItems = (items: ThreadOrderItem[]) => {
    const entryMap = new Map<string, StyleOrderEntry>()

    for (const item of items) {
      const poId = item.po_id ?? null
      const key = entryKey(poId, item.style_id)

      if (!entryMap.has(key)) {
        entryMap.set(key, {
          po_id: poId,
          po_number: item.po?.po_number || '',
          style_id: item.style_id,
          style_code: item.style?.style_code || `Style #${item.style_id}`,
          style_name: item.style?.style_name || '',
          colors: [],
        })
      }

      const entry = entryMap.get(key)!

      const colorExists = entry.colors.some((c) => c.color_id === item.color_id)
      if (!colorExists) {
        entry.colors.push({
          color_id: item.color_id,
          color_name: item.color?.name || `Color #${item.color_id}`,
          hex_code: item.color?.hex_code || '#000000',
          quantity: item.quantity,
        })
      }
    }

    orderEntries.value = Array.from(entryMap.values())
    lastModifiedAt.value = Date.now()
    lastCalculatedAt.value = null
  }

  const updateAdditionalOrder = (threadTypeId: number, value: number) => {
    const row = aggregatedResults.value.find((r) => r.thread_type_id === threadTypeId)
    if (!row) return
    row.additional_order = value
    row.total_final = (row.sl_can_dat || 0) + value
  }

  /**
   * Update a delivery date override for a specific spec_id
   */
  const updateDeliveryDate = (specId: number, date: string) => {
    deliveryDateOverrides.set(specId, date)
  }

  /**
   * Merge delivery date overrides into perStyleResults and aggregatedResults.
   * Call before saving to persist edited dates.
   */
  const mergeDeliveryDateOverrides = () => {
    if (deliveryDateOverrides.size === 0) return

    for (const result of perStyleResults.value) {
      for (const calc of result.calculations) {
        const override = deliveryDateOverrides.get(calc.spec_id)
        if (override) {
          calc.delivery_date = override
        }
      }
    }

    // Also update aggregated results if they have delivery_date
    for (const row of aggregatedResults.value) {
      const aggRow = row as AggregatedRow & { delivery_date?: string | null; spec_id?: number }
      if (aggRow.spec_id && deliveryDateOverrides.has(aggRow.spec_id)) {
        aggRow.delivery_date = deliveryDateOverrides.get(aggRow.spec_id)!
      }
    }

    deliveryDateOverrides.clear()
  }

  return {
    // State
    orderEntries,
    perStyleResults,
    aggregatedResults,
    isCalculating,
    calculationProgress,
    calculationErrors,
    lastCalculatedAt,
    lastModifiedAt,
    deliveryDateOverrides,

    // Computed
    canCalculate,
    hasResults,
    isResultsStale,

    // Actions
    addStyle,
    removeStyle,
    removePO,
    addColorToStyle,
    removeColorFromStyle,
    updateColorQuantity,
    calculateAll,
    aggregateResults,
    updateAdditionalOrder,
    updateDeliveryDate,
    mergeDeliveryDateOverrides,
    clearAll,
    setFromWeekItems,
  }
}
